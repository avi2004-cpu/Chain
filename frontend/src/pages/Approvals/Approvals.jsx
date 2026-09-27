/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { getApprovalStatus, approveOrg } from "../../services/mockApi";
import { useAccessRequest } from "../../context/AccessRequestContext";

function OrgList({ req, onApprove, pendingOrg }) {
  return (
    <div className="org-list">
      {req.requiredOrgs.map((org) => {
        const approved = req.approvedOrgs.includes(org);
        return (
          <div key={org} className={`org-row ${approved ? "approved" : ""}`}>
            <div className="org-left">
              <span className="org-status-icon">
                {approved ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
              </span>
              {org}
            </div>
            {approved ? (
              <span className="org-status-text">Approved</span>
            ) : (
              <button
                className="org-approve-btn"
                disabled={pendingOrg === org}
                onClick={() => onApprove(req.id, org)}
              >
                {pendingOrg === org ? "…" : "Approve"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ req }) {
  const pct = Math.round((req.approvedOrgs.length / req.requiredOrgs.length) * 100);
  return (
    <>
      <div className="progress-track" style={{ marginTop: 4 }}>
        <div className={`progress-fill ${pct === 100 ? "done" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-label">{req.approvedOrgs.length} of {req.requiredOrgs.length} organizations approved</div>
    </>
  );
}

export default function Approvals() {
  const { showToast } = useAccessRequest();
  const [reqs, setReqs] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [reviewReq, setReviewReq] = useState(null);
  const [pending, setPending] = useState(null); // { reqId, org }

  const load = useCallback(async () => {
    setReqs(null);
    setError(null);
    try {
      const data = await getApprovalStatus();
      setReqs(data);
    } catch (err) {
      setError(err.message || "Unable to load pending approvals");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (reqId, org) => {
    setPending({ reqId, org });
    const updated = await approveOrg(reqId, org);
    setPending(null);

    if (updated.approvedOrgs.length === updated.requiredOrgs.length) {
      showToast(`${updated.assetId} fully endorsed — logged to Audit Log`, "success");
      setReviewReq(null);
    } else {
      showToast(`${org} approved ${updated.assetId}`, "info");
      setReviewReq((r) => (r && r.id === updated.id ? updated : r));
    }
    load();
  };

  return (
    <div className="main-content">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pending Approvals</h1>
          <p className="page-desc">Restricted-classification assets require endorsement from every listed organization before access is granted.</p>
        </div>
        <div className="status-block">
          <div className="env-pill"><span className="env-dot" />Development Environment</div>
        </div>
      </div>

      <div className="panel">
        {reqs === null && !error && (
          <>
            <div className="skeleton-row"><div className="skeleton-bar" style={{ width: "70%" }} /></div>
            <div className="skeleton-row"><div className="skeleton-bar" style={{ width: "55%" }} /></div>
          </>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="error-title">Unable to load pending approvals</div>
            <p>{error}</p>
            <button onClick={load}>Retry</button>
          </div>
        )}

        {reqs && reqs.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="empty-title">Nothing pending</div>
            <p className="empty-copy">All Restricted-asset requests have full organization endorsement.</p>
          </div>
        )}

        {reqs && reqs.map((r) => (
          <div key={r.id} className="approval-card">
            <div className="approval-top">
              <div>
                <div className="approval-id-row">
                  <span className="approval-asset">{r.assetId}</span>
                  <span className="class-tag">{r.classification}</span>
                </div>
                <div className="approval-req-line">Access Request <span className="mono">{r.id}</span></div>
                <div className="approval-meta">Requested by {r.requester}</div>
              </div>
              <button className="review-btn" onClick={() => setReviewReq(r)}>Review Request</button>
            </div>
            <div className="endorsement-label">Organization Endorsement</div>
            <OrgList
              req={r}
              onApprove={handleApprove}
              pendingOrg={pending?.reqId === r.id ? pending.org : null}
            />
            <ProgressBar req={r} />
          </div>
        ))}
      </div>

      {reviewReq && (
        <>
          <div className="overlay show" onClick={() => setReviewReq(null)} />
          <div className="drawer glass-floating show">
            <div className="drawer-head">
              <div>
                <div className="drawer-eyebrow">Access Request</div>
                <div className="drawer-title">{reviewReq.id}</div>
              </div>
              <button className="drawer-close" onClick={() => setReviewReq(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="drawer-body">
              <div className="detail-row"><div className="detail-k">Asset ID</div><div className="detail-v mono">{reviewReq.assetId}</div></div>
              <div className="detail-row"><div className="detail-k">Classification</div><div className="detail-v">{reviewReq.classification}</div></div>
              <div className="detail-row"><div className="detail-k">Requester</div><div className="detail-v">{reviewReq.requester}</div></div>
              <div className="detail-row"><div className="detail-k">Required organizations</div><div className="detail-v">{reviewReq.requiredOrgs.length}</div></div>
              <div className="detail-row"><div className="detail-k">Approved organizations</div><div className="detail-v">{reviewReq.approvedOrgs.length}</div></div>
              <div className="endorsement-label">Organization Endorsement</div>
              <OrgList
                req={reviewReq}
                onApprove={handleApprove}
                pendingOrg={pending?.reqId === reviewReq.id ? pending.org : null}
              />
              <ProgressBar req={reviewReq} />
            </div>
            <div className="drawer-foot"><button onClick={() => setReviewReq(null)}>Close</button></div>
          </div>
        </>
      )}
    </div>
  );
}
