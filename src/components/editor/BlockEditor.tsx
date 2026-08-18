import React, { useState, useCallback, useRef } from 'react';
import {
  type Block,
  type BlockType,
  createBlock,
} from '../../types/blockTypes';
import { BlockPicker } from './BlockPicker';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { CtaBlock } from './blocks/CtaBlock';
import {
  GripVertical,
  Trash2,
  Plus,
  Type,
  Heading2,
  Quote,
  Info,
  Minus,
  Image,
  Megaphone,
} from 'lucide-react';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const BLOCK_ICON: Record<BlockType, React.ReactNode> = {
  paragraph: <Type className="w-3.5 h-3.5" />,
  heading: <Heading2 className="w-3.5 h-3.5" />,
  quote: <Quote className="w-3.5 h-3.5" />,
  callout: <Info className="w-3.5 h-3.5" />,
  divider: <Minus className="w-3.5 h-3.5" />,
  image: <Image className="w-3.5 h-3.5" />,
  cta: <Megaphone className="w-3.5 h-3.5" />,
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [activePickerAfter, setActivePickerAfter] = useState<number | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const updateBlock = useCallback(
    (id: string, data: Block['data']) => {
      onChange(blocks.map((b) => (b.id === id ? ({ ...b, data } as Block) : b)));
    },
    [blocks, onChange],
  );

  const addBlockAfter = useCallback(
    (type: BlockType, afterIndex: number) => {
      const newBlock = createBlock(type);
      const next = [...blocks];
      next.splice(afterIndex + 1, 0, newBlock);
      onChange(next);
      setNewlyAddedId(newBlock.id);
      setFocusedId(newBlock.id);
    },
    [blocks, onChange],
  );

  const addParagraphAfter = useCallback(
    (afterIndex: number) => addBlockAfter('paragraph', afterIndex),
    [addBlockAfter],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      const next = blocks.filter((b) => b.id !== id);
      if (next.length === 0) next.push(createBlock('paragraph'));
      onChange(next);
    },
    [blocks, onChange],
  );

  // Drag reorder (desktop)
  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  };
  const handleDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOverIdx.current, 0, moved);
    onChange(next);
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  // Ensure at least one block
  const safeBlocks = blocks.length > 0 ? blocks : [createBlock('paragraph')];

  return (
    <div className="block-editor-canvas">
      {safeBlocks.map((block, idx) => {
        const isNew = newlyAddedId === block.id;
        const isFocused = focusedId === block.id;

        return (
          <div
            key={block.id}
            className={`block-row ${isFocused ? 'focused' : ''}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            onFocus={() => setFocusedId(block.id)}
          >
            {/* Left gutter: drag handle + type icon */}
            <div className="block-gutter">
              <div className="block-drag-handle" title="Drag to reorder">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="block-type-icon" title={block.type}>
                {BLOCK_ICON[block.type]}
              </div>
            </div>

            {/* Block content */}
            <div className="block-content-area">
              {block.type === 'paragraph' && (
                <ParagraphBlock
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                  onEnter={() => addParagraphAfter(idx)}
                  onDelete={() => deleteBlock(block.id)}
                  autoFocus={isNew}
                />
              )}
              {block.type === 'heading' && (
                <HeadingBlock
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                  onEnter={() => addParagraphAfter(idx)}
                  onDelete={() => deleteBlock(block.id)}
                  autoFocus={isNew}
                />
              )}
              {block.type === 'quote' && (
                <QuoteBlock
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                  onEnter={() => addParagraphAfter(idx)}
                  onDelete={() => deleteBlock(block.id)}
                  autoFocus={isNew}
                />
              )}
              {block.type === 'callout' && (
                <CalloutBlock
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                  onEnter={() => addParagraphAfter(idx)}
                  onDelete={() => deleteBlock(block.id)}
                  autoFocus={isNew}
                />
              )}
              {block.type === 'divider' && (
                <DividerBlock
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                />
              )}
              {block.type === 'image' && (
                <ImageBlock
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                />
              )}
              {block.type === 'cta' && (
                <CtaBlock
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                />
              )}
            </div>

            {/* Right gutter: delete */}
            <div className="block-actions">
              <button
                type="button"
                className="block-delete-btn"
                onClick={(e) => {
                  e.preventDefault();
                  deleteBlock(block.id);
                }}
                title="Delete block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add-block button (between blocks) */}
            <button
              type="button"
              className="block-add-btn"
              onClick={(e) => {
                e.preventDefault();
                setActivePickerAfter(idx);
              }}
              title="Add block"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add block at end */}
      <button
        type="button"
        className="block-add-end-btn"
        onClick={(e) => {
          e.preventDefault();
          setActivePickerAfter(safeBlocks.length - 1);
        }}
      >
        <Plus className="w-4 h-4" />
        <span>Add block</span>
      </button>

      {/* Block Picker bottom sheet */}
      {activePickerAfter !== null && (
        <BlockPicker
          onSelect={(type: BlockType) => {
            addBlockAfter(type, activePickerAfter);
            setActivePickerAfter(null);
          }}
          onClose={() => setActivePickerAfter(null)}
        />
      )}
    </div>
  );
};
