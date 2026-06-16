import { Component, Input } from '@angular/core';

@Component({
  selector: 'button[appButton], button[app-button]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[class]':
      '"inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 " + variantClasses',
  },
})
export class ButtonComponent {
  @Input() variant: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost' =
    'default';

  get variantClasses(): string {
    const variants: Record<string, string> = {
      default: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
      ghost: 'bg-transparent hover:bg-gray-100',
    };
    return variants[this.variant] || variants['default'];
  }
}
