
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Code,
} from 'lucide-react';
import './rich-text-editor.css';

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const buttonClass = 'px-2 py-1 rounded hover:bg-muted border border-input';
  const activeClass = 'bg-muted';

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1 p-2 bg-muted border-b">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonClass} ${editor.isActive('bold') ? activeClass : ''}`}
          title="粗体 (Ctrl+B)"
        >
          <Bold size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonClass} ${editor.isActive('italic') ? activeClass : ''}`}
          title="斜体 (Ctrl+I)"
        >
          <Italic size={16} />
        </Button>

        <div className="w-px bg-input mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? activeClass : ''}`}
          title="标题 2"
        >
          <Heading2 size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${buttonClass} ${editor.isActive('heading', { level: 3 }) ? activeClass : ''}`}
          title="标题 3"
        >
          <Heading3 size={16} />
        </Button>

        <div className="w-px bg-input mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonClass} ${editor.isActive('bulletList') ? activeClass : ''}`}
          title="无序列表"
        >
          <List size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonClass} ${editor.isActive('orderedList') ? activeClass : ''}`}
          title="有序列表"
        >
          <ListOrdered size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${buttonClass} ${editor.isActive('blockquote') ? activeClass : ''}`}
          title="引用"
        >
          <Quote size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${buttonClass} ${editor.isActive('codeBlock') ? activeClass : ''}`}
          title="代码块"
        >
          <Code size={16} />
        </Button>

        <div className="w-px bg-input mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          className={buttonClass}
          title="撤销 (Ctrl+Z)"
        >
          撤销
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          className={buttonClass}
          title="重做 (Ctrl+Shift+Z)"
        >
          重做
        </Button>
      </div>

      {/* 编辑器 */}
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[300px]" />
    </div>
  );
}
