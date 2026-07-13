import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePageMeta } from '../lib/usePageMeta';
import { Gamepad2, Trophy, Timer, AlertTriangle, CheckCircle2, XCircle, Loader2, RotateCcw, Users, Flag } from 'lucide-react';
import {
  sortshiftEnabled, startShift, submitScore, submitMisses, fetchLeaderboard,
  SortShiftError, type LeaderboardRow, type Miss,
} from '../lib/sortshift';

// ── Game tuning ───────────────────────────────────────────────────────────────
// The backend rejects shifts shorter than 55s, so the shift must run longer
// than that. Meals are derived as round(lbs / 1.2) to satisfy the server's
// plausibility check (~1.2 lbs per meal).
const SHIFT_SECONDS = 75;
const ITEM_SECONDS = 6;
const LBS_PER_MEAL = 1.2;
const SPOILED_CHANCE = 0.2;

type Category = 'produce' | 'protein' | 'pantry';
type Bin = Category | 'discard';

interface FoodItem {
  name: string;
  emoji: string;
  category: Category;
  lbs: number;
}

const ITEM_POOL: FoodItem[] = [
  { name: 'Apples', emoji: '🍎', category: 'produce', lbs: 3 },
  { name: 'Bananas', emoji: '🍌', category: 'produce', lbs: 2 },
  { name: 'Carrots', emoji: '🥕', category: 'produce', lbs: 2 },
  { name: 'Potatoes', emoji: '🥔', category: 'produce', lbs: 5 },
  { name: 'Lettuce', emoji: '🥬', category: 'produce', lbs: 1 },
  { name: 'Oranges', emoji: '🍊', category: 'produce', lbs: 4 },
  { name: 'Tomatoes', emoji: '🍅', category: 'produce', lbs: 2 },
  { name: 'Canned Tuna', emoji: '🐟', category: 'protein', lbs: 1 },
  { name: 'Peanut Butter', emoji: '🥜', category: 'protein', lbs: 2 },
  { name: 'Dried Beans', emoji: '🫘', category: 'protein', lbs: 2 },
  { name: 'Eggs', emoji: '🥚', category: 'protein', lbs: 2 },
  { name: 'Canned Chicken', emoji: '🍗', category: 'protein', lbs: 1 },
  { name: 'Ground Turkey', emoji: '🦃', category: 'protein', lbs: 3 },
  { name: 'Rice', emoji: '🍚', category: 'pantry', lbs: 5 },
  { name: 'Pasta', emoji: '🍝', category: 'pantry', lbs: 2 },
  { name: 'Cereal', emoji: '🥣', category: 'pantry', lbs: 1 },
  { name: 'Canned Soup', emoji: '🥫', category: 'pantry', lbs: 1 },
  { name: 'Flour', emoji: '🌾', category: 'pantry', lbs: 5 },
  { name: 'Oats', emoji: '🥛', category: 'pantry', lbs: 3 },
  { name: 'Canned Corn', emoji: '🌽', category: 'pantry', lbs: 1 },
];

