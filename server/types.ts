export interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  bio: string;
  avatarUrl?: string;
  color: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'upcoming' | 'closed';
  startDate: string;
  endDate: string;
  totalRegisteredVoters: number;
  candidates: Candidate[];
  createdAt: string;
}

export interface Voter {
  _id?: string;
  id: string;
  voterId: string; // Unique government / university identifier, e.g. VOT-2026-001
  electionId: string;
  name: string;
  department: string;
  email: string;
  securityPin: string; // 4-digit verification code
  hasVoted: boolean;
  votedAt?: string;
  ballotReceiptHash?: string;
  registeredAt: string;
}

export interface AnonymousBallot {
  _id?: string;
  ballotId: string;
  electionId: string;
  candidateId: string;
  timestamp: string;
  verificationHash: string; // SHA-like proof token given to voter
}

export interface AuditLog {
  _id?: string;
  id: string;
  timestamp: string;
  action: 'VOTER_REGISTERED' | 'ELIGIBILITY_CHECK' | 'VOTE_CAST_SUCCESS' | 'DUPLICATE_VOTE_BLOCKED' | 'ELECTION_RESET' | 'SEED_DATA';
  electionId: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  details?: Record<string, any>;
  ip?: string;
}

export interface VoteReceipt {
  voterId: string;
  voterName: string;
  electionId: string;
  electionTitle: string;
  candidateId: string;
  candidateName: string;
  candidateParty: string;
  timestamp: string;
  receiptHash: string;
  verificationCode: string;
}

export interface DatabaseStatus {
  connected: boolean;
  provider: 'mongodb' | 'embedded-mongo';
  databaseName: string;
  uriPreview: string;
  collections: {
    elections: number;
    voters: number;
    ballots: number;
    auditLogs: number;
  };
  lastChecked: string;
}
