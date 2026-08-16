# Within Tolerance - design and content spec

A satirical single-cycle simulation of a HESA Student return, in the tradition of `confirmationbias.netlify.app` but built around a different core tension. This document is the build brief. It assumes the reader is implementing it, not designing it.

**Title:** *Within Tolerance*.

---

## 0. Note on domain accuracy

Field names, rule references, deadline months and collection structure in this document are **illustrative placeholders**. They are shaped to be plausible, not correct. Every one of them should be replaced with real current detail before any of this is public. Where a placeholder appears it is marked `[VERIFY]`.

The design does not depend on any of them being right. It depends on the mechanics in §3 to §9.

---

## 1. Premise and player role

You are the person who does the Student return. Not the head of planning, not the registrar - the person whose name is on the submission and who knows where the bodies are buried, or would if your predecessor had told you.

You have inherited the return from someone who has left. You have one cycle. At the end of it, someone senior has to sign something they do not understand, on your word.

**The thesis, stated mechanically rather than thematically:** the data in your student record system is not the truth about your students. Every number the game shows you is drawn from the extract, not from reality. The gap between them is the score you cannot see until the end.

**Design constraint inherited from the reference game:** it is not possible to win. The five axes are mutually exclusive by construction, and the UI should say so plainly rather than hiding it.

---

## 2. Technical shape

Same as the reference game and for the same reasons:

- Single static SPA. No backend, no database, no auth.
- Vite + React (or Svelte). Tailwind optional - the visual direction in §12 is specific enough that hand-written CSS with custom properties may be cleaner.
- No persistence. "Nothing is saved" is both the tagline and the architecture. One exception worth considering: hold completed-run summaries in memory only, so a second run within the same session can reference the first (see §7.6).
- **Determinism is a hard requirement.** The debrief re-simulates the whole cycle with individual decisions reverted (§10.3). The entire engine must be a pure function of `(seed, orderedDecisionList)`. No `Math.random()` outside a seeded PRNG. No date-dependent behaviour.
- **Mobile-first is a hard requirement, decided up front.** The realistic distribution route is a link shared on LinkedIn to people in the sector, and most of those clicks are phones. Design at 380px and expand upward; do not build desktop and squeeze. The core shape is already mobile-native - a sequence of single cards with two to four options - but three parts need reshaping rather than responsive treatment: the dashboard (§5.8), the debrief tables (§12.4) and card copy length (§14.7). The finale queue (§10.2) is actively better on a phone.
- Deploy: Netlify / Vercel / Cloudflare Pages free tier.

### 2.1 Engine architecture

```
GameState = {
  seed,
  turnIndex,
  inherited,          // §8
  decisions[],        // ordered log, the only real input
  scheduledEffects[], // pending, keyed by landing turn
  shown: { ...metrics },   // what the player sees
  truth: { ...metrics },   // what is actually the case
  errors: ErrorPool,
  dependencies: SourceDependency[],
  roster: StaffMember[],
  credibility: CredibilityQuery[],
  signoff: { readiness, confidence, escalationRung },
  flags: Set<string>
}
```

`shown` and `truth` are updated by the same effect application, but effects carry both a `shown` and a `hidden` delta and they are frequently different signs. Log both every turn into `history[]` - the forecast-accuracy table (§10.4) is just a render of that log.

---

## 3. The five axes

Scored, banded at the end, cannot all be won.

| # | Axis | Visible during play? | What moves it |
|---|---|---|---|
| 1 | **Accuracy** | No | Whether the data is actually true. Revealed at debrief only. |
| 2 | **Timeliness and compliance** | Yes | Deadlines hit, errors cleared, sign-off achieved. |
| 3 | **How it looks downstream** | Partially | The shape of the metrics your data will produce. Continuation, completion, entry profile. |
| 4 | **Institutional goodwill** | Yes | Standing with the schools, admissions, finance, partners - the people who own the source data. |
| 5 | **Team capacity** | Yes | Aggregate staff state. |

Plus one meter the player has but is never shown as a score:

| **You** | Rendered only as an increasingly terse tone in your own dialogue and the narrator's asides. Drains via the `self` currency (§4.2). Never appears as a number until the debrief. |

