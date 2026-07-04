---
name: Professional Slate Light
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#434655'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  max-width: 1440px
---

## Brand & Style
The design system is engineered for high-performance productivity environments where clarity, speed, and precision are paramount. It targets professional users in SaaS, finance, and enterprise sectors who require a focused, distraction-free interface.

The aesthetic follows a **Corporate Modern** approach optimized for a **Light Mode** environment. By prioritizing a refined contrast ratio between clean white/neutral backgrounds and professional slate accents, the UI provides a crisp, airy workspace that feels both authoritative and approachable. The style is intentionally utilitarian, using tonal layering and a restrained color palette to establish a logical, hierarchical workspace.

## Colors
The palette transitions to a clean, neutral-white foundation, utilizing "Slate" tones to maintain a professional, cool-toned light environment.

- **Primary (#2563eb):** A vibrant, high-visibility blue used exclusively for primary actions, active states, and essential focal points.
- **Surface (#ffffff):** A pure white base that provides a high-contrast canvas for professional data density and maximum clarity.
- **Outline (#cbd5e1):** Subtle slate borders that define structure without adding visual noise.
- **On-Surface (#0f172a):** Deep slate and black tones used for text to ensure maximum legibility and professional contrast.
- **Secondary (#64748b):** Mid-tone slate for supporting text, icons, and non-interactive elements.

## Typography
This design system utilizes **Inter** across all levels to maintain a systematic, utilitarian aesthetic. Inter's tall x-height and excellent legibility make it ideal for data-heavy interfaces.

Headlines use tighter letter spacing and heavier weights to create a strong visual anchor. Body text is optimized for long-form reading with generous line heights. Labels utilize semi-bold weights and slight tracking increases to remain distinct even at small scale. For mobile devices, headline sizes are scaled down to prevent awkward line breaks while maintaining hierarchy.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop, centering content within a 1440px container to ensure readability on ultra-wide monitors. 

- **Grid:** A 12-column system is used for desktop and tablet, switching to a 4-column system for mobile.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Consistency:** Gutters are fixed at 24px (3x base) to provide ample breathing room between functional blocks. 
- **Mobile Reflow:** On mobile, margins shrink to 16px, and all multi-column components stack vertically to prioritize a single-handed scroll experience.

## Elevation & Depth
In light mode, depth is communicated through **Tonal layers** and **Soft Ambient Shadows** rather than high-contrast dark fills.

1.  **Level 0 (Base):** The #ffffff surface.
2.  **Level 1 (Cards/Sections):** White surfaces with a 1px #cbd5e1 border or subtle background tint.
3.  **Level 2 (Dropdowns/Modals):** White surfaces with a soft, diffused shadow (10% opacity) to suggest temporary overlay.

Backdrop blurs are used sparingly for navigation bars (12px blur) to maintain context while the user scrolls through dense content.

## Shapes
The shape language is defined by **Pill-shaped** corners (1rem base). This increased radius strikes a balance between professional utility and a modern, softened aesthetic suitable for contemporary light interfaces.

- **Standard Elements:** Buttons, inputs, and small cards use the base 1rem radius.
- **Large Containers:** Dashboard widgets and main content areas scale to `rounded-lg` (2rem).
- **Interactive Feedback:** Focus states follow the exact geometry of the element they surround, typically with a 2px primary blue offset.

## Components
- **Buttons:** Primary buttons are solid Blue (#2563eb) with white text. Secondary buttons use a transparent background with an Outline (#cbd5e1) and Dark Slate text. 
- **Input Fields:** Use a white background with a 1px Slate border. On focus, the border transitions to Primary Blue.
- **Chips:** Small, pill-shaped tags (1rem roundedness) with a light slate (#f1f5f9) background and Secondary Slate (#475569) text.
- **Lists:** Rows are separated by 1px horizontal #f1f5f9 lines. Hover states utilize a subtle #f8fafc tint to indicate interactivity.
- **Cards:** Essential for the workspace feel, cards should have minimal shadow by default, relying on the 1rem radius and 1px #cbd5e1 border for definition.
- **Data Tables:** High-density layouts with 12px padding (vertical) and 16px padding (horizontal). Header rows use a #f8fafc background to distinguish from data.