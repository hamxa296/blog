export interface GuideFaq {
  question: string;
  answer: string;
}

export interface ContactEntry {
  contact: string;
  department: string;
  purpose: string;
}

export interface SocietyLinkItem {
  label?: string;
  name?: string;
  url?: string;
  link?: string;
  href?: string;
  platform?: string;
}

export type SocietyLinkValue = string | SocietyLinkItem;

export interface SocietyEntry {
  name: string;
  description: string;
  website?: string;
  link?: string;
  url?: string;
  links?: SocietyLinkValue[] | Record<string, string>;
  socials?: Record<string, string> | SocietyLinkValue[];
  [key: string]: unknown;
}

export interface SocietyCategory {
  title: string;
  societies: SocietyEntry[];
}

export type SocietyCategoryMap = Record<string, SocietyCategory>;

export interface GuideSection {
  id: string;
  tag: string;
  shortDescription: string;
  fullContent: string | ContactEntry[] | SocietyCategoryMap;
  faqs?: GuideFaq[];
  warnings?: string[];
}

export interface GuideEditForm {
  tag: string;
  shortDescription: string;
  fullContent: string;
  faqs: GuideFaq[];
  warnings: string[];
}

export type CheckedItems = Record<string, boolean>;

export interface PackingListData {
  checkedItems?: CheckedItems;
  lastUpdated?: string;
}
