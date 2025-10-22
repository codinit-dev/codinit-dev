/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * Test setup file for Vitest
 * Mocks import.meta.hot to prevent errors in test environment
 */

// Mock import.meta.hot for test environment
if (typeof import.meta.hot === 'undefined') {
  // @ts-expect

  Object.defineProperty(import.meta, 'hot', {
    value: {
      data: {},
      accept: () => {},
      dispose: () => {},
      decline: () => {},
      invalidate: () => {},
      on: () => {},
    },
    writable: true,
  });
}
