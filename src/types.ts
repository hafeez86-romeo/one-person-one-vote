export interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  bio: string;
  avatarUrl?: string;
  color: string;
}

export interface CandidateResult extends Candidate {
  votes: number;
  percentage: number;
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
  voterId: string;
  electionId: string;
  name: string;
  department: string;
  email: string;
  securityPin: string;
  hasVoted: boolean;
  votedAt?: string;
  ballotReceiptHash?: string;
  registeredAt: string;
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

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'VOTER_REGISTERED' | 'ELIGIBILITY_CHECK' | 'VOTE_CAST_SUCCESS' | 'DUPLICATE_VOTE_BLOCKED' | 'ELECTION_RESET' | 'SEED_DATA';
  electionId: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  details?: Record<string, any>;
  ip?: string;
}

export interface ElectionTally {
  electionId: string;
  electionTitle: string;
  totalVotes: number;
  registeredVoters: number;
  turnoutPercentage: number;
  remainingVoters: number;
  candidateResults: CandidateResult[];
  lastUpdated: string;
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
