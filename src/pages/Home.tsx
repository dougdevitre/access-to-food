import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, HeartHandshake, Gift, FileText, AlertTriangle, ArrowRight, Search, Info } from 'lucide-react';

export default function Home() {
  const [intent, setIntent] = useState<'get_help' | 'give_help'>('get_help');

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-8rem)] flex flex-col space-y-6 pb-8">
      {/* Header Section */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-3xl font-black text-stone-800 tracking-tight">access-to-food</h1>
        <p className="text-stone-500 font-medium px-4">
          Your community hub for food resources. Part of the access-to series.
        </p>
      </div>

      {/* Intent Toggle */}
      <div className="flex bg-stone-200/80 p-1 rounded-2xl mx-4 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setIntent('get_help')}
          className={`whitespace-nowrap flex-1 min-w-max py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            intent === 'get_help' 
              ? 'bg-white text-stone-800 shadow-sm' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          I Need Food
        </button>
        <button
          onClick={() => setIntent('give_help')}
          className={`whitespace-nowrap flex-1 min-w-max py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            intent === 'give_help' 
              ? 'bg-white text-stone-800 shadow-sm' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          I Want to Help
        </button>
      </div>

      {/* Dynamic Content Based on Intent */}
      <div className="px-4 space-y-4 flex-grow">
        {intent === 'get_help' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                <strong>How to use:</strong> Use the red button for immediate emergency food. Use the map to find regular pantries, or check events for pop-up distributions.
              </p>
            </div>

            {/* Emergency Action */}
            <Link 
              to="/need-food" 
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg shadow-rose-600/20 transition-transform active:scale-95"
            >
              <AlertTriangle className="w-10 h-10 mb-2 text-rose-100" />
              <span className="text-xl font-black tracking-wide">I Need Food Now</span>
              <span className="text-rose-200 text-sm mt-1 font-medium">Find emergency resources immediately</span>
            </Link>

            {/* Grid Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/pantries" 
                className="bg-white border border-stone-100 hover:border-emerald-200 text-stone-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all active:scale-95 aspect-square"
              >
                <div className="bg-emerald-50 p-4 rounded-2xl mb-4">
                  <Search className="w-8 h-8 text-emerald-600" />
                </div>
                <span className="font-semibold text-lg leading-tight">Find a<br/>Pantry</span>
              </Link>

              <Link 
                to="/events" 
                className="bg-white border border-stone-100 hover:border-sky-200 text-stone-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all active:scale-95 aspect-square"
              >
                <div className="bg-sky-50 p-4 rounded-2xl mb-4">
                  <Calendar className="w-8 h-8 text-sky-600" />
                </div>
                <span className="font-semibold text-lg leading-tight">Distribution<br/>Events</span>
              </Link>
            </div>

            <Link 
              to="/snap" 
              className="bg-white border border-stone-100 hover:border-stone-200 text-stone-800 rounded-3xl p-6 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all active:scale-95"
            >
              <div className="flex items-center gap-5">
                <div className="bg-stone-50 p-4 rounded-2xl">
                  <FileText className="w-6 h-6 text-stone-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-lg text-stone-800">SNAP Help</span>
                  <span className="text-stone-500 text-sm font-medium">Application assistance</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-400" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Info Card */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>How to help:</strong> It takes many helping hands to heal hunger. Join thousands of volunteers, or donate to provide $6 in food and services for every $1 given.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/volunteer" 
                className="bg-white border border-stone-100 hover:border-amber-200 text-stone-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all active:scale-95 aspect-square"
              >
                <div className="bg-amber-50 p-4 rounded-2xl mb-4">
                  <HeartHandshake className="w-8 h-8 text-amber-600" />
                </div>
                <span className="font-semibold text-lg leading-tight">Volunteer</span>
              </Link>

              <Link 
                to="/donate" 
                className="bg-white border border-stone-100 hover:border-indigo-200 text-stone-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all active:scale-95 aspect-square"
              >
                <div className="bg-indigo-50 p-4 rounded-2xl mb-4">
                  <Gift className="w-8 h-8 text-indigo-600" />
                </div>
                <span className="font-semibold text-lg leading-tight">Donate</span>
              </Link>
            </div>

            {/* Partner Login */}
            <div className="mt-8 bg-white border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-3xl p-8 text-center space-y-4">
              <h3 className="font-semibold text-xl text-stone-800">Are you a Partner Agency?</h3>
              <p className="text-sm text-stone-500">Manage your inventory, update hours, and coordinate with our network of community partners.</p>
              <Link 
                to="/dashboard" 
                className="inline-flex items-center justify-center gap-2 bg-stone-800 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-stone-900 transition-colors mt-2"
              >
                Partner Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
