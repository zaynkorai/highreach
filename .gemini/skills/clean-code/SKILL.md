---
name: clean-code
description: KISS-driven clean code standards for all files
---
# Clean Code

## Rules

1. **KISS** — simplest solution that works. No over-engineering without permissions
2. **Files < 400 lines** — split if approaching limit.
3. **Small units** — functions < 40 lines, classes < 200 lines, one job each.
4. **Strict types** — no `any`, no implicit types, no type assertions unless unavoidable.
5. **No code smells** — fix immediately on sight:
   - Dead code → delete
   - Magic numbers → named constants
   - Deep nesting → early returns / extract function
   - God functions/classes → split by responsibility
   - Duplicate logic → extract shared util
   - Long parameter lists → use options object
   - Commented-out code → delete
6. **Naming** — descriptive, no abbreviations. Boolean vars start with `is/has/should/can`.
7. **Imports** — no circular deps, no barrel re-exports unless justified.
8. **Error handling** — typed errors, no silent catches, no `catch(e) {}`.
