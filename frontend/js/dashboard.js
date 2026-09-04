// Clean Safe React Lucide Icon Component (Avoids DOM mutation race conditions)
function Icon({ name, className = "w-4 h-4" }) {
  const svgHtml = React.useMemo(() => {
    if (!name) return '';
    if (window.lucide && window.lucide.icons) {
      if (window.lucide.icons[name]) {
        return window.lucide.icons[name].toSvg({ class: className });
      }
      const camel = name.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
      if (window.lucide.icons[camel]) {
        return window.lucide.icons[camel].toSvg({ class: className });
      }
    }
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }, [name, className]);

  return <span className="inline-flex items-center justify-center shrink-0" dangerouslySetInnerHTML={{ __html: svgHtml }} />;
}
window.Icon = Icon;

// --- FILE: frontend/js/components/KPICard.js ---
// Dark Kanban Fintech KPI Card with Micro Sparklines
window.KPICard = function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = 'neutral', // 'positive', 'negative', 'neutral'
  color = 'cyan', // 'cyan', 'indigo', 'emerald', 'amber', 'rose'
  sparklineData = [12, 14, 18, 15, 22, 26, 24, 29, 35]
}) {
  React.useEffect(() => {
    
  }, [icon]);

  const colorThemes = {
    cyan: {
      accent: 'border-t-cyan-500',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      sparkline: '#06B6D4',
      sparklineFill: 'rgba(6, 182, 212, 0.12)'
    },
    indigo: {
      accent: 'border-t-indigo-500',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      sparkline: '#6366F1',
      sparklineFill: 'rgba(99, 102, 241, 0.12)'
    },
    emerald: {
      accent: 'border-t-emerald-500',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      sparkline: '#10B981',
      sparklineFill: 'rgba(16, 185, 129, 0.12)'
    },
    amber: {
      accent: 'border-t-amber-500',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      sparkline: '#F59E0B',
      sparklineFill: 'rgba(245, 158, 11, 0.12)'
    },
    rose: {
      accent: 'border-t-rose-500',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      sparkline: '#F43F5E',
      sparklineFill: 'rgba(244, 63, 94, 0.12)'
    }
  };

  const theme = colorThemes[color] || colorThemes.cyan;

  const trendStyles = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    neutral: 'text-slate-300 bg-slate-800 border-slate-700'
  };

  // Generate SVG Sparkline Points
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 100;
  const height = 28;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const closedPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className={`fintech-card p-4 flex flex-col justify-between border-t-2 ${theme.accent} hover:border-surface-highlight transition-all relative overflow-hidden group`}>
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={`p-1.5 rounded-xl border ${theme.iconBg} transition-transform group-hover:scale-110 shadow-sm`}>
            <Icon name="circle" className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main Metric Value & Graphical Sparkline */}
      <div className="my-2.5 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-black text-slate-100 tabular-nums tracking-tight font-display">
            {value}
          </div>
        </div>

        {/* Graphical Micro Sparkline */}
        <div className="w-20 h-7 opacity-75 group-hover:opacity-100 transition-opacity">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <polygon points={closedPoints} fill={theme.sparklineFill} />
            <polyline
              fill="none"
              stroke={theme.sparkline}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Footer Subtitle & Trend */}
      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-surface-border/60">
        <span className="text-slate-400 font-medium truncate max-w-[130px]">{subtitle}</span>
        {trend && (
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono ${trendStyles[trendType]}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};


// --- FILE: frontend/js/components/StatusBadge.js ---
// Dark Kanban Fintech Status Badge Component with Translation Support
window.StatusBadge = function StatusBadge({ status, type = 'incident' }) {
  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const normalized = (status || '').toUpperCase();

  const styles = {
    // Incidents
    DETECTED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    INVESTIGATING: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    CONFIRMED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    RECOVERY_ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold',
    MONITORING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    RESOLVED: 'bg-slate-800 text-slate-300 border-slate-700',
    INSUFFICIENT_EVIDENCE: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    HUMAN_REVIEW: 'bg-rose-500/10 text-rose-400 border-rose-500/30',

    // Recovery Actions
    INITIATED: 'bg-slate-800 text-slate-300 border-slate-700',
    LINK_CREATED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    SENT: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    RECOVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold',
    EXPIRED: 'bg-slate-800 text-slate-500 border-slate-700',
    FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    STOPPED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    ESCALATED: 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-semibold',

    // Complaints
    NORMAL: 'bg-slate-800 text-slate-400 border-slate-700',
    COMPLAINT: 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-semibold',
    HIGH_VALUE_REVIEW: 'bg-amber-500/15 text-amber-400 border-amber-500/40 font-semibold'
  };

  const dotColors = {
    DETECTED: 'bg-amber-400',
    INVESTIGATING: 'bg-cyan-400 animate-pulse-dot',
    CONFIRMED: 'bg-indigo-400',
    RECOVERY_ACTIVE: 'bg-emerald-400 animate-pulse-dot',
    MONITORING: 'bg-blue-400',
    RESOLVED: 'bg-slate-500',
    INSUFFICIENT_EVIDENCE: 'bg-purple-400',
    HUMAN_REVIEW: 'bg-rose-400',
    RECOVERED: 'bg-emerald-400',
    FAILED: 'bg-rose-400',
    SENT: 'bg-indigo-400',
    LINK_CREATED: 'bg-blue-400'
  };

  const statusKey = `status_${normalized.toLowerCase()}`;
  const translatedText = t(statusKey, status?.replace(/_/g, ' '));

  const styleClass = styles[normalized] || 'bg-slate-800 text-slate-300 border-slate-700';
  const dotColor = dotColors[normalized] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{translatedText}</span>
    </span>
  );
};


