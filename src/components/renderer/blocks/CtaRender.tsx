import React from 'react';
import type { CtaBlock } from '../../../types/blockTypes';
import { ExternalLink } from 'lucide-react';

export const CtaRender: React.FC<{ block: CtaBlock }> = ({ block }) => {
  const { headline, body, buttonLabel, buttonUrl, variant } = block.data;
  if (!headline) return null;

  return (
    <div className={`render-cta cta-${variant}`}>
      <div className="render-cta-inner">
        <div className="render-cta-text">
          <p className="render-cta-headline">{headline}</p>
          {body && <p className="render-cta-body">{body}</p>}
        </div>
        {buttonUrl && (
          <a
            href={buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="render-cta-btn"
          >
            {buttonLabel || 'Learn More'}
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </a>
        )}
      </div>
    </div>
  );
};
