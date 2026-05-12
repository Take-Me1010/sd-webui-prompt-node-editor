---
paths:
  - javascript/**/*.js
  - types/*.d.ts
---
# JavaScript Code Style

## types
- Use JSDoc comments to specify types for functions, parameters, and return values.
- For complex types, define them in separate `.d.ts` files in the `types/` directory.

## General
- Use `const` for variables that are not reassigned, and `let` for variables that are reassigned. Avoid using `var`.
- Use arrow functions (`() => {}`) for anonymous functions and callbacks.
- Use `undefined` instead of `null` to indicate the absence of a value.
- Avoid global variables.
