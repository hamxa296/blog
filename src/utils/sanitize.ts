import type { Block } from '../types/blockTypes';

const INLINE_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'A', 'BR', 'CODE', 'UL', 'OL', 'LI']);
const BLOCK_TAGS = new Set([
  ...INLINE_TAGS,
  'P',
  'DIV',
  'SPAN',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'UL',
  'OL',
  'LI',
  'PRE',
]);

export function sanitizeUrl(value?: string): string {
  const raw = (value || '').trim();
  if (!raw) return '';

  try {
    const baseUrl =
      typeof window === 'undefined' ? 'https://example.invalid' : window.location.origin;
    const url = new URL(raw, baseUrl);
    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return url.href;
    }
  } catch {
    return '';
  }

  return '';
}

function cleanNode(node: Node, allowedTags: Set<string>): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();
  const fragment = document.createDocumentFragment();

  Array.from(element.childNodes).forEach((child) => {
    const cleanChild = cleanNode(child, allowedTags);
    if (cleanChild) fragment.appendChild(cleanChild);
  });

  if (!allowedTags.has(tagName)) {
    return fragment;
  }

  const cleanElement = document.createElement(tagName.toLowerCase());

  if (tagName === 'A') {
    const href = sanitizeUrl(element.getAttribute('href') || '');
    if (!href) {
      return fragment;
    }
    cleanElement.setAttribute('href', href);
    cleanElement.setAttribute('target', '_blank');
    cleanElement.setAttribute('rel', 'noopener noreferrer');
  }

  cleanElement.appendChild(fragment);
  return cleanElement;
}

export function sanitizeHtml(html?: string, mode: 'inline' | 'legacy' = 'inline'): string {
  if (!html || typeof document === 'undefined') return '';

  const template = document.createElement('template');
  template.innerHTML = html;
  const output = document.createDocumentFragment();
  const allowedTags = mode === 'legacy' ? BLOCK_TAGS : INLINE_TAGS;

  Array.from(template.content.childNodes).forEach((node) => {
    const cleanNodeResult = cleanNode(node, allowedTags);
    if (cleanNodeResult) output.appendChild(cleanNodeResult);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(output);
  return wrapper.innerHTML;
}

export function sanitizeBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
        return {
          ...block,
          data: { ...block.data, html: sanitizeHtml(block.data.html) },
        };
      case 'image':
        return {
          ...block,
          data: {
            ...block.data,
            url: sanitizeUrl(block.data.url),
            caption: block.data.caption || '',
          },
        };
      case 'cta':
        return {
          ...block,
          data: {
            ...block.data,
            buttonUrl: sanitizeUrl(block.data.buttonUrl),
          },
        };
      default:
        return block;
    }
  });
}
