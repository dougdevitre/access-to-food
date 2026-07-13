import React, { useState, useRef, useEffect } from 'react';
import { usePageMeta } from '../lib/usePageMeta';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, PackageSearch, AlertTriangle, Info, Save } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ApiError, getConfigured, postJson } from '../lib/api';

// Phone photos routinely exceed Vercel's 4.5 MB request-body limit, so images
// are downscaled on a canvas before upload. Shelf photos don't need more
// resolution than this for category/stock analysis.
const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.85;

interface InventoryItem {
  category: string;
  stockLevel: 'High' | 'Medium' | 'Low' | 'Empty';
  estimatedItemCount?: number;
  criticalShortage: boolean;
  recommendedAction: string;
  notes?: string;
}

export default function Scanner() {
  usePageMeta('Inventory Scanner');
  const [photo, setPhoto] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<InventoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // null = backend availability unknown (still checking, or unreachable)
  const [configured, setConfigured] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getConfigured('/api/scan').then(setConfigured);
  }, []);

  // Downscale to MAX_IMAGE_EDGE on the long side and re-encode as JPEG. Falls
  // back to the original data URL for anything the canvas can't decode.
  const downscaleImage = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
        if (scale === 1) {
          resolve(dataUrl);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = await downscaleImage(reader.result as string);
      setPhoto(result);

      // Extract base64 data and mime type
      const match = result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        setMimeType(match[1]);
        setBase64Data(match[2]);
      }

      setResults(null);
      setError(null);
      setSaveSuccess(false);
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

  const analyzeImage = async () => {
    if (!base64Data || !mimeType) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // The analysis prompt, model, and parsing live in api/scan.ts.
      const response = await postJson<{ items: InventoryItem[] }>('/api/scan', { mimeType, base64Data });
      setResults(response.items);
    } catch (err) {
      console.error("Error analyzing image:", err);
      if (err instanceof ApiError && err.code === 'not_configured') {
        setConfigured(false);
        setError('The AI backend is not configured on the server yet.');
      } else if (err instanceof ApiError && err.code === 'image_too_large') {
        setError('This image is too large to analyze. Please try a smaller photo.');
      } else {
        setError("Failed to analyze the image. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStockColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Empty': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Inventory Scanner</h1>
        <p className="text-stone-600 font-medium">Scan pantry shelves to automatically detect food categories and estimate stock levels.</p>
      </div>

      {configured === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Scanner Unavailable</p>
            <p className="text-sm text-amber-700 mt-1">The AI backend is not configured yet. A site administrator needs to set the <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">ANTHROPIC_API_KEY</code> environment variable on the server.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">
          <h3 className="text-xl font-semibold text-stone-800 mb-6 flex items-center gap-3">
            <Camera className="w-6 h-6 text-emerald-600" />
            Capture Shelves
          </h3>

          <div className="flex-1 flex flex-col">
            {photo ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 aspect-[4/3] flex items-center justify-center mb-6">
                <img src={photo} alt="Pantry shelf" className="max-h-full object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setBase64Data(null);
                    setMimeType(null);
                    setResults(null);
                  }}
                  className="absolute top-3 right-3 bg-stone-900/60 text-white px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-md hover:bg-stone-900/80 transition-colors"
                >
                  Retake
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 min-h-[300px] border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all mb-6 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-stone-200 hover:bg-stone-50 hover:border-emerald-400'
                }`}
              >
                <div className={`p-5 rounded-full mb-5 ${isDragging ? 'bg-emerald-100' : 'bg-emerald-50'}`}>
                  <Camera className={`w-10 h-10 ${isDragging ? 'text-emerald-700' : 'text-emerald-600'}`} />
                </div>
                <span className="text-lg font-semibold text-stone-800 mb-1">
                  {isDragging ? 'Drop photo here' : 'Tap to open camera'}
                </span>
                <span className="text-sm text-stone-500 font-medium">
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

            <button
              onClick={analyzeImage}
              disabled={!photo || isAnalyzing || configured === false}
              className="w-full bg-emerald-700 text-white font-medium py-4 rounded-2xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-auto shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Shelves...
                </>
              ) : (
                <>
                  <PackageSearch className="w-5 h-5" />
                  Analyze Inventory
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">
          <h3 className="text-xl font-semibold text-stone-800 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Analysis Results
          </h3>

          <div className="flex-1 overflow-y-auto">
            {!photo && !results && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 py-16">
                <PackageSearch className="w-16 h-16 opacity-20" />
                <p className="font-medium">Take a photo to see inventory analysis</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-emerald-600 space-y-5 py-16">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="font-semibold animate-pulse text-lg">AI is scanning the shelves...</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 text-rose-700 p-5 rounded-2xl flex items-start gap-3 border border-rose-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {results.length === 0 ? (
                  <p className="text-stone-500 text-center py-10 font-medium">No food items detected in this image.</p>
                ) : (
                  results.map((item, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border ${item.criticalShortage ? 'border-rose-200 bg-rose-50/30' : 'border-stone-200 bg-stone-50'} shadow-sm`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-800 text-lg">{item.category}</h4>
                          {item.criticalShortage && (
                            <span className="flex items-center gap-1 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Critical
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getStockColor(item.stockLevel)}`}>
                          {item.stockLevel} Stock
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {item.estimatedItemCount !== undefined && (
                          <div className="bg-white p-2.5 rounded-xl border border-stone-100">
                            <span className="text-xs text-stone-500 block mb-0.5 font-medium">Est. Count</span>
                            <span className="font-semibold text-stone-800">{item.estimatedItemCount} items</span>
                          </div>
                        )}
                        <div className="bg-white p-2.5 rounded-xl border border-stone-100 col-span-2 sm:col-span-1">
                          <span className="text-xs text-stone-500 block mb-0.5 font-medium">Action</span>
                          <span className="font-semibold text-stone-800 text-sm">{item.recommendedAction}</span>
                        </div>
                      </div>

                      {item.notes && (
                        <div className="flex gap-2 items-start mt-3 pt-3 border-t border-stone-200/60">
                          <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-stone-600 font-medium leading-relaxed">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}

                <div className="pt-6 mt-6 border-t border-stone-100">
                  {saveSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center flex items-center justify-center gap-2 animate-in fade-in duration-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-800">Saved to inventory database</span>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!results) return;
                        setIsSaving(true);
                        try {
                          await addDoc(collection(db, 'inventory_scans'), {
                            items: results,
                            scannedAt: serverTimestamp(),
                            totalCategories: results.length,
                            criticalCount: results.filter(r => r.criticalShortage).length,
                          });
                          setSaveSuccess(true);
                        } catch (err) {
                          console.error('Error saving scan:', err);
                          setError('Failed to save results. Please try again.');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                      className="w-full bg-stone-100 text-stone-700 font-semibold py-4 rounded-2xl hover:bg-stone-200 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save to Database
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
