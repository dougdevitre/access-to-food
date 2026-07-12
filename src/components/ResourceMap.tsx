import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPinOff } from 'lucide-react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'pantry' | 'event' | 'volunteer';
  details?: string;
}

interface ResourceMapProps {
  markers: MapMarker[];
  userLocation: { lat: number; lng: number } | null;
  defaultCenter?: { lat: number; lng: number };
}

export default function ResourceMap({ 
  markers, 
  userLocation, 
  defaultCenter = { lat: 38.6270, lng: -90.1994 } // Default to St. Louis
}: ResourceMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const center = userLocation || defaultCenter;

  const getPinColor = (type: string) => {
    switch (type) {
      case 'pantry': return '#10b981'; // emerald-500
      case 'event': return '#0ea5e9'; // sky-500
      case 'volunteer': return '#f59e0b'; // amber-500
      default: return '#6b7280'; // gray-500
    }
  };

  // Mounting APIProvider with an empty key renders a broken gray Google error
  // tile — show a friendly placeholder instead.
  if (!MAPS_API_KEY) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-50 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <MapPinOff className="w-10 h-10 text-stone-300" />
        <p className="font-semibold text-stone-600">Map unavailable</p>
        <p className="text-sm text-stone-500 max-w-sm">
          The Google Maps API key is not configured. Set the{' '}
          <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
          environment variable at build time to enable the map.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-stone-200 shadow-sm relative">
      <APIProvider apiKey={MAPS_API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={11}
          mapId="DEMO_MAP_ID"
          disableDefaultUI={true}
          zoomControl={true}
        >
          {userLocation && (
            <AdvancedMarker position={userLocation} title="You are here">
              <Pin background="#ef4444" borderColor="#b91c1c" glyphColor="#fff" />
            </AdvancedMarker>
          )}

          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              title={marker.title}
              onClick={() => setSelectedMarker(marker)}
            >
              <Pin 
                background={getPinColor(marker.type)} 
                borderColor="rgba(0,0,0,0.2)" 
                glyphColor="#fff" 
              />
            </AdvancedMarker>
          ))}

          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 max-w-[200px]">
                <h3 className="font-bold text-stone-800 mb-1">{selectedMarker.title}</h3>
                <p className="text-xs text-stone-600 capitalize mb-2">{selectedMarker.type}</p>
                {selectedMarker.details && (
                  <p className="text-sm text-stone-700">{selectedMarker.details}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
