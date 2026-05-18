import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlockLowlight from '@tiptap/extension-code-block';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
}

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
];

const TEXT_COLORS = [
  { label: 'Чёрный', value: '#000000' },
  { label: 'Красный', value: '#ef4444' },
  { label: 'Оранжевый', value: '#f59e0b' },
  { label: 'Жёлтый', value: '#eab308' },
  { label: 'Зелёный', value: '#22c55e' },
  { label: 'Синий', value: '#3b82f6' },
  { label: 'Фиолетовый', value: '#8b5cf6' },
  { label: 'Розовый', value: '#ec4899' },
  { label: 'Белый', value: '#ffffff' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Жёлтый', value: '#fef08a' },
  { label: 'Зелёный', value: '#bbf7d0' },
  { label: 'Синий', value: '#bfdbfe' },
  { label: 'Розовый', value: '#fbcfe8' },
];

export default function RichTextEditor({ content, onChange, height = 400 }: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formulaText, setFormulaText] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showHeadingPicker, setShowHeadingPicker] = useState(false);
  const [showAlignPicker, setShowAlignPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ defaultLanguage: 'javascript' }),
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      BulletList,
      OrderedList,
      Blockquote,
      Highlight.configure({ multicolor: true }),
      Underline,
      FontFamily,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) setShowColorPicker(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) setShowHighlightPicker(false);
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFontPicker(false);
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) setShowHeadingPicker(false);
      if (alignRef.current && !alignRef.current.contains(e.target as Node)) setShowAlignPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const insertFormula = () => {
    if (!editor || !formulaText.trim()) return;
    try {
      const html = katex.renderToString(formulaText, { throwOnError: false, displayMode: formulaText.startsWith('$$') });
      editor.commands.insertContent(`<span class="katex-formula">${html}</span><p></p>`);
    } catch {
      editor.commands.insertContent(`<code>${formulaText}</code><p></p>`);
    }
    setFormulaText('');
    setShowFormulaModal(false);
  };

  const insertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableModal(false);
  };

  const addImage = () => {
    if (!editor || !imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setShowImageModal(false);
  };

  const addLink = () => {
    if (!editor || !linkUrl.trim()) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
    setShowLinkModal(false);
  };

  if (!editor) return null;

  const ToolbarButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
      className={`rich-editor-toolbar-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );

  const DropdownWrapper = ({ open, trigger, children, ref }: { open: boolean; trigger: React.ReactNode; children: React.ReactNode; ref: React.RefObject<HTMLDivElement | null> }) => (
    <div className="rich-editor-dropdown" ref={ref}>
      {trigger}
      {open && <div className="rich-editor-dropdown-content">{children}</div>}
    </div>
  );

  return (
    <div className="rich-editor-container" style={{ height }}>
      <div className="rich-editor-toolbar">
        <div className="rich-editor-toolbar-row">
          <DropdownWrapper
            open={showHeadingPicker}
            ref={headingRef}
            trigger={<ToolbarButton active={showHeadingPicker} onClick={() => setShowHeadingPicker(!showHeadingPicker)} title="Заголовок">H</ToolbarButton>}
          >
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowHeadingPicker(false); }}>Заголовок 1</button>
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowHeadingPicker(false); }}>Заголовок 2</button>
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setShowHeadingPicker(false); }}>Заголовок 3</button>
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().toggleHeading({ level: 4 }).run(); setShowHeadingPicker(false); }}>Заголовок 4</button>
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().setParagraph().run(); setShowHeadingPicker(false); }}>Обычный текст</button>
          </DropdownWrapper>

          <DropdownWrapper
            open={showFontPicker}
            ref={fontRef}
            trigger={<ToolbarButton active={showFontPicker} onClick={() => setShowFontPicker(!showFontPicker)} title="Шрифт">Aa</ToolbarButton>}
          >
            {FONT_FAMILIES.map(f => (
              <button key={f.value} type="button" className="rich-editor-dropdown-item" style={{ fontFamily: f.value || undefined }} onClick={() => { editor.chain().focus().setFontFamily(f.value).run(); setShowFontPicker(false); }}>{f.label || 'Default'}</button>
            ))}
          </DropdownWrapper>

          <div className="rich-editor-separator" />

          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Жирный (Ctrl+B)"><b>B</b></ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Курсив (Ctrl+I)"><i>I</i></ToolbarButton>
          <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Подчёркнутый (Ctrl+U)"><u>U</u></ToolbarButton>
          <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Зачёркнутый"><s>S</s></ToolbarButton>

          <DropdownWrapper
            open={showColorPicker}
            ref={colorPickerRef}
            trigger={<ToolbarButton active={showColorPicker} onClick={() => setShowColorPicker(!showColorPicker)} title="Цвет текста"><span style={{ borderBottom: '3px solid var(--accent)' }}>A</span></ToolbarButton>}
          >
            {TEXT_COLORS.map(c => (
              <button key={c.value} type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().setColor(c.value).run(); setShowColorPicker(false); }}>
                <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: c.value, border: '1px solid var(--border)', marginRight: 8 }} />
                {c.label}
              </button>
            ))}
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}>Сбросить</button>
          </DropdownWrapper>

          <DropdownWrapper
            open={showHighlightPicker}
            ref={highlightRef}
            trigger={<ToolbarButton active={showHighlightPicker} onClick={() => setShowHighlightPicker(!showHighlightPicker)} title="Выделение"><span style={{ background: '#fef08a', padding: '0 2px' }}>Маркер</span></ToolbarButton>}
          >
            {HIGHLIGHT_COLORS.map(c => (
              <button key={c.value} type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().toggleHighlight({ color: c.value }).run(); setShowHighlightPicker(false); }}>
                <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: c.value, border: '1px solid var(--border)', marginRight: 8 }} />
                {c.label}
              </button>
            ))}
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}>Сбросить</button>
          </DropdownWrapper>

          <div className="rich-editor-separator" />

          <DropdownWrapper
            open={showAlignPicker}
            ref={alignRef}
            trigger={<ToolbarButton active={showAlignPicker} onClick={() => setShowAlignPicker(!showAlignPicker)} title="Выравнивание">≡</ToolbarButton>}
          >
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().setTextAlign('left').run(); setShowAlignPicker(false); }}>По левому краю</button>
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().setTextAlign('center').run(); setShowAlignPicker(false); }}>По центру</button>
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().setTextAlign('right').run(); setShowAlignPicker(false); }}>По правому краю</button>
            <button type="button" className="rich-editor-dropdown-item" onClick={() => { editor.chain().focus().setTextAlign('justify').run(); setShowAlignPicker(false); }}>По ширине</button>
          </DropdownWrapper>

          <div className="rich-editor-separator" />

          <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Маркированный список">• Список</ToolbarButton>
          <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Нумерованный список">1. Список</ToolbarButton>
          <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Цитата">❝ Цитата</ToolbarButton>

          <div className="rich-editor-separator" />

          <ToolbarButton onClick={() => setShowImageModal(true)} title="Вставить картинку">🖼 Картинка</ToolbarButton>
          <ToolbarButton onClick={() => setShowLinkModal(true)} title="Вставить ссылку">🔗 Ссылка</ToolbarButton>
          <ToolbarButton onClick={() => setShowFormulaModal(true)} title="Вставить формулу">∑ Формула</ToolbarButton>
          <ToolbarButton onClick={() => setShowTableModal(true)} title="Вставить таблицу">⊞ Таблица</ToolbarButton>
          <ToolbarButton active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Блок кода">{ } Код</ToolbarButton>

          <div className="rich-editor-separator" />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Отменить">↩</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Повторить">↪</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().clearContent().run()} title="Очистить">🗑</ToolbarButton>
        </div>
      </div>

      <div className="rich-editor-body">
        <EditorContent editor={editor} />
      </div>

      {showLinkModal && (
        <div className="rich-editor-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="rich-editor-modal" onClick={e => e.stopPropagation()}>
            <h3>Вставить ссылку</h3>
            <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" autoFocus />
            <div className="rich-editor-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={addLink}>Вставить</button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="rich-editor-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="rich-editor-modal" onClick={e => e.stopPropagation()}>
            <h3>Вставить картинку</h3>
            <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" autoFocus />
            <p className="rich-editor-hint">Вставьте URL картинки или загрузите файл</p>
            <div className="rich-editor-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowImageModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={addImage} disabled={!imageUrl.trim()}>Вставить</button>
            </div>
          </div>
        </div>
      )}

      {showFormulaModal && (
        <div className="rich-editor-modal-overlay" onClick={() => setShowFormulaModal(false)}>
          <div className="rich-editor-modal" onClick={e => e.stopPropagation()}>
            <h3>Вставить формулу (LaTeX)</h3>
            <input type="text" value={formulaText} onChange={e => setFormulaText(e.target.value)} placeholder="E = mc^2 или $$\int_0^\infty e^{-x} dx$$" autoFocus />
            {formulaText && (
              <div className="rich-editor-formula-preview">
                <p>Предпросмотр:</p>
                <div dangerouslySetInnerHTML={{ __html: katex.renderToString(formulaText, { throwOnError: false, displayMode: formulaText.startsWith('$$') }) }} />
              </div>
            )}
            <p className="rich-editor-hint">Используйте $$...$$ для формулы на отдельной строке</p>
            <div className="rich-editor-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowFormulaModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={insertFormula} disabled={!formulaText.trim()}>Вставить</button>
            </div>
          </div>
        </div>
      )}

      {showTableModal && (
        <div className="rich-editor-modal-overlay" onClick={() => setShowTableModal(false)}>
          <div className="rich-editor-modal" onClick={e => e.stopPropagation()}>
            <h3>Вставить таблицу</h3>
            <div className="rich-editor-table-config">
              <div className="form-group">
                <label>Строки</label>
                <input type="number" value={tableRows} onChange={e => setTableRows(parseInt(e.target.value) || 3)} min={2} max={20} />
              </div>
              <div className="form-group">
                <label>Столбцы</label>
                <input type="number" value={tableCols} onChange={e => setTableCols(parseInt(e.target.value) || 3)} min={2} max={10} />
              </div>
            </div>
            <div className="rich-editor-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowTableModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={insertTable}>Вставить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
