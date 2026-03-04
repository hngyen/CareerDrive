import { useEffect, useState } from 'react';
import api from '../api';

const AdminDashboard = ({ isDemo = false, demoLogs = [] }) => {
  const [logs, setLogs] = useState(isDemo ? demoLogs : []);

  const fetchLogs = () => {
    if (isDemo) return;

    api.get('/parse-logs')
      .then(res => setLogs(res.data))
      .catch(err => console.error("Log fetch failed:", err));
  };

  // auto refresh every 30 seconds
  useEffect(() => {
    if (!isDemo) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 30000); 
      return () => clearInterval(interval);
    }
  }, [isDemo]);

  const totalCost = logs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0);
  const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
  const avgLatency = logs.length > 0
    ? (logs.reduce((sum, log) => sum + (log.latency_seconds || 0), 0) / logs.length).toFixed(2)
    : 0;

  // Calculate daily burn with trend
  const today = new Date().toDateString();
  const todayLogs = logs.filter(log => new Date(log.created_at).toDateString() === today);
  const todayBurn = todayLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0);
  const yesterday = new Date(Date.now() - 24*60*60*1000).toDateString();
  const yesterdayLogs = logs.filter(log => new Date(log.created_at).toDateString() === yesterday);
  const yesterdayBurn = yesterdayLogs.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0);
  const burnTrend = yesterdayBurn > 0 ? (((todayBurn - yesterdayBurn) / yesterdayBurn) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 font-['DM_Sans']">
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        
        {/* pulse for "live" */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">System Overview</h3>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>

        {/* metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatMini label="Avg Latency" value={`${avgLatency}s`} />
          <StatMini label="Total Tokens" value={totalTokens >= 1000 ? `${(totalTokens/1000).toFixed(1)}k` : totalTokens} />
          <StatMini label="Cost (USD)" value={`$${totalCost.toFixed(4)}`} color="text-emerald-600" />
          <StatMini label="Daily Burn" value={`$${todayBurn.toFixed(3)}`} color={burnTrend >= 0 ? "text-amber-600" : "text-emerald-600"} sub={`${burnTrend >= 0 ? '+' : ''}${burnTrend}%`} />
        </div>

        {/* scrollable table */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {/* header */}
          <table className="w-full text-left border-collapse font-['DM_Sans']">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Time (Sydney)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Tokens</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Latency</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
          </table>

          {/* body - responsive height */}
          <div className={`${logs.length > 8 ? 'max-h-[400px]' : ''} overflow-y-auto custom-scrollbar`}>
            <table className="w-full text-left border-collapse font-['DM_Sans']">
              <tbody className="divide-y divide-slate-50">
                {logs.length > 0 ? logs.map((log, idx) => {
                  const latencySeconds = log.latency_seconds || 0;
                  const getLatencyColor = () => {
                    if (latencySeconds < 1) return 'text-slate-500';
                    if (latencySeconds < 3) return 'text-amber-500';
                    return 'text-rose-500';
                  };
                  
                  return (
                    <tr key={`log-${log.id}-${idx}`} className="group hover:bg-slate-50/30 transition-colors">
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
                      <td className={`p-4 text-xs font-bold w-1/4 ${getLatencyColor()}`}>{latencySeconds.toFixed(2)}s</td>
                      <td className="p-4 text-right">
                        {/* glowing/pulsing animation */}
                        <div className={`inline-block w-3 h-3 rounded-full ${
log.success 
                          ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' 
                          : 'bg-rose-500 shadow-lg shadow-rose-500/50'
                        }`} style={{ animation: log.success ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="4" className="p-10 text-center text-xs text-slate-400 italic font-['DM_Sans']">Listening for events...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatMini = ({ label, value, color = "text-slate-700", sub }) => (
  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-end justify-between gap-2">
      <p className={`text-sm font-black ${color} tracking-tight`}>{value}</p>
      {sub && <p className={`text-[10px] font-black ${color}`}>{sub}</p>}
    </div>
  </div>
);

export default AdminDashboard;