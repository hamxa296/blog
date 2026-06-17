export interface GuideFaq {
  question: string;
  answer: string;
}

export interface ContactEntry {
  contact: string;
  department: string;
  purpose: string;
}

export interface SocietyEntry {
  name: string;
  description: string;
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
