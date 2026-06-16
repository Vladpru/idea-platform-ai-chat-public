# Rich Text Editor for Idea Description

**Date:** 2026-06-16
**Status:** Approved

---

## Overview

Replace the plain `<textarea>` description field on the idea creation and edit forms with a rich text editor (Tiptap) that stores content as markdown. Add a markdown renderer to all surfaces that display the description field.

No backend changes are required. The `description` column remains a plain string with a 5000-character limit.

---

## Acceptance Criteria

- **AC1:** A toolbar with Bold, Italic, Bullet List, and Numbered List appears above the description field on both the create and edit forms.
- **AC2:** Selecting text and clicking Bold/Italic (or using Ctrl/Cmd+B, Ctrl/Cmd+I) immediately applies the formatting.
- **AC3:** Typing `- ` or `* ` followed by a space starts a bulleted list; typing `1. ` starts a numbered list. Pressing Enter creates the next list item.
- **AC4:** Saved markdown is restored exactly when the user reopens a draft or published idea for editing.
- **AC5:** Pasting rich content (from Word, Notion, a browser) converts HTML to markdown, retaining bold, italics, and lists while stripping unsupported tags (tables, scripts, iframes, inline styles).

---

## Technology Choices

| Package | Version | Purpose |
|---|---|---|
| `@tiptap/react` | latest | React editor wrapper |
| `@tiptap/starter-kit` | latest | Bold, Italic, BulletList, OrderedList, History, Paragraph |
| `turndown` + `@types/turndown` | latest | HTML → markdown (on change + paste) |
| `markdown-it` + `@types/markdown-it` | latest | Markdown → HTML (editor load + read-side rendering) |
| `dompurify` + `@types/dompurify` | latest | Sanitize HTML before rendering to prevent XSS |

---

## Data Flow

```
Form state (markdown string)
  │
  ├─ [WRITE] Editor loads: markdownToHtml(md) → Tiptap HTML content
  │
  ├─ [WRITE] User types/formats: Tiptap HTML → htmlToMarkdown(html) → form state
  │
  ├─ [WRITE] User pastes: transformPastedHTML → htmlToMarkdownPaste(html) → editor content
  │
  └─ [READ] Render: markdown string → markdownToHtml(md) → sanitize → dangerouslySetInnerHTML
```

`IdeaCreateFormValues.description` and `IdeaEditFormValues.description` remain `string`. All existing mappers, save payloads, and validation schemas are unchanged.

**Character count:** Raw markdown string length is counted and compared against the 5000-char limit. The counter displayed to the user reflects the raw markdown length (not the visual text length).

**AI prefill:** Plain text AI-generated descriptions are valid markdown. No backend changes needed.

---

## New Files

### `frontend/src/shared/lib/rich-text/markdown-to-html.ts`

Exports `markdownToHtml(md: string): string`.

Uses `markdown-it` with default options. Converts the markdown string to an HTML string safe to pass to Tiptap's `content` prop.

### `frontend/src/shared/lib/rich-text/html-to-markdown.ts`

Exports:
- `htmlToMarkdown(html: string): string` — used on every Tiptap `onUpdate`, converts HTML output to markdown for form state.
- `htmlToMarkdownPaste(html: string): string` — used in `transformPastedHTML`; strips unsupported tags (tables, iframes, `script`, `style`, inline `style` attributes) before converting.

Uses `turndown`. Turndown configuration:
- Heading rule: convert `h1`–`h6` to `#` markdown headings (keep structural intent).
- All other unsupported elements: removed by default Turndown rules.

### `frontend/src/shared/ui/rich-text-editor/RichTextEditor.tsx`

Tiptap-based editor component.

**Props:**
```ts
type RichTextEditorProps = {
  value: string;           // markdown string
  onChange: (md: string) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-invalid'?: boolean;
  id?: string;
};
```

**Internals:**
- Extensions: `StarterKit` only (includes Bold, Italic, BulletList, OrderedList, Paragraph, History, HardBreak).
- On mount / when `value` changes externally: set editor content to `markdownToHtml(value)`. Guard against feedback loop: only update editor content when the incoming value differs from the current editor's serialized markdown.
- `onUpdate`: call `onChange(htmlToMarkdown(editor.getHTML()))`.
- `transformPastedHTML`: call `htmlToMarkdownPaste(html)` and return the resulting markdown string. Tiptap's paste pipeline receives this string and inserts it as plain text content, which the editor then parses normally.
- When `disabled`: toolbar is hidden (`hidden`); editor content area gets `pointer-events-none opacity-50`.

**Toolbar buttons (in order):** Bold · Italic · `|` divider · Bullet List · Numbered List.

Each button:
- Uses `lucide-react` icons: `Bold`, `Italic`, `List`, `ListOrdered`.
- Active state (when cursor is inside formatted content): `bg-brand-gray-200 text-brand-dark-blue`.
- Inactive hover: `hover:bg-brand-gray-100`.
- `type="button"` to prevent form submission.

