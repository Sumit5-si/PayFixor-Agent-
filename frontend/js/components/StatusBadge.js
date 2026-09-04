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
