import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { GuideSection, CheckedItems, PackingListData } from '../types/guide';

// guide.html uses __app_id when set, otherwise 'default-app-id' — NOT the Firebase appId
const APP_ID = import.meta.env.VITE_GUIDE_ARTIFACT_ID || 'default-app-id';

function freshmanGuideCollection() {
  return collection(db, 'artifacts', APP_ID, 'public', 'data', 'freshmanGuide');
}

function userPackingDoc(uid: string) {
  return doc(db, 'users', uid, 'packing', 'list');
}

let cachedGuideSections: GuideSection[] | null = null;
let lastGuideError: Error | null = null;
const dataListeners = new Set<(sections: GuideSection[]) => void>();
const errorListeners = new Set<(error: Error) => void>();
let globalUnsubscribe: Unsubscribe | null = null;

export function initGuidePreload(): void {
  if (globalUnsubscribe) return;
  try {
    globalUnsubscribe = onSnapshot(
      freshmanGuideCollection(),
      (snapshot) => {
        const sections: GuideSection[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          sections.push({
            id: docSnap.id,
            tag: data.tag ?? '',
            shortDescription: data.shortDescription ?? '',
            fullContent: data.fullContent ?? '',
            faqs: data.faqs ?? [],
            warnings: data.warnings ?? [],
          });
        });
        const mapped = sections.map((s) =>
          s.id === 'what-to-pack' ? { ...s, tag: 'Ready, Set, Pack!' } : s,
        );
        cachedGuideSections = mapped;
        lastGuideError = null;
        dataListeners.forEach((fn) => fn(mapped));
      },
      (err) => {
        console.warn('Guide preload error:', err);
        lastGuideError = err;
        errorListeners.forEach((fn) => fn(err));
      },
    );
  } catch (err) {
    console.warn('Error setting up guide preload:', err);
  }
}

// Auto-trigger background fetch as soon as module is loaded
initGuidePreload();

export function subscribeGuideSections(
  onData: (sections: GuideSection[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  initGuidePreload();

  // Instantly return cached sections if available
  if (cachedGuideSections) {
    onData(cachedGuideSections);
  } else if (lastGuideError) {
    onError(lastGuideError);
  }

  dataListeners.add(onData);
  errorListeners.add(onError);

  return () => {
    dataListeners.delete(onData);
    errorListeners.delete(onError);
  };
}

export async function updateGuideSection(
  sectionId: string,
  data: Partial<Omit<GuideSection, 'id'>>,
): Promise<void> {
  const docRef = doc(freshmanGuideCollection(), sectionId);
  await setDoc(docRef, data, { merge: true });
}

export async function savePackingList(
  userId: string,
  packingListData: PackingListData,
): Promise<boolean> {
  try {
    await setDoc(
      userPackingDoc(userId),
      { ...packingListData, lastUpdated: new Date().toISOString() },
      { merge: true },
    );
    return true;
  } catch (e) {
    console.error('Error saving packing list:', e);
    return false;
  }
}

export async function updateCheckedItems(
  userId: string,
  checkedItems: CheckedItems,
): Promise<boolean> {
  try {
    await setDoc(
      userPackingDoc(userId),
      { checkedItems, lastUpdated: new Date().toISOString() },
      { merge: true },
    );
    return true;
  } catch (e) {
    console.error('Error updating checked items:', e);
    return false;
  }
}

export async function loadPackingList(userId: string): Promise<PackingListData | null> {
  try {
    return new Promise((resolve) => {
      const unsub = onSnapshot(
        userPackingDoc(userId),
        (snapshot) => {
          unsub();
          resolve(snapshot.exists() ? (snapshot.data() as PackingListData) : null);
        },
        () => {
          unsub();
          resolve(null);
        },
      );
    });
  } catch (e) {
    console.error('Error loading packing list:', e);
    return null;
  }
}

export function subscribePackingList(
  userId: string,
  onData: (data: PackingListData | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userPackingDoc(userId),
    (snapshot) => {
      onData(snapshot.exists() ? (snapshot.data() as PackingListData) : null);
    },
    (err) => onError(err),
  );
}

export async function deletePackingList(userId: string): Promise<boolean> {
  try {
    await deleteDoc(userPackingDoc(userId));
    return true;
  } catch (e) {
    console.error('Error deleting packing list:', e);
    return false;
  }
}
