import { TestBed } from '@angular/core/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Component } from '@angular/core';
import { RegisterComponent } from './register.component';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('RegisterComponent', () => {
  async function setup() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const result = await render(RegisterComponent, {
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'register', component: RegisterComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(queryClient),
      ],
    });
    return result;
  }

  it('renders name, email, password, confirm password fields and a submit button', async () => {
    await setup();

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields).toHaveLength(2);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows required validation errors on touched empty fields', async () => {
    await setup();

    const inputs = screen.getAllByRole('textbox');
    for (const input of inputs) {
      fireEvent.blur(input);
    }
    const passwordFields = screen.getAllByLabelText(/password/i);
    for (const field of passwordFields) {
      fireEvent.blur(field);
    }

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    await setup();

    fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    const passwordFields = screen.getAllByLabelText(/password/i);
    fireEvent.input(passwordFields[0], { target: { value: 'secret123' } });
    fireEvent.input(passwordFields[1], { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('disables submit button and shows loading state while submitting', async () => {
    const { fixture } = await setup();

    fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    const passwordFields = screen.getAllByLabelText(/password/i);
    fireEvent.input(passwordFields[0], { target: { value: 'secret123' } });
    fireEvent.input(passwordFields[1], { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    fixture.detectChanges();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/auth/register').flush({
      user: { id: '1', name: 'Alice', email: 'alice@example.com' },
    });
  });

  it('shows error message on failed registration', async () => {
    const { fixture } = await setup();

    fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'taken@example.com' } });
    const passwordFields = screen.getAllByLabelText(/password/i);
    fireEvent.input(passwordFields[0], { target: { value: 'secret123' } });
    fireEvent.input(passwordFields[1], { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    fixture.detectChanges();

    // Wait for mutation to trigger the HTTP request
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/auth/register').flush(
      { message: 'Email already exists' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  });
});
