---
id: SPEC-102
item: ITEM-110
type: fix
feature_area: analyze
bump: patch
status: Accepted
title: 'Analyze result panel hierarchy and status treatment'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Analyze result panel hierarchy and status treatment

- **Status:** Accepted

## Intent

Keep core Result/Trace controls available in a constrained panel, make list-valued result content
easier to inspect, and distinguish unsolved results from rejected inputs.

## Scope

**In:** sticky Result/Trace tabs; sticky legend for the active view; scrollable view content; expandable
presentation for list-valued result data using the Trace Data structures style; distinct,
high-contrast status banners for no-solution and rejected/ineligible outcomes; accessibility and
responsive UI tests.

**Out:** changing algorithms or result values, changing trace playback semantics, resizing the
panel itself, or adding new artifact kinds.

## Rules

- The panel header and Result/Trace tabs remain visible while the active view’s content scrolls.
- The Result legend or Trace legend stays pinned in a consistently visible position within its view.
  When vertical space is constrained, only the content between navigation and legend becomes
  scrollable; controls do not overlap content.
- Scalar metrics remain immediately readable. List-valued result data that can grow substantially
  uses the existing expandable Data structures visual pattern, with accessible summary names and
  counts; expanding reveals the complete values.
- An eligible input for which no valid solution exists is presented as **No result**. Input rejected
  because it violates preconditions (such as unsupported direction or weights) is presented as
  **Rejected**. Their headings, visual treatments, and accessible status descriptions are distinct.
- Both status banners use strong readable foreground/background contrast and retain the explanatory
  reason text.

## Acceptance scenarios

### Scenario: Scroll a constrained Result

**Given** a result panel whose content is taller than the available viewport
**When** the user scrolls the Result content
**Then** the Result/Trace tabs and Result legend remain visible and usable.

### Scenario: Inspect a long list result

**Given** an analysis returns a list-valued artifact or metric
**When** Result is displayed
**Then** its expandable summary shows a useful label and item count, and expanding reveals every entry.

### Scenario: Distinguish no solution from rejected input

**Given** one eligible graph has no algorithm solution and another input violates that algorithm’s preconditions
**When** each analysis is run
**Then** the first displays a high-contrast No result state and the second a visibly distinct Rejected state, each with its reason.

### Scenario: Scroll Trace

**Given** Trace content exceeds the panel height
**When** the user scrolls through inspectors and events
**Then** its Result/Trace tabs and Trace legend remain visible without covering the scrollable content.
