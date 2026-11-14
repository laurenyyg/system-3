# System 3 — Design Specification v0.1

**Date:** 2026-11-13  
**Status:** Design handoff for the MVP; approved visual direction, with implementation tokens marked *proposed* where not explicitly locked  
**Audience:** Antigravity / frontend engineer  
**Companion document:** `System_3_PRD_v0.1.md` (functional source of truth)

> **Design philosophy:** 70% Modern Farnam Street–inspired editorial reading experience, 30% precise decision laboratory. A thoughtful intellectual tool, **not** a therapy bot, meditation app, generic chatbot, or SaaS dashboard. Take inspiration from the feel of serious nonfiction publishing; do not reproduce Farnam Street's proprietary assets or layouts.

## 1. Locked decisions

These decisions are approved by the product owner. Do not silently replace them.

| Element | Decision |
|---|---|
| Brand name | **System 3** (title case; not `SYSTEM 3`) |
| Wordmark family | **EB Garamond**, weight **500** |
| Wordmark styling | The **`y` in `System` is italic**; other letters of `System` upright. The **`3` is upright, NOT italic**, and uses the blue accent. |
| Main display/headline type | EB Garamond |
| Interface/body type | Inter |
| Accent | **Blue** replaces forest green throughout branding and primary UI actions |
| Light mode | Soft, bright paper-white editorial layout (prior **B** direction); not beige-heavy |
| Dark mode | Deep ink / nautical midnight blue variant (prior **C** direction), not neon |
| Hero artwork | **Small single-masted white sailing yacht / sloop** at sea, blue fine-line engraving / editorial illustration; **not** a tall ship, galleon, or pirate ship |
| Illustration constraints | No mountains, sun or sunset disc, tropical postcard effects, or photographic realism; restrained clouds and engraved ocean waves are appropriate |
| Product UI | 5-stage tracker: **Share → Understand → Challenge → Explore → Reflect** |
| Responsive | Thoughtful desktop **and** mobile experiences, not desktop-only |

### Wordmark construction (important)

Render the title as separate typographic spans so only the `y` is italic and the digit is an upright font shape:

```jsx
<span className="wordmark" aria-label="System 3">
  <span aria-hidden="true">S</span>
  <span className="wordmark-y" aria-hidden="true">y</span>
  <span aria-hidden="true">stem</span>
  <span className="wordmark-three" aria-hidden="true">3</span>
</span>
```

```css
.wordmark { font-family: 'EB Garamond', Georgia, serif; font-weight: 500; font-style: normal; white-space: nowrap; }
.wordmark-y { font-style: italic; }
.wordmark-three { font-style: normal; color: var(--color-brand); margin-inline-start: .22em; }
```

**Accessibility:** the final implementation should expose one accessible label, not duplicate the wordmark's text in assistive technology. Do not use a random system italic font on the `y`: load EB Garamond italic alongside the upright face. Do not skew or rotate an upright numeral to simulate italic.

## 2. Visual character

**Keywords:** thoughtful · rigorous · literary · quiet confidence · nautical · independent · precise.

**Avoid:** glowing AI orbs, glassmorphism, generic beige, treatment/therapy cues, chat bubbles as the dominant metaphor, cartoons, oversaturated gradients, intense shadows, and gratuitous animations.

**Visual hierarchy:** large editorial serif questions → compact sans-serif explanations → crisp investigative cards, fine rules and structured labels. Read like a well-designed essay, behave like a careful instrument.

## 3. Color design tokens

The **blue direction is approved**, but exact HEX values have **not** been signed off. The values below are a coherent implementation starting point, **proposed for visual testing** rather than final brand colors. Do not treat an image-generation mockup's sampled pixel values as authoritative tokens.

### Proposed light theme

| Token | Suggested HEX | Use |
|---|---|---|
| `--color-bg` | `#F8F9F6` | Bright, softly neutral application background |
| `--color-surface` | `#FFFFFF` | Inputs, high-priority cards |
| `--color-surface-muted` | `#F0F3F3` | Subtle grouped content |
| `--color-text` | `#182126` | Main text, wordmark `System` |
| `--color-text-muted` | `#53616B` | Supporting labels and descriptions |
| `--color-brand` | `#0D4B80` | Upright `3`, primary CTA, progress current state, links |
| `--color-brand-hover` | `#093D69` | Button hover and pressed |
| `--color-brand-wash` | `#E4EDF4` | Selected items, soft blue backgrounds |
| `--color-border` | `#D8E0E4` | Fine rules, inputs, cards |
| `--color-focus` | `#1468A5` | Keyboard focus ring, contrast checked against backgrounds |
| `--color-warning` | `#A56C35` | Risk or verification needed, used sparingly |

### Proposed dark theme

