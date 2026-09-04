// Dark Kanban Fintech Incidents Page Component
window.IncidentsPage = function IncidentsPage({
  incidents,
  onSelectIncident,
  onTriggerRecovery,
  onInvestigate,
  lang
}) {
  const [viewMode, setViewMode] = React.useState('board'); // 'board' or 'table'
  const [filterStatus, setFilterStatus] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loadingAction, setLoadingAction] = React.useState({});
  const [actionMenuOpen, setActionMenuOpen] = React.useState(null);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [incidents, viewMode, filterStatus, actionMenuOpen, lang]);

  // Filter incidents
  const filteredIncidents = (incidents || []).filter(inc => {
    const matchesStatus = filterStatus === 'ALL' || inc.status === filterStatus;
    const matchesSearch = (inc.segment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inc.incident_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inc.hypothesis || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group into Kanban Columns
  const activeDetected = filteredIncidents.filter(i => ['DETECTED', 'CONFIRMED'].includes(i.status));
  const inProgressAI = filteredIncidents.filter(i => ['INVESTIGATING', 'RECOVERY_ACTIVE', 'MONITORING'].includes(i.status));
  const recoveredResolved = filteredIncidents.filter(i => ['RESOLVED', 'RECOVERED', 'INSUFFICIENT_EVIDENCE'].includes(i.status));

  const handleAction = async (e, actionFn, incId, key) => {
    e.stopPropagation();
    setLoadingAction(prev => ({ ...prev, [`${incId}_${key}`]: true }));
    setActionMenuOpen(null);
    try {
      await actionFn(incId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(prev => ({ ...prev, [`${incId}_${key}`]: false }));
    }
  };

  const renderKanbanCard = (inc) => {
    const isInvestigating = loadingAction[`${inc.incident_id}_investigate`];
    const isRecovering = loadingAction[`${inc.incident_id}_recover`];
    const progressPercent = inc.status === 'RESOLVED' ? 100 : inc.status === 'RECOVERY_ACTIVE' ? 65 : inc.status === 'INVESTIGATING' ? 35 : 10;
    const isMenuOpen = actionMenuOpen === inc.incident_id;

    return (
      <div
        key={inc.incident_id}
        onClick={() => onSelectIncident(inc.incident_id)}
        className="kanban-card p-4 flex flex-col justify-between cursor-pointer relative group"
      >
        {/* Card Header: Title, Category & 3-Dots Action Menu */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">{inc.incident_id}</span>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition mt-0.5">
                {inc.segment}
              </h4>
            </div>

            {/* 3-Dots Action Menu Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActionMenuOpen(isMenuOpen ? null : inc.incident_id);
                }}
                className="w-7 h-7 rounded-lg bg-surface-card hover:bg-surface-cardHover text-slate-400 hover:text-slate-200 flex items-center justify-center transition border border-surface-border"
              >
                <i data-lucide="more-horizontal" className="w-3.5 h-3.5"></i>
              </button>

              {/* Action Dropdown Menu */}
              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 w-44 bg-surface-card border border-surface-border rounded-xl shadow-2xl p-1.5 z-40 animate-fadeIn space-y-1"
                >
                  <button
                    onClick={(e) => handleAction(e, onInvestigate, inc.incident_id, 'investigate')}
                    disabled={isInvestigating}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-surface-cardHover hover:text-cyan-400 flex items-center gap-2"
                  >
                    <i data-lucide="brain-circuit" className="w-3.5 h-3.5 text-cyan-400"></i>
                    <span>{isInvestigating ? t('btn_scanning') : t('btn_investigate')}</span>
                  </button>
                  <button
                    onClick={(e) => handleAction(e, onTriggerRecovery, inc.incident_id, 'recover')}
                    disabled={isRecovering}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-surface-cardHover hover:text-emerald-400 flex items-center gap-2"
                  >
                    <i data-lucide="zap" className="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>{isRecovering ? t('btn_saving') : t('btn_trigger_recovery')}</span>
                  </button>
                  <button
                    onClick={() => onSelectIncident(inc.incident_id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-surface-cardHover hover:text-indigo-400 flex items-center gap-2"
                  >
                    <i data-lucide="eye" className="w-3.5 h-3.5 text-indigo-400"></i>
                    <span>{t('btn_view_details')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description / Root-Cause Hypothesis */}
          <p className="text-xs text-slate-400 line-clamp-2 my-2 leading-relaxed">
            {inc.hypothesis || 'Statistical anomaly detected exceeding baseline failure rate. Multi-tool evidence gathered.'}
          </p>

          {/* Incident Telemetry Metrics Badge */}
          <div className="flex flex-wrap items-center gap-2 my-2.5">
            <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
              {inc.current_rate ? `${(inc.current_rate * 100).toFixed(1)}% Failure` : 'High Spike'}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
              {inc.anomaly_ratio ? `${inc.anomaly_ratio.toFixed(1)}x Baseline` : '2.4x Spike'}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold">
              At Risk: {formatINR(inc.revenue_at_risk)}
            </span>
          </div>
        </div>

        {/* Footer Meta Row & Glowing Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-surface-border/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <i data-lucide="message-square" className="w-3 h-3 text-cyan-400"></i>
                <span className="font-mono font-semibold text-slate-300">{inc.sample_size ? `${Math.floor(inc.sample_size / 20)} AI Ops` : '3 Actions'}</span>
              </span>
              <span className="flex items-center gap-1">
                <i data-lucide="users" className="w-3 h-3 text-indigo-400"></i>
                <span className="font-mono font-semibold text-slate-300">{inc.sample_size || 128} {t('th_customer_id')}</span>
              </span>
            </div>
            <span className="font-mono text-cyan-400 font-bold">{progressPercent}%</span>
          </div>

          {/* Rounded Cyan Glowing Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="progress-bar-cyan h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Status Filter & Board/Table Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-card p-4 rounded-2xl border border-surface-border">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <i data-lucide="search" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by segment, incident ID, or hypothesis..."
            className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-surface-border overflow-x-auto">
          {['ALL', 'DETECTED', 'INVESTIGATING', 'CONFIRMED', 'RECOVERY_ACTIVE', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? t('btn_all') : t(`status_${status.toLowerCase()}`, status.replace('_', ' '))}
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Board View vs Table View */}
        <div className="flex items-center bg-surface-subtle p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'board'
                ? 'bg-surface-cardHover text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i data-lucide="columns" className="w-3.5 h-3.5"></i>
            <span>{t('btn_kanban_view')}</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'table'
                ? 'bg-surface-cardHover text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i data-lucide="list" className="w-3.5 h-3.5"></i>
            <span>{t('btn_table_view')}</span>
          </button>
        </div>
      </div>

      {/* View Mode: 3-Column Kanban Board matching the uploaded image */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Active & Detected */}
          <div className="kanban-column p-4 space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse-dot"></span>
                <h3 className="text-xs font-black text-slate-200 tracking-wide uppercase">{t('col_active_incidents')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/30">
                  {activeDetected.length}
                </span>
              </div>
              <button
                onClick={() => setFilterStatus('DETECTED')}
                className="w-6 h-6 rounded-lg bg-surface-card hover:bg-surface-cardHover text-slate-400 hover:text-slate-200 flex items-center justify-center transition border border-surface-border text-xs font-bold"
              >
                +
              </button>
            </div>

            {/* Column Cards */}
            <div className="space-y-3">
              {activeDetected.length === 0 ? (
                <div className="p-6 text-center bg-surface-card/40 rounded-xl border border-dashed border-surface-border text-xs text-slate-500">
                  No active detected anomalies
                </div>
              ) : (
                activeDetected.map(renderKanbanCard)
              )}
            </div>
          </div>

          {/* Column 2: AI In-Progress & Diagnosing */}
          <div className="kanban-column p-4 space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse-dot"></span>
                <h3 className="text-xs font-black text-slate-200 tracking-wide uppercase">{t('col_ai_diagnosing')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/30">
                  {inProgressAI.length}
                </span>
              </div>
              <button
                onClick={() => setFilterStatus('INVESTIGATING')}
                className="w-6 h-6 rounded-lg bg-surface-card hover:bg-surface-cardHover text-slate-400 hover:text-slate-200 flex items-center justify-center transition border border-surface-border text-xs font-bold"
              >
                +
              </button>
            </div>

            {/* Column Cards */}
            <div className="space-y-3">
              {inProgressAI.length === 0 ? (
                <div className="p-6 text-center bg-surface-card/40 rounded-xl border border-dashed border-surface-border text-xs text-slate-500">
                  No incidents currently under AI diagnosis
                </div>
              ) : (
                inProgressAI.map(renderKanbanCard)
              )}
            </div>
          </div>

          {/* Column 3: Recovered & Resolved */}
          <div className="kanban-column p-4 space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 className="text-xs font-black text-slate-200 tracking-wide uppercase">{t('col_recovered_resolved')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                  {recoveredResolved.length}
                </span>
              </div>
              <button
                onClick={() => setFilterStatus('RESOLVED')}
                className="w-6 h-6 rounded-lg bg-surface-card hover:bg-surface-cardHover text-slate-400 hover:text-slate-200 flex items-center justify-center transition border border-surface-border text-xs font-bold"
              >
                +
              </button>
            </div>

            {/* Column Cards */}
            <div className="space-y-3">
              {recoveredResolved.length === 0 ? (
                <div className="p-6 text-center bg-surface-card/40 rounded-xl border border-dashed border-surface-border text-xs text-slate-500">
                  No resolved incidents in current view
                </div>
              ) : (
                recoveredResolved.map(renderKanbanCard)
              )}
            </div>
          </div>
        </div>
      ) : (
        /* View Mode: Dense Telemetry Table */
        <div className="fintech-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>{t('th_incident_id')}</th>
                  <th>{t('th_segment')}</th>
                  <th>{t('th_failure_rate')}</th>
                  <th>{t('th_degradation')}</th>
                  <th>{t('th_revenue_at_risk')}</th>
                  <th>{t('th_confidence')}</th>
                  <th>{t('th_status')}</th>
                  <th>{t('th_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500">
                      No incidents match the search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr key={inc.incident_id} className="cursor-pointer" onClick={() => onSelectIncident(inc.incident_id)}>
                      <td className="font-mono font-bold text-cyan-400">{inc.incident_id}</td>
                      <td className="font-semibold text-slate-200">{inc.segment}</td>
                      <td className="font-mono text-rose-400">
                        {inc.current_rate ? `${(inc.current_rate * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="font-mono text-amber-400 font-bold">
                        {inc.anomaly_ratio ? `${inc.anomaly_ratio.toFixed(1)}x` : 'N/A'}
                      </td>
                      <td className="font-mono font-bold text-slate-100">{formatINR(inc.revenue_at_risk)}</td>
                      <td className="font-mono text-cyan-400">{((inc.confidence || 0.91) * 100).toFixed(0)}%</td>
                      <td><window.StatusBadge status={inc.status} /></td>
                      <td>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleAction(e, onInvestigate, inc.incident_id, 'investigate')}
                            className="px-2.5 py-1 rounded-lg bg-surface-cardHover text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold transition border border-cyan-500/30"
                          >
                            {t('btn_investigate')}
                          </button>
                          <button
                            onClick={() => onSelectIncident(inc.incident_id)}
                            className="px-2.5 py-1 rounded-lg bg-surface-card text-slate-300 hover:bg-surface-cardHover text-xs font-semibold transition border border-surface-border"
                          >
                            {t('btn_view_details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
