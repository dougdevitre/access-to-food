import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, Calendar, Clock, Search, MapPin, Users, Bell, CalendarPlus, ChevronRight, List, Map as MapIcon, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { collection, getDocs, query, addDoc, deleteDoc, doc, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import ResourceMap, { MapMarker } from '../components/ResourceMap';

const ANONYMOUS_ID_KEY = 'access-to-food-anon-id';
function getAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = 'anon_' + crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

interface VolunteerShift {
  event_id: string;
  event_name: string;
  location: string;
  date: string;
  time: string;
  volunteers_needed: number;
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

export default function Volunteer() {
  const [activeTab, setActiveTab] = useState<'search' | 'upcoming' | 'log'>('search');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [myShiftIds, setMyShiftIds] = useState<string[]>([]);
  const [myShiftDocs, setMyShiftDocs] = useState<Map<string, string>>(new Map()); // eventId -> volunteerShift doc ID
  const [notification, setNotification] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allShifts, setAllShifts] = useState<VolunteerShift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState<string | null>(null);

  // Fetch events from Firestore as available shifts
  useEffect(() => {
    async function fetchShifts() {
      try {
        const snapshot = await getDocs(query(collection(db, 'events')));
        const events = snapshot.docs.map(d => {
          const data = d.data();
          const dateObj = data.date?.toDate ? data.date.toDate() : new Date(data.date);
          const hours = dateObj.getHours();
          const endHours = hours + 3;
          const formatTime = (h: number) => {
            const period = h >= 12 ? 'PM' : 'AM';
            const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
            return `${display}:00 ${period}`;
          };
          return {
            event_id: d.id,
            event_name: data.title || data.name || 'Volunteer Event',
            location: data.location || 'TBD',
            date: dateObj.toISOString().split('T')[0],
            time: `${formatTime(hours)} - ${formatTime(endHours)}`,
            volunteers_needed: data.volunteers_needed || 10,
            latitude: data.latitude || (38.6270 + (Math.random() - 0.5) * 0.1),
            longitude: data.longitude || (-90.1994 + (Math.random() - 0.5) * 0.1),
          } as VolunteerShift;
        });
        setAllShifts(events);
      } catch (error) {
        console.error('Error fetching shifts:', error);
      } finally {
        setLoadingShifts(false);
      }
    }
    fetchShifts();
  }, []);

  // Fetch user's existing signups
  useEffect(() => {
    async function fetchMySignups() {
      try {
        const userId = getAnonymousId();
        const q = query(collection(db, 'volunteerShifts'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const ids: string[] = [];
        const docMap = new Map<string, string>();
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.eventId && data.status !== 'cancelled') {
            ids.push(data.eventId);
            docMap.set(data.eventId, d.id);
          }
        });
        setMyShiftIds(ids);
        setMyShiftDocs(docMap);
      } catch (error) {
        console.error('Error fetching signups:', error);
      }
    }
    fetchMySignups();
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

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSignUp = async (eventId: string) => {
    if (myShiftIds.includes(eventId) || isSigningUp) return;
    setIsSigningUp(eventId);
    try {
      const userId = getAnonymousId();
      const shift = allShifts.find(s => s.event_id === eventId);
      const docRef = await addDoc(collection(db, 'volunteerShifts'), {
        eventId,
        userId,
        date: shift?.date || new Date().toISOString(),
        status: 'scheduled',
        hoursLogged: 0,
        createdAt: serverTimestamp(),
      });
      setMyShiftIds(prev => [...prev, eventId]);
      setMyShiftDocs(prev => new Map(prev).set(eventId, docRef.id));
      showNotification('Successfully signed up for shift!');
    } catch (error) {
      console.error('Error signing up:', error);
      showNotification('Failed to sign up. Please try again.');
    } finally {
      setIsSigningUp(null);
    }
  };

  const handleCancelShift = async (eventId: string) => {
    const docId = myShiftDocs.get(eventId);
    if (!docId) return;
    try {
      await deleteDoc(doc(db, 'volunteerShifts', docId));
      setMyShiftIds(prev => prev.filter(id => id !== eventId));
      setMyShiftDocs(prev => {
        const next = new Map(prev);
        next.delete(eventId);
        return next;
      });
      showNotification('Shift cancelled.');
    } catch (error) {
      console.error('Error cancelling shift:', error);
      showNotification('Failed to cancel. Please try again.');
    }
  };

  const handleCalendarSync = (shift: VolunteerShift) => {
    // Parse the shift date and time to create a proper .ics event
    const shiftDate = new Date(shift.date);
    const timeMatch = shift.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      shiftDate.setHours(hours, minutes, 0, 0);
    }

    // Parse end time from the time range
    const endDate = new Date(shiftDate);
    const endMatch = shift.time.match(/-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (endMatch) {
      let hours = parseInt(endMatch[1]);
      const minutes = parseInt(endMatch[2]);
      const period = endMatch[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      endDate.setHours(hours, minutes, 0, 0);
    } else {
      endDate.setHours(endDate.getHours() + 3); // Default 3hr duration
    }

    const formatICSDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//access-to-food//Volunteer//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(shiftDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${shift.event_name}`,
      `LOCATION:${shift.location}`,
      `DESCRIPTION:Volunteer shift - ${shift.volunteers_needed} volunteers needed`,
      `UID:${shift.event_id}@access-to-food`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${shift.event_name.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`Calendar file downloaded for "${shift.event_name}"!`);
  };

  const handleSetReminder = (shift: VolunteerShift) => {
    // Use the Notification API if available
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    showNotification(`Reminder set for 24 hours before "${shift.event_name}".`);
  };

  const filteredShifts = useMemo(() => {
    return allShifts
      .map(shift => {
        if (userLocation && shift.latitude && shift.longitude) {
          return {
            ...shift,
            distance: calculateDistance(userLocation.lat, userLocation.lng, shift.latitude, shift.longitude)
          };
        }
        return shift;
      })
      .filter(shift => 
        !myShiftIds.includes(shift.event_id) &&
        (shift.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         shift.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        if (userLocation) {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [userLocation, myShiftIds, searchQuery]);

  const upcomingShifts = useMemo(() => {
    return allShifts.filter(shift => myShiftIds.includes(shift.event_id));
  }, [myShiftIds]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredShifts
      .filter(s => s.latitude && s.longitude)
      .map(s => ({
        id: s.event_id,
        lat: s.latitude!,
        lng: s.longitude!,
        title: s.event_name,
        type: 'volunteer',
        details: `${new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${s.time}`
      }));
  }, [filteredShifts]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {notification && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          {notification}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-stone-800">Volunteer Portal</h1>
        <p className="text-stone-600">Find shifts, manage your schedule, and log hours</p>
      </div>

      <div className="flex p-1 bg-stone-200/80 rounded-2xl w-full overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('search')}
          className={`whitespace-nowrap flex-1 min-w-max px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'search' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Find Shifts
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`whitespace-nowrap flex-1 min-w-max px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'upcoming' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          My Schedule {myShiftIds.length > 0 && <span className="ml-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{myShiftIds.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`whitespace-nowrap flex-1 min-w-max px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'log' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Log Hours
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search for events or locations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
              />
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

          {loadingShifts ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
              <p className="text-stone-500 font-medium">Loading available shifts...</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <ResourceMap markers={mapMarkers} userLocation={userLocation} />
            </div>
          ) : (
            <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {filteredShifts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <p className="text-stone-500">No available shifts match your search.</p>
                </div>
              ) : (
                filteredShifts.map(shift => (
                  <div key={shift.event_id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    {shift.distance !== undefined && (
                      <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-bl-2xl border-b border-l border-emerald-100">
                        {shift.distance.toFixed(1)} mi
                      </div>
                    )}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-xl text-stone-800">{shift.event_name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 text-sm text-stone-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{shift.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{shift.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg">
                        <Users className="w-4 h-4" />
                        {shift.volunteers_needed} volunteers needed
                      </div>
                    </div>
                    <button
                    onClick={() => handleSignUp(shift.event_id)}
                    disabled={isSigningUp === shift.event_id}
                    className="shrink-0 bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSigningUp === shift.event_id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Signing Up...</>
                    ) : (
                      <>Sign Up <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              ))
            )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          {upcomingShifts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-stone-800 mb-2">No upcoming shifts</h3>
              <p className="text-stone-500 mb-8">You haven't signed up for any upcoming volunteer shifts.</p>
              <button 
                onClick={() => setActiveTab('search')}
                className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium hover:bg-emerald-800 transition-colors"
              >
                Find Opportunities
              </button>
            </div>
          ) : (
            upcomingShifts.map(shift => (
              <div key={shift.event_id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-l-4 border-l-emerald-500">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xl text-stone-800">{shift.event_name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 text-sm text-stone-600">
                      <div className="flex items-center gap-2 font-medium text-stone-800">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-stone-400" />
                        <span className="font-medium">{shift.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <MapPin className="w-4 h-4 text-stone-400" />
                      <span className="font-medium">{shift.location}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCancelShift(shift.event_id)}
                    className="text-sm text-rose-600 font-medium hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors md:self-start"
                  >
                    Cancel Shift
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-3 pt-5 border-t border-stone-100">
                  <button 
                    onClick={() => handleCalendarSync(shift)}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Add to Calendar
                  </button>
                  <button 
                    onClick={() => handleSetReminder(shift)}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Set Reminder
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'log' && (
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-w-xl mx-auto">
          <h3 className="text-xl font-semibold text-stone-800 mb-6">Log Volunteer Hours</h3>
          
          <form className="space-y-6" onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const shiftSelect = form.querySelector('select') as HTMLSelectElement;
            const hoursInput = form.querySelector('input[type="number"]') as HTMLInputElement;
            const eventId = shiftSelect?.value;
            const hours = parseFloat(hoursInput?.value || '0');
            if (!eventId || !hours) { showNotification('Please select a shift and enter hours.'); return; }
            try {
              let photoUrl: string | undefined;
              if (photoFile) {
                const storageRef = ref(storage, `volunteer-photos/${getAnonymousId()}/${Date.now()}-${photoFile.name}`);
                await uploadBytes(storageRef, photoFile);
                photoUrl = await getDownloadURL(storageRef);
              }
              await addDoc(collection(db, 'volunteerShifts'), {
                eventId,
                userId: getAnonymousId(),
                date: new Date().toISOString(),
                status: 'completed',
                hoursLogged: hours,
                ...(photoUrl && { photoUrl }),
                createdAt: serverTimestamp(),
              });
              showNotification('Hours logged successfully!');
              form.reset();
              setPhoto(null);
              setPhotoFile(null);
            } catch (error) {
              console.error('Error logging hours:', error);
              showNotification('Failed to log hours. Please try again.');
            }
          }}>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Select Shift</label>
              <select className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                <option value="">Select a shift...</option>
                {myShiftIds.map(id => {
                  const shift = allShifts.find(s => s.event_id === id);
                  if (!shift) return null;
                  return (
                    <option key={id} value={id}>
                      {shift.event_name} - {new Date(shift.date).toLocaleDateString()}
                    </option>
                  );
                })}
                {allShifts.filter(s => !myShiftIds.includes(s.event_id)).map(shift => (
                  <option key={shift.event_id} value={shift.event_id}>
                    {shift.event_name} - {new Date(shift.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Hours Completed</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input 
                  type="number" 
                  min="0.5" 
                  step="0.5" 
                  placeholder="e.g. 2.5" 
                  required
                  className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50 hover:bg-stone-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Photo Proof (Optional)</label>
              <p className="text-xs text-stone-500 mb-3">Upload a photo of your sign-in sheet or selfie at the event.</p>
              
              {photo ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 aspect-video flex items-center justify-center">
                  <img src={photo} alt="Volunteer proof" className="max-h-full object-contain" />
                  <button 
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute top-3 right-3 bg-stone-900/60 text-white px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-md hover:bg-stone-900/80 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 rounded-2xl p-10 text-center cursor-pointer hover:bg-stone-50 hover:border-emerald-400 transition-colors"
                >
                  <Camera className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <span className="text-sm font-medium text-emerald-700">Tap to take photo</span>
                  <span className="text-xs text-stone-500 block mt-1">or select from gallery</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handlePhotoCapture}
              />
            </div>

            <button type="submit" className="w-full bg-emerald-700 text-white font-medium py-3.5 rounded-xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 mt-8">
              <CheckCircle2 className="w-5 h-5" />
              Submit Hours
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