**Central tension:** axes 1 and 3 pull against each other constantly. Accurate data frequently makes the provider look worse. Axis 4 is the currency you spend to buy either. Axis 2 is the clock that stops you buying anything properly.

### 3.1 Banding

Author thresholds per axis, mapping totals to four categorical bands. Suggested register - dry, institutional, faintly threatening:

`Materially accurate` / `Broadly reliable` / `Subject to qualification` / `Not fit for purpose`

Deliberately do not use the same band names across axes. The goodwill axis should band as something like `They will help you next year` / `They will help you if you ask nicely` / `You are a request now` / `You are a problem now`.

---

## 4. The card grammar

This is the most important section for content scale. Nearly every decision card offers a variant of the same four options. Author against the grammar and the writing goes fast; break it deliberately about eight times so it does not calcify.

### 4.1 The four currencies

| Currency | Shape | Costs | Gains |
|---|---|---|---|
| `capacity` | Do it properly | Team capacity, time | Accuracy (hidden), often a source fix that holds next year |
| `accuracy` | Make it go away | Accuracy (hidden), recurring debt | Timeliness, visible error count |
| `goodwill` | Make it someone else's problem | Goodwill, and they remember | Accuracy or timeliness, usually delayed 1-3 turns |
| `self` | Do it yourself | The `you` meter | Everything else, cheaply, in the short term |

### 4.2 The `self` option

Available on roughly 70% of cards. Always the cheapest thing on the card in the moment. Never has a visible cost. Drains `you` by 1-3.

This is the most lifelike mechanic in the game and it should be almost invisible until late. Implementation notes:

- No meter, no counter, no warning.
- Below a threshold, the narrator's per-turn commentary shortens. Below a lower one, the player's own option teasers lose their explanatory clauses - "Fix it." rather than "Fix it, properly, at source, which will take four days you have not got."
- At the floor, `self` options stop appearing on cards without comment. Not disabled with a tooltip - simply absent.
- The debrief names it explicitly and counts it: *"You took 34 decisions yourself. Eleven of them were somebody else's job."*

### 4.3 Where to break the grammar

- Cards with only two options, both bad.
- Cards with one option (see §9, things done to you).
- Cards where the `goodwill` option is the correct one and the game rewards it, so the player cannot learn a single dominant strategy.
- One card, late, where the `self` option is unambiguously right.

---

## 5. Data model

### 5.1 Decision card

```json
{
  "id": "oct-entry-quals-uncoded",
  "turn": "October",
  "trigger": "scheduled",
  "requires": [],
  "prompt": "The entry qualifications are not coded.",
  "context": "Admissions have coded 3,100 of 4,600. Ruth says they are on it. Ruth said that last year, in February.",
  "options": [
    {
      "id": "work-through-with-ruth",
      "label": "Book a room and work through them with Ruth's team",
      "currency": "capacity",
      "teaser": "Four days. They will be right, and they will be right next year too.",
      "sourceFix": true,
      "shown":  [{ "metric": "team_capacity", "delta": -2, "delayTurns": 0 }],
      "hidden": [{ "metric": "accuracy", "delta": 3, "delayTurns": 0 }],
      "unlocks": [],
      "setsFlags": ["ruth_owes_you_nothing_now"]
    },
    {
      "id": "default-to-modal",
      "label": "Default the uncoded ones to the modal value for the course",
      "currency": "accuracy",
      "teaser": "It will pass. Most of them will even be correct.",
      "sourceFix": false,
      "shown":  [{ "metric": "timeliness", "delta": 2, "delayTurns": 0 }],
      "hidden": [
        { "metric": "accuracy", "delta": -3, "delayTurns": 0 },
        { "metric": "recurring_debt", "delta": 1, "delayTurns": 0 }
      ]
    },
    {
      "id": "escalate-to-pvc",
      "label": "Raise it with the PVC as a risk to submission",
      "currency": "goodwill",
      "teaser": "It will move. Ruth will hear about it from someone else first.",
      "shown":  [{ "metric": "goodwill", "delta": -2, "delayTurns": 0 }],
      "hidden": [{ "metric": "accuracy", "delta": 2, "delayTurns": 2 }],
      "unlocks": ["jan-ruth-remembers"]
    },
    {
      "id": "take-it-home",
      "label": "Take the extract home and do them yourself",
      "currency": "self",
      "teaser": "Nobody needs to know it took two weekends.",
      "shown":  [],
      "hidden": [
        { "metric": "accuracy", "delta": 2, "delayTurns": 0 },
        { "metric": "you", "delta": -2, "delayTurns": 0 }
      ]
    }
  ]
}
```

