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
          <thead className="text-white bg-[#1A3D63]">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-[#4A7FA7]/40 font-semibold">Contact</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-[#4A7FA7]/40 font-semibold">Department</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-[#4A7FA7]/40 font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {fullContent.map((item, index) => (
              <tr key={index} className="border-b border-[#4A7FA7]/30 last:border-b-0">
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-[#F6FAFD]">{item.contact}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-[#B3CFE5]">{item.department}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-[#B3CFE5]">{item.purpose}</td>
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
              <li key={index} className="text-[#B3CFE5]">
                {content}
              </li>
            ) : null;
          })}
      </ul>
    );
  }

  if (typeof fullContent === 'string' && fullContent) {
    return <p className="mt-4 text-[#F6FAFD] leading-relaxed whitespace-pre-wrap">{fullContent}</p>;
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
      className="mt-6 sm:mt-12 p-4 sm:p-8 guide-section-panel rounded-xl shadow-inner transition-all duration-500 ease-in-out"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#B3CFE5]">{section.tag}</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onEdit(section.id)}
            className="bg-[#4A7FA7] text-white px-4 py-2 rounded-lg hover:bg-[#1A3D63] transition-colors shadow-md self-start"
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
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-[#0A1931] rounded-xl border border-[#4A7FA7]/40">
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-[#B3CFE5] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                />
              </svg>
              <h3 className="text-xl font-semibold text-[#B3CFE5] mb-2">Interactive Campus Map</h3>
              <p className="text-[#B3CFE5] mb-6">
                Explore our enhanced interactive campus map with detailed information about all locations, buildings, and facilities.
              </p>
            </div>
            <Link
              to="/map"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#4A7FA7] hover:bg-[#1A3D63] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Interactive Map
            </Link>
            <p className="text-xs text-[#B3CFE5] mt-3">
              Features: Pin locations, detailed descriptions, touch support, and responsive design
            </p>
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
        <div className="mt-8 p-6 rounded-xl bg-[#0A1931] border border-[#4A7FA7]/30">
          <h3 className="text-2xl font-semibold font-serif text-[#B3CFE5] border-b-2 pb-2 mb-4 border-[#4A7FA7]/30">
            FAQs
          </h3>
          <div className="space-y-4">
            {section.faqs.map((faq, index) => (
              <details
                key={index}
                className="group cursor-pointer p-4 rounded-lg bg-[#0A1931] border border-[#4A7FA7]/30 shadow-sm"
              >
                <summary className="flex justify-between items-center font-medium list-none">
                  <span className="font-semibold text-[#F6FAFD]">{faq.question}</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <p className="text-[#B3CFE5] mt-2 ml-4">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {section.warnings && section.warnings.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold font-serif text-[#B3CFE5] border-b-2 pb-2 mb-4 border-[#4A7FA7]/30">
            Helpful Reminders
          </h3>
          <div className="space-y-4">
            {section.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start p-4 bg-[#0A1931] border-l-4 border-[#4A7FA7] text-[#B3CFE5] rounded-md"
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
