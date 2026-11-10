import { Election, Voter, ElectionTally, AuditLog, VoteReceipt, DatabaseStatus } from './types';

export const api = {
  async getStatus(): Promise<{ status: string; database: DatabaseStatus }> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async connectDb(uri: string): Promise<{ result: { success: boolean; message: string }; status: DatabaseStatus }> {
    const res = await fetch('/api/db/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to connect to database');
    }
    return res.json();
  },

  async getElections(): Promise<Election[]> {
    const res = await fetch('/api/elections');
    if (!res.ok) throw new Error('Failed to fetch elections');
    return res.json();
  },

  async getElection(id: string): Promise<Election> {
    const res = await fetch(`/api/elections/${id}`);
    if (!res.ok) throw new Error('Failed to fetch election details');
    return res.json();
  },

  async getVoters(electionId: string): Promise<Voter[]> {
    const res = await fetch(`/api/elections/${electionId}/voters`);
    if (!res.ok) throw new Error('Failed to fetch voter roll');
    return res.json();
  },

  async checkVoter(electionId: string, voterId: string): Promise<{
    registered: boolean;
    voterId?: string;
    name?: string;
    department?: string;
    hasVoted?: boolean;
    votedAt?: string;
    ballotReceiptHash?: string;
    securityPin?: string;
    message?: string;
  }> {
    const res = await fetch(`/api/elections/${electionId}/voters/${encodeURIComponent(voterId)}/check`);
    return res.json();
  },

  async registerVoter(electionId: string, data: {
    voterId: string;
    name: string;
    department: string;
    email?: string;
    securityPin?: string;
  }): Promise<{ success: boolean; voter?: Voter; error?: string }> {
    const res = await fetch(`/api/elections/${electionId}/voters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to register voter');
    }
    return json;
  },

  async castVote(electionId: string, payload: {
    voterId: string;
    candidateId: string;
    securityPin?: string;
  }): Promise<{ success: boolean; receipt?: VoteReceipt; error?: string; alreadyVotedAt?: string }> {
    const res = await fetch(`/api/elections/${electionId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      const error: any = new Error(json.error || 'Vote failed');
      error.status = res.status;
      error.alreadyVotedAt = json.alreadyVotedAt;
      throw error;
    }
    return json;
  },

  async simulateDuplicateVote(electionId: string, voterId?: string, candidateId?: string): Promise<any> {
    const res = await fetch(`/api/elections/${electionId}/simulate-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId, candidateId }),
    });
    const json = await res.json();
    return { status: res.status, data: json };
  },

  async getTally(electionId: string): Promise<ElectionTally> {
    const res = await fetch(`/api/elections/${electionId}/tally`);
    if (!res.ok) throw new Error('Failed to fetch live tally');
    return res.json();
  },

  async getAuditLogs(electionId: string): Promise<AuditLog[]> {
    const res = await fetch(`/api/elections/${electionId}/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async verifyReceipt(electionId: string, receiptHash: string): Promise<{
    verified: boolean;
    ballot?: { ballotId: string; electionId: string; timestamp: string; verificationHash: string };
  }> {
    const res = await fetch(`/api/elections/${electionId}/verify-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptHash }),
    });
    if (!res.ok) throw new Error('Failed to verify receipt');
    return res.json();
  },

  async resetElection(electionId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/elections/${electionId}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset election');
    return res.json();
  },
};
