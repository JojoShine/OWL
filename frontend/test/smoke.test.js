import { describe, expect, it } from 'vitest';

describe('ui test environment', () => {
  it('provides a browser-like document', () => {
    const node = document.createElement('div');
    node.textContent = 'Owl 管理平台';
    document.body.appendChild(node);
    expect(node).toHaveTextContent('Owl 管理平台');
  });
});
