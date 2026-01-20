# Phase Gate Discipline

## Mandatory Phase Gates

This project follows **strict incremental development** with mandatory phase gates. This discipline prevents catastrophic over-engineering that can break implementations.

## Phase Gate Rules

### 1. Sequential Development
- **NEVER** start Phase N+1 until Phase N gate passes
- **NEVER** implement features from future phases
- **NEVER** add "nice to have" features not in current phase spec

### 2. Gate Requirements

Every phase gate requires:

1. ✅ **All tasks complete** - Every task in `tasks.md` marked done
2. ✅ **Build succeeds** - `cargo build` and `npm run build` complete without errors or warnings
3. ✅ **Tests pass** - `cargo test` and `npm test` pass all tests
4. ✅ **Manual testing complete** - 100% of manual testing checklist passes
5. ✅ **Previous phases work** - Earlier phases still function correctly
6. ✅ **Git tag created** - Phase tagged for easy rollback

### 3. Gate Failure Protocol

If ANY gate requirement fails:

1. **STOP** - Do not proceed to next phase
2. **FIX** - Address the failing requirement
3. **RE-TEST** - Verify the fix works
4. **DOCUMENT** - Note what failed and how it was fixed
5. **RETRY GATE** - Re-run full gate checklist

### 4. No Scope Creep

During phase implementation:

- ❌ "While I'm here, let me add..."
- ❌ "This would be better if..."
- ❌ "Let me refactor this to be more flexible..."
- ✅ "Does this task spec require this? No? Then don't do it."

## Why This Matters

### Previous Success Pattern
Successful projects are built:
- Incrementally on working foundation
- Each feature added to working system
- Backward compatibility maintained
- Simple before complex

### This Approach
- Build on solid foundation
- Add features without breaking existing functionality
- Verify each component works before adding next
- Working code always
- Result: **Functional at every phase**

## Manual Testing Discipline

### Manual Testing is Mandatory
- Automated tests come later or complement manual tests
- Manual testing proves it works with real systems
- User performs manual testing
- Agent provides clear test instructions

### Manual Test Checklist Format
```markdown
## Phase N Gate: Manual Testing

- [ ] Test 1: Basic functionality works
  - Setup: Configure application
  - Command: `npm run tauri dev`
  - Expected: Application starts and displays window
  
- [ ] Test 2: Feature X works correctly
  - Setup: Prepare test data
  - Action: Perform user action
  - Expected: Correct behavior observed
```

### Passing Manual Tests
- **ALL** checklist items must pass
- **NO** "mostly works" or "good enough"
- **NO** "I'll fix it later"
- **YES** "Every item passes completely"

## Git Tagging

### Tag Format
- Phase 1: `phase-1-complete`
- Phase 2: `phase-2-complete`
- etc.

### Why Tag
- Easy rollback if next phase breaks things
- Clear progress markers
- Reference points for debugging

### Tagging Command
```bash
git tag -a phase-1-complete -m "Phase 1: [Description] - GATE PASSED"
git push origin phase-1-complete
```

## Communication

### When Completing Phase
Agent should say:
```
Phase N implementation complete. Ready for gate testing.

Manual Testing Checklist:
- [ ] Test 1...
- [ ] Test 2...

Please run these tests and confirm all pass before we proceed to Phase N+1.
```

### When Gate Passes
User confirms, then agent:
```
Phase N gate PASSED ✅

Tagging: phase-N-complete
Next: Phase N+1 - [Description]

Ready to proceed?
```

### When Gate Fails
```
Phase N gate FAILED ❌

Failed test: [description]
Issue: [what went wrong]

Fixing now...
```

## Discipline Checklist

Before starting any task, ask:

- [ ] Is this task in the current phase spec?
- [ ] Have all previous phase gates passed?
- [ ] Am I adding features not in the spec?
- [ ] Am I over-engineering the solution?
- [ ] Is this the simplest approach that works?
- [ ] Will this break existing functionality?

If any answer is wrong, **STOP** and reconsider.

## Testing Requirements

### Build Testing
- Test with `cargo build` for Rust backend
- Test with `npm run build` for frontend
- Test with `npm run tauri build` for full application
- Test in development mode: `npm run tauri dev`

### Integration Testing
- Test Tauri commands work correctly
- Test IPC communication between frontend and backend
- Test state management works correctly
- Test background tasks run without blocking UI
- Test error scenarios

## Remember

**The goal is working software at every step, not impressive architecture that might work someday.**

Build incrementally. Test thoroughly. Pass gates. Repeat.
