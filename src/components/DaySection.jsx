import { useEffect, useRef } from 'react';
import RouteMap from './RouteMap';
import PhotoGallery from './PhotoGallery';
import { photosData } from '../data/photosData';

export default function DaySection({ dayData }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const reveals = sectionRef.current?.querySelectorAll('.reveal');
    reveals?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Get the raw accent color for Leaflet markers (can't use CSS vars there)
  const accentColors = {
    1: '#aa1fafff',
    2: '#2F4156',
    3: '#0f2c0b',
    4: '#701364ff',
  };

  // Get all photos for this day (both root files and inside subfolders)
  const getDayPhotos = () => {
    const dayMedia = photosData && photosData[dayData.day];
    if (!dayMedia) return dayData.photos;

    const list = [];
    if (dayMedia.general) {
      list.push(...dayMedia.general);
    }
    if (dayMedia.stops) {
      Object.values(dayMedia.stops).forEach((stopMedia) => {
        list.push(...stopMedia);
      });
    }

    return list.length > 0 ? list : dayData.photos;
  };

  const displayPhotos = getDayPhotos();

  return (
    <section
      className="day-section"
      id={`day-${dayData.day}`}
      ref={sectionRef}
      style={{ background: dayData.bg }}
    >
      <div className="day-section__container">
        {/* Day Header */}
        <div className="day-header reveal">
          <div className="day-header__number">DÍA {dayData.day}</div>
          <div className="day-header__date-line" style={{ color: dayData.accentDark }}>
            <span 
              className="day-header__date-text" 
              style={{ 
                backgroundColor: dayData.bg,
                color: dayData.accentDark 
              }}
            >
              {dayData.weekday} · {dayData.date}
            </span>
          </div>
          <h2 className="day-header__title">{dayData.title}</h2>
          <p className="day-header__subtitle">{dayData.subtitle}</p>
          <p className="day-header__description">{dayData.description}</p>
        </div>

        {/* Route Map */}
        <div className="reveal reveal-delay-1">
          <RouteMap
            places={dayData.places}
            accent={accentColors[dayData.day]}
            bg={dayData.bg}
            dayNum={dayData.day}
          />
        </div>

        {/* Photo Gallery */}
        <div className="reveal reveal-delay-2">
          <PhotoGallery 
            dayNum={dayData.day}
            places={dayData.places}
            dayAccent={dayData.accentDark} 
          />
        </div>
      </div>
    </section>
  );
}
