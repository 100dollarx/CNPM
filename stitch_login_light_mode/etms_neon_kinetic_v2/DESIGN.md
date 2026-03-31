```markdown
# Design System Specification: Kinetic Precision

## 1. Overview & Creative North Star
**Creative North Star: "The Tactical Overclock"**

This design system is engineered for the high-stakes, high-velocity environment of professional esports. Moving away from the generic "gamer" tropes of neon glows and heavy borders, we embrace **Tactical Brutalism**. The aesthetic is aggressive, lean, and ultra-precise. 

We break the "template" look through **intentional structural asymmetry** and **high-contrast typography scales**. By utilizing sharp 0px radii and a restricted, high-impact color palette, we create an interface that feels like a head-up display (HUD) from a near-future combat sim. The layout prioritizes data density and rapid recognition, utilizing the "Coral Red" accent as a heat map for action.

---

## 2. Colors
Our palette is built on a foundation of deep, layered navies, punctuated by a singular, aggressive strike of Coral Red.

### The Strike Palette
- **Primary (#ffb2b7 / #E94560):** Use for critical actions and active states. It represents energy and "The Kill."
- **Secondary (#a9c8fc):** A tech-blue used for supporting data and secondary information.
- **Tertiary (#67dc9f):** Reserved strictly for "Success" or "System Ready" states.

### Surface & Neutral Palette
- **Surface (#06122e):** The deep navy "void" background.
- **Surface-Container-Low (#0f1a37):** Used for subtle sectioning.
- **Surface-Container-High (#1e2946):** For elevated tactical modules.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. We define boundaries through **tonal transitions** or **negative space**. A module is not "boxed in"; it exists because its surface (`surface-container-high`) is physically distinct from the background (`surface`).

### Signature Textures
To add "soul" to the high-tech coldness, use subtle linear gradients on primary elements. Transition from `primary` (#ffb2b7) to `primary_container` (#fc536d) at a 135-degree angle. This prevents the Coral Red from appearing flat and gives it a "kinetic" glow.

---

## 3. Typography: Space Grotesk
We use **Space Grotesk** exclusively. Its quirky, monospaced-influenced terminals provide the "tech" feel without sacrificing the readability required for rapid stat-checking.

- **Display (Lg/Md/Sm):** Set to `3.5rem`, `2.75rem`, and `2.25rem`. Use `font-weight: 700` and `letter-spacing: -0.05rem`. These are your "Aggressive Headers"—use them sparingly to anchor the layout.
- **Headline (Lg/Md):** `2rem` and `1.75rem`. Use for tactical modules.
- **Title (Md/Sm):** `1.125rem` and `1rem`. These act as the primary navigational anchors.
- **Label (Md/Sm):** `0.75rem` and `0.6875rem`. Use for metadata, player stats, and micro-copy. Always `uppercase` with `letter-spacing: 0.1rem` for a military-spec feel.

---

## 4. Elevation & Depth
In this system, depth is a product of **Tonal Layering**, not light sources.

### The Layering Principle
Avoid shadows where possible. Instead, stack your surface tiers:
1.  **Base:** `surface` (#06122e)
2.  **Section:** `surface-container-low` (#0f1a37)
3.  **Component:** `surface-container-high` (#1e2946)

### Glassmorphism & Depth
For floating overlays (Modals/Quick-Stats), use a semi-transparent `surface_variant` (#293452 at 60% opacity) with a `backdrop-blur: 20px`. This maintains the "aggressive" dark aesthetic while allowing the "kinetic" activity of the app to bleed through the background.

### The "Ghost Border" Fallback
If a visual separator is required for accessibility, use a **Ghost Border**: `outline-variant` (#5a4042) at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons: Tactical Trigger
- **Primary:** Background: `primary_container` (#fc536d) gradient. Text: `on_primary_container`. **Shape: 0px Radius.** The hard edge is non-negotiable.
- **Secondary:** Transparent background with a `Ghost Border` (Coral Red at 30%).
- **State Change:** On hover, the Coral Red should "overclock"—increase brightness or add a subtle `primary` outer glow (4px blur).

### Cards & Lists
- **Rule:** Forbid divider lines.
- **Implementation:** Use the Spacing Scale (e.g., `space-4` or `space-6`) to create distinct content groups. Separate list items using a subtle shift from `surface-container-low` to `surface-container-lowest`.

### Tactical Chips
- Small, rectangular blocks. Use `secondary_container` for passive data and `primary` (Coral Red) for "Live" or "Active" filters.

### Input Fields
- Underline only. No full boxes. The underline uses `outline` (#a9898a). When active, the underline transitions to `primary` (Coral Red) with a 2px height.

---

## 6. Do’s and Don'ts

### Do:
- **Use Asymmetry:** Place a large `Display-Lg` title off-center to create visual tension.
- **Embrace the 0px Radius:** Everything is sharp. Sharpness equals speed.
- **Data Density:** Don't be afraid of "tight" layouts. In esports, information is power. Use `body-sm` for secondary stats to maximize screen real estate.

### Don't:
- **Don't use Rounded Corners:** Any radius above 0px breaks the "Tactical Brutalism" of the system.
- **Don't use "Soft" Shadows:** No "fuzzy" grey shadows. If you need lift, use a higher surface container or a high-contrast Ghost Border.
- **Don't Overuse Coral Red:** It is a strike color. If everything is red, nothing is urgent. Save it for CTAs, active nav, and critical alerts.

---

## 7. Spacing Scale
Precision is maintained through a strict 0.2rem increment system. 
- Use **Small Gaps** (`space-1` to `space-3`) for internal component relationships (e.g., Icon to Label).
- Use **Structural Gaps** (`space-8` to `space-12`) for layout-level sectioning. 
- **The "Dead Zone":** Always maintain at least `space-16` (3.5rem) from the screen edge for high-end editorial breathing room.