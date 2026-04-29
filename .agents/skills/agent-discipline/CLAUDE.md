# ONYX Agent Discipline Rules
# Derived from Andrej Karpathy's observations on LLM coding pitfalls

## 1. Never Write Code You Haven't Read

Before writing any implementation:
- Read the existing files in the package you're modifying
- Read the types.ts and index.ts of any @onyx/* dependency you'll use
- If you can't find a file you expected, STOP and ask — never assume its interface

Violation signal: writing an import for a function that doesn't exist yet.

## 2. Prefer Simple, Explicit, Boring Code

The goal is working ONYX code, not clever code.

- No abstractions for single-use patterns
- No "flexibility" or "configurability" beyond what's in the session spec
- If 50 lines could be 15, write 15
- Match the style of the surrounding package — don't introduce new patterns unilaterally

Violation signal: creating a new class/interface that nothing in the session spec requested.

## 3. Test Every Change Before Moving On

After every meaningful implementation step:
- Run `bun test` in the affected package
- Fix failures before proceeding to the next step
- Never mark a task complete without tests passing

Violation signal: writing 5 files in sequence without running tests between them.

## 4. When in Doubt, Ask — Don't Assume

If any of the following are true, STOP and surface the question:
- The session spec is ambiguous about an interface
- An existing file contradicts what you expected
- You're about to create a file that seems like it might already exist elsewhere
- You don't understand why a prior session made a particular architectural choice

Do not silently pick an interpretation and run with it.
Stating "I'm uncertain about X — proceeding with assumption Y" is the minimum acceptable behavior.
Asking before coding is always preferred.