**Styling:**
- Outer wrapper: `border border-brand-gray-200 rounded-md bg-card mt-2` (matches `textareaClass` border/bg).
- Toolbar: `flex items-center gap-1 px-2 py-1.5 border-b border-brand-gray-200`.
- Editor content area: `min-h-[160px] px-3 py-2 text-sm focus-within:outline-none prose prose-sm max-w-none`.
- Tailwind `@tailwindcss/typography` plugin (`prose`) styles the rendered HTML inside the editor. Add the plugin to the frontend.

### `frontend/src/shared/ui/rich-text-editor/MarkdownRenderer.tsx`

Read-only markdown renderer.

**Props:**
```ts
type MarkdownRendererProps = {
  content: string;
  className?: string;
};
```

**Internals:**
- Convert: `markdownToHtml(content)`.
- Sanitize: `DOMPurify.sanitize(html)` — removes scripts, event handlers, and unsafe attributes.
- Render: `<div className={cn('prose prose-sm max-w-none', className)} dangerouslySetInnerHTML={{ __html: sanitized }} />`.

### `frontend/src/shared/ui/rich-text-editor/index.ts`

Re-exports `RichTextEditor` and `MarkdownRenderer`.

---

## Modified Files

### `frontend/src/features/ideas/ui/create-idea/IdeaCreateForm.tsx`

Replace the `<textarea {...register('description')} />` block with:

```tsx
<Controller
  name="description"
  control={control}
  render={({ field }) => (
    <RichTextEditor
      id={`${formId}-description`}
      value={field.value ?? ''}
      onChange={field.onChange}
      disabled={formBusy}
      placeholder="Enter a description of the idea..."
      aria-invalid={!!errors.description}
    />
  )}
/>
```

The character counter (`descriptionValue.length}/5000`) and `FieldError` remain unchanged below the editor. The `watch('description')` call that powers `descriptionValue` continues to work — it now returns a markdown string.

### `frontend/src/features/ideas/ui/idea-form/IdeaForm.tsx`

Same `Controller` swap — replace `<textarea {...register('description')} />` with `<RichTextEditor>` via `Controller`. Same props pattern as above.

### `frontend/src/features/idea-details/ui/IdeaDetailsView.tsx`

Replace:
```tsx
<p className={entityDescriptionDetailClass}>{idea.description}</p>
```
With:
```tsx
<MarkdownRenderer content={idea.description} className={entityDescriptionDetailClass} />
```

### `frontend/src/features/ideas-dashboard/ui/cards/DashboardCardStandard.tsx`

Replace:
```tsx
{card.description?.trim() || emptyDescriptionText}
```
With:
```tsx
<MarkdownRenderer content={card.description?.trim() || ''} className={entityDescriptionPreviewClass} />
```
If `card.description` is empty, render the `emptyDescriptionText` plain string as before (keep the existing fallback logic, just wrap the non-empty case).

### `frontend/src/features/idea-details/ui/similar/SimilarIdeaCard.tsx`

Replace the plain `{card.description}` text node with `<MarkdownRenderer>`.

### `frontend/src/shared/lib/entity-description-classes.ts`

Remove `whitespace-pre-wrap` from both `entityDescriptionTextClass` and `entityDescriptionPreviewClass`. Markdown-rendered HTML uses `<p>`, `<br>`, and list elements for spacing — `whitespace-pre-wrap` would cause double line breaks.

---

## Tailwind Typography Plugin

Add `@tailwindcss/typography` to `frontend/`:

```bash
yarn add -D @tailwindcss/typography
```

Add to Tailwind config (Tailwind v4 uses CSS config):

```css
@plugin "@tailwindcss/typography";
```

This enables the `prose` and `prose-sm` utility classes used inside both `RichTextEditor` (editor content area) and `MarkdownRenderer`.

Dark mode: use `prose dark:prose-invert` to ensure proper text colors in dark theme.

---

## Surfaces That Render Description

| Surface | File | Change |
|---|---|---|
| Idea detail page | `IdeaDetailsView.tsx` | `<p>` → `<MarkdownRenderer>` |
| Ideas dashboard card | `DashboardCardStandard.tsx` | text node → `<MarkdownRenderer>` |
| Similar idea card | `SimilarIdeaCard.tsx` | text node → `<MarkdownRenderer>` |

Surfaces that show description as UI strings (modal copy, settings panel descriptions, conference descriptions) are unrelated to idea description content and are not changed.

---

## Excluded from Scope

- Problem description field — not part of this feature.
- AI summary block — renders separately, not the user-authored description.
- Backend changes — none required.
- New markdown features beyond Bold, Italic, Bullet List, Numbered List (e.g. headings, code blocks, links) — not in scope per AC1.
