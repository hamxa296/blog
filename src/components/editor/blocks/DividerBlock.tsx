import React from 'react';
import type { DividerBlock as DB, DividerStyle } from '../../../types/blockTypes';

interface Props {
  block: DB;
  onChange: (data: DB['data']) => void;
}

const STYLES: { value: DividerStyle; preview: React.ReactNode }[] = [
  {
    value: 'line',
    preview: <div className="w-full h-px bg-neutral-600 rounded" />,
  },
  {
    value: 'dots',
    preview: (
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
        ))}
      </div>
    ),
  },
  {
    value: 'stars',
    preview: (
      <div className="text-center text-neutral-400 tracking-widest text-sm">✦ ✦ ✦</div>
    ),
  },
];

export const DividerBlock: React.FC<Props> = ({ block, onChange }) => {
  return (
    <div className="block-divider-editor">
      <div className="block-divider-preview">
        {STYLES.find((s) => s.value === block.data.style)?.preview}
      </div>
      <div className="block-divider-styles">
        {STYLES.map((s) => (
          <button
            type="button"
            key={s.value}
            onClick={(e) => {
              e.preventDefault();
              onChange({ style: s.value });
            }}
            className={`block-divider-style-btn ${block.data.style === s.value ? 'active' : ''}`}
          >
            <span className="capitalize text-xs">{s.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
