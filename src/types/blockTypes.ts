// ─── Block Type Definitions ──────────────────────────────────────────────────
// Each post's content is stored as JSON: Block[]
// Legacy posts (HTML string) are detected and rendered via the legacy path.

export type CalloutVariant = 'info' | 'tip' | 'warning' | 'fun';
export type DividerStyle = 'line' | 'dots' | 'stars';
export type CtaVariant = 'gradient' | 'solid' | 'outline' | 'glow';
export type HeadingLevel = 2 | 3;

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  data: {
    html: string; // innerHTML (supports <b>, <i>, <a>)
  };
}

export interface HeadingBlock {
  id: string;
  type: 'heading';
  data: {
    text: string;
    level: HeadingLevel;
  };
}

export interface QuoteBlock {
  id: string;
  type: 'quote';
  data: {
    text: string;
    attribution?: string;
  };
}

export interface CalloutBlock {
  id: string;
  type: 'callout';
  data: {
    variant: CalloutVariant;
    text: string;
  };
}

export interface DividerBlock {
  id: string;
  type: 'divider';
  data: {
    style: DividerStyle;
  };
}

export interface ImageBlock {
  id: string;
  type: 'image';
  data: {
    url: string;
    caption?: string;
    // transient — not persisted
    _file?: File;
  };
}

export interface CtaBlock {
  id: string;
  type: 'cta';
  data: {
    headline: string;
    body?: string;
    buttonLabel: string;
    buttonUrl: string;
    variant: CtaVariant;
  };
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock
  | ImageBlock
  | CtaBlock;

export type BlockType = Block['type'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createBlock(type: BlockType): Block {
  const id = generateId();
  switch (type) {
    case 'paragraph':
      return { id, type: 'paragraph', data: { html: '' } };
    case 'heading':
      return { id, type: 'heading', data: { text: '', level: 2 } };
    case 'quote':
      return { id, type: 'quote', data: { text: '', attribution: '' } };
    case 'callout':
      return { id, type: 'callout', data: { variant: 'info', text: '' } };
    case 'divider':
      return { id, type: 'divider', data: { style: 'line' } };
    case 'image':
      return { id, type: 'image', data: { url: '', caption: '' } };
    case 'cta':
      return {
        id,
        type: 'cta',
        data: {
          headline: '',
          body: '',
          buttonLabel: 'Learn More',
          buttonUrl: '',
          variant: 'gradient',
        },
      };
  }
}

/** Serialize blocks array to JSON string for Firestore storage */
export function serializeBlocks(blocks: Block[]): string {
  // strip transient _file before saving
  const clean = blocks.map((b) => {
    if (b.type === 'image') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _file, ...rest } = b.data;
      return { ...b, data: rest };
    }
    return b;
  });
  return JSON.stringify(clean);
}

function isValidBlock(item: unknown): item is Block {
  if (!item || typeof item !== 'object') return false;
  const b = item as { type?: unknown; data?: unknown };
  return (
    typeof b.type === 'string' &&
    ['paragraph', 'heading', 'quote', 'callout', 'divider', 'image', 'cta'].includes(b.type) &&
    typeof b.data === 'object' &&
    b.data !== null
  );
}

function unescapeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Attempts to parse a string as a JSON Block array.
 * Handles raw JSON, HTML-escaped JSON (&quot;), and JSON wrapped in <p> or <div> tags.
 */
