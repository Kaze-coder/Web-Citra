# Citra NET Editorial Operations Redesign

| Field | Decision |
| --- | --- |
| Screen job | Let operators understand network, customer, and billing conditions, then act without changing systems. |
| Primary user and action | Operators review and follow up; administrators maintain operational records; super administrators manage access. |
| Content hierarchy | Exceptions and operational state first, current totals second, records and controls third. |
| Navigation and controls | Persistent role-aware rail on desktop, drawer on mobile, page-specific primary action, compact data controls. |
| Visual language | Warm bone canvas, paper surfaces, ink typography, restrained Citra green, hairline rules, tabular operational data, minimal elevation. |
| Typography | Instrument Sans for interface and editorial hierarchy; IBM Plex Mono only for identifiers, network values, money, and system state. |
| Required states | Loading skeletons, useful empty states, explicit errors, disabled submission, permission boundaries, confirmations for destructive actions. |
| Responsive behavior | Dense desktop grids become concise mobile summaries; tables retain horizontal access; actions stay reachable at 390px; navigation becomes a drawer. |
| Evidence used | User reference: warm modular dashboard. 21st.dev React dashboard and command palette: compact shell and keyboard-ready control patterns. UIZZE dashboard guidance: prioritise the next operational decision over interchangeable KPI cards. |
| Forbidden defaults | Pure white canvas, gradient/glass decoration, excessive rounded cards, pills for non-status content, four equal KPI cards without hierarchy, decorative motion. |
| Acceptance criteria | Landing, login, and authenticated pages share one identity; light and dark themes are legible; logo remains recognisable; typography roles are consistent; desktop and mobile flows remain functional; lint, typecheck, build, and E2E pass. |
