# Status and Typography Refinement

## Goal

Remove visual noise from status labels and establish one predictable typography system across the operations console without changing layout, content, or application behavior.

## Status Treatment

- Replace the bordered square indicator with a solid 6px circular dot.
- Keep the status text unboxed and use the existing semantic colors: green for positive, red for danger, and amber for pending states.
- Preserve capitalization, readable contrast in light and dark themes, and the current status vocabulary.

## Typography Rules

- Use Instrument Sans for headings, navigation, controls, body copy, table content, prices, dates, status labels, and large metrics.
- Reserve IBM Plex Mono for technical identifiers and compact operational metadata: IP addresses, MAC addresses, serial numbers, coordinates, section kickers, table headings, and similar machine-oriented labels.
- Apply the rules across dashboard, customers, devices, invoices, schedules, map, administrators, login, and not-found surfaces.
- Preserve the existing type scale, weights, spacing, and visual hierarchy unless a font-specific tracking adjustment is required.

## Footer

- Remove `Operasional jaringan internal`.
- Keep `Citra NET Manager` left-aligned with the existing footer styling.

## Verification

- Run ESLint and TypeScript checks.
- Run the design detector on all changed UI files.
- Inspect the customer table and one metric-heavy page in light and dark themes.
- Confirm status semantics, responsive layout, and application behavior remain unchanged.
