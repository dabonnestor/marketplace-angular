import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'listings',
    loadComponent: () =>
      import('./features/listings/listing-list.component').then(
        (m) => m.ListingListComponent,
      ),
  },
  {
    path: 'listings/new',
    loadComponent: () =>
      import('./features/listings/create-listing.component').then(
        (m) => m.CreateListingComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'listings/:id',
    loadComponent: () =>
      import('./features/listings/listing-detail.component').then(
        (m) => m.ListingDetailComponent,
      ),
  },
  {
    path: 'listings/:id/edit',
    loadComponent: () =>
      import('./features/listings/edit-listing.component').then(
        (m) => m.EditListingComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'listings/:id/confirm',
    loadComponent: () =>
      import('./features/listings/confirm-purchase.component').then(
        (m) => m.ConfirmPurchaseComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./features/orders/order-detail.component').then(
        (m) => m.OrderDetailComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(
        (m) => m.LoginComponent,
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then(
        (m) => m.RegisterComponent,
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'listings',
        pathMatch: 'full',
      },
      {
        path: 'listings',
        loadComponent: () =>
          import('./features/dashboard/my-listings.component').then(
            (m) => m.MyListingsComponent,
          ),
      },
      {
        path: 'purchases',
        loadComponent: () =>
          import('./features/dashboard/purchases.component').then(
            (m) => m.PurchasesComponent,
          ),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./features/dashboard/sales.component').then(
            (m) => m.SalesComponent,
          ),
      },
      {
        path: 'seller/onboard',
        loadComponent: () =>
          import('./features/seller/seller-onboard.component').then(
            (m) => m.SellerOnboardComponent,
          ),
      },
    ],
  },
];
