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

  const handleSimulateDegradation = async () => {
    setIsSimulating(true);
    try {
      await window.PayFixorAPI.seedSyntheticData({
        num_transactions: 500,
        inject_incident: true,
        incident_segment: 'UPI + Bank_X',
        degradation_multiplier: 4.2
      });

      const detectedIncidents = await window.PayFixorAPI.scanIncidents(12, 15);
      
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
      <window.Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          if (page !== 'incident-detail') setSelectedIncidentId(null);
        }}
        activeIncidentsCount={incidents.filter(i => i.status !== 'RESOLVED').length}
        lang={lang}
        setLang={handleSetLang}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-surface-base">
        <window.Header
          activePage={activePage}
          onRefresh={loadAllData}
          onSimulateDegradation={handleSimulateDegradation}
          onScanTelemetry={handleScanTelemetry}
          isRefreshing={isRefreshing}
          isSimulating={isSimulating}
          lang={lang}
          setLang={handleSetLang}
        />

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
            <window.OverviewPage
              kpis={kpis}
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onSimulateDegradation={handleSimulateDegradation}
              isSimulating={isSimulating}
              lang={lang}
            />
          )}

          {activePage === 'incidents' && (
            <window.IncidentsPage
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onTriggerRecovery={handleTriggerRecovery}
              onInvestigate={handleInvestigate}
              lang={lang}
            />
          )}

          {activePage === 'incident-detail' && selectedIncidentId && (
            <window.IncidentDetailPage
              incidentId={selectedIncidentId}
              onBack={() => setActivePage('incidents')}
              onTriggerRecovery={handleTriggerRecovery}
              onInvestigate={handleInvestigate}
              lang={lang}
            />
          )}

          {activePage === 'recovery' && (
            <window.RevenueRecoveryPage
              kpis={kpis}
              onRefresh={loadAllData}
              lang={lang}
            />
          )}

          {activePage === 'experiments' && (
            <window.ExperimentsPage
              incidents={incidents}
              lang={lang}
            />
          )}

          {activePage === 'customers' && (
            <window.CustomersPage lang={lang} />
          )}

          {activePage === 'agent-activity' && (
            <window.AgentActivityPage lang={lang} />
          )}

          {activePage === 'complaints' && (
            <window.ComplaintsPage lang={lang} />
          )}

          {activePage === 'audit-trail' && (
            <window.AuditTrailPage lang={lang} />
          )}

          {activePage === 'policies' && (
            <window.PoliciesPage lang={lang} />
          )}

          {activePage === 'integration' && (
            <window.IntegrationStatusPage lang={lang} />
          )}
        </main>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
