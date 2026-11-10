import React from 'react';
import { ShieldCheck, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbStatus: DatabaseStatus | null;
  onOpenDuplicateModal: () => void;
  onResetElection: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dbStatus,
  onOpenDuplicateModal,
  onResetElection,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <button
            onClick={() => setActiveTab('booth')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap block">
              VOTEX OPOV
            </span>
          </button>
        </div>

        {/* Zone 2: 4-5 Concise Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('booth')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'booth'
                ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Voting Booth
          </button>

          <button
            onClick={() => setActiveTab('tally')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'tally'
                ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Tally
          </button>

          <button
            onClick={() => setActiveTab('voters')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'voters'
                ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Voter Registry
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'audit'
                ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Trail
          </button>

          <button
            onClick={() => setActiveTab('verifier')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'verifier'
                ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Verify Receipt
          </button>

          <button
            onClick={() => setActiveTab('viva')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'viva'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MongoDB & Viva Guide
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Stress Test Security button) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenDuplicateModal}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Demonstrate One Person One Vote Duplicate Blocking for viva/exam"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Stress Test</span> Duplicate Block
          </button>

          <button
            onClick={onResetElection}
            disabled={isResetting}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset demo votes"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-t border-slate-800/60 overflow-x-auto text-xs gap-3">
        {['booth', 'tally', 'voters', 'audit', 'verifier', 'viva'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap py-1 font-medium capitalize cursor-pointer ${
              activeTab === tab ? 'text-indigo-400 border-b border-indigo-400' : 'text-slate-400'
            }`}
          >
            {tab === 'viva' ? 'MongoDB & Viva' : tab}
          </button>
        ))}
      </div>
    </header>
  );
};
