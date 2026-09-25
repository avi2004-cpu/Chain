import { Router } from 'express';
import { getContract } from '../gateway/connection.js';
import { computeRisk } from '../risk-engine/riskEngine.js';

const router = Router();

router.post('/request', async (req, res) => {
  try {
    const { assetId, requesterDID, classification, anomalyDevice, anomalyLocation, anomalyTime, requiresMultiSig } = req.body;
    const result = computeRisk({ classification, anomalyDevice, anomalyLocation, anomalyTime, requiresMultiSig });
    const allowed = result.outcome === 'ALLOW';

    const contract = await getContract('access-control');
    await contract.submitTransaction('LogDecision', assetId, requesterDID, String(result.score), String(allowed));

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const contract = await getContract('access-control');
    const count = parseInt((await contract.evaluateTransaction('GetLogCount')).toString(), 10);
    const logs = [];
    for (let i = 0; i < count; i++) {
      logs.push(JSON.parse((await contract.evaluateTransaction('GetLog', String(i))).toString()));
    }
    res.json(logs.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;