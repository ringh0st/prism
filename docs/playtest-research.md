# Playtest research: first session, variety, and players of all ages

Research done in November 2026 after three testers scored the game low ("not clear at the start", "monotonous").
Most fetches of full papers failed, so this is based on search summaries. The strongest sources are peer-reviewed
(CHI 2012, JMIR, York/Heliyon 2023, UW preschool prompts, CoG 2019); the rest are practitioner blogs.

## What the research says

- **Teach by doing.** Up-front tutorials barely changed engagement in simple games, including the beam puzzle
  *Refraction*; teaching in context works better ([Andersen et al., CHI 2012](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/)).
  Get to the core action within 30–60 seconds ([Unity FTUE tips](https://unity.com/how-to/10-first-time-user-experience-tips-games)).
- **Monotony** comes from a flat difficulty curve and generated levels without intent. Use a sawtooth curve where
  the dips bring something new ([CoG 2019](https://arxiv.org/abs/1905.06379)); give each mechanic an arc:
  introduce, develop, twist, conclude ([Nintendo, MCV](https://www.mcvuk.com/development/video-nintendos-level-design-secrets-in-four-steps));
  a good puzzle has a "catch" ([GMTK notes](https://notes.hamatti.org/gaming/puzzle-game-design)).
- **Older adults** like puzzle games best and prefer slow pacing with a mental challenge
  ([JMIR 2017](https://games.jmir.org/2017/2/e8)). Their complaints are small objects, time limits, unclear rules,
  fast pace ([JMIR 2021](https://games.jmir.org/2021/2/e24449)). Clutter costs them more working memory
  ([York 2023](https://eprints.whiterose.ac.uk/202684/)). Big targets, wide spacing.
- **ADHD:** a clear, visible goal, direction arrows, uncluttered screens, visible progress, immediate rewards.
- **Young kids:** audio prompts, concrete icons, tap only ([UW study](http://faculty.washington.edu/alexisr/TouchscreenPrompts.pdf)).
- **Juice:** layered feedback for each action, sized to the moment; avoid sudden big motion or sound
  ([Juice it or Lose it](https://gdcvault.com/play/1016487/Juice-It-or-Lose), [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/basic/)).
- **Difficulty and hints:** frustration makes players quit ([Pusey et al. 2022](https://journals.sagepub.com/doi/10.1177/15554120211056126));
  hints should go from vague to specific to protect the "aha" ([Immersology](https://www.immersology.com/hints-are-not-clues/)).
- **Testing:** several rounds of about 5 think-aloud testers each beat one big round
  ([Game Developer](https://www.gamedeveloper.com/design/how-many-players-should-you-playtest-with-)).

## Done so far

- 1-1 to 1-3: coached on the board (pointing hand, Lamp/Gem tags), no move counter, no helpers.
- Short skippable picture tour (kept because the owner asked for one; the research says it matters less than on-board teaching).
- New pieces and first-time controls introduced by spotlighting the real thing, in a few words.
- Level flavors in Worlds 1–3 so no two levels in a row feel the same.
- Worlds 1–2: "Keep going" instead of failing when moves run out.
- Stuck nudge after 30 s or 6 unproductive taps; "Next level" right under the result; no "par" jargon.

## Still to consider

1. A hint ladder: first highlight a region, then a mirror, then its right position.
2. A filter in the level generator that rejects boards a random tapper solves, so every level has a catch.
3. Build each world as four 5-level arcs (introduce, develop, twist, rest), with a hand-picked signature level in each.
4. Calm board mode: still the backdrop animals and the Pal while a level is being played.
5. Lumi's lines with a voice or a melodic "speech" sound, so non-readers can follow.
6. Track the first-session funnel (open, first tap, 1-1, 1-3, 1-5, 1-10, second session) and time to first tap.
7. Test in rounds of ~5 people (a child, an older adult, someone with ADHD), asking after 10 s on a board:
   "What do you think you need to do?"

## Avoid

Text slides before playing, hint timers that feel like a countdown, hard fails before the rules click, a Hard level
right after a new piece, big empty boards with many useless mirrors, screens piling up between levels, color as the
only signal, motion while the player is thinking, and sounds or haptics on every single event.
