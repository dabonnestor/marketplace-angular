import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <router-outlet />
    </div>
  `,
})
export class DashboardLayoutComponent {}
