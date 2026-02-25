# Forms Overhaul (P0)

**Goal**: Transform the current MVP form builder into a competitive, "Typeform-lite" experience with drag-and-drop capabilities, rich fields, and logic.

## 1. Architecture

### Core Libraries

- **Dnd Kit** (`@dnd-kit/core`, `@dnd-kit/sortable`): For accessible, robust drag-and-drop reordering.
- **Zustand**: `form-editor-store.ts` to manage the complex builder state (undo/redo, field selection, property editing) locally before saving.
- **Zod**: Runtime schema validation for form submissions.

### Data Model Improvements

The `FormField` data model needs expansion to support complex fields (e.g. types, options, validation, and logic).
**Source of Truth:** Refer to [`app/src/types/form.ts`](file:///Users/zayn/ground/gal/app/src/types/form.ts) for the exact implementation of `FormField` and `FormFieldType`.

## 2. Implementation Phases

### Phase 1: Interactive Builder (The "Feel")

**Objective**: User can drag to reorder fields and see a "live" preview.

- [X] Install `@dnd-kit`.
- [X] Create `FormEditorStore` (Zustand) to replace local component state.
- [X] Implement Sortable Canvas.
- [X] Refactor "Properties Panel" to be dynamic based on selected field type.

### Phase 2: Power Features & Missing Types

**Objective**: Feature parity with basic competitors.

- [X] **Dropdowns/Select**: Add options editor (add/remove/reorder options).
- [X] **Radio Buttons/Checkboxes**: Add UI for multiple choice.
- [X] **Date/Time**: Add date picker input.
- [X] **Validation**: Add "Helper Text" and specific constraints.

### Phase 3: Polish & Distribution

**Objective**: Production-ready experience.

- [X] **Auto-Save**: Debounced saving to backend.
- [X] **Share Modal**: "Copy Link", "Copy Embed Code" (iframe).
- [X] **Theme Support**: Basic color picker & typography for form branding.
- [X] **Undo/Redo**: History stack in Zustand store.

## 3. UX Guidelines

- **Canvas First**: The form preview should be center stage and look exactly like the final result.
- **Contextual Editing**: Clicking a field opens its properties immediately.
- **Instant Feedback**: Drag operations should feel 60fps smooth.

## 4. Completed Enhancements (Post-MVP)

### Phase 4: Logic & Reliability

- [X] **Conditional Logic**: Show/Hide fields based on other field values.
- [X] **Saving Indicator**: Visual "Saving..." / "Saved" feedback in header.
- [X] **Width Control**: Field-level 50% / 100% width toggle.

### Phase 5: UI/UX Overhaul (Legacy CRM Match)

- [X] **Create Modal**: "Start from Scratch" vs "Templates" selection.
- [X] **Sidebar Redesign**:
  - Categorized sections (Personal Info, Submit, Payments, Address, General).
  - 2-Column Grid layout.
  - Professional `lucide-react` SVG icons.

- **High-Fidelity Canvas**:
  - Real input styling (borders, placeholders) instead of gray blocks.
  - Bold, professional typography.
  - Specific "Consent" checkbox text layout.
  - Custom "Button" element rendering.
