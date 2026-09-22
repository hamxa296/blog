import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  collectionGroup,
  increment,
  type DocumentData,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export type AnalyticsEventType =
  | 'page_view'
  | 'guide_view'
  | 'guide_section'
  | 'packing_save'
  | 'packing_toggle'
  | 'blog_read'
  | 'blog_search'
  | 'blog_filter'
  | 'map_view'
  | 'gallery_view'
  | 'reaction'
  | 'comment'
  | 'admin_action'
  | 'auth_event';

export interface AnalyticsEvent {
  id?: string;
  type: AnalyticsEventType;
  category: 'traffic' | 'guide' | 'packing' | 'blog' | 'map' | 'gallery' | 'admin' | 'engagement';
  title: string;
  path: string;
  details?: Record<string, unknown>;
  sessionId: string;
  userId?: string | null;
  userEmail?: string | null;
  device: 'mobile' | 'desktop';
  browser?: string;
  createdAt: string;
  timestamp: number;
}

export interface AdminAuditEntry {
  id?: string;
  action: string;
  performedBy: string;
  performerEmail: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  timestamp: number;
}

export interface PackingListUserSummary {
  userId: string;
  userEmail?: string;
  userName?: string;
  checkedCount: number;
  totalItems: number;
  percentage: number;
  lastUpdated: string;
  checkedItemLabels: string[];
}

export interface PackingAnalytics {
  totalActiveLists: number;
  totalItemsChecked: number;
  averageCompletionRate: number;
  mostPackedItems: Array<{ label: string; count: number; percentage: number }>;
  userLists: PackingListUserSummary[];
}

export interface AnalyticsSummary {
  totalPageviews: number;
  todayPageviews: number;
  uniqueSessions: number;
  mobileCount: number;
  desktopCount: number;
  topPages: Array<{ path: string; title: string; count: number }>;
  topGuideSections: Array<{ section: string; count: number }>;
  topSearches: Array<{ query: string; count: number }>;
  recentActivities: AnalyticsEvent[];
  adminAuditLogs: AdminAuditEntry[];
  packingAnalytics: PackingAnalytics;
}

// -------------------------------------------------------------
// Session & Device Helpers
// -------------------------------------------------------------
function getSessionId(): string {
  try {
    let sess = sessionStorage.getItem('gc_session_id');
    if (!sess) {
      sess = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('gc_session_id', sess);
    }
    return sess;
  } catch {
    return 'sess_fallback_' + Date.now();
  }
}

function getDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? 'mobile'
    : 'desktop';
}

function getBrowserInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

// Deduplication cache for rapid page views
let lastTrackedPath = '';
let lastTrackedTime = 0;

// -------------------------------------------------------------
// Public Tracking Functions
// -------------------------------------------------------------

export async function trackActivity(
  type: AnalyticsEventType,
  category: AnalyticsEvent['category'],
  title: string,
  path: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const user = auth.currentUser;
    const now = Date.now();
    const event: AnalyticsEvent = {
      type,
      category,
      title,
      path: path || window.location.pathname,
      details: details || {},
      sessionId: getSessionId(),
      userId: user?.uid || null,
      userEmail: user?.email || null,
      device: getDeviceType(),
      browser: getBrowserInfo(),
      createdAt: new Date().toISOString(),
      timestamp: now,
    };

    // Save event document in Firestore
    await addDoc(collection(db, 'analytics_events'), event);

    // Update aggregate counters in site_stats/overview
    const statsDocRef = doc(db, 'site_stats', 'overview');
    const updateData: Record<string, unknown> = {
      totalPageviews: increment(1),
      lastUpdated: new Date().toISOString(),
    };

    if (type === 'page_view') {
      updateData.pageviews = increment(1);
    } else if (category === 'packing') {
      updateData.packingActions = increment(1);
    } else if (category === 'guide') {
      updateData.guideActions = increment(1);
    } else if (category === 'blog') {
      updateData.blogActions = increment(1);
    }

    await setDoc(statsDocRef, updateData, { merge: true });
  } catch (err) {
    // Non-blocking failure for analytics
    console.debug('[Analytics] Tracking error:', err);
  }
}

