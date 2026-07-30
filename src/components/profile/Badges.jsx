import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BADGE_DEFINITIONS, getEarnedBadges } from '@/lib/questBadges';
import {
  Sparkles, Flame, Compass, Target, Calendar, Trophy, Crown, Lock, Award,
} from 'lucide-react';

const ICON_MAP = { Sparkles, Flame, Compass, Target, Calendar, Trophy, Crown };

export default function Badges({ account }) {
  const [earnedKeys, setEarnedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const records = await base44.entities.QuestProgress.filter({ address: account });
        if (!active) return;
        const earned = getEarnedBadges(records);
        setEarnedKeys(new Set(earned.map((b) => b.key)));
      } catch (e) {
        console.error('Failed to load badges', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [account]);

  const earnedCount = earnedKeys.size;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-fuchsia-600" />
          Achievement Badges
        </h3>
        <span className="text-xs font-mono text-slate-400">
          {earnedCount}/{BADGE_DEFINITIONS.length}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-fuchsia-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGE_DEFINITIONS.map((badge) => {
              const earned = earnedKeys.has(badge.key);
              const Icon = ICON_MAP[badge.icon] || Target;
              return (
                <div
                  key={badge.key}
                  title={`${badge.title} — ${badge.description}`}
                  className={`relative rounded-xl p-3 text-center transition-all ${
                    earned
                      ? 'bg-gradient-to-br ' + badge.color + ' shadow-md'
                      : 'bg-slate-50 border border-slate-100'
                  }`}
                >
                  <div
                    className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      earned ? 'bg-white/20' : 'bg-slate-100'
                    }`}
                  >
                    {earned ? (
                      <Icon className="w-5 h-5 text-white" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      earned ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {badge.title}
                  </p>
                </div>
              );
            })}
          </div>

          {earnedCount === 0 && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Complete daily quests and build streaks to unlock badges.
            </p>
          )}
        </>
      )}
    </div>
  );
}