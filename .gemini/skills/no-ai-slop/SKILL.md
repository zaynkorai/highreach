---
name: no-ai-slop
description: Zero tolerance for AI-generated slop and lazy patterns
---
# No AI Slop

## Banned Patterns

1. **No filler comments** — never write `// This function does X` above a function named `doX`. Comments explain *why*, not *what*.
2. **No placeholder implementations** — never write `// TODO: implement` and move on. Implement it or don't create it.
3. **No unnecessary abstractions** — don't create a factory/wrapper/manager class when a plain function works.
4. **No verbose boilerplate** — don't generate 50 lines when 10 do the job.
5. **No echo responses** — don't restate the user's request back. Just do the work.
6. **No hallucinated APIs** — verify every import, method, and type exists before using it.
7. **No shotgun fixes** — don't change 5 files hoping one fixes the bug. Understand the root cause first.
8. **No copy-paste sprawl** — if you wrote similar code twice, extract it.
9. **No fake error handling** — `catch (e) { console.log(e) }` is not handling.
10. **No over-commenting** — code should be self-documenting. Comment only non-obvious logic.
11. **No dual color headings**
