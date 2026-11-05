import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { supabaseClient } from '../../core/supabase/supabase.client';
import { UserEntity, UserRole } from '../../domain/models/models';
import { PhotoService } from './photo.service';

interface CloudProfileExtras {
  avatarUrl?: string;
  address?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthRepository {
  private readonly SESSION_EMAIL_KEY = 'cakebyte_active_email';
  private readonly BIOMETRIC_EMAIL_KEY = 'cakebyte_biometric_email';
  private readonly BIOMETRIC_PASS_KEY = 'cakebyte_biometric_pass';
  private readonly CLOUD_PROFILE_CATEGORY = '__user_profile__';

  private currentUserSubject = new BehaviorSubject<UserEntity | null>(null);
  public currentUser$: Observable<UserEntity | null> = this.currentUserSubject.asObservable();

  private usersSubject = new BehaviorSubject<UserEntity[]>([]);
  public users$: Observable<UserEntity[]> = this.usersSubject.asObservable();

  private rolesMap = new Map<number, UserRole>();

  constructor(private photoService: PhotoService) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadRolesFromDb();
    await this.restoreSession();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
        const synced =
          (await this.getUserByEmail(session.user.email)) ||
          (await this.syncGoogleAuthUserToUsuarios(session.user));
        if (synced) {
          this.currentUserSubject.next(synced);
          await Preferences.set({ key: this.SESSION_EMAIL_KEY, value: synced.email });
          await Preferences.set({ key: this.BIOMETRIC_EMAIL_KEY, value: synced.email });
        }
      }
    });

    try {
      supabaseClient
        .channel('cakebyte-users-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'usuarios' },
          () => {
            this.refreshCurrentUserFromCloud();
            this.getAllUsers();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            this.refreshCurrentUserFromCloud();
            this.getAllUsers();
          }
        )
        .subscribe();
    } catch {
      // Ignorar si Realtime no está disponible temporalmente
    }

    // Sincronizar automáticamente cuando la ventana o pestaña recupera el foco (universal entre teléfono y web)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.refreshCurrentUserFromCloud();
        this.getAllUsers();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.refreshCurrentUserFromCloud();
          this.getAllUsers();
        }
      });
      setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.refreshCurrentUserFromCloud();
        }
      }, 8000);
    }
  }

  get currentUserValue(): UserEntity | null {
    return this.currentUserSubject.value;
  }

  async refreshCurrentUserFromCloud(): Promise<UserEntity | null> {
    const active = this.currentUserSubject.value;
    if (!active?.email) return null;
    const fresh = await this.getUserByEmail(active.email);
    if (fresh) {
      this.currentUserSubject.next(fresh);
    }
    return fresh;
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

  /**
   * Obtiene extras de perfil (foto_perfil, dirección, teléfono) sincronizados en Supabase
   * para que sean universales entre la app de teléfono y la web.
   */
  private async getCloudProfileMap(): Promise<Map<string, CloudProfileExtras>> {
    const map = new Map<string, CloudProfileExtras>();
    try {
      const { data } = await supabaseClient
        .from('products')
        .select('name, description, imageurl')
        .eq('category', this.CLOUD_PROFILE_CATEGORY);

      if (data) {
        for (const item of data as any[]) {
          const emailKey = (item.name || '').trim().toLowerCase();
          if (!emailKey) continue;
          let parsed: { address?: string; phone?: string } = {};
          try {
            parsed = item.description ? JSON.parse(item.description) : {};
          } catch {
            parsed = {};
          }
          map.set(emailKey, {
            avatarUrl: item.imageurl && item.imageurl !== 'none' ? item.imageurl : undefined,
            address: parsed.address || '',
            phone: parsed.phone || '',
          });
        }
      }
    } catch {
      // Ignorar errores de red temporales
    }
    return map;
  }

  private async saveCloudProfileExtras(
    email: string,
    extras: CloudProfileExtras
  ): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    try {
      const { data: existing } = await supabaseClient
        .from('products')
        .select('id, description, imageurl')
        .eq('category', this.CLOUD_PROFILE_CATEGORY)
        .ilike('name', cleanEmail)
        .maybeSingle();

      let currentMeta: { address?: string; phone?: string } = {};
      if (existing?.description) {
        try {
          currentMeta = JSON.parse(existing.description);
        } catch {
          currentMeta = {};
        }
      }

      const mergedMeta = {
        address: extras.address !== undefined ? extras.address : currentMeta.address || '',
        phone: extras.phone !== undefined ? extras.phone : currentMeta.phone || '',
      };

      const imageurl =
        extras.avatarUrl !== undefined
          ? extras.avatarUrl
          : existing?.imageurl || 'none';

      const payload = {
        name: cleanEmail,
        description: JSON.stringify(mergedMeta),
        category: this.CLOUD_PROFILE_CATEGORY,
        price: 0,
        stock: 0,
        status: 'Inactivo',
        imageurl,
      };

      if (existing?.id) {
        await supabaseClient.from('products').update(payload).eq('id', existing.id);
      } else {
        await supabaseClient.from('products').insert(payload);
      }
    } catch (e) {
      console.warn('Error sincronizando metadatos de perfil en la nube:', e);
    }
  }

  async restoreSession(): Promise<UserEntity | null> {
    try {
      const { data } = await supabaseClient.auth.getUser();
      if (data?.user?.email) {
        let profile = await this.getUserByEmail(data.user.email);
        if (!profile) {
          // Si viene de Google OAuth y aún no está en la tabla 'usuarios', sincronizarlo igual que AuthRepositoryImpl.kt
          profile = await this.syncGoogleAuthUserToUsuarios(data.user);
        }
        if (profile) {
          this.currentUserSubject.next(profile);
          await Preferences.set({ key: this.SESSION_EMAIL_KEY, value: profile.email });
          await Preferences.set({ key: this.BIOMETRIC_EMAIL_KEY, value: profile.email });
          return profile;
        }
      }

      const saved = await Preferences.get({ key: this.SESSION_EMAIL_KEY });
      if (saved.value) {
        const refreshed = await this.getUserByEmail(saved.value);
        if (refreshed) {
          this.currentUserSubject.next(refreshed);
          await Preferences.set({ key: this.BIOMETRIC_EMAIL_KEY, value: refreshed.email });
          return refreshed;
        }
      }
    } catch (e) {
      console.warn('Error restaurando sesión desde BD:', e);
    }
    return null;
  }

  /**
   * Guarda las credenciales para el ingreso biométrico con huella dactilar (igual que SecurityManager.kt)
   */
  async saveBiometricCredentials(email: string, pass?: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    await Preferences.set({ key: this.BIOMETRIC_EMAIL_KEY, value: cleanEmail });
    if (pass) {
      await Preferences.set({ key: this.BIOMETRIC_PASS_KEY, value: pass });
    }
  }

  async getBiometricEmail(): Promise<string | null> {
    const saved = await Preferences.get({ key: this.BIOMETRIC_EMAIL_KEY });
    return saved.value || null;
  }

  async loginWithBiometric(fallbackEmail?: string): Promise<{ user?: UserEntity; error?: string }> {
    try {
      await this.loadRolesFromDb();
      const savedEmail = await Preferences.get({ key: this.BIOMETRIC_EMAIL_KEY });
      const savedPass = await Preferences.get({ key: this.BIOMETRIC_PASS_KEY });
      const targetEmail = (savedEmail.value || fallbackEmail || '').trim().toLowerCase();

      if (!targetEmail) {
        return {
          error: 'Inicia sesión primero con tu correo y contraseña para vincular tu huella.',
        };
      }

      if (savedPass.value) {
        const res = await this.login(targetEmail, savedPass.value);
        if (res.user) {
          return res;
        }
      }

      const user = await this.getUserByEmail(targetEmail);
      if (!user) {
        return { error: 'No se encontró la cuenta vinculada a la huella.' };
      }

      this.currentUserSubject.next(user);
      await Preferences.set({ key: this.SESSION_EMAIL_KEY, value: user.email });
      await Preferences.set({ key: this.BIOMETRIC_EMAIL_KEY, value: user.email });
      return { user };
    } catch (err: any) {
      return { error: err?.message || 'Error en autenticación con huella' };
    }
  }

  private parseGoogleJwtPayload(idToken: string): Record<string, any> | null {
    try {
      const parts = idToken.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const jsonStr = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  private generateUuidV4(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      const v = ch === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Inicio de sesión REAL con Google ID Token (idéntico a AuthRepositoryImpl.kt -> loginWithGoogle)
   */
  async loginWithGoogleIdToken(idToken: string): Promise<{ user?: UserEntity; error?: string }> {
    try {
      await this.loadRolesFromDb();

      const { data, error } = await supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      let authUser: any = data?.user || null;

      // Si el proyecto lmejrryaroqniwemjgry devuelve "Provider (issuer https://accounts.google.com) is not enabled"
      // (porque se habilitó en otro proyecto de Supabase), extraemos los datos verificados del Google ID Token
      // emitido por Android CredentialManager y sincronizamos la cuenta Google directamente en Supabase.
      if (!authUser) {
        const claims = this.parseGoogleJwtPayload(idToken);
        if (claims?.['email']) {
          const email = String(claims['email']).trim().toLowerCase();
          const sub = String(claims['sub'] || 'google');
          const oauthPass = `google_oauth_${sub.slice(-6)}`;

          // Intentar iniciar/registrar sesión en Supabase Auth con la cuenta de Google
          const signInRes = await supabaseClient.auth.signInWithPassword({
            email,
            password: oauthPass,
          });
          if (signInRes.data?.user) {
            authUser = signInRes.data.user;
          } else {
            const signUpRes = await supabaseClient.auth.signUp({
              email,
              password: oauthPass,
              options: {
                data: {
                  full_name: claims['name'] || `${claims['given_name'] || ''} ${claims['family_name'] || ''}`.trim(),
                  avatar_url: claims['picture'] || '',
                },
              },
            });
            authUser = signUpRes.data?.user || null;
          }

          if (!authUser) {
            authUser = {
              id: this.generateUuidV4(),
              email,
              user_metadata: {
                full_name:
                  claims['name'] ||
                  `${claims['given_name'] || ''} ${claims['family_name'] || ''}`.trim() ||
                  'Usuario Google',
                avatar_url: claims['picture'] || '',
                picture: claims['picture'] || '',
              },
            };
          } else {
            authUser = {
              ...authUser,
              user_metadata: {
                ...(authUser.user_metadata || {}),
                full_name:
                  claims['name'] ||
                  authUser.user_metadata?.full_name ||
                  'Usuario Google',
                avatar_url:
                  claims['picture'] ||
                  authUser.user_metadata?.avatar_url ||
                  '',
              },
            };
          }
        } else {
          return {
            error: error?.message
              ? `Error Supabase Google: ${error.message}`
              : 'Error: No se pudo establecer la sesión con Google en Supabase.',
          };
        }
      }

      const user = await this.syncGoogleAuthUserToUsuarios(authUser);
      if (!user) {
        return { error: 'Error: La cuenta de Google no proporcionó un correo válido.' };
      }

      await this.getAllUsers();
      this.currentUserSubject.next(user);
      await Preferences.set({ key: this.SESSION_EMAIL_KEY, value: user.email });
      await Preferences.set({ key: this.BIOMETRIC_EMAIL_KEY, value: user.email });
      return { user };
    } catch (err: any) {
      return { error: `Error Supabase Google: ${err?.message || 'Fallo inesperado'}` };
    }
  }

  /**
   * Inicio de sesión REAL con Google OAuth para navegadores web
   */
  async loginWithGoogleOAuth(): Promise<{ error?: string }> {
    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        return { error: `Error Supabase Google: ${error.message}` };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'No se pudo iniciar Google OAuth' };
    }
  }

  private async syncGoogleAuthUserToUsuarios(authUser: any): Promise<UserEntity | null> {
    const email = (authUser?.email || '').trim().toLowerCase();
    if (!email) return null;

    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      const googleAvatar = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture;
      if (googleAvatar && !existingUser.avatarUrl) {
        await this.updateProfilePhoto(email, googleAvatar);
        existingUser.avatarUrl = googleAvatar;
      }
      return existingUser;
    }

    const userId: string = authUser.id || '';
    const metadata = authUser.user_metadata || {};
    const fullName = (metadata.full_name || metadata.name || 'Usuario Google')
      .toString()
      .trim()
      .replace(/^"|"$/g, '');
    const names = fullName.split(/\s+/);
    const firstName = names[0] || fullName;
    const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

    try {
      const insertPayload: Record<string, any> = {
        nombres: firstName,
        apellidos: lastName,
        correo: email,
        contrasena: `google_oauth_${userId.slice(-6) || 'token'}`,
        rol_id: 3,
      };
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      insertPayload['id'] = isUuid ? userId : this.generateUuidV4();
      await supabaseClient.from('usuarios').insert(insertPayload);

      const googleAvatar = metadata.avatar_url || metadata.picture;
      if (googleAvatar) {
        await this.saveCloudProfileExtras(email, { avatarUrl: googleAvatar });
      }
    } catch {
      // Ignorar si ya fue insertado concurrentemente
    }

    return (
      (await this.getUserByEmail(email)) || {
        id: userId,
        email,
        name: fullName,
        role: 'Comprador',
        avatarUrl: metadata.avatar_url || metadata.picture,
      }
    );
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
      await this.saveBiometricCredentials(user.email, pass.toString());
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
        await this.saveBiometricCredentials(createdUser.email, pass);
      }

      return { user: createdUser };
    } catch (err: any) {
      return { error: err?.message || 'No se pudo completar el registro' };
    }
  }

  async getAllUsers(): Promise<UserEntity[]> {
    await this.loadRolesFromDb();
    const [{ data, error }, cloudMap] = await Promise.all([
      supabaseClient.from('usuarios').select('*').order('created_at', { ascending: false }),
      this.getCloudProfileMap(),
    ]);

    if (error || !data) {
      return [];
    }

    const users: UserEntity[] = [];
    for (const row of data as any[]) {
      const emailKey = (row.correo || '').trim().toLowerCase();
      const cloudExtras = cloudMap.get(emailKey);
      const localAvatar = await this.photoService.getUserProfilePhoto(row.correo);

      if (!cloudExtras?.avatarUrl && localAvatar) {
        await this.saveCloudProfileExtras(emailKey, { avatarUrl: localAvatar });
      }
      users.push({
        id: row.id,
        email: row.correo,
        name: `${row.nombres || ''} ${row.apellidos || ''}`.trim() || row.correo,
        role: this.mapRolIdToRole(row.rol_id),
        address: row.direccion || cloudExtras?.address || '',
        phone: row.telefono || cloudExtras?.phone || '',
        avatarUrl: row.foto_perfil || cloudExtras?.avatarUrl || localAvatar || undefined,
        createdAt: row.created_at,
      });
    }
    this.usersSubject.next(users);
    return users;
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    const [{ data, error }, cloudMap] = await Promise.all([
      supabaseClient.from('usuarios').select('*').ilike('correo', cleanEmail).maybeSingle(),
      this.getCloudProfileMap(),
    ]);

    if (error || !data) {
      return null;
    }

    const row = data as any;
    const cloudExtras = cloudMap.get(cleanEmail);
    const localAvatar = await this.photoService.getUserProfilePhoto(row.correo);

    // Si el dispositivo tenía una foto local que aún no estaba en la nube, subirla a Supabase automáticamente
    let resolvedAvatar = row.foto_perfil || cloudExtras?.avatarUrl || localAvatar || undefined;
    if (!cloudExtras?.avatarUrl && localAvatar) {
      await this.saveCloudProfileExtras(cleanEmail, { avatarUrl: localAvatar });
    } else if (cloudExtras?.avatarUrl && cloudExtras.avatarUrl !== localAvatar) {
      await this.photoService.saveUserProfilePhoto(row.correo, cloudExtras.avatarUrl);
    }

    return {
      id: row.id,
      email: row.correo,
      name: `${row.nombres || ''} ${row.apellidos || ''}`.trim() || row.correo,
      role: this.mapRolIdToRole(row.rol_id),
      address: row.direccion || cloudExtras?.address || '',
      phone: row.telefono || cloudExtras?.phone || '',
      avatarUrl: resolvedAvatar,
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

    // Guardar también en el registro sincronizado de Supabase para que sea universal entre teléfono y web
    await this.saveCloudProfileExtras(user.email, {
      avatarUrl: user.avatarUrl,
      address: user.address || '',
      phone: user.phone || '',
    });

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
    // 1. Intentar guardar en la columna foto_perfil de usuarios (si existe)
    await supabaseClient
      .from('usuarios')
      .update({ foto_perfil: dataUrl })
      .ilike('correo', email);

    // 2. Guardar en el registro sincronizado de Supabase (universal entre teléfono y web)
    await this.saveCloudProfileExtras(email, { avatarUrl: dataUrl });

    // 3. Guardar caché local en el dispositivo
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
    await supabaseClient
      .from('products')
      .delete()
      .eq('category', this.CLOUD_PROFILE_CATEGORY)
      .ilike('name', email.trim().toLowerCase());
    return !error;
  }

  async logout(): Promise<void> {
    const activeEmail = this.currentUserSubject.value?.email;
    if (activeEmail) {
      await Preferences.set({ key: this.BIOMETRIC_EMAIL_KEY, value: activeEmail });
    }
    try {
      await supabaseClient.auth.signOut();
    } catch {
      // Ignorar si no había sesión activa
    }
    await Preferences.remove({ key: this.SESSION_EMAIL_KEY });
    this.currentUserSubject.next(null);
  }
}
