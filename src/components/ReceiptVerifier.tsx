import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle2, XCircle, KeyRound, ExternalLink } from 'lucide-react';
import { Election } from '../types';
import { api } from '../api';

interface ReceiptVerifierProps {
  election: Election;
}

export const ReceiptVerifier: React.FC<ReceiptVerifierProps> = ({ election }) => {
  const [receiptHash, setReceiptHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    verified: boolean;
    ballot?: { ballotId: string; electionId: string; timestamp: string; verificationHash: string };
    searched: boolean;
  }>({
    verified: false,
    searched: false,
  });

  const SAMPLE_HASHES = [
    '0x8f3c1b9942a78e12d4a5b6789123456789abcdef0123456789abcdef01234567',
    '0x4d2e9a8174f63c50b81928374650192837465019283746501928374650192837',
  ];

  const handleVerify = async (hashToVerify?: string) => {
    const hash = hashToVerify || receiptHash;
    if (!hash.trim()) return;

    setIsVerifying(true);
    try {
      const res = await api.verifyReceipt(election.id, hash);
      setResult({
        verified: res.verified,
        ballot: res.ballot,
        searched: true,
      });
    } catch (e) {
      setResult({
        verified: false,
        searched: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <KeyRound className="w-4 h-4" />
          <span>Voter Self-Audit Verification</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Verify Cryptographic Ballot Receipt
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Verify that your vote was successfully committed into the MongoDB anonymous ballot repository without exposing your identity.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Enter 256-Bit SHA Receipt Hash:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <input
              type="text"
              value={receiptHash}
              onChange={e => setReceiptHash(e.target.value)}
              placeholder="e.g. 0x8f3c1b9942a78e12d4a5b6789123456789abcdef..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleVerify()}
              disabled={isVerifying || !receiptHash.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{isVerifying ? 'Searching Database...' : 'Verify in Ballot Box'}</span>
            </button>
          </div>
        </div>

        {/* Quick test sample hashes */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
          <span>Try sample verified hashes:</span>
          {SAMPLE_HASHES.map((h, i) => (
            <button
              key={h}
              onClick={() => {
                setReceiptHash(h);
                handleVerify(h);
              }}
              className="font-mono text-[11px] text-indigo-400 hover:text-indigo-300 bg-slate-950 border border-slate-800 px-2 py-1 rounded cursor-pointer"
            >
              Sample #{i + 1} ({h.slice(0, 10)}...)
            </button>
          ))}
        </div>

        {/* Verification Result */}
        {result.searched && (
          <div className="pt-4 border-t border-slate-800">
            {result.verified && result.ballot ? (
              <div className="p-5 bg-emerald-950/20 border border-emerald-700/60 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Cryptographic Ballot Verified & Counted
                    </h4>
                    <p className="text-xs text-emerald-300">
                      Matches unique record in MongoDB `ballots` collection.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ballot ID:</span>
                    <span className="text-slate-200">{result.ballot.ballotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Committed At:</span>
                    <span className="text-slate-200">
                      {new Date(result.ballot.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span className="text-slate-500">Hash Checksum:</span>
                    <span className="text-emerald-400 truncate max-w-sm">
                      {result.ballot.verificationHash}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  <strong>Ballot Secrecy Note:</strong> The candidate voted for is not exposed to third parties, but your mathematical proof proves that this vote was committed to the official tally under the One Person One Vote protocol.
                </p>
              </div>
            ) : (
              <div className="p-5 bg-rose-950/20 border border-rose-700/60 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Invalid or Unregistered Ballot Hash
                  </h4>
                  <p className="text-xs text-rose-300 mt-0.5">
                    No matching ballot was found in the official database with this cryptographic receipt.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
