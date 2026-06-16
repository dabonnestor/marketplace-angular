import { render } from '@testing-library/angular';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('should render with content', async () => {
    const { container } = await render(
      `<button appButton>Click me</button>`,
      {
        imports: [ButtonComponent],
      },
    );
    expect(container.textContent).toContain('Click me');
  });

  it('should apply default variant classes', async () => {
    const { container } = await render(
      `<button appButton>Default</button>`,
      {
        imports: [ButtonComponent],
      },
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-gray-100');
    expect(button?.className).toContain('rounded-md');
  });

  it('should apply primary variant classes', async () => {
    const { container } = await render(
      `<button appButton variant="primary">Primary</button>`,
      {
        imports: [ButtonComponent],
      },
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-blue-600');
  });
});
