import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BlockType } from '../../types/blockTypes';
import {
  Type,
  Heading2,
  Quote,
  Info,
  Minus,
  Image,
  Megaphone,
  X,
} from 'lucide-react';

interface BlockOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const BLOCK_OPTIONS: BlockOption[] = [
  {
    type: 'paragraph',
    label: 'Paragraph',
    description: 'Plain body text',
    icon: <Type className="w-5 h-5" />,
    color: 'bg-neutral-700',
  },
  {
    type: 'heading',
    label: 'Heading',
    description: 'Section title (H2 or H3)',
    icon: <Heading2 className="w-5 h-5" />,
    color: 'bg-violet-700',
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Pull quote with attribution',
    icon: <Quote className="w-5 h-5" />,
    color: 'bg-sky-700',
  },
  {
    type: 'callout',
    label: 'Callout',
    description: 'Info, tip, warning, or fun box',
    icon: <Info className="w-5 h-5" />,
    color: 'bg-amber-700',
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visual separator',
    icon: <Minus className="w-5 h-5" />,
    color: 'bg-neutral-600',
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Photo with caption',
    icon: <Image className="w-5 h-5" />,
    color: 'bg-emerald-700',
  },
  {
    type: 'cta',
    label: 'Call to Action',
    description: 'Headline + button card',
    icon: <Megaphone className="w-5 h-5" />,
    color: 'bg-rose-700',
  },
];

interface BlockPickerProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export const BlockPicker: React.FC<BlockPickerProps> = ({ onSelect, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', handlePointer), 100);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="block-picker-overlay">
      <div ref={sheetRef} className="block-picker-sheet">
        {/* Handle */}
        <div className="block-picker-handle" />

        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm font-semibold text-white">Add a block</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BLOCK_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.type}
              onClick={(e) => {
                e.preventDefault();
                onSelect(opt.type);
                onClose();
              }}
              className="block-picker-item"
            >
              <div className={`block-picker-icon ${opt.color}`}>{opt.icon}</div>
              <div className="text-left">
                <div className="text-sm font-medium text-white">{opt.label}</div>
                <div className="text-xs text-neutral-400 leading-tight">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
