import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts with no user', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('login', () => {
    it('calls POST /api/auth/login and sets currentUser on success', () => {
      service.login('alice@example.com', 'secret123').subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'alice@example.com', password: 'secret123' });
      req.flush({ user: mockUser });
    });
  });

  describe('register', () => {
    it('calls POST /api/auth/register and sets currentUser on success', () => {
      service.register('Alice', 'alice@example.com', 'secret123').subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
      });
      req.flush({ user: mockUser });
    });
  });

  describe('logout', () => {
    it('calls POST /api/auth/logout and clears currentUser', () => {
      // First log in
      service.login('alice@example.com', 'secret123').subscribe();
      httpMock.expectOne('/api/auth/login').flush({ user: mockUser });

      // Then log out
      service.logout().subscribe(() => {
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('checkAuthStatus', () => {
    it('calls GET /api/auth/me and sets currentUser on success', () => {
      service.checkAuthStatus().subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush({ user: mockUser });
    });

    it('keeps currentUser null when /me returns 401', () => {
      service.checkAuthStatus().subscribe((user) => {
        expect(user).toBeNull();
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });

      httpMock.expectOne('/api/auth/me').flush(null, {
        status: 401,
        statusText: 'Unauthorized',
      });
    });
  });

  describe('refreshToken', () => {
    it('calls POST /api/auth/refresh and returns the new access token', () => {
      service.refreshToken().subscribe((result) => {
        expect(result).toEqual({ success: true });
      });

      const req = httpMock.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('logs out and clears user when refresh fails', () => {
      // First log in
      service.login('alice@example.com', 'secret123').subscribe();
      httpMock.expectOne('/api/auth/login').flush({ user: mockUser });

      // Then fail refresh
      service.refreshToken().subscribe({
        error: () => {
          expect(service.currentUser()).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      httpMock.expectOne('/api/auth/refresh').flush(
        { message: 'Invalid refresh token' },
        { status: 401, statusText: 'Unauthorized' },
      );
    });
  });
});
