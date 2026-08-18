import React from 'react';
import type { ParagraphBlock } from '../../../types/blockTypes';

export const ParagraphRender: React.FC<{ block: ParagraphBlock }> = ({ block }) => (
  <p
    className="render-paragraph"
    dangerouslySetInnerHTML={{ __html: block.data.html || '' }}
  />
);
