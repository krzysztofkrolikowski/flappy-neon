---
name: game-designing
description: "Game design patterns library — engagement loops, juice/game-feel checklist, balancing frameworks, progression curve templates, monetization patterns, and hyper-casual design heuristics. Use when brainstorming game features, designing mechanics, balancing difficulty, adding juice effects, creating progression systems, or evaluating monetization strategies for mobile/web games."
---

# Game Designing

Proven game design patterns, checklists, and frameworks for mobile/web game development. Loaded by the `game-designer` agent to ground creative ideation in established design theory.

## Engagement Loop Patterns

Every successful game has nested loops that keep players engaged at different time scales:

### Micro Loop (seconds)
**Input → Feedback → Reward**
- Player taps → bird flaps → satisfying animation + sound
- Obstacle cleared → score tick + particle burst + screen pulse
- Key principle: **< 200ms from input to feedback** or it feels sluggish

### Core Loop (minutes)
**Challenge → Risk/Reward → Escalation → Death → Retry**
- Difficulty increases → player enters flow state → inevitable death → "one more try"
- Each run must feel slightly different (procedural generation, dynamic obstacles)
- Target session: **2-5 minutes** per run for hyper-casual

### Meta Loop (days/weeks)
**Progress → Unlock → Goal → Return**
- Coins earned → save toward unlock → cosmetic reward → show off
- Daily challenges → streak bonus → loss aversion keeps them returning
- Seasonal themes → FOMO → re-engagement

### Engagement Hook Formulas

| Hook Type | Pattern | Example |
|-----------|---------|---------|
| **Near-miss** | Show how close the player was to beating their record | "1 point away from high score!" |
| **Loss aversion** | Streaks, daily rewards that reset | "Day 5 streak — don't lose it!" |
| **Social proof** | Leaderboard, ghost replays | "Beat Player X's score of 42" |
| **Variable reward** | Random loot, mystery boxes | "Spin the wheel for a free skin" |
| **Mastery signal** | Skill-based unlocks, achievement badges | "Perfect run — no touches!" |

## Juice / Game-Feel Checklist

"Juice" = the excess of feedback that makes interactions feel satisfying. Apply this checklist to every new mechanic:

### Visual Feedback
- [ ] **Screen shake** on impact (intensity: 3-8px, duration: 100-200ms, ease-out)
- [ ] **Color flash** on key events (white flash 50ms → fade)
- [ ] **Particle burst** on score/collect/death (8-20 particles, random velocity, fade-out)
- [ ] **Trail effect** on moving objects (alpha decay, 3-6 ghost frames)
- [ ] **Scale bounce** on UI changes (1.0 → 1.3 → 1.0, ease-out-elastic, 200ms)
- [ ] **Glow pulse** on neon elements (sin wave on shadow blur, 1-3s cycle)
- [ ] **Slow-motion** on near-miss or death (timescale → 0.3 for 300ms)

### Audio Feedback
- [ ] **Pitch variation** on repeated sounds (±10% random pitch per play)
- [ ] **Layered SFX** — bass thump + sparkle + voice line
- [ ] **Musical sync** — events quantized to the beat if music is playing
- [ ] **Crescendo** — sound intensity increases with combo/streak
- [ ] **Silence beat** — brief audio dip before major impact (anticipation)

### Input Feel
- [ ] **Input buffering** — accept tap up to 50ms before it matters
- [ ] **Coyote time** — allow action 50-100ms after leaving valid state
- [ ] **Ease curves** — never use linear movement; ease-out for natural feel
- [ ] **Haptic feedback** — vibrate on mobile (short: 10ms tap, long: 50ms impact)

## Balancing Framework

### Difficulty Curve Templates

**Linear** (boring — avoid):
```
difficulty = baseValue + (score × increment)
```

**Logarithmic** (hyper-casual standard — recommended):
```
difficulty = baseValue + log(score + 1) × multiplier
```

