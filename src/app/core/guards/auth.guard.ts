import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthRepository } from '../../data/services/auth.repository';
import { UserRole } from '../../domain/models/models';

function getRoleHomeRoute(role: UserRole): string {
  switch (role) {
    case 'Admin':
      return '/admin';
    case 'Vendedor':
      return '/vendor';
    default:
      return '/buyer';
  }
}

/**
 * Guard de autenticación conectado a Supabase Auth y la tabla 'usuarios'.
 * Bloquea el acceso a rutas privadas si no existe sesión activa.
 */
export const authGuard: CanActivateFn = async () => {
  const authRepo = inject(AuthRepository);
  const router = inject(Router);

  const user = authRepo.currentUserValue || (await authRepo.restoreSession());
  if (!user) {
    return router.createUrlTree(['/login']);
  }
  return true;
};

/**
 * Guard de autorización por rol (Admin, Vendedor, Comprador).
 * Redirige al panel correspondiente del usuario si intenta entrar a una ruta de otro rol.
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return async () => {
    const authRepo = inject(AuthRepository);
    const router = inject(Router);

    const user = authRepo.currentUserValue || (await authRepo.restoreSession());
    if (!user) {
      return router.createUrlTree(['/login']);
    }

    if (!allowedRoles.includes(user.role)) {
      return router.createUrlTree([getRoleHomeRoute(user.role)]);
    }

    return true;
  };
}

