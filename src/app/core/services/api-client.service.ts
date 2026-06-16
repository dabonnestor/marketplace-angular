import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Listing, PaginatedResponse } from '../types/listings';

export interface GetListingsParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  constructor(private http: HttpClient) {}

  getListings(params?: GetListingsParams) {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));

    return this.http.get<PaginatedResponse<Listing>>('/api/listings', { params: httpParams });
  }
}
