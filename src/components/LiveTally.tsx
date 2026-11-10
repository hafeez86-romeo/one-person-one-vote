import React from 'react';
import {
  BarChart3,
  Users,
  Vote,
  Trophy,
  RefreshCw,
  TrendingUp,
  Percent,
  CheckCircle,
} from 'lucide-react';
import { ElectionTally } from '../types';

interface LiveTallyProps {
  tally: ElectionTally | null;
  isLoading: boolean;
  onRefresh: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
}

export const LiveTally: React.FC<LiveTallyProps> = ({
  tally,
  isLoading,
  onRefresh,
  autoRefresh,
  setAutoRefresh,
}) => {
  if (!tally) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        Loading live tally data from MongoDB...
      </div>
    );
  }

  const leader = tally.candidateResults.length > 0 && tally.candidateResults[0].votes > 0
    ? tally.candidateResults[0]
    : null;

  return (
    <div className="space-y-8">
      {/* HEADER & AUTO-REFRESH CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Real-Time Electoral Tally & Analytics</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Certified Election Results
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized directly from the MongoDB anonymous ballot repository.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 focus:outline-none"
            />
            <span>Auto-refresh (3s)</span>
          </label>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Ballots Cast</span>
            <Vote className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {tally.totalVotes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Recorded in MongoDB
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Registered Voters</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {tally.registeredVoters}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Verified on Electoral Roll
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Turnout Rate</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {tally.turnoutPercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Of total electorate
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Remaining Eligible</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-200 font-mono tabular-nums">
            {tally.remainingVoters}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Yet to exercise vote
          </div>
        </div>
      </div>

      {/* LEADER SPOTLIGHT (IF VOTES EXIST) */}
      {leader && (
        <div className="bg-indigo-950/20 border border-indigo-500/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-indigo-500/40 shrink-0 bg-slate-800">
              {leader.avatarUrl ? (
                <img
                  src={leader.avatarUrl}
                  alt={leader.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                  {leader.symbol}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Current Front-Runner
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">{leader.party}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {leader.name}
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xl font-extrabold text-white font-mono tabular-nums">
              {leader.votes} votes ({leader.percentage}%)
            </div>
            <div className="text-xs text-emerald-400 flex items-center sm:justify-end gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Leading by margin</span>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CANDIDATE BREAKDOWN BARS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-white tracking-tight">
          Candidate Standing & Vote Share
        </h3>

        <div className="space-y-6">
          {tally.candidateResults.map((candidate, idx) => (
            <div key={candidate.id} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 font-semibold w-4">
                    #{idx + 1}
                  </span>
                  <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    {candidate.avatarUrl ? (
                      <img
                        src={candidate.avatarUrl}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xs flex items-center justify-center h-full">
                        {candidate.symbol}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-white font-bold text-sm">
                      {candidate.name}
                    </span>
                    <span className="text-slate-400 ml-2 hidden sm:inline">
                      {candidate.party}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-white font-bold text-sm tabular-nums">
                    {candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'}
                  </span>
                  <span className="text-slate-400 tabular-nums">
                    ({candidate.percentage}%)
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(candidate.percentage, 1)}%`,
                    backgroundColor: candidate.color || '#6366F1',
                  }}
                />
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{candidate.bio}</span>
                <span className="font-mono text-slate-400">ID: {candidate.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
