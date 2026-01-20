# Conversation Initialization

## Serena MCP Tool Bootstrap

At the start of EVERY conversation where you need to use Serena MCP tools for code analysis, symbol finding, or codebase navigation, you MUST:

1. **Call the `initial_instructions` tool first:**
   ```
   Use mcp_serena_initial_instructions to bootstrap Serena usage
   ```

2. **Why this matters:**
   - Serena tools provide powerful code analysis capabilities for elastauth codebase
   - The initial instructions contain essential information about how to use Serena effectively
   - Skipping this step may result in incorrect tool usage or missed capabilities
   - This ensures you have the latest guidance on Serena tool usage

3. **When to use Serena tools for elastauth:**
   - Finding symbols (structs, functions, methods) in the Go codebase
   - Understanding elastauth's current architecture and relationships
   - Searching for patterns across Go files
   - Analyzing symbol references and dependencies in libs/, cache/, etc.
   - Making precise code modifications at the symbol level
   - Understanding current provider implementations and interfaces

4. **After calling initial_instructions:**
   - Review the instructions provided
   - Apply the guidance to your subsequent Serena tool calls
   - Use the appropriate tools for the task at hand

## Example Workflow for elastauth

```
1. User asks to implement auth provider feature
2. Call mcp_serena_initial_instructions
3. Use Serena tools to explore elastauth codebase structure
4. Analyze current libs/routes.go and provider patterns
5. Implement the feature using appropriate tools
6. Verify integration and functionality
```

Remember: This is a one-time call per conversation, but it's CRITICAL for effective Serena usage with the elastauth codebase.