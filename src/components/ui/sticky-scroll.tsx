'use client';
import { forwardRef } from 'react';
import { type GalleryPhoto } from '../../services/firebase';

interface StickyScrollProps {
  photos?: GalleryPhoto[];
  onPhotoClick?: (photo: GalleryPhoto) => void;
}

const defaultCol1 = [
  { imageUrl: 'https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=500&auto=format&fit=crop', caption: 'Sunset Valley' },
  { imageUrl: 'https://images.unsplash.com/photo-1715432362539-6ab2ab480db2?w=500&auto=format&fit=crop', caption: 'Lush green campus' },
  { imageUrl: 'https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=500&auto=format&fit=crop', caption: 'Modern architecture' },
  { imageUrl: 'https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=500&auto=format&fit=crop', caption: 'Tech labs' },
  { imageUrl: 'https://images.unsplash.com/photo-1719411182379-ffd97c1f7ebf?w=500&auto=format&fit=crop', caption: 'Library study space' }
];

const defaultCol2 = [
  { imageUrl: 'https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=500&auto=format&fit=crop', caption: 'Clock tower' },
  { imageUrl: 'https://images.unsplash.com/photo-1476180814856-a36609db0493?w=500&auto=format&fit=crop', caption: 'Sports field' },
  { imageUrl: 'https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=500&auto=format&fit=crop', caption: 'Hostel corridor' }
];

const defaultCol3 = [
  { imageUrl: 'https://images.unsplash.com/photo-1719547907790-f661a88302c2?w=500&auto=format&fit=crop', caption: 'Cafeteria vibes' },
  { imageUrl: 'https://images.unsplash.com/photo-1599054799131-4b09c73a63cf?w=500&auto=format&fit=crop', caption: 'GIKI gate' },
  { imageUrl: 'https://images.unsplash.com/photo-1719963532023-01b573d1d584?w=500&auto=format&fit=crop', caption: 'Auditorium design' },
  { imageUrl: 'https://images.unsplash.com/photo-1714328101501-3594de6cb80f?w=500&auto=format&fit=crop', caption: 'Evening sky' },
  { imageUrl: 'https://images.unsplash.com/photo-1719554873571-0fd6bf322bb1?w=500&auto=format&fit=crop', caption: 'Main pathway' }
];

const Component = forwardRef<HTMLElement, StickyScrollProps>(({ photos = [], onPhotoClick }, ref) => {
  // Distribute photos to columns. If not enough photos, we fill the rest from defaults.
  const col1Items: any[] = [];
  const col2Items: any[] = [];
  const col3Items: any[] = [];

  for (let i = 0; i < 5; i++) {
    if (photos[i]) {
      col1Items.push(photos[i]);
    } else {
      col1Items.push(defaultCol1[i]);
    }
  }

  for (let i = 0; i < 3; i++) {
    if (photos[5 + i]) {
      col2Items.push(photos[5 + i]);
    } else {
      col2Items.push(defaultCol2[i]);
    }
  }

  for (let i = 0; i < 5; i++) {
    if (photos[8 + i]) {
      col3Items.push(photos[8 + i]);
    } else {
      col3Items.push(defaultCol3[i]);
    }
  }

  const handleItemClick = (item: any) => {
    // If it's a real GalleryPhoto, call the handler
    if (item.fullSizeUrl || item.imageUrl) {
      const photoObj: GalleryPhoto = {
        imageUrl: item.imageUrl || item.fullSizeUrl,
        fullSizeUrl: item.fullSizeUrl || item.imageUrl,
        caption: item.caption || '',
        category: item.category || 'General',
        ...item
      };
      if (onPhotoClick) onPhotoClick(photoObj);
    }
  };

  return (
    <main className='bg-transparent' ref={ref}>
      <section className='text-white h-screen w-full bg-[#0A1931]/60 backdrop-blur-xs grid place-content-center sticky top-0 z-0'>
        <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>

        <div className="text-center max-w-2xl mx-auto px-6 relative z-10">
          <h1 className="text-5xl sm:text-7xl font-bold font-serif mb-4 tracking-tight hero-title text-shadow-md">
            Campus <span className="text-[#B3CFE5]">Gallery</span>
          </h1>
          <p className="text-[#B3CFE5] text-base sm:text-lg leading-relaxed mb-8">
            Explore and upload visual snapshots from across the GIKI valley.
          </p>
          <div className="text-white/40 text-sm font-semibold tracking-wider animate-bounce flex flex-col items-center gap-1">
            <span>Scroll down</span>
            <span>👇</span>
          </div>
        </div>
      </section>

      <section className='text-white w-full bg-[#0A1931]/90 backdrop-blur-md px-4 md:px-8 py-12 relative z-10 border-t border-white/5'>
        <div className='grid grid-cols-12 gap-4 max-w-7xl mx-auto'>
          {/* Column 1 */}
          <div className='grid gap-4 col-span-12 md:col-span-4'>
            {col1Items.map((item, idx) => (
              <figure key={`col1-${idx}`} className='w-full cursor-pointer overflow-hidden rounded-md group relative' onClick={() => handleItemClick(item)}>
                <img
                  src={item.imageUrl}
                  alt={item.caption || ''}
                  className='transition-all duration-300 w-full h-96 align-bottom object-cover group-hover:scale-105'
                />
                {item.caption && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-semibold">{item.caption}</p>
                  </div>
                )}
              </figure>
            ))}
          </div>

          {/* Column 2 (Sticky on medium screens and up) */}
          <div className='col-span-12 md:col-span-4 md:sticky md:top-24 h-fit grid gap-4'>
            {col2Items.map((item, idx) => (
              <figure key={`col2-${idx}`} className='w-full h-80 md:h-[calc((100vh-160px)/3)] cursor-pointer overflow-hidden rounded-md group relative' onClick={() => handleItemClick(item)}>
                <img
                  src={item.imageUrl}
                  alt={item.caption || ''}
                  className='transition-all duration-300 h-full w-full align-bottom object-cover group-hover:scale-105'
                />
                {item.caption && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-semibold">{item.caption}</p>
                  </div>
                )}
              </figure>
            ))}
          </div>

          {/* Column 3 */}
          <div className='grid gap-4 col-span-12 md:col-span-4'>
            {col3Items.map((item, idx) => (
              <figure key={`col3-${idx}`} className='w-full cursor-pointer overflow-hidden rounded-md group relative' onClick={() => handleItemClick(item)}>
                <img
                  src={item.imageUrl}
                  alt={item.caption || ''}
                  className='transition-all duration-300 w-full h-96 align-bottom object-cover group-hover:scale-105'
                />
                {item.caption && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-semibold">{item.caption}</p>
                  </div>
                )}
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
});

Component.displayName = 'Component';

export default Component;
