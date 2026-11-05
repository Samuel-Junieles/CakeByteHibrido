import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'auth',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'buyer',
    canActivate: [authGuard, roleGuard(['Comprador', 'Vendedor', 'Admin'])],
    loadComponent: () =>
      import('./presentation/buyer/buyer.page').then((m) => m.BuyerPage),
  },
  {
    path: 'vendor',
    canActivate: [authGuard, roleGuard(['Vendedor', 'Admin'])],
    loadComponent: () =>
      import('./presentation/vendor/vendor.page').then((m) => m.VendorPage),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['Admin'])],
    loadComponent: () =>
      import('./presentation/admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./presentation/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
