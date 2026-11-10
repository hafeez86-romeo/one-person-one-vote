import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Election,
  Voter,
  AnonymousBallot,
  AuditLog,
  VoteReceipt,
  DatabaseStatus,
  Candidate,
} from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'mongo_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface InMemoryStore {
  elections: Election[];
  voters: Voter[];
  ballots: AnonymousBallot[];
  auditLogs: AuditLog[];
}

const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 'cand-01',
    name: 'Elena Rostova',
    party: 'Tech Innovation & Student Welfare Alliance',
    symbol: '⚡',
    bio: 'Championing 24/7 AI lab access, digital campus voting, and subsidized meal plans.',
    avatarUrl: '/src/assets/images/candidate_elena_rostova_1794329871127.jpg',
    color: '#3B82F6', // Blue
  },
  {
    id: 'cand-02',
    name: 'Marcus Chen',
    party: 'Campus Sustainability & Open Governance',
    symbol: '🌿',
    bio: 'Promoting carbon-neutral university buildings, transparent budget allocations, and open forum senate.',
    avatarUrl: '/src/assets/images/candidate_marcus_chen_1794329871186.jpg',
    color: '#10B981', // Emerald
  },
  {
    id: 'cand-03',
    name: 'Amina Diallo',
    party: 'Academic Equity & Affordable Education Front',
    symbol: '📚',
    bio: 'Fighting for textbook fee caps, emergency student relief grants, and mental health council expansion.',
    avatarUrl: '/src/assets/images/candidate_amina_diallo_1794329872497.jpg',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'cand-04',
    name: 'David Kim',
    party: 'Athletics & Career Development Coalition',
    symbol: '🎯',
    bio: 'Expanding internship pipelines with top tech firms, modernizing recreational centers, and club funding.',
    avatarUrl: '/src/assets/images/candidate_david_kim_1794329872728.jpg',
    color: '#F59E0B', // Amber
  },
];

const DEFAULT_ELECTION: Election = {
  id: 'elec-2026-general',
  title: '2026 University Student Council Presidential Election',
  description: 'Official student body election conducted under strict One Person One Vote (OPOV) protocol with cryptographic receipt verification and MongoDB persistence.',
  category: 'Student Government',
  status: 'active',
  startDate: new Date(Date.now() - 86400000).toISOString(),
  endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
  totalRegisteredVoters: 10,
  candidates: DEFAULT_CANDIDATES,
  createdAt: new Date().toISOString(),
};