function tryParseBlocksString(str: string): Block[] | null {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();

  // 1. Direct JSON parse
  try {
    let direct = JSON.parse(trimmed);
    // Handle double or multiple stringified JSON
    while (typeof direct === 'string') {
      try {
        const next = JSON.parse(direct);
        if (typeof next === 'object') {
          direct = next;
        } else {
          break;
        }
      } catch {
        break;
      }
    }
    
    if (Array.isArray(direct) && direct.length > 0 && direct.every(isValidBlock)) {
      return direct as Block[];
    }
  } catch {
    // Continue to next attempts
  }

  // 2. Unescape entities and strip outer HTML wrappers (<p>, <div>, <pre>, <code>)
  const unescaped = unescapeHtmlEntities(trimmed)
    .replace(/^<[a-zA-Z0-9]+[^>]*>/, '')
    .replace(/<\/[a-zA-Z0-9]+>$/, '')
    .trim();

  try {
    const unescapedParsed = JSON.parse(unescaped);
    if (Array.isArray(unescapedParsed) && unescapedParsed.length > 0 && unescapedParsed.every(isValidBlock)) {
      return unescapedParsed as Block[];
    }
  } catch {
    // Continue
  }

  // 3. Find JSON array boundaries `[` and `]` in the string
  const firstBracket = unescaped.indexOf('[');
  const lastBracket = unescaped.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const slice = unescaped.slice(firstBracket, lastBracket + 1);
    try {
      const sliceParsed = JSON.parse(slice);
      if (Array.isArray(sliceParsed) && sliceParsed.length > 0 && sliceParsed.every(isValidBlock)) {
        return sliceParsed as Block[];
      }
    } catch {
      // Continue
    }
  }

  return null;
}

/**
 * Recursively inspects parsed blocks to unpack any nested JSON blocks
 * (e.g. if a single paragraph block was previously saved with a JSON string inside its `html` field).
 */
function unpackNestedBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];
  for (const block of blocks) {
    if (block.type === 'paragraph' && block.data?.html) {
      const innerBlocks = tryParseBlocksString(block.data.html);
      if (innerBlocks && innerBlocks.length > 0) {
        // Recursively unpack in case of multiple nesting layers
        result.push(...unpackNestedBlocks(innerBlocks));
        continue;
      }
    }
    result.push(block);
  }
  return result;
}

/**
 * Deserialize content string or array → blocks.
 * Robustly detects block JSON arrays, unescapes HTML-wrapped JSON,
 * unrolls legacy-wrapped JSON blocks, and identifies true legacy HTML.
 */
export function deserializeContent(content: unknown): { blocks: Block[]; isLegacy: boolean } {
  if (!content) {
    return { blocks: [createBlock('paragraph')], isLegacy: false };
  }

  // 1. If content is already an Array
  if (Array.isArray(content)) {
    if (content.length > 0 && content.every(isValidBlock)) {
      return { blocks: unpackNestedBlocks(content as Block[]), isLegacy: false };
    }
    return { blocks: [createBlock('paragraph')], isLegacy: false };
  }

  if (typeof content !== 'string') {
    return { blocks: [createBlock('paragraph')], isLegacy: false };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { blocks: [createBlock('paragraph')], isLegacy: false };
  }

  // 2. Try parsing string as blocks
  const parsed = tryParseBlocksString(trimmed);
  if (parsed && parsed.length > 0) {
    return { blocks: unpackNestedBlocks(parsed), isLegacy: false };
  }

  // 3. Check if this is legacy HTML or plain text
  return { blocks: [], isLegacy: true };
}

/**
 * Extracts plain text from blocks or legacy HTML for summaries, excerpts, and read-time calculation.
 */
export function extractPlainText(content: unknown): string {
  if (!content) return '';
  const { blocks, isLegacy } = deserializeContent(content);

  if (isLegacy) {
    if (typeof content === 'string') {
      return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'paragraph':
        if (b.data.html) {
          parts.push(b.data.html.replace(/<[^>]+>/g, ' ').trim());
        }
        break;
      case 'heading':
        if (b.data.text) parts.push(b.data.text.trim());
        break;
      case 'quote':
        if (b.data.text) parts.push(b.data.text.trim());
        break;
      case 'callout':
        if (b.data.text) parts.push(b.data.text.trim());
        break;
      case 'cta':
        if (b.data.headline) parts.push(b.data.headline.trim());
        if (b.data.body) parts.push(b.data.body.trim());
        break;
      case 'image':
        if (b.data.caption) parts.push(b.data.caption.trim());
        break;
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Calculates estimated read time (in minutes) from content blocks or legacy HTML.
 */
export function calculateReadTime(content: unknown): number {
  const text = extractPlainText(content);
  if (!text) return 1;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
