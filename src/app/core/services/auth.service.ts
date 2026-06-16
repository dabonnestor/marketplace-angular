import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError, finalize, share } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  private _authResolved = signal(false);
  readonly authResolved = this._authResolved.asReadonly();
  private authCheckRequest$: Observable<{ user: User }> | null = null;

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<{ user: User }>('/api/auth/login', { email, password })
      .pipe(tap((res) => this._currentUser.set(res.user)));
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<{ user: User }>('/api/auth/register', { name, email, password })
      .pipe(tap((res) => this._currentUser.set(res.user)));
  }

  logout() {
    return this.http.post<unknown>('/api/auth/logout', {}).pipe(
      tap(() => this._currentUser.set(null)),
    );
  }

  checkAuthStatus() {
    if (this.authCheckRequest$) {
      return this.authCheckRequest$;
    }
    this.authCheckRequest$ = this.http.get<{ user: User }>('/api/auth/me').pipe(
      tap({
        next: (res) => {
          this._currentUser.set(res.user);
          this._authResolved.set(true);
        },
        error: () => {
          this._currentUser.set(null);
          this._authResolved.set(true);
        },
      }),
      finalize(() => { this.authCheckRequest$ = null; }),
      share(),
    );
    return this.authCheckRequest$;
  }

  refreshToken() {
    return this.http.post<unknown>('/api/auth/refresh', {}).pipe(
      catchError((err) => {
        this._currentUser.set(null);
        throw err;
      }),
    );
  }
}
