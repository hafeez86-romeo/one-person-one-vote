import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  UserCheck,
  Fingerprint,
  ArrowRight,
  Vote,
  Copy,
  Check,
  Printer,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Election, Voter, Candidate, VoteReceipt } from '../types';
import { api } from '../api';

interface VotingBoothProps {
  election: Election;
  voters: Voter[];
  onVoteCastSuccess: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({
  election,
  voters,
  onVoteCastSuccess,
  onNavigateToTab,
}) => {
  const [selectedVoterId, setSelectedVoterId] = useState<string>('VOT-2026-101');
  const [securityPin, setSecurityPin] = useState<string>('4192');
  const [voterCheckState, setVoterCheckState] = useState<{
    checked: boolean;
    loading: boolean;
    voter: Voter | null;
    error?: string;
  }>({
    checked: false,
    loading: false,
    voter: null,
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [voteReceipt, setVoteReceipt] = useState<VoteReceipt | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Quick select a test voter
  const handleSelectTestVoter = (voter: Voter) => {
    setSelectedVoterId(voter.voterId);
    setSecurityPin(voter.securityPin);
    setVoteReceipt(null);
    setVoteError(null);
    setSelectedCandidateId(null);
    performCheck(voter.voterId);
  };

  const performCheck = async (voterIdToTest?: string) => {
    const id = voterIdToTest || selectedVoterId;
    if (!id.trim()) return;

    setVoterCheckState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const res = await api.checkVoter(election.id, id);
      if (res.registered && res.voterId) {
        setVoterCheckState({
          checked: true,
          loading: false,
          voter: {
            id: res.voterId,
            voterId: res.voterId,
            electionId: election.id,
            name: res.name || '',
            department: res.department || '',
            email: `${res.voterId.toLowerCase()}@univ.edu`,
            securityPin: res.securityPin || '',
            hasVoted: !!res.hasVoted,
            votedAt: res.votedAt,
            ballotReceiptHash: res.ballotReceiptHash,
            registeredAt: '',
          },
        });
      } else {
        setVoterCheckState({
          checked: true,
          loading: false,
          voter: null,
          error: res.message || `Voter ID "${id}" is not registered in this election.`,
        });
      }
    } catch (err: any) {
      setVoterCheckState({
        checked: true,
        loading: false,
        voter: null,
        error: err.message,
      });
    }
  };

  // Auto-check the initial test voter on mount
  useEffect(() => {
    performCheck('VOT-2026-101');
  }, [election.id]);

  const handleCastVote = async () => {
    if (!selectedCandidateId || !voterCheckState.voter) return;

    setIsSubmitting(true);
    setVoteError(null);

    try {
      const res = await api.castVote(election.id, {
        voterId: voterCheckState.voter.voterId,
        candidateId: selectedCandidateId,
        securityPin: securityPin,
      });

      if (res.success && res.receipt) {
        setVoteReceipt(res.receipt);
        setShowConfirmModal(false);
        onVoteCastSuccess();

        // Celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (err: any) {
      setShowConfirmModal(false);
      setVoteError(err.message || 'Vote casting failed.');
      // Refresh voter state to show they already voted
      performCheck();
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const resetForNextVoter = () => {
    setVoteReceipt(null);
    setVoteError(null);
    setSelectedCandidateId(null);
    // Pick the next unvoted voter if available
    const nextUnvoted = voters.find(v => !v.hasVoted && v.voterId !== voterCheckState.voter?.voterId);
    if (nextUnvoted) {
      handleSelectTestVoter(nextUnvoted);
    } else {
      performCheck();
    }
  };

  const selectedCandidate = election.candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="space-y-8">
      {/* SECTION 1: VOTER AUTHENTICATION & ELIGIBILITY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Fingerprint className="w-4 h-4" />
              <span>Step 1 · Identity & Eligibility Check</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              One Person, One Vote Authentication
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Every citizen or student is verified against the official electoral roll before receiving a ballot.
            </p>
          </div>

          {/* Quick Test Voter Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400 font-medium">
              Demo Fast-Select Voter:
            </span>
            <div className="flex flex-wrap gap-2">
              {voters.slice(0, 5).map(v => (
                <button
                  key={v.voterId}
                  onClick={() => handleSelectTestVoter(v)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer font-mono ${
                    selectedVoterId === v.voterId
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                      : v.hasVoted
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-semibold">{v.voterId}</span>
                  <span className="ml-1 text-[11px] opacity-80">
                    ({v.hasVoted ? 'Voted' : 'Eligible'})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Form & Verification Status */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-start">
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Voter ID / Roll Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedVoterId}
                  onChange={e => setSelectedVoterId(e.target.value.toUpperCase())}
                  placeholder="e.g. VOT-2026-101"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                4-Digit Security PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={securityPin}
                onChange={e => setSecurityPin(e.target.value)}
                placeholder="4192"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              onClick={() => performCheck()}
              disabled={voterCheckState.loading || !selectedVoterId.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{voterCheckState.loading ? 'Verifying in MongoDB...' : 'Verify Voter Eligibility'}</span>
            </button>
          </div>

          {/* Verification Feedback Card */}
          <div className="md:col-span-7">
            {voterCheckState.loading ? (
              <div className="h-44 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-400 text-sm">
                Querying MongoDB voters collection...
              </div>
            ) : voterCheckState.voter ? (
              <div
                className={`p-5 rounded-lg border transition-all ${
                  voterCheckState.voter.hasVoted
                    ? 'bg-rose-950/20 border-rose-800/80'
                    : 'bg-emerald-950/20 border-emerald-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {voterCheckState.voter.hasVoted ? (
                      <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {voterCheckState.voter.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {voterCheckState.voter.department} · {voterCheckState.voter.voterId}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {voterCheckState.voter.hasVoted ? (
                      <span className="inline-block text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded">
                        ALREADY VOTED
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded">
                        ELIGIBLE TO VOTE
                      </span>
                    )}
                  </div>
                </div>

                {voterCheckState.voter.hasVoted ? (
                  <div className="mt-4 pt-3 border-t border-rose-900/50 space-y-2 text-xs text-rose-200">
                    <p className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      One Person One Vote Protocol Enforced:
                    </p>
                    <p className="text-slate-300">
                      This voter has already exercised their constitutional vote. To preserve electoral integrity, duplicate ballots are permanently rejected by the server.
                    </p>
                    {voterCheckState.voter.votedAt && (
                      <div className="bg-slate-950/60 p-2.5 rounded border border-rose-900/40 font-mono text-[11px] text-slate-300">
                        <div>Voted At: {new Date(voterCheckState.voter.votedAt).toLocaleString()}</div>
                        <div className="truncate text-slate-400">
                          Receipt: {voterCheckState.voter.ballotReceiptHash || '0x...'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-emerald-900/50 text-xs text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Voter identity is verified and active. You may now select your candidate below and cast your secret ballot.
                    </span>
                  </div>
                )}
              </div>
            ) : voterCheckState.error ? (
              <div className="p-5 bg-rose-950/20 border border-rose-800/80 rounded-lg text-rose-300 text-xs space-y-1">
                <div className="font-semibold text-sm flex items-center gap-1.5 text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Voter Verification Failed
                </div>
                <p className="text-slate-300">{voterCheckState.error}</p>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-400 text-xs p-6 text-center">
                <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
                <span>Enter a Voter ID or choose a quick test voter above to unlock the ballot box.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: SECRET BALLOT CASTING */}
      {voterCheckState.voter && !voterCheckState.voter.hasVoted && !voteReceipt && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Vote className="w-4 h-4" />
                <span>Step 2 · Official Presidential Ballot</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Select Your Candidate
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ballot Secrecy Guarantee: Your vote is decoupled from your name and saved as an anonymous cryptographic ballot.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Constituency: <span className="text-slate-200">{voterCheckState.voter.department}</span>
            </div>
          </div>

          {voteError && (
            <div className="p-4 bg-rose-950/30 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Vote Submission Rejected</p>
                <p className="mt-0.5">{voteError}</p>
              </div>
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {election.candidates.map(candidate => {
              const isSelected = selectedCandidateId === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Candidate Photo */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-800">
                      {candidate.avatarUrl ? (
                        <img
                          src={candidate.avatarUrl}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                          {candidate.symbol}
                        </div>
                      )}
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center justify-center text-xs">
                        {candidate.symbol}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-white truncate">
                          {candidate.name}
                        </h3>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <p
                        className="text-xs font-medium mt-0.5 truncate"
                        style={{ color: candidate.color }}
                      >
                        {candidate.party}
                      </p>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {candidate.bio}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">Option {candidate.id.replace('cand-', '#')}</span>
                    <span className="font-medium text-slate-300">
                      {isSelected ? 'Selected' : 'Click to Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Voter: <span className="text-slate-200 font-semibold">{voterCheckState.voter.name}</span> ({voterCheckState.voter.voterId})
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!selectedCandidateId || isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
            >
              <Vote className="w-4 h-4" />
              <span>Cast Ballot for {selectedCandidate ? selectedCandidate.name : 'Selected Candidate'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: VOTE SUCCESS RECEIPT */}
      {voteReceipt && (
        <div className="bg-slate-900 border border-emerald-500/50 rounded-xl p-8 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  One Person One Vote · Committed
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Ballot Successfully Cast & Verified
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
              <button
                onClick={resetForNextVoter}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Authenticate Next Voter
              </button>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Voter Name & ID:</span>
                <span className="text-slate-200 font-semibold text-sm">
                  {voteReceipt.voterName}
                </span>
                <div className="font-mono text-slate-400">{voteReceipt.voterId}</div>
              </div>

              <div>
                <span className="text-slate-500 block">Candidate Chosen:</span>
                <span className="text-slate-200 font-semibold text-sm">
                  {voteReceipt.candidateName}
                </span>
                <div className="text-indigo-400">{voteReceipt.candidateParty}</div>
              </div>

              <div>
                <span className="text-slate-500 block">Timestamp:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(voteReceipt.timestamp).toLocaleTimeString()}
                </span>
                <div className="text-slate-400 font-mono text-[11px]">
                  {new Date(voteReceipt.timestamp).toLocaleDateString()}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">Verification Code:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {voteReceipt.verificationCode}
                </span>
                <div className="text-slate-400 text-[11px]">Saved in MongoDB</div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Receipt Hash */}
            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">
                Cryptographic Ballot Receipt Hash (SHA-256):
              </span>
              <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-800">
                <span className="font-mono text-xs text-emerald-300 break-all select-all flex-1">
                  {voteReceipt.receiptHash}
                </span>
                <button
                  onClick={() => copyHash(voteReceipt.receiptHash)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title="Copy verification hash"
                >
                  {copiedHash ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Keep this hash! You can paste it into the <strong>Verify Receipt</strong> tab to verify that your vote was counted in the tally without revealing your identity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => onNavigateToTab('tally')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>View Live Tally Updates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigateToTab('verifier')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Verify Ballot in Anonymous Ledger</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && selectedCandidate && voterCheckState.voter && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Confirm One Person One Vote
                </h3>
                <p className="text-xs text-slate-400">
                  Irreversible Electoral Commitment
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Voter:</span>
                <span className="text-slate-200 font-semibold">
                  {voterCheckState.voter.name} ({voterCheckState.voter.voterId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate:</span>
                <span className="text-indigo-300 font-semibold">
                  {selectedCandidate.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Party:</span>
                <span className="text-slate-300">{selectedCandidate.party}</span>
              </div>
            </div>

            <p className="text-xs text-amber-300/90 bg-amber-950/20 border border-amber-800/40 p-3 rounded-lg leading-relaxed">
              <strong>Notice:</strong> Under the One Person One Vote protocol, once submitted, the server atomically records that Voter ID {voterCheckState.voter.voterId} has voted. You cannot change, withdraw, or submit a second ballot.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCastVote}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Recording in MongoDB...' : 'Confirm & Commit Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
