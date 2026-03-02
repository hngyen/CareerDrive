import { useEffect, useState } from 'react';
import api from '../api';

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);

  const fetchLogs = () => {
    api.get('/parse-logs')
      .then(res => setLogs(res.data))
      .catch(err => console.error("Log fetch failed:", err));
  };

  // auto refresh every 30 seconds
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); 
    return () => clearInterval(interval);
  }, []);

  const totalCost = logs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0);
  const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
  const avgLatency = logs.length > 0
    ? (logs.reduce((sum, log) => sum + (log.latency_seconds || 0), 0) / logs.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-6 font-['DM_Sans']">
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        
        {/* pulse for "live" */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">System Oversight</h3>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>

        {/* metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatMini label="Avg Latency" value={`${avgLatency}s`} />
          <StatMini label="Total Tokens" value={totalTokens >= 1000 ? `${(totalTokens/1000).toFixed(1)}k` : totalTokens} />
          <StatMini label="Cost (USD)" value={`$${totalCost.toFixed(4)}`} color="text-emerald-600" />
        </div>

        {/* SCROLLABLE TABLE */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {/* header */}
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Time (Sydney)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Tokens</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Latency</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
          </table>

          {/* body */}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-50">
                {logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-4 text-[11px] font-bold text-slate-500 w-1/3 tracking-tighter">
                      {(() => {
                        const raw = log.created_at;
                        const utcStr = raw.endsWith('Z') || raw.includes('+') ? raw : `${raw}Z`;
                        return new Date(utcStr).toLocaleTimeString('en-AU', { 
                          timeZone: 'Australia/Sydney',
                          hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true 
                        });
                      })()}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700 w-1/4">{log.total_tokens}</td>
                    <td className="p-4 text-xs font-medium text-slate-400 w-1/4">{log.latency_seconds?.toFixed(2)}s</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                        log.success ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {log.success ? 'OK' : 'ERR'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-10 text-center text-xs text-slate-400 italic">Listening for events...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for clean code
const StatMini = ({ label, value, color = "text-slate-700" }) => (
  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm font-black ${color} tracking-tight`}>{value}</p>
  </div>
);

export default AdminDashboard;