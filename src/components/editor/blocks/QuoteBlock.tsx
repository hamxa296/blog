import React, { useRef, useEffect } from 'react';
import type { QuoteBlock as QB } from '../../../types/blockTypes';

interface Props {
  block: QB;
  onChange: (data: QB['data']) => void;
  onEnter?: () => void;
  onDelete?: () => void;
  autoFocus?: boolean;
}

export const QuoteBlock: React.FC<Props> = ({ block, onChange, onEnter, onDelete, autoFocus }) => {
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textRef.current?.focus();
  }, [autoFocus]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  return (
    <div className="block-quote-editor">
      <div className="block-quote-bar" />
      <div className="flex-1">
        <textarea
          ref={textRef}
          value={block.data.text}
          onChange={(e) => {
            onChange({ ...block.data, text: e.target.value });
            autoResize(e.target);
          }}
          placeholder="Enter your quote..."
          className="block-quote-textarea"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); onEnter?.(); }
            if (e.key === 'Backspace' && block.data.text === '' && !block.data.attribution) { e.preventDefault(); onDelete?.(); }
          }}
        />
        <input
          type="text"
          value={block.data.attribution || ''}
          onChange={(e) => onChange({ ...block.data, attribution: e.target.value })}
          placeholder="— Attribution (optional)"
          className="block-quote-attribution"
        />
      </div>
    </div>
  );
};
