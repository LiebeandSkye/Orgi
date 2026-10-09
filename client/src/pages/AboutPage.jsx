import { Card } from "../components/ui/Card";

export function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">About This Template</h1>
      <Card title="Team Guidelines">
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          This template is designed to keep frontend and backend concerns cleanly decoupled while following industry conventions.
        </p>
        <div className="space-y-2 text-sm text-slate-400">
          <p>• <strong>Client:</strong> React 19 + Vite + Tailwind CSS v4 + React Router v7 + Axios</p>
          <p>• <strong>Server:</strong> Express (ES modules) + CORS + Dotenv + MVC (Routes &amp; Controllers)</p>
        </div>
      </Card>
    </div>
  );
}
