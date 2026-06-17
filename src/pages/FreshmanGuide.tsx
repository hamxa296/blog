import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeGuideSections, updateGuideSection } from '../services/guideService';
import type { GuideEditForm, GuideSection, SocietyCategoryMap } from '../types/guide';
import { GuideEditModal } from '../components/guide/GuideEditModal';
import { GuideSectionDetail } from '../components/guide/GuideSectionDetail';

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
    <main className="min-h-[calc(100vh-88px)] text-white relative z-10 pt-8 pb-16 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3D63] text-white p-4 sm:p-8 mb-4 sm:mb-8 rounded-xl shadow-lg text-center border border-[#B3CFE5]/30">
          <h1 className="text-2xl sm:text-4xl font-bold font-lora handwriting-title">GIKI Freshman Guide</h1>
          <p className="mt-2 text-base sm:text-lg text-[#B3CFE5]">
            Your ultimate resource for a smooth start at GIKI.
          </p>
        </div>

        <div className="chronicle-container p-3 sm:p-6 lg:p-10 rounded-xl sm:rounded-2xl shadow-xl">
          {connectionStatus === 'error' && (
            <div className="mb-4 p-3 bg-[#1A3D63] border border-[#4A7FA7] rounded-lg">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-[#B3CFE5] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <span className="text-[#B3CFE5] text-sm">No internet connection - guide data unavailable</span>
              </div>
            </div>
          )}

          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-lora text-[#B3CFE5] handwriting-title">
              Welcome to GIKI!
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#B3CFE5] max-w-2xl mx-auto px-2">
              Welcome to your new home! This guide is designed to help you navigate your first few weeks here.
              We&apos;ve compiled essential information, tips, and resources to make your transition as smooth as possible.
            </p>
          </div>

          {expandedSection === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
              {guideSections.length > 0 ? (
                guideSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className="p-4 sm:p-6 card-panel rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-0.5 text-left"
                    onClick={() => handleTagClick(section.id)}
                    title={section.shortDescription}
                  >
                    <h3 className="text-lg sm:text-xl font-semibold font-lora text-[#1A3D63]">{section.tag}</h3>
                    <p className="mt-2 text-sm text-[#0A1931]/80">{section.shortDescription}</p>
                  </button>
                ))
              ) : (
                <div className="col-span-2 text-center">
                  {connectionStatus === 'connecting' ? (
                    <div className="p-6 bg-[#0A1931] border border-[#4A7FA7] rounded-lg">
                      <div className="flex items-center justify-center mb-4">
                        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-[#B3CFE5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-[#B3CFE5] text-lg">Connecting to database...</span>
                      </div>
                      <p className="text-[#B3CFE5] text-sm">Please wait while we connect to the guide database.</p>
                    </div>
                  ) : connectionStatus === 'error' ? (
                    <div className="p-8 bg-[#0A1931] border border-[#4A7FA7] rounded-lg">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-[#B3CFE5] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                        <h3 className="text-xl font-semibold text-[#B3CFE5] mb-2">No Internet Connection</h3>
                        <p className="text-[#B3CFE5] mb-4">
                          Unable to load the guide data. Please check your internet connection and try again.
                        </p>
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="px-6 py-3 bg-[#4A7FA7] text-white rounded-lg hover:bg-[#1A3D63] transition-colors font-semibold"
                        >
                          Retry Connection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading guide data...</p>
                  )}
                </div>
              )}
            </div>
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
            <div className="text-center mt-6 sm:mt-12">
              <button
                type="button"
                onClick={handleBackClick}
                className="bg-[#4A7FA7] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold hover:bg-[#1A3D63] transition-colors shadow-md"
              >
                &larr; Back to all sections
              </button>
            </div>
          )}
        </div>
      </div>

      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 w-[90%] max-w-md shadow-xl">
            <h4 className="text-lg font-semibold text-gray-100 mb-2">Save your progress?</h4>
            <p className="text-sm text-gray-300 mb-4">
              You have changes in your packing list. Would you like to save before leaving?
            </p>
            <div className="flex gap-2 justify-end flex-wrap">
              <button
                type="button"
                onClick={handleStayOnPage}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveAndExit}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save & Leave'}
              </button>
              <button
                type="button"
                onClick={handleLeaveWithoutSaving}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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
