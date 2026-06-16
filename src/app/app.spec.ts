import { render } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.verify();
  });

  it('should render the root component', async () => {
    const { container } = await render(App, {
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    // App calls checkAuthStatus on init
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(container).toBeTruthy();
  });
});
