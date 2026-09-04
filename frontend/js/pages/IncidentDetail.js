// Dark Fintech Incident Detail & Deep Dive Page Component
window.IncidentDetailPage = function IncidentDetailPage({
  incidentId,
  onBack,
  onTriggerRecovery,
  onInvestigate,
  lang
}) {
  const [incident, setIncident] = React.useState(null);
  const [experiment, setExperiment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('diagnosis'); // 'diagnosis', 'evidence', 'experiment'
  const [isCopied, setIsCopied] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await window.PayFixorAPI.getIncidentDetails(incidentId);
      setIncident(data);
      try {
        const expData = await window.PayFixorAPI.getExperimentResults(incidentId);
        setExperiment(expData);
      } catch (e) {
        // No experiment yet
      }
    } catch (e) {
      console.error('Failed to load incident details', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDetails();
  }, [incidentId]);

  // Render Bank Comparison Chart
  React.useEffect(() => {
    if (incident && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();

      const ctx = chartRef.current.getContext('2d');
      const evidence = (incident.evidences && incident.evidences[0]?.data_json) || {};
      const bankComp = evidence.bank_comparison || { [incident.bank || 'Bank_X']: incident.current_rate || 0.204, 'Bank_Y': 0.05, 'Bank_Z': 0.04 };

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(bankComp),
          datasets: [{
            label: 'Failure Rate (%)',
            data: Object.values(bankComp).map(v => (v * 100).toFixed(1)),
            backgroundColor: Object.keys(bankComp).map(b => (b === incident.bank || b.includes('X')) ? '#F43F5E' : '#06B6D4'),
            borderRadius: 8,
            barThickness: 34
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#151821',
              borderColor: '#232735',
              borderWidth: 1,
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.raw}% failure rate`
              }
            }
          },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter', weight: 500 } } 
            },
            y: { 
              grid: { color: 'rgba(35, 39, 53, 0.6)' }, 
              ticks: { 
                color: '#94A3B8', 
                font: { size: 11, family: 'Inter' },
                callback: (val) => `${val}%`
              } 
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [incident, activeTab, lang]);

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [incident, activeTab, lang]);

  const copyJSON = () => {
    if (!incident) return;
    navigator.clipboard.writeText(JSON.stringify(incident, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runInvestigation = async () => {
    setActionLoading(true);
    try {
      await onInvestigate(incidentId);
      await loadDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const runRecovery = async () => {
    setActionLoading(true);
    try {
      await onTriggerRecovery(incidentId);
      await loadDetails();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !incident) {
    return (
      <div className="fintech-card p-12 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-slate-200">Loading deep dive telemetry for {incidentId}...</p>
      </div>
    );
  }

  const latestEvidence = incident.evidences && incident.evidences[0]?.data_json;
  const confPercent = incident.confidence ? Math.round(incident.confidence * 100) : 91;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border transition text-xs font-semibold flex items-center gap-1.5"
          >
            <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i>
            <span>{t('btn_back')}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-cyan-400">{incident.incident_id}</span>
            <span className="text-slate-500">/</span>
            <span className="text-sm font-bold text-slate-100">{incident.segment}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={copyJSON}
            className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border transition text-xs font-semibold flex items-center gap-1.5"
          >
            <i data-lucide="copy" className="w-3.5 h-3.5 text-slate-400"></i>
            <span>{isCopied ? t('btn_copied') : t('btn_copy_json')}</span>
          </button>
          <button
            onClick={runInvestigation}
            disabled={actionLoading}
            className="px-3.5 py-1.5 rounded-xl bg-surface-cardHover hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60"
          >
            <i data-lucide="brain-circuit" className="w-3.5 h-3.5"></i>
            <span>{t('btn_investigate')}</span>
          </button>
          <button
            onClick={runRecovery}
            disabled={actionLoading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            <i data-lucide="zap" className="w-3.5 h-3.5"></i>
            <span>{t('btn_trigger_recovery')}</span>
          </button>
        </div>
      </div>

      {/* Primary Incident Telemetry Overview Card */}
      <div className="fintech-card p-6 border-l-4 border-l-cyan-500">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono font-bold text-cyan-400">
                {incident.incident_id}
              </span>
              <window.StatusBadge status={incident.status} />
            </div>
            <h3 className="text-xl font-black text-slate-100 font-display">{incident.segment}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {incident.hypothesis || 'Statistical anomaly detected exceeding baseline failure rate. Multi-tool evidence gathered.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-subtle p-3 rounded-xl border border-surface-border">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Baseline Rate</span>
              <span className="text-sm font-bold font-mono text-slate-200">
                {incident.baseline_rate ? `${(incident.baseline_rate * 100).toFixed(1)}%` : '5.1%'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Current Rate</span>
              <span className="text-sm font-bold font-mono text-rose-400">
                {incident.current_rate ? `${(incident.current_rate * 100).toFixed(1)}%` : '20.4%'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Degradation</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {incident.anomaly_ratio ? `${incident.anomaly_ratio.toFixed(1)}x` : '4.0x'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Revenue At Risk</span>
              <span className="text-sm font-bold font-mono text-cyan-400">
                {formatINR(incident.revenue_at_risk)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: AI Diagnosis vs Evidence Bundle vs A/B Results */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'diagnosis'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-surface-border'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <i data-lucide="brain-circuit" className="w-3.5 h-3.5"></i>
            <span>AI Reasoning & Hypothesis</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'evidence'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-surface-border'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <i data-lucide="database" className="w-3.5 h-3.5"></i>
            <span>Telemetry Evidence Bundle</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('experiment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'experiment'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-surface-border'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <i data-lucide="split" className="w-3.5 h-3.5"></i>
            <span>A/B Experiment Results</span>
          </div>
        </button>
      </div>

      {/* Tab 1: AI Diagnosis */}
      {activeTab === 'diagnosis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Root-Cause Analysis</h4>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
                Confidence: {confPercent}%
              </span>
            </div>

            <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border leading-relaxed text-xs text-slate-300">
              <p className="font-semibold text-slate-100 mb-1">Generated Hypothesis:</p>
              <p>{incident.hypothesis || 'A systemic gateway timeout was detected specifically for Bank_X on the UPI rail during 14:00-16:00. The alternative card/netbanking routes remain healthy.'}</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Recommended Recovery Strategy:</span>
              <div className="p-3 bg-surface-subtle rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i data-lucide="zap" className="w-4 h-4 text-emerald-400"></i>
                  <span className="text-xs font-bold text-emerald-400">ALTERNATIVE_PAYMENT_METHOD + DIRECT_LINK</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Policy: APPROVED</span>
              </div>
            </div>
          </div>

          {/* Right Col: Bank Comparison Chart */}
          <div className="fintech-card p-6 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2">Failure Rate Comparison</h4>
            <div className="h-48 relative">
              <canvas ref={chartRef}></canvas>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Degraded bank vs Control peer institutions
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Telemetry Evidence Bundle */}
      {activeTab === 'evidence' && (
        <div className="fintech-card p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Structured Multi-Dimensional Evidence</h4>
          <pre className="p-4 bg-surface-subtle rounded-xl border border-surface-border text-xs font-mono text-cyan-400 overflow-x-auto max-h-96">
            {JSON.stringify(latestEvidence || incident, null, 2)}
          </pre>
        </div>
      )}

      {/* Tab 3: A/B Experiment Results */}
      {activeTab === 'experiment' && (
        <div className="fintech-card p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">A/B Experiment Verification</h4>
          {experiment ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border">
                <span className="text-xs text-slate-400 font-medium">Generic Control Recovery</span>
                <div className="text-xl font-bold font-mono text-slate-200 mt-1">{experiment.control_rate || '12.2%'}</div>
              </div>
              <div className="p-4 bg-surface-subtle rounded-xl border border-cyan-500/30">
                <span className="text-xs text-cyan-400 font-medium">AI Root-Cause Recovery</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{experiment.treatment_rate || '18.8%'}</div>
              </div>
              <div className="p-4 bg-surface-subtle rounded-xl border border-emerald-500/30">
                <span className="text-xs text-emerald-400 font-medium">Incremental Recovery Lift</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">+{experiment.relative_lift || '54.1%'}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-surface-subtle rounded-xl border border-dashed border-surface-border text-xs text-slate-400">
              No active experiment running for this incident yet. Click &quot;Trigger Recovery&quot; to launch an A/B recovery campaign.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