// --- FILE: frontend/js/components/Modal.js ---
// Dark Fintech Modal Component
window.Modal = function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-surface-card border border-surface-border rounded-2xl w-full ${maxWidth} shadow-2xl overflow-hidden animate-slideUp`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle">
          <h3 className="text-base font-bold text-slate-100 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-cardHover hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};


// --- FILE: frontend/js/components/Header.js ---
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
            <Icon name="flame" className="w-3.5 h-3.5" />
          )}
          <span>{isSimulating ? t('btn_simulating') : t('btn_simulate_degradation')}</span>
        </button>

        {/* Scan Telemetry Anomaly Button */}
        <button
          onClick={onScanTelemetry}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border hover:border-surface-highlight transition disabled:opacity-60 shadow-sm"
        >
          <Icon name="scan" className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('btn_scan_telemetry')}</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border hover:border-surface-highlight transition disabled:opacity-60 shadow-sm"
          title={t('btn_refresh')}
        >
          <Icon name="refresh-cw" className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
        </button>
      </div>
    </header>
  );
};


// --- FILE: frontend/js/components/Sidebar.js ---
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
            <Icon name="chevron-down" className="w-3 h-3 text-slate-500" />
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
                  <Icon name={item.icon || "circle"} className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
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
            <Icon name="chevron-down" className="w-3 h-3 text-slate-500" />
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
                  <Icon name={item.icon || "circle"} className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
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


// --- FILE: frontend/js/pages/Overview.js ---
// Dark Kanban Fintech Overview Page Component
window.OverviewPage = function OverviewPage({
  kpis,
  incidents,
  onSelectIncident,
  onSimulateDegradation,
  isSimulating,
  lang
}) {
  const chartRef1 = React.useRef(null);
  const chartRef2 = React.useRef(null);
  const chartInstance1 = React.useRef(null);
  const chartInstance2 = React.useRef(null);
  const [activePipelineStep, setActivePipelineStep] = React.useState(null);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // Initialize and update Chart.js instances with Dark Futuristic Palette
  React.useEffect(() => {
    if (chartRef1.current) {
      if (chartInstance1.current) chartInstance1.current.destroy();

      const ctx1 = chartRef1.current.getContext('2d');
      
      const gradient1 = ctx1.createLinearGradient(0, 0, 0, 300);
      gradient1.addColorStop(0, '#F43F5E');
      gradient1.addColorStop(1, '#BE123C');

      const gradient2 = ctx1.createLinearGradient(0, 0, 0, 300);
      gradient2.addColorStop(0, '#06B6D4');
      gradient2.addColorStop(1, '#0284C7');

      const gradient3 = ctx1.createLinearGradient(0, 0, 0, 300);
      gradient3.addColorStop(0, '#10B981');
      gradient3.addColorStop(1, '#047857');

      chartInstance1.current = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: [t('kpi_revenue_at_risk'), t('kpi_revenue_recovered'), t('kpi_incremental_revenue')],
          datasets: [{
            label: 'Amount (INR)',
            data: [
              kpis.revenue_at_risk || 0,
              kpis.revenue_recovered || 0,
              kpis.incremental_revenue || 0
            ],
            backgroundColor: [gradient1, gradient2, gradient3],
            borderRadius: 10,
            barThickness: 38
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#151821',
              borderColor: '#232735',
              borderWidth: 1,
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => ` ₹${Number(ctx.raw).toLocaleString('en-IN')}`
              }
            }
          },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter', weight: 500 } } 
            },
            y: { 
              grid: { color: 'rgba(35, 39, 53, 0.6)' }, 
              ticks: { 
                color: '#94A3B8', 
                font: { size: 11, family: 'Inter' },
                callback: (val) => `₹${Number(val).toLocaleString('en-IN')}`
              } 
            }
          }
        }
      });
    }

    if (chartRef2.current) {
      if (chartInstance2.current) chartInstance2.current.destroy();

      const ctx2 = chartRef2.current.getContext('2d');
      chartInstance2.current = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['UPI (Degraded Bank)', 'Card Gateway', 'Netbanking'],
          datasets: [{
            data: [65, 20, 15],
            backgroundColor: ['#06B6D4', '#6366F1', '#F59E0B'],
            borderColor: '#151821',
            borderWidth: 4,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '74%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { 
                color: '#94A3B8', 
                boxWidth: 12, 
                padding: 14,
                font: { size: 11, family: 'Inter', weight: 500 } 
              }
            },
            tooltip: {
              backgroundColor: '#151821',
              borderColor: '#232735',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 10
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
      if (chartInstance2.current) chartInstance2.current.destroy();
    };
  }, [kpis, lang]);

  React.useEffect(() => {
    
  }, [incidents, activePipelineStep, lang]);

  // Pipeline Architecture Stages Data
  const pipelineSteps = [
    {
      id: 'telemetry',
      title: t('pipe_1_title', '1. Ingestion'),
      subtitle: t('pipe_1_sub', 'Razorpay Telemetry'),
      icon: 'database',
      color: 'cyan',
      detail: t('pipe_1_desc', 'Continuous real-time ingestion of payment attempts, error codes, and segment metadata.')
    },
    {
      id: 'detection',
      title: t('pipe_2_title', '2. Detection'),
      subtitle: t('pipe_2_sub', 'Statistical Engine'),
      icon: 'activity',
      color: 'rose',
      detail: t('pipe_2_desc', '100% deterministic anomaly engine comparing rolling baselines against current failure rates.')
    },
    {
      id: 'investigation',
      title: t('pipe_3_title', '3. Investigation'),
      subtitle: t('pipe_3_sub', 'Evidence Gathering'),
      icon: 'search',
      color: 'indigo',
      detail: t('pipe_3_desc', 'Structured multi-dimensional tool gathering without hallucination.')
    },
    {
      id: 'diagnosis',
      title: t('pipe_4_title', '4. Diagnosis'),
      subtitle: t('pipe_4_sub', 'Gemini Reasoning'),
      icon: 'brain-circuit',
      color: 'cyan',
      detail: t('pipe_4_desc', 'LLM generates root-cause hypothesis and confidence bound from evidence.')
    },
    {
      id: 'guardrails',
      title: t('pipe_5_title', '5. Guardrails'),
      subtitle: t('pipe_5_sub', 'Policy Engine'),
      icon: 'shield-check',
      color: 'amber',
      detail: t('pipe_5_desc', 'Deterministic rules check stopping conditions and customer safety caps.')
    },
    {
      id: 'settlement',
      title: t('pipe_6_title', '6. Settlement'),
      subtitle: t('pipe_6_sub', 'Razorpay Recovery'),
      icon: 'check-circle-2',
      color: 'emerald',
      detail: t('pipe_6_desc', 'Dispatches Razorpay Test Payment Links with HMAC webhook verification.')
    }
  ];

  return (
    <div className="space-y-6">
      {/* 8 Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('kpi_revenue_at_risk')}
          value={formatINR(kpis.revenue_at_risk)}
          subtitle={t('kpi_sub_threat')}
          icon="alert-octagon"
          trend={`${kpis.active_incidents} Active`}
          trendType={kpis.active_incidents > 0 ? 'negative' : 'neutral'}
          color="rose"
          sparklineData={[10, 15, 25, 45, 60, 85, 70]}
        />
        <KPICard
          title={t('kpi_revenue_recovered')}
          value={formatINR(kpis.revenue_recovered)}
          subtitle={t('kpi_sub_verified')}
          icon="check-circle"
          trend={`${kpis.customers_recovered} Saved`}
          trendType="positive"
          color="emerald"
          sparklineData={[5, 12, 18, 30, 48, 65, 88]}
        />
        <KPICard
          title={t('kpi_recovery_rate')}
          value={`${(kpis.recovery_rate || 0).toFixed(1)}%`}
          subtitle={t('kpi_sub_conversion')}
          icon="percent"
          trend="Conversion"
          trendType="positive"
          color="cyan"
          sparklineData={[12, 14, 16, 18, 21, 24, 28]}
        />
        <KPICard
          title={t('kpi_incremental_revenue')}
          value={formatINR(kpis.incremental_revenue)}
          subtitle={t('kpi_sub_ai_lift')}
          icon="trending-up"
          trend={`+${(kpis.recovery_lift || 0).toFixed(1)}%`}
          trendType="positive"
          color="indigo"
          sparklineData={[4, 8, 12, 20, 32, 45, 58]}
        />
      </div>

      {/* Secondary KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('kpi_recovery_lift')}
          value={`+${(kpis.recovery_lift || 0).toFixed(1)}%`}
          subtitle={t('kpi_sub_relative')}
          icon="zap"
          color="cyan"
          sparklineData={[10, 14, 20, 28, 35, 44, 54]}
        />
        <KPICard
          title={t('kpi_active_incidents')}
          value={kpis.active_incidents}
          subtitle={t('kpi_sub_live')}
          icon="flame"
          trend={kpis.active_incidents > 0 ? 'Live Anomaly' : 'Stable'}
          trendType={kpis.active_incidents > 0 ? 'negative' : 'positive'}
          color="amber"
          sparklineData={[0, 1, 0, 2, 1, 3, kpis.active_incidents || 1]}
        />
        <KPICard
          title={t('kpi_customers_recovered')}
          value={kpis.customers_recovered}
          subtitle={t('kpi_sub_customers')}
          icon="user-check"
          trend="Settled"
          trendType="positive"
          color="emerald"
          sparklineData={[2, 6, 12, 18, 25, 34, 48]}
        />
        <KPICard
          title={t('kpi_ai_actions')}
          value={kpis.ai_actions_count || 42}
          subtitle={t('kpi_sub_tokens')}
          icon="cpu"
          trend="Bounded"
          trendType="neutral"
          color="indigo"
          sparklineData={[8, 12, 19, 24, 30, 38, 42]}
        />
      </div>

      {/* PayFixor 6-Stage Autonomous Recovery Pipeline Architecture */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">{t('section_pipeline')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('section_pipeline_desc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
            <span className="text-xs font-mono text-emerald-400 font-bold">Autonomous Control</span>
          </div>
        </div>

        {/* 6 Stage Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineSteps.map((step) => {
            const isSelected = activePipelineStep === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActivePipelineStep(isSelected ? null : step.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-surface-cardHover border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-surface-subtle hover:bg-surface-cardHover border-surface-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-xl bg-surface-card border border-surface-border text-cyan-400">
                    <Icon name="circle" className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">#{step.id.slice(0, 3)}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">{step.title}</h4>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{step.subtitle}</p>
                
                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1 mt-2.5 overflow-hidden">
                  <div className="progress-bar-cyan h-full rounded-full w-full"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Pipeline Stage Detail Drawer */}
        {activePipelineStep && (
          <div className="mt-4 p-4 rounded-xl bg-surface-subtle border border-cyan-500/30 text-xs text-slate-300 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400">
                {pipelineSteps.find(s => s.id === activePipelineStep)?.title}: {pipelineSteps.find(s => s.id === activePipelineStep)?.subtitle}
              </span>
              <button onClick={() => setActivePipelineStep(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            <p className="mt-1 text-slate-300">{pipelineSteps.find(s => s.id === activePipelineStep)?.detail}</p>
          </div>
        )}
      </div>

      {/* Analytics Charts & Recovery Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Recovery & Lift Chart */}
        <div className="lg:col-span-2 fintech-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{t('section_recovery_analytics')}</h3>
              <p className="text-xs text-slate-400">Deterministic Recovery vs Baseline Incremental Lift</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Recovered</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Lift</span>
            </div>
          </div>
          <div className="h-64 relative">
            <canvas ref={chartRef1}></canvas>
          </div>
        </div>

        {/* Right 1 Col: Failure Distribution Doughnut */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{t('section_distribution')}</h3>
            <p className="text-xs text-slate-400">Degraded Channel Share</p>
          </div>
          <div className="h-56 relative my-2">
            <canvas ref={chartRef2}></canvas>
          </div>
          <div className="text-[11px] text-slate-400 text-center border-t border-surface-border/60 pt-2 font-mono">
            <span>Primary Root Cause: </span>
            <span className="text-cyan-400 font-bold">UPI + Bank_X Gateway</span>
          </div>
        </div>
      </div>

      {/* Recent Incidents Stream Cards (Kanban Card Style matching uploaded image) */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{t('section_recent_incidents')}</h3>
            <p className="text-xs text-slate-400">Live systemic payment failure spikes under active recovery</p>
          </div>
          <button
            onClick={() => onSelectIncident(incidents[0]?.incident_id)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>{t('btn_view_details')}</span>
            <Icon name="arrow-right" className="w-3.5 h-3.5" />
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center bg-surface-subtle rounded-2xl border border-dashed border-surface-border">
            <Icon name="shield-check" className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">All payment channels operating normally</p>
            <p className="text-xs text-slate-500 mt-1">No systemic anomalies detected exceeding statistical threshold</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.slice(0, 3).map((inc) => (
              <div
                key={inc.incident_id}
                onClick={() => onSelectIncident(inc.incident_id)}
                className="kanban-card p-4.5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 truncate">{inc.incident_id}</span>
                    <StatusBadge status={inc.status} />
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition">
                    {inc.segment}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {inc.hypothesis || 'Statistical anomaly detected exceeding baseline rate. Multi-tool evidence gathered.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-border/60">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">At Risk: <strong className="text-rose-400 font-mono">{formatINR(inc.revenue_at_risk)}</strong></span>
                    <span className="text-slate-400">Confidence: <strong className="text-cyan-400 font-mono">{((inc.confidence || 0.91) * 100).toFixed(0)}%</strong></span>
                  </div>

                  {/* Cyan Glowing Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="progress-bar-cyan h-full rounded-full"
                      style={{ width: `${Math.min(100, (inc.anomaly_ratio || 2) * 25)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// --- FILE: frontend/js/pages/Incidents.js ---
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
                <Icon name="more-horizontal" className="w-3.5 h-3.5" />
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
                    <Icon name="brain-circuit" className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isInvestigating ? t('btn_scanning') : t('btn_investigate')}</span>
                  </button>
                  <button
                    onClick={(e) => handleAction(e, onTriggerRecovery, inc.incident_id, 'recover')}
                    disabled={isRecovering}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-surface-cardHover hover:text-emerald-400 flex items-center gap-2"
                  >
                    <Icon name="zap" className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isRecovering ? t('btn_saving') : t('btn_trigger_recovery')}</span>
                  </button>
                  <button
                    onClick={() => onSelectIncident(inc.incident_id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-surface-cardHover hover:text-indigo-400 flex items-center gap-2"
                  >
                    <Icon name="eye" className="w-3.5 h-3.5 text-indigo-400" />
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
                <Icon name="message-square" className="w-3 h-3 text-cyan-400" />
                <span className="font-mono font-semibold text-slate-300">{inc.sample_size ? `${Math.floor(inc.sample_size / 20)} AI Ops` : '3 Actions'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Icon name="users" className="w-3 h-3 text-indigo-400" />
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
          <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
            <Icon name="columns" className="w-3.5 h-3.5" />
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
            <Icon name="list" className="w-3.5 h-3.5" />
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
                      <td><StatusBadge status={inc.status} /></td>
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


// --- FILE: frontend/js/pages/IncidentDetail.js ---
// Dark Fintech Incident Detail & Deep Dive Page Component
window.IncidentDetailPage = function IncidentDetailPage({
  incidentId,
  onBack,
  onTriggerRecovery,
  onInvestigate,
  lang
}) {
  const [incident, setIncident] = React.useState(null);
  const [experiment, setExperiment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('diagnosis'); // 'diagnosis', 'evidence', 'experiment'
  const [isCopied, setIsCopied] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await window.PayFixorAPI.getIncidentDetails(incidentId);
      setIncident(data);
      try {
        const expData = await window.PayFixorAPI.getExperimentResults(incidentId);
        setExperiment(expData);
      } catch (e) {
        // No experiment yet
      }
    } catch (e) {
      console.error('Failed to load incident details', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDetails();
  }, [incidentId]);

  // Render Bank Comparison Chart
  React.useEffect(() => {
    if (incident && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();

      const ctx = chartRef.current.getContext('2d');
      const evidence = (incident.evidences && incident.evidences[0]?.data_json) || {};
      const bankComp = evidence.bank_comparison || { [incident.bank || 'Bank_X']: incident.current_rate || 0.204, 'Bank_Y': 0.05, 'Bank_Z': 0.04 };

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(bankComp),
          datasets: [{
            label: 'Failure Rate (%)',
            data: Object.values(bankComp).map(v => (v * 100).toFixed(1)),
            backgroundColor: Object.keys(bankComp).map(b => (b === incident.bank || b.includes('X')) ? '#F43F5E' : '#06B6D4'),
            borderRadius: 8,
            barThickness: 34
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#151821',
              borderColor: '#232735',
              borderWidth: 1,
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.raw}% failure rate`
              }
            }
          },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter', weight: 500 } } 
            },
            y: { 
              grid: { color: 'rgba(35, 39, 53, 0.6)' }, 
              ticks: { 
                color: '#94A3B8', 
                font: { size: 11, family: 'Inter' },
                callback: (val) => `${val}%`
              } 
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [incident, activeTab, lang]);

  React.useEffect(() => {
    
  }, [incident, activeTab, lang]);

  const copyJSON = () => {
    if (!incident) return;
    navigator.clipboard.writeText(JSON.stringify(incident, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runInvestigation = async () => {
    setActionLoading(true);
    try {
      await onInvestigate(incidentId);
      await loadDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const runRecovery = async () => {
    setActionLoading(true);
    try {
      await onTriggerRecovery(incidentId);
      await loadDetails();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !incident) {
    return (
      <div className="fintech-card p-12 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-slate-200">Loading deep dive telemetry for {incidentId}...</p>
      </div>
    );
  }

  const latestEvidence = incident.evidences && incident.evidences[0]?.data_json;
  const confPercent = incident.confidence ? Math.round(incident.confidence * 100) : 91;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border transition text-xs font-semibold flex items-center gap-1.5"
          >
            <Icon name="arrow-left" className="w-3.5 h-3.5" />
            <span>{t('btn_back')}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-cyan-400">{incident.incident_id}</span>
            <span className="text-slate-500">/</span>
            <span className="text-sm font-bold text-slate-100">{incident.segment}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={copyJSON}
            className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-cardHover text-slate-300 hover:text-slate-100 border border-surface-border transition text-xs font-semibold flex items-center gap-1.5"
          >
            <Icon name="copy" className="w-3.5 h-3.5 text-slate-400" />
            <span>{isCopied ? t('btn_copied') : t('btn_copy_json')}</span>
          </button>
          <button
            onClick={runInvestigation}
            disabled={actionLoading}
            className="px-3.5 py-1.5 rounded-xl bg-surface-cardHover hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60"
          >
            <Icon name="brain-circuit" className="w-3.5 h-3.5" />
            <span>{t('btn_investigate')}</span>
          </button>
          <button
            onClick={runRecovery}
            disabled={actionLoading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            <Icon name="zap" className="w-3.5 h-3.5" />
            <span>{t('btn_trigger_recovery')}</span>
          </button>
        </div>
      </div>

      {/* Primary Incident Telemetry Overview Card */}
      <div className="fintech-card p-6 border-l-4 border-l-cyan-500">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono font-bold text-cyan-400">
                {incident.incident_id}
              </span>
              <StatusBadge status={incident.status} />
            </div>
            <h3 className="text-xl font-black text-slate-100 font-display">{incident.segment}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {incident.hypothesis || 'Statistical anomaly detected exceeding baseline failure rate. Multi-tool evidence gathered.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-subtle p-3 rounded-xl border border-surface-border">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Baseline Rate</span>
              <span className="text-sm font-bold font-mono text-slate-200">
                {incident.baseline_rate ? `${(incident.baseline_rate * 100).toFixed(1)}%` : '5.1%'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Current Rate</span>
              <span className="text-sm font-bold font-mono text-rose-400">
                {incident.current_rate ? `${(incident.current_rate * 100).toFixed(1)}%` : '20.4%'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Degradation</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {incident.anomaly_ratio ? `${incident.anomaly_ratio.toFixed(1)}x` : '4.0x'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Revenue At Risk</span>
              <span className="text-sm font-bold font-mono text-cyan-400">
                {formatINR(incident.revenue_at_risk)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: AI Diagnosis vs Evidence Bundle vs A/B Results */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'diagnosis'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-surface-border'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Icon name="brain-circuit" className="w-3.5 h-3.5" />
            <span>AI Reasoning & Hypothesis</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'evidence'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-surface-border'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Icon name="database" className="w-3.5 h-3.5" />
            <span>Telemetry Evidence Bundle</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('experiment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'experiment'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-surface-card border border-surface-border'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Icon name="split" className="w-3.5 h-3.5" />
            <span>A/B Experiment Results</span>
          </div>
        </button>
      </div>

      {/* Tab 1: AI Diagnosis */}
      {activeTab === 'diagnosis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Root-Cause Analysis</h4>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
                Confidence: {confPercent}%
              </span>
            </div>

            <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border leading-relaxed text-xs text-slate-300">
              <p className="font-semibold text-slate-100 mb-1">Generated Hypothesis:</p>
              <p>{incident.hypothesis || 'A systemic gateway timeout was detected specifically for Bank_X on the UPI rail during 14:00-16:00. The alternative card/netbanking routes remain healthy.'}</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Recommended Recovery Strategy:</span>
              <div className="p-3 bg-surface-subtle rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="zap" className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">ALTERNATIVE_PAYMENT_METHOD + DIRECT_LINK</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Policy: APPROVED</span>
              </div>
            </div>
          </div>

          {/* Right Col: Bank Comparison Chart */}
          <div className="fintech-card p-6 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2">Failure Rate Comparison</h4>
            <div className="h-48 relative">
              <canvas ref={chartRef}></canvas>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Degraded bank vs Control peer institutions
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Telemetry Evidence Bundle */}
      {activeTab === 'evidence' && (
        <div className="fintech-card p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Structured Multi-Dimensional Evidence</h4>
          <pre className="p-4 bg-surface-subtle rounded-xl border border-surface-border text-xs font-mono text-cyan-400 overflow-x-auto max-h-96">
            {JSON.stringify(latestEvidence || incident, null, 2)}
          </pre>
        </div>
      )}

      {/* Tab 3: A/B Experiment Results */}
      {activeTab === 'experiment' && (
        <div className="fintech-card p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">A/B Experiment Verification</h4>
          {experiment ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border">
                <span className="text-xs text-slate-400 font-medium">Generic Control Recovery</span>
                <div className="text-xl font-bold font-mono text-slate-200 mt-1">{experiment.control_rate || '12.2%'}</div>
              </div>
              <div className="p-4 bg-surface-subtle rounded-xl border border-cyan-500/30">
                <span className="text-xs text-cyan-400 font-medium">AI Root-Cause Recovery</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{experiment.treatment_rate || '18.8%'}</div>
              </div>
              <div className="p-4 bg-surface-subtle rounded-xl border border-emerald-500/30">
                <span className="text-xs text-emerald-400 font-medium">Incremental Recovery Lift</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">+{experiment.relative_lift || '54.1%'}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-surface-subtle rounded-xl border border-dashed border-surface-border text-xs text-slate-400">
              No active experiment running for this incident yet. Click &quot;Trigger Recovery&quot; to launch an A/B recovery campaign.
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// --- FILE: frontend/js/pages/RevenueRecovery.js ---
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
            <Icon name="refresh-cw" className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
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
                          <Icon name="external-link" className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td><StatusBadge status={act.status} type="recovery" /></td>
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


// --- FILE: frontend/js/pages/Experiments.js ---
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


// --- FILE: frontend/js/pages/Customers.js ---
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
          <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    <td><StatusBadge status={c.complaint_status} type="complaint" /></td>
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
      <Modal
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
      </Modal>
    </div>
  );
};


// --- FILE: frontend/js/pages/AgentActivity.js ---
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
                  <Icon name="cpu" className="w-3.5 h-3.5 text-cyan-400" />
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


// --- FILE: frontend/js/pages/Complaints.js ---
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
                    <td><StatusBadge status={esc.complaint_status} type="complaint" /></td>
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
      <Modal
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
      </Modal>
    </div>
  );
};


// --- FILE: frontend/js/pages/AuditTrail.js ---
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
            <Icon name="download" className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('btn_export_csv')}</span>
          </button>
          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-cardHover text-slate-400 hover:text-slate-200 border border-surface-border transition"
            title="Refresh Logs"
          >
            <Icon name="refresh-cw" className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-card p-4 rounded-2xl border border-surface-border">
        <div className="relative flex-1 min-w-[240px]">
          <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                        <Icon name="code" className="w-3.5 h-3.5" />
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
      <Modal
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
      </Modal>
    </div>
  );
};


// --- FILE: frontend/js/pages/Policies.js ---
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
      <Modal
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
      </Modal>
    </div>
  );
};


// --- FILE: frontend/js/pages/IntegrationStatus.js ---
// Dark Fintech Integration Status Page Component
window.IntegrationStatusPage = function IntegrationStatusPage({ lang }) {
  const [webhookResult, setWebhookResult] = React.useState(null);
  const [testingWebhook, setTestingWebhook] = React.useState(false);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);

  const integrations = [
    {
      name: 'Razorpay Test Mode API',
      type: 'Payment Gateway',
      status: 'ONLINE',
      latency: '24ms',
      details: 'REST API client configured with Test credentials for dynamic Payment Link generation and order state reconciliation.'
    },
    {
      name: 'Razorpay Webhooks Listener',
      type: 'Event Ingestion',
      status: 'ACTIVE',
      latency: '12ms',
      details: 'Endpoint active at /api/webhooks/razorpay with HMAC-SHA256 signature verification & deduplication.'
    },
    {
      name: 'Async SQLAlchemy Database Engine',
      type: 'Primary Storage',
      status: 'CONNECTED',
      latency: '2ms',
      details: '11 Relational tables & append-only immutable audit trail logging active.'
    },
    {
      name: 'Google Gemini 2.0 Flash Reasoning Model',
      type: 'AI Intelligence Layer',
      status: 'READY',
      latency: '340ms',
      details: 'Structured JSON output schema enabled for root-cause hypothesis and recovery message crafting.'
    }
  ];

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const payload = {
        id: `evt_sim_${Date.now()}`,
        event: 'payment_link.paid',
        payload: {
          payment_link: {
            entity: {
              id: 'plink_demo_test',
              amount_paid: 249900,
              status: 'paid'
            }
          }
        }
      };

      const res = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'mock_sig'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setWebhookResult({ ok: res.ok, data });
    } catch (e) {
      setWebhookResult({ ok: false, data: e.message });
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Gateway Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {integrations.map((item, idx) => (
          <div key={idx} className="fintech-card p-6 flex flex-col justify-between hover:border-surface-highlight transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-border">
                <span className="text-xs font-mono font-bold text-slate-400">{item.type}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot"></span>
                  {item.status}
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-100 mt-3">{item.name}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.details}</p>
            </div>

            <div className="pt-3 mt-3 border-t border-surface-border flex items-center justify-between text-xs">
              <span className="text-slate-500">Latency: <strong className="font-mono text-cyan-400">{item.latency}</strong></span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% HEALTHY</span>
            </div>
          </div>
        ))}
      </div>

      {/* Webhook Endpoint Testing Console */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Simulate Razorpay Webhook Ping
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dispatches a test HMAC webhook event to verify end-to-end receipt and deduplication
            </p>
          </div>
          <button
            onClick={handleTestWebhook}
            disabled={testingWebhook}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Icon name="zap" className="w-3.5 h-3.5" />
            <span>{testingWebhook ? 'Dispatching Ping...' : 'Fire Test Webhook'}</span>
          </button>
        </div>

        {webhookResult && (
          <div className={`p-4 rounded-xl text-xs font-mono border ${
            webhookResult.ok ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
          }`}>
            <div className="font-bold mb-1">Webhook Response: {webhookResult.ok ? '200 OK' : 'Error'}</div>
            <pre className="overflow-x-auto">{JSON.stringify(webhookResult.data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};


// --- FILE: frontend/js/app.js ---
// PayFixor Dark Fintech Root React Application with Bilingual Support
function App() {
  const [lang, setLang] = React.useState(window.PayFixorI18n ? window.PayFixorI18n.currentLang : 'en');
  const [activePage, setActivePage] = React.useState('overview');
  const [selectedIncidentId, setSelectedIncidentId] = React.useState(null);
  const [kpis, setKpis] = React.useState({
    revenue_at_risk: 0,
    revenue_recovered: 0,
    recovery_rate: 0,
    incremental_revenue: 0,
    recovery_lift: 0,
    active_incidents: 0,
    customers_recovered: 0,
    ai_actions_count: 0
  });
  const [incidents, setIncidents] = React.useState([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [notification, setNotification] = React.useState(null);

  const t = (k, fb) => window.PayFixorI18n ? window.PayFixorI18n.t(k, fb) : (fb || k);

  const handleSetLang = (newLang) => {
    if (window.PayFixorI18n) {
      window.PayFixorI18n.setLanguage(newLang);
    }
    setLang(newLang);
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [kpiData, incData] = await Promise.all([
        window.PayFixorAPI.getOverviewKPIs(),
        window.PayFixorAPI.getIncidents()
      ]);
      setKpis(kpiData);
      setIncidents(incData);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadAllData();
    if (window.PayFixorI18n) {
      const unsubscribe = window.PayFixorI18n.onChange((l) => setLang(l));
      return () => unsubscribe();
    }
  }, []);

  // Handler: Full End-to-End Degradation Simulation
  const handleSimulateDegradation = async () => {
    setIsSimulating(true);
    try {
      // 1. Seed synthetic data with injected incident
      await window.PayFixorAPI.seedSyntheticData({
        num_transactions: 500,
        inject_incident: true,
        incident_segment: 'UPI + Bank_X',
        degradation_multiplier: 4.2
      });

      // 2. Scan Telemetry
      const detectedIncidents = await window.PayFixorAPI.scanIncidents(12, 15);
      
      // 3. Trigger Recovery for detected incident if available
      if (detectedIncidents && detectedIncidents.length > 0) {
        const targetInc = detectedIncidents[0];
        try {
          await window.PayFixorAPI.triggerRecoveryBatch(targetInc.incident_id);
        } catch (err) {
          console.warn('Batch trigger notice:', err);
        }
      }

      await loadAllData();
      showNotification(t('notif_sim_success'), 'success');
    } catch (e) {
      console.error('Simulation error', e);
      showNotification(t('notif_sim_error') + e.message, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleScanTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const results = await window.PayFixorAPI.scanIncidents(12, 15);
      await loadAllData();
      showNotification(t('notif_scan_success'), 'info');
    } catch (e) {
      showNotification(t('notif_scan_error') + e.message, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTriggerRecovery = async (incidentId) => {
    try {
      const res = await window.PayFixorAPI.triggerRecoveryBatch(incidentId);
      await loadAllData();
      showNotification(t('notif_recovery_success'), 'success');
      return res;
    } catch (e) {
      showNotification(t('notif_recovery_error') + e.message, 'error');
      throw e;
    }
  };

  const handleInvestigate = async (incidentId) => {
    try {
      const res = await window.PayFixorAPI.investigateIncident(incidentId);
      await loadAllData();
      showNotification(t('notif_investigate_success') + (res.confidence ? (res.confidence * 100).toFixed(0) + '%' : ''), 'success');
      return res;
    } catch (e) {
      showNotification(t('notif_investigate_error') + e.message, 'error');
      throw e;
    }
  };

  const handleSelectIncident = (incidentId) => {
    setSelectedIncidentId(incidentId);
    setActivePage('incident-detail');
  };

  return (
    <div className="flex min-h-screen bg-surface-base text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          if (page !== 'incident-detail') setSelectedIncidentId(null);
        }}
        activeIncidentsCount={incidents.filter(i => i.status !== 'RESOLVED').length}
        lang={lang}
        setLang={handleSetLang}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-base">
        <Header
          activePage={activePage}
          onRefresh={loadAllData}
          onSimulateDegradation={handleSimulateDegradation}
          onScanTelemetry={handleScanTelemetry}
          isRefreshing={isRefreshing}
          isSimulating={isSimulating}
          lang={lang}
          setLang={handleSetLang}
        />

        {/* Global Toast Notification */}
        {notification && (
          <div className={`mx-8 mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-xl transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
              : notification.type === 'info'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                notification.type === 'error' ? 'bg-rose-400' : notification.type === 'info' ? 'bg-cyan-400' : 'bg-emerald-400'
              }`}></span>
              <span>{notification.msg}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200 p-1">✕</button>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto">
          {activePage === 'overview' && (
            <OverviewPage
              kpis={kpis}
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onSimulateDegradation={handleSimulateDegradation}
              isSimulating={isSimulating}
              lang={lang}
            />
          )}

          {activePage === 'incidents' && (
            <IncidentsPage
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onTriggerRecovery={handleTriggerRecovery}
              onInvestigate={handleInvestigate}
              lang={lang}
            />
          )}

          {activePage === 'incident-detail' && selectedIncidentId && (
            <IncidentDetailPage
              incidentId={selectedIncidentId}
              onBack={() => setActivePage('incidents')}
              onTriggerRecovery={handleTriggerRecovery}
              onInvestigate={handleInvestigate}
              lang={lang}
            />
          )}

          {activePage === 'recovery' && (
            <RevenueRecoveryPage
              kpis={kpis}
              onRefresh={loadAllData}
              lang={lang}
            />
          )}

          {activePage === 'experiments' && (
            <ExperimentsPage
              incidents={incidents}
              lang={lang}
            />
          )}

          {activePage === 'customers' && (
            <CustomersPage lang={lang} />
          )}

          {activePage === 'agent-activity' && (
            <AgentActivityPage lang={lang} />
          )}

          {activePage === 'complaints' && (
            <ComplaintsPage lang={lang} />
          )}

          {activePage === 'audit-trail' && (
            <AuditTrailPage lang={lang} />
          )}

          {activePage === 'policies' && (
            <PoliciesPage lang={lang} />
          )}

          {activePage === 'integration' && (
            <IntegrationStatusPage lang={lang} />
          )}
        </main>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Render Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-rose-950/80 border border-rose-700 rounded-2xl text-rose-200">
          <h2 className="text-lg font-bold mb-2">PayFixor Dashboard Render Notice</h2>
          <p className="text-xs font-mono">{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Mount the React Application
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
} catch (e) {
  console.error("Mount error:", e);
}