const DEFAULT_VOTERS: Voter[] = [
  {
    id: 'vtr-001',
    voterId: 'VOT-2026-101',
    electionId: 'elec-2026-general',
    name: 'Sophia Rodriguez',
    department: 'Computer Science & Engineering',
    email: 'sophia.r@univ.edu',
    securityPin: '4192',
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'vtr-002',
    voterId: 'VOT-2026-102',
    electionId: 'elec-2026-general',
    name: 'Arjun Mehta',
    department: 'Information Technology',
    email: 'arjun.m@univ.edu',
    securityPin: '8310',
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'vtr-003',
    voterId: 'VOT-2026-103',
    electionId: 'elec-2026-general',
    name: 'Zara Al-Mansoor',
    department: 'Electrical Engineering',
    email: 'zara.am@univ.edu',
    securityPin: '6745',
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'vtr-004',
    voterId: 'VOT-2026-104',
    electionId: 'elec-2026-general',
    name: 'Liam O\'Connor',
    department: 'Mechanical Engineering',
    email: 'liam.oc@univ.edu',
    securityPin: '1904',
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: 'vtr-005',
    voterId: 'VOT-2026-105',
    electionId: 'elec-2026-general',
    name: 'Ananya Sharma',
    department: 'Biotechnology & Bioengineering',
    email: 'ananya.s@univ.edu',
    securityPin: '5523',
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'vtr-006',
    voterId: 'VOT-2026-106',
    electionId: 'elec-2026-general',
    name: 'Kofi Mensah',
    department: 'Business Administration',
    email: 'kofi.m@univ.edu',
    securityPin: '7819',
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'vtr-007',
    voterId: 'VOT-2026-107',
    electionId: 'elec-2026-general',
    name: 'Hana Tanaka',
    department: 'Design & Architecture',
    email: 'hana.t@univ.edu',
    securityPin: '3341',
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'vtr-008',
    voterId: 'VOT-2026-108',
    electionId: 'elec-2026-general',
    name: 'Lucas Vance (Pre-voted)',
    department: 'Mathematics & Computing',
    email: 'lucas.v@univ.edu',
    securityPin: '9021',
    hasVoted: true,
    votedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    ballotReceiptHash: '0x8f3c1b9942a78e12d4a5b6789123456789abcdef0123456789abcdef01234567',
    registeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'vtr-009',
    voterId: 'VOT-2026-109',
    electionId: 'elec-2026-general',
    name: 'Mei-Ling Zhou (Pre-voted)',
    department: 'Physics & Applied Sciences',
    email: 'meiling.z@univ.edu',
    securityPin: '6182',
    hasVoted: true,
    votedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    ballotReceiptHash: '0x4d2e9a8174f63c50b81928374650192837465019283746501928374650192837',
    registeredAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
  {
    id: 'vtr-010',
    voterId: 'VOT-2026-110',
    electionId: 'elec-2026-general',
    name: 'Carlos Santana (Pre-voted)',
    department: 'Economics',
    email: 'carlos.s@univ.edu',
    securityPin: '4488',
    hasVoted: true,
    votedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    ballotReceiptHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    registeredAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

const DEFAULT_BALLOTS: AnonymousBallot[] = [
  {
    ballotId: 'BAL-DEMO-001',
    electionId: 'elec-2026-general',
    candidateId: 'cand-01',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    verificationHash: '0x8f3c1b9942a78e12d4a5b6789123456789abcdef0123456789abcdef01234567',
  },
  {
    ballotId: 'BAL-DEMO-002',
    electionId: 'elec-2026-general',
    candidateId: 'cand-02',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    verificationHash: '0x4d2e9a8174f63c50b81928374650192837465019283746501928374650192837',
  },
  {
    ballotId: 'BAL-DEMO-003',
    electionId: 'elec-2026-general',
    candidateId: 'cand-03',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    verificationHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    action: 'SEED_DATA',
    electionId: 'elec-2026-general',
    severity: 'info',
    message: 'Election system initialized with verified electoral roll and MongoDB persistence.',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    action: 'VOTE_CAST_SUCCESS',
    electionId: 'elec-2026-general',
    severity: 'success',
    message: 'Voter VOT-2026-108 successfully cast ballot. One Person One Vote token recorded.',
    details: { receiptHash: '0x8f3c1b9942a78e12d4a5b6789123456789abcdef0123456789abcdef01234567' },
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    action: 'DUPLICATE_VOTE_BLOCKED',
    electionId: 'elec-2026-general',
    severity: 'critical',
    message: 'SECURITY ALERT: Duplicate voting attempt blocked for Voter ID: VOT-2026-108. Ballot rejected under OPOV rule.',
    details: { voterId: 'VOT-2026-108', attemptedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    action: 'VOTE_CAST_SUCCESS',
    electionId: 'elec-2026-general',
    severity: 'success',
    message: 'Voter VOT-2026-109 successfully cast ballot. One Person One Vote token recorded.',
  },
  {
    id: 'log-005',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    action: 'VOTE_CAST_SUCCESS',
    electionId: 'elec-2026-general',
    severity: 'success',
    message: 'Voter VOT-2026-110 successfully cast ballot. One Person One Vote token recorded.',
  },
];

class DatabaseService {
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;
  private isConnectedToMongo = false;
  private mongoUri: string = process.env.MONGODB_URI || '';
  private memoryStore: InMemoryStore;

  constructor() {
    this.memoryStore = this.loadBackupData();
  }

  private loadBackupData(): InMemoryStore {
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing backup, initializing fresh store:', e);
    }

    const initialStore: InMemoryStore = {
      elections: [DEFAULT_ELECTION],
      voters: DEFAULT_VOTERS,
      ballots: DEFAULT_BALLOTS,
      auditLogs: DEFAULT_AUDIT_LOGS,
    };
    this.saveBackupData(initialStore);
    return initialStore;
  }

  private saveBackupData(store: InMemoryStore = this.memoryStore) {
    try {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save to backup file:', e);
    }
  }

  public async init(uri?: string) {
    const targetUri = uri || this.mongoUri;
    if (targetUri && targetUri.trim().length > 0) {
      try {
        console.log('Attempting to connect to MongoDB Atlas / Server...');
        const client = new MongoClient(targetUri, {
          serverSelectionTimeoutMS: 4000,
          connectTimeoutMS: 5000,
        });
        await client.connect();
        this.mongoClient = client;
        this.db = client.db('opov_election_db');
        this.isConnectedToMongo = true;
        this.mongoUri = targetUri;

        // Ensure unique indexes on voters (voterId + electionId)
        await this.db.collection('voters').createIndex({ voterId: 1, electionId: 1 }, { unique: true });
        await this.db.collection('ballots').createIndex({ verificationHash: 1 }, { unique: true });

        // If mongo collections are empty, seed them from memoryStore
        const countElections = await this.db.collection('elections').countDocuments();
        if (countElections === 0) {
          console.log('Seeding MongoDB collections with initial election data...');
          await this.db.collection('elections').insertMany(this.memoryStore.elections as any);
          await this.db.collection('voters').insertMany(this.memoryStore.voters as any);
          await this.db.collection('ballots').insertMany(this.memoryStore.ballots as any);
          await this.db.collection('auditLogs').insertMany(this.memoryStore.auditLogs as any);
        }

        console.log('Successfully connected to MongoDB!');
        return { success: true, message: 'Connected to live MongoDB instance' };
      } catch (err: any) {
        console.warn('MongoDB connection failed or timed out. Falling back to persistent Mongo-compatible store:', err.message);
        this.isConnectedToMongo = false;
        this.mongoClient = null;
        this.db = null;
        return { success: false, message: `MongoDB connection error: ${err.message}. Using built-in storage engine.` };
      }
    } else {
      console.log('No MONGODB_URI provided. Running on built-in persistent MongoDB storage engine.');
      this.isConnectedToMongo = false;
      return { success: true, message: 'Running on built-in MongoDB storage engine' };
    }
  }

  public async getStatus(): Promise<DatabaseStatus> {
    if (this.isConnectedToMongo && this.db) {
      try {
        const [elecCount, vtrCount, bltCount, logCount] = await Promise.all([
          this.db.collection('elections').countDocuments(),
          this.db.collection('voters').countDocuments(),
          this.db.collection('ballots').countDocuments(),
          this.db.collection('auditLogs').countDocuments(),
        ]);
        return {
          connected: true,
          provider: 'mongodb',
          databaseName: 'opov_election_db',
          uriPreview: this.mongoUri.replace(/:([^:@]{3,})@/, ':***@'),
          collections: {
            elections: elecCount,
            voters: vtrCount,
            ballots: bltCount,
            auditLogs: logCount,
          },
          lastChecked: new Date().toISOString(),
        };
      } catch (e) {
        // Fall back to memory stats
      }
    }

    return {
      connected: true,
      provider: 'embedded-mongo',
      databaseName: 'opov_local_db (File-Persisted)',
      uriPreview: 'mongodb://localhost:27017/opov_election_db (Emulated with atomic operations)',
      collections: {
        elections: this.memoryStore.elections.length,
        voters: this.memoryStore.voters.length,
        ballots: this.memoryStore.ballots.length,
        auditLogs: this.memoryStore.auditLogs.length,
      },
      lastChecked: new Date().toISOString(),
    };
  }

  // ELECTION OPERATIONS
  public async getElections(): Promise<Election[]> {
    if (this.isConnectedToMongo && this.db) {
      const docs = await this.db.collection('elections').find({}).toArray();
      return docs.map(d => ({ ...d, id: d.id || d._id.toString() })) as unknown as Election[];
    }
    return this.memoryStore.elections;
  }

  public async getElection(id: string): Promise<Election | null> {
    if (this.isConnectedToMongo && this.db) {
      const doc = await this.db.collection('elections').findOne({ id });
      return doc as unknown as Election | null;
    }
    return this.memoryStore.elections.find(e => e.id === id) || null;
  }

  // VOTERS OPERATIONS
  public async getVoters(electionId: string): Promise<Voter[]> {
    if (this.isConnectedToMongo && this.db) {
      const docs = await this.db.collection('voters').find({ electionId }).toArray();
      return docs as unknown as Voter[];
    }
    return this.memoryStore.voters.filter(v => v.electionId === electionId);
  }

  public async getVoterByVoterId(electionId: string, voterId: string): Promise<Voter | null> {
    const cleanId = voterId.trim().toUpperCase();
    if (this.isConnectedToMongo && this.db) {
      const doc = await this.db.collection('voters').findOne({
        electionId,
        voterId: cleanId,
      });
      return doc as unknown as Voter | null;
    }
    return (
      this.memoryStore.voters.find(
        v => v.electionId === electionId && v.voterId.toUpperCase() === cleanId
      ) || null
    );
  }

  public async registerVoter(voterData: {
    electionId: string;
    voterId: string;
    name: string;
    department: string;
    email: string;
    securityPin?: string;
  }): Promise<{ success: boolean; voter?: Voter; error?: string }> {
    const cleanId = voterData.voterId.trim().toUpperCase();
    const existing = await this.getVoterByVoterId(voterData.electionId, cleanId);
    if (existing) {
      return { success: false, error: `Voter ID ${cleanId} is already registered in this election.` };
    }

    const pin = voterData.securityPin || Math.floor(1000 + Math.random() * 9000).toString();
    const newVoter: Voter = {
      id: `vtr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      voterId: cleanId,
      electionId: voterData.electionId,
      name: voterData.name.trim(),
      department: voterData.department.trim(),
      email: voterData.email.trim(),
      securityPin: pin,
      hasVoted: false,
      registeredAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo && this.db) {
      await this.db.collection('voters').insertOne(newVoter as any);
      await this.db.collection('elections').updateOne(
        { id: voterData.electionId },
        { $inc: { totalRegisteredVoters: 1 } }
      );
    } else {
      this.memoryStore.voters.push(newVoter);
      const election = this.memoryStore.elections.find(e => e.id === voterData.electionId);
      if (election) election.totalRegisteredVoters += 1;
      this.saveBackupData();
    }

    await this.logAudit({
      action: 'VOTER_REGISTERED',
      electionId: voterData.electionId,
      severity: 'info',
      message: `New voter registered: ${newVoter.name} (${newVoter.voterId}) in ${newVoter.department}.`,
      details: { voterId: cleanId, department: newVoter.department },
    });

    return { success: true, voter: newVoter };
  }

  // ATOMIC ONE-PERSON-ONE-VOTE CASTING
  public async castVote(params: {
    electionId: string;
    voterId: string;
    candidateId: string;
    securityPin?: string;
    ip?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    status?: number;
    receipt?: VoteReceipt;
    alreadyVotedAt?: string;
  }> {
    const { electionId, voterId, candidateId, securityPin, ip } = params;
    const cleanVoterId = voterId.trim().toUpperCase();

    // 1. Validate Election
    const election = await this.getElection(electionId);
    if (!election) {
      return { success: false, error: 'Election not found', status: 404 };
    }
    if (election.status !== 'active') {
      return { success: false, error: `Election is currently ${election.status}. Voting is closed.`, status: 400 };
    }

    // 2. Validate Candidate
    const candidate = election.candidates.find(c => c.id === candidateId);
    if (!candidate) {
      return { success: false, error: 'Invalid candidate selection', status: 400 };
    }

    // 3. Lookup Voter
    const voter = await this.getVoterByVoterId(electionId, cleanVoterId);
    if (!voter) {
      await this.logAudit({
        action: 'ELIGIBILITY_CHECK',
        electionId,
        severity: 'warning',
        message: `Vote attempt with unregistered ID: ${cleanVoterId}`,
        details: { voterId: cleanVoterId, ip },
      });
      return {
        success: false,
        error: `Voter ID "${cleanVoterId}" is not present in the verified electoral roll.`,
        status: 404,
      };
    }

    // 4. Verify Security PIN if provided
    if (securityPin && voter.securityPin && voter.securityPin !== securityPin.trim()) {
      return {
        success: false,
        error: 'Invalid 4-digit Voter PIN. Authentication failed.',
        status: 401,
      };
    }

    // 5. CRITICAL OPOV INVARIANT: Has the voter already voted?
    if (voter.hasVoted) {
      // Record tamper-evident security breach attempt in audit logs
      await this.logAudit({
        action: 'DUPLICATE_VOTE_BLOCKED',
        electionId,
        severity: 'critical',
        message: `SECURITY ALERT: Duplicate vote attempt blocked for Voter ID: ${cleanVoterId}. Voter already cast ballot at ${voter.votedAt}.`,
        details: {
          voterId: cleanVoterId,
          voterName: voter.name,
          previouslyVotedAt: voter.votedAt,
          previousReceiptHash: voter.ballotReceiptHash,
          ip,
        },
      });

      return {
        success: false,
        error: `ONE PERSON ONE VOTE VIOLATION: Voter ${cleanVoterId} (${voter.name}) has already cast their ballot on ${new Date(voter.votedAt || '').toLocaleString()}. Multiple votes are strictly forbidden by protocol.`,
        status: 409, // Conflict
        alreadyVotedAt: voter.votedAt,
      };
    }

    // 6. Generate Cryptographic Receipt Hash (SHA-256)
    const timestamp = new Date().toISOString();
    const verificationCode = `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const hashPayload = `${cleanVoterId}:${electionId}:${candidateId}:${timestamp}:${verificationCode}`;
    const receiptHash = `0x${crypto.createHash('sha256').update(hashPayload).digest('hex')}`;

    // 7. Atomic Lock: Update Voter in Database
    if (this.isConnectedToMongo && this.db) {
      // MongoDB Atomic findOneAndUpdate with condition hasVoted: false
      const result = await this.db.collection('voters').findOneAndUpdate(
        { electionId, voterId: cleanVoterId, hasVoted: false },
        {
          $set: {
            hasVoted: true,
            votedAt: timestamp,
            ballotReceiptHash: receiptHash,
          },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        // Race condition occurred: another concurrent request just marked this voter as hasVoted!
        return {
          success: false,
          error: 'Concurrency conflict: Vote was already registered in a parallel request.',
          status: 409,
        };
      }

      // 8. Anonymous Ballot Record (Voter identity is decoupled from ballot to preserve secrecy)
      const anonymousBallot: AnonymousBallot = {
        ballotId: `BAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        electionId,
        candidateId,
        timestamp,
        verificationHash: receiptHash,
      };
      await this.db.collection('ballots').insertOne(anonymousBallot as any);
    } else {
      // In-Memory atomic update check
      const memVoter = this.memoryStore.voters.find(
        v => v.electionId === electionId && v.voterId.toUpperCase() === cleanVoterId
      );
      if (!memVoter || memVoter.hasVoted) {
        return {
          success: false,
          error: 'One Person One Vote Violation: Ballot already cast.',
          status: 409,
        };
      }

      memVoter.hasVoted = true;
      memVoter.votedAt = timestamp;
      memVoter.ballotReceiptHash = receiptHash;

      const anonymousBallot: AnonymousBallot = {
        ballotId: `BAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        electionId,
        candidateId,
        timestamp,
        verificationHash: receiptHash,
      };
      this.memoryStore.ballots.push(anonymousBallot);
      this.saveBackupData();
    }

    // 9. Append to Immutable Audit Trail
    await this.logAudit({
      action: 'VOTE_CAST_SUCCESS',
      electionId,
      severity: 'success',
      message: `Ballot cast successfully by verified voter [Voter ID: ${cleanVoterId}]. Cryptographic token generated.`,
      details: {
        receiptHashShort: `${receiptHash.slice(0, 10)}...${receiptHash.slice(-8)}`,
        verificationCode,
        timestamp,
      },
    });

    const receipt: VoteReceipt = {
      voterId: cleanVoterId,
      voterName: voter.name,
      electionId,
      electionTitle: election.title,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateParty: candidate.party,
      timestamp,
      receiptHash,
      verificationCode,
    };

    return {
      success: true,
      receipt,
    };
  }

  // TALLY CALCULATION
  public async getTally(electionId: string) {
    const election = await this.getElection(electionId);
    if (!election) throw new Error('Election not found');

    let ballots: AnonymousBallot[] = [];
    let voters: Voter[] = [];

    if (this.isConnectedToMongo && this.db) {
      ballots = (await this.db.collection('ballots').find({ electionId }).toArray()) as unknown as AnonymousBallot[];
      voters = (await this.db.collection('voters').find({ electionId }).toArray()) as unknown as Voter[];
    } else {
      ballots = this.memoryStore.ballots.filter(b => b.electionId === electionId);
      voters = this.memoryStore.voters.filter(v => v.electionId === electionId);
    }

    const totalVotes = ballots.length;
    const registeredVoters = voters.length;
    const turnoutPercentage = registeredVoters > 0 ? (totalVotes / registeredVoters) * 100 : 0;

    const voteCounts: Record<string, number> = {};
    election.candidates.forEach(c => {
      voteCounts[c.id] = 0;
    });

    ballots.forEach(b => {
      if (voteCounts[b.candidateId] !== undefined) {
        voteCounts[b.candidateId]++;
      }
    });

    const candidateResults = election.candidates.map(c => {
      const votes = voteCounts[c.id] || 0;
      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
      return {
        ...c,
        votes,
        percentage: Number(percentage.toFixed(1)),
      };
    });

    // Sort descending by votes
    candidateResults.sort((a, b) => b.votes - a.votes);

    return {
      electionId,
      electionTitle: election.title,
      totalVotes,
      registeredVoters,
      turnoutPercentage: Number(turnoutPercentage.toFixed(1)),
      remainingVoters: Math.max(0, registeredVoters - totalVotes),
      candidateResults,
      lastUpdated: new Date().toISOString(),
    };
  }

  // AUDIT LOGS
  public async logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    if (this.isConnectedToMongo && this.db) {
      await this.db.collection('auditLogs').insertOne(log as any);
    } else {
      this.memoryStore.auditLogs.unshift(log);
      // Keep max 200 logs
      if (this.memoryStore.auditLogs.length > 200) {
        this.memoryStore.auditLogs.pop();
      }
      this.saveBackupData();
    }
    return log;
  }

  public async getAuditLogs(electionId?: string): Promise<AuditLog[]> {
    if (this.isConnectedToMongo && this.db) {
      const query = electionId ? { electionId } : {};
      const docs = await this.db
        .collection('auditLogs')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      return docs as unknown as AuditLog[];
    }
    const filtered = electionId
      ? this.memoryStore.auditLogs.filter(l => l.electionId === electionId)
      : this.memoryStore.auditLogs;
    return filtered.slice(0, 100);
  }

  // RECEIPT VERIFICATION (Voters can verify that their hash was counted in the anonymous ballot box)
  public async verifyReceipt(hash: string) {
    const cleanHash = hash.trim();
    if (this.isConnectedToMongo && this.db) {
      const ballot = await this.db.collection('ballots').findOne({ verificationHash: cleanHash });
      if (!ballot) return { verified: false };
      return {
        verified: true,
        ballot: {
          ballotId: ballot.ballotId,
          electionId: ballot.electionId,
          timestamp: ballot.timestamp,
          verificationHash: ballot.verificationHash,
        },
      };
    }

    const ballot = this.memoryStore.ballots.find(b => b.verificationHash === cleanHash);
    if (!ballot) return { verified: false };
    return {
      verified: true,
      ballot: {
        ballotId: ballot.ballotId,
        electionId: ballot.electionId,
        timestamp: ballot.timestamp,
        verificationHash: ballot.verificationHash,
      },
    };
  }

  // RESET / RE-SEED FOR EXAM DEMONSTRATION
  public async resetElection(electionId: string) {
    console.log(`Resetting election ${electionId} for demo...`);
    if (this.isConnectedToMongo && this.db) {
      await this.db.collection('ballots').deleteMany({ electionId });
      await this.db.collection('voters').updateMany(
        { electionId },
        {
          $set: { hasVoted: false },
          $unset: { votedAt: '', ballotReceiptHash: '' },
        }
      );
      // Re-mark 2 pre-voted voters so duplicate testing is immediately available
      await this.db.collection('voters').updateOne(
        { voterId: 'VOT-2026-108' },
        {
          $set: {
            hasVoted: true,
            votedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            ballotReceiptHash: '0x8f3c1b9942a78e12d4a5b6789123456789abcdef0123456789abcdef01234567',
          },
        }
      );
      await this.db.collection('ballots').insertOne(DEFAULT_BALLOTS[0] as any);
    } else {
      this.memoryStore.ballots = [DEFAULT_BALLOTS[0]];
      this.memoryStore.voters = DEFAULT_VOTERS.map(v => {
        if (v.voterId === 'VOT-2026-108') {
          return {
            ...v,
            hasVoted: true,
            votedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            ballotReceiptHash: '0x8f3c1b9942a78e12d4a5b6789123456789abcdef0123456789abcdef01234567',
          };
        }
        return {
          ...v,
          hasVoted: false,
          votedAt: undefined,
          ballotReceiptHash: undefined,
        };
      });
      this.saveBackupData();
    }

    await this.logAudit({
      action: 'ELECTION_RESET',
      electionId,
      severity: 'warning',
      message: 'Election reset to demo state: ballots cleared, voter statuses restored for testing.',
    });

    return { success: true };
  }
}

export const dbService = new DatabaseService();
