# Workflow

- Runs long exploratory "vibe session" branches, then asks to _formalize_ them: record everything done since the session started into specs split by their own concern/scope, and back it with tests covering everything (TDD). Confidence: 0.8
- Executes work from a plan file: hands over the plan and says "implement the plan as specified", with standing rules — do not edit the plan file, do not recreate the already-created to-dos, mark each to-do in_progress while working, and keep going until all to-dos are done. Confidence: 0.9
- PR loop: open/promote the PR → ask Copilot and OpenCode to review → fix the must-fix / should-fix / nits from review feedback → get CI green → merge. Confidence: 0.85
- Frequently asks the agent to (re)start the local dev server; expects it running on a known fixed port and keeps that port (5174) unless something like a cached PWA forces a change. Confidence: 0.65
- Gives UI feedback by selecting the exact element in the browser preview (screenshot + DOM path/class) instead of describing it in prose. Confidence: 0.8
- Iterates through many small, sequential tweak requests, expecting one change applied and verified at a time rather than a big batch. Confidence: 0.75
- Prefers unused components to stay in the codebase with their usages removed (kept for later reuse) instead of being deleted. Confidence: 0.6
- When a change breaks the app, reverts to a specific last-working commit rather than debugging forward from the broken state. Confidence: 0.6
- Prefers consolidating multiple closely related changes in the same feature area into one spec, rather than maintaining separate specs for each small concern. Confidence: 0.9
- Prefers committing a completed work slice before moving on to other branch/task work. Confidence: 0.8
- When unwanted changes are still uncommitted, prefers fully undoing/removing them rather than preserving them as deprecated records, so the worktree and identifiers can return to their prior reusable state. Confidence: 0.8