**Step function** (milestone-based):
```
difficulty = baseLevels[Math.min(Math.floor(score / milestone), maxLevel)]
```

**Adaptive** (advanced — adjusts to player skill):
```
if (deathsRecent > threshold) difficulty *= 0.95  // ease up
if (streakCurrent > threshold) difficulty *= 1.05  // push harder
```

### Balancing Parameters Checklist

When adding any new mechanic, define these knobs:

| Parameter | Purpose | Example Range |
|-----------|---------|---------------|
| `spawnRate` | How often the element appears | 0.01 – 0.1 per frame |
| `duration` | How long the effect lasts | 3 – 10 seconds |
| `magnitude` | Strength of the effect | 1.2× – 2.0× multiplier |
| `cooldown` | Minimum time between occurrences | 10 – 30 seconds |
| `probability` | Chance of spawning | 5% – 20% |
| `stackable` | Can effects combine? | boolean |

**Golden rule**: Every parameter should be a constant at the top of the function, not a magic number inline.

## Progression System Patterns

### Currency Design
- **Soft currency** (coins): Earned freely in gameplay, spent on cosmetics
- **Premium currency**: Only from rewarded ads or real money — NEVER required for gameplay
- **NO pay-to-win**: Power-ups that affect gameplay must be earnable through play

### Unlock Tiers

| Tier | Cost (coins) | Content Type | Player % |
|------|-------------|--------------|----------|
| Starter | 0–100 | Basic skins, colors | 100% |
| Common | 100–500 | Themed skins, trails | 60% |
| Rare | 500–2000 | Animated skins, effects | 25% |
| Epic | 2000–10000 | Unique mechanics (cosmetic) | 5% |

**Earn rate target**: Players should unlock a Starter item every 3-5 sessions, Common every 10-15 sessions.

### Daily Challenge Framework
- **3 challenges per day**: Easy (play 3 games), Medium (score 20+), Hard (collect 15 coins in 1 run)
- **Streak bonus**: Completing all 3 → streak counter + bonus coins
- **Weekly reset**: Mega-challenge for premium reward

## Monetization Patterns (Ethical)

### Rewarded Ads
- **Continue run**: Watch ad → revive once per run (most common, highest revenue)
- **Double coins**: Watch ad → 2× coins for that run
- **Mystery box**: Watch ad → random cosmetic unlock chance
- **Timing**: NEVER interrupt gameplay. Only offer on death screen or in menu.

### Interstitial Ads
- Show after every 3rd death (not every death — too aggressive)
- NEVER during gameplay
- Skip option after 5 seconds minimum

### IAP (In-App Purchase)
- **Ad removal**: One-time purchase, removes interstitials
- **Coin packs**: Shortcut to unlock cosmetics faster
- **NEVER sell gameplay advantages**

## Hyper-Casual Design Heuristics

1. **3-second rule**: Player must understand the core mechanic within 3 seconds of first play
2. **One input**: Tap, hold, or swipe — never combinations
3. **Instant restart**: < 500ms from death to playing again
4. **Visual clarity**: Player must always know what to do from visuals alone (no text tutorials)
5. **Satisfying failure**: Death should feel dramatic, not frustrating (explosions > fade to black)
6. **Escalating stakes**: Each second alive should feel more tense than the last
7. **Shareability**: Generate moments worth screenshotting (near-misses, high scores, rare skins)

## Platform Considerations

### Web (Poki)
- Poki SDK gameplay events: `PokiSDK.gameplayStart()` / `gameplayStop()`
- Ad breaks: `PokiSDK.commercialBreak()` between sessions
- Rewarded: `PokiSDK.rewardedBreak()` with callback
- No IAP — monetization is ad-only on Poki

### Mobile (Capacitor)
- AdMob via `@capacitor-community/admob`
- Haptic feedback via Capacitor Haptics plugin
- Local storage for save data (no server needed)
- App Store guidelines: no manipulative monetization for kids
