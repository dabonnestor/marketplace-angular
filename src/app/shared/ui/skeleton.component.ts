import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: ``,
  host: {
    '[class]': '"animate-pulse rounded-md bg-gray-200"',
  },
})
export class SkeletonComponent {}
