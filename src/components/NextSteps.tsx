import { Link } from 'react-router-dom';
import { HeartHandshake, Gift, MapPin, Calendar, Bot, ArrowRight } from 'lucide-react';

type Context = 'donated' | 'volunteered' | 'found_food' | 'scanned' | 'snap';

interface NextStepsProps {
  context: Context;
}

const STEPS: Record<Context, Array<{ to: string; icon: typeof Gift; label: string; desc: string; color: string; bg: string }>> = {
  donated: [
    { to: '/volunteer', icon: HeartHandshake, label: 'Volunteer Next', desc: 'Multiply your impact with your time', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    { to: '/corporate', icon: Gift, label: 'Corporate Giving', desc: 'Get your company involved', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
  ],
  volunteered: [
    { to: '/donate', icon: Gift, label: 'Donate', desc: 'Every $1 provides $6 in food', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
    { to: '/events', icon: Calendar, label: 'Upcoming Events', desc: 'Find more ways to help', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-100' },
  ],
  found_food: [
    { to: '/events', icon: Calendar, label: 'Upcoming Events', desc: 'Find more distribution events', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-100' },
    { to: '/assistant', icon: Bot, label: 'Ask AI Assistant', desc: 'Get personalized help finding resources', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  ],
  scanned: [
    { to: '/dashboard', icon: MapPin, label: 'Command Center', desc: 'View network-wide inventory status', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
    { to: '/volunteer', icon: HeartHandshake, label: 'Request Volunteers', desc: 'Get help restocking shelves', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
  ],
  snap: [
    { to: '/pantries', icon: MapPin, label: 'Find a Pantry', desc: 'Get food while your application is processed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    { to: '/resources', icon: Calendar, label: 'More Resources', desc: 'WIC, Meals on Wheels, and more', color: 'text-stone-700', bg: 'bg-stone-50 border-stone-100' },
  ],
};

export default function NextSteps({ context }: NextStepsProps) {
  const steps = STEPS[context];

  return (
    <div className="space-y-3 mt-6">
      <h3 className="font-bold text-stone-700 text-sm uppercase tracking-wider">What to do next</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.to}
              to={step.to}
              className={`${step.bg} border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group`}
            >
              <Icon className={`w-6 h-6 ${step.color} shrink-0`} />
              <div className="flex-grow min-w-0">
                <span className={`font-semibold ${step.color} block`}>{step.label}</span>
                <span className="text-xs text-stone-500 font-medium">{step.desc}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
