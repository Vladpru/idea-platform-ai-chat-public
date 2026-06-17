# Rich Text Editor for Idea Description — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain textarea on idea create/edit forms with a Tiptap rich text editor that stores content as markdown, and render markdown on all description display surfaces.

**Architecture:** A `RichTextEditor` component wraps Tiptap, converting between markdown (form state) and HTML (editor internal state) on mount and on every change. A `MarkdownRenderer` component handles the read path: markdown → HTML → DOMPurify → `dangerouslySetInnerHTML`. Both live under `frontend/src/shared/ui/rich-text-editor/`. The two conversion helpers (`markdownToHtml`, `htmlToMarkdown`) are pure functions in `frontend/src/shared/lib/rich-text/`.

**Tech Stack:** `@tiptap/react`, `@tiptap/starter-kit`, `turndown` + `@types/turndown`, `markdown-it` + `@types/markdown-it`, `dompurify` + `@types/dompurify`, `@tailwindcss/typography`

---

## File Map

**New files:**
- `frontend/src/shared/lib/rich-text/markdown-to-html.ts` — `markdownToHtml(md)` using `markdown-it`
- `frontend/src/shared/lib/rich-text/html-to-markdown.ts` — `htmlToMarkdown(html)` and `htmlToMarkdownPaste(html)` using `turndown`
- `frontend/src/shared/ui/rich-text-editor/RichTextEditor.tsx` — Tiptap editor with toolbar
- `frontend/src/shared/ui/rich-text-editor/MarkdownRenderer.tsx` — read-only markdown renderer
- `frontend/src/shared/ui/rich-text-editor/index.ts` — re-exports

**Modified files:**
- `frontend/src/app/styles/index.css` — add `@plugin "@tailwindcss/typography"`
- `frontend/src/shared/lib/entity-description-classes.ts` — remove `whitespace-pre-wrap`
- `frontend/src/features/ideas/ui/create-idea/IdeaCreateForm.tsx` — swap `<textarea>` for `<RichTextEditor>` via `Controller`
- `frontend/src/features/ideas/ui/idea-form/IdeaForm.tsx` — same swap
- `frontend/src/features/idea-details/ui/IdeaDetailsView.tsx` — `<p>` → `<MarkdownRenderer>`
- `frontend/src/features/ideas-dashboard/ui/cards/DashboardCardStandard.tsx` — text node → `<MarkdownRenderer>`
- `frontend/src/features/idea-details/ui/similar/SimilarIdeaCard.tsx` — text node → `<MarkdownRenderer>`

---

## Task 1: Install dependencies

**Files:** none (package.json changes only)

- [ ] **Step 1: Install runtime packages**

```bash
cd frontend && yarn add @tiptap/react @tiptap/starter-kit turndown markdown-it dompurify
```

Expected: packages added to `frontend/package.json` `dependencies`.

- [ ] **Step 2: Install type packages and typography plugin**

```bash
cd frontend && yarn add -D @types/turndown @types/markdown-it @types/dompurify @tailwindcss/typography
```

Expected: packages added to `frontend/package.json` `devDependencies`.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/yarn.lock
git commit -m "chore(frontend): install tiptap, markdown libs, and typography plugin"
```

---

## Task 2: Add `@tailwindcss/typography` plugin to CSS config

**Files:**
- Modify: `frontend/src/app/styles/index.css`

- [ ] **Step 1: Add plugin directive**

Open `frontend/src/app/styles/index.css`. After the last `@import` line (currently `@import '@fontsource-variable/eb-garamond';`) and before `@custom-variant dark`, add:

```css
@plugin "@tailwindcss/typography";
```

The top of the file should now read:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';
@import '@fontsource-variable/geist';
@import '@fontsource-variable/eb-garamond';

@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
cd frontend && yarn dev
```

Expected: server starts, no CSS parse errors in terminal. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/styles/index.css
git commit -m "feat(frontend): enable @tailwindcss/typography plugin"
```

---

## Task 3: Create `markdownToHtml` utility

**Files:**
- Create: `frontend/src/shared/lib/rich-text/markdown-to-html.ts`

- [ ] **Step 1: Create the file**

```ts
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return md.render(markdown);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shared/lib/rich-text/markdown-to-html.ts
git commit -m "feat(frontend): add markdownToHtml utility"
```

---

## Task 4: Create `htmlToMarkdown` utilities

**Files:**
- Create: `frontend/src/shared/lib/rich-text/html-to-markdown.ts`

- [ ] **Step 1: Create the file**

```ts
import TurndownService from 'turndown';

