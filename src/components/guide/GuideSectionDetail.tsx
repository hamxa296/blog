import React from 'react';
import { Link } from 'react-router-dom';
import type { ContactEntry, GuideSection, SocietyCategoryMap } from '../../types/guide';
import { GuideDivider } from './GuideDivider';
import { PackingChecklist } from './PackingChecklist';
import { SocietiesTabs } from './SocietiesTabs';
import { HostelTours } from './HostelTours';

interface GuideSectionDetailProps {
  section: GuideSection;
  isAdmin: boolean;
  onEdit: (sectionId: string) => void;
  societySubCategories?: SocietyCategoryMap;
  onPackingSessionChange?: (hasChanges: boolean) => void;
}

function isContactList(content: unknown): content is ContactEntry[] {
  return (
    Array.isArray(content) &&
    content.length > 0 &&
    typeof content[0] === 'object' &&
    content[0] !== null &&
    'contact' in content[0]
  );
}

function isSocietyMap(content: unknown): content is SocietyCategoryMap {
  return typeof content === 'object' && content !== null && !Array.isArray(content);
}

function renderGenericContent(section: GuideSection) {
  if (section.id === 'societies-events') return null;
  if (section.id === 'what-to-pack') return null;

  const { fullContent } = section;

  if (isContactList(fullContent)) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto border-collapse text-sm sm:text-base">
          <thead className="text-foreground bg-secondary">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-border font-semibold">Contact</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-border font-semibold">Department</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-border font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {fullContent.map((item, index) => (
              <tr key={index} className="border-b border-border last:border-b-0">
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-foreground">{item.contact}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-muted-foreground">{item.department}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-muted-foreground">{item.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (typeof fullContent === 'string' && fullContent.trim().startsWith('-')) {
    return (
      <ul className="mt-4 space-y-2 list-disc list-inside">
        {fullContent
          .split('\n')
          .filter((line) => line.trim())
          .map((line, index) => {
            const content = line.trim().startsWith('-') ? line.trim().substring(1).trim() : line;
            return content ? (
              <li key={index} className="text-muted-foreground">
                {content}
              </li>
            ) : null;
          })}
      </ul>
    );
  }

  if (typeof fullContent === 'string' && fullContent) {
    return (
      <p className="mt-4 text-foreground leading-relaxed whitespace-pre-wrap">
        {fullContent}
      </p>
    );
  }

  if (isSocietyMap(fullContent)) {
    return <SocietiesTabs categories={fullContent} />;
  }

  return null;
}

export const GuideSectionDetail: React.FC<GuideSectionDetailProps> = ({
  section,
  isAdmin,
  onEdit,
  societySubCategories,
  onPackingSessionChange,
}) => {
  return (
    <div
      id={section.id}
      className="mt-6 sm:mt-12 p-4 sm:p-8 rounded-xl border border-border bg-card shadow-sm transition-all duration-500 ease-in-out"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {section.tag}
        </h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onEdit(section.id)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors shadow-md self-start text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {section.id === 'societies-events' && societySubCategories ? (
        <SocietiesTabs categories={societySubCategories} />
      ) : (
        renderGenericContent(section)
      )}

      {section.id === 'campus-map' && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-secondary/50 rounded-xl border border-border">
          <div className="text-center">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Interactive Campus Map
              </h3>
              <p className="text-muted-foreground mb-6">
                Explore our enhanced interactive campus map with detailed
                information about all locations, buildings, and facilities.
              </p>
            </div>
            <Link
              to="/map"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 shadow-lg"
            >
              Open Interactive Map
            </Link>
          </div>
        </div>
      )}

      {section.id === 'dorm-room-info' && (
        <div className="mt-6 sm:mt-8">
          <HostelTours />
        </div>
      )}

      {section.id === 'what-to-pack' && (
        <PackingChecklist onSessionChange={onPackingSessionChange} />
      )}

      <GuideDivider />

      {section.faqs && section.faqs.length > 0 && (
        <div className="mt-8 p-6 rounded-xl bg-secondary/40 border border-border">
          <h3 className="text-2xl font-semibold text-foreground border-b border-border pb-2 mb-4">
            FAQs
          </h3>
          <div className="space-y-4">
            {section.faqs.map((faq, index) => (
              <details
                key={index}
                className="group cursor-pointer p-4 rounded-lg bg-card border border-border shadow-sm"
              >
                <summary className="flex justify-between items-center font-medium list-none">
                  <span className="font-semibold text-foreground">{faq.question}</span>
                  <span className="transition group-open:rotate-180 text-muted-foreground">
                    <svg
                      fill="none"
                      height="24"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      width="24"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <p className="text-muted-foreground mt-2 ml-4">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {section.warnings && section.warnings.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-foreground border-b border-border pb-2 mb-4">
            Helpful Reminders
          </h3>
          <div className="space-y-4">
            {section.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start p-4 bg-secondary/40 border-l-4 border-primary text-muted-foreground rounded-md"
              >
                <p>{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
