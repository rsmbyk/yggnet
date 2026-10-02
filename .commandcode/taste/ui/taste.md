# UI / design

- Strongly values visual consistency across surfaces: identical sizes for circular buttons in every bar, identical inner paddings across all panels, uniform edge paddings/margins between panels and HUD. Confidence: 0.9
- Wants chrome, panels, and controls to be content-fit and never stretched or forced to fill space. Confidence: 0.85
- Prefers field titles/primary labels emphasized and helper/hint text de-emphasized; wants useful helper text under inputs that explains what the option does or gives actionable constraints (such as allowed characters), rather than redundant state text like “Same as original.” Confidence: 0.8
- Dislikes bold weight in dropdown options and list items — wants them normal weight. Confidence: 0.75
- Wants text, labels, and icons vertically centered within rows, pills, chips, and icon buttons. Confidence: 0.85
- Wants scrollable content to span the full panel width so the scrollbar sits flush at the panel edge. Confidence: 0.8
- Avoids nested scroll areas: prefers the parent to grow instead, and only allows nesting when space truly runs out. Confidence: 0.75
- Wants primary actions visually emphasized (but "not too dramatic"), destructive buttons styled as danger, and a confirmation before destructive/irreversible data actions (deleting saved items, overwriting an existing name). Confidence: 0.75
- Prefers icon-only buttons inside panels and keeps those rectangular; circular buttons are reserved for the toolbars. Confidence: 0.65
- Prefers motion over instant state changes (e.g. animate camera resets), short durations (~400 ms), and a simple fade-out for closing panels when a slide feels jarring. Confidence: 0.7
- Prefers removing imposed caps/limits on options and inputs, letting users go "on their own caution" rather than being gated. Confidence: 0.7
- Prefers transient feedback through the toast system rather than inline notice text in panels. Confidence: 0.6
- Layered dismissal: Esc should only close the topmost dropdown/listbox, not all open panels; clicking outside the panels closes them. Confidence: 0.65
- Renames features/UI labels to match the vocabulary they use (e.g. Advanced → Tools, Filters → Tags) and expects that terminology to be applied consistently. Confidence: 0.7
- Prefers field helper text to sit close beneath its input, avoiding an oversized gap. Confidence: 0.8.
- Prefers search controls to use proper, visibly styled input fields rather than bare inputs. Confidence: 0.75
