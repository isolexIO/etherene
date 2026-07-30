import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';
import {
  Target, CheckCircle2, Circle, Lock, ArrowRight, Sparkles, Calendar,
  Flame, Zap, Radio, Sparkle, BookOpen, Compass, Cpu, Network, Eye,
  KeyRound, ScrollText, Trophy, Loader2, Wallet
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/components/utils';
import moment from 'moment';

// ── Quest pool ──────────────────────────────────────────────────────────────
// Each quest teaches a core Etherene concept and links to the platform feature
// where the user can experience it firsthand.
const QUEST_POOL = [
  {
    key: 'sovereignty-keys',
    concept: 'Sovereignty',
    icon: Lock,
    color: 'from-cyan-500 to-blue-500',
    title: 'Guard Your Private Keys',
    description:
      'In Etherene, no central authority holds your identity. Your wallet keys ARE your sovereignty — lose them and no support desk can recover you. Open your Identity to see how your self-sovereign profile is anchored to your wallet, not a database.',
    actionLabel: 'Open Identity',
    actionLink: 'Profile',
  },
  {
    key: 'declare-identity',
    concept: 'Identity',
    icon: KeyRound,
    color: 'from-fuchsia-500 to-purple-500',
    title: 'Declare Your Node Name',
    description:
      'Every participant mints an SNS subdomain — a name like node-123.etherene.sol — that replaces a raw address with a sovereign identity. Visit your profile and review how your on-chain name is derived from your wallet.',
    actionLabel: 'View Profile',
    actionLink: 'Profile',
  },
  {
    key: 'transmit-insight',
    concept: 'Transmissions',
    icon: Radio,
    color: 'from-emerald-500 to-teal-500',
    title: 'Broadcast a Transmission',
    description:
      'The Agora is the Etherene public square. Transmissions are immutable broadcasts — insights, questions, or proposals — signed by your wallet and visible to the whole network. Share one thought to add your signal to the chain.',
    actionLabel: 'Enter the Agora',
    actionLink: 'Agora',
  },
  {
    key: 'resonate-comment',
    concept: 'Resonance',
    icon: Sparkle,
    color: 'from-pink-500 to-rose-500',
    title: 'Resonate With a Signal',
    description:
      'Resonance is Etherene\'s word for reply. When you resonate, you amplify another node\'s transmission with your own perspective — building consensus through conversation, not authority. Find a transmission and add your resonance.',
    actionLabel: 'Browse Transmissions',
    actionLink: 'Agora',
  },
  {
    key: 'ask-oracle',
    concept: 'The Oracle',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-500',
    title: 'Consult the Oracle',
    description:
      'The Oracle is Etherene\'s AI sage — a protocol-level intelligence that answers questions through the lens of the manifesto. Ask it anything about sovereignty, consensus, or the network to receive guidance shaped by the founding principles.',
    actionLabel: 'Ask the Oracle',
    actionLink: 'Oracle',
  },
  {
    key: 'read-manifesto',
    concept: 'The Manifesto',
    icon: ScrollText,
    color: 'from-indigo-500 to-violet-500',
    title: 'Read the Founding Manifesto',
    description:
      'The Etherene White Paper is the protocol\'s philosophical foundation — a treatise on self-sovereign digital existence. Read at least one chapter to understand why identity, consensus, and immutability matter in a trustless world.',
    actionLabel: 'Open White Paper',
    actionLink: 'Whitepaper',
  },
  {
    key: 'explore-blocks',
    concept: 'Transparency',
    icon: Compass,
    color: 'from-sky-500 to-cyan-500',
    title: 'Explore the Living Chain',
    description:
      'The Block Explorer reveals the network in real time — blocks, transactions, active nodes, and identities. Transparency is a pillar of Etherene: every action is publicly verifiable. Open the explorer and witness the chain growing.',
    actionLabel: 'Open Explorer',
    actionLink: 'BlockExplorer',
  },
  {
    key: 'daily-lesson',
    concept: 'Daily Practice',
    icon: BookOpen,
    color: 'from-violet-500 to-purple-500',
    title: 'Receive Today\'s Lesson',
    description:
      'Each day the Oracle generates a Daily Lesson grounded in a manifesto principle — a short philosophical download with a micro-action. Reading it upgrades your internal protocol and connects theory to practice.',
    actionLabel: 'Read Today\'s Lesson',
    actionLink: 'Lessons',
  },
  {
    key: 'study-principles',
    concept: 'Principles',
    icon: Network,
    color: 'from-blue-500 to-indigo-500',
    title: 'Study the Guiding Principles',
    description:
      'The Principles are the immutable rules of the Etherene protocol — the constitution the network runs on. Review them to understand the values every node agrees to uphold by participating.',
    actionLabel: 'View Principles',
    actionLink: 'Principles',
  },
  {
    key: 'enter-sanctum',
    concept: 'The Sanctum',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    title: 'Enter the Sanctum',
    description:
      'The Sanctum is Etherene\'s space for quiet reflection and daily ritual. In a world of noise, carving out intentional space is itself an act of sovereignty. Visit the Sanctum and take a moment to center yourself.',
    actionLabel: 'Enter Sanctum',
    actionLink: 'Sanctum',
  },
  {
    key: 'consensus-mechanics',
    concept: 'Consensus',
    icon: Cpu,
    color: 'from-teal-500 to-emerald-500',
    title: 'Understand Network Consensus',
    description:
      'Consensus is how decentralized nodes agree without a boss. In Etherene, resonance and amplification are social consensus mechanisms — signal rises through community, not top-down rules. Read the manifesto\'s consensus chapter to see how agreement emerges.',
    actionLabel: 'Read White Paper',
    actionLink: 'Whitepaper',
  },
  {
    key: 'amplify-signal',
    concept: 'Amplification',
    icon: Zap,
    color: 'from-yellow-500 to-amber-500',
    title: 'Amplify a Worthy Signal',
    description:
      'Amplification is Etherene\'s reputation mechanic — when you amplify a transmission, you stake your attention behind it. Find a transmission that resonates and amplify it to help valuable signal rise above the noise.',
    actionLabel: 'Find Transmissions',
    actionLink: 'Agora',
  },
  {
    key: 'genesis-block',
    concept: 'The Genesis',
    icon: Eye,
    color: 'from-slate-500 to-gray-600',
    title: 'Witness the Genesis Block',
    description:
      'Every chain begins with block zero — the Genesis — the origin point from which all state flows. Open the Block Explorer and find the genesis date and block height to understand where the Etherene network was born.',
    actionLabel: 'View Genesis',
    actionLink: 'BlockExplorer',
  },
  {
    key: 'follow-node',
    concept: 'Connection',
    icon: Trophy,
    color: 'from-rose-500 to-pink-500',
    title: 'Build Your Network',
    description:
      'Following other nodes lets you track their transmissions and be notified when they broadcast. Your network is your filter in a decentralized world — curate it intentionally. Find an active node in the Agora and follow it.',
    actionLabel: 'Browse Active Nodes',
    actionLink: 'Agora',
  },
];

const QUESTS_PER_DAY = 4;

// Deterministic daily quest selection — same quests for everyone on a given day
function getDailyQuests(dateStr) {
  const start = new Date(new Date(dateStr).getFullYear(), 0, 0);
  const diff = new Date(dateStr) - start;
  const dayIndex = Math.floor(diff / 86400000);

  // Seeded shuffle using dayIndex so the set rotates daily but is stable within a day
  const pool = [...QUEST_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (dayIndex * 7 + i * 13) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, QUESTS_PER_DAY).map((q, i) => ({
    ...q,
    dayPosition: i + 1,
  }));
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function DailyQuests() {
  const { publicKey, connected } = useWallet();
  const account = publicKey?.toBase58() || null;
  const today = getTodayStr();

  const dailyQuests = useMemo(() => getDailyQuests(today), [today]);

  const [completedKeys, setCompletedKeys] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  // Load today's progress + streak for the connected wallet
  useEffect(() => {
    if (!account) {
      setIsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const records = await base44.entities.QuestProgress.filter({
          address: account,
        });
        if (!active) return;
        const todayKeys = new Set(
          records
            .filter((r) => r.date === today && r.completed)
            .map((r) => r.quest_key)
        );
        setCompletedKeys(todayKeys);
        setTotalCompleted(
          new Set(records.filter((r) => r.completed).map((r) => r.date)).size
        );

        // Streak: consecutive days (ending today or yesterday) with >=1 completion
        const completedDates = new Set(
          records.filter((r) => r.completed).map((r) => r.date)
        );
        let s = 0;
        let cursor = moment.utc(today);
        // If nothing today, streak can still count if yesterday has activity
        if (!completedDates.has(cursor.format('YYYY-MM-DD'))) {
          cursor = cursor.subtract(1, 'day');
        }
        while (completedDates.has(cursor.format('YYYY-MM-DD'))) {
          s += 1;
          cursor = cursor.subtract(1, 'day');
        }
        setStreak(s);
      } catch (e) {
        console.error('Failed to load quest progress', e);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [account, today]);

  const toggleQuest = useCallback(
    async (quest) => {
      if (!account) return;
      const isComplete = completedKeys.has(quest.key);
      setToggling(quest.key);
      try {
        if (isComplete) {
          // Find and delete the record for this quest today
          const records = await base44.entities.QuestProgress.filter({
            address: account,
            date: today,
            quest_key: quest.key,
          });
          for (const r of records) {
            await base44.entities.QuestProgress.delete(r.id);
          }
          setCompletedKeys((prev) => {
            const next = new Set(prev);
            next.delete(quest.key);
            return next;
          });
        } else {
          await base44.entities.QuestProgress.create({
            address: account,
            date: today,
            quest_key: quest.key,
            completed: true,
          });
          setCompletedKeys((prev) => new Set(prev).add(quest.key));
        }
      } catch (e) {
        console.error('Failed to toggle quest', e);
      } finally {
        setToggling(null);
      }
    },
    [account, completedKeys, today]
  );

  const completedCount = completedKeys.size;
  const allDone = completedCount === dailyQuests.length && dailyQuests.length > 0;
  const progressPct = Math.round((completedCount / dailyQuests.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-fuchsia-500/20 mb-4">
          <Calendar className="w-4 h-4 text-fuchsia-500" />
          <span className="text-xs font-mono text-slate-600">
            {moment.utc(today).format('MMMM Do, YYYY')}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
          <Target className="w-8 h-8 text-fuchsia-600" />
          Daily Quests
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Auto-generated each day to guide you through the Etherene protocol.
          Complete them to deepen your understanding of sovereignty, consensus,
          and the network.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          icon={CheckCircle2}
          label="Today"
          value={`${completedCount}/${dailyQuests.length}`}
          color="text-emerald-600"
          bg="from-emerald-500/10 to-teal-500/10"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${streak}d`}
          color="text-orange-600"
          bg="from-orange-500/10 to-red-500/10"
        />
        <StatCard
          icon={Trophy}
          label="Active Days"
          value={`${totalCompleted}`}
          color="text-fuchsia-600"
          bg="from-fuchsia-500/10 to-purple-500/10"
        />
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Daily Progress</span>
          <span className="text-sm font-mono text-slate-500">{progressPct}%</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Wallet gate */}
      {!connected && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Connect your wallet to track progress</p>
            <p className="text-amber-700">
              Quests below are visible to everyone, but completing them is
              recorded against your sovereign identity.
            </p>
          </div>
        </div>
      )}

      {/* All-done celebration */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 p-6 text-white text-center shadow-lg shadow-fuchsia-500/30"
          >
            <Sparkles className="w-8 h-8 mx-auto mb-2" />
            <p className="text-lg font-bold">All quests complete!</p>
            <p className="text-white/90 text-sm">
              You've synced with the protocol today. See you tomorrow, node.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="w-8 h-8 text-fuchsia-600 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Generating today's quests…</p>
          </div>
        ) : (
          dailyQuests.map((quest, i) => {
            const Icon = quest.icon;
            const isComplete = completedKeys.has(quest.key);
            return (
              <motion.div
                key={quest.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border bg-white p-5 md:p-6 transition-all ${
                  isComplete
                    ? 'border-emerald-200 shadow-md shadow-emerald-100/50'
                    : 'border-slate-200 hover:border-fuchsia-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quest.color} flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Quest {quest.dayPosition}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {quest.concept}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1.5">
                      {quest.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      {quest.description}
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <Link
                        to={createPageUrl(quest.actionLink)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-fuchsia-600 hover:text-fuchsia-700 transition-colors"
                      >
                        {quest.actionLabel}
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      {/* Complete toggle */}
                      <button
                        onClick={() => toggleQuest(quest)}
                        disabled={!connected || toggling === quest.key}
                        className={`inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          isComplete
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : connected
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {toggling === quest.key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isComplete ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        {isComplete ? 'Complete' : 'Mark done'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-400 mt-10">
        Quests rotate daily and are the same for every node on the network —
        a shared curriculum for the Etherene protocol.
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-gradient-to-br ${bg} p-3 text-center`}>
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
        {label}
      </div>
    </div>
  );
}