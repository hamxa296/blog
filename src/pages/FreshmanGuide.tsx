import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeGuideSections, updateGuideSection } from '../services/guideService';
import type { GuideEditForm, GuideSection, SocietyCategoryMap } from '../types/guide';
import { GuideEditModal } from '../components/guide/GuideEditModal';
import { GuideSectionDetail } from '../components/guide/GuideSectionDetail';
import { BentoGrid, BentoGridItem } from '../components/guide/BentoGrid';
import { BookOpen, Compass, Home, Map, Package, Users, Phone, Sparkles } from 'lucide-react';
import img2 from "../assets/2.png";
import img3 from "../assets/3.png";
import img4 from "../assets/4.png";
import img7 from "../assets/7.png";
import img9 from "../assets/img9.jpg";
import img10 from "../assets/img10.jpg";
import img11 from "../assets/11.jpeg";
import img12 from "../assets/12.jpeg";
import img13 from "../assets/13.jpeg";
import img14 from "../assets/14.png";
import img15 from "../assets/15.jpg";




const SECTION_ICONS: Record<string, React.ReactNode> = {
  'campus-map': <Map className="h-4 w-4" />,
  'dorm-room-info': <Home className="h-4 w-4" />,
  'what-to-pack': <Package className="h-4 w-4" />,
  'societies-events': <Users className="h-4 w-4" />,
  'important-contacts': <Phone className="h-4 w-4" />,
};

const SECTION_HEADERS = [
  img10,
  img3,
  img2,
  img14,
  img12,
  img11,
  img7,
  img15,
  img9,
  img4,
  img13,
  img10

];

type ConnectionStatus = 'connecting' | 'connected' | 'error';

