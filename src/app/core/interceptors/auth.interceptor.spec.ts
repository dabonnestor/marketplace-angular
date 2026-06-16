import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('passes through successful requests unchanged', () => {
    httpClient.get('/api/listings').subscribe((data) => {
      expect(data).toEqual({ items: [] });
    });

    const req = httpMock.expectOne('/api/listings');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('retries request after refreshing token on 401', () => {
    // Log in first
    authService.login('a@b.com', 'pw123').subscribe();
    httpMock.expectOne('/api/auth/login').flush({
      user: { id: '1', name: 'A', email: 'a@b.com' },
    });

    // Make request that will get a 401 first, then succeed after retry
    httpClient.get('/api/protected').subscribe((data) => {
      expect(data).toEqual({ result: 'success' });
    });

    // First attempt gets 401
    const firstReq = httpMock.expectOne('/api/protected');
    firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    // Interceptor should call refresh
    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    refreshReq.flush({ success: true });

    // Then retry original request
    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.method).toBe('GET');
    retryReq.flush({ result: 'success' });
  });

  it('logs out and does not retry when refresh also fails', () => {
    // Log in first
    authService.login('a@b.com', 'pw123').subscribe();
    httpMock.expectOne('/api/auth/login').flush({
      user: { id: '1', name: 'A', email: 'a@b.com' },
    });

    httpClient.get('/api/protected').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authService.currentUser()).toBeNull();
        expect(authService.isAuthenticated()).toBe(false);
      },
    });

    // Request gets 401
    httpMock.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });

    // Refresh also fails
    httpMock.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    // No retry of original
  });
});
