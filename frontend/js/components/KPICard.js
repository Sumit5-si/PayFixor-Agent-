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
    if (window.lucide) window.lucide.createIcons();
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
            <i data-lucide={icon} className="w-4 h-4"></i>
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
