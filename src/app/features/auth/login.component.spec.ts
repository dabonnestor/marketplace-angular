import { TestBed } from '@angular/core/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Component } from '@angular/core';
import { LoginComponent } from './login.component';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('LoginComponent', () => {
  async function setup() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const result = await render(LoginComponent, {
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: LoginComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(queryClient),
      ],
    });
    return result;
  }

  it('renders email, password fields and a submit button', async () => {
    await setup();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows required validation errors on touched empty fields', async () => {
    await setup();

    fireEvent.blur(screen.getByLabelText(/email/i));
    fireEvent.blur(screen.getByLabelText(/password/i));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows email format validation error', async () => {
    await setup();

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.input(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('disables submit button and shows loading state while submitting', async () => {
    const { fixture } = await setup();

    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    fixture.detectChanges();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/auth/login').flush({
      user: { id: '1', name: 'Alice', email: 'alice@example.com' },
    });
  });

  it('shows error message on failed login', async () => {
    const { fixture } = await setup();

    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'bad@example.com' } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    fixture.detectChanges();

    // Wait for mutation to trigger the HTTP request
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/auth/login').flush(
      { message: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
