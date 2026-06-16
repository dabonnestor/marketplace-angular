import { render } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('should render the root component', async () => {
    const { container } = await render(App, {
      providers: [provideRouter([])],
    });
    expect(container).toBeTruthy();
  });
});
