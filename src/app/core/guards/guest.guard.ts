import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.authResolved() || authService.isAuthenticated()) {
    return authService.isAuthenticated() ? router.parseUrl('/') : true;
  }

  return authService.checkAuthStatus().pipe(
    map(() => authService.isAuthenticated() ? router.parseUrl('/') : true),
    catchError(() => of(true)),
  );
};
