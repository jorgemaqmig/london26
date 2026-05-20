import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { photosData } from '../data/photosData';

export default function PhotoGallery({ dayNum, places, dayAccent }) {
  const [activeAlbum, setActiveAlbum] = useState(null); // 'photos' or 'videos'
  const [activeMediaIndex, setActiveMediaIndex] = useState(null);

  // 1. Gather all bulk photos from the root of the day folder (Recuerdos)
  const dayMedia = photosData && photosData[dayNum];
  const generalPhotos = dayMedia && dayMedia.general ? dayMedia.general : [];

  // 2. Gather all videos from the stops.videos folder
  const displayVideos = dayMedia && dayMedia.stops && dayMedia.stops.videos ? dayMedia.stops.videos : [];

  // 3. Fallback for photos: If no general photos are present, use the default itinerary photos as Recuerdos
  const displayPhotos = generalPhotos.length > 0
    ? generalPhotos
    : places
      .map((p) => ({ src: p.photo, caption: p.name, type: 'image' }))
      .filter((p) => p.src);

  // Determine current active media pool
  const currentPool = activeAlbum === 'videos' ? displayVideos : displayPhotos;

  // Auto-scroll the active thumbnail into the center of the strip so it is always visible
  useEffect(() => {
    if (activeAlbum && activeMediaIndex !== null) {
      // Small timeout to allow the Portal and elements to fully mount in the DOM
      const timer = setTimeout(() => {
        const activeThumb = document.querySelectorAll('.lightbox__thumbnail-dot')[activeMediaIndex];
        if (activeThumb) {
          activeThumb.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeMediaIndex, activeAlbum]);

  const openLightbox = (albumType, index) => {
    setActiveAlbum(albumType);
    setActiveMediaIndex(index);
  };

  const closeLightbox = () => {
    setActiveAlbum(null);
    setActiveMediaIndex(null);
  };

  const navigate = (direction) => {
    setActiveMediaIndex((prev) => {
      if (prev === null) return null;
      let nextIndex = prev + direction;
      if (nextIndex < 0) nextIndex = currentPool.length - 1;
      if (nextIndex >= currentPool.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  };

  // The photos album cover image
  const coverImage = displayPhotos.length > 0 ? displayPhotos[0].src : null;

  return (
    <div className="gallery-section">
      <h3 className="gallery-section__title">
        <span className="gallery-section__title-icon"></span>
        Recuerdos del día
      </h3>

      <div className="gallery-card-container">
        {/* CARD 1: FOTOS */}
        {displayPhotos.length > 0 ? (
          <div
            className="gallery-card reveal"
            onClick={() => openLightbox('photos', 0)}
          >
            <div className="gallery-card__image-container">
              <img
                src={coverImage}
                alt="Fotos del día"
                className="gallery-card__image"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="gallery-card__overlay-gradient" />
            </div>

            <div className="gallery-card__content">
              <div className="gallery-card__text">
                <h4 className="gallery-card__title">Fotos</h4>
                <p className="gallery-card__subtitle">Haz clic para abrir el álbum de fotos</p>
              </div>
              <span className="gallery-card__badge" style={{ backgroundColor: dayAccent }}>
                {displayPhotos.length} {displayPhotos.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>
          </div>
        ) : (
          <div className="gallery-card gallery-card--empty reveal">
            <div className="gallery-card__image-container" style={{ background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem', opacity: 0.25 }}>📸</span>
            </div>
            <div className="gallery-card__content">
              <div className="gallery-card__text">
                <h4 className="gallery-card__title">Fotos</h4>
                <p className="gallery-card__subtitle">Sube tus fotos a la carpeta day{dayNum}/ para activarlo</p>
              </div>
              <span className="gallery-card__badge" style={{ backgroundColor: '#a0a0a0' }}>
                0 fotos
              </span>
            </div>
          </div>
        )}

        {/* CARD 2: VÍDEOS */}
        {displayVideos.length > 0 ? (
          <div
            className="gallery-card reveal"
            onClick={() => openLightbox('videos', 0)}
          >
            <div className="gallery-card__image-container">
              <MediaWithFallback
                src={displayVideos[0].src}
                type="video"
                alt="Vídeos del día"
                className="gallery-card__image"
              />
              <div className="gallery-card__overlay-gradient" />
              <div className="gallery-card__video-play-overlay">▶</div>
            </div>

            <div className="gallery-card__content">
              <div className="gallery-card__text">
                <h4 className="gallery-card__title">Vídeos</h4>
                <p className="gallery-card__subtitle">Haz clic para reproducir los vídeos</p>
              </div>
              <span className="gallery-card__badge" style={{ backgroundColor: dayAccent }}>
                {displayVideos.length} {displayVideos.length === 1 ? 'vídeo' : 'vídeos'}
              </span>
            </div>
          </div>
        ) : (
          <div className="gallery-card gallery-card--empty reveal">
            <div className="gallery-card__image-container" style={{ background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem', opacity: 0.25 }}>🎥</span>
            </div>
            <div className="gallery-card__content">
              <div className="gallery-card__text">
                <h4 className="gallery-card__title">Vídeos</h4>
                <p className="gallery-card__subtitle">Sube tus vídeos a day{dayNum}/videos/ para activarlo</p>
              </div>
              <span className="gallery-card__badge" style={{ backgroundColor: '#a0a0a0' }}>
                0 vídeos
              </span>
            </div>
          </div>
        )}
      </div>

      {activeAlbum !== null && activeMediaIndex !== null && createPortal(
        <div
          className="lightbox"
          style={{
            '--lightbox-bg': `var(--day${dayNum}-bg)`,
            '--lightbox-text': 'var(--text)',
            '--lightbox-accent': dayAccent,
          }}
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          ref={(el) => el && el.focus()}
        >
          <button className="lightbox__close" onClick={closeLightbox}>✕</button>

          {/* Elegant Modal Box containing the Media */}
          <div className="lightbox__modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="lightbox__modal-title" style={{ fontFamily: 'Melodrama, serif', fontWeight: '560' }}>
              {activeAlbum === 'videos' ? 'Vídeos del día' : 'Fotos del día'}
            </h4>

            <div className="lightbox__media-wrapper">
              <MediaWithFallback
                src={currentPool[activeMediaIndex].src}
                type={currentPool[activeMediaIndex].type}
                alt=""
                className="lightbox__image"
                large
              />
            </div>

            {/* Micro Thumbnail Navigation Strip inside Lightbox */}
            {currentPool.length > 1 && (
              <div className="lightbox__thumbnails-strip">
                {currentPool.map((item, idx) => (
                  <div
                    key={idx}
                    className={`lightbox__thumbnail-dot ${idx === activeMediaIndex ? 'active' : ''}`}
                    onClick={() => setActiveMediaIndex(idx)}
                  >
                    {item.type === 'video' ? (
                      <video
                        src={item.src}
                        preload="metadata"
                        muted
                        playsInline
                        onLoadedMetadata={(e) => { e.target.currentTime = 0.5; }}
                      />
                    ) : (
                      <img src={item.src} alt="" onError={(e) => e.target.style.display = 'none'} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentPool.length > 1 && (
            <>
              <button
                className="lightbox__nav lightbox__nav--prev"
                onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              >
                ‹
              </button>
              <button
                className="lightbox__nav lightbox__nav--next"
                onClick={(e) => { e.stopPropagation(); navigate(1); }}
              >
                ›
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function MediaWithFallback({ src, type, alt, className, large }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`placeholder-img ${className || ''}`}>
        <span className="placeholder-img__icon">{type === 'video' ? '🎥' : '🏙️'}</span>
        <span>{type === 'video' ? 'Video del viaje' : 'Foto del viaje'}</span>
      </div>
    );
  }

  const isVideo = type === 'video' || src.toLowerCase().endsWith('.mov') || src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');

  if (isVideo) {
    // Hack para Safari/iOS: Forzar que cargue el primer frame añadiendo #t=0.001 a la URL
    const videoSrc = src.includes('#t=') ? src : `${src}#t=0.001`;

    return (
      <video
        src={videoSrc}
        className={className}
        onError={() => setHasError(true)}
        preload="metadata"
        muted={!large}
        playsInline
        controls={large}
        autoPlay={large}
        loop={large}
        onLoadedMetadata={(e) => {
          if (!large) e.target.currentTime = 0.1;
        }}
        style={large ? { maxHeight: '52vh', width: 'auto', background: '#000', borderRadius: '8px' } : { objectFit: 'cover' }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
