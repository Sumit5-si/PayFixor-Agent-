// Dark Fintech Revenue Recovery Page Component
window.RevenueRecoveryPage = function RevenueRecoveryPage({
  kpis,
  onRefresh,
  lang
}) {
  const [actions, setActions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [simulatingId, setSimulatingId] = React.useState(null);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const loadActions = async () => {
    setLoading(true);
    try {
      const data = await window.PayFixorAPI.listRecoveryActions();
      setActions(data);
    } catch (e) {
      console.error('Failed to load recovery actions', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadActions();
  }, []);

  const handleSimulatePayment = async (actionId) => {
    setSimulatingId(actionId);
    try {
      await window.PayFixorAPI.simulateCustomerRecovery(actionId);
      await loadActions();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Error simulating recovery', e);
    } finally {
      setSimulatingId(null);
    }
  };

  const recoveredCount = actions.filter(a => a.status === 'RECOVERED').length;
  const progressPercent = actions.length > 0 ? Math.round((recoveredCount / actions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Measured Money Recovered Banner */}
      <div className="fintech-card p-7 bg-gradient-to-r from-emerald-950/40 via-surface-card to-cyan-950/30 border-emerald-500/30 flex flex-wrap items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
            {t('kpi_revenue_recovered')}
          </span>
          <h2 className="text-3xl font-black text-slate-100 tabular-nums tracking-tight mt-1 font-display">
            {formatINR(kpis.revenue_recovered)} <span className="text-sm font-bold text-emerald-400 font-mono">RECOVERED</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Total verified monetary revenue captured through PayFixor root-cause recovery links.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Recovery Progress</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{progressPercent}%</span>
            <span className="text-[11px] text-slate-400 block font-mono">{recoveredCount} / {actions.length} settled</span>
          </div>

          <button
            onClick={loadActions}
            className="p-3 rounded-xl bg-surface-subtle hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border transition"
            title="Refresh recovery logs"
          >
            <i data-lucide="refresh-cw" className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Recovery Actions Log Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Customer Payment Recovery Log ({actions.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Settlement via Razorpay Test Links</span>
        </div>

        <div className="overflow-x-auto">
          <table className="fintech-table">
            <thead>
              <tr>
                <th>Action ID</th>
                <th>Incident</th>
                <th>Customer</th>
                <th>Strategy</th>
                <th>Amount</th>
                <th>Payment Link</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    No recovery actions recorded yet. Trigger a recovery campaign from an incident.
                  </td>
                </tr>
              ) : (
                actions.map((act) => (
                  <tr key={act.action_id}>
                    <td className="font-mono text-cyan-400 font-bold">{act.action_id}</td>
                    <td className="font-mono text-slate-300">{act.incident_id}</td>
                    <td className="font-mono text-slate-300">{act.customer_id}</td>
                    <td className="font-mono text-xs text-slate-400">{act.strategy}</td>
                    <td className="font-mono font-bold text-slate-100">{formatINR(act.amount)}</td>
                    <td className="font-mono text-xs">
                      {act.payment_link_url ? (
                        <a
                          href={act.payment_link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>{act.payment_link_id || 'Pay Link'}</span>
                          <i data-lucide="external-link" className="w-3 h-3"></i>
                        </a>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td><window.StatusBadge status={act.status} type="recovery" /></td>
                    <td>
                      {act.status !== 'RECOVERED' ? (
                        <button
                          onClick={() => handleSimulatePayment(act.action_id)}
                          disabled={simulatingId === act.action_id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 text-xs font-bold transition disabled:opacity-50"
                        >
                          {simulatingId === act.action_id ? 'Simulating...' : t('btn_simulate_payment')}
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-emerald-400 font-semibold">✓ Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
