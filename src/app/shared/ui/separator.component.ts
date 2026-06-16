import { Component } from '@angular/core';

@Component({
  selector: 'app-separator',
  standalone: true,
  template: ``,
  host: {
    '[class]': '"block h-[1px] w-full bg-gray-200"',
    'attr.role': 'separator',
  },
})
export class SeparatorComponent {}
