// Dark Fintech Customers Page Component
window.CustomersPage = function CustomersPage({ lang }) {
  const [customers, setCustomers] = React.useState([]);
  const [filter, setFilter] = React.useState('ALL');
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState('NORMAL');
  const [statusReason, setStatusReason] = React.useState('');

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await window.PayFixorAPI.listCustomers();
      setCustomers(data);
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCustomers();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedCustomer) return;
    try {
      await window.PayFixorAPI.updateCustomerStatus(
        selectedCustomer.customer_id,
        newStatus,
        statusReason
      );
      setModalOpen(false);
      await loadCustomers();
    } catch (e) {
      console.error('Error updating customer status', e);
    }
  };

  const filtered = customers.filter((c) => {
    const matchesFilter = filter === 'ALL' || c.complaint_status === filter;
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.customer_id || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-card p-4 rounded-2xl border border-surface-border">
        <div className="relative flex-1 min-w-[240px]">
          <i data-lucide="search" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input
            type="text"
            placeholder="Search by customer name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-surface-border">
          {['ALL', 'NORMAL', 'COMPLAINT', 'HIGH_VALUE_REVIEW'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === f
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? t('btn_all') : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Customer Cohorts ({filtered.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Protected by Stopping Rules</span>
        </div>

        <div className="overflow-x-auto">
          <table className="fintech-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Total Spend</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No customers found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.customer_id}>
                    <td className="font-mono text-cyan-400 font-bold">{c.customer_id}</td>
                    <td className="font-semibold text-slate-200">{c.name}</td>
                    <td>
                      <div className="text-xs text-slate-400">{c.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.phone}</div>
                    </td>
                    <td className="font-mono font-bold text-slate-100">{formatINR(c.total_spend)}</td>
                    <td><window.StatusBadge status={c.complaint_status} type="complaint" /></td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setNewStatus(c.complaint_status || 'NORMAL');
                          setModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface-cardHover text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold transition border border-cyan-500/30"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      <window.Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Update Customer: ${selectedCustomer?.name || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Complaint / Escalation Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="NORMAL">NORMAL (Eligible for auto-recovery)</option>
              <option value="COMPLAINT">COMPLAINT (Blocked from automated messaging)</option>
              <option value="HIGH_VALUE_REVIEW">HIGH_VALUE_REVIEW (Requires human approval)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Reason / Notes</label>
            <textarea
              rows="3"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Enter reason for status change (stored in immutable audit trail)..."
              className="w-full bg-surface-subtle border border-surface-border text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-subtle text-slate-400 text-xs font-semibold hover:bg-surface-cardHover"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400"
            >
              Save Changes
            </button>
          </div>
        </div>
      </window.Modal>
    </div>
  );
};
