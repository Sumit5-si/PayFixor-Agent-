// Dark Kanban Fintech Header Component with Dynamic Language Switcher
window.Header = function Header({
  activePage,
  onRefresh,
  onSimulateDegradation,
  onScanTelemetry,
  isRefreshing,
  isSimulating,
  lang,
  setLang
}) {
  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);

  const getPageInfo = () => {
    switch (activePage) {
      case 'overview':
        return { title: t('title_overview'), subtitle: t('subtitle_overview') };
      case 'incidents':
        return { title: t('title_incidents'), subtitle: t('subtitle_incidents') };
      case 'incident-detail':
        return { title: t('title_incident_detail'), subtitle: t('subtitle_incident_detail') };
      case 'recovery':
        return { title: t('title_recovery'), subtitle: t('subtitle_recovery') };
      case 'experiments':
        return { title: t('title_experiments'), subtitle: t('subtitle_experiments') };
      case 'customers':
        return { title: t('title_customers'), subtitle: t('subtitle_customers') };
      case 'agent-activity':
        return { title: t('title_agent_activity'), subtitle: t('subtitle_agent_activity') };
      case 'complaints':
        return { title: t('title_complaints'), subtitle: t('subtitle_complaints') };
      case 'audit-trail':
        return { title: t('title_audit_trail'), subtitle: t('subtitle_audit_trail') };
      case 'policies':
        return { title: t('title_policies'), subtitle: t('subtitle_policies') };
      case 'integration':
        return { title: t('title_integration'), subtitle: t('subtitle_integration') };
      default:
        return { title: t('app_name'), subtitle: t('app_tagline') };
    }
  };

  const pageInfo = getPageInfo();

  React.useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activePage, isRefreshing, isSimulating, lang]);

  return (
    <header className="bg-surface-sidebar/90 backdrop-blur-md border-b border-surface-border px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-md">
      {/* Title & Context */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-black text-slate-100 tracking-tight font-display">{pageInfo.title}</h2>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold">
            {t('live_mode', 'RAZORPAY TEST MODE')}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{pageInfo.subtitle}</p>
      </div>

      {/* Actions & Language Switcher */}
      <div className="flex items-center gap-3">
        {/* Language Switcher Pill Button */}
        <div className="flex items-center bg-surface-card rounded-xl p-1 border border-surface-border">
          <button
            onClick={() => setLang('en')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lang === 'en'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
          <button
            onClick={() => setLang('hi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lang === 'hi'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇮🇳</span>
            <span>हिन्दी</span>
          </button>
        </div>

        {/* Simulate Payment Degradation Action Button */}
        <button
          onClick={onSimulateDegradation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white transition shadow-lg shadow-rose-500/20 disabled:opacity-60"
          title="Injects synthetic incident and triggers detection, diagnosis, and recovery loop"
        >
          {isSimulating ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <i data-lucide="flame" className="w-3.5 h-3.5"></i>
          )}
          <span>{isSimulating ? t('btn_simulating') : t('btn_simulate_degradation')}</span>
        </button>

        {/* Scan Telemetry Anomaly Button */}
        <button
          onClick={onScanTelemetry}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border hover:border-surface-highlight transition disabled:opacity-60 shadow-sm"
        >
          <i data-lucide="scan" className="w-3.5 h-3.5 text-cyan-400"></i>
          <span>{t('btn_scan_telemetry')}</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border hover:border-surface-highlight transition disabled:opacity-60 shadow-sm"
          title={t('btn_refresh')}
        >
          <i data-lucide="refresh-cw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}></i>
        </button>
      </div>
    </header>
  );
};
