import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  X,
  Lock,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Database,
  Flame,
} from 'lucide-react';
import { Voter, Election } from '../types';
import { api } from '../api';

interface DuplicateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: Election;
  voters: Voter[];
  onAuditUpdated: () => void;
}

export const DuplicateTestModal: React.FC<DuplicateTestModalProps> = ({
  isOpen,
  onClose,
  election,
  voters,
  onAuditUpdated,
}) => {
  if (!isOpen) return null;

  // Filter already voted voters or default
  const votedVoters = voters.filter(v => v.hasVoted);
  const [selectedVoterId, setSelectedVoterId] = useState<string>(
    votedVoters[0]?.voterId || voters[0]?.voterId || 'VOT-2026-108'
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand-02');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<{
    status: number;
    data: any;
    timestamp: string;
  } | null>(null);

  const selectedVoter = voters.find(v => v.voterId === selectedVoterId);
  const selectedCandidate = election.candidates.find(c => c.id === selectedCandidateId);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const res = await api.simulateDuplicateVote(election.id, selectedVoterId, selectedCandidateId);
      setSimulationResult({
        status: res.status,
        data: res.data,
        timestamp: new Date().toLocaleTimeString(),
      });
      onAuditUpdated();
    } catch (err: any) {
      setSimulationResult({
        status: 500,
        data: { error: err.message },
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Exam Defense & Security Test
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-400 font-mono">OPOV Invariant</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Duplicate Vote Attack Simulator
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Educational Overview for Exam Viva */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-2">
          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Viva Explanation: How does the system prevent duplicate votes?
          </p>
          <p>
            1. <strong>Atomic Lock in MongoDB</strong>: When a vote is cast, MongoDB executes an atomic update query conditional on <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">&#123; voterId, hasVoted: false &#125;</code>.
          </p>
          <p>
            2. <strong>Conflict Rejection (HTTP 409)</strong>: If the voter already has <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-300 font-mono">hasVoted: true</code>, the operation aborts immediately, locks out the duplicate ballot, records a critical security entry in the audit ledger, and returns a 409 Conflict status.
          </p>
        </div>

        {/* Configuration for Simulation */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Voter (Already Voted recommended):
              </label>
              <select
                value={selectedVoterId}
                onChange={e => setSelectedVoterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {voters.map(v => (
                  <option key={v.voterId} value={v.voterId}>
                    {v.name} ({v.voterId}) - {v.hasVoted ? '⚠️ Already Voted' : 'Eligible'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Candidate to Cast Duplicate Ballot For:
              </label>
              <select
                value={selectedCandidateId}
                onChange={e => setSelectedCandidateId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {election.candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.party})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedVoter && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Current Voter State:</span>{' '}
                <span className="text-white font-semibold">{selectedVoter.name}</span>{' '}
                <span className="font-mono text-slate-400">({selectedVoter.voterId})</span>
              </div>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  selectedVoter.hasVoted
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                }`}
              >
                {selectedVoter.hasVoted ? 'hasVoted: TRUE' : 'hasVoted: FALSE'}
              </span>
            </div>
          )}

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-50"
          >
            <Flame className="w-4 h-4 text-rose-200" />
            <span>
              {isSimulating ? 'Executing Attack Simulation on Server...' : 'Fire Duplicate Vote Request (Simulate Attack)'}
            </span>
          </button>
        </div>

        {/* Live Simulation Response Output */}
        {simulationResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Server Response Payload ({simulationResult.timestamp}):
              </span>
              <span
                className={`font-mono font-bold px-2.5 py-0.5 rounded ${
                  simulationResult.status === 409
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : simulationResult.status === 200
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                HTTP {simulationResult.status} {simulationResult.status === 409 ? 'Conflict (OPOV Blocked)' : simulationResult.status === 200 ? 'OK' : 'Error'}
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
              <pre>{JSON.stringify(simulationResult.data, null, 2)}</pre>
            </div>

            {simulationResult.status === 409 && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-700/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Success!</strong> The server successfully enforced the One Person One Vote protocol and rejected duplicate tampering. Security event appended to MongoDB audit logs.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
