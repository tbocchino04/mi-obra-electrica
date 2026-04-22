# design-taste-frontend: Senior UI/UX Engineering Framework

This comprehensive system document establishes baseline parameters and architectural principles for building premium digital interfaces that actively counter default LLM biases.

## Core Configuration

The framework operates on three primary dials:
- **DESIGN_VARIANCE: 8** (Asymmetric/Artsy orientation)
- **MOTION_INTENSITY: 6** (Fluid CSS animations)
- **VISUAL_DENSITY: 4** (Standard app spacing)

These values dynamically adapt based on explicit user requests throughout the project lifecycle.

## Key Enforcement Pillars

**Dependency Verification**: All third-party libraries require `package.json` confirmation before implementation, with installation commands provided when packages are missing.

**RSC Safety**: React Server Components handle static layouts exclusively; global state and interactivity demands `"use client"` isolated leaf components.

**Anti-Emoji Policy**: "NEVER use emojis in code, markup, text content, or alt text." Replace with high-quality icon libraries (Radix, Phosphor) or SVG primitives instead.

**Tailwind Configuration**: Enforce version consistency; v4 projects use `@tailwindcss/postcss` plugin configuration, never `tailwindcss` in postcss.config.js.

**Viewport Stability**: Use `min-h-[100dvh]` instead of `h-screen` to prevent catastrophic iOS Safari layout jumping on mobile browsers.

## Design Engineering Rules

Six deterministic directives override statistical AI defaults:

1. **Typography**: Display text defaults to `text-4xl md:text-6xl tracking-tighter`; ban generic "Inter" for premium contexts; restrict Serif fonts exclusively to creative designs
2. **Color Calibration**: Maximum one accent color (saturation <80%); purple/blue neon aesthetics strictly prohibited
3. **Layout Diversification**: Centered Hero sections banned when DESIGN_VARIANCE >4; force asymmetric/split-screen approaches
4. **Materiality**: Cards reserved only for elevation communication; density >7 demands negative-space grouping via borders/dividers
5. **Interactive States**: Mandatory implementation of loading, empty, error states with tactile feedback (e.g., `-translate-y-[1px]` on active)
6. **Data Patterns**: Labels above inputs; error text below; standard `gap-2` spacing for input blocks

## Forbidden AI Patterns ("AI Tells")

The framework explicitly bans 20+ common LLM signatures including neon glows, pure black (#000000), oversaturated accents, generic names ("John Doe"), fake predictable numbers (99.99%), startup clichés ("Acme"), and broken Unsplash links.

## Performance Guardrails

Hardware acceleration demands animation exclusively via `transform` and `opacity`—never `top`, `left`, `width`, or `height`. Z-index usage restricted to systemic contexts (navbars, modals, overlays). Grain/noise filters confined to fixed, pointer-event-none pseudo-elements only.

## The Bento 2.0 Motion Engine

Modern SaaS dashboards implement perpetual micro-interactions using Spring Physics (`stiffness: 100, damping: 20`), layout transitions via `layoutId`, and infinite loops (Pulse, Typewriter, Float, Carousel) ensuring interfaces feel "alive" while maintaining 60fps performance through memoization and isolated Client Components.
