import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md p-8">
      <h1 class="mb-6 text-2xl font-bold">Login</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="w-full rounded border p-2"
            aria-label="Email"
          />
          @if (form.get('email')?.touched && form.get('email')?.invalid) {
            <p class="text-sm text-red-600">
              @if (form.get('email')?.errors?.['required']) {
                Email is required
              } @else if (form.get('email')?.errors?.['email']) {
                Please enter a valid email
              }
            </p>
          }
        </div>

        <div>
          <label for="password" class="block text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="w-full rounded border p-2"
            aria-label="Password"
          />
          @if (form.get('password')?.touched && form.get('password')?.invalid) {
            <p class="text-sm text-red-600">Password is required</p>
          }
        </div>

        @if (mutation.error(); as err) {
          <p class="rounded bg-red-100 p-2 text-sm text-red-700">
            {{ $any(err).error?.message || err.message || 'Login failed' }}
          </p>
        }

        <button
          type="submit"
          [disabled]="mutation.isPending()"
          class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ mutation.isPending() ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm">
        Don't have an account?
        <a routerLink="/register" class="text-blue-600 hover:underline">Register</a>
      </p>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  mutation = injectMutation(() => ({
    mutationFn: (data: { email: string; password: string }) =>
      firstValueFrom(this.authService.login(data.email, data.password)),
    onSuccess: () => this.router.navigateByUrl('/'),
  }));

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.mutation.mutate(this.form.getRawValue());
  }
}
