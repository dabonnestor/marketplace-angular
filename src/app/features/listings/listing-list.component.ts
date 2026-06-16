import { Component, signal, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/services/api-client.service';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';

const CATEGORIES = [
  'All',
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Toys',
  'Other',
];

const CONDITION_LABELS: Record<string, string> = {
  new: 'new',
  like_new: 'like new',
  good: 'good',
  fair: 'fair',
  poor: 'poor',
};

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    NgOptimizedImage,
    CardComponent,
    BadgeComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="Search listings..."
          class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:max-w-sm"
        />
        <select
          [formControl]="categoryControl"
          class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-48"
        >
          @for (cat of categories; track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>
      </div>

      @if (query.isLoading()) {
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <app-card>
              <div class="p-4">
                <app-skeleton class="mb-3 block h-48 w-full" />
                <app-skeleton class="mb-2 block h-5 w-3/4" />
                <app-skeleton class="block h-4 w-1/4" />
              </div>
            </app-card>
          }
        </div>
      } @else if (query.isError()) {
        <div class="py-16 text-center">
          <p class="text-lg text-gray-500">Something went wrong. Please try again.</p>
        </div>
      } @else if (listings().length === 0) {
        <div class="py-16 text-center">
          <p class="text-lg text-gray-500">No listings found. Try adjusting your filters.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (listing of listings(); track listing.id) {
            <a [routerLink]="['/listings', listing.id]" class="block transition-shadow hover:shadow-lg">
              <app-card>
                @if (listing.images.length > 0) {
                  <img
                    [ngSrc]="listing.images[0]"
                    [alt]="listing.title"
                    width="400"
                    height="300"
                    class="h-48 w-full rounded-t-lg object-cover"
                  />
                } @else {
                  <div class="flex h-48 w-full items-center justify-center rounded-t-lg bg-gray-100">
                    <span class="text-gray-400">No image</span>
                  </div>
                }
                <div class="p-4">
                  <div class="mb-2 flex items-start justify-between gap-2">
                    <h3 class="text-lg font-semibold text-gray-900">{{ listing.title }}</h3>
                    <app-badge [variant]="listingConditionVariant(listing.condition)">
                      {{ conditionLabel(listing.condition) }}
                    </app-badge>
                  </div>
                  <p class="text-xl font-bold text-blue-600">{{ listing.price | currency }}</p>
                </div>
              </app-card>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ListingListComponent {
  private apiClient = inject(ApiClient);

  searchControl = new FormControl('');
  categoryControl = new FormControl('All');

  search = signal('');
  category = signal('');

  categories = CATEGORIES;

  // Debounce search input
  private searchSub = this.searchControl.valueChanges
    .pipe(debounceTime(300), distinctUntilChanged())
    .subscribe((val) => this.search.set(val ?? ''));

  private categorySub = this.categoryControl.valueChanges.subscribe((val) => {
    const v = val ?? 'All';
    this.category.set(v === 'All' ? '' : v);
  });

  query = injectQuery(() => ({
    queryKey: ['listings', this.search(), this.category()],
    queryFn: () =>
      firstValueFrom(
        this.apiClient.getListings({
          search: this.search() || undefined,
          category: this.category() || undefined,
        }),
      ),
  }));

  listings = computed(() => this.query.data()?.data ?? []);

  conditionLabel(condition: string): string {
    return CONDITION_LABELS[condition] ?? condition;
  }

  listingConditionVariant(condition: string): 'default' | 'primary' | 'success' | 'warning' | 'destructive' {
    const map: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'destructive'> = {
      new: 'primary',
      like_new: 'success',
      good: 'default',
      fair: 'warning',
      poor: 'destructive',
    };
    return map[condition] ?? 'default';
  }
}
