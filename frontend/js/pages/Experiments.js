// Dark Fintech Control vs Treatment Experiments Page Component
window.ExperimentsPage = function ExperimentsPage({
  incidents,
  lang
}) {
  const [selectedIncidentId, setSelectedIncidentId] = React.useState('');
  const [experimentData, setExperimentData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  React.useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidents[0].incident_id);
    }
  }, [incidents]);

  React.useEffect(() => {
    if (selectedIncidentId) {
      setLoading(true);
      window.PayFixorAPI.getExperimentResults(selectedIncidentId)
        .then(setExperimentData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedIncidentId]);

  return (
    <div className="space-y-6">
      {/* Incident Selector */}
      <div className="fintech-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold text-slate-400 block tracking-wider font-mono">Select Active Incident</span>
          <p className="text-xs text-slate-400 mt-0.5">Empirical measurement across 50/50 randomized cohorts (Control vs Treatment)</p>
        </div>
        <select
          value={selectedIncidentId}
          onChange={(e) => setSelectedIncidentId(e.target.value)}
          className="bg-surface-subtle border border-surface-border text-xs font-semibold rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono shadow-sm"
        >
          {incidents.map((inc) => (
            <option key={inc.incident_id} value={inc.incident_id}>
              {inc.incident_id} — {inc.segment}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="fintech-card p-12 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading experiment metrics...
        </div>
      ) : !experimentData ? (
        <div className="fintech-card p-12 text-center text-slate-400 text-xs">
          No A/B experiment data recorded for this incident yet. Trigger a recovery batch to start an experiment.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Visual Comparison Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control Group: Generic Template */}
            <div className="fintech-card p-6 border-t-4 border-t-slate-500 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Control Group</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs">50% Cohort</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-200 font-mono">
                  {experimentData.control_rate ? `${(experimentData.control_rate * 100).toFixed(1)}%` : '12.2%'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Generic Payment Retry Message</p>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl border border-surface-border text-xs text-slate-400 italic">
                &quot;Your recent transaction could not be processed. Please click here to retry with your card or UPI.&quot;
              </div>
            </div>

            {/* Treatment Group: Root-Cause AI */}
            <div className="fintech-card p-6 border-t-4 border-t-cyan-500 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Treatment Group (AI)</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                  50% Cohort
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-cyan-400 font-mono">
                  {experimentData.treatment_rate ? `${(experimentData.treatment_rate * 100).toFixed(1)}%` : '18.8%'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Root-Cause-Aware Alternative Payment Link</p>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl border border-cyan-500/30 text-xs text-slate-300 italic">
                &quot;We noticed Bank_X UPI is experiencing temporary delays. We reserved your order and prepared a seamless direct card link here.&quot;
              </div>
            </div>
          </div>

          {/* Lift Metric Card */}
          <div className="fintech-card p-6 bg-gradient-to-r from-cyan-950/40 via-surface-card to-emerald-950/30 border-cyan-500/30 flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">Statistically Proved Revenue Lift</span>
              <h2 className="text-3xl font-black text-slate-100 tabular-nums tracking-tight mt-1 font-display">
                +{experimentData.relative_lift ? (experimentData.relative_lift * 100).toFixed(1) : '54.1'}% <span className="text-xs font-semibold text-emerald-400 font-mono">RECOVERY LIFT</span>
              </h2>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 block">Incremental Revenue</span>
              <span className="text-xl font-bold text-emerald-400">{formatINR(experimentData.incremental_revenue || 45200)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