const BINS: { id: Bin; label: string; emoji: string; classes: string }[] = [
  { id: 'produce', label: 'Produce', emoji: '🥦', classes: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-800' },
  { id: 'protein', label: 'Protein', emoji: '🍗', classes: 'bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-800' },
  { id: 'pantry', label: 'Pantry', emoji: '🥫', classes: 'bg-sky-50 border-sky-200 hover:border-sky-400 text-sky-800' },
  { id: 'discard', label: 'Discard', emoji: '🗑️', classes: 'bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-800' },
];

interface ActiveItem extends FoodItem {
  spoiled: boolean;
}

type Phase = 'intro' | 'playing' | 'finished' | 'posted';

function randomItem(): ActiveItem {
  const base = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
  return { ...base, spoiled: Math.random() < SPOILED_CHANCE };
}

export default function SortShift() {
  usePageMeta('Sort the Shift');
  const [phase, setPhase] = useState<Phase>('intro');
  const [teamCode, setTeamCode] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState(!sortshiftEnabled);
  const [startError, setStartError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(SHIFT_SECONDS);
  const [itemTimeLeft, setItemTimeLeft] = useState(ITEM_SECONDS);
  const [item, setItem] = useState<ActiveItem | null>(null);
  const [lbs, setLbs] = useState(0);
  const [flagged, setFlagged] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [missed, setMissed] = useState(0);
  const [feedback, setFeedback] = useState<{ good: boolean; text: string } | null>(null);
  const missesRef = useRef<Map<string, number>>(new Map());

  const [initials, setInitials] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[] | null>(null);
  const [leaderboardScope, setLeaderboardScope] = useState('global');

  const meals = Math.round(lbs / LBS_PER_MEAL);

  const loadLeaderboard = async (code?: string) => {
    if (!sortshiftEnabled) return;
    try {
      const res = await fetchLeaderboard(code);
      setLeaderboard(res.rows);
      setLeaderboardScope(res.scope);
    } catch {
      setLeaderboard(null);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Shift countdown
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('finished');
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  // Per-item countdown: letting an item sit too long counts as a timeout miss.
  useEffect(() => {
    if (phase !== 'playing' || !item) return;
    if (itemTimeLeft <= 0) {
      recordMiss(item.spoiled ? 'discard' : item.category, 'timeout');
      setMissed((m) => m + 1);
      setFeedback({ good: false, text: 'Too slow — item moved on!' });
      nextItem();
      return;
    }
    const t = setTimeout(() => setItemTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, item, itemTimeLeft]);

  const recordMiss = (actual: string, chosen: string) => {
    const key = `${actual}#${chosen}`;
    missesRef.current.set(key, (missesRef.current.get(key) ?? 0) + 1);
  };

  const nextItem = () => {
    setItem(randomItem());
    setItemTimeLeft(ITEM_SECONDS);
  };

  const handleStart = async () => {
    setStartError(null);
    const code = teamCode.trim().toUpperCase();
    if (code && !/^[A-Z0-9]{3,8}$/.test(code)) {
      setStartError('Team codes are 3-8 letters/numbers.');
      return;
    }

    let practice = !sortshiftEnabled;
    if (sortshiftEnabled) {
      try {
        const res = code ? await startShift('team', code) : await startShift('solo');
        setToken(res.token);
      } catch (err) {
        if (err instanceof SortShiftError && err.code === 'invalid_event_code') {
          setStartError(err.message);
          return;
        }
        practice = true; // backend unreachable — fall back to practice mode
      }
    }
    setPracticeMode(practice);

    missesRef.current = new Map();
    setLbs(0);
    setFlagged(0);
    setSorted(0);
    setMissed(0);
    setFeedback(null);
    setPostError(null);
    setInitials('');
    setTimeLeft(SHIFT_SECONDS);
    nextItem();
    setPhase('playing');
  };

  const handleSort = (bin: Bin) => {
    if (!item) return;
    const correctBin: Bin = item.spoiled ? 'discard' : item.category;
    if (bin === correctBin) {
      setSorted((s) => s + 1);
      if (item.spoiled) {
        setFlagged((f) => f + 1);
        setFeedback({ good: true, text: `Good catch — spoiled ${item.name.toLowerCase()} flagged!` });
      } else {
        setLbs((w) => w + item.lbs);
        setFeedback({ good: true, text: `+${item.lbs} lbs to ${bin}!` });
      }
    } else {
      setMissed((m) => m + 1);
      recordMiss(correctBin, bin);
      setFeedback({
        good: false,
        text: item.spoiled ? `That ${item.name.toLowerCase()} was spoiled — it belongs in Discard.` : `${item.name} belongs in ${correctBin}.`,
      });
    }
    nextItem();
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const clean = initials.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    if (!/^[A-Z]{1,3}$/.test(clean)) {
      setPostError('Initials must be 1-3 letters.');
      return;
    }
    setIsPosting(true);
    setPostError(null);
    try {
      const missBatch: Miss[] = Array.from(missesRef.current, ([key, n]) => {
        const [actual, chosen] = key.split('#');
        return { actual, chosen, n };
      });
      await submitMisses(token, missBatch);
      await submitScore({ token, initials: clean, meals, lbs, flagged });
      setPhase('posted');
      await loadLeaderboard(teamCode.trim() ? teamCode.trim().toUpperCase() : undefined);
    } catch (err) {
      setPostError(err instanceof SortShiftError ? err.message : 'Could not post your score. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const accuracy = sorted + missed > 0 ? Math.round((sorted / (sorted + missed)) * 100) : 0;

  const stats = useMemo(() => ([
    { label: 'Meals provided', value: meals },
    { label: 'Pounds sorted', value: `${lbs} lbs` },
    { label: 'Spoiled flagged', value: flagged },
    { label: 'Accuracy', value: `${accuracy}%` },
  ]), [meals, lbs, flagged, accuracy]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2 flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-emerald-600" />
          Sort the Shift
        </h1>
        <p className="text-stone-600 font-medium">
          Work a simulated food bank shift: sort incoming donations into the right bins, flag spoiled items, and rack up meals for the community.
        </p>
      </div>

      {practiceMode && phase !== 'intro' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 font-medium">Practice mode — the game server is not connected, so scores won't post to the leaderboard.</p>
        </div>
      )}

      {phase === 'intro' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
            <h3 className="text-xl font-semibold text-stone-800">How it works</h3>
            <ul className="space-y-3 text-stone-600 font-medium text-sm">
              <li className="flex gap-2"><Timer className="w-5 h-5 text-emerald-600 shrink-0" /> Your shift lasts {SHIFT_SECONDS} seconds — sort each item before it moves on.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> Correct sorts add pounds; every ~{LBS_PER_MEAL} lbs is a meal for a neighbor.</li>
              <li className="flex gap-2"><Flag className="w-5 h-5 text-emerald-600 shrink-0" /> Spoiled or damaged items must go to Discard — flagging them protects families.</li>
              <li className="flex gap-2"><Trophy className="w-5 h-5 text-emerald-600 shrink-0" /> Post your score with your initials and climb the leaderboard.</li>
            </ul>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-400" /> Team event code (optional)
              </label>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="e.g. ACME7"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono tracking-widest"
              />
            </div>
            {startError && (
              <p className="text-sm text-rose-600 font-medium flex items-center gap-2"><XCircle className="w-4 h-4" />{startError}</p>
            )}
            <button
              onClick={handleStart}
              className="w-full bg-emerald-700 text-white font-semibold py-4 rounded-2xl hover:bg-emerald-800 transition-colors shadow-sm"
            >
              Start Shift
            </button>
            {!sortshiftEnabled && (
              <p className="text-xs text-stone-400 font-medium">Game server not configured (VITE_SORTSHIFT_API_URL) — you'll play in practice mode.</p>
            )}
          </div>

          <Leaderboard rows={leaderboard} scope={leaderboardScope} />
        </div>
      )}

      {phase === 'playing' && item && (
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-700 font-bold text-lg">
              <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`} />
              {timeLeft}s
            </div>
            <div className="flex gap-4 text-sm font-semibold text-stone-600">
              <span>{lbs} lbs</span>
              <span>{meals} meals</span>
              <span className="flex items-center gap-1"><Flag className="w-4 h-4 text-rose-500" />{flagged}</span>
            </div>
          </div>

          <div className="relative">
            <div className={`mx-auto max-w-sm text-center rounded-3xl border-2 p-8 transition-colors ${item.spoiled ? 'border-rose-200 bg-rose-50/40' : 'border-stone-200 bg-stone-50'}`}>
              <div className="text-7xl mb-4" aria-hidden>{item.emoji}</div>
              <div className="text-2xl font-bold text-stone-800">{item.name}</div>
              <div className="text-stone-500 font-medium mt-1">{item.lbs} lbs</div>
              {item.spoiled && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> Looks spoiled / damaged
                </div>
              )}
              <div className="mt-4 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(itemTimeLeft / ITEM_SECONDS) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BINS.map((bin) => (
              <button
                key={bin.id}
                onClick={() => handleSort(bin.id)}
                className={`rounded-2xl border-2 p-4 font-bold transition-all active:scale-95 ${bin.classes}`}
              >
                <span className="block text-3xl mb-1" aria-hidden>{bin.emoji}</span>
                {bin.label}
              </button>
            ))}
          </div>

          <div className="h-6 text-center">
            {feedback && (
              <p className={`text-sm font-semibold ${feedback.good ? 'text-emerald-600' : 'text-rose-600'}`}>{feedback.text}</p>
            )}
          </div>
        </div>
      )}

      {(phase === 'finished' || phase === 'posted') && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
            <h3 className="text-xl font-semibold text-stone-800">Shift complete!</h3>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                  <div className="text-2xl font-bold text-emerald-700">{s.value}</div>
                  <div className="text-xs font-medium text-stone-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {phase === 'finished' && !practiceMode && token && (
              <form onSubmit={handlePost} className="space-y-3">
                <label className="block text-sm font-medium text-stone-700">Post to leaderboard as (1-3 initials)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                    maxLength={3}
                    placeholder="ABC"
                    className="w-28 border border-stone-200 rounded-xl px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-mono text-lg tracking-[0.3em]"
                  />
                  <button
                    type="submit"
                    disabled={isPosting || initials.length === 0}
                    className="flex-1 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
                    Post Score
                  </button>
                </div>
                {postError && <p className="text-sm text-rose-600 font-medium">{postError}</p>}
              </form>
            )}

            {phase === 'posted' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Score posted to the leaderboard!</span>
              </div>
            )}

            <button
              onClick={() => { setPhase('intro'); loadLeaderboard(); }}
              className="w-full bg-stone-100 text-stone-700 font-semibold py-3.5 rounded-2xl hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>

          <Leaderboard rows={leaderboard} scope={leaderboardScope} />
        </div>
      )}
    </div>
  );
}

function Leaderboard({ rows, scope }: { rows: LeaderboardRow[] | null; scope: string }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <h3 className="text-xl font-semibold text-stone-800 mb-6 flex items-center gap-3">
        <Trophy className="w-6 h-6 text-amber-500" />
        Leaderboard <span className="text-sm font-medium text-stone-400 capitalize">({scope})</span>
      </h3>
      {!sortshiftEnabled ? (
        <p className="text-stone-400 font-medium text-sm py-8 text-center">Leaderboard unavailable — the game server is not configured.</p>
      ) : rows === null ? (
        <p className="text-stone-400 font-medium text-sm py-8 text-center">Could not load the leaderboard right now.</p>
      ) : rows.length === 0 ? (
        <p className="text-stone-400 font-medium text-sm py-8 text-center">No scores yet — be the first on the board!</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => (
            <li key={`${row.initials}-${row.ts}-${i}`} className="flex items-center gap-4 bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-stone-200 text-stone-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-stone-400 border border-stone-200'}`}>{i + 1}</span>
              <span className="font-mono font-bold text-stone-800 tracking-widest">{row.initials}</span>
              <span className="ml-auto font-semibold text-emerald-700">{row.meals} meals</span>
              {row.flagged > 0 && (
                <span className="text-xs font-medium text-rose-500 flex items-center gap-1"><Flag className="w-3 h-3" />{row.flagged}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
