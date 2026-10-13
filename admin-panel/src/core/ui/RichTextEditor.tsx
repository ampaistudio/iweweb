import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { toEditorHtml } from '../utils/richText';

export interface RichTextEditorProps {
  label?: string;
  error?: string;
  helperText?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
  allowHeadings?: boolean;
}

const ToolbarButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ active, onClick, label, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-accent text-white' : 'text-secondary hover:bg-surface-hover'
    }`}
  >
    {children}
  </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  error,
  helperText,
  value,
  onChange,
  placeholder,
  id,
  allowHeadings = true,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: allowHeadings ? { levels: [2, 3] } : false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || '',
      }),
    ],
    content: toEditorHtml(value || ''),
    editorProps: {
      attributes: {
        class: 'rich-text-content focus:outline-none min-h-[160px] text-sm text-primary leading-relaxed',
        role: 'textbox',
        'aria-label': label || 'Editor de texto',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.isEmpty ? '' : e.getHTML());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = toEditorHtml(value || '');
    if (incoming !== current && !editor.isFocused) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const editorId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={editorId} className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div
        id={editorId}
        className={`w-full bg-surface border ${
          error ? 'border-danger' : 'border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20'
        } rounded-xl transition-all overflow-hidden`}
      >
        {editor && (
          <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-border bg-surface-elevated/50">
            <ToolbarButton
              label="Negrita"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <strong>N</strong>
            </ToolbarButton>
            {allowHeadings && <>
              <ToolbarButton label="Título de sección" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
              <ToolbarButton label="Subtítulo" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
            </>}
            <ToolbarButton
              label="Itálica"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <em>K</em>
            </ToolbarButton>
            <ToolbarButton
              label="Lista con viñetas"
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              •≡
            </ToolbarButton>
            <ToolbarButton
              label="Lista numerada"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1.≡
            </ToolbarButton>
          </div>
        )}
        <div className="px-3.5 py-3 max-h-[60vh] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger-text font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-muted">{helperText}</p>}
    </div>
  );
};
