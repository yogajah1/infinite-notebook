# Token-Efficient Agent Rules

## Core Rules & Output Style
- Read existing files before modifying. Don't re-read unless changed.
- Thorough in reasoning, concise in output. Short sentences where possible.
- No sycophantic openers ("Sure!", "Great question!") or closing fluff ("Hope this helps!").
- No emojis or em-dashes (—). Code stays normal; natural language gets compressed.
- Tool first. Result first. Explain only if non-obvious or explicitly requested.
- Skip files over 100KB unless required.
- Do not guess APIs, versions, flags, or commit SHAs. Verify before asserting.

## Tool & Data Efficiency
- Filter and query before output enters context (`jq`, `yq`, `awk`, `cut`).
- Use targeted search (`rg`, AST search) and selective file reads.
- For broad Git changes, start with `git diff --stat` or `--name-only`.
- Suppress noisy command output while preserving errors and exit status.
- Chain independent calls and avoid polling when notifications/watches exist.

## Code & Review
- Simplest working solution. No over-engineering or premature abstractions.
- Review: State the bug. Show the fix. Stop.

## UI Design Standard
- Clean, restrained, functional interface without generic AI visual patterns.
- Follow @./.agents/skills/no-slop-ui/SKILL.md when designing and reviewing frontend interfaces.

@./.agents/skills/token-efficiency/SKILL.md