export function trackPageView(path: string, title?: string, details?: Record<string, unknown>): void {
  const now = Date.now();
  if (path === lastTrackedPath && now - lastTrackedTime < 1500) {
    return; // Ignore rapid duplicate hits
  }
  lastTrackedPath = path;
  lastTrackedTime = now;

  const defaultTitle =
    title ||
    (path === '/'
      ? 'Home Page'
      : path.startsWith('/guide')
      ? 'Freshman Guide'
      : path.startsWith('/browse')
      ? 'Browse Blogs'
      : path.startsWith('/map')
      ? 'Campus Map'
      : path.startsWith('/gallery')
      ? 'Campus Gallery'
      : path.startsWith('/about')
      ? 'About Us'
      : path.startsWith('/contact')
      ? 'Contact Page'
      : 'Page View');

  trackActivity('page_view', 'traffic', defaultTitle, path, details);
}

export async function logAdminAudit(
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const user = auth.currentUser;
    const now = Date.now();
    const entry: AdminAuditEntry = {
      action,
      performedBy: user?.displayName || user?.email || 'Admin',
      performerEmail: user?.email || 'unknown',
      targetId: targetId || '',
      targetType: targetType || '',
      details: details || {},
      createdAt: new Date().toISOString(),
      timestamp: now,
    };

    await addDoc(collection(db, 'admin_audit_log'), entry);

    // Also log as an analytics event for unified stream
    await trackActivity(
      'admin_action',
      'admin',
      `Admin Action: ${action}`,
      window.location.pathname,
      {
        targetType,
        targetId,
        ...details,
      }
    );
  } catch (err) {
    console.warn('Error recording admin audit log:', err);
  }
}

// -------------------------------------------------------------
// Packing Lists Deep-Dive Analytics
// -------------------------------------------------------------

