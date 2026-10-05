import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } });
}
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) HTMLElement.prototype.scrollIntoView = () => {};

// JSDOM cannot measure pseudo-element scrollbar styles; preserve real element styles.
if (typeof window !== 'undefined') {
  const getComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = (element) => getComputedStyle(element);
}

afterEach(cleanup);
