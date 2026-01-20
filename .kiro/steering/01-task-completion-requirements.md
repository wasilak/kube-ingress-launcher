# Task Completion Requirements

When implementing tasks from kube-ingress-desktop specs, you MUST follow these completion criteria:

## Critical Thinking After Implementation

- After completing any task implementation, ALWAYS critically evaluate whether the code is functional or dead code
- Ask yourself: "Is this code actually being used anywhere in the elastauth application?"
- Verify integration points: Check if the implemented functionality is imported and called
- Search the elastauth codebase for actual usage of new structs, functions, or packages
- If code is not integrated, identify ALL places where it should be used and integrate it fully
- Don't just implement infrastructure - ensure it's wired into the application flow
- Reference your steering rules to ensure you're following Go best practices for elastauth
- Ensure new auth providers are properly registered and can be selected via configuration

## Build Verification

- Always run `cargo build` for Rust backend and `npm run build` for frontend after implementing code changes
- Fix ALL build errors before marking a task as complete
- Address ALL build warnings before marking a task as complete
- A task is NOT complete if the build fails or produces warnings
- Verify that the Tauri application builds successfully with new changes: `npm run tauri build`
- Test that the application starts correctly in development mode: `npm run tauri dev`

## Test Verification

- Run `cargo test` to verify Rust backend tests pass
- Run `npm test` to verify React frontend tests pass
- Fix any failing tests before marking task complete
- Add unit tests for new Rust functions and React components
- Add property-based tests for core logic (using proptest for Rust, fast-check for TypeScript)
- Test Tauri commands work correctly with IPC communication
- Verify Kubernetes client integration works with test clusters

## Git Commit Requirement

- After each task is successfully implemented and verified, AUTOMATICALLY commit the changes
- Use a descriptive commit message that includes:
  - Type prefix (feat:, fix:, refactor:, etc.)
  - Brief description of what was implemented
  - Reference to the task number or name
- Stage all relevant files before committing
- Example: `feat: implement pluggable auth provider interface\n\nTask: 1.2 Create AuthProvider interface and factory`
- Commit immediately after verification steps pass, do not wait for user approval

## Verification Steps

1. Implement the code changes
2. Run `cargo build` (backend) and `npm run build` (frontend) to verify builds succeed
3. Run `cargo test` (backend) and `npm test` (frontend) to verify tests pass
4. Test the application in development mode: `npm run tauri dev`
5. Verify the application starts successfully and features work as expected
6. Fix any errors or warnings that appear
7. Re-run builds and tests to confirm all issues are resolved
8. Mark the task as complete
9. AUTOMATICALLY commit the changes with a descriptive message

## Integration Points

- Ensure Rust backend integrates properly with Tauri commands
- Verify React components communicate correctly with backend via IPC
- Test Kubernetes client integration with kube-rs
- Ensure state management works correctly with Arc<RwLock<T>>
- Verify background refresh task runs without blocking UI
- Test that window management (show/hide, focus) works correctly
- Ensure global shortcut registration works on macOS
- Test settings persistence with tauri-plugin-store

## Why This Matters

- Ensures code integrates properly with the Tauri application architecture
- Catches Rust compilation errors, TypeScript type errors, and integration issues early
- Maintains production-ready code quality
- Prevents broken builds from being committed
- Creates a clear history of development progress
- Makes it easy to track progress and revert changes if needed
- Ensures the application remains functional at every step