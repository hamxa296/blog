import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ParagraphBlock as PB } from '../../../types/blockTypes';
import { Bold, Italic, Link, Unlink } from 'lucide-react';

interface Props {
  block: PB;
  onChange: (data: PB['data']) => void;
  onEnter?: () => void;
  onDelete?: () => void;
  autoFocus?: boolean;
}

export const ParagraphBlock: React.FC<Props> = ({ block, onChange, onEnter, onDelete, autoFocus }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, link: false });
  const isComposing = useRef(false);

  // Set initial HTML
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== block.data.html) {
      editorRef.current.innerHTML = block.data.html;
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [autoFocus]);

  const saveContent = useCallback(() => {
    if (editorRef.current) {
      onChange({ html: editorRef.current.innerHTML });
    }
  }, [onChange]);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setToolbar(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      setToolbar(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const edRect = editorRef.current.getBoundingClientRect();
    setToolbar({
      top: rect.top - edRect.top - 44,
      left: Math.min(
        Math.max(rect.left - edRect.left + rect.width / 2 - 80, 0),
        edRect.width - 160
      ),
    });
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      link: !!sel.anchorNode?.parentElement?.closest('a'),
    });
  }, []);

  const format = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    saveContent();
    checkSelection();
  };

  const handleLink = () => {
    const sel = window.getSelection();
    if (activeFormats.link) {
      format('unlink');
    } else if (sel && !sel.isCollapsed) {
      const url = window.prompt('Enter URL:');
      if (url) format('createLink', url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveContent();
      onEnter?.();
    } else if (e.key === 'Backspace') {
      const el = editorRef.current;
      if (el && el.innerHTML === '' || el?.innerHTML === '<br>') {
        e.preventDefault();
        onDelete?.();
      }
    }
  };

  return (
    <div className="relative block-editable-wrap">
      {/* Floating toolbar */}
      {toolbar && (
        <div
          className="block-format-toolbar"
          style={{ top: toolbar.top, left: toolbar.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className={`block-format-btn ${activeFormats.bold ? 'active' : ''}`}
            onClick={() => format('bold')}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className={`block-format-btn ${activeFormats.italic ? 'active' : ''}`}
            onClick={() => format('italic')}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="block-format-divider" />
          <button
            type="button"
            className={`block-format-btn ${activeFormats.link ? 'active' : ''}`}
            onClick={handleLink}
            title={activeFormats.link ? 'Remove link' : 'Add link'}
          >
            {activeFormats.link ? <Unlink className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="block-paragraph-editor"
        data-placeholder="Write something..."
        onInput={saveContent}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; saveContent(); }}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onBlur={() => { saveContent(); setTimeout(() => setToolbar(null), 150); }}
      />
    </div>
  );
};
