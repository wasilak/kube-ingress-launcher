---
inclusion: always
---

# Context7 MCP Tools for Research and Development

## Mandatory Context7 Usage

During research and development phases, you MUST use Context7 MCP tools to gather up-to-date information about libraries, frameworks, and technologies.

## When to Use Context7 Tools

### Research Phase Requirements
- **ALWAYS** use Context7 when researching new libraries or frameworks
- **ALWAYS** use Context7 when investigating integration approaches
- **ALWAYS** use Context7 when looking up current best practices
- **ALWAYS** use Context7 when checking for updated APIs or configuration patterns

### Specific Use Cases

1. **Tauri Framework Research**
   - Research Tauri v2 best practices and patterns
   - Investigate IPC communication patterns
   - Look up plugin usage and configuration
   - Research macOS-specific features and permissions

2. **Rust Ecosystem Research**
   - Research tokio async patterns
   - Investigate kube-rs (Kubernetes client) usage
   - Look up error handling with thiserror
   - Research state management patterns

3. **React and TypeScript Research**
   - Research React 19 hooks and patterns
   - Investigate Mantine UI component usage
   - Look up TypeScript best practices
   - Research testing-library patterns

4. **Testing Framework Research**
   - Research proptest (property-based testing for Rust)
   - Investigate fast-check (property-based testing for TypeScript)
   - Look up testing strategies for Tauri applications
   - Research integration testing patterns

## Context7 Tool Usage Pattern

### Step 1: Resolve Library ID
```
Use mcp_context7_resolve_library_id to find the correct library
- Provide clear library name (e.g., "starlight", "oauth2", "oidc")
- Include context about your use case
- Select the most relevant result based on reputation and snippets
```

### Step 2: Query Documentation
```
Use mcp_context7_query_docs with the resolved library ID
- Ask specific questions about implementation
- Request configuration examples
- Look for best practices and common patterns
```

### Research Quality Standards

**Comprehensive Research**:
- Don't rely on outdated knowledge - always check current documentation
- Use Context7 to verify API changes and new features
- Research multiple approaches before making implementation decisions

**Documentation Integration**:
- Include Context7 findings in design decisions
- Reference current documentation in implementation comments
- Update elastauth documentation based on latest best practices

## Priority Research Topics

1. **Tauri Architecture**
   - Tauri v2 application structure
   - IPC communication best practices
   - State management patterns
   - Plugin system usage

2. **Rust Async Programming**
   - Tokio runtime patterns
   - Async/await best practices
   - Background task management
   - Error handling in async contexts

3. **Kubernetes Client (kube-rs)**
   - kube-rs API usage
   - Kubeconfig loading and context switching
   - Resource watching and listing
   - Error handling and retry logic

4. **React Component Patterns**
   - React 19 hooks patterns
   - Custom hook design
   - Component composition
   - Performance optimization

5. **Testing Strategies**
   - Property-based testing with proptest and fast-check
   - Integration testing for Tauri applications
   - Component testing with testing-library
   - Mocking strategies

### Research Documentation

**Document Findings**:
- Include Context7 research results in design documents
- Reference specific library versions and features
- Note any breaking changes or migration requirements

**Share Knowledge**:
- Update steering rules based on research findings
- Include research-based recommendations in code comments
- Document decision rationale based on current best practices

## Integration with Development Workflow

### Before Implementation
1. **Research Phase**: Use Context7 to understand current best practices
2. **Design Phase**: Incorporate research findings into design decisions
3. **Implementation Phase**: Reference current documentation during coding

### During Implementation
- Use Context7 to resolve specific implementation questions
- Look up current API patterns and examples
- Verify configuration options and parameters

### After Implementation
- Use Context7 to research testing best practices
- Look up deployment and monitoring patterns
- Research performance optimization techniques

## Quality Assurance

### Research Validation
- Cross-reference multiple sources when possible
- Verify information with official documentation
- Check for recent updates or breaking changes

### Implementation Validation
- Test implementations against current library versions
- Validate configuration against current documentation
- Ensure compatibility with latest best practices

## Remember

**Stay Current**: Technology moves fast. Context7 helps ensure elastauth uses current best practices and avoids deprecated patterns.

**Research First**: Before implementing any new feature or integration, research the current state of the technology using Context7.

**Document Decisions**: Include research findings in design documents and code comments to help future maintainers understand the rationale.

The goal is to build elastauth using the most current and appropriate technologies, patterns, and best practices available.