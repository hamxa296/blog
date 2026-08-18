import React, { useEffect, useRef } from 'react';
import { deserializeContent, type Block } from '../../types/blockTypes';
import { ParagraphRender } from './blocks/ParagraphRender';
import { HeadingRender } from './blocks/HeadingRender';
import { QuoteRender } from './blocks/QuoteRender';
import { CalloutRender } from './blocks/CalloutRender';
import { DividerRender } from './blocks/DividerRender';
import { ImageRender } from './blocks/ImageRender';
import { CtaRender } from './blocks/CtaRender';

interface BlockRendererProps {
  content: string; // JSON string of Block[] or legacy HTML
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-triggered entrance animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>('.render-block');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('block-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [content]);

  const { blocks, isLegacy } = deserializeContent(content);

  // Legacy HTML path
  if (isLegacy) {
    return (
      <div
        ref={containerRef}
        className="render-legacy prose prose-invert max-w-none text-foreground/90 text-base sm:text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div ref={containerRef} className="render-blocks-container">
      {blocks.map((block: Block, i: number) => (
        <div
          key={block.id || i}
          className="render-block"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {block.type === 'paragraph' && <ParagraphRender block={block} />}
          {block.type === 'heading' && <HeadingRender block={block} />}
          {block.type === 'quote' && <QuoteRender block={block} />}
          {block.type === 'callout' && <CalloutRender block={block} />}
          {block.type === 'divider' && <DividerRender block={block} />}
          {block.type === 'image' && <ImageRender block={block} />}
          {block.type === 'cta' && <CtaRender block={block} />}
        </div>
      ))}
    </div>
  );
};
