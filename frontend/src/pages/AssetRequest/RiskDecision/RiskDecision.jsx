/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import {
  ShieldCheck,
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
  AlertTriangle,
} from 'lucide-react';
import RiskGauge from '../../../components/RiskGauge';
import FactorBar from '../../../components/FactorBar';
import ClassificationBadge from '../../../components/ClassificationBadge';
import { useAccessRequest } from '../../../context/AccessRequestContext';
import { useWallet } from '../../../context/WalletContext';
import { signStepUpChallenge, commitDecision } from '../../../services/mockApi';

export default function RiskDecision({ onNavigateToRequest }) {
  const {
    selectedAsset,
    activeDecision,
    isComputing,
    decisionError,
    commitResult,
    setCommitResult,
    contextTelemetry,
    runEvaluation,
    showToast,
  } = useAccessRequest();
  const { address, did } = useWallet();

  // Redirect handling: if user lands here directly without selecting an asset
  useEffect(() => {
    if (!selectedAsset && !isComputing) {
      showToast('No active access request. Redirecting to Asset Selection...', 'info');
      onNavigateToRequest();
    }
  }, [selectedAsset, isComputing, onNavigateToRequest, showToast]);

  // Step-Up Wallet Signature States: 'idle' | 'signing' | 'signed' | 'error'
  // NOTE: the step-up signature and multi-org approvals below are SIMULATED UI only.
  const [signStatus, setSignStatus] = useState('idle');
  const [signatureProof, setSignatureProof] = useState(null);
  const [signError, setSignError] = useState(null);

  // Multi-Org Endorsement States (for Restricted assets) - simulated
  const [approvedOrgs, setApprovedOrgs] = useState(['BEL Admin Org']);
  const requiredOrgs = ['BEL Admin Org', 'Military Security Org'];

  // Final decision commit (POST /access/decision)
  const [committing, setCommitting] = useState(null); // 'ALLOW' | 'DECLINE' | null
  const [commitError, setCommitError] = useState(null);
  const [copiedTx, setCopiedTx] = useState(false);

  // Cosmetic progress ticks while waiting. They do NOT decide when loading ends -
  // that is driven only by the real request in the shared context.
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!isComputing) return undefined;
    setLoadingStep(1);
    const t1 = setTimeout(() => setLoadingStep(2), 250);
    return () => clearTimeout(t1);
  }, [isComputing]);

  // Reset per-request UI state whenever a new decision arrives or is cleared.
  useEffect(() => {
    setSignStatus('idle');
    setSignatureProof(null);
    setSignError(null);
    setApprovedOrgs(['BEL Admin Org']);
    setCommitError(null);
    setCommitting(null);
    setCopiedTx(false);
  }, [activeDecision]);

  const handleRetry = () => {
    runEvaluation({
      asset: selectedAsset,
      telemetry: contextTelemetry,
      requesterDID: did || address,
      requesterAddress: address,
    });
  };

  // Record the final decision on Fabric. Only an id returned by the backend is ever shown.
  const handleCommit = async (action) => {
    if (!activeDecision || committing || commitResult) return;
    setCommitting(action);
    setCommitError(null);
    try {
      const res = await commitDecision({ request: activeDecision.request, action });
      setCommitResult(res);
      showToast(action === 'ALLOW' ? 'Access decision committed to Fabric' : 'Denial committed to Fabric');
    } catch (err) {
      const msg = err?.message || 'Could not commit the decision';
      setCommitError(msg);
      showToast(msg, 'error');
    } finally {
      setCommitting(null);
    }
  };

  const handleCopyTx = () => {
    if (!commitResult?.txHash) return;
    navigator.clipboard?.writeText(commitResult.txHash)?.catch(() => {});
    setCopiedTx(true);
    showToast('Transaction ID copied');
    setTimeout(() => setCopiedTx(false), 2000);
  };

  // Handle Step-Up Cryptographic Signature (simulated)
  const handleSign = async () => {
    try {
      setSignStatus('signing');
      setSignError(null);
      const res = await signStepUpChallenge({
        address,
        assetId: selectedAsset?.id,
        challenge: "CHAIN-GUARD-ZERO-TRUST-CHALLENGE-9921"
      });
      setSignStatus('signed');
      setSignatureProof(res);
      showToast('Simulated wallet challenge completed (not verified by the backend).', 'info');
    } catch (err) {
      setSignStatus('error');
      setSignError(err.message || 'Signature rejected by wallet');
      showToast(err.message || 'Signature failed', 'error');
    }
  };

  // Simulate Multi-Org Endorsement approval
  const handleApproveOrg = (org) => {
    if (!approvedOrgs.includes(org)) {
      setApprovedOrgs([...approvedOrgs, org]);
      showToast(`${org} endorsement simulated (UI only, not written to Fabric).`, 'info');
    }
  };

  // Ledger confirmation / error line, shared by all three outcome panels.
  const ledgerStatus = (
    <>
      {commitResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-dim)', flexWrap: 'wrap', marginTop: '12px' }}>
          <FileCheck2 size={14} color="var(--allow)" />
          <span>
            {commitResult.action === 'ALLOW' ? 'Allow' : 'Decline'} committed to Hyperledger Fabric. Transaction ID:
          </span>
          <span className="mono" style={{ color: 'var(--accent-strong)', wordBreak: 'break-all' }}>
            {commitResult.txHash}
          </span>
          <button onClick={handleCopyTx} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }}>
            {copiedTx ? <Check size={12} color="var(--allow)" /> : <Copy size={12} />}
            <span>{copiedTx ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
      {commitError && !commitResult && (
        <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--block)', marginTop: '12px' }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>Not recorded on the ledger: {commitError}</span>
        </div>
      )}
    </>
  );

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

  // 1. Loading State while the backend evaluates the request
  if (isComputing) {
    return (
      <div className="main-content">
        <div className="page-head">
          <div>
            <h1 className="page-title">Evaluating Zero-Trust Security Policies</h1>
            <p className="page-desc">Waiting for the backend risk engine...</p>
          </div>
        </div>

        <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', marginBottom: '24px' }}>
            <RefreshCw size={44} color="var(--accent)" className="spin" style={{ animation: 'spin 1.2s linear infinite' }} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
            Processing Authorization Request
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '24px', maxWidth: '50ch', margin: '0 auto 24px' }}>
            Evaluating asset <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{selectedAsset.id}</span> against the requester's identity and access context.
          </p>

          <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: loadingStep >= 1 ? 'var(--allow)' : 'var(--text-faint)' }}>
              <Check size={14} /> Request sent to ChainGuard backend
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: loadingStep >= 2 ? 'var(--allow)' : 'var(--text-faint)' }}>
              <Check size={14} /> Checking requester identity on the ledger
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-faint)' }}>
              <Clock size={14} /> Scoring risk factors...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. The evaluation failed. Fail closed: never show a default Allow.
  if (decisionError || !activeDecision) {
    return (
      <div className="main-content">
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
          </div>
        </div>
        <div className="error-state" role="alert">
          <AlertTriangle size={36} color="var(--block)" style={{ marginBottom: '10px' }} />
          <div className="error-title">Access was not evaluated. No access has been granted.</div>
          <div className="error-msg">{decisionError || 'No risk decision is available for this request.'}</div>
          <button onClick={handleRetry} className="btn-primary">
            Retry Evaluation
          </button>
        </div>
      </div>
    );
  }

  const outcome = activeDecision.outcome;
  const score = activeDecision.calculatedScore;
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
            Policy Engine: <strong style={{ color: 'var(--text)' }}>ChainGuard weighted risk model</strong>
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

          <FactorBar factors={activeDecision.factors} />
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
                  {commitResult?.action === 'ALLOW'
                    ? 'Access Granted — Decision Recorded on Fabric'
                    : commitResult
                      ? 'Request Declined — Recorded on Fabric'
                      : 'Risk Check Passed — Confirm to Record the Decision'}
                </h3>
                <span className="badge Allow">Allow</span>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '16px', maxWidth: '75ch' }}>
                {activeDecision.reason || 'All risk factors are within acceptable thresholds.'}{' '}
                Request for <strong style={{ color: 'var(--text)' }}>{selectedAsset.name}</strong> scored{' '}
                <strong style={{ color: 'var(--allow)' }}>{score}</strong>.
              </p>

              {!commitResult && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleCommit('ALLOW')}
                    disabled={Boolean(committing)}
                    className="btn-primary"
                    style={{ padding: '7px 14px' }}
                  >
                    <ShieldCheck size={14} />
                    {committing === 'ALLOW' ? 'Committing to Fabric...' : 'Confirm & Record ALLOW on Fabric'}
                  </button>
                  <button
                    onClick={() => handleCommit('DECLINE')}
                    disabled={Boolean(committing)}
                    className="btn-secondary"
                    style={{ padding: '7px 14px' }}
                  >
                    {committing === 'DECLINE' ? 'Committing to Fabric...' : 'Decline & Record'}
                  </button>
                </div>
              )}

              {ledgerStatus}

              <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '14px', maxWidth: '75ch' }}>
                This records the authorization decision on the ledger. Off-chain document release is not connected in this build.
              </p>
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
                      Hardware / Wallet Challenge (FIDO2 / MetaMask) — simulated
                    </span>
                  </div>
                  {signStatus === 'signed' && (
                    <span className="badge Allow" style={{ background: 'var(--allow-soft)', color: 'var(--allow)' }}>
                      Simulated
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  Demo only: this step does not yet produce a signature the backend can verify.
                </p>

                {signStatus === 'idle' && (
                  <button onClick={handleSign} className="btn-primary" style={{ background: 'var(--stepup)' }}>
                    <Fingerprint size={14} />
                    Run Simulated Challenge
                  </button>
                )}

                {signStatus === 'signing' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--stepup)' }}>
                    <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.2s linear infinite' }} />
                    <span>Running simulated challenge...</span>
                  </div>
                )}

                {signStatus === 'signed' && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                    Simulated signature (not verified):{' '}
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
                    Because this asset is classified as <strong style={{ color: 'var(--text)' }}>Restricted</strong>, Fabric policy requires endorsement by both BEL Admin Org and Military Security Org. The approvals below are a UI simulation and are not written to Fabric.
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
                              Endorsed (simulated)
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
                    <div style={{ marginTop: '14px' }}>
                      <span className="badge Endorsed">Simulated Endorsement Complete</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px', maxWidth: '75ch' }}>
                  The backend re-scores every request when a decision is recorded and refuses ALLOW for a Step-Up outcome,
                  so completing step-up cannot grant access yet. You can record this request as declined.
                </p>
                {!commitResult && (
                  <button
                    onClick={() => handleCommit('DECLINE')}
                    disabled={Boolean(committing)}
                    className="btn-secondary"
                    style={{ padding: '7px 14px' }}
                  >
                    {committing === 'DECLINE' ? 'Committing to Fabric...' : 'Decline & Record on Fabric'}
                  </button>
                )}
                {ledgerStatus}
              </div>
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
                Your request received a risk index of <strong style={{ color: 'var(--block)' }}>{score}</strong>, exceeding the maximum permissible threshold for this clearance tier. Access is denied.
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
                  Reported by the risk engine:
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activeDecision.anomalies.length > 0
                    ? activeDecision.anomalies.map((a) => <li key={a}>{a}</li>)
                    : <li>{activeDecision.reason || 'Risk score exceeds the permitted access threshold.'}</li>}
                </ul>
              </div>

              {!commitResult && (
                <button
                  onClick={() => handleCommit('DECLINE')}
                  disabled={Boolean(committing)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  {committing === 'DECLINE' ? 'Committing to Fabric...' : 'Record Denial on Fabric'}
                </button>
              )}
              {ledgerStatus}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
