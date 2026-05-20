import { useState, useEffect, useRef } from 'react';
import { photosData } from '../data/photosData';

// Fallback grid of photos from all 4 days if no real photos are processed yet
const fallbackGridPhotos = [
  '/photos/day1/bigben.jpg',
  '/photos/day2/camden.jpg',
  '/photos/day3/towerbridge.jpg',
  '/photos/day4/harrods.jpg',
  '/photos/day1/londoneye.jpg',
  '/photos/day2/abbeyroad.jpg',
  '/photos/day3/stpaul.jpg',
  '/photos/day4/mms.jpg',
  '/photos/day1/hydepark.jpg',
  '/photos/day2/littlevenice.jpg',
  '/photos/day3/greenwich.jpg',
  '/photos/day4/chinatowncomida.jpg',
  '/photos/day1/westminster.jpg',
  '/photos/day2/stpancras.jpg',
  '/photos/day3/canarywharf.jpg',
  '/photos/day4/paseo.jpg',
  '/photos/day1/coventgarden.jpg',
  '/photos/day2/naturalmuseum.jpg',
  '/photos/day3/noche.jpg',
  '/photos/day1/picadilly.jpg',
];

export default function Hero() {
  // 1. Gather all real uploaded photos dynamically across all days
  const getPoolPhotos = () => {
    const allPhotos = [];
    [1, 2, 3, 4].forEach((day) => {
      const dayMedia = photosData && photosData[day];
      if (dayMedia) {
        if (dayMedia.general) {
          allPhotos.push(...dayMedia.general);
        }
        if (dayMedia.stops) {
          Object.values(dayMedia.stops).forEach((stopMedia) => {
            allPhotos.push(...stopMedia);
          });
        }
      }
    });

    // Exclude videos from background grid to keep performance lightning fast
    const imageSrcs = allPhotos
      .filter((photo) => photo.type === 'image')
      .map((photo) => photo.src);

    return imageSrcs.length >= 5 ? imageSrcs : fallbackGridPhotos;
  };

  const pool = getPoolPhotos();

  const [gridPhotos, setGridPhotos] = useState(() => {
    return Array.from({ length: 20 }, () => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      return pool[randomIndex];
    });
  });
  const [fadingIndex, setFadingIndex] = useState(null);
  const timeoutRef = useRef(null);

  // Centralized Master Scheduler to change exactly ONE photo at a time
  useEffect(() => {
    if (gridPhotos.length === 0 || pool.length <= 1) return;

    const scheduleNextChange = () => {
      // Pick a peaceful delay between 6000ms and 10000ms for a very calm breathing ripple
      const randomInterval = Math.floor(Math.random() * 4000) + 6000;

      timeoutRef.current = setTimeout(() => {
        // 1. Choose a random cell index in the 20-photo grid
        const targetIndex = Math.floor(Math.random() * gridPhotos.length);

        // 2. Start smooth fade-out for this target cell
        setFadingIndex(targetIndex);

        // 3. After fade-out finishes (400ms), change photo source and fade-in
        setTimeout(() => {
          setGridPhotos((currentGrid) => {
            const nextGrid = [...currentGrid];
            const currentSrc = nextGrid[targetIndex];

            // Select a new photo from the pool that is not currently shown in this specific cell
            const choices = pool.filter((item) => item !== currentSrc);
            if (choices.length > 0) {
              const randomIndex = Math.floor(Math.random() * choices.length);
              nextGrid[targetIndex] = choices[randomIndex];
            }
            return nextGrid;
          });

          // End fade-out (fades back in)
          setFadingIndex(null);

          // Recursively schedule the next single cell transition
          scheduleNextChange();
        }, 400);

      }, randomInterval);
    };

    scheduleNextChange();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [gridPhotos, pool]);

  return (
    <section className="hero" id="hero">
      {/* Background photo grid */}
      <div className="hero-grid">
        {gridPhotos.map((src, i) => (
          <div key={i} className="hero-grid__cell">
            <img
              src={src}
              alt=""
              className={fadingIndex === i ? 'is-fading' : ''}
              loading="eager"
              onError={(e) => {
                // If there's ever a loading error, show fallback photo safely
                e.target.src = fallbackGridPhotos[i % fallbackGridPhotos.length];
              }}
            />
          </div>
        ))}
      </div>

      {/* Frosted glass overlay card */}
      <div className="hero__content">
        <h1 className="hero__title">London '26</h1>
      </div>


    </section>
  );
}
