import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Fingerprint, 
  Key, 
  Copy, 
  Check, 
  Clock, 
  ArrowLeft, 
  FileCheck2, 
  RefreshCw,
  Building2,
  Lock,
  ExternalLink
} from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import FactorBar from '../components/FactorBar';
import ClassificationBadge from '../components/ClassificationBadge';
import { useAccessRequest } from '../context/AccessRequestContext';
import { signStepUpChallenge, logDecision } from '../services/mockApi';

export default function RiskDecision({ onNavigateToRequest }) {
  const { 
    selectedAsset, 
    activeDecision, 
    isComputing, 
    setIsComputing, 
    contextTelemetry, 
    showToast 
  } = useAccessRequest();

  // Redirect handling: if user lands here directly without selecting an asset
  useEffect(() => {
    if (!selectedAsset && !isComputing) {
      showToast('No active access request. Redirecting to Asset Selection...', 'info');
      onNavigateToRequest();
    }
  }, [selectedAsset, isComputing]);

  // Step-Up Wallet Signature States: 'idle' | 'signing' | 'signed' | 'error'
  const [signStatus, setSignStatus] = useState('idle');
  const [signatureProof, setSignatureProof] = useState(null);
  const [signError, setSignError] = useState(null);

  // Multi-Org Endorsement States (for Restricted assets)
  const [approvedOrgs, setApprovedOrgs] = useState(['BEL Admin Org']);
  const requiredOrgs = ['BEL Admin Org', 'Military Security Org'];

  // Decision logging state
  const [isLogged, setIsLogged] = useState(false);
  const [loggedTxHash, setLoggedTxHash] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Simulated computation steps during loading state
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isComputing) {
      setLoadingStep(1);
      const t1 = setTimeout(() => setLoadingStep(2), 250);
      const t2 = setTimeout(() => setLoadingStep(3), 500);
      const t3 = setTimeout(() => {
        setIsComputing(false);
      }, 750);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isComputing]);

  // Automatically log decision to Fabric ledger when outcome settles
  useEffect(() => {
    if (activeDecision && !isLogged && !isComputing && selectedAsset) {
      logDecision({
        assetId: selectedAsset.id,
        classification: selectedAsset.classification,
        score: activeDecision.calculatedScore,
        outcome: activeDecision.outcome,
        requester: "did:fabric:bel:user:safeer.eng",
        endorsement: selectedAsset.classification === 'Restricted' ? 'Multi-Org Pending' : 'Approved'
      }).then((res) => {
        setIsLogged(true);
        setLoggedTxHash(res.txHash);
      });
    }
  }, [activeDecision, isComputing]);

  // Handle Step-Up Cryptographic Signature
  const handleSign = async () => {
    try {
      setSignStatus('signing');
      setSignError(null);
      const res = await signStepUpChallenge({
        address: "0x892a...e901",
        assetId: selectedAsset?.id,
        challenge: "CHAIN-GUARD-ZERO-TRUST-CHALLENGE-9921"
      });
      setSignStatus('signed');
      setSignatureProof(res);
      showToast('Wallet signed successfully. Identity challenge verified.', 'success');
    } catch (err) {
      setSignStatus('error');
      setSignError(err.message || 'Signature rejected by wallet');
      showToast(err.message || 'Signature failed', 'error');
    }
  };

  // Simulate Multi-Org Endorsement approval
  const handleApproveOrg = (org) => {
    if (!approvedOrgs.includes(org)) {
      const updated = [...approvedOrgs, org];
      setApprovedOrgs(updated);
      showToast(`${org} endorsement signature committed to Fabric ledger!`);
    }
  };

  const handleCopyKey = () => {
    setCopiedKey(true);
    showToast('Ephemeral AES-256 decryption key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // If no asset is present, redirect view returns placeholder while useEffect redirects
  if (!selectedAsset) {
    return (
      <div className="main-content">
        <div className="panel empty-state">
          <Clock size={36} className="empty-icon" />
          <div className="empty-title">Redirecting to Asset Selection...</div>
          <p className="empty-copy">No evaluation is currently queued.</p>
          <button onClick={onNavigateToRequest} className="btn-primary">
            Go to Asset Request
          </button>
        </div>
      </div>
    );
  }

  // 1. Loading State while risk is computed
  if (isComputing) {
    return (
      <div className="main-content">
        <div className="page-head">
          <div>
            <h1 className="page-title">Evaluating Zero-Trust Security Policies</h1>
            <p className="page-desc">Running real-time Fabric chaincode verification & risk calculation...</p>
          </div>
        </div>

        <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', marginBottom: '24px' }}>
            <RefreshCw size={44} color="var(--accent)" className="spin" style={{ animation: 'spin 1.2s linear infinite' }} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
            Processing Cryptographic Authorization
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '24px', maxWidth: '50ch', margin: '0 auto 24px' }}>
            Evaluating asset <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{selectedAsset.id}</span> against Fabric endorsement policies and anomaly scoring.
          </p>

          {/* Stepper Visualizer */}
          <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: loadingStep >= 1 ? 'var(--allow)' : 'var(--text-faint)' }}>
              <Check size={14} /> Validating Fabric DID certificate chain...
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: loadingStep >= 2 ? 'var(--allow)' : 'var(--text-faint)' }}>
              <Check size={14} /> Inspecting telemetry: IP, location, & FIDO2 token...
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: loadingStep >= 3 ? 'var(--allow)' : 'var(--text-faint)' }}>
              <Check size={14} /> Computing Bayesian risk score across BEL security rules...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const outcome = activeDecision?.outcome || 'Allow';
  const score = activeDecision?.calculatedScore || 24;
  const isRestricted = selectedAsset.classification === 'Restricted';
  const isMultiOrgComplete = approvedOrgs.length >= requiredOrgs.length;

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <button
            onClick={onNavigateToRequest}
            className="btn-secondary"
            style={{ marginBottom: '10px', padding: '4px 8px', fontSize: '11px' }}
          >
            <ArrowLeft size={13} />
            Back to Asset Request
          </button>
          <h1 className="page-title">Risk Decision & Cryptographic Clearance</h1>
          <p className="page-desc">
            Autonomous Zero-Trust evaluation for request on{' '}
            <strong style={{ color: 'var(--text)' }}>{selectedAsset.name}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ClassificationBadge classification={selectedAsset.classification} />
          <span className={`badge ${outcome}`}>{outcome}</span>
        </div>
      </div>

      {/* Grid Layout: Risk Gauge + Factor Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}
      >
        {/* Left Column: Gauge Card */}
        <div className="panel" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', marginBottom: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 700 }}>
              Calculated Risk Score
            </span>
          </div>

          <RiskGauge score={score} outcome={outcome} size={240} />

          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              fontSize: '11.5px',
              color: 'var(--text-dim)',
              textAlign: 'center'
            }}
          >
            Policy Engine: <strong style={{ color: 'var(--text)' }}>ZeroTrust-v2.5 (Bayesian)</strong>
          </div>
        </div>

        {/* Right Column: Factor Breakdown */}
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Contributing Risk Factors</h2>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                Granular weight breakdown computed from environment & credential posture
              </div>
            </div>
            <span className="mono" style={{ fontSize: '11px', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '3px' }}>
              Weight Sum: {score}/100
            </span>
          </div>

          <FactorBar factors={activeDecision?.factors} />
        </div>
      </div>

      {/* Outcome Cards: 3 Explicit Branches */}

      {/* BRANCH 1: ALLOW (Green) */}
      {outcome === 'Allow' && (
        <div
          className="panel"
          style={{
            borderLeft: '4px solid var(--allow)',
            padding: '24px 28px',
            background: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--allow-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={24} color="var(--allow)" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  Access Granted — Risk Score Within Acceptable Threshold
                </h3>
                <span className="badge Allow">Allow</span>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '16px', maxWidth: '75ch' }}>
                Your identity DID and workstation telemetry meet all clearance requirements for{' '}
                <strong style={{ color: 'var(--text)' }}>{selectedAsset.name}</strong>. An ephemeral access token has been generated.
              </p>

              {/* Ephemeral Access Token Box */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '16px'
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 600 }}>
                    Ephemeral Decryption Key (Valid for 4 Hours)
                  </div>
                  <div className="mono" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>
                    key_aes256_gcm_99a81c03df99e4b771a0
                  </div>
                </div>

                <button onClick={handleCopyKey} className="btn-secondary" style={{ padding: '6px 12px' }}>
                  {copiedKey ? <Check size={13} color="var(--allow)" /> : <Copy size={13} />}
                  <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>

              {/* Fabric Immutable Ledger Confirmation */}
              {isLogged && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                  <FileCheck2 size={14} color="var(--allow)" />
                  <span>Committed to Hyperledger Fabric:</span>
                  <span className="mono" style={{ color: 'var(--accent-strong)' }}>
                    {loggedTxHash?.slice(0, 32)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BRANCH 2: STEP-UP (Amber) */}
      {outcome === 'Step-Up' && (
        <div
          className="panel"
          style={{
            borderLeft: '4px solid var(--stepup)',
            padding: '24px 28px',
            background: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--stepup-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Fingerprint size={24} color="var(--stepup)" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  Step-Up Authentication Required
                </h3>
                <span className="badge Step-Up">Step-Up</span>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '16px', maxWidth: '75ch' }}>
                Risk score of <strong style={{ color: 'var(--stepup)' }}>{score}</strong> requires additional cryptographic authentication to verify the physical keyholder before releasing sensitive documents.
              </p>

              {/* Step 1: Wallet Signature Prompt */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={16} color="var(--stepup)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Hardware / Wallet Challenge (FIDO2 / MetaMask)
                    </span>
                  </div>
                  {signStatus === 'signed' && (
                    <span className="badge Allow" style={{ background: 'var(--allow-soft)', color: 'var(--allow)' }}>
                      Signature Verified
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  Sign payload <code className="mono">0x448a...92b</code> to prove live physical presence on this terminal.
                </p>

                {signStatus === 'idle' && (
                  <button onClick={handleSign} className="btn-primary" style={{ background: 'var(--stepup)' }}>
                    <Fingerprint size={14} />
                    Sign Challenge with Wallet
                  </button>
                )}

                {signStatus === 'signing' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--stepup)' }}>
                    <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.2s linear infinite' }} />
                    <span>Waiting for user signature in wallet extension...</span>
                  </div>
                )}

                {signStatus === 'signed' && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                    Signature committed:{' '}
                    <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {signatureProof?.signature}
                    </span>
                  </div>
                )}

                {signStatus === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--block)' }}>{signError}</span>
                    <button onClick={handleSign} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                      Retry Sign
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Multi-Org Endorsement Checklist (for Restricted Assets) */}
              {isRestricted && (
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="var(--accent)" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        Fabric Multi-Organization Endorsement Policy
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {approvedOrgs.length} of {requiredOrgs.length} Endorsed
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
                    Because this asset is classified as <strong style={{ color: 'var(--text)' }}>Restricted</strong>, Fabric policy requires endorsement by both BEL Admin Org and Military Security Org.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {requiredOrgs.map((org) => {
                      const isApproved = approvedOrgs.includes(org);
                      return (
                        <div
                          key={org}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: isApproved ? 'var(--allow-soft)' : 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isApproved ? <Check size={14} color="var(--allow)" /> : <Lock size={14} color="var(--text-faint)" />}
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{org}</span>
                          </div>

                          {isApproved ? (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--allow)' }}>
                              Endorsed on Fabric
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApproveOrg(org)}
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-strong)' }}
                            >
                              Simulate Multi-Org Endorsement
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isMultiOrgComplete && signStatus === 'signed' && (
                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge Endorsed">Endorsement Complete</span>
                      <button onClick={handleCopyKey} className="btn-primary" style={{ padding: '6px 12px' }}>
                        <Copy size={13} />
                        Retrieve Decrypted Payload
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BRANCH 3: BLOCK (Red) */}
      {outcome === 'Block' && (
        <div
          className="panel"
          style={{
            borderLeft: '4px solid var(--block)',
            padding: '24px 28px',
            background: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--block-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldX size={24} color="var(--block)" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  Access Denied — Severe Security Anomaly Detected
                </h3>
                <span className="badge Block">Block</span>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '16px', maxWidth: '75ch' }}>
                Your request received a risk index of <strong style={{ color: 'var(--block)' }}>{score}</strong>, exceeding the maximum permissible threshold for this clearance tier. Access has been blocked automatically.
              </p>

              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--block)', marginBottom: '6px' }}>
                  Risk Violations Flagged:
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Untrusted network origin detected outside designated secure perimeter.</li>
                  <li>Terminal lacks hardware cryptographic attestation module (TPM 2.0 / FIDO2).</li>
                  <li>Requested clearance level exceeds verified role credentials.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Security Incident Ref: <span style={{ color: 'var(--text)', fontWeight: 600 }}>SEC-ANOMALY-9921</span>
                </div>
                <button
                  onClick={() => showToast('Security incident report logged to Fabric auditor queue')}
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  Notify BEL Security Operations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
