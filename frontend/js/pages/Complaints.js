// Dark Fintech Complaints & Escalations Page Component
window.ComplaintsPage = function ComplaintsPage({ lang }) {
  const [escalations, setEscalations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [resolutionModalOpen, setResolutionModalOpen] = React.useState(false);
  const [resolutionStatus, setResolutionStatus] = React.useState('NORMAL');
  const [notes, setNotes] = React.useState('');

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const loadEscalations = async () => {
    setLoading(true);
    try {
      const [complaints, highVal] = await Promise.all([
        window.PayFixorAPI.listCustomers('COMPLAINT'),
        window.PayFixorAPI.listCustomers('HIGH_VALUE_REVIEW')
      ]);
      const combined = [...complaints, ...highVal];
      const unique = Array.from(new Map(combined.map(item => [item.customer_id, item])).values());
      setEscalations(unique);
    } catch (e) {
      console.error('Failed to load escalations', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadEscalations();
  }, []);

  const handleResolve = async () => {
    if (!selectedItem) return;
    try {
      await window.PayFixorAPI.updateCustomerStatus(
        selectedItem.customer_id,
        resolutionStatus,
        notes
      );
      setResolutionModalOpen(false);
      await loadEscalations();
    } catch (e) {
      console.error('Error resolving escalation', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Info Banner */}
      <div className="fintech-card p-6 bg-gradient-to-r from-rose-950/40 via-surface-card to-amber-950/30 border-rose-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse-dot"></span>
            <h3 className="text-sm font-black text-slate-100 font-display">Human-In-The-Loop Escalation Protection</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            PayFixor automatically stops automated messaging and routes customers to this queue if they encounter repeated failures (≥ 2 attempts), submit complaints, or execute high-value transactions (≥ ₹10,000).
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block font-mono">Pending Review</span>
          <span className="text-2xl font-black text-rose-400 font-mono">{escalations.length} Cases</span>
        </div>
      </div>

      {/* Escalations Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Escalated Customers & High-Value Transactions
          </h3>
          <span className="text-xs text-slate-400 font-mono">Guarded by Policy Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="fintech-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {escalations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No active escalations or high-value flags. System running safely within automated limits.
                  </td>
                </tr>
              ) : (
                escalations.map((esc) => (
                  <tr key={esc.customer_id}>
                    <td className="font-mono text-cyan-400 font-bold">{esc.customer_id}</td>
                    <td className="font-semibold text-slate-200">{esc.name}</td>
                    <td>
                      <div className="text-xs text-slate-400">{esc.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{esc.phone}</div>
                    </td>
                    <td className="font-mono font-bold text-amber-400">{formatINR(esc.total_spend)}</td>
                    <td><window.StatusBadge status={esc.complaint_status} type="complaint" /></td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedItem(esc);
                          setResolutionStatus('NORMAL');
                          setResolutionModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold transition border border-emerald-500/30"
                      >
                        Resolve / Unblock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      <window.Modal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        title={`Resolve Escalation: ${selectedItem?.name || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Set Resolution Status</label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="NORMAL">NORMAL (Unblock and allow automated recovery)</option>
              <option value="COMPLAINT">KEEP COMPLAINT (Keep blocked)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Resolution Notes</label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter resolution reason (logged into immutable audit trail)..."
              className="w-full bg-surface-subtle border border-surface-border text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setResolutionModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-subtle text-slate-400 text-xs font-semibold hover:bg-surface-cardHover"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400"
            >
              Apply Resolution
            </button>
          </div>
        </div>
      </window.Modal>
    </div>
  );
};
