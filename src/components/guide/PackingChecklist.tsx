import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import {
  getDedupedPackingData,
  normalizeItem,
  slugify,
  PACKING_GUEST_KEY,
  CUSTOM_ITEMS_GUEST_KEY,
} from '../../data/freshmanGuideData';

type CheckedItems = Record<string, boolean>;

const buildItemId = (categoryKey: string, itemLabel: string) =>
  `${categoryKey}-${slugify(itemLabel)}`;

const PACKING_SECTIONS = [
  { key: 'clothing', title: 'Clothing & Personal Items' },
  { key: 'bedding', title: 'Bedding & Room Essentials' },
  { key: 'academics', title: 'Academics & Electronics' },
  { key: 'misc', title: 'Miscellaneous' },
] as const;

export const PackingChecklist: React.FC = () => {
  const { user } = useAuth();
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    clothing: true,
    bedding: false,
    academics: false,
    misc: false,
    custom: false,
  });
  const [customItemsRevision, setCustomItemsRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const deduped = useMemo(() => getDedupedPackingData(), []);
  const customStorageKey = user ? `user_custom_items_${user.uid}` : CUSTOM_ITEMS_GUEST_KEY;

  const persistChecked = useCallback(
    async (next: CheckedItems) => {
      setCheckedItems(next);
      if (user) {
        try {
          await setDoc(
            doc(db, 'users', user.uid, 'packing', 'list'),
            { checkedItems: next, lastUpdated: new Date().toISOString() },
            { merge: true }
          );
        } catch (err) {
          console.error('Failed to save packing list:', err);
        }
      } else {
        try {
          localStorage.setItem(PACKING_GUEST_KEY, JSON.stringify(next));
          setShowGuestPrompt(true);
        } catch (err) {
          console.error('Failed to save guest packing progress:', err);
        }
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      setLoading(true);
      const guestRaw = localStorage.getItem(PACKING_GUEST_KEY);
      const guestChecked: CheckedItems = guestRaw ? JSON.parse(guestRaw) : {};

      const unsub = onSnapshot(
        doc(db, 'users', user.uid, 'packing', 'list'),
        async (snapshot) => {
          const existing = snapshot.exists() ? snapshot.data()?.checkedItems || {} : {};
          const merged = { ...existing, ...guestChecked };
          if (Object.keys(guestChecked).length > 0) {
            await setDoc(
              doc(db, 'users', user.uid, 'packing', 'list'),
              { checkedItems: merged, lastUpdated: new Date().toISOString() },
              { merge: true }
            );
            localStorage.removeItem(PACKING_GUEST_KEY);
          }
          setCheckedItems(merged);
          setLoading(false);
        },
        () => setLoading(false)
      );
      return () => unsub();
    }

    try {
      const guestRaw = localStorage.getItem(PACKING_GUEST_KEY);
      setCheckedItems(guestRaw ? JSON.parse(guestRaw) : {});
    } catch {
      setCheckedItems({});
    }
    setLoading(false);
  }, [user]);

  const customItems = useMemo(() => {
    void customItemsRevision;
    try {
      const raw = localStorage.getItem(customStorageKey);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const baseSet = new Set(
        [...deduped.clothing, ...deduped.bedding, ...deduped.academics, ...deduped.misc].map(normalizeItem)
      );
      const seen = new Set<string>();
      return list.filter((item) => {
        const n = normalizeItem(item);
        if (baseSet.has(n) || seen.has(n)) return false;
        seen.add(n);
        return true;
      });
    } catch {
      return [];
    }
  }, [customStorageKey, customItemsRevision, deduped]);

  const sectionItemsMap: Record<string, string[]> = {
    clothing: deduped.clothing,
    bedding: deduped.bedding,
    academics: deduped.academics,
    misc: deduped.misc,
  };

  const total =
    deduped.clothing.length +
    deduped.bedding.length +
    deduped.academics.length +
    deduped.misc.length +
    customItems.length;
  const done = Object.values(checkedItems).filter(Boolean).length;

  const handleCheckboxChange = async (itemId: string, isChecked: boolean) => {
    await persistChecked({ ...checkedItems, [itemId]: isChecked });
  };

  const handleSelectAllIn = async (categoryKey: string, items: string[]) => {
    const updated = { ...checkedItems };
    items.forEach((item) => {
      updated[buildItemId(categoryKey, item)] = true;
    });
    await persistChecked(updated);
  };

  const handleClearIn = async (categoryKey: string, items: string[]) => {
    const updated = { ...checkedItems };
    items.forEach((item) => {
      updated[buildItemId(categoryKey, item)] = false;
    });
    await persistChecked(updated);
  };

  const handleAddCustomItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem = (formData.get('newItem') || '').toString().trim();
    if (!newItem) return;
    try {
      const raw = localStorage.getItem(customStorageKey);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      if (!existing.some((i) => normalizeItem(i) === normalizeItem(newItem))) {
        localStorage.setItem(customStorageKey, JSON.stringify([...existing, newItem]));
      }
      e.currentTarget.reset();
      setCustomItemsRevision((v) => v + 1);
    } catch (err) {
      console.error('Failed to save custom item:', err);
    }
  };

  const handleDeleteCustomItem = async (itemLabel: string) => {
    try {
      const raw = localStorage.getItem(customStorageKey);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const newList = list.filter((i) => normalizeItem(i) !== normalizeItem(itemLabel));
      localStorage.setItem(customStorageKey, JSON.stringify(newList));
      const customId = `custom-${slugify(itemLabel)}`;
      const updated = { ...checkedItems };
      delete updated[customId];
      await persistChecked(updated);
      setCustomItemsRevision((v) => v + 1);
    } catch (err) {
      console.error('Failed to delete custom item:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B3CFE5]" />
        <span className="ml-3 text-[#B3CFE5] text-sm">Loading your packing list...</span>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-semibold font-serif text-[#B3CFE5] mb-2">
        Your Essential Packing Checklist
      </h3>
      <p className="text-sm text-[#B3CFE5] mb-4">
        Check items as you pack. Your progress is saved automatically
        {user ? ' to your account' : ' on this device'}.
      </p>

      <form onSubmit={handleAddCustomItem} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          name="newItem"
          type="text"
          placeholder="Add a custom item (saved only for you)"
          className="flex-grow p-2 border border-[#4A7FA7] rounded focus:outline-none focus:ring-1 focus:ring-[#4A7FA7] bg-[#0A1931] text-[#F6FAFD] text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-[#4A7FA7] text-white rounded hover:bg-[#1A3D63] font-semibold text-sm">
          Add Item
        </button>
      </form>

      <div className="space-y-2">
        {PACKING_SECTIONS.map((section) => {
          const items = sectionItemsMap[section.key];
          const checkedCount = items.filter((it) => checkedItems[buildItemId(section.key, it)]).length;
          return (
            <div key={section.key} className="bg-[#0A1931] rounded overflow-hidden border border-[#4A7FA7]/30">
              <div
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1A3D63] cursor-pointer"
                onClick={() => setOpenSections((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
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

      {customItems.length > 0 && (
        <div className="mt-4 bg-[#0A1931] rounded overflow-hidden border border-[#4A7FA7]/30">
          <div
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1A3D63] cursor-pointer"
            onClick={() => setOpenSections((prev) => ({ ...prev, custom: !prev.custom }))}
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
            <div className="px-3 pb-2 pt-1 space-y-1">
              {customItems.map((item) => {
                const id = `custom-${slugify(item)}`;
                return (
                  <div key={id} className="flex items-center justify-between p-1 rounded hover:bg-[#1A3D63]/40">
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
                      className="text-red-400 hover:text-red-300 text-xs px-2"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-[#0A1931] rounded border border-[#4A7FA7]/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[#B3CFE5]">Packing Progress</span>
          <span className="text-sm text-[#B3CFE5]">{done} / {total} items</span>
        </div>
        <div className="w-full bg-[#1A3D63] rounded-full h-2">
          <div
            className="bg-[#4A7FA7] h-2 rounded-full transition-all duration-300"
            style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
          />
        </div>
      </div>

      {total > 0 && done === total && (
        <div className="mt-4 p-3 bg-green-900/70 border border-green-600 rounded text-green-100">
          <h4 className="font-semibold text-sm">All set!</h4>
          <p className="text-xs mt-1">You&apos;ve checked everything on your list. Safe travels and welcome to GIKI!</p>
        </div>
      )}

      {!user && (
        <div className="mt-4 p-4 bg-gradient-to-r from-[#0A1931] to-[#1A3D63] border border-[#4A7FA7] rounded text-center">
          <p className="text-[#B3CFE5] text-xs mb-3">
            Progress is saved on this device. Login to sync across devices.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/login" className="px-4 py-2 bg-[#4A7FA7] text-white rounded hover:bg-[#1A3D63] font-semibold text-sm">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-sm">
              Create Account
            </Link>
          </div>
          {showGuestPrompt && (
            <p className="mt-3 text-xs text-[#B3CFE5]">Progress saved on this device.</p>
          )}
        </div>
      )}
    </div>
  );
};
