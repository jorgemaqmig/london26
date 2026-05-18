import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { photosData } from '../data/photosData';

// Fix for default marker icons in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper to clean and slugify names for robust directory matching
const slugify = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .trim();
};

const getStopPhotos = (dayNum, stopName) => {
  const dayMedia = photosData && photosData[dayNum];
  if (!dayMedia || !dayMedia.stops) return [];

  const stopSlug = slugify(stopName);

  // Find a subfolder that matches the stop name
  const matchingFolder = Object.keys(dayMedia.stops).find((folderName) => {
    const folderSlug = slugify(folderName);
    const cleanFolder = folderSlug.replace(/^\d+_/, ''); // Remove number prefix like "04_"
    return (
      folderSlug.includes(stopSlug) ||
      stopSlug.includes(folderSlug) ||
      stopSlug.includes(cleanFolder) ||
      cleanFolder.includes(stopSlug)
    );
  });

  return matchingFolder ? dayMedia.stops[matchingFolder] : [];
};

export default function RouteMap({ places, accent = '#c47070', bg, dayNum }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [activePlace, setActivePlace] = useState(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    // Light, minimal map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Custom numbered markers
    const markers = places.map((place, index) => {
      const customIcon = L.divIcon({
        html: `<div style="
          background: ${accent};
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border: 2px solid white;
        ">${index + 1}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Get first photo for stop popup if available
      const stopPhotos = getStopPhotos(dayNum, place.name);
      const popupPhoto = stopPhotos.length > 0 ? stopPhotos[0].src : place.photo;

      const marker = L.marker(place.coords, { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: 'DM Sans', sans-serif; min-width: 140px; text-align: center; padding: 2px;">
          ${popupPhoto ? `<img src="${popupPhoto}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 6px; margin-bottom: 6px; display: block;" onerror="this.style.display='none'" />` : ''}
          <strong style="font-family: 'Satoshi', sans-serif; font-size: 13px; font-weight: 700; color: #2c2c2c; display: block;">${place.name}</strong>
        </div>
      `, { closeButton: false });

      return marker;
    });

    // Draw route line
    // Draw route line - Solid premium track to prevent SVG dashArray scaling bugs during zoom
    if (places.length > 1) {
      const routeCoords = places.map(p => p.coords);
      L.polyline(routeCoords, {
        color: accent,
        weight: 3,
        opacity: 0.45,
        smoothFactor: 1.5,
      }).addTo(map);
    }

    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));

    mapInstanceRef.current = map;

    // Classic Leaflet Bugfix: force container size recalculation and fit bounds after mount / animation frame renders
    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
      }
    }, 150);

    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
      }
    }, 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [places, accent, dayNum]);

  const handlePlaceClick = (place, index) => {
    setActivePlace(index);
    if (mapInstanceRef.current) {
      // 1. Trigger the cinematic flyTo animation to fly over to the stop
      mapInstanceRef.current.flyTo(place.coords, 15, { duration: 1.2 });

      // 2. Open the marker popup ONLY after the flyTo transition is 100% complete
      // This prevents the popup auto-pan and flyTo animations from conflicting and bugging the SVG lines!
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const markerLatLng = layer.getLatLng();
          if (
            Math.abs(markerLatLng.lat - place.coords[0]) < 0.0001 &&
            Math.abs(markerLatLng.lng - place.coords[1]) < 0.0001
          ) {
            setTimeout(() => {
              layer.openPopup();
            }, 1200);
          }
        }
      });
    }
  };

  return (
    <div className="route-section">
      <h3 className="route-section__title">
        <span className="route-section__title-icon"></span>
        Ruta del día
      </h3>

      <div className="route-map-container">
        <div className="route-map">
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </div>

        <div className="route-stops-list">
          {places.map((place, index) => (
            <div
              key={index}
              className={`route-stop-item ${activePlace === index ? 'active' : ''}`}
              onClick={() => handlePlaceClick(place, index)}
            >
              <div className="route-stop-main-info">
                <span className="route-stop-circle" style={{ background: accent, color: bg }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="route-stop-name" style={{ color: accent }}>
                  {place.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