### 5.2 Effect scheduler

Every effect carries `delayTurns`. Effects are pushed to `scheduledEffects` and applied at the start of the landing turn. Two rules:

1. A landing effect that is visible **must** be narrated as a flavour event on the turn it lands, written as if it has just happened, with no reference to its cause. Tag it `attributedTo: <decisionId>` so the debrief can do the attribution the player could not.
2. Delays in this game are longer than in the reference game. Typical `delayTurns` is 2-4 within cycle, and a meaningful proportion of effects carry `delayTurns: "coda"` - they land 15 months later, in §11.

### 5.3 Flavour event

```json
{
  "id": "cascade-first-run",
  "turn": "November",
  "type": "flavor_event",
  "attributedTo": "nov-fix-duplicate-engagements",
  "headline": "You have fixed the duplicate engagements.",
  "body": "All fourteen of them, properly, at source. The rules that were sitting behind them have now run for the first time.\n\nOpen errors: 47 → 633.\n\nDenise brings you a coffee and does not say anything about it, which is worse.",
  "effects": []
}
```

### 5.4 Interrupt ("Have you got a minute?")

Same schema as a decision card, plus `npc` (id, name, role) and `blocking: true`. Blocks the turn's scheduled cards until resolved. Used to run NPC subplots across three or four turns via `unlocks` chains.

### 5.5 Source dependency

Data you do not own. This is where delay actually comes from.

```json
{
  "id": "entry-quals",
  "label": "Entry qualifications",
  "owner": "admissions",
  "ownerName": "Ruth",
  "state": "partial",
  "readiness": 0.67,
  "slipsPerTurn": 0.05,
  "chaseCost": { "goodwill": -1 },
  "escalateCost": { "goodwill": -3 },
  "workaroundAvailable": true,
  "workaroundAccuracyPenalty": -3
}
```

Dependencies degrade if untouched. `readiness` at submission time determines whether the workaround fires automatically - the player who never looked at it does not get told; they simply find out in the debrief.

Suggested set of 6-8: entry qualifications, module and course structure, partner/franchise provider returns, withdrawal and interruption dates, fee and funding status, disability and support data, off-venue and placement activity, staff-owned course changes never notified to the SRS.

### 5.6 Error pool

See §6. Not a number - a tiered structure.

### 5.7 Credibility query

```json
{
  "id": "feb-part-time-drop",
  "turn": "February",
  "query": "A 40% fall in part-time first degree headcount.",
  "truth": "Two courses moved to a partner in 2023 and the mapping never followed them.",
  "options": [
    { "id": "restate", "label": "Restate the courses correctly and resubmit the affected records",
      "durability": "high", "shown": [{ "metric": "team_capacity", "delta": -3 }] },
    { "id": "demand", "label": "Explain it as a genuine change in part-time demand, which is also happening",
      "durability": "low", "shown": [{ "metric": "timeliness", "delta": 1 }] },
    { "id": "portfolio", "label": "Explain it as a coding change following a portfolio review",
      "durability": "medium", "shown": [] }
  ]
}
```

`durability` is hidden. All three are accepted this cycle. `low` and `medium` go into the coda pool (§11) with different probabilities.

### 5.8 Dashboard state, shown every turn

- **Records in the return** (headline number) with a confidence label that firms up across the cycle: `Extract only` → `Partially validated` → `Within tolerance` → `Submitted, unsigned` → `Signed`
- **Open errors** by tier, with delta vs last turn. The delta arrow is deliberately the wrong signal (§6).
- **Days to deadline**, then after it, **days past deadline** in a different colour with no ceiling
- **Sign-off**: two bars, readiness and confidence (§7)
- **Team**: individual states plus an aggregate label
- **Source dependencies**: a compact grid of 6-8 chips, each `Ready` / `Partial` / `Not started` / `Chased` / `Nobody has replied`
- **Credibility**: count of open queries, count answered

Note what is *not* on the dashboard: accuracy, and you.

