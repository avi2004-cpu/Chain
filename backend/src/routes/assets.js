import { Router } from 'express';
import { getContract, decode } from '../gateway/connection.js';

const router = Router();

function parseAssetMetadata(body, includeHash = false) {
  const metadata = {};

  for (const [field, value] of Object.entries({
    organization: body.organization,
    format: body.format ?? body.fileFormat,
    description: body.description,
  })) {
    if (value == null) continue;
    if (typeof value !== 'string') throw new Error(`${field} must be a string`);
    if (value.trim()) metadata[field] = value.trim();
  }

  const size = body.size ?? body.fileSize;
  if (size != null && size !== '') {
    const parsedSize = typeof size === 'string' && /^\d+$/.test(size) ? Number(size) : size;
    if (!Number.isSafeInteger(parsedSize) || parsedSize < 0) {
      throw new Error('size must be a non-negative integer in bytes');
    }
    metadata.size = parsedSize;
  }

  if (includeHash) {
    const metadataHash = body.metadataHash ?? body.sha256;
    if (metadataHash != null) {
      if (typeof metadataHash !== 'string') throw new Error('metadataHash must be a string');
      if (metadataHash.trim()) metadata.metadataHash = metadataHash.trim();
    }
  }

  return metadata;
}

router.post('/mint', async (req, res) => {
  try {
    const { id, name, classification, ownerDID } = req.body;
    const metadataHash = req.body.metadataHash ?? req.body.sha256;
    const metadata = parseAssetMetadata(req.body);
    const contract = await getContract('asset');
    if (Object.keys(metadata).length > 0) {
      await contract.submitTransaction('MintAssetWithMetadata', id, name, classification, ownerDID, metadataHash, JSON.stringify(metadata));
    } else {
      await contract.submitTransaction('MintAsset', id, name, classification, ownerDID, metadataHash);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/metadata', async (req, res) => {
  try {
    const metadata = parseAssetMetadata(req.body ?? {}, true);
    if (Object.keys(metadata).length === 0) {
      return res.status(400).json({ error: 'at least one metadata field must be provided' });
    }

    const contract = await getContract('asset');
    await contract.submitTransaction('UpdateAssetMetadata', req.params.id, JSON.stringify(metadata));
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

router.get('/', async (req, res) => {
  try {
    const contract = await getContract('asset');
    const result = await contract.evaluateTransaction('GetAllAssets');
    res.json(JSON.parse(decode(result)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