| Token | Suggested HEX | Use |
|---|---|---|
| `--color-bg` | `#12202B` | Midnight ink background |
| `--color-surface` | `#1C2D39` | Cards and inputs |
| `--color-surface-muted` | `#243846` | Lower-emphasis surfaces |
| `--color-text` | `#F3F6F7` | Main text |
| `--color-text-muted` | `#B7C7D0` | Secondary content |
| `--color-brand` | `#78BCEB` | Upright `3`, links, active progress state (lightened for contrast) |
| `--color-brand-hover` | `#A2D5F5` | Active/hover highlights |
| `--color-brand-wash` | `#26465E` | Selected backgrounds |
| `--color-border` | `#39505F` | Quiet rules |
| `--color-focus` | `#A2D5F5` | Focus indicators |
| `--color-warning` | `#E6B574` | Low-volume warnings |

- Use **semantic CSS variables**, not arbitrary colors inside components.
- The dark theme is a fully designed variant, not a CSS invert or a near-black screen with neon electric blue.
- Aim for WCAG AA contrast for text and controls; test actual color combinations rather than assuming the palette passes.
- Avoid using blue alone to communicate completion, recommendation, warning, or selection.

## 4. Typography

**Load fonts:** EB Garamond variable or weight 500 for headlines/wordmark, plus its italic face for the wordmark `y`; Inter regular/medium/semibold for UI. Use licensed web distribution (e.g. a normal Google Fonts import), not unlicensed copies of any website's font files.

| Role | Family | Desktop suggestion | Mobile suggestion |
|---|---|---|---|
| Wordmark | EB Garamond 500 | 32–38px | 27–32px |
| Hero display | EB Garamond 500 | clamp(44px, 4.2vw, 72px), line-height 1.02–1.1 | 38–46px, line-height 1.1 |
| Section heading | EB Garamond 500 | 32–40px | 28–34px |
| Card title / featured question | EB Garamond 500 or Inter 600 | 23–28px | 21–25px |
| Body | Inter 400 | 16–18px / 1.55–1.7 | 16px / 1.55 |
| Labels, controls | Inter 500/600 | 12–16px | 13–16px |

- Headline serif and body sans can coexist: don't turn the entire interface into a book page at the expense of scannability.
- Large headings should use natural text wrapping and have clear responsive line lengths. Avoid justified text.
- For long Decision Records, prioritize reading rhythm, sensible paragraph widths, and clear section headings.

## 5. Hero / landing page

### Composition

- **Header:** left-aligned `System 3` wordmark; minimal navigational links on desktop; compact mobile navigation; blue **Start Thinking** CTA.
- **Hero copy:** substantial editorial headline and short explanatory paragraph aligned to a comfortable reading grid. Use PRD-approved product message:
  - Headline: **“The decisions that shape your life deserve deeper thinking.”**
  - Body: **“A space to question assumptions, explore possibilities, and see what you might be missing.”**
  - CTA: **“Start a Decision”**
- **Illustration:** a **small, recognizable modern white single-mast sailboat** navigating textured blue ocean waves. It is a metaphor for finding direction in uncertainty, **not** a promise to predict the future.
- Preserve ample negative space for heading and CTA. The sailboat should be a quiet motif, not a full-bleed action scene.
- Below the hero, the existing five-stage journey can appear as a lightweight explainer, **not** a replacement for the app's interactive progress tracker.

### Art direction / implementation constraints

- Reference the **last explicitly approved sailing-boat mockup** in this design conversation. It is art direction, **not a ready-to-use transparent asset**.
- **Use a separately supplied, production-ready ship/ocean illustration asset** when implementing. Do **not** simply insert the entire screenshot/mockup (it includes text and buttons). Do not attempt to crop the screenshot and assume its remaining text will disappear.
- Graphic style: restrained two-tone blue engraved line work, fine hatching, vintage nonfiction illustration with modern layout. Ship has a single mast, simple white mainsail, small hull and contemporary yacht proportions.
- **No pirate ship, tall ship, mountain range, extra sun, or photorealism.**
- Responsive crop: on mobile, the headline and CTA remain first; boat artwork can sit below the copy with a simpler, smaller ocean horizon. Avoid text overlapping the sail or waves.
- Decorative hero illustration should have empty alt text; if meaningfully explanatory, provide concise alternative text.
- Optimize artwork for loading; use a responsive source/image asset where available.

## 6. Layout and spacing

- **Desktop application max width:** 1160–1200px, centered.
- **Reading measure:** 680–760px for dense content and Decision Record.
- **Responsive breakpoints (implementation suggestion):** mobile under 640px, tablet 640–1023px, desktop 1024px+; adapt to content rather than rigid devices.
- **Spacing:** 4/8/12/16/24/32/48/64/96px scale. Default spacing between major sections: 48–80px desktop, 32–48px mobile.
- **Borders:** one-pixel dividers; radius 8–12px (not bubbly); elevation restrained.
- **Targets:** interactive controls at least 44×44px on touch screens; appropriate input labels and validation messages.

## 7. Component specifications

### Buttons
- **Primary:** blue background, white text, 10px radius; strong readable hover/focus/disabled states. Use for `Continue`, `Start a Decision`, `Generate`, `Export`.
- **Secondary:** border + transparent/white surface; dark text; clear hover/focus. Use for `Back`, alternative action.
- **Tertiary text:** understated blue link; use for `Skip`, `Edit`, `Regenerate analysis`. Never hide critical functions in faint grey text.

