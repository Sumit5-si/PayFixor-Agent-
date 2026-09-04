// Dark Kanban Fintech Sidebar Component matching uploaded UI style
window.Sidebar = function Sidebar({
  activePage,
  setActivePage,
  activeIncidentsCount = 0,
  lang,
  setLang
}) {
  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);

  const navItems = [
    { id: 'overview', label: t('nav_overview', 'Overview'), icon: 'layout-grid', group: 'ops' },
    { id: 'incidents', label: t('nav_incidents', 'Live Incidents'), icon: 'alert-triangle', badge: activeIncidentsCount, group: 'ops' },
    { id: 'recovery', label: t('nav_recovery', 'Revenue Recovery'), icon: 'banknote', group: 'ops' },
    { id: 'experiments', label: t('nav_experiments', 'A/B Experiments'), icon: 'split', group: 'ops' },
    { id: 'customers', label: t('nav_customers', 'Customer Cohorts'), icon: 'users', group: 'ops' },
    { id: 'agent-activity', label: t('nav_agent_activity', 'Agent Activity'), icon: 'cpu', group: 'ai' },
    { id: 'complaints', label: t('nav_complaints', 'Escalations & Review'), icon: 'shield-alert', group: 'ai' },
    { id: 'audit-trail', label: t('nav_audit_trail', 'Audit Trail'), icon: 'history', group: 'ai' },
    { id: 'policies', label: t('nav_policies', 'Stopping Rules'), icon: 'sliders', group: 'ai' },
    { id: 'integration', label: t('nav_integration', 'Integration Health'), icon: 'activity', group: 'ai' }
  ];

  React.useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activePage, lang, activeIncidentsCount]);

  return (
    <aside className="w-64 bg-surface-sidebar border-r border-surface-border flex flex-col shrink-0 h-screen sticky top-0 select-none z-30 justify-between">
      {/* Top Section: Brand & Nav */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="p-4 border-b border-surface-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/20 text-sm">
              PF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm text-slate-100 tracking-tight font-display">{t('app_name', 'PayFixor')}</h1>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
                  {t('agent', 'AGENT')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">{t('app_tagline', 'Autonomous Revenue Recovery')}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Operations Section */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-2 pb-1.5 flex items-center justify-between">
            <span>{t('nav_operations', 'Operations & Incidents')}</span>
            <i data-lucide="chevron-down" className="w-3 h-3 text-slate-500"></i>
          </div>
          {navItems.filter(i => i.group === 'ops').map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-surface-cardHover text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                    : 'text-slate-400 hover:bg-surface-card hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i data-lucide={item.icon} className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}></i>
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* AI & Governance Section */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-4 pb-1.5 flex items-center justify-between">
            <span>{t('nav_intelligence', 'AI & Governance')}</span>
            <i data-lucide="chevron-down" className="w-3 h-3 text-slate-500"></i>
          </div>
          {navItems.filter(i => i.group === 'ai').map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-surface-cardHover text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                    : 'text-slate-400 hover:bg-surface-card hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i data-lucide={item.icon} className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}></i>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Active Monitor Card & Profile */}
      <div className="p-3 border-t border-surface-border/60 bg-surface-sidebar space-y-3">
        {/* Active System Monitor Card (Like the image's "Design System 2.0" card) */}
        <div className="p-3 bg-surface-card rounded-2xl border border-surface-border relative overflow-hidden group">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot"></span>
              <span>24/7 Autonomous</span>
            </div>
            <span className="text-cyan-400 font-semibold font-mono text-[9px]">v2.4</span>
          </div>
          <h4 className="text-xs font-bold text-slate-200">{t('system_monitor_title', 'PayFixor Core 2.0')}</h4>
          <p className="text-[10px] text-slate-400 truncate mb-2">{t('system_monitor_sub', 'Autonomous 24/7 Revenue Sentry')}</p>
          
          {/* Glowing Cyan Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div className="progress-bar-cyan h-full rounded-full w-4/5 animate-pulse"></div>
          </div>
        </div>

        {/* User Profile Card with Avatar & Language Switch */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-surface-card/60 rounded-xl border border-surface-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-cyan-500/20">
              PA
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">{t('merchant_admin', 'Merchant Admin')}</span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[90px]">{t('admin_email', 'admin@payfixor.ai')}</span>
            </div>
          </div>

          {/* Quick Language Toggle Pill */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface-cardHover text-[11px] font-bold text-cyan-400 border border-surface-border hover:border-cyan-500/40 transition flex items-center gap-1"
            title="Toggle English / हिन्दी"
          >
            <span>{lang === 'en' ? '🇮🇳 HI' : '🇬🇧 EN'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
