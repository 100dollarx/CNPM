# Design System Document: Esports Tournament Management System (ETMS)

## 1. Overview & Creative North Star
### The Creative North Star: "Kinetic Command"
This design system rejects the "flat and boxy" utility of standard enterprise software. Instead, it adopts **Kinetic Command**—a visual language that mirrors the high-stakes, high-energy environment of competitive gaming. It is built to feel like a premium broadcast overlay: deep, immersive, and surgically precise.

We break the "template" look by utilizing **intentional asymmetry** and **tonal depth**. Rather than using rigid borders to define space, we use light and shadow to create a UI that feels like it’s carved out of dark obsidian and illuminated by neon pulses. Every interaction should feel like a "power-on" sequence.

---

## 2. Colors
Our palette is rooted in the "Deep Space" of the esports arena, utilizing a sophisticated hierarchy of dark tones to ensure focus remains on the competition data.

### Surface Hierarchy & Nesting
To achieve a high-end feel, we move away from flat backgrounds. We treat the UI as a series of physical layers—like stacked sheets of frosted glass.
- **Base Layer:** `surface_container_lowest` (#0a0e14) — Used for the primary app backdrop.
- **Section Layer:** `surface_container_low` (#181c22) — Used for the 240px Sidebar and 56px Header.
- **Card/Content Layer:** `surface_container` (#1c2026) — The primary container for data.
- **Elevated/Active Layer:** `surface_container_high` (#262a31) — Used for hover states or active tournament cards.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off parts of the UI. Boundaries must be defined solely through background color shifts or subtle tonal transitions. A card sits on a background because it is *lighter*, not because it has an outline.

### The "Glass & Gradient" Rule
To inject "soul" into the system, utilize Glassmorphism for floating overlays (Modals, Tooltips, Dropdowns).
- **Glass Effect:** Use `surface_variant` (#31353c) at 60% opacity with a `20px` backdrop-blur.
- **Signature Gradients:** For primary CTAs and Hero sections, use a linear gradient: `primary` (#d6baff) to `primary_container` (#533483) at a 135-degree angle.

---

## 3. Typography
We use a dual-font strategy to balance aggressive "Gamer" aesthetics with professional readability.

*   **Display & Headlines (`Space Grotesk`):** Used for tournament titles, scores, and large numeric data. It provides a technical, futuristic edge.
*   **Body & Labels (`Inter`):** Used for all functional UI, descriptions, and settings. Inter provides the "Trust" factor needed for complex management systems.

| Role | Token | Font | Size | Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Tournament Title** | `display-md` | Space Grotesk | 2.75rem | Bold |
| **Section Header** | `headline-sm` | Space Grotesk | 1.5rem | Medium |
| **Subheader** | `title-md` | Inter | 1.125rem | Semi-Bold |
| **Primary Body** | `body-md` | Inter | 0.875rem | Regular |
| **Metadata/Small** | `label-sm` | Inter | 0.6875rem | Medium (All Caps) |

---

## 4. Elevation & Depth
In this system, depth is a function of **Tonal Layering** and **Ambient Light**.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Place a `surface_container` card on a `surface_container_low` section to create a soft, natural lift. No shadows are required for static elements.

### Ambient Shadows
For "floating" elements like Modals or context menus:
- **Shadow:** `0px 20px 40px rgba(0, 0, 0, 0.4)`.
- **Glow (Optional):** For "Active" high-priority items, add a 4% spread shadow using the `primary` color (#d6baff) to simulate a neon underglow.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use a **Ghost Border**: `outline_variant` (#4a4550) at 20% opacity. Never use 100% opaque borders.

---

## 5. Components
All components follow the `xl` (1.5rem) or `lg` (1rem) roundedness for containers, and `DEFAULT` (0.5rem) for interactive elements.

*   **Buttons:**
    *   *Primary:* Gradient fill (Purple to Dark Purple), 8px radius. Text in `on_primary`.
    *   *Secondary:* Ghost style. No fill, `outline_variant` (20% opacity) border. 
*   **Cards (Tournament/Match):**
    *   12px border radius. No borders. Use `surface_container_high` on `surface_container_low`. 
    *   *Interaction:* On hover, shift background to `surface_bright` and add the "Primary Glow" shadow.
*   **Chips (Status/Live):**
    *   *Live Now:* `tertiary_container` background with a pulsing `tertiary` dot.
    *   *Completed:* `secondary_container` background.
*   **Input Fields:**
    *   Background: `surface_container_lowest`. 
    *   Border: 1px "Ghost Border".
    *   Focus state: Border changes to `primary` with a 2px outer glow.
*   **Lists (Leaderboards):**
    *   **Prohibit Divider Lines.** Use vertical spacing (Scale 4: 1rem) and alternating row backgrounds (`surface_container` vs `surface_container_low`) to separate competitors.
*   **Bracket Nodes:**
    *   Custom component: Use 2px thick lines with `outline_variant` for paths. Active paths use `tertiary` (Coral Red) for high-contrast tracking.

---

## 6. Do's and Don'ts

### Do
- **Do** use `Space Grotesk` for numbers. Esports is a data-driven sport; scores should look heroic.
- **Do** use generous whitespace. Give the data room to breathe; high-density layouts should feel organized, not cramped.
- **Do** use the "Success" color (`#22C55E`) sparingly—only for final match victories or confirmed registrations.

### Don't
- **Don't** use pure black (#000000). It kills the "Glass" effect and feels dated. Stick to the `surface` tokens.
- **Don't** use standard 1px dividers. If you feel the need for a line, try a 4px gap of the background color instead.
- **Don't** use high-opacity shadows. Shadows should feel like ambient room lighting, not a heavy drop-shadow from 1990.
- **Don't** use sharp corners. The 8px and 12px radii are non-negotiable to maintain the "Modern & Sleek" aesthetic.