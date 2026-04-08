import React, { useState } from 'react';
import { FileText, Phone, CheckCircle2, ArrowRight, Calculator, AlertCircle } from 'lucide-react';

export default function Snap() {
  const [householdSize, setHouseholdSize] = useState<number>(1);
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [showResult, setShowResult] = useState(false);

  // Simplified 2024 Gross Monthly Income Limits (130% FPL) for demonstration
  const calculateEligibility = () => {
    if (monthlyIncome === '') return null;
    
    let limit = 1580; // Base for 1 person
    if (householdSize > 1) {
      limit += (householdSize - 1) * 557;
    }

    return Number(monthlyIncome) <= limit;
  };

  const isEligible = calculateEligibility();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-blue-600 text-white rounded-3xl p-8 md:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="bg-blue-500/50 p-5 rounded-full shrink-0">
            <FileText className="w-12 h-12 text-blue-50" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">SNAP Application Assistance</h1>
            <p className="text-blue-100 text-lg font-medium">
              Get help applying for the Supplemental Nutrition Assistance Program (food stamps).
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl font-semibold text-stone-800 mb-4 flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            Eligibility Calculator
          </h2>
          <p className="text-stone-600 mb-8 text-sm font-medium">
            Use this quick calculator to see if you might qualify based on standard income guidelines.
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Household Size</label>
              <select 
                value={householdSize}
                onChange={(e) => {
                  setHouseholdSize(Number(e.target.value));
                  setShowResult(false);
                }}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Gross Monthly Income</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-medium">$</span>
                <input 
                  type="number" 
                  placeholder="Before taxes"
                  value={monthlyIncome}
                  onChange={(e) => {
                    setMonthlyIncome(e.target.value ? Number(e.target.value) : '');
                    setShowResult(false);
                  }}
                  className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-stone-50 hover:bg-stone-100 transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={() => setShowResult(true)}
              disabled={monthlyIncome === ''}
              className="w-full bg-blue-50 text-blue-700 font-medium py-3.5 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              Check Eligibility
            </button>

            {showResult && isEligible !== null && (
              <div className={`mt-6 p-5 rounded-2xl border ${isEligible ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-4">
                  {isEligible ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`font-semibold text-lg ${isEligible ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {isEligible ? 'You may be eligible!' : 'You may not meet standard limits.'}
                    </h4>
                    <p className={`text-sm mt-1 ${isEligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isEligible 
                        ? 'Based on your inputs, you appear to meet the gross income limits. Contact us to start your application.' 
                        : 'Your income appears to be above the standard limits, but exceptions exist (e.g., for seniors or disabled individuals). Contact us to be sure.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100 flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl font-semibold text-stone-800 mb-4">Contact Our SNAP Team</h2>
          <p className="text-stone-600 mb-8 font-medium">
            Our dedicated team is ready to assist you. Call us or fill out a quick form to get started.
          </p>
          
          <div className="space-y-4">
            <a href="tel:3142926262" className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white font-medium py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              <Phone className="w-5 h-5" />
              Call (314) 292-6262
            </a>
            
            <button className="flex items-center justify-center gap-2 w-full bg-white text-blue-700 border border-blue-200 font-medium py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
              Request a Call Back
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-2xl font-semibold text-stone-800 mb-6">What to bring to your appointment:</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h4 className="font-bold text-stone-800 text-lg mb-2">ID</h4>
            <p className="text-sm text-stone-600 font-medium">Driver's license, state ID, or birth certificate.</p>
          </div>
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h4 className="font-bold text-stone-800 text-lg mb-2">Proof of Income</h4>
            <p className="text-sm text-stone-600 font-medium">Recent pay stubs or benefit letters.</p>
          </div>
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 shadow-sm">
            <h4 className="font-bold text-stone-800 text-lg mb-2">Proof of Expenses</h4>
            <p className="text-sm text-stone-600 font-medium">Rent/mortgage receipt, utility bills, medical bills.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
