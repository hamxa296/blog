import React from 'react';
import type { HeadingBlock } from '../../../types/blockTypes';

export const HeadingRender: React.FC<{ block: HeadingBlock }> = ({ block }) => {
  const id = block.data.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  if (block.data.level === 2) {
    return <h2 id={id} className="render-h2">{block.data.text}</h2>;
  }
  return <h3 id={id} className="render-h3">{block.data.text}</h3>;
};
