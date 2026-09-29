
import { Router } from 'express';
import { getContract, decode } from '../gateway/connection.js';
import { computeRisk } from '../risk-engine/riskEngine.js';

const router = Router();

router.post('/request', async (req, res) => {
  try {
    const {
      assetId, requesterDID, classification,
      anomalyDevice, anomalyLocation, anomalyTime,
      requiresMultiSig
    } = req.body;

    const result = computeRisk({
      classification, anomalyDevice, anomalyLocation,
      anomalyTime, requiresMultiSig
    });
    const allowed = result.outcome === 'ALLOW';

    const contract = await getContract('access-control');
    const commit = contract.submitAsync('LogDecision', {
      arguments: [
        assetId, requesterDID, classification,
        String(result.score), String(allowed)
      ],
    });

    const submitResult = await commit;
    const txId = submitResult.getTransactionId
      ? submitResult.getTransactionId()
      : undefined;
    await submitResult.getStatus();

    res.json({ ...result, txHash: txId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const contract = await getContract('access-control');
    const count = parseInt(
      decode(await contract.evaluateTransaction('GetLogCount')),
      10
    );

    const logs = [];
    for (let i = 0; i < count; i++) {
      logs.push(
        JSON.parse(
          decode(await contract.evaluateTransaction('GetLog', String(i)))
        )
      );
    }
    res.json(logs.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
