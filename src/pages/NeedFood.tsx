import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Phone, ArrowRight, AlertTriangle } from 'lucide-react';
import ShareInvite from '../components/ShareInvite';

export default function NeedFood() {
  const [step, setStep] = useState(1);
  const [urgency, setUrgency] = useState<'immediate' | 'soon' | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-rose-800 font-bold text-lg">Are you in immediate crisis?</h2>
            <p className="text-rose-700 mt-1">
              If you have no food for today, please call the United Way 211 helpline immediately by dialing <strong>2-1-1</strong> or <strong>1-800-427-4626</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-10 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-8">Let's find you some food</h1>
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-stone-800 mb-6">How soon do you need food?</h3>
            
            <button 
              onClick={() => { setUrgency('immediate'); setStep(2); }}
              className="w-full text-left p-6 rounded-2xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <span className="block font-bold text-stone-800 text-xl group-hover:text-emerald-700">Today / Right Now</span>
                <span className="block text-stone-500 mt-2 font-medium">I need groceries or a meal immediately.</span>
              </div>
              <ArrowRight className="w-6 h-6 text-stone-400 group-hover:text-emerald-600" />
            </button>
            
            <button 
              onClick={() => { setUrgency('soon'); setStep(2); }}
              className="w-full text-left p-6 rounded-2xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <span className="block font-bold text-stone-800 text-xl group-hover:text-emerald-700">In the next few days</span>
                <span className="block text-stone-500 mt-2 font-medium">I have enough for today, but need help soon.</span>
              </div>
              <ArrowRight className="w-6 h-6 text-stone-400 group-hover:text-emerald-600" />
            </button>
          </div>
        )}

        {step === 2 && urgency === 'immediate' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-xl font-semibold text-stone-800">Here are your fastest options:</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Link to="/pantries" className="bg-stone-50 rounded-2xl p-6 border border-stone-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md">
                <MapPin className="w-8 h-8 text-emerald-600 mb-4" />
                <h4 className="font-bold text-stone-800 text-lg mb-2">Find an Open Pantry</h4>
                <p className="text-sm text-stone-600 font-medium">Locate a partner pantry near you that is open right now.</p>
              </Link>
              
              <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 shadow-sm">
                <Phone className="w-8 h-8 text-blue-600 mb-4" />
                <h4 className="font-bold text-stone-800 text-lg mb-2">Call United Way 211</h4>
                <p className="text-sm text-stone-600 font-medium mb-4">Get connected with emergency food resources immediately.</p>
                <a href="tel:211" className="inline-flex items-center justify-center bg-blue-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                  Dial 2-1-1
                </a>
              </div>
            </div>
            
            <button onClick={() => setStep(1)} className="text-stone-500 font-medium hover:text-stone-800 text-sm mt-6 flex items-center gap-2">
              &larr; Back
            </button>
          </div>
        )}

        {step === 2 && urgency === 'soon' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-xl font-semibold text-stone-800">Here are the best ways to plan ahead:</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Link to="/events" className="bg-stone-50 rounded-2xl p-6 border border-stone-100 hover:border-teal-400 hover:bg-teal-50 transition-all shadow-sm hover:shadow-md">
                <Calendar className="w-8 h-8 text-teal-600 mb-4" />
                <h4 className="font-bold text-stone-800 text-lg mb-2">Upcoming Events</h4>
                <p className="text-sm text-stone-600 font-medium">Find a mobile market or drive-thru distribution event near you.</p>
              </Link>
              
              <Link to="/pantries" className="bg-stone-50 rounded-2xl p-6 border border-stone-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md">
                <MapPin className="w-8 h-8 text-emerald-600 mb-4" />
                <h4 className="font-bold text-stone-800 text-lg mb-2">Find a Pantry</h4>
                <p className="text-sm text-stone-600 font-medium">Locate a partner pantry and check their upcoming hours.</p>
              </Link>
              
              <Link to="/snap" className="bg-stone-50 rounded-2xl p-6 border border-stone-100 hover:border-amber-400 hover:bg-amber-50 transition-all shadow-sm hover:shadow-md md:col-span-2">
                <div className="flex items-start gap-5">
                  <div className="bg-amber-100 p-4 rounded-full shrink-0">
                    <span className="font-black text-amber-700">SNAP</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-lg mb-2">Apply for SNAP (Food Stamps)</h4>
                    <p className="text-sm text-stone-600 font-medium">Get long-term assistance buying groceries. We can help you apply.</p>
                  </div>
                </div>
              </Link>
            </div>
            
            <button onClick={() => setStep(1)} className="text-stone-500 font-medium hover:text-stone-800 text-sm mt-6 flex items-center gap-2">
              &larr; Back
            </button>
          </div>
        )}
      </div>

      <ShareInvite context="food" />
    </div>
  );
}
