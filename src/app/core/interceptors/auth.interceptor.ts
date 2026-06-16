import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't try to refresh for auth endpoints themselves
      if (error.status === 401 && !req.url.startsWith('/api/auth/')) {
        return authService.refreshToken().pipe(
          switchMap(() => next(req)),
          catchError(() => throwError(() => error)),
        );
      }
      return throwError(() => error);
    }),
  );
};
