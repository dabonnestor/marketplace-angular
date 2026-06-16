import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[class]':
      '"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors " + variantClasses',
  },
})
export class BadgeComponent {
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'destructive' =
    'default';

  get variantClasses(): string {
    const variants: Record<string, string> = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      destructive: 'bg-red-100 text-red-800',
    };
    return variants[this.variant] || variants['default'];
  }
}
