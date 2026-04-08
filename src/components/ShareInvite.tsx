import { Share2, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ShareInviteProps {
  message?: string;
  context?: 'volunteer' | 'donate' | 'general' | 'food';
}

const SHARE_MESSAGES = {
  volunteer: "I just signed up to volunteer with access-to-food! Join me in fighting hunger in our community.",
  donate: "I just donated to access-to-food where every $1 provides $6 in food. Join me!",
  food: "access-to-food helped me find free food resources. If you or someone you know needs help, check it out.",
  general: "Check out access-to-food — a community hub for food resources, volunteering, and donations.",
};

export default function ShareInvite({ message, context = 'general' }: ShareInviteProps) {
  const [copied, setCopied] = useState(false);
  const shareText = message || SHARE_MESSAGES[context];
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'access-to-food',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-4">
      <h3 className="font-bold text-stone-800 text-lg">Spread the Word</h3>
      <p className="text-sm text-stone-600 font-medium max-w-sm mx-auto">
        Know someone who could use food resources or wants to help? Share this with them.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-800 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share access-to-food
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-white text-stone-700 border border-stone-200 px-6 py-3 rounded-xl font-medium hover:bg-stone-50 transition-colors"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
