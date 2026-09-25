import { Router } from 'express';
import { getContract, decode } from '../gateway/connection.js';
const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { address, did, role } = req.body;
    const contract = await getContract('identity');
    await contract.submitTransaction('RegisterIdentity', address, did, role);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:address', async (req, res) => {
  try {
    const contract = await getContract('identity');
    const [role, did, registered] = await Promise.all([
      contract.evaluateTransaction('GetRole', req.params.address),
      contract.evaluateTransaction('GetDID', req.params.address),
      contract.evaluateTransaction('IsRegistered', req.params.address),
    ]);
    res.json({
      address: req.params.address,
      role: decode(role),
      did: decode(did),
      registered: decode(registered) === 'true',
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;