### Inputs
- The intake textarea is prominent and feels like writing in a journal: generous padding, legible body sans, visible label, distinctive focus ring.
- Clarification fields use concise questions with optional/skip behavior. Avoid overly long forms on mobile.
- Maintain user text while requests are pending or fail.

### Progress tracker — a signature component
- **Five stages:** Share, Understand, Challenge, Explore, Reflect.
- **Desktop:** horizontal tracker with connected dots, text labels, blue active state, checked completed states, neutral future states.
- **Mobile:** compact five-segment progress indicator plus “Step N of 5 — Stage Name”; don't squash five large cards across a narrow viewport.
- The tracker measures **journey progress**, not correctness, certainty or decision quality.
- Prior stages remain accessible for editing; stale AI results must be clearly labeled and can be regenerated.

### Challenge cards
- Looks like an **analytical margin note**, not a diagnosis. Structure:
  1. Potential blind spot / interaction label
  2. Evidence from what the user actually said (or an explicitly exploratory question)
  3. Why it *might* matter
  4. A pointed question and next verification step
- Interaction/Lollapalooza analysis should visually show the forces as *potentially linked*, never claim they definitively caused a behavior.
- No alarm-red cards by default; avoid fear-amplifying visual language.

### Lens cards
- Five user-specific lenses, three recommended, all selectable.
- Recommendation is a subtle annotation, not a loud badge or score.
- Expand selected lens to show **3–5 checklist questions**, with user-managed `not_checked`, `to_investigate`, `answered` statuses.
- Question and “how to investigate” should be visually distinct. The AI is generating questions, **not researching facts**.

### Decision Rehearsal
- Treat **Rehearse the Future** as a signature interaction.
- Desktop: compare at least two hypothetical paths via clear tabs or side-by-side lanes; mobile: path switcher with stacked scenario cards.
- Each path shows **positive / premortem / mixed** possibilities; visual differentiation should be subtle and always labeled in text.
- Use editorial story excerpts + crisp scenario headers + actionable “What could I check now?” prompts. **Never imply scenarios are forecasts.**

### Decision Record
- Style like a well-typeset private research memo / notebook, with generous line height and readable section hierarchy.
- Highlight *known*, *assumed*, *to verify*, and *hypothetical* distinctly using text labels, not just colors.
- Copy and download Markdown actions must remain evident. Future-self email is only a draft in MVP.

## 8. Motion and microcopy

- Motion should be restrained: 150–220ms subtle transitions for tabs/cards/progress; respect `prefers-reduced-motion`.
- No bouncing robot, animated AI orb, parallax ship, or excessive attention grabs.
- Loading language: **“Structuring your decision…”**, **“Looking for missing perspectives…”**, **“Exploring possible futures…”**
- Content tone: calm, precise, curious, respectful, non-therapeutic. Avoid “I'm here for you 💛” and any implication that AI knows the one correct path.

## 9. Accessibility and QA

- Keyboard navigation and visible focus states in all steps; semantic buttons, labels, tab roles where applicable.
- Responsive test points: 375px phone, ~768px tablet, 1280px desktop, plus one narrow screen (~320px).
- Verify text wrapping in wordmark, headline, tracker and deep analysis cards.
- Dark and light mode contrast tested separately; user preference respected if theme toggle offered.
- Check error, loading, empty and stale-data states; ensure decorative art never obscures content.

## 10. AGY implementation handoff / priority

**Do not stop a working Gemini integration to rebuild the app unnecessarily.** Preserve data flow, prompts, API routes and PRD semantics.

1. **P0:** Update font loading, exact wordmark behavior, semantic blue tokens and light/dark styling. Make all five stages work at mobile widths. Maintain readable, accessible controls.
2. **P1:** Implement hero layout with a **standalone approved sailboat illustration asset**; use a temporary neutral placeholder until art is available. Avoid embedding the full screenshot as an asset.
3. **P1:** Refine five-stage tracker, Lens, Challenge and Rehearsal cards according to this spec without changing their logic.
4. **P2:** Add light/dark theme preference/toggle if straightforward, fine-tune illustration crop, animations and responsive spacing. Never compromise timely deployment for polish.

**Deliverables:** component styles / CSS tokens, a light and dark screenshot at desktop and mobile widths, a clear list of any proposed color/token deviations, and a quick smoke test showing all stages still operate with actual Gemini outputs.

### Short agent prompt

> Read `System_3_Design_Spec_v0.1.md` alongside `System_3_PRD_v0.1.md`. The PRD governs behavior; this spec governs appearance. Keep the current working flow and API intact. Implement the locked wordmark (`System` with italic `y`, upright blue `3`, EB Garamond 500), Inter UI, semantic blue light/dark tokens, responsive editorial layout, five-stage tracker, and component treatments. The hero should feature a separately supplied small **white single-mast sailing yacht** in a fine-line blue ocean illustration—**not a pirate ship, sun, or mountain**. Do not use the entire design mockup as an image asset. Treat provided color hex values as provisional proposals. Prioritize accessible responsive UI and avoid nonessential refactors. Report implementation screenshots and any blockers.
