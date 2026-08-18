import React from 'react';
import type { ParagraphBlock } from '../../../types/blockTypes';
import { sanitizeHtml } from '../../../utils/sanitize';

export const ParagraphRender: React.FC<{ block: ParagraphBlock }> = ({ block }) => (
  <p
    className="render-paragraph"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.data.html) }}
  />
);
