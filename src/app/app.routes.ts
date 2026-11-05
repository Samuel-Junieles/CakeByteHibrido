import { Routes } from '@angular/router';

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
    path: 'buyer',
    loadComponent: () =>
      import('./presentation/buyer/buyer.page').then((m) => m.BuyerPage),
  },
  {
    path: 'vendor',
    loadComponent: () =>
      import('./presentation/vendor/vendor.page').then((m) => m.VendorPage),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./presentation/admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./presentation/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

