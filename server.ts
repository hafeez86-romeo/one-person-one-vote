import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { dbService } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database (attempts MongoDB connection if URI exists, otherwise built-in engine)
  console.log('Initializing database service...');
  await dbService.init();

  // API Routes
  // 1. Health & Database Status
  app.get('/api/status', async (req, res) => {
    try {
      const status = await dbService.getStatus();
      res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        database: status,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Dynamic MongoDB URI Re-connection (for Exam Demo)
  app.post('/api/db/connect', async (req, res) => {
    try {
      const { uri } = req.body;
      const result = await dbService.init(uri);
      const status = await dbService.getStatus();
      res.json({ result, status });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 3. Elections list & single
  app.get('/api/elections', async (req, res) => {
    try {
      const elections = await dbService.getElections();
      res.json(elections);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/elections/:id', async (req, res) => {
    try {
      const election = await dbService.getElection(req.params.id);
      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
      res.json(election);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Voters list for an election
  app.get('/api/elections/:id/voters', async (req, res) => {
    try {
      const voters = await dbService.getVoters(req.params.id);
      // Return list for UI testing and admin verification
      res.json(voters);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Voter Eligibility Check
  app.get('/api/elections/:id/voters/:voterId/check', async (req, res) => {
    try {
      const { id: electionId, voterId } = req.params;
      const voter = await dbService.getVoterByVoterId(electionId, voterId);
      if (!voter) {
        return res.status(404).json({
          registered: false,
          message: `Voter ID ${voterId.toUpperCase()} is not registered in this election.`,
        });
      }

      res.json({
        registered: true,
        voterId: voter.voterId,
        name: voter.name,
        department: voter.department,
        hasVoted: voter.hasVoted,
        votedAt: voter.votedAt,
        ballotReceiptHash: voter.ballotReceiptHash,
        securityPin: voter.securityPin, // Returned in demo environment for instant testing
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Register New Voter
  app.post('/api/elections/:id/voters', async (req, res) => {
    try {
      const { id: electionId } = req.params;
      const { voterId, name, department, email, securityPin } = req.body;

      if (!voterId || !name || !department) {
        return res.status(400).json({ error: 'voterId, name, and department are required.' });
      }

      const result = await dbService.registerVoter({
        electionId,
        voterId,
        name,
        department,
        email: email || `${voterId.toLowerCase()}@univ.edu`,
        securityPin,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Cast Ballot (ATOMIC ONE PERSON ONE VOTE ENFORCEMENT)
  app.post('/api/elections/:id/vote', async (req, res) => {
    try {
      const { id: electionId } = req.params;
      const { voterId, candidateId, securityPin } = req.body;

      if (!voterId || !candidateId) {
        return res.status(400).json({ error: 'voterId and candidateId are required.' });
      }

      const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const result = await dbService.castVote({
        electionId,
        voterId,
        candidateId,
        securityPin,
        ip: clientIp,
      });

      if (!result.success) {
        return res.status(result.status || 400).json({
          error: result.error,
          alreadyVotedAt: result.alreadyVotedAt,
        });
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Simulate Duplicate Vote Attempt (Demo & Viva tool)
  app.post('/api/elections/:id/simulate-duplicate', async (req, res) => {
    try {
      const { id: electionId } = req.params;
      const { voterId, candidateId } = req.body;

      // Find target voter
      const voter = await dbService.getVoterByVoterId(electionId, voterId || 'VOT-2026-108');
      if (!voter) {
        return res.status(404).json({ error: 'Test voter not found.' });
      }

      const clientIp = req.ip || '127.0.0.1';
      const result = await dbService.castVote({
        electionId,
        voterId: voter.voterId,
        candidateId: candidateId || 'cand-02',
        ip: clientIp,
      });

      res.status(result.status || (result.success ? 200 : 409)).json({
        ...result,
        simulationNote: 'Executed duplicate voting stress test on One Person One Vote engine.',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Live Election Tally & Analytics
  app.get('/api/elections/:id/tally', async (req, res) => {
    try {
      const tally = await dbService.getTally(req.params.id);
      res.json(tally);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Tamper-Evident Audit Logs
  app.get('/api/elections/:id/audit-logs', async (req, res) => {
    try {
      const logs = await dbService.getAuditLogs(req.params.id);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Verify Anonymous Receipt Hash
  app.post('/api/elections/:id/verify-receipt', async (req, res) => {
    try {
      const { receiptHash } = req.body;
      if (!receiptHash) {
        return res.status(400).json({ error: 'receiptHash is required.' });
      }
      const verification = await dbService.verifyReceipt(receiptHash);
      res.json(verification);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Reset election state
  app.post('/api/elections/:id/reset', async (req, res) => {
    try {
      const result = await dbService.resetElection(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration in Development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (http://0.0.0.0:${PORT})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
