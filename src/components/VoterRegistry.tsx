import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  CheckCircle,
  Clock,
  Check,
  X,
  Vote,
  ShieldCheck,
} from 'lucide-react';
import { Voter, Election } from '../types';
import { api } from '../api';

interface VoterRegistryProps {
  election: Election;
  voters: Voter[];
  onSelectVoterToVote: (voter: Voter) => void;
  onVotersUpdated: () => void;
}

export const VoterRegistry: React.FC<VoterRegistryProps> = ({
  election,
  voters,
  onSelectVoterToVote,
  onVotersUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'voted'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Voter Form state
  const [newVoterId, setNewVoterId] = useState(`VOT-2026-${Math.floor(111 + Math.random() * 800)}`);
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('Computer Science & Engineering');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState(Math.floor(1000 + Math.random() * 9000).toString());
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const filteredVoters = voters.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.voterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'eligible') return !v.hasVoted;
    if (filterStatus === 'voted') return v.hasVoted;
    return true;
  });

  const handleRegisterVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoterId.trim() || !newName.trim()) return;

    setIsRegistering(true);
    setRegisterError(null);

    try {
      const res = await api.registerVoter(election.id, {
        voterId: newVoterId,
        name: newName,
        department: newDepartment,
        email: newEmail || `${newVoterId.toLowerCase()}@univ.edu`,
        securityPin: newPin,
      });

      if (res.success) {
        setShowAddModal(false);
        setNewName('');
        setNewVoterId(`VOT-2026-${Math.floor(111 + Math.random() * 800)}`);
        onVotersUpdated();
      }
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register voter');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Official Electorate Repository · MongoDB</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Electoral Roll & Voter Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unique Voter ID compound index prevents duplicate registrations or ballot re-entries.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Voter</span>
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, Voter ID, or department..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status segment tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({voters.length})
          </button>
          <button
            onClick={() => setFilterStatus('eligible')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'eligible'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Eligible ({voters.filter(v => !v.hasVoted).length})
          </button>
          <button
            onClick={() => setFilterStatus('voted')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'voted'
                ? 'bg-slate-800 text-rose-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Voted ({voters.filter(v => v.hasVoted).length})
          </button>
        </div>
      </div>

      {/* VOTERS DATA TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Voter ID</th>
                <th className="py-3 px-4">Citizen / Student Name</th>
                <th className="py-3 px-4">Department / Constituency</th>
                <th className="py-3 px-4">OPOV Status</th>
                <th className="py-3 px-4">Ballot Verification Hash</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No voters found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredVoters.map(voter => (
                  <tr key={voter.voterId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {voter.voterId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {voter.name}
                      <span className="block text-[11px] text-slate-500 font-normal">
                        PIN: <code className="font-mono text-slate-400">{voter.securityPin}</code>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {voter.department}
                    </td>
                    <td className="py-3 px-4">
                      {voter.hasVoted ? (
                        <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Ballot Recorded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Eligible to Vote</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {voter.ballotReceiptHash ? (
                        <span className="text-emerald-400/90" title={voter.ballotReceiptHash}>
                          {voter.ballotReceiptHash.slice(0, 14)}...{voter.ballotReceiptHash.slice(-8)}
                        </span>
                      ) : (
                        <span className="text-slate-600">Pending Ballot Cast</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!voter.hasVoted ? (
                        <button
                          onClick={() => onSelectVoterToVote(voter)}
                          className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-md transition-colors font-medium cursor-pointer"
                        >
                          Cast Vote
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectVoterToVote(voter)}
                          className="px-3 py-1 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors text-[11px] cursor-pointer"
                          title="Try duplicate vote to test security rejection"
                        >
                          Test Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW VOTER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Register New Verified Voter
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-300">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterVoter} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Voter Identifier (Unique MongoDB Index):
                </label>
                <input
                  type="text"
                  required
                  value={newVoterId}
                  onChange={e => setNewVoterId(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Department / Academic Branch:
                </label>
                <input
                  type="text"
                  required
                  value={newDepartment}
                  onChange={e => setNewDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    4-Digit Security PIN:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="optional"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isRegistering ? 'Inserting to MongoDB...' : 'Add to Electoral Roll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