function createTurndown(): TurndownService {
  const service = new TurndownService({ headingStyle: 'atx' });

  service.addRule('heading', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement(content, node) {
      const level = Number((node as HTMLElement).tagName.charAt(1));
      const prefix = '#'.repeat(level);
      return `\n\n${prefix} ${content}\n\n`;
    },
  });

  return service;
}

const td = createTurndown();

function stripUnsupportedTags(html: string): string {
  return html
    .replace(/<(table|thead|tbody|tr|th|td|iframe|script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/\s+style="[^"]*"/gi, '');
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return td.turndown(html);
}

export function htmlToMarkdownPaste(html: string): string {
  if (!html) return '';
  return td.turndown(stripUnsupportedTags(html));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shared/lib/rich-text/html-to-markdown.ts
git commit -m "feat(frontend): add htmlToMarkdown and htmlToMarkdownPaste utilities"
```

---

## Task 5: Create `MarkdownRenderer` component

**Files:**
- Create: `frontend/src/shared/ui/rich-text-editor/MarkdownRenderer.tsx`

- [ ] **Step 1: Create the file**

```tsx
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

import { markdownToHtml } from '@/shared/lib/rich-text/markdown-to-html';
import { cn } from '@/shared/lib/utils';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = useMemo(() => {
    const raw = markdownToHtml(content);
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shared/ui/rich-text-editor/MarkdownRenderer.tsx
git commit -m "feat(frontend): add MarkdownRenderer component"
```

---

## Task 6: Create `RichTextEditor` component

**Files:**
- Create: `frontend/src/shared/ui/rich-text-editor/RichTextEditor.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';

import { htmlToMarkdown, htmlToMarkdownPaste } from '@/shared/lib/rich-text/html-to-markdown';
import { markdownToHtml } from '@/shared/lib/rich-text/markdown-to-html';
import { cn } from '@/shared/lib/utils';

type RichTextEditorProps = {
  value: string;
  onChange: (md: string) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-invalid'?: boolean;
  id?: string;
};

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
  'aria-invalid': ariaInvalid,
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: markdownToHtml(value),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(htmlToMarkdown(editor.getHTML()));
    },
    editorProps: {
      transformPastedHTML(html) {
        return htmlToMarkdownPaste(html);
      },
      attributes: {
        id: id ?? '',
        'aria-invalid': ariaInvalid ? 'true' : 'false',
        class: 'min-h-[160px] px-3 py-2 text-sm focus-within:outline-none prose prose-sm dark:prose-invert max-w-none',
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentMd = htmlToMarkdown(editor.getHTML());
    if (currentMd === value) return;

    editor.commands.setContent(markdownToHtml(value), false);
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const btnBase =
    'rounded p-1 transition-colors hover:bg-brand-gray-100 type-button';
  const btnActive = 'bg-brand-gray-200 text-brand-dark-blue';

  return (
    <div
      className={cn(
        'border border-brand-gray-200 rounded-md bg-card mt-2',
        ariaInvalid && 'border-destructive',
      )}
    >
      {!disabled && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-brand-gray-200">
          <button
            type="button"
            aria-label="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={cn(btnBase, editor?.isActive('bold') && btnActive)}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            aria-label="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={cn(btnBase, editor?.isActive('italic') && btnActive)}
          >
            <Italic size={14} />
          </button>
          <span className="mx-1 h-4 w-px bg-brand-gray-200" aria-hidden />
          <button
            type="button"
            aria-label="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={cn(btnBase, editor?.isActive('bulletList') && btnActive)}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            aria-label="Numbered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={cn(btnBase, editor?.isActive('orderedList') && btnActive)}
          >
            <ListOrdered size={14} />
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(disabled && 'pointer-events-none opacity-50')}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shared/ui/rich-text-editor/RichTextEditor.tsx
git commit -m "feat(frontend): add RichTextEditor component with Tiptap"
```

---

## Task 7: Create barrel export for rich-text-editor

**Files:**
- Create: `frontend/src/shared/ui/rich-text-editor/index.ts`

- [ ] **Step 1: Create the file**

```ts
export { RichTextEditor } from './RichTextEditor';
export { MarkdownRenderer } from './MarkdownRenderer';
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/shared/ui/rich-text-editor/index.ts
git commit -m "feat(frontend): export RichTextEditor and MarkdownRenderer"
```

---

## Task 8: Remove `whitespace-pre-wrap` from description classes

**Files:**
- Modify: `frontend/src/shared/lib/entity-description-classes.ts`

Current content of the file:
```ts
import { cn } from '@/shared/lib/utils';

export const entityDescriptionFontClass = 'font-description';

export const entityDescriptionTextClass = cn(
  entityDescriptionFontClass,
  'text-brand-gray-800 text-sm leading-relaxed whitespace-pre-wrap sm:text-base',
);

export const entityDescriptionDetailClass = cn(
  entityDescriptionTextClass,
  'max-w-full min-w-0 wrap-break-word',
);

export const entityDescriptionPreviewClass = cn(
  entityDescriptionFontClass,
  'text-brand-black text-sm leading-relaxed whitespace-pre-wrap sm:text-base',
);
```

- [ ] **Step 1: Remove `whitespace-pre-wrap` from both classes**

Replace the file with:

```ts
import { cn } from '@/shared/lib/utils';

export const entityDescriptionFontClass = 'font-description';

export const entityDescriptionTextClass = cn(
  entityDescriptionFontClass,
  'text-brand-gray-800 text-sm leading-relaxed sm:text-base',
);

export const entityDescriptionDetailClass = cn(
  entityDescriptionTextClass,
  'max-w-full min-w-0 wrap-break-word',
);

export const entityDescriptionPreviewClass = cn(
  entityDescriptionFontClass,
  'text-brand-black text-sm leading-relaxed sm:text-base',
);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/shared/lib/entity-description-classes.ts
git commit -m "refactor(frontend): remove whitespace-pre-wrap from description classes"
```

---

## Task 9: Swap textarea in `IdeaCreateForm`

**Files:**
- Modify: `frontend/src/features/ideas/ui/create-idea/IdeaCreateForm.tsx`

- [ ] **Step 1: Add import for `RichTextEditor`**

At the top of the file, add the import alongside the other shared UI imports:

```tsx
import { RichTextEditor } from '@/shared/ui/rich-text-editor';
```

- [ ] **Step 2: Replace the `<textarea>` block**

Find this block (around line 400–415):

```tsx
<textarea
  id={`${formId}-description`}
  className={cn(textareaClass, 'mt-2')}
  placeholder="Enter a description of the idea..."
  aria-invalid={!!errors.description}
  disabled={formBusy}
  maxLength={5000}
  {...register('description')}
/>
```

Replace it with:

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

The `register` import is no longer needed for this field, but leave it since it's still used for `title`. The character counter below (`{descriptionValue.length}/5000`) and `FieldError` are unchanged — they continue to work because `watch('description')` returns the markdown string.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/ideas/ui/create-idea/IdeaCreateForm.tsx
git commit -m "feat(frontend): replace textarea with RichTextEditor in IdeaCreateForm"
```

---

## Task 10: Swap textarea in `IdeaForm` (edit form)

**Files:**
- Modify: `frontend/src/features/ideas/ui/idea-form/IdeaForm.tsx`

- [ ] **Step 1: Add import for `RichTextEditor`**

At the top of the file, add:

```tsx
import { RichTextEditor } from '@/shared/ui/rich-text-editor';
```

- [ ] **Step 2: Replace the `<textarea>` block**

Find this block (around line 137–145):

```tsx
<textarea
  id={`${formId}-description`}
  className={cn(textareaClass, 'mt-2')}
  placeholder="Enter a description of the idea..."
  aria-invalid={!!errors.description}
  disabled={isSubmitting}
  {...register('description')}
/>
```

Replace it with:

```tsx
<Controller
  name="description"
  control={control}
  render={({ field }) => (
    <RichTextEditor
      id={`${formId}-description`}
      value={field.value ?? ''}
      onChange={field.onChange}
      disabled={isSubmitting}
      placeholder="Enter a description of the idea..."
      aria-invalid={!!errors.description}
    />
  )}
/>
```

`Controller` is already imported in this file (line 18). No new imports needed beyond `RichTextEditor`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/ideas/ui/idea-form/IdeaForm.tsx
git commit -m "feat(frontend): replace textarea with RichTextEditor in IdeaForm"
```

---

## Task 11: Add `MarkdownRenderer` to `IdeaDetailsView`

**Files:**
- Modify: `frontend/src/features/idea-details/ui/IdeaDetailsView.tsx`

- [ ] **Step 1: Add import**

Add to the imports at the top of the file:

```tsx
import { MarkdownRenderer } from '@/shared/ui/rich-text-editor';
```

- [ ] **Step 2: Replace the description `<p>` block**

Find this block (around line 558–566):

```tsx
{idea.description ? (
  <p className={entityDescriptionDetailClass}>
    {idea.description}
  </p>
) : (
  <p className="text-brand-gray-500 text-sm italic">
    No description provided yet.
  </p>
)}
```

Replace it with:

```tsx
{idea.description ? (
  <MarkdownRenderer content={idea.description} className={entityDescriptionDetailClass} />
) : (
  <p className="text-brand-gray-500 text-sm italic">
    No description provided yet.
  </p>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/idea-details/ui/IdeaDetailsView.tsx
git commit -m "feat(frontend): render idea description as markdown in IdeaDetailsView"
```

---

## Task 12: Add `MarkdownRenderer` to `DashboardCardStandard`

**Files:**
- Modify: `frontend/src/features/ideas-dashboard/ui/cards/DashboardCardStandard.tsx`

- [ ] **Step 1: Add import**

Add to the imports at the top of the file:

```tsx
import { MarkdownRenderer } from '@/shared/ui/rich-text-editor';
```

- [ ] **Step 2: Replace the description node**

Find this block (around line 166–174):

```tsx
<p
  className={cn(
    entityDescriptionPreviewClass,
    'text-brand-gray-600 line-clamp-3',
  )}
>
  {card.description?.trim() || emptyDescriptionText}
</p>
```

Replace it with:

```tsx
{card.description?.trim() ? (
  <MarkdownRenderer
    content={card.description.trim()}
    className={cn(entityDescriptionPreviewClass, 'text-brand-gray-600 line-clamp-3')}
  />
) : (
  <p className={cn(entityDescriptionPreviewClass, 'text-brand-gray-600 line-clamp-3')}>
    {emptyDescriptionText}
  </p>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/ideas-dashboard/ui/cards/DashboardCardStandard.tsx
git commit -m "feat(frontend): render description as markdown in DashboardCardStandard"
```

---

## Task 13: Add `MarkdownRenderer` to `SimilarIdeaCard`

**Files:**
- Modify: `frontend/src/features/idea-details/ui/similar/SimilarIdeaCard.tsx`

- [ ] **Step 1: Add import**

Add to the imports at the top of the file:

```tsx
import { MarkdownRenderer } from '@/shared/ui/rich-text-editor';
```

- [ ] **Step 2: Replace the description node**

Find this block (around line 67–69):

```tsx
<p className={cn(entityDescriptionPreviewClass, 'line-clamp-3')}>
  {card.description || 'No description available for this idea.'}
</p>
```

Replace it with:

```tsx
{card.description ? (
  <MarkdownRenderer
    content={card.description}
    className={cn(entityDescriptionPreviewClass, 'line-clamp-3')}
  />
) : (
  <p className={cn(entityDescriptionPreviewClass, 'line-clamp-3')}>
    No description available for this idea.
  </p>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && yarn build 2>&1 | grep -E "error|Error"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/idea-details/ui/similar/SimilarIdeaCard.tsx
git commit -m "feat(frontend): render description as markdown in SimilarIdeaCard"
```

---

## Task 14: Manual smoke test

No code changes in this task — verify the feature end-to-end in the browser.

- [ ] **Step 1: Start dev servers**

In two terminals:

```bash
# Terminal 1
cd backend && yarn start:dev

# Terminal 2
cd frontend && yarn dev
```

- [ ] **Step 2: Test editor — create flow**

  1. Navigate to `/ideas/new`.
  2. Verify the description field shows a toolbar with Bold, Italic, Bullet List, Numbered List buttons.
  3. Type some text, select it, click **Bold** → text becomes `**bold**` internally; toolbar button highlights.
  4. Click **Bullet List** → a bulleted list item appears.
  5. Check the character counter below the editor — it should show the raw markdown length (e.g. `**hello** ` is 10 chars).
  6. Save as draft.

- [ ] **Step 3: Test editor — edit flow**

  1. Open the draft from My Ideas > Drafts.
  2. Verify the existing formatted content is restored exactly (bold stays bold, lists stay lists).
  3. Make a change, save. Verify the change persists after reloading.

- [ ] **Step 4: Test paste**

  1. Copy a paragraph from a web page that has bold text and a list.
  2. Paste into the description field.
  3. Verify bold and lists are preserved; tables/scripts are stripped.

- [ ] **Step 5: Test read surfaces**

  1. Publish an idea with bold and bullet list content.
  2. Check the idea detail page — description renders formatted HTML (bold text, `<ul>` list).
  3. Check the ideas dashboard card — description preview shows formatted text with `line-clamp-3`.
  4. Check the Similar Ideas widget on another idea detail page.

- [ ] **Step 6: Test disabled state**

  1. Observe the description field in the edit form while saving (form busy) — toolbar should be hidden, content area should be semi-transparent.

- [ ] **Step 7: Commit if all checks pass**

```bash
git add -A
git commit -m "feat(frontend): rich text editor for idea description (Tiptap + markdown)"
```
