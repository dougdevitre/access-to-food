import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, Activity, Users, Map as MapIcon, ShieldAlert, TrendingUp, PackageX, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ResourceMap, { MapMarker } from '../components/ResourceMap';

interface Pantry {
  id: string;
  organization_name?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  inventoryStatus?: 'high' | 'medium' | 'low' | 'empty';
}

const STAFFING_DATA = [
  { name: 'Mar 20', needed: 15, filled: 12 },
  { name: 'Mar 22', needed: 8, filled: 8 },
  { name: 'Mar 25', needed: 20, filled: 5 },
  { name: 'Mar 28', needed: 5, filled: 2 },
  { name: 'Apr 02', needed: 10, filled: 1 },
];

const RISK_ZONES = [
  { zip: '63106', neighborhood: 'JeffVanderLou', risk: 92, trend: '+5%' },
  { zip: '63113', neighborhood: 'The Ville', risk: 88, trend: '+2%' },
  { zip: '63115', neighborhood: 'Penrose', risk: 85, trend: '-1%' },
  { zip: '63107', neighborhood: 'Hyde Park', risk: 78, trend: '+8%' },
];

export default function CommandCenter() {
  const [pantries, setPantries] = useState<Pantry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPantries() {
      try {
        setFetchError(null);
        const q = query(collection(db, 'pantries'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pantry));
        setPantries(data);
      } catch (error) {
        console.error('Error fetching pantries:', error);
        setFetchError('Unable to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchPantries();
  }, []);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return pantries
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        id: p.id,
        lat: p.latitude!,
        lng: p.longitude!,
        title: p.organization_name || p.name || 'Unnamed Pantry',
        type: 'pantry' as const,
        details: `Stock: ${p.inventoryStatus || 'unknown'}`
      }));
  }, [pantries]);

  const criticalPantries = useMemo(() => {
    return pantries.filter(p => p.inventoryStatus === 'empty' || p.inventoryStatus === 'low');
  }, [pantries]);
  
  const fillRate = useMemo(() => {
    const needed = STAFFING_DATA.reduce((acc, curr) => acc + curr.needed, 0);
    const filled = STAFFING_DATA.reduce((acc, curr) => acc + curr.filled, 0);
    return Math.round((filled / needed) * 100);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Hunger Command Center
        </h1>
        <p className="text-stone-600">Real-time regional overview of food access, inventory, and volunteer staffing.</p>
      </div>

      {fetchError && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{fetchError}</span>
          <button onClick={() => window.location.reload()} className="ml-auto text-sm font-medium hover:underline shrink-0">Retry</button>
        </div>
      )}

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <MapIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-light text-stone-800 tracking-tight">{pantries.length || '--'}</h3>
            <p className="text-sm font-medium text-stone-500 mt-1">Active Pantries</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-rose-50 p-2.5 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-light text-rose-600 tracking-tight">{criticalPantries.length || '--'}</h3>
            <p className="text-sm font-medium text-stone-500 mt-1">Critical Alerts</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-2.5 rounded-xl">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-light text-stone-800 tracking-tight">{fillRate}%</h3>
            <p className="text-sm font-medium text-stone-500 mt-1">Volunteer Fill Rate</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 p-2.5 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-light text-amber-600 tracking-tight">{RISK_ZONES.length}</h3>
            <p className="text-sm font-medium text-stone-500 mt-1">High Risk Zones</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 className="font-semibold text-stone-800 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-stone-400" />
              Food Access Map
            </h2>
            <div className="flex gap-3 text-xs font-medium text-stone-500">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Good</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Med</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Empty</span>
            </div>
          </div>
          <div className="w-full h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-stone-400">Loading map data...</div>
            ) : (
              <ResourceMap markers={mapMarkers} userLocation={null} />
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col h-[380px]">
          <div className="p-6 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800 flex items-center gap-2">
              <PackageX className="w-5 h-5 text-rose-500" />
              Inventory Alerts
            </h2>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {loading ? (
              <p className="text-stone-500 text-sm text-center py-4">Loading alerts...</p>
            ) : criticalPantries.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-stone-600 font-medium">All pantries stocked</p>
              </div>
            ) : (
              criticalPantries.map(p => (
                <div key={p.id} className="flex items-start justify-between p-3.5 rounded-2xl border border-stone-100 bg-stone-50/50">
                  <div>
                    <h4 className="font-medium text-stone-800 text-sm">{p.organization_name || p.name}</h4>
                    <p className="text-xs text-stone-500 mt-1">Needs immediate restock</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                    p.inventoryStatus === 'empty' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {p.inventoryStatus}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Volunteer Staffing */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-semibold text-stone-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Volunteer Staffing Levels
            </h2>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={STAFFING_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a8a29e' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a8a29e' }} />
                <Tooltip 
                  cursor={{ fill: '#fafaf9' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f5f5f4', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', color: '#78716c' }} />
                <Bar dataKey="needed" name="Needed" fill="#e7e5e4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="filled" name="Filled" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hunger Risk Map */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-semibold text-stone-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Hunger Risk Index
            </h2>
          </div>
          <div className="space-y-6">
            {RISK_ZONES.map((zone) => (
              <div key={zone.zip}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="font-medium text-stone-800">{zone.zip}</span>
                    <span className="text-sm text-stone-500 ml-2">{zone.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">{zone.trend}</span>
                    <span className="font-light text-xl text-stone-800">{zone.risk}</span>
                  </div>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${zone.risk > 90 ? 'bg-rose-500' : zone.risk > 80 ? 'bg-orange-500' : 'bg-amber-500'}`}
                    style={{ width: `${zone.risk}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