**Mobile treatment.** The full set above does not fit a 380px viewport and should not try to. Collapse to a three-item strip pinned above the card - records in the return, open errors with delta, days to deadline - with everything else behind a single "Full position" tap.

This is thematically better than the desktop version rather than a compromise. The three numbers on display are exactly the ones that reward the wrong behaviour; the dependency states and tier breakdown that would tell you something true are one tap away and will mostly go unopened. Do not badge or animate the expander to encourage opening it. On desktop, show the full panel as specified - the difference between the two experiences is itself worth something in the debrief.

### 5.9 Roster

Internal team, each with state `Fine` / `Stretched` / `Coping` / `Off sick, N turns` / `Seconded to enrolment, N turns`:

- **Denise** - senior data officer, has been here nineteen years, is the narrator/companion, comments every turn, knows why the 2019 courses are like that and will tell you only if asked directly
- **Sam** - SRS and reporting, competent, being poached, you know this and they do not know you know
- **Marcus** - data officer, new, keen, produces work that must be checked
- **Priyanka** - part-time, two days, owns the partner returns, is the single point of failure for something nobody has documented

External NPCs with consistent voices:

- Head of Planning (wants the numbers early and firm)
- Director of Finance (wants the funding-relevant fields and nothing else)
- Registrar / Academic Registrar (will sign, eventually, and will remember being made to)
- Head of Admissions (owes you nothing, owns your entry quals)
- Faculty Dean (has views about how their students should be counted)
- Head of Student Records at the partner provider (sends a PDF)
- Director of Marketing (wants the league table position, does not want to hear about tolerance)
- OfS (institutional, never personified, arrives by email)

---

## 6. The cascade

The single most important mechanic after the shown/truth split.

### 6.1 Structure

Validation rules sit in **tiers**. A blocking error at tier *n* prevents rules at tier *n+1* from evaluating that record at all.

```
Tier 1: structural   - record won't load
Tier 2: referential  - codes that don't resolve
Tier 3: cross-field  - internally contradictory
Tier 4: cross-record - contradicts the same student elsewhere
Tier 5: cross-year   - contradicts what you returned last year
```

Fixing a tier-1 error properly unblocks tiers 2-5 for those records, and the open error count **goes up**. Suppressing it - overriding, defaulting, excluding the record - takes the count down and keeps it down.

The player learns within two turns that the dashboard number rewards the wrong behaviour. This is the entire thesis delivered as a mechanic rather than a debrief paragraph. Do not explain it in the UI.

### 6.2 Source fix vs extract fix

Every error fix is one or the other.

- **Extract fix**: fast, cheap, clears this cycle, sets `recurring_debt +1`. Recurring debt has no visible effect at all this cycle. It appears in the coda and, if a second run is played in the same session, in the inherited state of that run.
- **Source fix**: slow, costs capacity and usually goodwill (someone in a school has to do something), holds.

### 6.3 Tolerance

Some rules are advisory rather than blocking. The player can leave them. Leaving advisory rules is free, correct-looking, and quietly the largest single contributor to the accuracy gap. The word "tolerance" should appear in the UI often enough that the player stops reading it.

---

## 7. Sign-off

The goal is not submission. The goal is sign-off. Two independent gates.

### 7.1 Readiness

Mechanical. Errors below threshold, credibility queries answered, dependencies resolved or worked around. The player can see this and drive it.

### 7.2 Confidence

The accountable officer's willingness to put their name to something they do not understand. Starts at a value set by the inherited state (§8). Decreases every time you give them a reassuring answer that later turns out to need revisiting, and every time they hear about a problem from someone other than you.

Key mechanic: several cards through the cycle give you the chance to tell the Registrar something is a problem *before* it becomes one. Doing so costs timeliness and looks like weakness. Not doing so costs confidence later, and confidence cannot be rebuilt inside one cycle.

### 7.3 The escalation ladder

Past the deadline, escalation is a ladder rather than a penalty, and each rung compounds.

1. **Chaser.** An email. Costs nothing.
2. **Named in a report.** Your provider appears on a list. The Head of Planning forwards it to you with no message.
3. **Standing weekly.** A recurring meeting on submission progress. Costs 1 capacity **every remaining turn**.
4. **Risk register.** The return becomes a governance item. Adds a mandatory card each turn, all of whose options cost something.
5. **Formal contact.** The regulator writes to the accountable officer rather than to you. Confidence drops to floor. Sign-off becomes contingent on an improvement plan you must write during the finale.

