// Dark Fintech Audit Trail Page Component
window.AuditTrailPage = function AuditTrailPage({ lang }) {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [actorFilter, setActorFilter] = React.useState('ALL');
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => val ? `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await window.PayFixorAPI.getAuditLogs({ limit: 150 });
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadLogs();
  }, []);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Event Type', 'Action', 'Result', 'Incident ID', 'Customer ID'];
    const rows = logs.map(l => [
      l.log_id,
      l.timestamp,
      l.actor,
      l.event_type,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      l.result,
      l.incident_id || '',
      l.customer_id || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payfixor_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesActor = actorFilter === 'ALL' || log.actor === actorFilter;
    const matchesSearch = (log.log_id || '').toLowerCase().includes(search.toLowerCase()) ||
                          (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
                          (log.incident_id && log.incident_id.toLowerCase().includes(search.toLowerCase())) ||
                          (log.customer_id && log.customer_id.toLowerCase().includes(search.toLowerCase())) ||
                          (log.event_type || '').toLowerCase().includes(search.toLowerCase());
    return matchesActor && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="fintech-card p-6 bg-gradient-to-r from-indigo-950/40 via-surface-card to-cyan-950/30 border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <h3 className="text-sm font-black text-slate-100 font-display">Append-Only Immutable Ledger</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Every anomaly detection, Gemini reasoning run, policy evaluation, stopping rule trigger, payment link, and webhook event is immutably logged with SHA-256 payload traces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="text-xs font-semibold text-slate-300 hover:text-slate-100 px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border hover:border-surface-highlight transition flex items-center gap-1.5"
          >
            <i data-lucide="download" className="w-3.5 h-3.5 text-cyan-400"></i>
            <span>{t('btn_export_csv')}</span>
          </button>
          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-cardHover text-slate-400 hover:text-slate-200 border border-surface-border transition"
            title="Refresh Logs"
          >
            <i data-lucide="refresh-cw" className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-card p-4 rounded-2xl border border-surface-border">
        <div className="relative flex-1 min-w-[240px]">
          <i data-lucide="search" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input
            type="text"
            placeholder="Search by action, log ID, incident, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-surface-border overflow-x-auto">
          {['ALL', 'detection_engine', 'diagnosis_agent', 'recovery_agent', 'policy_engine', 'webhook_handler', 'merchant_admin'].map((a) => (
            <button
              key={a}
              onClick={() => setActorFilter(a)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                actorFilter === a
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {a === 'ALL' ? t('btn_all') : a.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="fintech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="fintech-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Event Type</th>
                <th>Action & Details</th>
                <th>Result</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id}>
                    <td className="font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-cyan-400">{log.actor}</span>
                    </td>
                    <td>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-surface-border text-slate-300">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="text-xs text-slate-300 max-w-md">
                      <div>{log.action}</div>
                      {log.reason && <div className="text-[11px] text-slate-500 italic mt-0.5">{log.reason}</div>}
                    </td>
                    <td>
                      <span className="text-xs font-mono font-bold text-emerald-400">{log.result}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setModalOpen(true);
                        }}
                        className="p-1 rounded-lg bg-surface-cardHover hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
                        title="View Raw JSON Trace"
                      >
                        <i data-lucide="code" className="w-3.5 h-3.5"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Payload Modal */}
      <window.Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Audit Log Trace: ${selectedLog?.log_id || ''}`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Actor: <strong className="text-cyan-400">{selectedLog?.actor}</strong></span>
            <span>{selectedLog?.timestamp}</span>
          </div>
          <pre className="p-4 bg-surface-subtle rounded-xl border border-surface-border text-xs font-mono text-cyan-400 overflow-x-auto max-h-96">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </div>
      </window.Modal>
    </div>
  );
};
