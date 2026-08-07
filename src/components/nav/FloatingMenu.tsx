import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/firebase';

const ease = [0.22, 1, 0.36, 1] as const;

interface MenuItem {
  label: string;
  path?: string;
  onClick?: () => void;
}

function MenuButton({
  label,
  onClick,
  isOpen,
  index,
}: {
  label: string;
  onClick?: () => void;
  isOpen: boolean;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const animatingRef = useRef(false);
  const pendingLeaveRef = useRef(false);
  const chars = label.split('');
  const lockDuration = 30 * chars.length + 300;

  const handleEnter = useCallback(() => {
    pendingLeaveRef.current = false;
    if (hovered) return;
    setHovered(true);
    animatingRef.current = true;
    setTimeout(() => {
      animatingRef.current = false;
      if (pendingLeaveRef.current) {
        pendingLeaveRef.current = false;
        setHovered(false);
      }
    }, lockDuration);
  }, [hovered, lockDuration]);

  const handleLeave = useCallback(() => {
    if (animatingRef.current) {
      pendingLeaveRef.current = true;
    } else {
      setHovered(false);
    }
  }, []);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="text-primary-foreground text-[18px] sm:text-[22px] uppercase leading-none overflow-hidden tracking-widest font-light"
      style={{ height: '1em' }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{
        duration: 0.4,
        delay: isOpen ? 0.4 + 0.08 * index : 0,
        ease,
      }}
    >
      <div className="flex justify-center">
        {chars.map((char, i) => (
          <span key={i} className="inline-block overflow-hidden" style={{ height: '1em' }}>
            <span
              className="flex flex-col"
              style={{
                transitionProperty: 'transform',
                transitionDuration: hovered ? '800ms' : '0ms',
                transitionDelay: hovered ? `${30 * i}ms` : '0ms',
                transform: hovered ? 'translateY(-50%)' : 'translateY(0%)',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <span className="block" style={{ height: '1em', lineHeight: '1em' }}>
                {char}
              </span>
              <span className="block" style={{ height: '1em', lineHeight: '1em' }} aria-hidden>
                {char}
              </span>
            </span>
          </span>
        ))}
      </div>
    </motion.button>
  );
}

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const isCms =
    profile?.isAdmin ||
    profile?.role === 'admin' ||
    profile?.role === 'editor' ||
    profile?.role === 'moderator';

  const go = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const menuItems: MenuItem[] = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Guide', path: '/guide' },
    { label: 'Blog', path: '/browse' },
    { label: 'Map', path: '/map' },
    { label: 'Contact', path: '/contact' },
    ...(user
      ? [
          { label: 'Profile', path: '/profile' },
          { label: 'Write', path: '/write' },
          ...(isCms ? [{ label: 'CMS', path: '/cms' }] : []),
          {
            label: 'Logout',
            onClick: async () => {
              setIsOpen(false);
              await logoutUser();
              navigate('/');
            },
          },
        ]
      : [
          { label: 'Login', path: '/login' },
        ]),
  ];

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const openHeight = Math.min(48 + menuItems.length * 52 + 24, 520);

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-10 left-1/2 z-[100]"
      style={{ x: '-50%', pointerEvents: 'auto' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <motion.div
        className="relative overflow-hidden flex flex-col border border-border/50"
        onClick={() => {
          if (!isOpen) setIsOpen(true);
        }}
        style={{
          letterSpacing: '-0.02em',
          cursor: isOpen ? 'default' : 'pointer',
        }}
        animate={{
          width: isOpen ? 280 : 150,
          height: isOpen ? openHeight : 48,
          borderRadius: isOpen ? 32 : 72,
          scale: 1,
        }}
        whileHover={isOpen ? undefined : { scale: 1.05 }}
        transition={{
          duration: 0.8,
          ease,
          height: { duration: isOpen ? 0.8 : 0.15 },
          scale: { duration: 0.25, ease },
        }}
      >
        <motion.div
          className="absolute inset-0 bg-muted border border-border"
          animate={{
            borderColor: isOpen ? 'transparent' : 'var(--color-border)',
          }}
          transition={{ duration: isOpen ? 0.1 : 0.3, ease }}
          style={{
            borderRadius: 'inherit',
          }}
        />

        <motion.div
          className="absolute left-1/2 bg-primary"
          style={{
            width: '200%',
            height: '200%',
            borderRadius: '50%',
            x: '-50%',
          }}
          animate={{ bottom: isOpen ? '-20%' : '-200%' }}
          transition={{
            duration: 0.8,
            ease,
            delay: isOpen ? 0.1 : 0,
          }}
        />

        <div
          className="relative z-10 flex flex-col gap-5 items-center justify-center py-2"
          style={{
            pointerEvents: isOpen ? 'auto' : 'none',
            opacity: isOpen ? 1 : 0,
            flex: isOpen ? 1 : 0,
            overflow: 'hidden',
          }}
        >
          {menuItems.map((item, idx) => (
            <MenuButton
              key={item.label}
              label={item.label}
              onClick={() => (item.onClick ? item.onClick() : item.path && go(item.path))}
              isOpen={isOpen}
              index={idx}
            />
          ))}
        </div>

        <motion.div
          className="absolute inset-x-0 bottom-0 z-10 flex h-12 items-center justify-between px-5"
          onClick={() => setIsOpen(!isOpen)}
          animate={{
            paddingLeft: isOpen ? 24 : 20,
            paddingRight: isOpen ? 24 : 20,
            paddingBottom: isOpen ? 24 : 0,
            height: 48,
          }}
          transition={{ duration: 0.8, ease }}
          style={{ alignItems: 'center' }}
        >
          <motion.span
            className="text-[12px] md:text-[14px] leading-none uppercase tracking-[0.2em] font-medium"
            animate={{ color: isOpen ? '#0a0a0a' : '#fafafa' }}
            transition={{ duration: 0.3, ease }}
          >
            Menu
          </motion.span>

          <div className="relative w-[24px] h-[24px] flex items-center justify-center">
            <motion.span
              className="absolute block w-[18px] h-[2px] rounded-full"
              animate={{
                rotate: isOpen ? 45 : 0,
                y: isOpen ? 0 : -3,
                backgroundColor: isOpen ? '#0a0a0a' : '#fafafa',
              }}
              transition={{ duration: 0.4, ease }}
            />
            <motion.span
              className="absolute block w-[18px] h-[2px] rounded-full"
              animate={{
                rotate: isOpen ? -45 : 0,
                y: isOpen ? 0 : 3,
                backgroundColor: isOpen ? '#0a0a0a' : '#fafafa',
              }}
              transition={{ duration: 0.4, ease }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
