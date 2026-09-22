import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
  updateDoc,
  limit,
} from 'firebase/firestore';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { db, type AppNotification, type NotificationType } from '../../services/firebase';

function toastForType(type: NotificationType, message: string) {
  switch (type) {
    case 'ARTICLE_PUBLISHED':
      toast.success(message || 'Your article is now live on GIKI Chronicles!');
      break;
    case 'FEEDBACK_RECEIVED':
      toast.message(message || 'You received editorial feedback.');
      break;
    case 'ARTICLE_REJECTED':
      toast.error(message || 'Your article was not approved.');
      break;
    case 'ARTICLE_ALLOTTED':
    case 'ARTICLE_RESUBMITTED':
      toast.message(message);
      break;
    default:
      toast(message);
  }
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      primed.current = false;
      seenIds.current = new Set();
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(40),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as AppNotification),
        );
        setItems(next);

        if (!primed.current) {
          next.forEach((n) => n.id && seenIds.current.add(n.id));
          primed.current = true;
          return;
        }

        next.forEach((n) => {
          if (!n.id || seenIds.current.has(n.id)) return;
          seenIds.current.add(n.id);
          if (!n.isRead) toastForType(n.type, n.message);
        });
      },
      (err) => {
        console.error('Notification listener error:', err);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  const unread = items.filter((n) => !n.isRead).length;

  const markRead = async (n: AppNotification) => {
    if (!n.id || n.isRead) return;
    try {
      await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  const openNotification = async (n: AppNotification) => {
    await markRead(n);
    setOpen(false);
    if (n.type === 'ARTICLE_ALLOTTED' || n.type === 'ARTICLE_RESUBMITTED') {
      navigate(`/editor/review/${n.postId}`);
    } else if (n.type === 'ARTICLE_PUBLISHED') {
      navigate(`/posts/${n.postId}`);
    } else if (n.type === 'FEEDBACK_RECEIVED' || n.type === 'ARTICLE_REJECTED') {
      navigate(`/write?edit=${n.postId}`);
    }
  };

  return (
    <div ref={rootRef} className="fixed top-5 right-5 z-[90]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-11 w-11 rounded-full border border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-center text-foreground hover:border-primary/50 transition"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,360px)] max-h-[70vh] overflow-y-auto rounded-2xl border border-border/50 bg-card/95 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/95">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                onClick={() => {
                  void Promise.all(items.filter((n) => !n.isRead).map(markRead));
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border/30">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void openNotification(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-secondary/40 transition ${
                      n.isRead ? 'opacity-70' : ''
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      {n.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.postTitle}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border/40 px-4 py-3">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Open profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
