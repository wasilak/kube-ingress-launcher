/**
 * Type validation tests for ingress type definitions
 * 
 * These tests verify that the TypeScript types are correctly defined
 * and match the expected structure from the requirements.
 */

import type { IngressData, ErrorInfo, Settings, IngressResponse } from './ingress';

// Test IngressData type
const testIngressData: IngressData = {
  id: 'test-id-123',
  name: 'test-ingress',
  namespace: 'default',
  hosts: ['example.com', 'www.example.com'],
  paths: ['/api', '/web'],
  urls: ['https://example.com/api', 'https://example.com/web'],
  annotations: {
    'nginx.ingress.kubernetes.io/rewrite-target': '/',
    'custom.annotation': 'value',
  },
  creationTimestamp: '2024-01-15T10:30:00Z',
  tls: true,
  status: 'ready',
  labels: {
    app: 'example',
    environment: 'production',
  },
};

// Test IngressData without optional fields
const minimalIngressData: IngressData = {
  id: 'test-id-456',
  name: 'minimal-ingress',
  namespace: 'default',
  hosts: [],
  paths: [],
  urls: [],
  annotations: {},
  creationTimestamp: '2024-01-15T10:30:00Z',
  tls: false,
  status: 'unknown',
};

// Test ErrorInfo type
const testErrorInfo: ErrorInfo = {
  message: 'Failed to connect to Kubernetes cluster',
  details: 'Connection timeout after 30 seconds',
  timestamp: '2024-01-15T10:35:00Z',
};

// Test ErrorInfo without optional fields
const minimalErrorInfo: ErrorInfo = {
  message: 'An error occurred',
  timestamp: '2024-01-15T10:35:00Z',
};

// Test Settings type
const testSettings: Settings = {
  globalShortcut: 'CmdOrCtrl+Shift+K',
  refreshIntervalSecs: 60,
  autostart: true,
  kubeContext: 'production-cluster',
};

// Test IngressResponse type
const testIngressResponse: IngressResponse = {
  ingresses: [testIngressData, minimalIngressData],
  error: testErrorInfo,
  lastUpdated: '2024-01-15T10:40:00Z',
};

// Test IngressResponse with null values
const emptyIngressResponse: IngressResponse = {
  ingresses: [],
  error: null,
  lastUpdated: null,
};

// Test status enum values
const statusValues: Array<IngressData['status']> = ['ready', 'pending', 'error', 'unknown'];

// Verify type exports work
export type {
  IngressData,
  ErrorInfo,
  Settings,
  IngressResponse,
};

// This file is for type checking only - no runtime code
// Use all test variables to avoid unused variable warnings
console.log('Type definitions validated successfully', {
  testIngressData,
  minimalIngressData,
  testErrorInfo,
  minimalErrorInfo,
  testSettings,
  testIngressResponse,
  emptyIngressResponse,
  statusValues,
});
