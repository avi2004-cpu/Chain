import { Router } from 'express';
import { getContract, decode } from '../gateway/connection.js';
import { computeRisk } from '../risk-engine/riskEngine.js';

const router = Router();

const CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'];

// Ask the identity chaincode about the requester. Fails CLOSED: if the
// lookup errors for any reason the requester is treated as unregistered,
// which the risk engine turns into a BLOCK.
async function lookupIdentity(address) {
  try {
    const contract = await getContract('identity');
    const registered = decode(await contract.evaluateTransaction('IsRegistered', address)) === 'true';
    if (!registered) return { registered: false };
    const role = decode(await contract.evaluateTransaction('GetRole', address));
    return { registered: true, role };
  } catch {
    return { registered: false };
  }
}

router.post('/request', async (req, res) => {
  try {
    const {
      assetId, requesterDID, requesterAddress, classification,
      anomalyDevice, anomalyLocation, anomalyTime,
      requiresMultiSig,
    } = req.body ?? {};

    if (!assetId || typeof assetId !== 'string') {
      return res.status(400).json({ error: 'assetId is required' });
    }
    if (!requesterDID || typeof requesterDID !== 'string') {
      return res.status(400).json({ error: 'requesterDID is required' });
    }
    if (!CLASSIFICATIONS.includes(classification)) {
      return res.status(400).json({ error: `classification must be one of ${CLASSIFICATIONS.join(', ')}` });
    }

    // Optional: when the client sends the wallet address, verify it against
    // the identity chaincode. Omitted -> identity factors stay at baseline.
    const identity = requesterAddress ? await lookupIdentity(requesterAddress) : undefined;

    const result = computeRisk({
      classification,
      anomalyDevice: Boolean(anomalyDevice),
      anomalyLocation: Boolean(anomalyLocation),
      anomalyTime: Boolean(anomalyTime),
      requiresMultiSig: Boolean(requiresMultiSig),
      identity,
    });
    const allowed = result.outcome === 'ALLOW';

    const contract = await getContract('access-control');
    const commit = await contract.submitAsync('LogDecision', {
      arguments: [
        assetId, requesterDID, classification,
        String(result.score), String(allowed),
      ],
    });
    const txId = commit.getTransactionId();

    // submitAsync returns after ENDORSEMENT + ORDERING. The transaction is
    // only on the ledger once it is validated and committed, so check the
    // status - a failed endorsement policy / MVCC conflict must not be
    // reported to the client as a successfully logged decision.
    const status = await commit.getStatus();
    if (!status.successful) {
      return res.status(502).json({
        error: `Access decision was not committed to the ledger (status code ${status.code})`,
        txHash: txId,
      });
    }

    res.json({ ...result, txHash: txId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const contract = await getContract('access-control');
    const count = parseInt(
      decode(await contract.evaluateTransaction('GetLogCount')),
      10
    );

    const logs = await Promise.all(
      Array.from({ length: count }, async (_, i) =>
        JSON.parse(decode(await contract.evaluateTransaction('GetLog', String(i))))
      )
    );
    res.json(logs.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
