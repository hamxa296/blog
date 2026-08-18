import React, { useRef, useEffect } from 'react';
import type { HeadingBlock as HB } from '../../../types/blockTypes';

interface Props {
  block: HB;
  onChange: (data: HB['data']) => void;
  onEnter?: () => void;
  onDelete?: () => void;
  autoFocus?: boolean;
}

export const HeadingBlock: React.FC<Props> = ({ block, onChange, onEnter, onDelete, autoFocus }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className="block-heading-wrap">
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          className={`block-level-btn ${block.data.level === 2 ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onChange({ ...block.data, level: 2 });
          }}
        >
          H2
        </button>
        <button
          type="button"
          className={`block-level-btn ${block.data.level === 3 ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onChange({ ...block.data, level: 3 });
          }}
        >
          H3
        </button>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={block.data.text}
        onChange={(e) => onChange({ ...block.data, text: e.target.value })}
        placeholder={block.data.level === 2 ? 'Section heading...' : 'Subheading...'}
        className={`block-heading-input ${block.data.level === 2 ? 'text-2xl font-bold' : 'text-xl font-semibold'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); }
          if (e.key === 'Backspace' && block.data.text === '') { e.preventDefault(); onDelete?.(); }
        }}
      />
    </div>
  );
};
