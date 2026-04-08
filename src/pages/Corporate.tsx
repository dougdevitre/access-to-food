import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Gift, TrendingUp, ArrowRight, CheckCircle2, Heart, Calendar, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ImpactStats from '../components/ImpactStats';
import ShareInvite from '../components/ShareInvite';

const TIERS = [
  {
    name: 'Community Partner',
    amount: '$1,000 – $4,999',
    color: 'border-emerald-200 bg-emerald-50',
    accent: 'text-emerald-700',
    perks: ['Logo on partner page', 'Quarterly impact report', 'Social media recognition'],
  },
  {
    name: 'Sustainer',
    amount: '$5,000 – $24,999',
    color: 'border-blue-200 bg-blue-50',
    accent: 'text-blue-700',
    perks: ['Everything in Community Partner', 'Named volunteer team events', 'Featured in annual report', 'Employee food drive kit'],
  },
  {
    name: 'Champion',
    amount: '$25,000+',
    color: 'border-amber-200 bg-amber-50',
    accent: 'text-amber-700',
    perks: ['Everything in Sustainer', 'Event naming rights', 'Board advisory seat', 'Custom impact dashboard', 'Co-branded campaigns'],
  },
];

export default function Corporate() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [employeeCount, setEmployeeCount] = useState('');

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'corporateInquiries'), {
        companyName,
        contactName,
        contactEmail,
        interests,
        employeeCount,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setFormSubmitted(true);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Hero */}
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-emerald-400" />
            <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Corporate Partnerships</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
            Turn your company's values<br />into community impact
          </h1>
          <p className="text-stone-300 text-lg max-w-2xl font-medium">
            Partner with access-to-food to fight hunger through financial giving, employee volunteering,
            food drives, and matching gift programs. Every dollar provides $6 in food and services.
          </p>
        </div>
      </div>

      {/* Impact proof */}
      <ImpactStats variant="full" />

      {/* Ways to partner */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-800">Ways Your Company Can Help</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Gift, title: 'Corporate Donations', desc: 'Financial gifts with matching programs that multiply impact', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { icon: Users, title: 'Employee Volunteering', desc: 'Team volunteer days at our warehouse, pantries, and events', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: Heart, title: 'Food Drives', desc: 'Company-wide food collection with our planning toolkit', color: 'text-rose-600', bg: 'bg-rose-50' },
            { icon: TrendingUp, title: 'Cause Marketing', desc: 'Co-branded campaigns that raise awareness and funds', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
                <div className={`${item.bg} p-3 rounded-xl w-fit`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="font-bold text-stone-800">{item.title}</h3>
                <p className="text-sm text-stone-600 font-medium">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sponsorship tiers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-800">Sponsorship Tiers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div key={tier.name} className={`rounded-2xl p-6 border-2 ${tier.color} space-y-4`}>
              <div>
                <h3 className={`font-bold text-xl ${tier.accent}`}>{tier.name}</h3>
                <p className="text-stone-600 font-semibold text-lg mt-1">{tier.amount}</p>
              </div>
              <ul className="space-y-2">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-stone-700">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.accent}`} />
                    <span className="font-medium">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiry form */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Start a Partnership</h2>
          <p className="text-stone-500 font-medium mb-6">
            Tell us about your company and how you'd like to get involved. Our team will reach out within 2 business days.
          </p>

          {formSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-in fade-in duration-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-emerald-800 text-xl">Thank you!</h3>
              <p className="text-emerald-700 text-sm font-medium">
                Our partnerships team will contact you within 2 business days to discuss how {companyName} can make a difference.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Company Name</label>
                <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Your Name</label>
                <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Work Email</label>
                <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Number of Employees</label>
                <select value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} required
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50 cursor-pointer">
                  <option value="">Select...</option>
                  <option value="1-50">1 – 50</option>
                  <option value="51-200">51 – 200</option>
                  <option value="201-1000">201 – 1,000</option>
                  <option value="1001+">1,001+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Interested In</label>
                <div className="flex flex-wrap gap-2">
                  {['Financial Giving', 'Employee Volunteering', 'Food Drives', 'Cause Marketing', 'Matching Gifts'].map((interest) => (
                    <button key={interest} type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        interests.includes(interest)
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full bg-emerald-700 text-white font-medium py-4 rounded-xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {isSubmitting ? 'Submitting...' : 'Get in Touch'}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick links */}
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
            <h3 className="font-bold text-stone-800 text-lg">Ready to start now?</h3>
            <Link to="/donate" className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors group">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-indigo-700">Make a corporate donation</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
            </Link>
            <Link to="/volunteer" className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors group">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-700">Schedule a team volunteer day</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600" />
            </Link>
          </div>

          <ShareInvite context="general" />
        </div>
      </div>
    </div>
  );
}
