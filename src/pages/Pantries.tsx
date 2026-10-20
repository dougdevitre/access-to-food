import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, Phone, AlertCircle, Search, Info, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { usePageMeta } from '../lib/usePageMeta';
import { SAMPLE_PANTRIES } from '../lib/sampleData';

interface Pantry {
  id: string;
  location_id?: string;
  organization_name?: string;
  name?: string; // Fallback for existing data
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  distribution_hours?: string;
  hours?: string; // Fallback for existing data
  services?: string;
  phone?: string;
  inventoryStatus?: 'high' | 'medium' | 'low' | 'empty';
  distance?: number; // Calculated distance
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

export default function Pantries() {
  const [pantries, setPantries] = useState<Pantry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [expandedPantry, setExpandedPantry] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  usePageMeta('Partner Agencies');

  // Directory data is built in (src/lib/sampleData.ts) until a verified live
  // directory is connected. The page always labels it as sample data.
  useEffect(() => {
    setPantries(SAMPLE_PANTRIES as Pantry[]);
    setUsingSample(true);
    setLoading(false);
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

  const filteredPantries = useMemo(() => {
    return pantries
      .map(p => {
        // Calculate distance if we have user location and pantry coordinates
        if (userLocation && p.latitude && p.longitude) {
          return {
            ...p,
            distance: calculateDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude)
          };
        }
        return p;
      })
      .filter(p => {
        const searchLower = search.toLowerCase();
        const orgName = (p.organization_name || p.name || '').toLowerCase();
        const fullAddress = `${p.address || ''} ${p.city || ''} ${p.zip || ''}`.toLowerCase();
        const county = (p.county || '').toLowerCase();
        
        return orgName.includes(searchLower) || 
               fullAddress.includes(searchLower) ||
               county.includes(searchLower);
      })
      .sort((a, b) => {
        // If we have location, sort by distance
        if (userLocation) {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          // Push pantries without coordinates to the bottom
          if (a.distance !== undefined) return -1;
          if (b.distance !== undefined) return 1;
        }
        // Fallback to alphabetical
        const nameA = a.organization_name || a.name || '';
        const nameB = b.organization_name || b.name || '';
        return nameA.localeCompare(nameB);
      });
  }, [pantries, search, userLocation]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'high': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'empty': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const formatAddress = (p: Pantry) => {
    if (p.city && p.state && p.zip) {
      return `${p.address}, ${p.city}, ${p.state} ${p.zip}`;
    }
    return p.address || 'Address not provided';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Partner Agencies</h1>
          <p className="text-stone-600">Locate access-to-food partner agencies near you</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className={`flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-full border transition-colors ${
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
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search by name, zip, or county..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search partner agencies"
              className="w-full sm:w-64 min-h-11 pl-10 pr-4 py-2 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {usingSample && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          These are sample listings, not real agencies. For food help today, dial <a href="tel:211" className="font-semibold underline">2-1-1</a>.
        </div>
      )}

      {locationError && (
        <div className="bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {locationError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading agencies...</div>
      ) : filteredPantries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-stone-800">No agencies found</h2>
          <p className="text-stone-500">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {filteredPantries.map(pantry => {
            const displayName = pantry.organization_name || pantry.name || 'Unnamed Pantry';
            const displayHours = pantry.distribution_hours || pantry.hours;
            const fullAddress = formatAddress(pantry);
            
            return (
              <div key={pantry.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col relative overflow-hidden">
                {pantry.distance !== undefined && (
                  <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-bl-2xl border-b border-l border-emerald-100">
                    {pantry.distance.toFixed(1)} mi
                  </div>
                )}
                <div className="flex justify-between items-start mb-4 gap-3 pr-14">
                  <h2 className="font-semibold text-xl text-stone-800 leading-tight">{displayName}</h2>
                  {pantry.inventoryStatus && (
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusColor(pantry.inventoryStatus)}`}>
                      {pantry.inventoryStatus}
                    </span>
                  )}
                </div>
                
                <div className="space-y-4 text-sm text-stone-600 flex-grow">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-stone-400" />
                    <div>
                      <p className="font-medium text-stone-700">{fullAddress}</p>
                      {pantry.county && <p className="text-xs text-stone-500 mt-0.5">{pantry.county} County</p>}
                    </div>
                  </div>
                  
                  {displayHours && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-0.5 shrink-0 text-stone-400" />
                      <span className="whitespace-pre-wrap">{displayHours}</span>
                    </div>
                  )}
                  
                  {pantry.services && (
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-stone-400" />
                      <span className="line-clamp-2" title={pantry.services}>{pantry.services}</span>
                    </div>
                  )}
                  
                  {pantry.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-0.5 shrink-0 text-stone-400" />
                      <span>{pantry.phone}</span>
                    </div>
                  )}
                </div>
                
                {expandedPantry === pantry.id && (
                  <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-3 text-sm text-stone-600 animate-in fade-in slide-in-from-top-2 duration-200">
                    {pantry.services && (
                      <div>
                        <span className="font-semibold text-stone-700 block mb-1">Services</span>
                        <p>{pantry.services}</p>
                      </div>
                    )}
                    {displayHours && (
                      <div>
                        <span className="font-semibold text-stone-700 block mb-1">Distribution Hours</span>
                        <p className="whitespace-pre-wrap">{displayHours}</p>
                      </div>
                    )}
                    {pantry.county && (
                      <div>
                        <span className="font-semibold text-stone-700 block mb-1">County</span>
                        <p>{pantry.county}</p>
                      </div>
                    )}
                    {pantry.phone && (
                      <div>
                        <span className="font-semibold text-stone-700 block mb-1">Phone</span>
                        <a href={`tel:${pantry.phone.replace(/[^0-9]/g, '')}`} className="text-emerald-700 font-medium hover:underline">{pantry.phone}</a>
                      </div>
                    )}
                    {pantry.inventoryStatus && (
                      <div>
                        <span className="font-semibold text-stone-700 block mb-1">Inventory Status</span>
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusColor(pantry.inventoryStatus)}`}>
                          {pantry.inventoryStatus}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-stone-100 flex gap-3 shrink-0">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-emerald-50 text-emerald-700 font-medium py-2.5 rounded-xl hover:bg-emerald-100 transition-colors text-center"
                  >
                    Get Directions
                  </a>
                  <button
                    onClick={() => setExpandedPantry(expandedPantry === pantry.id ? null : pantry.id)}
                    className="flex-1 bg-stone-50 text-stone-700 font-medium py-2.5 rounded-xl hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {expandedPantry === pantry.id ? 'Less' : 'Details'}
                    {expandedPantry === pantry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