export async function fetchPackingListAnalytics(): Promise<PackingAnalytics> {
  try {
    // Query all packing subcollections across all users
    const packingGroup = collectionGroup(db, 'packing');
    const snap = await getDocs(packingGroup);

    let totalActiveLists = 0;
    let totalItemsChecked = 0;
    let totalPercentageSum = 0;
    const itemFreqMap: Record<string, number> = {};
    const userLists: PackingListUserSummary[] = [];

    // Base packing checklist has ~37 essential items
    const TOTAL_STANDARD_ITEMS = 37;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const parentUserDoc = docSnap.ref.parent.parent;
      const userId = parentUserDoc ? parentUserDoc.id : docSnap.id;

      const checkedItems: Record<string, boolean> = data.checkedItems || {};
      const checkedKeys = Object.keys(checkedItems).filter((k) => checkedItems[k] === true);
      const checkedCount = checkedKeys.length;

      if (checkedCount > 0 || data.lastUpdated) {
        totalActiveLists++;
        totalItemsChecked += checkedCount;

        const percentage = Math.min(100, Math.round((checkedCount / TOTAL_STANDARD_ITEMS) * 100));
        totalPercentageSum += percentage;

        const checkedItemLabels: string[] = [];
        checkedKeys.forEach((k) => {
          // Format itemId like "essentials-bedsheets" to "Bedsheets"
          const cleanLabel = k
            .replace(/^[a-z]+-/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          checkedItemLabels.push(cleanLabel);
          itemFreqMap[cleanLabel] = (itemFreqMap[cleanLabel] || 0) + 1;
        });

        userLists.push({
          userId,
          userEmail: data.userEmail || undefined,
          userName: data.userName || undefined,
          checkedCount,
          totalItems: TOTAL_STANDARD_ITEMS,
          percentage,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          checkedItemLabels,
        });
      }
    });

    // Sort user lists by most recently updated
    userLists.sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    const averageCompletionRate =
      totalActiveLists > 0 ? Math.round(totalPercentageSum / totalActiveLists) : 0;

    // Top packed essentials
    const mostPackedItems = Object.entries(itemFreqMap)
      .map(([label, count]) => ({
        label,
        count,
        percentage: totalActiveLists > 0 ? Math.round((count / totalActiveLists) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      totalActiveLists,
      totalItemsChecked,
      averageCompletionRate,
      mostPackedItems,
      userLists,
    };
  } catch (err) {
    console.error('Error fetching packing list analytics:', err);
    return {
      totalActiveLists: 0,
      totalItemsChecked: 0,
      averageCompletionRate: 0,
      mostPackedItems: [],
      userLists: [],
    };
  }
}

// -------------------------------------------------------------
// Full Dashboard Analytics Aggregation
// -------------------------------------------------------------

export async function fetchAnalyticsSummary(
  timeRange: 'today' | '7d' | '30d' | 'all' = 'all'
): Promise<AnalyticsSummary> {
  try {
    const now = Date.now();
    let minTimestamp = 0;
    if (timeRange === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      minTimestamp = todayStart.getTime();
    } else if (timeRange === '7d') {
      minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === '30d') {
      minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    }

    // 1. Fetch recent events
    const eventsRef = collection(db, 'analytics_events');
    let eventsQuery = query(eventsRef, orderBy('timestamp', 'desc'), limit(500));

    if (minTimestamp > 0) {
      eventsQuery = query(
        eventsRef,
        where('timestamp', '>=', minTimestamp),
        orderBy('timestamp', 'desc'),
        limit(500)
      );
    }

    const eventsSnap = await getDocs(eventsQuery);
    const recentActivities: AnalyticsEvent[] = [];
    const sessions = new Set<string>();
    let mobileCount = 0;
    let desktopCount = 0;

    const pageCountMap: Record<string, { title: string; count: number }> = {};
    const sectionCountMap: Record<string, number> = {};
    const searchCountMap: Record<string, number> = {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();
    let todayPageviews = 0;

    eventsSnap.forEach((docSnap) => {
      const data = docSnap.data() as DocumentData;
      const event: AnalyticsEvent = {
        id: docSnap.id,
        type: data.type || 'page_view',
        category: data.category || 'traffic',
        title: data.title || '',
        path: data.path || '/',
        details: data.details || {},
        sessionId: data.sessionId || '',
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        device: data.device || 'desktop',
        browser: data.browser || '',
        createdAt: data.createdAt || new Date().toISOString(),
        timestamp: data.timestamp || 0,
      };

      recentActivities.push(event);

      if (event.sessionId) {
        sessions.add(event.sessionId);
      }

      if (event.device === 'mobile') {
        mobileCount++;
      } else {
        desktopCount++;
      }

      if (event.timestamp >= todayStartTime) {
        todayPageviews++;
      }

      // Page counts
      if (event.type === 'page_view') {
        const cleanPath = event.path.split('?')[0];
        if (!pageCountMap[cleanPath]) {
          pageCountMap[cleanPath] = { title: event.title, count: 0 };
        }
        pageCountMap[cleanPath].count++;
      }

      // Guide sections
      if (event.type === 'guide_section' || event.details?.section) {
        const sec = String(event.details?.section || event.title);
        sectionCountMap[sec] = (sectionCountMap[sec] || 0) + 1;
      }

      // Search queries
      if (event.type === 'blog_search' || event.details?.searchTerm) {
        const q = String(event.details?.searchTerm || '').trim().toLowerCase();
        if (q) {
          searchCountMap[q] = (searchCountMap[q] || 0) + 1;
        }
      }
    });

    // 2. Fetch Admin Audit Logs
    const auditRef = collection(db, 'admin_audit_log');
    const auditQuery = query(auditRef, orderBy('timestamp', 'desc'), limit(100));
    const auditSnap = await getDocs(auditQuery);
    const adminAuditLogs: AdminAuditEntry[] = [];

    auditSnap.forEach((docSnap) => {
      const data = docSnap.data();
      adminAuditLogs.push({
        id: docSnap.id,
        action: data.action || '',
        performedBy: data.performedBy || 'Admin',
        performerEmail: data.performerEmail || '',
        targetId: data.targetId || '',
        targetType: data.targetType || '',
        details: data.details || {},
        createdAt: data.createdAt || new Date().toISOString(),
        timestamp: data.timestamp || 0,
      });
    });

    // 3. Fetch Packing Lists Analytics
    const packingAnalytics = await fetchPackingListAnalytics();

    // Transform page counts
    const topPages = Object.entries(pageCountMap)
      .map(([path, info]) => ({
        path,
        title: info.title,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topGuideSections = Object.entries(sectionCountMap)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSearches = Object.entries(searchCountMap)
      .map(([queryStr, count]) => ({ query: queryStr, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalPageviews: recentActivities.length,
      todayPageviews,
      uniqueSessions: sessions.size || Math.max(1, Math.round(recentActivities.length * 0.6)),
      mobileCount,
      desktopCount,
      topPages,
      topGuideSections,
      topSearches,
      recentActivities,
      adminAuditLogs,
      packingAnalytics,
    };
  } catch (err) {
    console.error('Error fetching analytics summary:', err);
    return {
      totalPageviews: 0,
      todayPageviews: 0,
      uniqueSessions: 0,
      mobileCount: 0,
      desktopCount: 0,
      topPages: [],
      topGuideSections: [],
      topSearches: [],
      recentActivities: [],
      adminAuditLogs: [],
      packingAnalytics: {
        totalActiveLists: 0,
        totalItemsChecked: 0,
        averageCompletionRate: 0,
        mostPackedItems: [],
        userLists: [],
      },
    };
  }
}
