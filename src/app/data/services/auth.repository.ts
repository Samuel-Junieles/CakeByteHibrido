import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { supabaseClient } from '../../core/supabase/supabase.client';
import { ProfileDto, UserEntity, UserRole } from '../../domain/models/models';
import { PhotoService } from './photo.service';

@Injectable({
  providedIn: 'root',
})
export class AuthRepository {
  private readonly SESSION_EMAIL_KEY = 'cakebyte_active_email';

  private currentUserSubject = new BehaviorSubject<UserEntity | null>(null);
  public currentUser$: Observable<UserEntity | null> = this.currentUserSubject.asObservable();

  private rolesMap = new Map<number, UserRole>();

  constructor(private photoService: PhotoService) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadRolesFromDb();
    await this.restoreSession();
  }

  get currentUserValue(): UserEntity | null {
    return this.currentUserSubject.value;
  }

  /**
   * Carga los roles directamente desde la tabla 'roles' en Supabase
   */
  async loadRolesFromDb(): Promise<void> {
    const { data } = await supabaseClient.from('roles').select('id, nombre');
    if (data && data.length > 0) {
      for (const r of data) {
        this.rolesMap.set(Number(r.id), r.nombre as UserRole);
      }
    }
  }

  private mapRolIdToRole(rolId?: number | null): UserRole {
    if (rolId && this.rolesMap.has(rolId)) {
      return this.rolesMap.get(rolId)!;
    }
    switch (rolId) {
      case 1:
        return 'Admin';
      case 2:
        return 'Vendedor';
      default:
        return 'Comprador';
    }
  }

  private mapRoleToRolId(role: UserRole | string): number {
    for (const [id, name] of this.rolesMap.entries()) {
      if (name.toLowerCase() === role.toLowerCase()) {
        return id;
      }
    }
    switch (role) {
      case 'Admin':
        return 1;
      case 'Vendedor':
        return 2;
      default:
        return 3;
    }
  }

  async restoreSession(): Promise<UserEntity | null> {
    try {
      const { data } = await supabaseClient.auth.getUser();
      if (data?.user?.email) {
        const profile = await this.getUserByEmail(data.user.email);
        if (profile) {
          this.currentUserSubject.next(profile);
          await Preferences.set({ key: this.SESSION_EMAIL_KEY, value: profile.email });
          return profile;
        }
      }

      const saved = await Preferences.get({ key: this.SESSION_EMAIL_KEY });
      if (saved.value) {
        const refreshed = await this.getUserByEmail(saved.value);
        if (refreshed) {
          this.currentUserSubject.next(refreshed);
          return refreshed;
        }
      }
    } catch (e) {
      console.warn('Error restaurando sesión desde BD:', e);
    }
    return null;
  }

  async login(email: string, pass: String): Promise<{ user?: UserEntity; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await this.loadRolesFromDb();

      const { error: authError } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: pass.toString(),
      });

      const { data: dbRow } = await supabaseClient
        .from('usuarios')
        .select('*')
        .ilike('correo', cleanEmail)
        .maybeSingle();

      if (authError && !dbRow) {
        return { error: 'Credenciales incorrectas o usuario no registrado en la base de datos.' };
      }

      if (authError && dbRow && dbRow.contrasena && dbRow.contrasena !== pass.toString()) {
        return { error: 'La contraseña ingresada es incorrecta.' };
      }

      const user = await this.getUserByEmail(cleanEmail);
      if (!user) {
        return { error: 'El usuario no existe en la tabla usuarios de la base de datos.' };
      }

      this.currentUserSubject.next(user);
      await Preferences.set({ key: this.SESSION_EMAIL_KEY, value: user.email });
      return { user };
    } catch (err: any) {
      return { error: err?.message || 'Error al iniciar sesión' };
    }
  }

  async register(
    email: string,
    pass: string,
    fullName: string,
    role: UserRole = 'Comprador',
    autoLogin = true
  ): Promise<{ user?: UserEntity; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const parts = fullName.trim().split(/\s+/);
    const nombres = parts[0] || fullName.trim();
    const apellidos = parts.length > 1 ? parts.slice(1).join(' ') : '';

    try {
      await this.loadRolesFromDb();

      const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password: pass,
      });

      if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
        console.warn('Aviso Auth signUp:', signUpError.message);
      }

      const payload: Record<string, any> = {
        nombres,
        apellidos,
        correo: cleanEmail,
        contrasena: pass,
        rol_id: this.mapRoleToRolId(role),
      };

      if (authData?.user?.id) {
        payload['id'] = authData.user.id;
      }

      const { error: dbError } = await supabaseClient
        .from('usuarios')
        .upsert(payload, { onConflict: 'correo' });

      if (dbError) {
        return { error: dbError.message };
      }

      const createdUser = await this.getUserByEmail(cleanEmail);
      if (!createdUser) {
        return { error: 'Error al consultar el usuario recién creado en la BD.' };
      }

      if (autoLogin) {
        this.currentUserSubject.next(createdUser);
        await Preferences.set({ key: this.SESSION_EMAIL_KEY, value: createdUser.email });
      }

      return { user: createdUser };
    } catch (err: any) {
      return { error: err?.message || 'No se pudo completar el registro' };
    }
  }

  async getAllUsers(): Promise<UserEntity[]> {
    await this.loadRolesFromDb();
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    const users: UserEntity[] = [];
    for (const row of data as any[]) {
      const localAvatar = await this.photoService.getUserProfilePhoto(row.correo);
      users.push({
        id: row.id,
        email: row.correo,
        name: `${row.nombres || ''} ${row.apellidos || ''}`.trim() || row.correo,
        role: this.mapRolIdToRole(row.rol_id),
        address: row.direccion || '',
        phone: row.telefono || '',
        avatarUrl: row.foto_perfil || localAvatar || undefined,
        createdAt: row.created_at,
      });
    }
    return users;
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    if (!email) return null;
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .ilike('correo', email.trim())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as any;
    const localAvatar = await this.photoService.getUserProfilePhoto(row.correo);

    return {
      id: row.id,
      email: row.correo,
      name: `${row.nombres || ''} ${row.apellidos || ''}`.trim() || row.correo,
      role: this.mapRolIdToRole(row.rol_id),
      address: row.direccion || '',
      phone: row.telefono || '',
      avatarUrl: row.foto_perfil || localAvatar || undefined,
      createdAt: row.created_at,
    };
  }

  async updateUser(user: UserEntity): Promise<{ success: boolean; error?: string }> {
    const parts = user.name.trim().split(/\s+/);
    const nombres = parts[0] || user.name.trim();
    const apellidos = parts.length > 1 ? parts.slice(1).join(' ') : '';

    // Intentar actualizar incluyendo direccion, telefono y foto_perfil si las columnas existen en la BD
    const extendedPayload: Record<string, any> = {
      nombres,
      apellidos,
      rol_id: this.mapRoleToRolId(user.role),
      direccion: user.address || '',
      telefono: user.phone || '',
    };
    if (user.avatarUrl) {
      extendedPayload['foto_perfil'] = user.avatarUrl;
    }

    let { error } = await supabaseClient
      .from('usuarios')
      .update(extendedPayload)
      .ilike('correo', user.email);

    // Si la BD aún no tiene las columnas opcionales (direccion/telefono/foto_perfil), actualiza las columnas base
    if (error) {
      const fallback = await supabaseClient
        .from('usuarios')
        .update({
          nombres,
          apellidos,
          rol_id: this.mapRoleToRolId(user.role),
        })
        .ilike('correo', user.email);
      error = fallback.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    if (user.avatarUrl) {
      await this.photoService.saveUserProfilePhoto(user.email, user.avatarUrl);
    }

    const current = this.currentUserSubject.value;
    if (current && current.email.toLowerCase() === user.email.toLowerCase()) {
      const updated = await this.getUserByEmail(user.email);
      if (updated) {
        this.currentUserSubject.next(updated);
      }
    }

    return { success: true };
  }

  async updateProfilePhoto(email: string, dataUrl: string): Promise<void> {
    // Guardar en la tabla usuarios de la BD si existe la columna foto_perfil
    await supabaseClient
      .from('usuarios')
      .update({ foto_perfil: dataUrl })
      .ilike('correo', email);

    await this.photoService.saveUserProfilePhoto(email, dataUrl);
    const current = this.currentUserSubject.value;
    if (current && current.email.toLowerCase() === email.toLowerCase()) {
      const updated = await this.getUserByEmail(email);
      if (updated) {
        this.currentUserSubject.next({ ...updated, avatarUrl: dataUrl });
      }
    }
  }

  async deleteUser(email: string): Promise<boolean> {
    const { error } = await supabaseClient.from('usuarios').delete().ilike('correo', email);
    return !error;
  }

  async logout(): Promise<void> {
    try {
      await supabaseClient.auth.signOut();
    } catch {
      // Ignorar si no había sesión activa
    }
    await Preferences.remove({ key: this.SESSION_EMAIL_KEY });
    this.currentUserSubject.next(null);
  }
}
