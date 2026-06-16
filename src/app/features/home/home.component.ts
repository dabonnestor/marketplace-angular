import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 class="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Marketplace
      </h1>
      <p class="mb-8 max-w-lg text-lg text-gray-600">
        Discover unique items from sellers around the world. Buy and sell with confidence.
      </p>
      <a
        routerLink="/listings"
        class="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
      >
        Browse Listings
      </a>
    </div>
  `,
})
export class HomeComponent {}