Punishment that compounds is more uncomfortable than punishment that scores, and it is more accurate.

---

## 8. Inherited state

The game opens on a handover note from your predecessor. Five authored variants, selected by seed. This does three things: sets the difficulty, provides replay variety, and establishes the correct emotional opening - you are being scored on decisions you did not make.

Each variant sets: initial `recurring_debt`, dependency readiness, Registrar confidence, audit probability (§9.2), and 2-3 latent flags that surface mid-cycle.

**Variant 2 of 5, "Wendy":**

> A plastic wallet, on the desk, with a note on the front.
>
> "Everything's on the shared drive. The mapping document is called Mapping FINAL. There's another one called Mapping FINAL (new) - use that one. The partner data comes from Priya at Northgate, she's fine, just chase her in November not December. Anything else, ask Denise. Sorry about the modules. Wendy."
>
> *Inherited: source mapping unreviewed since 2023. Partner data manual. Previous return signed off eleven weeks late.*

Other variants to write: the meticulous predecessor whose documentation is perfect and whose data is wrong; the one who left mid-cycle with no note at all; the one who was very good and whose standards you will be measured against; the one who was promoted internally and is now your stakeholder.

---

## 9. Turns

Eleven turns plus a finale plus a coda. Months skipped for pacing, as in the reference game. `[VERIFY]` all deadline placements against the real collection calendar.

| # | Turn | Beat |
|---|---|---|
| 0 | Handover | Setup, no decisions, one click |
| 1 | September | Cycle opens. Coding manual changes. Enrolment is happening around you and nobody has time. |
| 2 | October | First extract. Discovering what is actually in there. |
| 3 | November | First full validation run. The cascade fires. |
| 4 | December | The quiet month that is not. Everyone else is off. |
| 5 | January | Dependencies bite. Entry quals, partner data. |
| 6 | February | Credibility queries. Possible OfS audit branch (§9.2). |
| 7 | March | Deadline approaches. Trade-offs get ugly. |
| 8 | *(April skipped)* | |
| 9 | May | Deadline. Escalation ladder begins if missed. |
| 10 | June | Sign-off push. Registrar confidence resolves. |
| 11 | July | Final validation run - the real-time finale (§10). |
| — | Coda | November, 15 months later (§11). |

2-5 cards per turn, of which 1-2 are scheduled decision cards, 0-2 interrupts, and 1-2 flavour events drawn from a pool larger than any one run uses.

### 9.1 Things done to you

A card category with no good option, and often only one option. These should never feel like decisions.

- Sam is seconded to enrolment for six weeks in September. You are told, not asked.
- The coding manual changes a field definition mid-cycle and nobody tells the schools.
- Priyanka's partner contact leaves.
- A course that was set up wrongly in 2019 is discovered, and it has three years of returns behind it.
- Marcus's work needs redoing and telling him would cost more than doing it.

Roughly one per turn from turn 3, drawn from a pool.

### 9.2 The audit branch

Probability set by inherited state, roughly 40% of runs. Fires in February.

The OfS reviews **last year's** return - not yours. They find something. It is not your fault and it is now your problem. Consequences:

- A mandatory process change adds a cost to every remaining source fix
- Two turns of capacity consumed producing evidence for a return you did not make
- Registrar confidence drops before you have done anything wrong
- One genuine benefit: it gives you leverage with the schools you did not previously have. Play this honestly - the audit should be survivable and occasionally useful.

---

## 10. The finale: final validation run

Structurally distinct from the rest of the game, as Clearing is in the reference game. Its own module.

### 10.1 Setup cards

3-4 ordinary decision cards setting strategy for the final run: what to fix, what to leave in tolerance, who works the weekend, whether to submit with known issues or hold.

### 10.2 The real-time queue

~90 seconds of wall clock. Individual error records surface one at a time. Each shows:

- Student reference (invented), course, the rule that fired, the tier
- One line of human context: *"Withdrew in week 4. Or in week 11. The two systems disagree and the person who would know is on maternity leave."*
- Three buttons: **Fix at source** (costs 8 seconds of the clock) / **Override** (costs 1 second) / **Leave in tolerance** (costs nothing)
- A counter: `N records still open`

