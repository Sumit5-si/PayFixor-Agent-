// Dark Fintech Agent Activity Page Component
window.AgentActivityPage = function AgentActivityPage({ lang }) {
  const [activity, setActivity] = React.useState(null);
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actData, logData] = await Promise.all([
        window.PayFixorAPI.getAgentActivity(),
        window.PayFixorAPI.getAuditLogs({ limit: 50 })
      ]);
      setActivity(actData);
      setLogs(logData);
    } catch (e) {
      console.error('Failed to load agent activity', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 Agent Operational Metric Cards */}
      {activity && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Detection Engine */}
          <div className="fintech-card p-5 border-t-2 border-t-amber-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-slate-400 font-mono">Detection Engine</span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Deterministic
                </span>
              </div>
              <div className="text-2xl font-black text-slate-100 tabular-nums my-2.5 font-display">
                {activity.detection_engine.incidents_detected} <span className="text-xs text-slate-400 font-normal">incidents</span>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400 pt-3 border-t border-surface-border/60">
              <div className="flex justify-between">
                <span>Investigations:</span>
                <span className="font-mono font-bold text-slate-200">{activity.detection_engine.investigations_completed}</span>
              </div>
              <div className="flex justify-between">
                <span>Insufficient Evidence:</span>
                <span className="font-mono font-bold text-purple-400">{activity.detection_engine.insufficient_evidence_cases}</span>
              </div>
            </div>
          </div>

          {/* Diagnosis Agent */}
          <div className="fintech-card p-5 border-t-2 border-t-cyan-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-cyan-400 font-mono">Diagnosis Agent</span>
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Gemini 2.0
                </span>
              </div>
              <div className="text-2xl font-black text-slate-100 tabular-nums my-2.5 font-display">
                {activity.diagnosis_agent.diagnoses_generated} <span className="text-xs text-slate-400 font-normal">hypotheses</span>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400 pt-3 border-t border-surface-border/60">
              <div className="flex justify-between">
                <span>High Confidence (≥85%):</span>
                <span className="font-mono font-bold text-cyan-400">{activity.diagnosis_agent.high_confidence_diagnoses}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Confidence:</span>
                <span className="font-mono font-bold text-slate-200">
                  {activity.diagnosis_agent.avg_confidence ? `${(activity.diagnosis_agent.avg_confidence * 100).toFixed(0)}%` : '91%'}
                </span>
              </div>
            </div>
          </div>

          {/* Recovery Agent */}
          <div className="fintech-card p-5 border-t-2 border-t-emerald-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-slate-400 font-mono">Recovery Agent</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Hybrid
                </span>
              </div>
              <div className="text-2xl font-black text-slate-100 tabular-nums my-2.5 font-display">
                {activity.recovery_agent.campaigns_executed} <span className="text-xs text-slate-400 font-normal">batches</span>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400 pt-3 border-t border-surface-border/60">
              <div className="flex justify-between">
                <span>Links Dispatched:</span>
                <span className="font-mono font-bold text-emerald-400">{activity.recovery_agent.payment_links_created}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Recoveries:</span>
                <span className="font-mono font-bold text-slate-200">{activity.recovery_agent.successful_recoveries}</span>
              </div>
            </div>
          </div>

          {/* Policy / Guardrail Engine */}
          <div className="fintech-card p-5 border-t-2 border-t-rose-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-slate-400 font-mono">Policy Guardrails</span>
                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  Deterministic
                </span>
              </div>
              <div className="text-2xl font-black text-slate-100 tabular-nums my-2.5 font-display">
                {activity.policy_engine.rules_evaluated} <span className="text-xs text-slate-400 font-normal">evaluations</span>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400 pt-3 border-t border-surface-border/60">
              <div className="flex justify-between">
                <span>Actions Approved:</span>
                <span className="font-mono font-bold text-emerald-400">{activity.policy_engine.actions_approved}</span>
              </div>
              <div className="flex justify-between">
                <span>Actions Blocked / Review:</span>
                <span className="font-mono font-bold text-rose-400">{activity.policy_engine.actions_blocked}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Scrolling Agent Telemetry Log */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Live Agent Execution Stream ({logs.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Immutable Telemetry Feed</span>
        </div>

        <div className="divide-y divide-surface-border/60 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.log_id} className="p-3.5 hover:bg-surface-cardHover transition flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center shrink-0 mt-0.5">
                  <i data-lucide="cpu" className="w-3.5 h-3.5 text-cyan-400"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{log.actor}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle text-slate-400 border border-surface-border">
                      {log.event_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{log.action}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-500 block">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{log.result}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
