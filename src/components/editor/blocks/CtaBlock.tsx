import React from 'react';
import type { CtaBlock as CTB, CtaVariant } from '../../../types/blockTypes';
import { Megaphone, Sparkles, Zap, ExternalLink, Circle } from 'lucide-react';

interface Props {
  block: CTB;
  onChange: (data: CTB['data']) => void;
  onDelete?: () => void;
}

const VARIANTS: { value: CtaVariant; label: string; icon: React.ReactNode; preview: string }[] = [
  {
    value: 'gradient',
    label: 'Gradient',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    preview: 'cta-preview-gradient',
  },
  {
    value: 'solid',
    label: 'Solid',
    icon: <Zap className="w-3.5 h-3.5" />,
    preview: 'cta-preview-solid',
  },
  {
    value: 'outline',
    label: 'Outline',
    icon: <Circle className="w-3.5 h-3.5" />,
    preview: 'cta-preview-outline',
  },
  {
    value: 'glow',
    label: 'Glow',
    icon: <Megaphone className="w-3.5 h-3.5" />,
    preview: 'cta-preview-glow',
  },
];

export const CtaBlock: React.FC<Props> = ({ block, onChange }) => {
  const d = block.data;
  const update = (patch: Partial<CTB['data']>) => onChange({ ...d, ...patch });

  return (
    <div className="block-cta-editor">
      {/* Variant picker */}
      <div className="block-cta-variants">
        {VARIANTS.map((v) => (
          <button
            type="button"
            key={v.value}
            onClick={(e) => {
              e.preventDefault();
              update({ variant: v.value });
            }}
            className={`block-cta-variant-btn ${v.preview} ${d.variant === v.value ? 'active' : ''}`}
          >
            {v.icon}
            <span className="text-xs">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div className={`block-cta-preview cta-${d.variant}`}>
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 mt-0.5 shrink-0 opacity-70" />
          <div className="flex-1">
            <p className="font-bold text-base leading-tight">{d.headline || 'Your CTA Headline'}</p>
            {d.body && <p className="text-sm opacity-80 mt-1">{d.body}</p>}
          </div>
          <div className="cta-btn-preview">{d.buttonLabel || 'Click Me'}</div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-2 mt-3">
        <input
          type="text"
          value={d.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="Headline..."
          className="block-cta-input font-semibold"
        />
        <input
          type="text"
          value={d.body || ''}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="Supporting text (optional)..."
          className="block-cta-input text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={d.buttonLabel}
            onChange={(e) => update({ buttonLabel: e.target.value })}
            placeholder="Button label"
            className="block-cta-input text-sm"
          />
          <input
            type="url"
            value={d.buttonUrl}
            onChange={(e) => update({ buttonUrl: e.target.value })}
            placeholder="https://..."
            className="block-cta-input text-sm"
          />
        </div>
      </div>
    </div>
  );
};
