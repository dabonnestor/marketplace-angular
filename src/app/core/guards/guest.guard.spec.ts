import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('guestGuard', () => {
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: DummyComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('allows navigation when user is not authenticated', async () => {
    const resultPromise = firstValueFrom(
      TestBed.runInInjectionContext(() => guestGuard()),
    );
    httpMock.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('redirects to / when user is authenticated', async () => {
    const authService = TestBed.inject(AuthService);
    authService.login('a@b.com', 'pw').subscribe();
    httpMock.expectOne('/api/auth/login').flush({
      user: { id: '1', name: 'A', email: 'a@b.com' },
    });

    const result = await TestBed.runInInjectionContext(() => guestGuard());
    expect(result).not.toBe(true);
    expect(result?.toString()).toBe('/');
  });
});
