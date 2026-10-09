import { useState, useEffect } from "react";

function App() {
  const [serverMsg, setServerMsg] = useState("Checking server status...");

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((res) => res.json())
      .then((data) => setServerMsg(data.message))
      .catch(() => setServerMsg("Server not reachable (run `npm run dev` in /server)"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-xl text-blue-400">
          <span className="text-3xl">🚀</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          React + Tailwind CSS + Express
        </h1>

        <p className="text-slate-400 text-sm">
          Standard boilerplate is ready to build your next fullstack application.
        </p>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 text-left">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            API Healthcheck
          </p>
          <p className="text-sm font-mono text-emerald-400 break-words">
            {serverMsg}
          </p>
        </div>

        <div className="pt-2 text-xs text-slate-500 space-y-1">
          <p>Client: <code className="text-slate-400">cd client &amp;&amp; npm run dev</code></p>
          <p>Server: <code className="text-slate-400">cd server &amp;&amp; npm run dev</code></p>
        </div>
      </div>
    </div>
  );
}

export default App;
