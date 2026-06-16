import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  it('renders a hero section with heading', async () => {
    await render(HomeComponent, {
      providers: [provideRouter([])],
    });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/marketplace/i)).toBeInTheDocument();
  });

  it('has a link to browse listings', async () => {
    await render(HomeComponent, {
      providers: [provideRouter([])],
    });

    const link = screen.getByRole('link', { name: /browse/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/listings');
  });
});
