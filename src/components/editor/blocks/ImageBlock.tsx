import React, { useRef } from 'react';
import type { ImageBlock as IB } from '../../../types/blockTypes';
import { ImageIcon, Upload, X } from 'lucide-react';

interface Props {
  block: IB;
  onChange: (data: IB['data']) => void;
}

export const ImageBlock: React.FC<Props> = ({ block, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const localUrl = URL.createObjectURL(file);
    onChange({ ...block.data, url: localUrl, _file: file });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const clear = () => onChange({ url: '', caption: '' });

  return (
    <div className="block-image-editor">
      {block.data.url ? (
        <div className="relative group">
          <img
            src={block.data.url}
            alt="Block image"
            className="w-full max-h-72 object-cover rounded-xl border border-neutral-700"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              clear();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={block.data.caption || ''}
            onChange={(e) => onChange({ ...block.data, caption: e.target.value })}
            placeholder="Add a caption..."
            className="block-image-caption"
          />
        </div>
      ) : (
        <div
          className="block-image-dropzone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <ImageIcon className="w-8 h-8 text-neutral-500 mb-2" />
          <p className="text-sm text-neutral-400">Drop an image or <span className="text-white underline">browse</span></p>
          <p className="text-xs text-neutral-600 mt-1">Or enter a URL below</p>
          <input
            type="url"
            placeholder="https://..."
            className="block-image-url-input mt-3"
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val) onChange({ ...block.data, url: val });
            }}
          />
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <Upload className="w-3 h-3" />
            <span>Will be uploaded on save</span>
          </div>
        </div>
      )}
    </div>
  );
};
