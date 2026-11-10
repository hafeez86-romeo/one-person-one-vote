import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { VotingBooth } from './components/VotingBooth';
import { LiveTally } from './components/LiveTally';
import { VoterRegistry } from './components/VoterRegistry';
import { AuditTrail } from './components/AuditTrail';
import { ReceiptVerifier } from './components/ReceiptVerifier';
import { MongoVivaExplorer } from './components/MongoVivaExplorer';
import { DuplicateTestModal } from './components/DuplicateTestModal';
import { Election, Voter, ElectionTally, AuditLog, DatabaseStatus } from './types';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('booth');
  const [election, setElection] = useState<Election | null>(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [tally, setTally] = useState<ElectionTally | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Initial Data Load
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [electionsRes, statusRes] = await Promise.all([
        api.getElections(),
        api.getStatus(),
      ]);

      setDbStatus(statusRes.database);

      if (electionsRes.length > 0) {
        const activeElection = electionsRes[0];
        setElection(activeElection);

        const [votersRes, tallyRes, logsRes] = await Promise.all([
          api.getVoters(activeElection.id),
          api.getTally(activeElection.id),
          api.getAuditLogs(activeElection.id),
        ]);

        setVoters(votersRes);
        setTally(tallyRes);
        setLogs(logsRes);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic Polling for Live Tally & Logs
  useEffect(() => {
    if (!autoRefresh || !election) return;

    const interval = setInterval(async () => {
      try {
        const [tallyRes, logsRes, statusRes] = await Promise.all([
          api.getTally(election.id),
          api.getAuditLogs(election.id),
          api.getStatus(),
        ]);
        setTally(tallyRes);
        setLogs(logsRes);
        setDbStatus(statusRes.database);
      } catch (err) {
        // silent fail on poll error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, election]);

  // Refresh voters and tally after a vote is cast
  const handleVoteCastSuccess = async () => {
    if (!election) return;
    try {
      const [votersRes, tallyRes, logsRes, statusRes] = await Promise.all([
        api.getVoters(election.id),
        api.getTally(election.id),
        api.getAuditLogs(election.id),
        api.getStatus(),
      ]);
      setVoters(votersRes);
      setTally(tallyRes);
      setLogs(logsRes);
      setDbStatus(statusRes.database);
    } catch (e) {
      console.error('Failed to refresh data after vote:', e);
    }
  };

  const handleSelectVoterToVote = (voter: Voter) => {
    setActiveTab('booth');
  };

  const handleResetElection = async () => {
    if (!election) return;
    if (!window.confirm('Reset election data to test state? This will clear cast ballots and restore voter eligibility.')) {
      return;
    }

    setIsResetting(true);
    try {
      await api.resetElection(election.id);
      await handleVoteCastSuccess();
    } catch (e) {
      console.error('Failed to reset election:', e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        onOpenDuplicateModal={() => setDuplicateModalOpen(true)}
        onResetElection={handleResetElection}
        isResetting={isResetting}
      />

      {/* Contextual Status & Metadata Strip */}
      <StatusBanner
        election={election}
        tally={tally}
        dbStatus={dbStatus}
        onOpenViva={() => setActiveTab('viva')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading || !election ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-mono">
              Bootstrapping One Person One Vote MongoDB Engine...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'booth' && (
              <VotingBooth
                election={election}
                voters={voters}
                onVoteCastSuccess={handleVoteCastSuccess}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === 'tally' && (
              <LiveTally
                tally={tally}
                isLoading={loading}
                onRefresh={handleVoteCastSuccess}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
              />
            )}

            {activeTab === 'voters' && (
              <VoterRegistry
                election={election}
                voters={voters}
                onSelectVoterToVote={handleSelectVoterToVote}
                onVotersUpdated={handleVoteCastSuccess}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrail
                logs={logs}
                onRefresh={handleVoteCastSuccess}
                isLoading={loading}
              />
            )}

            {activeTab === 'verifier' && (
              <ReceiptVerifier election={election} />
            )}

            {activeTab === 'viva' && (
              <MongoVivaExplorer
                dbStatus={dbStatus}
                election={election}
                voters={voters}
                logs={logs}
                onRefreshDb={handleVoteCastSuccess}
              />
            )}
          </>
        )}
      </main>

      {/* External Exam Security Stress Test Modal */}
      {election && (
        <DuplicateTestModal
          isOpen={duplicateModalOpen}
          onClose={() => setDuplicateModalOpen(false)}
          election={election}
          voters={voters}
          onAuditUpdated={handleVoteCastSuccess}
        />
      )}

      {/* Quiet Academic / Exam Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>One Person One Vote (OPOV) Cryptographic Verification System</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>External Exam Prototype</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Node.js · Express · React · Vite · MongoDB
          </div>
        </div>
      </footer>
    </div>
  );
}
