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
  onBlur?: () => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  id?: string;
};

const btnBase = 'rounded p-1 transition-colors hover:bg-brand-gray-100';
const btnActive = 'bg-brand-gray-200 text-brand-dark-blue';

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  disabled = false,
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
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      transformPastedHTML(html) {
        return markdownToHtml(htmlToMarkdownPaste(html));
      },
      attributes: {
        ...(id ? { id } : {}),
        ...(ariaInvalid ? { 'aria-invalid': 'true' } : {}),
        class: 'min-h-[160px] px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentMd = htmlToMarkdown(editor.getHTML());
    if (currentMd === value) return;

    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

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
