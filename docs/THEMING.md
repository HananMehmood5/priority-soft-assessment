# ShiftSync — Theming (Priority Soft)

Optional reference for reviewers and contributors: how dashboard styling is structured.

The frontend uses the same visual language as **[Priority Soft](https://prioritysoft.io/)**.

## Principles

- **Dark base**: Primary backgrounds are dark (`--ps-bg`, `--ps-bg-card`) for a focused, product-style UI.
- **Purple accent**: Primary actions and highlights use the purple accent (aligned with the “Purple Ring” and brand accent on prioritysoft.io).
- **Light sections**: Where appropriate, use `.ps-section-light` for 50/50 contrast (dark vs light sections).
- **Typography**: Plus Jakarta Sans for a clean, modern tech look.

## CSS variables (`app/globals.css`)

| Variable | Purpose |
|----------|--------|
| `--ps-bg`, `--ps-bg-elevated`, `--ps-bg-card` | Page and card backgrounds |
| `--ps-fg`, `--ps-fg-muted`, `--ps-fg-subtle` | Text hierarchy |
| `--ps-primary`, `--ps-primary-hover` | Buttons, links, focus states |
| `--ps-success`, `--ps-warning`, `--ps-error` | Semantic feedback |
| `--ps-border`, `--ps-radius` | Borders and rounding |
| `--ps-font-sans` | Body/UI font |

## Usage

- Prefer the shared React components in `apps/web/libs/ui`:
  - `Button` for primary/secondary/ghost actions.
  - `Input` and `Select` for form fields.
  - `Table` / `Th` / `Td` / `Tr` for tabular data.
  - `PageHeader` for page titles, descriptions, and primary actions.
- Use text utility classes for hierarchy:
  - `text-ps-fg` for primary text.
  - `text-ps-fg-muted` for secondary copy.
- For layouts and surfaces, use:
  - `bg-ps-bg` for main background.
  - `bg-ps-bg-card` for cards and panels.
  - `border-ps-border` for separators.

All dashboard pages (login, shifts, swap/drop, overtime, reports, notifications, calendar) are built from these primitives so that changes to theming flow consistently across the app.
