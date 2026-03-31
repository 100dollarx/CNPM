```markdown
# Design System Document: Tactical Command

## 1. Overview & Creative North Star: "The Tactical HUD"
This design system is built to evoke the high-stakes atmosphere of a professional esports command center. Our Creative North Star is **"The Tactical HUD" (Heads-Up Display)**. We are moving away from the "webpage" feel and toward a "software-as-instrument" aesthetic. 

The experience must feel urgent, precise, and authoritative. We achieve this not through clutter, but through **Intentional Asymmetry**—where data-heavy panels are offset by expansive "breathing room"—and **Tonal Depth**, using light and transparency rather than lines to define boundaries.

## 2. Colors: The Void and the Pulse
The palette is dominated by the "Void" (our deep black background), punctuated by the "Pulse" (Coral Red) and organized by "Subsurface" Navy tones.

### Surface Hierarchy & Nesting
To maintain a high-end feel, we follow the **"No-Line" Rule**: 1px solid borders are strictly prohibited for sectioning. Boundaries are created through background shifts:
- **Base Layer:** `surface` (#10141a) — The foundation of the entire application.
- **Secondary Surfaces:** `surface_container_low` (#181c22) — Used for large structural sidebars or background groupings.
- **Interactive Cards:** `secondary_container` (#294a77) — Our Navy Blue surface for tournament brackets, player stats, and tactical modules.
- **Elevated Highlights:** `surface_container_high` (#262a31) — Used for "nested" depth within a card to highlight specific metadata.

### The Glass & Gradient Rule
For floating elements (modals, tooltips, or dropdowns), use **Glassmorphism**. Apply `secondary_container` at 60% opacity with a `backdrop-blur` of 12px. 
**Signature Texture:** Main CTAs should not be flat. Use a subtle linear gradient (45°) from `primary` (#ffb2b7) to `primary_container` (#fc536d) to give buttons a "glow" that feels powered-on.

## 3. Typography: Precision Engineering
We utilize **Space Grotesk** for all functional and display elements to reinforce the technical, geometric nature of esports. **Inter** is reserved for high-density body copy to ensure legibility during intense tournament moments.

- **Display (Space Grotesk):** `display-lg` (3.5rem) is used for tournament scores or "Match Live" status. The tight letter-spacing and monospaced-leaning glyphs create an editorial, high-tech look.
- **Headline (Space Grotesk):** `headline-md` (1.75rem) serves as the primary anchor for module titles.
- **Body (Inter):** `body-md` (0.875rem) handles the heavy lifting. The transition from the sharp Space Grotesk headlines to the neutral Inter body copy signals the shift from "Atmosphere" to "Information."
- **Labels (Space Grotesk):** `label-sm` (0.6875rem) must always be in **ALL CAPS** with a 0.05em letter-spacing. This mimics the metadata found on military equipment or technical blueprints.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "soft" for a tactical system. We use **Ambient Shadows** and **Tonal Stacking**.

- **The Layering Principle:** Place a `surface_container_lowest` (#0a0e14) element inside a `surface_container` (#1c2026) to create a "recessed" look for input fields or data logs. 
- **The Ghost Border:** If a boundary is strictly required for accessibility (e.g., in high-density tables), use the `outline_variant` (#5a4042) at 15% opacity. It should be felt, not seen.
- **Glow Elevation:** Instead of a black shadow, use a 4% opacity `surface_tint` (#ffb2b7) shadow with a 20px blur for active primary elements. This makes the Coral Red appear as if it is emitting light onto the Navy surface.

## 5. Components: Functional Primitives

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`). `0.25rem` (DEFAULT) roundedness. No border. Text is `on_primary_fixed` (#40000e).
- **Secondary:** `surface_container_highest` (#31353c) background with a "Ghost Border" of `primary` at 20% opacity.
- **Tertiary:** Text-only in `primary`. Use for low-priority actions like "Cancel" or "View More."

### Tactical Cards
Cards must never have dividers. Separate the "Header" from the "Content" by shifting the header background to `surface_container_low` and the body to `surface_container`. Use a `3.5` (0.75rem) padding scale to ensure data breathes.

### Input Fields
Inputs should feel recessed. Use `surface_container_lowest` (#0a0e14) with a bottom-only `outline_variant` (#5a4042) at 2px thickness. When focused, the bottom border transitions to `primary` (Coral Red).

### Tournament Brackets (Custom Component)
Use `secondary_container` (#294a77) for team nodes. Connect nodes using "Ghost Border" lines (15% opacity). The "Winning" path should be highlighted with a 1px `primary` line and a soft Coral glow.

## 6. Do's and Don'ts

### Do:
- **Use High-Contrast Scales:** Jump from `display-lg` to `label-sm` to create a sense of hierarchy and professional editorial design.
- **Embrace the Dark:** Let the `#0D1117` background occupy at least 40% of the screen real estate to maintain the "Tactical" feel.
- **Micro-Interactions:** Use fast, linear easing for hover states (100ms) to make the UI feel "snappy" and responsive, like a piece of high-end gaming hardware.

### Don't:
- **No Rounded Corners:** Never exceed `0.75rem` (xl) roundedness. Avoid "pill" shapes for buttons; keep them sharp (`0.25rem`) to maintain the aggressive, tactical aesthetic.
- **No Pure Greys:** Never use neutral greys. Every "grey" in this system is tinted with Navy or Coral to ensure the palette feels cohesive and premium.
- **No Dividers:** If you feel the urge to add a line to separate two items, use a `1.3rem` (6) spacing gap or a subtle background color shift instead. High-end design is defined by what you omit.