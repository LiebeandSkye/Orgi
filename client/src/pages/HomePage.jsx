import { useState, useEffect } from "react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function HomePage() {
  const [health, setHealth] = useState({ loading: true, data: null, error: null });

  const checkHealth = async () => {
    setHealth({ loading: true, data: null, error: null });
    try {
      const res = await api.get("/health");
      setHealth({ loading: false, data: res, error: null });
    } catch (err) {
      setHealth({ loading: false, data: null, error: err.message });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Team Ready Boilerplate
        </h1>
        <p className="text-slate-400 text-base">
          Modular client-server template structured with components, contexts, routes, pages, and services.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card title="Backend Healthcheck" description="Calling GET /api/health through axios service">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700/60 font-mono text-sm mb-4">
            {health.loading && <span className="text-yellow-400">Pinging server...</span>}
            {health.error && <span className="text-rose-400">Failed: {health.error}</span>}
            {health.data && (
              <pre className="text-emerald-400 overflow-x-auto text-xs">
                {JSON.stringify(health.data, null, 2)}
              </pre>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={checkHealth}>
            Re-check Health
          </Button>
        </Card>

        <Card title="Project Structure" description="Organized folder conventions for scale">
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li><span className="font-semibold text-blue-400">src/components/ui</span>: Reusable atomic components</li>
            <li><span className="font-semibold text-blue-400">src/context</span>: Global state (Theme, Auth, etc.)</li>
            <li><span className="font-semibold text-blue-400">src/pages</span>: View screens mounted to routes</li>
            <li><span className="font-semibold text-blue-400">src/routes</span>: App routing configuration</li>
            <li><span className="font-semibold text-blue-400">src/services</span>: Centralized API / Axios client</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
