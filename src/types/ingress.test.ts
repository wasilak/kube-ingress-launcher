/**
 * Type validation tests for ingress type definitions
 * 
 * These tests verify that the TypeScript types are correctly defined
 * and match the expected structure from the requirements.
 */

import type { IngressData, ErrorInfo, Settings } from './ingress';

describe('Ingress Types', () => {
  it('should have valid IngressData type', () => {
    const ingress: IngressData = {
      id: 'test-id',
      name: 'test-ingress',
      namespace: 'default',
      hosts: ['example.com'],
      paths: ['/'],
      urls: ['https://example.com/'],
      annotations: {},
      creationTimestamp: new Date().toISOString(),
      tls: true,
      status: 'ready',
    };

    expect(ingress.id).toBe('test-id');
    expect(ingress.name).toBe('test-ingress');
  });

  it('should have valid ErrorInfo type', () => {
    const error: ErrorInfo = {
      message: 'Test error',
      details: 'Error details',
      timestamp: new Date().toISOString(),
    };

    expect(error.message).toBe('Test error');
  });

  it('should have valid Settings type', () => {
    const settings: Settings = {
      globalShortcut: 'CmdOrCtrl+Shift+K',
      refreshIntervalSecs: 60,
      autostart: true,
      kubeContext: 'test-context',
      theme: 'system',
    };

    expect(settings.theme).toBe('system');
  });
});
