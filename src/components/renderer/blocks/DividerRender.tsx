import React from 'react';
import type { DividerBlock } from '../../../types/blockTypes';

export const DividerRender: React.FC<{ block: DividerBlock }> = ({ block }) => {
  if (block.data.style === 'dots') {
    return (
      <div className="render-divider-dots">
        {[0, 1, 2].map((i) => (
          <div key={i} className="render-divider-dot" />
        ))}
      </div>
    );
  }
  if (block.data.style === 'stars') {
    return <div className="render-divider-stars">✦ ✦ ✦</div>;
  }
  return <hr className="render-divider-line" />;
};
