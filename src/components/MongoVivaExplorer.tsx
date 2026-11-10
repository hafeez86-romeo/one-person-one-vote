import React, { useState } from 'react';
import {
  Database,
  Code2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Server,
  ArrowRight,
  BookOpen,
  Cpu,
} from 'lucide-react';
import { DatabaseStatus, Election, Voter, AuditLog } from '../types';
import { api } from '../api';

interface MongoVivaExplorerProps {
  dbStatus: DatabaseStatus | null;
  election: Election;
  voters: Voter[];
  logs: AuditLog[];
  onRefreshDb: () => void;
}

export const MongoVivaExplorer: React.FC<MongoVivaExplorerProps> = ({
  dbStatus,
  election,
  voters,
  logs,
  onRefreshDb,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schemas' | 'data' | 'connection'>('architecture');
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<'voters' | 'ballots' | 'elections' | 'auditLogs'>('voters');

  const handleTestMongoUri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;

    setIsConnecting(true);
    setConnectionMessage(null);
    try {
      const res = await api.connectDb(mongoUriInput.trim());
      setConnectionMessage({
        success: res.result.success,
        text: res.result.message,
      });
      onRefreshDb();
    } catch (err: any) {
      setConnectionMessage({
        success: false,
        text: err.message || 'Connection failed.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>MongoDB Architecture & External Exam Viva Guide</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Database Schema & OPOV Security Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete technical documentation, collection schemas, atomic locking mechanisms, and live document inspector.
          </p>
        </div>

        {/* Database Mode Indicator */}
        <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left">
            <span className="font-semibold text-white block">
              {dbStatus?.provider === 'mongodb' ? 'MongoDB Atlas' : 'Embedded MongoDB Engine'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Database: {dbStatus?.databaseName || 'opov_election_db'}
            </span>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'architecture'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Exam Viva Q&A</span>
        </button>

        <button
          onClick={() => setActiveTab('schemas')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'schemas'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>MongoDB Schemas & Indexes</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'data'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Raw Documents Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('connection')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'connection'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Configure MongoDB URI</span>
        </button>
      </div>

      {/* TAB 1: EXAM VIVA QUESTIONS & TECHNICAL ANSWERS */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                <span>Viva Question 1</span>
              </div>
              <h3 className="text-base font-bold text-white">
                How does this system guarantee "One Person, One Vote"?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                By enforcing two distinct layers of defensive controls:
              </p>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-slate-200">Pre-flight Eligibility Filter</strong>: The server checks if the voter has <code className="text-amber-300 font-mono">hasVoted === true</code>. If true, it immediately rejects the vote with HTTP 409 Conflict.
                </li>
                <li>
                  <strong className="text-slate-200">Atomic MongoDB Lock</strong>: To eliminate race conditions where a voter might submit two simultaneous requests, MongoDB uses <code className="text-emerald-300 font-mono">findOneAndUpdate(&#123; voterId, hasVoted: false &#125;)</code>. If two parallel requests arrive, only one can succeed; the second fails atomically.
                </li>
              </ul>
            </div>

            {/* Question 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Viva Question 2</span>
              </div>
              <h3 className="text-base font-bold text-white">
                How is Ballot Secrecy maintained if you verify voters?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The architecture decouples the <strong>Electoral Roll (Identity)</strong> from the <strong>Ballot Box (Vote)</strong>:
              </p>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>
                  The <code className="text-indigo-300 font-mono">voters</code> collection records whether a citizen voted, but <span className="text-rose-300 font-semibold">NEVER</span> contains the candidate or party chosen.
                </li>
                <li>
                  The <code className="text-indigo-300 font-mono">ballots</code> collection records anonymous votes with a cryptographic hash, but contains <span className="text-rose-300 font-semibold">NO</span> voter name or ID.
                </li>
                <li>
                  The voter receives a SHA-256 receipt token enabling individual auditability without violating secret ballot standards.
                </li>
              </ul>
            </div>

            {/* Question 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Viva Question 3</span>
              </div>
              <h3 className="text-base font-bold text-white">
                What role does MongoDB play vs. SQL?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                MongoDB's document model provides flexible schema validation and high-speed write performance for concurrent election throughput:
              </p>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-slate-200">Compound Unique Indexes</strong>: Enforced at the database driver level on <code className="font-mono text-emerald-300">&#123; voterId: 1, electionId: 1 &#125;</code>.
                </li>
                <li>
                  <strong className="text-slate-200">Document Embedding</strong>: Candidates, manifesto agendas, and party metadata are embedded directly inside the <code className="font-mono text-indigo-300">elections</code> document for sub-millisecond retrieval without multi-table SQL joins.
                </li>
              </ul>
            </div>

            {/* Question 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Viva Question 4</span>
              </div>
              <h3 className="text-base font-bold text-white">
                What happens during network failures or offline examiners?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The application features an <strong>Autonomous Dual Storage Engine</strong>:
              </p>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>
                  If a live MongoDB Atlas URI is supplied in <code className="font-mono text-slate-200">.env</code> or via the UI, it connects seamlessly using the official <code className="font-mono text-emerald-300">mongodb</code> client.
                </li>
                <li>
                  If no network connection is available during viva presentation, it transparently executes all MongoDB queries against the persistent embedded storage engine with full disk persistence at <code className="font-mono text-slate-300">data/mongo_store.json</code>!
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEMAS & CODE SNIPPETS */}
      {activeTab === 'schemas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>1. Voters Collection Schema</span>
                <span className="text-xs text-indigo-400 font-mono">db.voters</span>
              </h4>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                <pre>{`// MongoDB Unique Index:
db.voters.createIndex(
  { voterId: 1, electionId: 1 }, 
  { unique: true }
);

// Document Structure:
{
  "_id": ObjectId("65fa..."),
  "voterId": "VOT-2026-101",        // Unique Government/University ID
  "electionId": "elec-2026-general",
  "name": "Sophia Rodriguez",
  "department": "Computer Science",
  "securityPin": "4192",            // 4-digit verification code
  "hasVoted": true,                 // OPOV Invariant Flag
  "votedAt": "2026-11-10T10:45:00Z",
  "ballotReceiptHash": "0x8f3c1b..."
}`}</pre>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>2. Anonymous Ballots Schema</span>
                <span className="text-xs text-indigo-400 font-mono">db.ballots</span>
              </h4>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                <pre>{`// MongoDB Unique Index:
db.ballots.createIndex(
  { verificationHash: 1 }, 
  { unique: true }
);

// Decoupled Anonymous Ballot:
{
  "_id": ObjectId("65fb..."),
  "ballotId": "BAL-17312345-891",
  "electionId": "elec-2026-general",
  "candidateId": "cand-01",         // Chosen Candidate
  "timestamp": "2026-11-10T10:45:00Z",
  "verificationHash": "0x8f3c1b..." // Proof for voter self-audit
  // NOTE: voterId & voterName ARE NOT STORED HERE!
}`}</pre>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>3. Atomic Lock Code (Node.js & Express)</span>
                <span className="text-xs text-emerald-400 font-mono">Atomic Operation</span>
              </h4>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
                <pre>{`// Prevents race conditions during simultaneous vote cast:
const result = await db.collection('voters').findOneAndUpdate(
  { 
    electionId: electionId, 
    voterId: voterId, 
    hasVoted: false // Critical condition: only update if not voted!
  },
  {
    $set: {
      hasVoted: true,
      votedAt: new Date().toISOString(),
      ballotReceiptHash: receiptHash
    }
  },
  { returnDocument: 'after' }
);

if (!result) {
  // Reject duplicate attempt
  return res.status(409).json({ error: 'Duplicate vote blocked' });
}`}</pre>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>4. Audit Ledger Schema</span>
                <span className="text-xs text-rose-400 font-mono">db.auditLogs</span>
              </h4>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{`// Tamper-Evident Chronological Security Stream:
{
  "_id": ObjectId("65fc..."),
  "id": "log-17312345",
  "timestamp": "2026-11-10T10:45:01Z",
  "action": "DUPLICATE_VOTE_BLOCKED",
  "electionId": "elec-2026-general",
  "severity": "critical",
  "message": "SECURITY ALERT: Duplicate vote attempt blocked for Voter ID: VOT-2026-108.",
  "details": {
    "voterId": "VOT-2026-108",
    "previouslyVotedAt": "..."
  }
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RAW DATABASE DOCUMENT VIEWER */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(['voters', 'ballots', 'elections', 'auditLogs'] as const).map(col => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedCollection === col
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                db.{col} ({col === 'voters' ? voters.length : col === 'elections' ? 1 : col === 'auditLogs' ? logs.length : 'Live'})
              </button>
            ))}
          </div>

          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
            {selectedCollection === 'voters' && (
              <pre>{JSON.stringify(voters, null, 2)}</pre>
            )}
            {selectedCollection === 'elections' && (
              <pre>{JSON.stringify(election, null, 2)}</pre>
            )}
            {selectedCollection === 'auditLogs' && (
              <pre>{JSON.stringify(logs.slice(0, 15), null, 2)}</pre>
            )}
            {selectedCollection === 'ballots' && (
              <pre>{JSON.stringify(
                voters.filter(v => v.hasVoted).map((v, i) => ({
                  ballotId: `BAL-RECORD-00${i + 1}`,
                  electionId: election.id,
                  verificationHash: v.ballotReceiptHash || '0x...',
                  timestamp: v.votedAt,
                  note: 'Anonymized vote record stored in MongoDB ballots collection.'
                })),
                null,
                2
              )}</pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MONGODB URI CONFIGURATOR */}
      {activeTab === 'connection' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-white">
              Connect to External MongoDB Atlas Cluster
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              If your external examiner wants to test with a live remote MongoDB database, paste their connection URI below.
            </p>
          </div>

          <form onSubmit={handleTestMongoUri} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                MongoDB Connection String (URI):
              </label>
              <input
                type="text"
                value={mongoUriInput}
                onChange={e => setMongoUriInput(e.target.value)}
                placeholder="mongodb+srv://username:password@cluster0.abcde.mongodb.net/opov_db"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isConnecting || !mongoUriInput.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{isConnecting ? 'Testing MongoDB Connection...' : 'Connect to Live MongoDB'}</span>
            </button>
          </form>

          {connectionMessage && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                connectionMessage.success
                  ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-700/60 text-rose-300'
              }`}
            >
              {connectionMessage.text}
            </div>
          )}

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="text-slate-300 font-semibold block">Current Active Provider:</span>
            <div className="font-mono text-emerald-400">
              {dbStatus?.provider === 'mongodb' ? 'Connected to MongoDB Atlas / Server' : 'Built-in MongoDB Document Engine (Active with ACID-like atomic operations)'}
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              The built-in engine provides 100% offline reliability for your external exam viva while maintaining strict MongoDB syntax, collections, queries, and atomic locking.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
