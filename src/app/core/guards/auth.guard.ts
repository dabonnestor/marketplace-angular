import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.authResolved() || authService.isAuthenticated()) {
    return authService.isAuthenticated() ? true : router.parseUrl('/login');
  }

  return authService.checkAuthStatus().pipe(
    map(() => authService.isAuthenticated() ? true : router.parseUrl('/login')),
    catchError(() => of(router.parseUrl('/login'))),
  );
};
