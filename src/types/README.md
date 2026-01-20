# TypeScript Type Definitions

This directory contains TypeScript type definitions for the Kubernetes Ingress Desktop Search application.

## Files

- `ingress.ts` - Core type definitions for ingress data, errors, settings, and responses

## Type Definitions

### IngressData

Represents a Kubernetes ingress resource with extracted information.

**Requirements Coverage:**
- Requirement 5.1: All required fields (id, name, namespace, hosts, paths, urls, annotations, creationTimestamp, tls, status, labels)
- Requirements 15.1-15.10: Matches Kubernetes ingress structure

**Fields:**
- `id`: Unique identifier from `metadata.uid`
- `name`: Ingress name from `metadata.name`
- `namespace`: Namespace from `metadata.namespace`
- `hosts`: Hosts from `spec.rules[].host` and `spec.tls[].hosts` (deduplicated)
- `paths`: Paths from `spec.rules[].http.paths[].path`
- `urls`: Complete URLs (protocol + host + path)
- `annotations`: User-defined annotations (filtered)
- `creationTimestamp`: ISO 8601 timestamp from `metadata.creationTimestamp`
- `tls`: Boolean indicating TLS configuration presence
- `status`: Enum ('ready' | 'pending' | 'error' | 'unknown')
- `labels`: Optional labels from `metadata.labels`

### ErrorInfo

Error information for displaying errors to users.

**Requirements Coverage:**
- Requirements 11.1-11.9: Error handling and resilience

**Fields:**
- `message`: User-friendly error message
- `details`: Optional detailed error information
- `timestamp`: ISO 8601 timestamp when error occurred

### Settings

Application settings configuration.

**Requirements Coverage:**
- Requirements 9.1-9.20: Settings and configuration

**Fields:**
- `globalShortcut`: Global keyboard shortcut (e.g., "CmdOrCtrl+Shift+K")
- `refreshIntervalSecs`: Background refresh interval in seconds (10-3600)
- `autostart`: Whether to start on system login
- `kubeContext`: Active Kubernetes context name

### IngressResponse

Response from `get_ingresses` Tauri command.

**Requirements Coverage:**
- Requirements 7.1-7.10: Search and display interface

**Fields:**
- `ingresses`: List of ingress resources
- `error`: Error information if last refresh failed (nullable)
- `lastUpdated`: ISO 8601 timestamp of last successful update (nullable)

## Type Safety

All types are fully typed with TypeScript and match the Rust backend data models defined in `src-tauri/src/state/app_state.rs`.

The types use:
- `Record<string, string>` for key-value maps (annotations, labels)
- String literal unions for enums (status)
- Optional fields with `?` for nullable data
- ISO 8601 string format for timestamps

## Usage

Import types in your React components:

```typescript
import type { IngressData, ErrorInfo, Settings, IngressResponse } from './types/ingress';
```

## Validation

Run TypeScript type checking:

```bash
npx tsc --noEmit
```

Build the application:

```bash
npm run build
```
