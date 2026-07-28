import IntroAnimation from '../components/hero/IntroAnimation';
import MobileHome from '../components/hero/MobileHome';
import { useIsMobile } from '../hooks/useMediaQuery';

export const Home = () => {
  const isMobile = useIsMobile();

  return (
    <main className="relative z-10 h-[100dvh]">
      {isMobile ? <MobileHome /> : <IntroAnimation />}
    </main>
  );
};
