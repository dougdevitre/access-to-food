import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, MapPin, Clock, AlertCircle, List, Map as MapIcon, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import ResourceMap, { MapMarker } from '../components/ResourceMap';

interface DistributionEvent {
  id: string;
  title: string;
  description?: string;
  date: any; // Firestore timestamp
  location: string;
  type: 'mobile_market' | 'pop_up' | 'drive_thru';
  latitude?: number;
  longitude?: number;
  distance?: number;
}

// Haversine formula to calculate distance in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export default function Events() {
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const now = new Date();
        // Only show upcoming events
        const q = query(
          collection(db, 'events'), 
          where('date', '>=', now),
          orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const eventData = doc.data() as DistributionEvent;
          // Mock coordinates if missing (around St. Louis)
          const lat = eventData.latitude || 38.6270 + (Math.random() - 0.5) * 0.2;
          const lng = eventData.longitude || -90.1994 + (Math.random() - 0.5) * 0.2;
          return { id: doc.id, ...eventData, latitude: lat, longitude: lng };
        });
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to retrieve your location');
        setIsLocating(false);
      }
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mobile_market': return 'Mobile Market';
      case 'pop_up': return 'Pop-up Event';
      case 'drive_thru': return 'Drive-thru';
      default: return 'Event';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mobile_market': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'pop_up': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'drive_thru': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const sortedEvents = useMemo(() => {
    return events
      .map(e => {
        if (userLocation && e.latitude && e.longitude) {
          return {
            ...e,
            distance: calculateDistance(userLocation.lat, userLocation.lng, e.latitude, e.longitude)
          };
        }
        return e;
      })
      .sort((a, b) => {
        if (userLocation) {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
        }
        // Fallback to date sort (already sorted by query, but just in case)
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [events, userLocation]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return sortedEvents
      .filter(e => e.latitude && e.longitude)
      .map(e => {
        const eventDate = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return {
          id: e.id,
          lat: e.latitude!,
          lng: e.longitude!,
          title: e.title,
          type: 'event',
          details: `${format(eventDate, 'MMM d, h:mm a')} - ${e.location}`
        };
      });
  }, [sortedEvents]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Distribution Events</h1>
          <p className="text-stone-600">Find upcoming food distribution events near you</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-stone-100 p-1 rounded-full">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'map' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Map
            </button>
          </div>

          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border transition-colors ${
              userLocation 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">
              {isLocating ? 'Locating...' : userLocation ? 'Sorted by Distance' : 'Near Me'}
            </span>
          </button>
        </div>
      </div>

      {locationError && (
        <div className="bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {locationError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading events...</div>
      ) : sortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-stone-800">No upcoming events</h3>
          <p className="text-stone-500">Check back later for new distribution events.</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <ResourceMap markers={mapMarkers} userLocation={userLocation} />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {sortedEvents.map(event => {
            const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
            return (
              <div key={event.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden">
                {event.distance !== undefined && (
                  <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-bl-2xl border-b border-l border-emerald-100">
                    {event.distance.toFixed(1)} mi
                  </div>
                )}
                
                {/* Date Box */}
                <div className="bg-stone-50 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[110px] border border-stone-100 shrink-0">
                  <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">{format(eventDate, 'MMM')}</span>
                  <span className="text-4xl font-black text-emerald-700 leading-none my-1.5">{format(eventDate, 'd')}</span>
                  <span className="text-xs font-medium text-stone-500">{format(eventDate, 'EEEE')}</span>
                </div>

                {/* Event Details */}
                <div className="flex-grow pr-14 md:pr-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-xl text-stone-800">{event.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getTypeColor(event.type)}`}>
                      {getTypeLabel(event.type)}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm text-stone-600">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-0.5 shrink-0 text-stone-400" />
                      <span className="font-medium">{format(eventDate, 'h:mm a')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-stone-400" />
                      <span className="font-medium">{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center md:items-end justify-end shrink-0 mt-4 md:mt-0">
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto bg-emerald-50 text-emerald-700 font-medium px-8 py-3 rounded-xl hover:bg-emerald-100 transition-colors text-center"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
