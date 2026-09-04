// Dark Fintech Policies & Stopping Rules Configuration Page Component
window.PoliciesPage = function PoliciesPage({ lang }) {
  const [policies, setPolicies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingPolicy, setEditingPolicy] = React.useState(null);
  const [newValue, setNewValue] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await window.PayFixorAPI.getPolicies();
      setPolicies(data);
    } catch (e) {
      console.error('Failed to load policies', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPolicies();
  }, []);

  const handleSavePolicy = async () => {
    if (!editingPolicy) return;
    setSaving(true);
    try {
      await window.PayFixorAPI.updatePolicy(editingPolicy.name, { value: newValue });
      setModalOpen(false);
      await loadPolicies();
    } catch (e) {
      console.error('Failed to save policy', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="fintech-card p-6 bg-gradient-to-r from-indigo-950/40 via-surface-card to-cyan-950/30 border-cyan-500/30">
        <h3 className="text-sm font-black text-slate-100 font-display">Deterministic Guardrails & Safety Parameters</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          PayFixor AI agents reason within strictly bounded code policies. The AI cannot bypass these rules. The ecommerce merchant can adjust safe thresholds in real-time.
        </p>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full fintech-card p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading guardrails and policies...
          </div>
        ) : (
          policies.map((p) => (
            <div key={p.policy_id} className="fintech-card p-6 flex flex-col justify-between hover:border-surface-highlight transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-border">
                  <span className="font-mono text-xs font-bold text-cyan-400">{p.name}</span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                    p.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {p.is_active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                <div className="my-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Configured Threshold</span>
                  <div className="text-2xl font-black text-slate-100 font-mono mt-0.5">{p.value}</div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {p.description || 'Deterministic safety stopping rule enforcing execution bounds.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Updated: {new Date(p.updated_at || Date.now()).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    setEditingPolicy(p);
                    setNewValue(p.value);
                    setModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-cardHover hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition border border-cyan-500/30"
                >
                  Configure Value
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Policy Modal */}
      <window.Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Configure Guardrail: ${editingPolicy?.name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">{editingPolicy?.description}</p>
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Threshold Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. 1, 10000, true"
              className="w-full bg-surface-subtle border border-surface-border text-xs rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-subtle text-slate-400 text-xs font-semibold hover:bg-surface-cardHover"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePolicy}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving ? t('btn_saving') : t('btn_save_changes')}
            </button>
          </div>
        </div>
      </window.Modal>
    </div>
  );
};
