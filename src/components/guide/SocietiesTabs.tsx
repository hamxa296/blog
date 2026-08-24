import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Mail,
  Phone,
  Link as LinkIcon,
} from 'lucide-react';
import { societiesData } from './guideData';
import type { SocietyCategory, SocietyEntry, SocietyLinkItem } from '../../types/guide';

interface SocietiesTabsProps {
  categories?: Record<string, SocietyCategory>;
}

export interface ExtractedLink {
  label: string;
  url: string;
  type:
    | 'website'
    | 'instagram'
    | 'linkedin'
    | 'github'
    | 'twitter'
    | 'facebook'
    | 'youtube'
    | 'mail'
    | 'phone'
    | 'external';
}

function sanitizeUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Prevent dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  // Handle mailto and tel
  if (/^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }

  // Add https:// if protocol is omitted
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}

function detectLinkType(url: string, label: string): ExtractedLink['type'] {
  const lowerUrl = url.toLowerCase();
  const lowerLabel = label.toLowerCase();

  if (lowerUrl.startsWith('mailto:') || lowerLabel.includes('email') || lowerLabel.includes('mail')) {
    return 'mail';
  }
  if (lowerUrl.startsWith('tel:') || lowerLabel.includes('phone') || lowerLabel.includes('contact')) {
    return 'phone';
  }
  if (lowerUrl.includes('instagram.com') || lowerLabel.includes('instagram') || lowerLabel.includes('insta')) {
    return 'instagram';
  }
  if (lowerUrl.includes('linkedin.com') || lowerLabel.includes('linkedin')) {
    return 'linkedin';
  }
  if (lowerUrl.includes('github.com') || lowerLabel.includes('github')) {
    return 'github';
  }
  if (
    lowerUrl.includes('twitter.com') ||
    lowerUrl.includes('x.com') ||
    lowerLabel === 'x' ||
    lowerLabel.includes('twitter')
  ) {
    return 'twitter';
  }
  if (lowerUrl.includes('facebook.com') || lowerLabel.includes('facebook') || lowerLabel === 'fb') {
    return 'facebook';
  }
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerLabel.includes('youtube')) {
    return 'youtube';
  }
  if (
    lowerLabel.includes('website') ||
    lowerLabel.includes('official') ||
    lowerLabel.includes('site') ||
    lowerLabel.includes('portal')
  ) {
    return 'website';
  }

  return 'external';
}

function formatDefaultLabel(url: string, type: ExtractedLink['type'], rawLabel?: string): string {
  if (rawLabel && rawLabel.trim() && !['url', 'link', 'href'].includes(rawLabel.toLowerCase())) {
    return rawLabel.trim();
  }

  switch (type) {
    case 'website':
      return 'Website';
    case 'instagram':
      return 'Instagram';
    case 'linkedin':
      return 'LinkedIn';
    case 'github':
      return 'GitHub';
    case 'twitter':
      return 'X (Twitter)';
    case 'facebook':
      return 'Facebook';
    case 'youtube':
      return 'YouTube';
    case 'mail':
      return 'Email';
    case 'phone':
      return 'Phone';
    default: {
      try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, '');
      } catch {
        return 'Visit Link';
      }
    }
  }
}

export function extractSocietyLinks(item: SocietyEntry): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const seenUrls = new Set<string>();

  function addLink(rawUrl: unknown, rawLabel?: string, overrideType?: ExtractedLink['type']) {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const sanitized = sanitizeUrl(rawUrl);
    if (!sanitized) return;

    // Normalizing check for duplicate URLs
    const normalizedKey = sanitized.replace(/\/$/, '').toLowerCase();
    if (seenUrls.has(normalizedKey)) return;
    seenUrls.add(normalizedKey);

    const detectedType = overrideType || detectLinkType(sanitized, rawLabel || '');
    const label = formatDefaultLabel(sanitized, detectedType, rawLabel);

    links.push({
      label,
      url: sanitized,
      type: detectedType,
    });
  }

  // 1. Direct website property
  if (item.website) {
    addLink(item.website, 'Website', 'website');
  }

  // 2. Direct url or link property
  if (item.url && item.url !== item.website) {
    addLink(item.url);
  }
  if (item.link && item.link !== item.website && item.link !== item.url) {
    addLink(item.link);
  }

  // 3. links array or object
  if (Array.isArray(item.links)) {
    item.links.forEach((l) => {
      if (typeof l === 'string') {
        addLink(l);
      } else if (l && typeof l === 'object') {
        const linkObj = l as SocietyLinkItem;
        const targetUrl = linkObj.url || linkObj.link || linkObj.href;
        const targetLabel = linkObj.label || linkObj.name || linkObj.platform;
        addLink(targetUrl, targetLabel);
      }
    });
  } else if (item.links && typeof item.links === 'object') {
    Object.entries(item.links).forEach(([key, val]) => {
      if (typeof val === 'string') {
        addLink(val, key);
      }
    });
  }

  // 4. socials array or object
  if (Array.isArray(item.socials)) {
    item.socials.forEach((s) => {
      if (typeof s === 'string') {
        addLink(s);
      } else if (s && typeof s === 'object') {
        const socialObj = s as SocietyLinkItem;
        const targetUrl = socialObj.url || socialObj.link || socialObj.href;
        const targetLabel = socialObj.label || socialObj.name || socialObj.platform;
        addLink(targetUrl, targetLabel);
      }
    });
  } else if (item.socials && typeof item.socials === 'object') {
    Object.entries(item.socials).forEach(([key, val]) => {
      if (typeof val === 'string') {
        addLink(val, key);
      }
    });
  }

  // 5. Check well-known social properties directly on the item
  const commonPlatforms = [
    'instagram',
    'linkedin',
    'github',
    'twitter',
    'facebook',
    'youtube',
    'discord',
  ];
  for (const platform of commonPlatforms) {
    const val = item[platform];
    if (typeof val === 'string') {
      addLink(val, platform);
    }
  }

  return links;
}

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9 10 15" />
  </svg>
);

