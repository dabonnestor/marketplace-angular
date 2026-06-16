# PRD: Marketplace Frontend — Angular Rebuild

## Problem Statement

The marketplace currently has a React/Next.js frontend and a Node/Express API. The team wants to rebuild the frontend in Angular to align with their preferred technology stack. The existing API must remain untouched — all changes are confined to the new Angular project.

## Solution

Build a new Angular frontend that replicates all features of the existing React app while leveraging Angular's specific strengths (standalone components, signals, reactive forms, route guards). A thin Express BFF (Backend For Frontend) is colocated in the Angular project to handle httpOnly cookie-based JWT auth securely, proxying requests to the existing marketplace API. The end result is a single deployable unit: the Express server serves the compiled Angular static files and forwards API calls.

## User Stories

1. As a visitor, I want to browse all active listings, so that I can discover items for sale.
2. As a visitor, I want to search listings by keyword, so that I can find specific items quickly.
3. As a visitor, I want to filter listings by category and price range, so that I can narrow down results.
4. As a visitor, I want to view a listing's full details (images, description, price, seller), so that I can decide whether to buy.
5. As a visitor, I want to register an account with email, password, and name, so that I can become a buyer.
6. As a visitor, I want to log in with my credentials, so that I can access protected features.
7. As a buyer, I want to purchase a listing with Stripe, so that I can pay securely.
8. As a buyer, I want to view my purchase history with statuses, so that I can track my orders.
9. As a buyer, I want to mark a delivered order as completed, so that the transaction can finalize.
10. As a buyer, I want to cancel a pending order, so that I can back out of a purchase.
11. As a buyer, I want to request a refund, so that I can recover my payment for a disputed order.
12. As a seller, I want to create a listing with title, description, price, category, condition, shipping cost, and images, so that I can offer items for sale.
13. As a seller, I want to edit my listing, so that I can correct or update its details.
14. As a seller, I want to delete an unsold listing, so that it no longer appears to buyers.
15. As a seller, I want to view all my listings (active and sold) in a dashboard, so that I can manage my inventory.
16. As a seller, I want to view my sales with statuses, so that I can track orders from buyers.
17. As a seller, I want to mark a paid order as shipped, so that the buyer knows it's on the way.
18. As a seller, I want to complete Stripe Connect onboarding, so that I can receive payouts for my sales.
19. As a seller, I want to see my onboarding status, so that I know whether I can receive payments.
20. As a user, I want a persistent authentication session across page reloads, so that I don't have to log in repeatedly.
21. As a user, I want the app to automatically refresh my session when the access token expires, so that I'm not interrupted mid-session.
22. As a user, I want to see loading skeletons while data is being fetched, so that I know the page is working.
23. As a user, I want to see error states when something goes wrong, so that I understand what happened.
24. As a user, I want to see a 404 page when navigating to a non-existent route, so that I know the page doesn't exist.
25. As a user, I want the app to be responsive on mobile and desktop, so that I can use it on any device.
26. As a user, I want toast notifications for action outcomes, so that I get immediate feedback.

## Implementation Decisions

### Architecture

- **Angular 19+ with standalone components.** No NgModules. Every component is standalone and imports only what it needs.
- **BFF (Backend For Frontend)** is a thin Express server in a `server/` folder within the Angular project. It holds httpOnly cookies for JWT auth and proxies API calls to the existing marketplace API.
- **Zero changes to the existing marketplace API.** The BFF is the only new server-side code.

### BFF behavior

- On `/api/auth/login` and `/api/auth/register`: forwards to the real API, stores access + refresh tokens in httpOnly cookies, returns the user object in the JSON body.
- On `/api/auth/me`: reads the access token cookie, forwards to the real API's `/api/v1/auth/me`, returns the user. Also set a non-httpOnly `auth_status` cookie for quick client-side hydration checks.
- On all other `/api/*` calls: reads tokens from cookies, attaches `Authorization: Bearer <token>`, forwards the request. If the API returns 401, attempts token refresh, retries once.
- On `/api/auth/logout`: clears all auth cookies.
- In production, Express serves the compiled Angular static files (`dist/marketplace-angular/browser/`).
- In development, Angular CLI's `proxy.conf.json` forwards `/api` to the Express BFF on a different port.

