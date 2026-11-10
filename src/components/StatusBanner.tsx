import React from 'react';
import { Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DatabaseStatus, Election, ElectionTally } from '../types';

interface StatusBannerProps {
  election: Election | null;
  tally: ElectionTally | null;
  dbStatus: DatabaseStatus | null;
  onOpenViva: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  election,
  tally,
  dbStatus,
  onOpenViva,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        {/* Left: Election Title & Category */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-200">
            {election?.title || 'One Person One Vote System'}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{election?.category || 'General Election'}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            OPOV Protocol Enforced
          </span>
        </div>

        {/* Right: MongoDB Connection Status & Turnout stats */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenViva}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Inspect MongoDB connection details and schemas"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              DB: {dbStatus?.provider === 'mongodb' ? 'MongoDB Atlas' : 'Persistent MongoDB Engine'}
            </span>
            <span className="text-slate-500 font-mono tabular-nums">
              ({dbStatus?.collections.voters || 0} voters, {dbStatus?.collections.ballots || 0} ballots)
            </span>
          </button>

          {tally && (
            <>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div className="flex items-center gap-1 text-slate-300">
                <span>Turnout:</span>
                <span className="font-mono tabular-nums font-semibold text-indigo-400">
                  {tally.turnoutPercentage}%
                </span>
                <span className="text-slate-500">
                  ({tally.totalVotes}/{tally.registeredVoters})
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
