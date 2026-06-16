import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiClient } from './api-client.service';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    apiClient = TestBed.inject(ApiClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('getListings() calls GET /api/listings with no params', () => {
    apiClient.getListings().subscribe((response) => {
      expect(response.data).toEqual([{ id: '1', title: 'Shoes' }]);
    });

    const req = httpTesting.expectOne('/api/listings');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [{ id: '1', title: 'Shoes' }], total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('getListings() passes search and category as query params', () => {
    apiClient.getListings({ search: 'shoes', category: '1' }).subscribe();

    const req = httpTesting.expectOne(
      (r) => r.url === '/api/listings' && r.params.get('search') === 'shoes' && r.params.get('category') === '1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  });
});
