---
description: "Brainstorm and design a new game feature — from creative ideation through implementation plan. Generates multiple ideas rated by creativity/complexity/impact, then converges on the best one with a concrete prototype plan."
agent: "game-designer"
model: "Claude Sonnet 4 (copilot)"
argument-hint: "Type of feature: mechanic, power-up, visual effect, progression, monetization, or describe freely"
tools: [read, edit, search, execute, web, todo]
---

<goal>
Generate creative game feature ideas for the Neon Drift / flappy-neon project, evaluate them against the game's design pillars, and produce a concrete implementation plan for the winner(s).

The agent MUST load the `game-designing` skill before starting the workflow.
</goal>

<input-requirements>
The user provides one of:
- A **feature category**: `mechanic`, `power-up`, `visual-effect`, `progression`, `monetization`, `engagement-loop`
- A **free-form description** of a problem or desire (e.g., "players quit after 3 games", "needs more replayability")
- A **reference** to another game's feature (e.g., "something like Crossy Road's gift system")

If the user provides no input, default to brainstorming a new **core mechanic** that increases session length.
</input-requirements>

## Required Skills

- `game-designing` — Game design patterns library: engagement loops, juice checklist, balancing frameworks, monetization patterns. Load FIRST to ground all ideas in proven design patterns.

## Workflow

1. **Analyze current state** — Read the game codebase (`public/index.html`) to understand existing mechanics, rendering pipeline, and game state structure.

2. **Diverge** — Generate **5+ feature ideas** spanning the creativity spectrum:
   - 🟢 **Safe** (1-2 ideas): Low-risk, proven patterns from similar games
   - 🟡 **Bold** (2-3 ideas): Interesting twists that push boundaries
   - 🔴 **Wild** (1-2 ideas): Experimental, potentially genre-bending concepts

3. **Evaluate** each idea in a table:
   | Idea | Creativity | Complexity (S/M/L) | Player Impact | Fits Neon Aesthetic | One-Thumb Compatible |
   |------|-----------|---------------------|---------------|--------------------|--------------------|

4. **Converge** — Recommend top 1-3 ideas with rationale tied to engagement metrics (session length, return rate, virality).

5. **Prototype plan** — For the winning idea(s), produce:
   - Step-by-step implementation plan referencing specific code locations
   - Key code snippets showing the core mechanic
   - Visual/audio feedback layer (juice)
   - Balancing parameters with suggested starting values

<constraints>
- All features MUST work with one-thumb tap/hold controls
- Zero external dependencies — vanilla JS only
- Must target 60fps on mid-range mobile devices
- No pay-to-win — monetization must be cosmetic/convenience only
- Must work on both Poki (web) and Capacitor (mobile) platforms
- Respect the neon/synthwave visual identity
</constraints>
