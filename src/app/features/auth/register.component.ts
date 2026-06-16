import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md p-8">
      <h1 class="mb-6 text-2xl font-bold">Register</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium">Name</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            class="w-full rounded border p-2"
            aria-label="Name"
          />
          @if (form.get('name')?.touched && form.get('name')?.invalid) {
            <p class="text-sm text-red-600">Name is required</p>
          }
        </div>

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

        <div>
          <label for="confirmPassword" class="block text-sm font-medium">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            formControlName="confirmPassword"
            class="w-full rounded border p-2"
            aria-label="Confirm password"
          />
          @if (form.get('confirmPassword')?.touched && form.hasError('passwordMismatch')) {
            <p class="text-sm text-red-600">Passwords do not match</p>
          }
        </div>

        @if (mutation.error(); as err) {
          <p class="rounded bg-red-100 p-2 text-sm text-red-700">
            {{ $any(err).error?.message || err.message || 'Registration failed' }}
          </p>
        }

        <button
          type="submit"
          [disabled]="mutation.isPending()"
          class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ mutation.isPending() ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm">
        Already have an account?
        <a routerLink="/login" class="text-blue-600 hover:underline">Log in</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  mutation = injectMutation(() => ({
    mutationFn: (data: { name: string; email: string; password: string; confirmPassword: string }) =>
      firstValueFrom(this.authService.register(data.name, data.email, data.password)),
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
