import { render, screen } from '@testing-library/angular';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ListingListComponent } from './listing-list.component';
import { ApiClient } from '../../core/services/api-client.service';
import { of } from 'rxjs';

const mockListings = {
  data: [
    {
      id: '1',
      title: 'Running Shoes',
      description: 'Barely used running shoes',
      price: 49.99,
      condition: 'like_new' as const,
      category: 'Sports',
      images: ['https://example.com/shoes.jpg'],
      sellerId: 's1',
      status: 'active' as const,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'JavaScript Book',
      description: 'Learn JS',
      price: 15.00,
      condition: 'good' as const,
      category: 'Books',
      images: [],
      sellerId: 's2',
      status: 'active' as const,
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const emptyResponse = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };

async function setup(queryData: unknown) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Pre-populate the cache so injectQuery finds it immediately
  queryClient.setQueryData(['listings', '', ''], queryData);

  const result = await render(ListingListComponent, {
    providers: [
      provideTanStackQuery(queryClient),
      { provide: ApiClient, useValue: { getListings: () => of(emptyResponse) } },
    ],
  });
  result.fixture.detectChanges();
  return result;
}

describe('ListingListComponent', () => {
  it('renders listing cards fetched from the API', async () => {
    await setup(mockListings);

    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('like new')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Book')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('renders empty state when no listings match', async () => {
    await setup(emptyResponse);

    expect(screen.getByText(/no listings/i)).toBeInTheDocument();
  });

  it('has a search input and category dropdown', async () => {
    await setup(emptyResponse);

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
