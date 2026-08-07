"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

interface ProfileCardProps {
  name?: string;
  title?: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  likes?: number;
  posts?: number;
  views?: number;
  instagramUrl?: string;
  twitterUrl?: string;
  threadsUrl?: string;
  badgeName?: string;
  onEdit?: () => void;
  editLabel?: string;
}

export function ProfileCard({
  name = "Bhomik Chauhan",
  title = "Product Designer who focuses on simplicity & usability.",
  avatarUrl = "https://i.ibb.co/Kc3MTRNm/caarton-character.png",
  backgroundUrl = "https://i.ibb.co/nHk8jc8/cloud-image.jpg",
  likes = 72900,
  posts = 828,
  views = 342900,
  instagramUrl,
  twitterUrl,
  threadsUrl,
  badgeName = "Novice",
  onEdit,
  editLabel = "Edit",
}: ProfileCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [showBadgeInfo, setShowBadgeInfo] = useState(false);


  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5">
        <div className="relative h-48 bg-gradient-to-br from-sky-start/80 to-sky-end/80 overflow-hidden">
          <img
            src={backgroundUrl || "/placeholder.svg"}
            alt="Background"
            className="w-full h-full object-cover opacity-60"
          />

          <button
            type="button"
            onClick={() => (onEdit ? onEdit() : setIsFollowing(!isFollowing))}
            className={`absolute top-4 right-4 rounded-full px-5 py-2 text-sm font-semibold backdrop-blur-md transition-all duration-300 ${
              onEdit || isFollowing
                ? "bg-black/30 text-white border border-white/20 hover:bg-black/50"
                : "bg-white/20 text-white hover:bg-white/30 border border-white/20"
            }`}
          >
            {onEdit ? editLabel : isFollowing ? "Following" : "Follow"}
            <span className="ml-2 text-lg">
              {onEdit ? "✎" : isFollowing ? "✓" : "+"}
            </span>
          </button>
        </div>

        <div className="px-6 pb-6 -mt-16 relative z-10">
          <div className="relative w-28 h-28 mb-4">
            <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-card shadow-xl">
              <img
                src={avatarUrl || "/placeholder.svg"}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 bg-secondary/50 border border-border/50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-secondary/70 transition-colors" onClick={() => setShowBadgeInfo(true)}>
              <span className="w-2 h-2 rounded-full bg-sky-start shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
              <span className="text-sm text-foreground font-semibold tracking-wide">
                {badgeName}
              </span>
            </div>
            <button 
              type="button"
              onClick={() => setShowBadgeInfo(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Badge Information"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
            {name}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
            {title}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 py-5 border-t border-b border-border/50 bg-secondary/10 rounded-2xl">
            <div className="text-center group relative cursor-help">
              <div className="text-2xl font-semibold font-sans tracking-tight mb-1 transition-transform group-hover:scale-110 group-hover:text-sky-start text-card-foreground">
                {formatNumber(likes)}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Likes
              </div>
            </div>
            <div className="text-center border-l border-r border-border group relative cursor-help">
              <div className="text-2xl font-semibold font-sans tracking-tight mb-1 transition-transform group-hover:scale-110 group-hover:text-sky-start text-card-foreground">
                {formatNumber(posts)}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Posts
              </div>
            </div>
            <div className="text-center group relative cursor-help">
              <div className="text-2xl font-semibold font-sans tracking-tight mb-1 transition-transform group-hover:scale-110 group-hover:text-sky-start text-card-foreground">
                {formatNumber(views)}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Views
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-8">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Instagram Profile"
              >
                <InstagramIcon className="w-5 h-5 text-card-foreground" />
              </a>
            )}
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Twitter Profile"
              >
                <TwitterIcon className="w-5 h-5 text-card-foreground" />
              </a>
            )}
            {threadsUrl && (
              <a
                href={threadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Threads Profile"
              >
                <svg
                  className="w-5 h-5 text-card-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {showBadgeInfo && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[9999]">
          <div className="w-full max-w-sm rounded-[2rem] p-6 border border-border bg-card shadow-2xl relative">
            <button 
              onClick={() => setShowBadgeInfo(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-2">Creator Badges</h3>
            <p className="text-sm text-muted-foreground mb-6">Earn points through your activity to level up your profile badge.</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                  <span className="font-semibold text-sm text-muted-foreground">Novice</span>
                </div>
                <span className="text-xs text-muted-foreground">0 pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="font-semibold text-sm">Contributor</span>
                </div>
                <span className="text-xs text-muted-foreground">100 pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span className="font-semibold text-sm text-purple-400">Creator</span>
                </div>
                <span className="text-xs text-muted-foreground">500 pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></span>
                  <span className="font-semibold text-sm text-yellow-400">Luminary</span>
                </div>
                <span className="text-xs text-muted-foreground">2,000 pts</span>
              </div>
            </div>

            <div className="bg-secondary/20 p-4 rounded-xl text-xs text-muted-foreground">
              <span className="font-semibold text-foreground mb-1 block">How to earn points:</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Write a post: <strong className="text-foreground">100 pts</strong></li>
                <li>Receive a like: <strong className="text-foreground">10 pts</strong></li>
                <li>Receive a view: <strong className="text-foreground">1 pt</strong></li>
              </ul>
            </div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}