function renderLinkIcon(type: ExtractedLink['type']) {
  const iconClass = 'h-3.5 w-3.5 shrink-0';

  switch (type) {
    case 'website':
      return <Globe className={iconClass} />;
    case 'instagram':
      return <InstagramIcon className={iconClass} />;
    case 'linkedin':
      return <LinkedinIcon className={iconClass} />;
    case 'github':
      return <GithubIcon className={iconClass} />;
    case 'twitter':
      return <TwitterIcon className={iconClass} />;
    case 'facebook':
      return <FacebookIcon className={iconClass} />;
    case 'youtube':
      return <YoutubeIcon className={iconClass} />;
    case 'mail':
      return <Mail className={iconClass} />;
    case 'phone':
      return <Phone className={iconClass} />;
    default:
      return <LinkIcon className={iconClass} />;
  }
}

/**
 * Safely parse markdown links [label](url) and bare URLs in descriptions into clickable anchors.
 */
function renderDescriptionWithLinks(text: string) {
  if (!text) return null;

  // Regex matches [label](url) OR standalone http(s):// URLs
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s,]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown link: [match[1]](match[2])
      const linkLabel = match[1];
      const linkUrl = match[2];
      parts.push(
        <a
          key={`link-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-500 hover:text-pink-400 font-medium underline underline-offset-2 transition-colors"
        >
          {linkLabel}
        </a>
      );
    } else if (match[3]) {
      // Bare URL
      const rawUrl = match[3];
      parts.push(
        <a
          key={`url-${match.index}`}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-500 hover:text-pink-400 font-medium underline underline-offset-2 break-all transition-colors"
        >
          {rawUrl}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export const SocietiesTabs: React.FC<SocietiesTabsProps> = ({ categories = societiesData }) => {
  const societyKeys = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    societyKeys.length > 0 ? societyKeys[0] : null
  );

  // Keep selected category synchronized if categories change
  const activeCategory =
    selectedCategory && categories[selectedCategory]
      ? selectedCategory
      : societyKeys.length > 0
      ? societyKeys[0]
      : null;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <nav className="flex flex-wrap gap-2 mb-2 sm:mb-4">
        {societyKeys.map((key) => {
          const isSelected = activeCategory === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={`px-3 sm:px-5 py-2 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base border cursor-pointer ${
                isSelected
                  ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-500/20'
                  : 'text-muted-foreground bg-card border-border hover:bg-muted hover:border-pink-500/30'
              }`}
            >
              <span>{categories[key].title}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex-grow">
        {activeCategory && categories[activeCategory]?.societies?.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {categories[activeCategory].societies.map((item, index) => {
              const links = extractSocietyLinks(item);
              const primaryWebsite = links.find((l) => l.type === 'website');

              return (
                <div
                  key={`${activeCategory}-${index}`}
                  className="p-4 sm:p-5 bg-card rounded-xl border border-border hover:border-pink-500/40 transition-all duration-200 shadow-sm group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <h4 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-pink-400 transition-colors">
                      {item.name}
                    </h4>

                    {primaryWebsite && (
                      <a
                        href={primaryWebsite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-md text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500 hover:text-white transition-all duration-200 shadow-xs"
                      >
                        <Globe className="h-3 w-3" />
                        <span>Visit Website</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {renderDescriptionWithLinks(item.description)}
                  </div>

                  {links.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                        Links & Socials:
                      </span>
                      {links.map((link, lIdx) => (
                        <a
                          key={`${link.url}-${lIdx}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-pink-600 hover:text-white border border-border hover:border-pink-500 transition-all duration-200 shadow-xs group/link"
                          title={`Open ${link.label} (${link.url})`}
                        >
                          {renderLinkIcon(link.type)}
                          <span>{link.label}</span>
                          <ExternalLink className="h-3 w-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 sm:p-8 text-muted-foreground bg-card rounded-lg border border-border">
            <p className="text-base sm:text-lg">
              {societyKeys.length > 0
                ? 'No societies listed in this category.'
                : 'Please select a society category to view details.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
