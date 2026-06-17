import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  subscribePackingList,
  updateCheckedItems,
} from '../../services/guideService';
import type { CheckedItems } from '../../types/guide';
import {
  buildItemId,
  getDedupedPackingData,
  packingCategories,
  slugify,
  type PackingCategoryKey,
} from './guideData';

type OpenSections = Record<string, boolean>;

const GUEST_PROGRESS_KEY = 'packing_progress_guest';
const GUEST_CUSTOM_KEY = 'user_custom_items_guest';

const getCustomKey = (uid?: string) => (uid ? `user_custom_items_${uid}` : GUEST_CUSTOM_KEY);

const loadCustomItems = (uid?: string): string[] => {
  try {
    const raw = localStorage.getItem(getCustomKey(uid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeItem = (value: string) => value.toLowerCase().trim();

interface PackingChecklistProps {
  onSessionChange?: (hasChanges: boolean) => void;
}

export const PackingChecklist: React.FC<PackingChecklistProps> = ({ onSessionChange }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const deduped = useMemo(() => getDedupedPackingData(), []);
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [customItems, setCustomItems] = useState<string[]>(() => loadCustomItems(uid));
  const [customItemsRevision, setCustomItemsRevision] = useState(0);
  const [openSections, setOpenSections] = useState<OpenSections>({
    clothing: true,
    bedding: false,
    academics: false,
    misc: false,
    custom: false,
  });
  const [showGuestSavePrompt, setShowGuestSavePrompt] = useState(false);
  const [isLoadingSavedList, setIsLoadingSavedList] = useState(false);
  const [hasSessionChanges, setHasSessionChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const packingUnsubRef = useRef<(() => void) | null>(null);

  const persistChecked = useCallback(
    async (next: CheckedItems) => {
      setCheckedItems(next);
      setHasSessionChanges(true);
      onSessionChange?.(true);

      if (uid) {
        try {
          await updateCheckedItems(uid, next);
        } catch (e) {
          console.warn('Deferred save failed; will prompt on exit.', e);
        }
      } else {
        try {
          localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(next));
          setShowGuestSavePrompt(true);
        } catch (e) {
          console.error('Failed to save guest packing progress:', e);
        }
      }
    },
    [uid, onSessionChange],
  );

  useEffect(() => {
    onSessionChange?.(hasSessionChanges);
  }, [hasSessionChanges, onSessionChange]);

  useEffect(() => {
    if (packingUnsubRef.current) {
      packingUnsubRef.current();
      packingUnsubRef.current = null;
    }

    if (!uid) {
      setIsLoadingSavedList(false);
      try {
        const guestRaw = localStorage.getItem(GUEST_PROGRESS_KEY);
        setCheckedItems(guestRaw ? JSON.parse(guestRaw) : {});
      } catch {
        setCheckedItems({});
      }
      setCustomItems(loadCustomItems(undefined));
      return;
    }

    const migrateAndSubscribe = async () => {
      setIsLoadingSavedList(true);

      let guestChecked: CheckedItems = {};
      try {
        const guestRaw = localStorage.getItem(GUEST_PROGRESS_KEY);
        guestChecked = guestRaw ? JSON.parse(guestRaw) : {};
      } catch {
        guestChecked = {};
      }

      if (Object.keys(guestChecked).length > 0) {
        await updateCheckedItems(uid, guestChecked);
        try {
          localStorage.removeItem(GUEST_PROGRESS_KEY);
        } catch {
          /* ignore */
        }
      }

      packingUnsubRef.current = subscribePackingList(
        uid,
        (data) => {
          setCheckedItems(data?.checkedItems ?? {});
          setIsLoadingSavedList(false);
        },
        (err) => {
          console.error('Packing list listener error:', err);
          setIsLoadingSavedList(false);
        },
      );
    };

    migrateAndSubscribe();
    setCustomItems(loadCustomItems(uid));

    return () => {
      if (packingUnsubRef.current) {
        packingUnsubRef.current();
        packingUnsubRef.current = null;
      }
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    try {
      (window as Window & { packingProgress?: { hasUnsaved: boolean; save: () => Promise<void> } }).packingProgress = {
        hasUnsaved: hasSessionChanges,
        save: async () => {
          if (!uid) return;
          await updateCheckedItems(uid, checkedItems);
        },
      };
    } catch {
      /* ignore */
    }
  }, [uid, hasSessionChanges, checkedItems]);

  const persistCustomItems = (next: string[]) => {
    setCustomItems(next);
    try {
      localStorage.setItem(getCustomKey(uid), JSON.stringify(next));
    } catch (err) {
      console.error('Failed to save custom items:', err);
    }
  };

  const baseSet = useMemo(
    () =>
      new Set(
        [...deduped.clothing, ...deduped.bedding, ...deduped.academics, ...deduped.misc].map(normalizeItem),
      ),
    [deduped],
  );

  const customFiltered = useMemo(() => {
    void customItemsRevision;
    const seen = new Set<string>();
    return customItems.filter((item) => {
      const normalized = normalizeItem(item);
      if (baseSet.has(normalized) || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [customItems, baseSet, customItemsRevision]);

  const total =
    deduped.clothing.length +
    deduped.bedding.length +
    deduped.academics.length +
    deduped.misc.length +
    customFiltered.length;

  const done = Object.values(checkedItems).filter(Boolean).length;

  const handleCheckboxChange = async (itemId: string, isChecked: boolean) => {
    if (!uid) {
      setShowGuestSavePrompt(true);
      alert('Please login to track and sync your packing progress across devices.');
      return;
    }
    await persistChecked({ ...checkedItems, [itemId]: isChecked });
  };

  const handleSelectAllIn = async (categoryKey: PackingCategoryKey, items: string[]) => {
    const updated = { ...checkedItems };
    items.forEach((item) => {
      updated[buildItemId(categoryKey, item)] = true;
    });
    await persistChecked(updated);
  };

  const handleClearIn = async (categoryKey: PackingCategoryKey, items: string[]) => {
    const updated = { ...checkedItems };
    items.forEach((item) => {
      updated[buildItemId(categoryKey, item)] = false;
    });
    await persistChecked(updated);
  };

  const handleAddCustomItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newItem = (formData.get('newItem') || '').toString().trim();
    if (!newItem) return;

    const normalized = normalizeItem(newItem);
    if (baseSet.has(normalized) || customItems.some((item) => normalizeItem(item) === normalized)) {
      event.currentTarget.reset();
      return;
    }

    persistCustomItems([...customItems, newItem]);
    setCustomItemsRevision((v) => v + 1);
    event.currentTarget.reset();
  };

  const handleDeleteCustomItem = async (itemLabel: string) => {
    const normalized = normalizeItem(itemLabel);
    persistCustomItems(customItems.filter((item) => normalizeItem(item) !== normalized));

    const customId = `custom-${slugify(itemLabel)}`;
    if (customId in checkedItems) {
      const updated = { ...checkedItems };
      delete updated[customId];
      await persistChecked(updated);
    }
    setCustomItemsRevision((v) => v + 1);
  };

  const handleSaveNow = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      await updateCheckedItems(uid, checkedItems);
      setHasSessionChanges(false);
      onSessionChange?.(false);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mt-4">
      <h3 className="text-xl sm:text-2xl font-semibold font-serif text-[#B3CFE5] mb-2">
        Your Essential Packing Checklist
      </h3>
      <p className="text-sm text-[#B3CFE5] mb-4">
        Check items as you pack. Your progress is saved automatically
        {uid ? ' to your account' : ' on this device'}.
      </p>

      {isLoadingSavedList && (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-300 text-sm">Loading your saved packing list...</span>
        </div>
      )}

      {!isLoadingSavedList && (
        <>
          <form onSubmit={handleAddCustomItem} className="mb-4 flex flex-col sm:flex-row gap-2">
            <input
              name="newItem"
              type="text"
              placeholder="Add a custom item (saved only for you)"
              className="flex-grow p-2 border border-[#4A7FA7] rounded focus:outline-none focus:ring-1 focus:ring-[#4A7FA7] bg-[#0A1931] text-[#F6FAFD] text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#4A7FA7] text-white rounded hover:bg-[#1A3D63] font-semibold text-sm"
            >
              Add Item
            </button>
          </form>

          <div className="space-y-2">
            {packingCategories.map((section) => {
              const items = deduped[section.key];
              const checkedCount = items.filter((item) => checkedItems[buildItemId(section.key, item)]).length;

              return (
                <div key={section.key} className="bg-[#0A1931] rounded overflow-hidden border border-[#4A7FA7]/30">
                  <div
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1A3D63] cursor-pointer"
                    onClick={() => toggleSection(section.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#F6FAFD] text-sm">{section.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#4A7FA7]/30 text-[#B3CFE5]">
                        {checkedCount}/{items.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllIn(section.key, items);
                        }}
                        className="text-xs px-2 py-1 bg-[#4A7FA7] text-white rounded hover:bg-[#1A3D63]"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearIn(section.key, items);
                        }}
                        className="text-xs px-2 py-1 bg-[#0A1931] text-[#B3CFE5] rounded hover:bg-[#1A3D63]"
                      >
                        Clear
                      </button>
                      <svg
                        className={`w-4 h-4 text-[#B3CFE5] transition-transform ${openSections[section.key] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {openSections[section.key] && (
                    <div className="px-3 pb-2 pt-1">
                      <div className="space-y-1">
                        {items.map((item) => {
                          const itemId = buildItemId(section.key, item);
                          return (
                            <label
                              key={itemId}
                              className="flex items-start space-x-2 p-1 rounded hover:bg-[#1A3D63]/40 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checkedItems[itemId] || false}
                                onChange={(e) => handleCheckboxChange(itemId, e.target.checked)}
                                className="mt-0.5 h-4 w-4 text-[#4A7FA7] focus:ring-[#4A7FA7] border-[#4A7FA7]/40 rounded"
                              />
                              <span className="text-[#B3CFE5] text-sm leading-5">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {customFiltered.length > 0 && (
            <div className="mt-4 bg-[#0A1931] rounded overflow-hidden border border-[#4A7FA7]/30">
              <div
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1A3D63] cursor-pointer"
                onClick={() => toggleSection('custom')}
              >
                <span className="font-semibold text-[#F6FAFD] text-sm">Your Added Items</span>
                <svg
                  className={`w-4 h-4 text-[#B3CFE5] transition-transform ${openSections.custom ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {openSections.custom && (
                <div className="px-3 pb-2 pt-1">
                  <div className="space-y-1">
                    {customFiltered.map((item) => {
                      const id = `custom-${slugify(item)}`;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-1 rounded hover:bg-[#1A3D63]/40"
                        >
                          <label className="flex items-start space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checkedItems[id] || false}
                              onChange={(e) => handleCheckboxChange(id, e.target.checked)}
                              className="mt-0.5 h-4 w-4 text-[#4A7FA7] focus:ring-[#4A7FA7] border-[#4A7FA7]/40 rounded"
                            />
                            <span className="text-[#B3CFE5] text-sm">{item}</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomItem(item)}
                            className="text-red-400 hover:text-red-300"
                            aria-label={`Delete ${item}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.381 21H7.618a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m10 0H4" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 p-3 bg-[#0A1931] rounded border border-[#4A7FA7]/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#B3CFE5]">Packing Progress</span>
              <span className="text-sm text-[#B3CFE5]">
                {done} / {total} items
              </span>
            </div>
            <div className="w-full bg-[#1A3D63] rounded-full h-2">
              <div
                className="bg-[#4A7FA7] h-2 rounded-full transition-all duration-300"
                style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
              />
            </div>
            {uid && hasSessionChanges && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#B3CFE5]">You have unsaved changes.</span>
                <button
                  type="button"
                  onClick={handleSaveNow}
                  className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save now'}
                </button>
              </div>
            )}
          </div>

          {total > 0 && done === total && (
            <div className="mt-4 p-3 bg-green-900/70 border border-green-600 rounded text-green-100">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-sm">All set! 🎉</h4>
                  <p className="text-xs mt-1">
                    You&apos;ve checked everything on your list. Safe travels and welcome to GIKI!
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!uid && (
        <div className="mt-4 p-4 bg-gradient-to-r from-[#0A1931] to-[#1A3D63] border border-[#4A7FA7] rounded text-center relative">
          <div className="mb-3">
            <svg className="w-8 h-8 text-[#B3CFE5] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 012 2h7a2 2 0 012 2v1" />
            </svg>
            <h4 className="text-base font-semibold text-[#B3CFE5] mb-1">Login Required</h4>
            <p className="text-[#B3CFE5] text-xs mb-3">
              To save your packing list and track your progress across sessions, please login to your account.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/login" className="px-4 py-2 bg-[#4A7FA7] text-white rounded hover:bg-[#1A3D63] transition-colors font-semibold text-sm">
              Login Now
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold text-sm">
              Create Account
            </Link>
          </div>
          <p className="text-[#B3CFE5] text-xs mt-2">
            💡 Your packing list will be automatically saved and you can continue where you left off!
          </p>
          {showGuestSavePrompt && (
            <div className="mt-3 p-2 bg-[#0A1931] border border-[#4A7FA7]/40 rounded text-[#B3CFE5]">
              <span className="text-xs">Progress is saved only on this device. Login to sync across devices.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
