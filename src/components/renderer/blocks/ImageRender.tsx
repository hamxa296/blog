import React from 'react';
import type { ImageBlock } from '../../../types/blockTypes';

export const ImageRender: React.FC<{ block: ImageBlock }> = ({ block }) => {
  if (!block.data.url) return null;
  return (
    <figure className="render-image-figure">
      <img
        src={block.data.url}
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