export const FreshmanGuide: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [guideSections, setGuideSections] = useState<GuideSection[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GuideEditForm>({
    tag: '',
    shortDescription: '',
    fullContent: '',
    faqs: [],
    warnings: [],
  });
  const [hasPackingSessionChanges, setHasPackingSessionChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const timeoutId = window.setTimeout(() => {
      setConnectionStatus((prev) => (prev === 'connecting' ? 'error' : prev));
    }, 10000);

    try {
      unsubscribe = subscribeGuideSections(
        (sections) => {
          window.clearTimeout(timeoutId);
          setConnectionStatus('connected');
          setGuideSections(sections);
        },
        (err) => {
          window.clearTimeout(timeoutId);
          console.warn('Firestore listener error:', err);
          setConnectionStatus('error');
          setGuideSections([]);
        },
      );
    } catch (e) {
      window.clearTimeout(timeoutId);
      console.warn('Error setting up guide listener:', e);
      setConnectionStatus('error');
      setGuideSections([]);
    }

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, []);

  const societySubCategories = useMemo((): SocietyCategoryMap | undefined => {
    const section = guideSections.find((s) => s.id === 'societies-events');
    if (!section?.fullContent || typeof section.fullContent === 'string' || Array.isArray(section.fullContent)) {
      return undefined;
    }
    return section.fullContent as SocietyCategoryMap;
  }, [guideSections]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      Boolean(user && hasPackingSessionChanges && currentLocation.pathname !== nextLocation.pathname),
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitModal(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (user && hasPackingSessionChanges) {
        const message = 'You have unsaved packing progress. Save before exiting?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [user, hasPackingSessionChanges]);

  const handleTagClick = (sectionId: string) => {
    setExpandedSection(sectionId);
    window.setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const y = element.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleBackClick = () => {
    setExpandedSection(null);
  };

  const handleEditClick = (sectionId: string) => {
    const currentData = guideSections.find((s) => s.id === sectionId);
    if (!currentData) return;

    setEditingSection(sectionId);
    const content =
      typeof currentData.fullContent === 'string'
        ? currentData.fullContent
        : JSON.stringify(currentData.fullContent, null, 2);

    setEditForm({
      tag: currentData.tag,
      shortDescription: currentData.shortDescription,
      fullContent: content,
      faqs: currentData.faqs ?? [],
      warnings: currentData.warnings ?? [],
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSection) return;

    let updatedContent: GuideSection['fullContent'] = editForm.fullContent;
    if (editingSection === 'important-contacts' || editingSection === 'societies-events') {
      try {
        updatedContent = JSON.parse(editForm.fullContent);
      } catch (e) {
        console.error('Invalid JSON format for this section:', e);
        return;
      }
    }

    await updateGuideSection(editingSection, {
      tag: editForm.tag,
      shortDescription: editForm.shortDescription,
      fullContent: updatedContent,
      faqs: editForm.faqs,
      warnings: editForm.warnings,
    });
    setEditingSection(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setEditForm((prev) => {
      const newFaqs = [...prev.faqs];
      newFaqs[index] = { ...newFaqs[index], [field]: value };
      return { ...prev, faqs: newFaqs };
    });
  };

  const handleAddFaq = () => {
    setEditForm((prev) => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
  };

  const handleRemoveFaq = (index: number) => {
    setEditForm((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

  const handleWarningChange = (index: number, value: string) => {
    setEditForm((prev) => {
      const newWarnings = [...prev.warnings];
      newWarnings[index] = value;
      return { ...prev, warnings: newWarnings };
    });
  };

  const handleAddWarning = () => {
    setEditForm((prev) => ({ ...prev, warnings: [...prev.warnings, ''] }));
  };

  const handleRemoveWarning = (index: number) => {
    setEditForm((prev) => ({ ...prev, warnings: prev.warnings.filter((_, i) => i !== index) }));
  };

  const handleConfirmSaveAndExit = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const packingProgress = (
        window as Window & { packingProgress?: { save: () => Promise<void> } }
      ).packingProgress;
      if (packingProgress?.save) {
        await packingProgress.save();
      }
      setHasPackingSessionChanges(false);
      setShowExitModal(false);
      if (blocker.state === 'blocked') {
        blocker.proceed();
      }
    } finally {
      setIsSaving(false);
    }
  }, [user, blocker]);

  const handleLeaveWithoutSaving = () => {
    setShowExitModal(false);
    setHasPackingSessionChanges(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const handleStayOnPage = () => {
    setShowExitModal(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  return (
    <main className="min-h-[calc(100vh-88px)] bg-background text-foreground relative z-10 pt-10 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
            <Compass className="h-3.5 w-3.5" />
            Freshman Guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Welcome to GIKI
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl text-sm sm:text-base">
            Your ultimate resource for a smooth start — essential info, tips, and
            campus resources in one place.
          </p>
        </div>

        {connectionStatus === 'error' && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            No internet connection — guide data unavailable
          </div>
        )}

        {expandedSection === null && (
          <>
            {guideSections.length > 0 ? (
              <BentoGrid>
                {guideSections.map((section, index) => (
                  <BentoGridItem
                    key={section.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTagClick(section.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTagClick(section.id);
                      }
                    }}
                    className={`cursor-pointer ${
                      index % 4 === 0 || index % 4 === 3 ? 'md:col-span-2' : ''
                    }`}
                    title={section.tag}
                    description={section.shortDescription}
                    icon={
                      SECTION_ICONS[section.id] || (
                        <BookOpen className="h-4 w-4" />
                      )
                    }
                    header={
                      <img
                        src={SECTION_HEADERS[index % SECTION_HEADERS.length]}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    }
                  />
                ))}
              </BentoGrid>
            ) : (
              <div className="rounded-lg border border-border bg-card p-10 text-center">
                {connectionStatus === 'connecting' ? (
                  <p className="text-muted-foreground">Connecting to database...</p>
                ) : connectionStatus === 'error' ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No Internet Connection</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Unable to load the guide data. Please check your connection.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading guide data...</p>
                )}
              </div>
            )}
          </>
        )}

        {guideSections.map(
          (section) =>
            expandedSection === section.id && (
              <GuideSectionDetail
                key={section.id}
                section={section}
                isAdmin={isAdmin}
                onEdit={handleEditClick}
                societySubCategories={societySubCategories}
                onPackingSessionChange={setHasPackingSessionChanges}
              />
            ),
        )}

        {expandedSection !== null && (
          <div className="text-center mt-10">
            <button
              type="button"
              onClick={handleBackClick}
              className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-secondary transition-colors"
            >
              ← Back to all sections
            </button>
          </div>
        )}
      </div>

      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-5 w-[90%] max-w-md shadow-xl">
            <h4 className="text-lg font-semibold mb-2">Save your progress?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              You have changes in your packing list. Would you like to save before leaving?
            </p>
            <div className="flex gap-2 justify-end flex-wrap">
              <button
                type="button"
                onClick={handleStayOnPage}
                className="px-3 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:opacity-90"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveAndExit}
                className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground"
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save & Leave'}
              </button>
              <button
                type="button"
                onClick={handleLeaveWithoutSaving}
                className="px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary"
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSection && (
        <GuideEditModal
          editForm={editForm}
          editingSectionId={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={handleSaveEdit}
          onFormChange={handleFormChange}
          onFaqChange={handleFaqChange}
          onAddFaq={handleAddFaq}
          onRemoveFaq={handleRemoveFaq}
          onWarningChange={handleWarningChange}
          onAddWarning={handleAddWarning}
          onRemoveWarning={handleRemoveWarning}
        />
      )}
    </main>
  );
};
