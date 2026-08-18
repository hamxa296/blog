import React, { useRef, useEffect } from 'react';
import type { CalloutBlock as CB, CalloutVariant } from '../../../types/blockTypes';
import { Info, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react';

interface Props {
  block: CB;
  onChange: (data: CB['data']) => void;
  onEnter?: () => void;
  onDelete?: () => void;
  autoFocus?: boolean;
}

const VARIANTS: { value: CalloutVariant; label: string; icon: React.ReactNode; cls: string }[] = [
  { value: 'info', label: 'Info', icon: <Info className="w-4 h-4" />, cls: 'callout-info' },
  { value: 'tip', label: 'Tip', icon: <Lightbulb className="w-4 h-4" />, cls: 'callout-tip' },
  { value: 'warning', label: 'Warning', icon: <AlertTriangle className="w-4 h-4" />, cls: 'callout-warning' },
  { value: 'fun', label: 'Fun', icon: <Sparkles className="w-4 h-4" />, cls: 'callout-fun' },
];

export const CalloutBlock: React.FC<Props> = ({ block, onChange, onEnter, onDelete, autoFocus }) => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const currentVariant = VARIANTS.find((v) => v.value === block.data.variant) || VARIANTS[0];

  useEffect(() => {
    if (autoFocus) textRef.current?.focus();
  }, [autoFocus]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  return (
    <div className={`block-callout-editor ${currentVariant.cls}`}>
      {/* Variant selector */}
      <div className="block-callout-variants">
        {VARIANTS.map((v) => (
          <button
            type="button"
            key={v.value}
            onClick={(e) => {
              e.preventDefault();
              onChange({ ...block.data, variant: v.value });
            }}
            className={`block-callout-variant-btn ${v.cls} ${block.data.variant === v.value ? 'active' : ''}`}
            title={v.label}
          >
            {v.icon}
            <span className="text-xs">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-start gap-3 mt-2">
        <div className="block-callout-icon">{currentVariant.icon}</div>
        <textarea
          ref={textRef}
          value={block.data.text}
          onChange={(e) => {
            onChange({ ...block.data, text: e.target.value });
            autoResize(e.target);
          }}
          placeholder="Write your callout text..."
          className="block-callout-textarea"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); onEnter?.(); }
            if (e.key === 'Backspace' && block.data.text === '') { e.preventDefault(); onDelete?.(); }
          }}
        />
      </div>
    </div>
  );
};
