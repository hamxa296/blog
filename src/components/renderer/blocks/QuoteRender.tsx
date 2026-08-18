import React from 'react';
import type { QuoteBlock } from '../../../types/blockTypes';

export const QuoteRender: React.FC<{ block: QuoteBlock }> = ({ block }) => (
  <figure className="render-quote">
    <div className="render-quote-mark">"</div>
    <blockquote className="render-quote-text">{block.data.text}</blockquote>
    {block.data.attribution && (
      <figcaption className="render-quote-attribution">— {block.data.attribution}</figcaption>
    )}
  </figure>
);
