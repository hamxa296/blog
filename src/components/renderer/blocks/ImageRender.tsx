import React from 'react';
import type { ImageBlock } from '../../../types/blockTypes';
import { sanitizeUrl } from '../../../utils/sanitize';

export const ImageRender: React.FC<{ block: ImageBlock }> = ({ block }) => {
  const cleanUrl = sanitizeUrl(block.data.url);
  if (!cleanUrl) return null;
  return (
    <figure className="render-image-figure">
      <img
        src={cleanUrl}
        alt={block.data.caption || 'Article image'}
        className="render-image"
        loading="lazy"
      />
      {block.data.caption && (
        <figcaption className="render-image-caption">{block.data.caption}</figcaption>
      )}
    </figure>
  );
};
