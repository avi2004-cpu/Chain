import { Router } from 'express';
import { getContract, decode } from '../gateway/connection.js';
import { computeRisk } from '../risk-engine/riskEngine.js';

const router = Router();

const CLASSIFICATIONS = [
  'Public', 'Internal', 'Confidential', 'Restricted'
];

async function lookupIdentity(address) {
  try {
    const contract = await getContract('identity');
    const registered =
      decode(await contract.evaluateTransaction(
        'IsRegistered', address
      )) === 'true';

    if (!registered) return { registered: false };

    const role = decode(
      await contract.evaluateTransaction('GetRole', address)
    );
    return { registered: true, role };
  } catch {
    return { registered: false };
  }
}

function validateRequest(body) {
  const {
    assetId, requesterDID, classification
  } = body ?? {};

  if (!assetId || typeof assetId !== 'string') {
    return 'assetId is required';
  }
  if (!requesterDID || typeof requesterDID !== 'string') {
    return 'requesterDID is required';
  }
  if (!CLASSIFICATIONS.includes(classification)) {
    return `classification must be one of ${CLASSIFICATIONS.join(', ')}`;
  }
  return null;
}

async function evaluateRequest(body) {
  const {
    classification,
    requesterAddress,
    anomalyDevice,
    anomalyLocation,
    anomalyTime,
    requiresMultiSig,
  } = body;

  const identity = requesterAddress
    ? await lookupIdentity(requesterAddress)
    : undefined;

  return computeRisk({
    classification,
    anomalyDevice: Boolean(anomalyDevice),
    anomalyLocation: Boolean(anomalyLocation),
    anomalyTime: Boolean(anomalyTime),
    requiresMultiSig: Boolean(requiresMultiSig),
    identity,
  });
}

// Risk evaluation only. No ledger transaction is created here.
router.post('/request', async (req, res) => {
  try {
    const validationError = validateRequest(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await evaluateRequest(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Commit the user's final decision to Fabric.
router.post('/decision', async (req, res) => {
  try {
    const validationError = validateRequest(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { assetId, requesterDID, classification, action } =
      req.body;

    if (!['ALLOW', 'DECLINE'].includes(action)) {
      return res.status(400).json({
        error: 'action must be ALLOW or DECLINE'
      });
    }

    // Recalculate on the server; never trust a client-supplied score.
    const result = await evaluateRequest(req.body);

    if (action === 'ALLOW' && result.outcome !== 'ALLOW') {
      return res.status(403).json({
        error: `Allow denied: risk outcome is ${result.outcome}`,
        ...result
      });
    }

    const allowed = action === 'ALLOW';
    const contract = await getContract('access-control');

    const commit = await contract.submitAsync('LogDecision', {
      arguments: [
        assetId,
        requesterDID,
        classification,
        String(result.score),
        String(allowed),
      ],
    });

    const txId = commit.getTransactionId();
    const status = await commit.getStatus();

    if (!status.successful) {
      return res.status(502).json({
        error: `Decision was not committed to Fabric (status: ${status.code})`,
        txHash: txId,
      });
    }

    return res.json({
      success: true,
      action,
      outcome: result.outcome,
      score: result.score,
      txHash: txId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
        JSON.parse(
          decode(
            await contract.evaluateTransaction('GetLog', String(i))
          )
        )
      )
    );

    return res.json(logs.reverse());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
