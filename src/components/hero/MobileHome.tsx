import newerBg from '@/assets/mobbg.webp';



export default function MobileHome() {
  return (
    <div className="w-full min-h-[100dvh] overflow-y-auto bg-[#08080a] text-white">
      {/* Hero Banner Section */}
      <div
        className="relative h-[100dvh] w-full overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${newerBg})` }}
      >
        
      </div>

    </div>
  );
}
