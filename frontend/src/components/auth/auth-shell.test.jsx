import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AuthShell } from './auth-shell';
vi.mock('@/components/layout/theme/theme-toggle', () => ({ ThemeToggle: () => null }));
it.each(['center', 'left-image', 'right-image'])('preserves the configured %s layout with and without a cover', (layout) => {
  const { container, rerender } = render(<AuthShell systemName="OWL" layout={layout} backgroundUrl="/custom.png" />);
  for (const backgroundUrl of ['/custom.png', '']) {
    rerender(<AuthShell systemName="OWL" layout={layout} backgroundUrl={backgroundUrl} />);
    const main = container.querySelector('main');
    const panels = Array.from(main.children).filter((child) => ['ASIDE', 'SECTION'].includes(child.tagName));
    expect(panels.map((panel) => panel.tagName)).toEqual(
      layout === 'center' ? ['SECTION'] : layout === 'left-image' ? ['ASIDE', 'SECTION'] : ['SECTION', 'ASIDE']
    );
    if (layout === 'center') {
      expect(main.style.backgroundImage.includes('/custom.png')).toBe(Boolean(backgroundUrl));
    } else {
      expect(main.querySelector('aside')).toHaveClass('hidden', 'lg:block');
      expect(main.style.backgroundImage).toBe('');
    }
  }
});
it('shows a transparent form, branding link and configurable technology stack', () => {
  const { container, rerender } = render(<AuthShell systemName="OWL" footer="Powered by TBTParent" />);
  expect(container.querySelector('[data-slot="card"]')).toHaveStyle({ background: 'transparent', border: '0px', boxShadow: 'none' });
  expect(screen.getByRole('link')).toHaveAttribute('href', 'https://tbtparent.me');
  expect(screen.getByLabelText('技术栈')).toHaveTextContent('React · Ant Design · NestJS · Prisma · PostgreSQL');
  rerender(<AuthShell systemName="OWL" footer="Powered by TBTParent" showTechStack={false} />);
  expect(screen.queryByLabelText('技术栈')).not.toBeInTheDocument();
  expect(screen.getByRole('link')).toBeInTheDocument();
});
it('keeps a plain gray panel on the left when no custom image is configured', () => {
  const { container } = render(<AuthShell systemName="OWL" layout="left-image" />);
  const main = container.querySelector('main');
  expect(main.querySelector('aside')).not.toBeNull();
  expect(main.querySelector('aside').nextElementSibling.tagName).toBe('SECTION');
  expect(main.querySelector('aside')).toHaveClass('bg-muted');
  expect(main.querySelector('aside [style]')).toBeNull();
});
it('updates custom covers and falls back without losing the split layout', () => {
  const { container, rerender } = render(<AuthShell systemName="OWL" layout="left-image" backgroundUrl="/first.png" />);
  expect(container.querySelector('aside [style]').style.backgroundImage).toContain('/first.png');
  rerender(<AuthShell systemName="OWL" layout="left-image" backgroundUrl="/second.png" />);
  expect(container.querySelector('aside [style]').style.backgroundImage).toContain('/second.png');
  rerender(<AuthShell systemName="OWL" layout="right-image" backgroundUrl="" />);
  expect(container.querySelector('aside').previousElementSibling.tagName).toBe('SECTION');
  expect(container.querySelector('aside')).toHaveClass('bg-muted');
  expect(container.querySelector('aside [style]')).toBeNull();
});
