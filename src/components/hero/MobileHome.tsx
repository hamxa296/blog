import newerBg from '@/assets/mobbg.webp';
import FeatureSection from '../feature/FeatureSection';


export default function MobileHome() {
  return (
    <div className="w-full min-h-[100dvh] overflow-y-auto bg-[#08080a] text-white">
      {/* Hero Banner Section */}
      <div
        className="relative h-[100dvh] w-full overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${newerBg})` }}
      >
        <div className="absolute inset-0 bg-black/35" aria-hidden />
      </div>


      {/* Mobile Feature Landing Showcase */}
      <FeatureSection />
    </div>
  );
}

