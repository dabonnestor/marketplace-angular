import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[class]':
      '"rounded-lg border border-gray-200 bg-white shadow-sm"',
  },
})
export class CardComponent {}
