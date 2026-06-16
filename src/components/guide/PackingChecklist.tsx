import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  buildItemId,
  getDedupedPackingData,
  packingCategories,
  slugify,
  type PackingCategoryKey,
} from './guideData';

type CheckedItems = Record<string, boolean>;
type OpenSections = Record<string, boolean>;

const GUEST_PROGRESS_KEY = 'packing_progress_guest';
const GUEST_CUSTOM_KEY = 'user_custom_items_guest';

const getProgressKey = (uid?: string) => (uid ? `packing_progress_${uid}` : GUEST_PROGRESS_KEY);
const getCustomKey = (uid?: string) => (uid ? `user_custom_items_${uid}` : GUEST_CUSTOM_KEY);

const loadCheckedItems = (uid?: string): CheckedItems => {
  try {
    const raw = localStorage.getItem(getProgressKey(uid));
    return raw ? (JSON.parse(raw) as CheckedItems) : {};
  } catch {
    return {};
  }
};

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

export const PackingChecklist: React.FC = () => {
  const { user } = useAuth();
  const uid = user?.uid;

  const deduped = useMemo(() => getDedupedPackingData(), []);
  const [checkedItems, setCheckedItems] = useState<CheckedItems>(() => loadCheckedItems(uid));
  const [customItems, setCustomItems] = useState<string[]>(() => loadCustomItems(uid));
  const [openSections, setOpenSections] = useState<OpenSections>({
    clothing: true,
    bedding: false,
    academics: false,
    misc: false,
    custom: false,
  });
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  useEffect(() => {
    setCheckedItems(loadCheckedItems(uid));
    setCustomItems(loadCustomItems(uid));
  }, [uid]);

  const persistChecked = (next: CheckedItems) => {
    setCheckedItems(next);
    try {
      localStorage.setItem(getProgressKey(uid), JSON.stringify(next));
      if (!uid) setShowGuestPrompt(true);
    } catch (err) {
      console.error('Failed to save packing progress:', err);
    }
  };

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
    const seen = new Set<string>();
    return customItems.filter((item) => {
      const normalized = normalizeItem(item);
      if (baseSet.has(normalized) || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [customItems, baseSet]);

  const total =
    deduped.clothing.length +
    deduped.bedding.length +
    deduped.academics.length +
    deduped.misc.length +
    customFiltered.length;

  const done = Object.values(checkedItems).filter(Boolean).length;

  const handleCheckboxChange = (itemId: string, isChecked: boolean) => {
    persistChecked({ ...checkedItems, [itemId]: isChecked });
  };

  const handleSelectAllIn = (categoryKey: PackingCategoryKey, items: string[]) => {
    const updated = { ...checkedItems };
    items.forEach((item) => {
      updated[buildItemId(categoryKey, item)] = true;
    });
    persistChecked(updated);
  };

  const handleClearIn = (categoryKey: PackingCategoryKey, items: string[]) => {
    const updated = { ...checkedItems };
    items.forEach((item) => {
      updated[buildItemId(categoryKey, item)] = false;
    });
    persistChecked(updated);
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
    event.currentTarget.reset();
  };

  const handleDeleteCustomItem = (itemLabel: string) => {
    const normalized = normalizeItem(itemLabel);
    persistCustomItems(customItems.filter((item) => normalizeItem(item) !== normalized));

    const customId = `custom-${slugify(itemLabel)}`;
    if (customId in checkedItems) {
      const updated = { ...checkedItems };
      delete updated[customId];
      persistChecked(updated);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-semibold font-serif text-[#B3CFE5] mb-2">
        Your Essential Packing Checklist
      </h3>
      <p className="text-sm text-[#B3CFE5] mb-4">
        Check items as you pack. Your progress is saved automatically
        {uid ? ' to this browser' : ' on this device'}.
      </p>

      {showGuestPrompt && !uid && (
        <div className="mb-4 p-3 rounded-lg border border-[#4A7FA7]/40 bg-[#0A1931] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-[#B3CFE5]">
            Sign in to keep your packing list synced if you switch devices.
          </p>
          <Link
            to="/login"
            className="text-sm px-4 py-2 rounded-lg bg-[#4A7FA7] text-white hover:bg-[#1A3D63] transition text-center"
          >
            Sign in
          </Link>
        </div>
      )}

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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>
    </div>
  );
};
