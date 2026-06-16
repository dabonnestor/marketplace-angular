import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  // TODO: Implement actual auth check in Auth slice
  return true;
};
