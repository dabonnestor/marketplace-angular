import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const guestGuard = () => {
  const router = inject(Router);
  // TODO: Implement actual guest check in Auth slice
  return true;
};