### Routing

Flat route structure matching the React app 1:1, using Angular Router with `loadComponent` for lazy loading:

| Route | Component | Guard |
|---|---|---|
| `/` | HomeComponent | none |
| `/listings` | ListingListComponent | none |
| `/listings/:id` | ListingDetailComponent | none |
| `/listings/new` | CreateListingComponent | auth |
| `/listings/:id/edit` | EditListingComponent | auth |
| `/listings/:id/confirm` | ConfirmPurchaseComponent | auth |
| `/orders/:id` | OrderDetailComponent | auth |
| `/login` | LoginComponent | guest |
| `/register` | RegisterComponent | guest |
| `/dashboard` | DashboardLayoutComponent | auth |
| `/dashboard/listings` | MyListingsComponent | auth |
| `/dashboard/purchases` | PurchasesComponent | auth |
| `/dashboard/sales` | SalesComponent | auth |
| `/dashboard/seller/onboard` | SellerOnboardComponent | auth |

### State management

- **TanStack Angular Query** for all server state (listings, orders, purchases, sales). Handles caching, background refetch, loading/error states, and pagination.
- **Signals** (Angular's built-in reactive primitives) for client-only state. A thin `AuthService` exposes `currentUser` and `isAuthenticated` as signals. No Zustand or NgRx needed.
- Query keys mirror the existing React app's TanStack Query usage.

### API client

- An `ApiClient` Angular service wrapping `HttpClient`. Calls go to the BFF (`/api/*`), which proxies to the real API.
- An HTTP interceptor handles 401 responses by calling the BFF's `/api/auth/refresh` and retrying the original request.
- Request/response types mirror the existing `src/lib/api/types.ts` from the React app.

### UI components

- **Tailwind CSS v4** for all visual styling. Matches the React app's design tokens.
- **Angular CDK** for interaction primitives: `@angular/cdk/dialog` for modals (confirm purchase, confirm cancel, Stripe payment), `@angular/cdk/overlay` for dropdown menus.
- A shared UI component library: Button, Input, Label, Card, Badge, Dialog, Select, Textarea, Separator, Skeleton, Toast (using `ngx-sonner` or a signal-based toast service).
- Dark mode via Tailwind's `class` strategy with a `ThemeService`.

### Forms

- **Angular Reactive Forms** for all form input (login, register, create listing, edit listing).
- Custom validators for password match, price format, etc.
- Zod is not used on the frontend. Validation mirrors the server Zod schemas as Angular validators.

### Stripe integration

- `@stripe/stripe-js` loaded directly (no Angular wrapper). The `StripePaymentFormComponent` mounts Stripe Elements imperatively in `AfterViewInit` inside an Angular CDK dialog.
- The BFF proxies the order creation and payment intent flow. The Angular app never handles raw Stripe secrets.

### File uploads

- Uploadthing REST API called directly from Angular's `HttpClient`. The Uploadthing React wrapper is not used.
- Upload flow: `HttpClient` POST to Uploadthing endpoint → receive URL → include URL in `createListing` images array.

### Order state machine

- The frontend replicates the order state machine from the React app. The enum defined in `src/lib/order-state-machine.ts` is ported to a TypeScript file in the Angular project. It determines which actions are available at each status.
- A `StatusProgressComponent` renders the visual progress bar.

### Testing

- **Test runner**: Jest with `jest-preset-angular`.
- **Component testing**: `@testing-library/angular` (same family as `@testing-library/react` used in the existing frontend).
- **Matchers**: `@testing-library/jest-dom` for `toBeInTheDocument()`, `toHaveTextContent()`, etc.
- Tests focus on user-visible behavior (what the user sees, clicks, types) — not implementation details (service internals, component state).

### Folder structure

```
src/app/
├── core/
│   ├── services/       (ApiClient, AuthService, ThemeService)
│   ├── guards/         (authGuard, guestGuard)
│   ├── interceptors/   (auth interceptor, error interceptor)
│   └── types/          (API response types, domain types)
├── features/
│   ├── auth/           (login, register)
│   ├── listings/       (browse, detail, create, edit, confirm)
│   ├── orders/         (detail, purchases, sales)
│   ├── dashboard/      (dashboard layout, nav)
│   └── seller/         (onboarding)
├── shared/
│   ├── ui/             (Button, Input, Card, Dialog, Skeleton, etc.)
│   └── pipes/          (currency format, date format)
├── app.component.ts    (root shell)
├── app.config.ts       (providers, router, query client)
└── app.routes.ts
server/
├── index.ts            (Express entry, serves static files in prod)
├── auth.ts             (cookie ↔ token logic, /api/auth/* routes)
└── proxy.ts            (general API proxy with token refresh)
```

## Testing Decisions

### What makes a good test

- Tests exercise external behavior: render a component, simulate user input, assert on visible output.
- Tests do NOT assert on component internals (service method counts, signal values, RxJS pipe chains).
- API-level tests (for the BFF) use `supertest` and mock only the external marketplace API — they test the cookie ↔ header logic and refresh flow.
- Component tests render the full component tree within the test, not shallow rendering. Providers (HttpClient, QueryClient, AuthService) are mocked or provided via test harness.

### Modules to test

| Module | Test type | Framework |
|---|---|---|
| BFF (server/) | Integration | Vitest + Supertest (matches API test setup) |
| Core services (ApiClient, AuthService) | Unit | Jest |
| Route guards | Unit | Jest |
| All feature components | Integration | Jest + @testing-library/angular |
| Shared UI components | Unit | Jest + @testing-library/angular |
| Forms (create listing, edit listing) | Integration | Jest + @testing-library/angular |
| Order state machine | Unit | Jest |
| File upload flow | Integration | Jest + @testing-library/angular |
| Stripe payment form | Integration | Jest + @testing-library/angular |

### Prior art

- The React app tests (`*.test.tsx` files) serve as behavioral specs — the Angular tests should cover the same user scenarios.
- The API uses Vitest with similar patterns (supertest for integration, direct function calls for unit tests).
- The BFF tests mirror the API test patterns since both are Express servers.

## Out of Scope

- **Server-side rendering / Angular Universal.** This is a pure SPA with a BFF. SSR may be added later.
- **Modifying the existing marketplace API.** The API is consumed as-is.
- **Modifying the existing React frontend.** The React app is replaced, not extended.
- **Internationalization (i18n).** English only for now.
- **Real-time features (WebSockets, notifications).** Not in the current scope.
- **Admin panel.** Only buyer/seller roles.
- **Mobile native app.** Web-only, responsive design.
- **CI/CD pipeline setup.** The project structure will support it but pipeline configuration is separate.

## Further Notes

- The BFF introduces a single point of failure between Angular and the API. It should be kept minimal — no business logic, no database access, no session storage beyond cookies.
- The existing API uses Stripe webhooks to drive order status transitions (payment confirmed → paid, refund processed → refunded). The Angular app polls order status via TanStack Query's `refetchInterval` after key actions (payment, cancel, refund) — same pattern as the React app's `usePollingStatus` hook.
- The React app uses `React.cache()` for request deduplication in server components. In Angular, TanStack Angular Query handles this via query key deduplication within the configured stale time.
- TypeScript types for API responses should stay in sync with the API. Since the API has OpenAPI/Swagger docs at `/api/docs.json`, consider generating types from that spec with `openapi-typescript` as a separate task.
