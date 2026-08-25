# Admin UI refresh design QA

## Evidence

- source visual truth path: `/Users/jojoshine/.codex/generated_images/01a033f1-f646-7ce2-97b7-2db3bf93f5ba/exec-bbebd6e5-1cac-414b-8c1e-687053d5f0c0.png`
- implementation screenshot path: `artifacts/ui-refresh/users-reference-1487.png`
- combined comparison path: `artifacts/ui-refresh/reference-vs-implementation.png`
- viewport and DPR: the comparison implementation was captured at 1487×1058 CSS px, DPR 1; its PNG is natively 1487×1058. Desktop captures used 1440×900 CSS px, DPR 1, and are natively 1440×900.
- light theme user-list state: `theme-blue light`, page 1, page size 10, total 128, exact fixed ten-row preview data, search empty, no dialog, navigation closed, scroll position 0,0.
- responsive capture metadata: 390×844 CSS px/DPR 1 produced a 375×812 in-app Browser capture surface, retained as `/private/tmp/users-mobile-390-browser-raw.png` and `/private/tmp/users-mobile-nav-390-browser-raw.png`; each complete frame was resampled without cropping to the required 390×844 final PNG. The 1024×768 CSS px/DPR 1 capture was natively 1009×757, retained as `/private/tmp/users-tablet-1024-browser-raw.png`, then resampled without cropping to 1024×768. No content was cropped or synthesized.
- final PNG metadata: light 1440×900; dark 1440×900; dialog 1440×900; mobile 390×844; mobile navigation 390×844; tablet 1024×768; reference implementation 1487×1058; combined comparison 2974×1058.

## Comparison evidence

- full-view comparison evidence: the 2974×1058 combined image was opened as one input, with the 1487×1058 source on the left and the exact same-size light implementation on the right. Both use a fixed left navigation rail, quiet top bar, pale-gray workspace, white bounded content surface, blue primary actions/current item, and a compact ten-row table followed by pagination.
- focused sidebar comparison: width, vertical anchoring, section-label hierarchy, icon/text rhythm, pale-blue selected row, and slim blue selected indicator align. The implementation uses the brief's exact smaller preview menu payload, so reference-only navigation groups are not fabricated.
- focused toolbar comparison: the title/description/count hierarchy, right-aligned blue add action, search row, and card separators retain the reference's hierarchy and spacing. Reference-only tabs, filters, and utilities are approved deviations below.
- focused table comparison: header tint, fine dividers, ten-row density, muted secondary names, status green/disabled gray, restrained icon actions, and footer pagination form a coherent workspace rhythm. The fixed preview contract intentionally supplies no reference-only department/role/data-scope values or photographs.
- focused dialog comparison: `artifacts/ui-refresh/users-dialog-1440.png` was inspected together with the full reference styling. The source has no open-dialog state, so there is no same-state overlay to compare. The implementation dialog nevertheless carries the source's white surface, light border/shadow, strong title, grouped fields, blue primary action, gray secondary action, focus treatment, and responsive internal scroll behavior.

## Required fidelity surfaces

- fonts/typography: bundled local Geist and Geist Mono preserve the selected Geist family without a network dependency. Headings are dark and semibold; secondary text is smaller and muted; table labels retain compact legibility.
- spacing/layout rhythm: sidebar, header, card, toolbar, table, and pagination have consistent inset and divider rhythm. At 390px the workspace pagination stacks and confines its own page-control overflow, leaving the document at `scrollWidth=375` for `clientWidth=375`.
- colors/tokens: light and dark blue-theme screenshots use the shared theme tokens. Primary blue, selected-row blue tint, neutral workspace/card layers, green status, disabled gray, and red destructive action remain consistent.
- image/icon fidelity: the project Owl mark and Lucide icon family are preserved. Photo avatars are not invented; the preview identity uses the real fallback avatar behavior.
- copy/content: exact fixed preview names, masked contact data, total 128, page-size copy, permissions, and existing project action labels are preserved. No fake product feature or reference-only data was added.

## Approved deviations from the reference

The following source elements are intentionally not implemented because the project has no real data source or this round has no feature authorization: global search, production-environment selector, photo avatars, status tabs, bulk selection and bulk actions, department/role/account-status filters, refresh/column-settings/export controls, and extra role/data-scope columns. They are not visual defects. The exact QA menu payload also contains fewer navigation groups than the source and is not expanded with fake routes. Sidebar hierarchy, blue support, workspace density, and the title/toolbar/table/pagination rhythm remain aligned.

## Findings

- P0: none.
- P1: none.
- P2: none remaining.
- P3: the source is visually richer because of the approved reference-only data and controls; this is informational and is not actionable within the authorized scope.

## Comparison history

1. Mobile responsive iteration — blocked. At 390×844/DPR 1, `documentElement.scrollWidth=481` while the visual client width was 375. The workspace pagination root remained a 571px single row inside a 284px footer. Evidence: `/private/tmp/admin-ui-iteration1-mobile-overflow.png`.
2. Mobile responsive iteration — passed after TDD fix. A focused contract first failed because the workspace pagination lacked responsive containment. `DataTable.jsx` then stacks the workspace pagination at narrow widths and gives the pagination navigation a local maximum width and horizontal overflow. The focused suite passed 3/3 and in-app Browser remeasurement reported `documentElement.scrollWidth=375`, `clientWidth=375`, with no page-level horizontal scrollbar. Final evidence: `artifacts/ui-refresh/users-mobile-390.png` and `artifacts/ui-refresh/users-mobile-nav-390.png`.
3. Final same-state reference iteration — passed. `reference-vs-implementation.png` was opened as one combined input at 2974×1058. Full view plus focused sidebar, toolbar, table, typography, rhythm, tokens, icons, copy, and dialog styling found no actionable P0/P1/P2. All remaining visible differences are listed approved deviations or informational P3.

final result: passed