The clock is the resource, and fixing properly costs time you visibly do not have. The counter goes up when you fix properly, per §6.1. At 0:00, everything unresolved is auto-overridden and the game says so in one flat line.

Author 15-20 vignettes; draw 12-14 per run.

### 10.3 Sign-off scene

The Registrar signs, or signs conditionally, or does not. Written as a short scene, not a screen of numbers. This is the emotional end of the cycle even though the debrief follows.

---

## 11. The coda

Four screens, set the following November. This is what HESA has that admissions does not - consequences land 15 months out, in someone else's inbox, about a return you have half forgotten.

1. **A metric publishes.** Your continuation rate appears somewhere public. It is the number your data produced, not the number that is true.
2. **A low-durability credibility explanation comes back.** An email from the OfS, quoting the explanation you gave in February, asking for supporting evidence. It has your predecessor's name on the file.
3. **Recurring debt resurfaces.** The extract fixes you made are back. Whoever is doing the return now has emailed you to ask about the mapping.
4. **One good thing.** A source fix you made properly, silently holding. Nobody knows you did it. Do not undercut this one with a joke.

---

## 12. Debrief

### 12.1 The reveal

Open with the accuracy axis - the meter that was never shown. Show `shown` vs `truth` for the headline number across all eleven turns as a single chart, with the gap shaded. This is the payoff of the whole architecture and it should land before any scoring.

### 12.2 Per-axis bands

Five ratings, per §3.1, with one line of commentary each drawn from templated sentences.

### 12.3 Counterfactuals

Identify the three highest-impact decisions by total absolute effect on `truth`, re-run the entire cycle with each individually reverted, and template the deltas:

> *"You defaulted the uncoded entry qualifications in October. Without it, 340 records would have been correct that were not, your entry profile would have published 0.4 points lower and truer, you would have signed off nine days later, and Ruth would still be speaking to you."*

Requires the determinism in §2. Build the engine this way from the first commit; retrofitting it is painful.

### 12.4 Forecast accuracy table

Turn / what you were shown / what was true / error, value and percent. Straight render of `history[]`.

**Mobile treatment.** Four numeric columns will not survive at 380px. On mobile the shown-vs-truth chart from §12.1 is the primary object, with a tap-per-turn readout revealing the four values for that turn one at a time; the table is a desktop expansion. The same applies to the subject mix table if one is included - chart plus tap, not a squeezed grid.

### 12.5 The self count

Per §4.2. State it plainly and do not moralise.

### 12.6 Shareable card

Compact stat summary, copyable as text. Include the accuracy gap - it is the interesting number and the one people will post.

---

## 13. Look and feel

Do not copy the reference game, and do not use HESA's or Jisc's actual brand colours - a satire wearing the regulator's livery invites a conversation nobody wants. The right visual language is the **output**, not the organisation: validation reports, extract logs, tolerance tables.

**Design lead should read `/mnt/skills/public/frontend-design/SKILL.md` before building.** Direction below is the brief, not the implementation.

### 13.1 Palette

```css
--ground:    #E3E5E1;  /* pale grey-green, the colour of a printed report that has been on a desk */
--panel:     #F2F3F0;
--ink:       #14181B;
--rule:      #9EA69B;  /* hairlines, table borders, everything structural */
--blocking:  #A81E17;  /* tier 1-2 errors */
--tolerance: #B87503;  /* advisory rules. The player will stop seeing this colour. */
--truth:     #0C6A70;  /* cold teal. NEVER APPEARS until the debrief. */
```

That last one is a deliberate device: a colour the player has not seen in eleven turns arrives on the reveal screen. Do not leak it into hover states or the loading screen.

### 13.2 Type

Numerals are the subject of this game, so the utility face is the important choice, not the display face. Everything numeric in tabular figures, monospaced, aligned on the decimal, always. Display: a tight condensed grotesque - institutional, slightly cramped, not friendly. Body: a plain workhorse sans at a comfortable reading size, because the writing carries the humour and it must not be hard to read.

### 13.3 Signature element

The dashboard headline number is set as a fixed-width digit grid with a barely perceptible second layer beneath it, very slightly out of registration - like a misprinted form where an earlier value shows through. It is never legible. It resolves, in `--truth`, only on the debrief.

