import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  FileLock, 
  ShieldAlert, 
  Cpu, 
  Globe, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { getAssets, computeRisk } from '../services/mockApi';
import ClassificationBadge from '../components/ClassificationBadge';
import { useAccessRequest } from '../context/AccessRequestContext';

export default function AssetRequest({ onNavigateToDecision }) {
  const { 
    selectedAsset, 
    setSelectedAsset, 
    contextTelemetry, 
    setContextTelemetry, 
    setActiveDecision,
    setIsComputing,
    showToast 
  } = useAccessRequest();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  
  // Active detail drawer asset
  const [previewAsset, setPreviewAsset] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAssets({
        search: searchQuery,
        classification: selectedClassification
      });
      setAssets(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch BEL assets registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassification]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedClassification('ALL');
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setPreviewAsset(asset);
  };

  const handleInitiateAccessRequest = async (assetToRequest) => {
    const targetAsset = assetToRequest || selectedAsset;
    if (!targetAsset) {
      showToast('Please select an asset first', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setIsComputing(true);
      setSelectedAsset(targetAsset);

      // Transition to Risk Decision screen right away to display the loading evaluation animation
      onNavigateToDecision();

      // Compute zero-trust risk score in mock service
      const decision = await computeRisk({
        asset: targetAsset,
        location: contextTelemetry.location,
        deviceStatus: contextTelemetry.deviceStatus,
        accessTime: contextTelemetry.accessTime,
        purpose: contextTelemetry.purpose
      });

      setActiveDecision(decision);
    } catch (err) {
      showToast(err.message || 'Risk computation failed', 'error');
      setIsComputing(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Asset Access Request</h1>
          <p className="page-desc">
            Select a Bharat Electronics Limited (BEL) sensitive asset to submit for cryptographic clearance and automated zero-trust risk evaluation.
          </p>
        </div>
        <div className="env-pill">
          <div className="env-dot" />
          <span>FABRIC-CHANNEL: bel-restricted-sbu</span>
        </div>
      </div>

      {/* Context Telemetry Bar (Zero-Trust Parameters) */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={18} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 600 }}>
              Network Origin
            </div>
            <select
              value={contextTelemetry.location}
              onChange={(e) => setContextTelemetry({ ...contextTelemetry, location: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
                outline: 'none',
                padding: '2px 0'
              }}
            >
              <option value="BEL Bangalore Secure Intranet (10.240.12.8)">BEL Bangalore Secure Intranet</option>
              <option value="Field Operational Unit (Tactical WAN)">Field Operational Unit (Tactical WAN)</option>
              <option value="External / Off-Premises">External / Off-Premises (Untrusted)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={18} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 600 }}>
              Device Posture
            </div>
            <select
              value={contextTelemetry.deviceStatus}
              onChange={(e) => setContextTelemetry({ ...contextTelemetry, deviceStatus: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
                outline: 'none',
                padding: '2px 0'
              }}
            >
              <option value="Hardware Key Attached (FIDO2 Level-3)">Hardware Key Attached (FIDO2)</option>
              <option value="Partial Compliance (TPM 2.0)">Partial Compliance (TPM 2.0)</option>
              <option value="Unmanaged Device">Unmanaged Device (High Risk)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 600 }}>
              Shift Window
            </div>
            <select
              value={contextTelemetry.accessTime}
              onChange={(e) => setContextTelemetry({ ...contextTelemetry, accessTime: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
                outline: 'none',
                padding: '2px 0'
              }}
            >
              <option value="Regular Operational Shift">Regular Shift (08:00 - 18:00)</option>
              <option value="Off-Hours (22:00 - 05:00)">Off-Hours (Anomaly Trigger)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 280px' }}>
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Search by asset ID, system name, or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        {/* Classification Tabs */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {['ALL', 'Restricted', 'Confidential', 'Internal', 'Public'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClassification(cls)}
              style={{
                background: selectedClassification === cls ? 'var(--accent-soft)' : 'var(--surface)',
                color: selectedClassification === cls ? 'var(--accent-strong)' : 'var(--text-dim)',
                border: '1px solid',
                borderColor: selectedClassification === cls ? 'var(--accent)' : 'var(--border)',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cls}
            </button>
          ))}
          <button onClick={loadData} title="Refresh Registry" className="btn-secondary" style={{ padding: '6px 8px' }}>
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* State 1: Loading Skeleton */}
      {loading && (
        <div className="panel">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-bar" style={{ width: '40%' }} />
              <div className="skeleton-bar" style={{ width: '70%', height: '8px' }} />
            </div>
          ))}
        </div>
      )}

      {/* State 4: Error State with Retry */}
      {!loading && error && (
        <div className="error-state">
          <ShieldAlert size={36} color="var(--block)" style={{ marginBottom: '10px' }} />
          <div className="error-title">Failed to Query BEL Asset Catalog</div>
          <div className="error-msg">{error}</div>
          <button onClick={loadData} className="btn-primary" style={{ background: 'var(--block)' }}>
            Retry Gateway Query
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && assets.length === 0 && (
        <div className="panel empty-state">
          <FileLock size={38} className="empty-icon" />
          <div className="empty-title">No matching defense assets found</div>
          <div className="empty-copy">
            No items matched your query "{searchQuery}" with classification filter "{selectedClassification}".
          </div>
          <button onClick={handleClearFilters} className="btn-secondary">
            Clear Search & Filters
          </button>
        </div>
      )}

      {/* State 2: Success List / Catalog Table */}
      {!loading && !error && assets.length > 0 && (
        <div className="panel">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr 120px 100px 110px',
              padding: '10px 16px',
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border)',
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
              letterSpacing: '0.05em'
            }}
          >
            <div>Asset Identifier</div>
            <div>Description & SBU Division</div>
            <div>Classification</div>
            <div>Format</div>
            <div style={{ textAlign: 'right' }}>Action</div>
          </div>

          {assets.map((asset) => {
            const isSelected = selectedAsset?.id === asset.id;
            return (
              <div
                key={asset.id}
                onClick={() => handleSelectAsset(asset)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr 120px 100px 110px',
                  padding: '12px 16px',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                  borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div>
                  <div className="mono" style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {asset.id}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                    {asset.size}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    {asset.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {asset.unit}
                  </div>
                </div>

                <div>
                  <ClassificationBadge classification={asset.classification} />
                </div>

                <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {asset.format}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInitiateAccessRequest(asset);
                    }}
                    className="btn-primary"
                    style={{
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    Evaluate
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Asset Bottom Drawer / Confirmation Action */}
      {selectedAsset && (
        <div
          style={{
            marginTop: '20px',
            background: 'var(--surface)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-strong)' }}>
                Target Clearance Selected:
              </span>
              <ClassificationBadge classification={selectedAsset.classification} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              {selectedAsset.name} ({selectedAsset.id})
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
              SHA-256 Hash: {selectedAsset.hash.slice(0, 26)}...
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => handleInitiateAccessRequest(selectedAsset)}
              disabled={submitting}
              className="btn-primary"
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              {submitting ? 'Running Risk Engine...' : 'Submit Request & Compute Risk'}
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
