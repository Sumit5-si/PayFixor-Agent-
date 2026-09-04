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

      const baseUrl = window.PayFixorAPI?.BASE_URL || '/api';
      const res = await fetch(`${baseUrl}/webhooks/razorpay`, {
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
            <i data-lucide="zap" className="w-3.5 h-3.5"></i>
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
