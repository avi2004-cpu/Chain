import { Router } from 'express';
import { getContract } from '../gateway/connection.js';

const router = Router();

router.post('/mint', async (req, res) => {
  try {
    const { id, name, classification, ownerDID, metadataHash } = req.body;
    const contract = await getContract('asset');
    await contract.submitTransaction('MintAsset', id, name, classification, ownerDID, metadataHash);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contract = await getContract('asset');
    const result = await contract.evaluateTransaction('GetAsset', req.params.id);
    res.json(JSON.parse(result.toString()));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/:id/transfer', async (req, res) => {
  try {
    const { newOwnerDID } = req.body;
    const contract = await getContract('asset');
    await contract.submitTransaction('TransferAsset', req.params.id, newOwnerDID);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;