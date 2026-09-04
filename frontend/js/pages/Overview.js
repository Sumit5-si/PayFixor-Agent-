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
    if (window.lucide) window.lucide.createIcons();
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
        <window.KPICard
          title={t('kpi_revenue_at_risk')}
          value={formatINR(kpis.revenue_at_risk)}
          subtitle={t('kpi_sub_threat')}
          icon="alert-octagon"
          trend={`${kpis.active_incidents} Active`}
          trendType={kpis.active_incidents > 0 ? 'negative' : 'neutral'}
          color="rose"
          sparklineData={[10, 15, 25, 45, 60, 85, 70]}
        />
        <window.KPICard
          title={t('kpi_revenue_recovered')}
          value={formatINR(kpis.revenue_recovered)}
          subtitle={t('kpi_sub_verified')}
          icon="check-circle"
          trend={`${kpis.customers_recovered} Saved`}
          trendType="positive"
          color="emerald"
          sparklineData={[5, 12, 18, 30, 48, 65, 88]}
        />
        <window.KPICard
          title={t('kpi_recovery_rate')}
          value={`${(kpis.recovery_rate || 0).toFixed(1)}%`}
          subtitle={t('kpi_sub_conversion')}
          icon="percent"
          trend="Conversion"
          trendType="positive"
          color="cyan"
          sparklineData={[12, 14, 16, 18, 21, 24, 28]}
        />
        <window.KPICard
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
        <window.KPICard
          title={t('kpi_recovery_lift')}
          value={`+${(kpis.recovery_lift || 0).toFixed(1)}%`}
          subtitle={t('kpi_sub_relative')}
          icon="zap"
          color="cyan"
          sparklineData={[10, 14, 20, 28, 35, 44, 54]}
        />
        <window.KPICard
          title={t('kpi_active_incidents')}
          value={kpis.active_incidents}
          subtitle={t('kpi_sub_live')}
          icon="flame"
          trend={kpis.active_incidents > 0 ? 'Live Anomaly' : 'Stable'}
          trendType={kpis.active_incidents > 0 ? 'negative' : 'positive'}
          color="amber"
          sparklineData={[0, 1, 0, 2, 1, 3, kpis.active_incidents || 1]}
        />
        <window.KPICard
          title={t('kpi_customers_recovered')}
          value={kpis.customers_recovered}
          subtitle={t('kpi_sub_customers')}
          icon="user-check"
          trend="Settled"
          trendType="positive"
          color="emerald"
          sparklineData={[2, 6, 12, 18, 25, 34, 48]}
        />
        <window.KPICard
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
                    <i data-lucide={step.icon} className="w-4 h-4"></i>
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
            <i data-lucide="arrow-right" className="w-3.5 h-3.5"></i>
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center bg-surface-subtle rounded-2xl border border-dashed border-surface-border">
            <i data-lucide="shield-check" className="w-8 h-8 text-emerald-400 mx-auto mb-2"></i>
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
                    <window.StatusBadge status={inc.status} />
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
