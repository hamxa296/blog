import { useLocation, useNavigate } from 'react-router-dom';

export default function GlobalBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show the back button on the homepage
  if (location.pathname === '/') {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className="fixed left-4 top-4 sm:left-6 sm:top-6 z-50 flex size-10 items-center justify-center rounded-full bg-black/5 text-black backdrop-blur-md transition-transform hover:scale-110 hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 shadow-sm border border-black/10 dark:border-white/10"
      aria-label="Go back"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
