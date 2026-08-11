import IntroAnimation from '../components/hero/IntroAnimation';
import MobileHome from '../components/hero/MobileHome';
import { useIsMobile } from '../hooks/useMediaQuery';
import FeatureSection from '../components/feature/FeatureSection';
import Footer from '../components/nav/Footer';

export const Home = () => {
  const isMobile = useIsMobile();

  return (
    <main className="relative z-10 w-full bg-[#08080a] text-white">
      {/* Hero / Animations */}
      <div className="relative h-[100dvh] w-full">
        {isMobile ? <MobileHome /> : <IntroAnimation />}
      </div>
      
      {/* Full-Width Feature Sections */}
      <div className="relative z-20 bg-[#08080a]">
        <FeatureSection />
      </div>

      {/* Footer */}
      <div className="relative z-20">
        <Footer />
      </div>
    </main>
  );
};