One signature element. Keep everything else quiet: hairline rules, no shadows, no radius above 2px, no gradients, minimal motion. The one place motion is justified is the finale countdown.

### 13.4 Mobile specifics

- Design canvas 380px. Everything below is derived from that, not adapted to it.
- The signature misregistered digit grid (§13.3) works at phone scale and should be the largest thing on the screen. It is the one place to spend vertical space.
- Options are full-width tap targets, minimum 44px, stacked. The currency of an option is never indicated by an icon or colour - the player should not be able to pattern-match "the safe one" without reading the teaser.
- Card plus options must fit without scrolling to reach the last option. If it does not fit, the copy is too long (§14.7), not the layout.
- Hairlines at 1px do not survive some mobile renderers; use 1px with an explicit colour rather than a border shorthand and check on a real device.
- The finale countdown is the only motion. On mobile it should be a top-edge bar rather than a numeric clock, going red in the last 15 seconds.
- Respect reduced motion. Visible keyboard focus for anyone playing on desktop.

### 13.5 Copy in the interface

Sentence case. Active voice. Errors never apologise. Empty states are flat statements, not encouragement - `No records in tolerance.` not `Great work, you're all clear!`

---

## 14. Tone rules for content authoring

1. **Deadpan and specific.** Humour comes from precise mundane detail, never from jokes. `Mapping FINAL (new)`. Tripping over a cat. The person who is on maternity leave and is the only one who knows.
2. **Every option states its cost in the same breath as its benefit.** No clean choices.
3. **Nobody is a villain.** The Dean who wants their students counted differently has a reason. Ruth in admissions is not lazy, she has her own return. The satire is of a system, not of colleagues.
4. **NPCs are stereotypes played straight**, humanised with one small specific detail each, held consistently.
5. **Stay inside the defensible zone.** This is a design rule with teeth. A statutory return has an integrity line, and a game that makes falsifying data feel like a fun optimisation is a different and worse product. No option is ever "invent data". The options are "accept the spreadsheet without checking", "reuse last year's mapping", "close the query with the explanation that will be accepted". That is where real erosion happens, it is funnier because it is recognisable, and it keeps the thing publishable under a real name.
6. **Framing disclaimer up front:** satire, every number invented, no resemblance to any provider, written by someone who has done this.
7. **Length is a mechanic, not a style note.** Context blocks: two short sentences, hard cap. Option labels: one line. Teasers: one line, no subordinate clauses. On a phone, a long context block pushes the fourth option below the fold and the player chooses without reading it - which quietly removes the `self` option from the game, since it is usually last. This constraint applies to all 30 cards and must be held while writing them, not edited in afterwards. Flavour events and the coda may run longer; they have no options underneath them.

---

## 15. Content scope

| Asset | Count |
|---|---|
| Scheduled decision cards | 25-30 |
| Interrupts (NPC subplots) | 12-15 across 5-6 chains |
| Flavour events | 40+, drawing ~20 per run |
| "Things done to you" | 12, drawing ~8 |
| Handover variants | 5 |
| Credibility queries | 8, drawing 4-5 |
| Finale vignettes | 15-20, drawing 12-14 |
| Coda screens | 4 fixed frames, templated content |
| Debrief sentence templates | ~30 |
| Narrator (Denise) per-turn lines | 11 turns × 3 tone states = 33 |

Debrief and counterfactual text is **templated, not hand-written per combination**. Author the sentence templates and the slot vocabulary.

---

## 16. Build order

1. Engine: state, seeded PRNG, effect scheduler with delays, shown/truth dual application, history log. Prove determinism with a test that re-runs a fixed decision list and asserts identical output.
2. Error pool with tiers and the cascade. This is the thing most likely to need redesign once it is playable.
3. Turn loop and dashboard, ugly and unstyled, in a 380px viewport. Collapsed dashboard from the start.
4. Ten cards, written to the §14.7 length cap. Play it on an actual phone. Judge whether the cascade and the `self` option feel right, and whether the fourth option is reachable without scrolling. **Stop and redesign here if not** - everything after this is expensive to change.
5. Sign-off gates, escalation ladder, dependencies.
6. Full card content.
7. Finale module.
8. Debrief with counterfactual re-simulation.
9. Coda.
10. Visual design pass.
