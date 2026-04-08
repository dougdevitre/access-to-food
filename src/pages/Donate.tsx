import React, { useState, useRef } from 'react';
import { Heart, Utensils, Camera, CheckCircle2, Calculator, Users, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Donate() {
  const [activeTab, setActiveTab] = useState<'monetary' | 'food'>('monetary');
  const [amount, setAmount] = useState<number>(25);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [donationSubmitted, setDonationSubmitted] = useState(false);
  const [foodDonationSubmitted, setFoodDonationSubmitted] = useState(false);
  const [foodLocation, setFoodLocation] = useState('');
  const [foodWeight, setFoodWeight] = useState('');
  const [isSubmittingFood, setIsSubmittingFood] = useState(false);

  // Food Drive Calculator State
  const [participants, setParticipants] = useState<number>(100);
  const [itemsPerParticipant, setItemsPerParticipant] = useState<number>(2);

  // Impact calculations
  const estimatedItems = participants * itemsPerParticipant;

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Support Our Mission</h1>
        <p className="text-stone-600 font-medium">Every donation helps nourish our community</p>
      </div>

      <div className="flex p-1.5 bg-stone-100 rounded-2xl w-full md:w-fit shadow-inner">
        <button
          onClick={() => setActiveTab('monetary')}
          className={`flex-1 md:px-10 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'monetary' ? 'bg-white text-stone-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Give Funds
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`flex-1 md:px-10 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'food' ? 'bg-white text-stone-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Donate Food
        </button>
      </div>

      {activeTab === 'monetary' ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-semibold text-stone-800 mb-6">Make a Financial Gift</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[10, 25, 50, 100, 250, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-3.5 rounded-2xl font-semibold border-2 transition-all ${
                    amount === val 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                      : 'bg-white border-stone-100 text-stone-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-stone-700 mb-2">Custom Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-medium">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3.5 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold text-lg bg-stone-50 hover:bg-stone-100 transition-colors"
                />
              </div>
            </div>

            {donationSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-in fade-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-800 text-lg">Thank you for your gift!</h4>
                <p className="text-emerald-700 text-sm font-medium">
                  Your ${amount} donation will provide approximately ${(amount * 6).toLocaleString()} in food and services. A confirmation receipt will be sent to your email.
                </p>
                <button
                  onClick={() => setDonationSubmitted(false)}
                  className="text-emerald-700 text-sm font-medium hover:underline flex items-center gap-1 mx-auto mt-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Make another donation
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDonationSubmitted(true)}
                className="w-full bg-emerald-700 text-white font-medium py-4 rounded-2xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Heart className="w-5 h-5" />
                Donate ${amount}
              </button>
            )}
          </div>

          <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 flex flex-col justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Utensils className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-emerald-800 mb-3">Donation Calculator</h3>
            <p className="text-emerald-700 mb-8 font-medium">
              Because of our wholesale purchasing power, every $1 donated helps provide $6 in food and services to neighbors in need.
            </p>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100">
              <span className="block text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">You will provide</span>
              <span className="block text-6xl font-black text-emerald-600 tracking-tight">${(amount * 6).toLocaleString()}</span>
              <span className="block text-xl font-semibold text-stone-600 mt-2">in Food & Services</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-semibold text-stone-800 mb-4">Log a Food Donation</h3>
            <p className="text-stone-600 mb-8 text-sm font-medium">
              Did you drop off food at a partner pantry or host a food drive? Log it here to track your impact and get a receipt for your records.
            </p>
            
            {foodDonationSubmitted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 mb-6 animate-in fade-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-800 text-lg">Donation recorded!</h4>
                <p className="text-emerald-700 text-sm font-medium">
                  Thank you for your food donation. Your contribution makes a real difference in our community.
                </p>
                <button
                  onClick={() => { setFoodDonationSubmitted(false); setPhoto(null); }}
                  className="text-emerald-700 text-sm font-medium hover:underline flex items-center gap-1 mx-auto mt-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Log another donation
                </button>
              </div>
            )}
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmittingFood(true);
              try {
                await addDoc(collection(db, 'donations'), {
                  type: 'food',
                  location: foodLocation,
                  weightLbs: Number(foodWeight),
                  status: 'pending',
                  createdAt: serverTimestamp(),
                });
                setFoodDonationSubmitted(true);
                setFoodLocation('');
                setFoodWeight('');
              } catch (err) {
                console.error('Error saving food donation:', err);
              } finally {
                setIsSubmittingFood(false);
              }
            }} style={{ display: foodDonationSubmitted ? 'none' : undefined }}>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Drop-off Location</label>
                <select
                  value={foodLocation}
                  onChange={(e) => setFoodLocation(e.target.value)}
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <option value="">Select a location...</option>
                  <option value="hq">access-to-food HQ</option>
                  <option value="partner">Partner Agency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Estimated Weight (lbs)</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  min="1"
                  required
                  value={foodWeight}
                  onChange={(e) => setFoodWeight(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50 hover:bg-stone-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Scan Receipt or Photo (Optional)</label>
                <p className="text-xs text-stone-500 mb-3">Upload a photo of your donation receipt or the food items.</p>
                
                {photo ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 aspect-video flex items-center justify-center">
                    <img src={photo} alt="Donation receipt" className="max-h-full object-contain" />
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
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-stone-200 hover:bg-stone-50 hover:border-emerald-400'
                    }`}
                  >
                    <Camera className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-emerald-600' : 'text-stone-300'}`} />
                    <span className={`text-sm font-medium ${isDragging ? 'text-emerald-800' : 'text-emerald-700'}`}>
                      {isDragging ? 'Drop receipt here' : 'Tap to scan receipt'}
                    </span>
                    <span className="text-xs text-stone-500 block mt-1">
                      {isDragging ? 'Release to upload' : 'or drag and drop a photo'}
                    </span>
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

              <button type="submit" disabled={isSubmittingFood} className="w-full bg-emerald-700 text-white font-medium py-4 rounded-2xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 mt-8 shadow-sm disabled:opacity-50">
                {isSubmittingFood ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isSubmittingFood ? 'Submitting...' : 'Submit Donation Record'}
              </button>
            </form>
          </div>

          <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Calculator className="w-12 h-12 text-amber-600 mb-6" />
            <h3 className="text-2xl font-bold text-amber-800 mb-3">Food Drive Calculator</h3>
            <p className="text-amber-700 mb-8 text-sm font-medium">
              Planning a food drive? Estimate how many items you can collect based on your participants.
            </p>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Number of Participants
                </label>
                <input 
                  type="number" 
                  value={participants}
                  onChange={(e) => setParticipants(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Items per Participant
                </label>
                <input 
                  type="number" 
                  value={itemsPerParticipant}
                  onChange={(e) => setItemsPerParticipant(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-amber-200 text-center">
              <span className="block text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Estimated Collection</span>
              <span className="block text-6xl font-black text-amber-600 tracking-tight">{estimatedItems.toLocaleString()}</span>
              <span className="block text-xl font-semibold text-stone-600 mt-2">Items</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
