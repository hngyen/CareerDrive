function Analytics({ applications }) {
  const counts = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offered: applications.filter(a => a.status === 'offered').length,
  };

  // custom percentages
  const getWidth = (count) => counts.total > 0 ? (count / counts.total) * 100 : 0;

  return (
    <div className="relative z-10 font-['DM_Sans']">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Live Pipeline Analytics</h2>
          <p className="text-2xl font-bold text-white tracking-tight">Application Flow</p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Offer Rate</p>
          <p className="text-xl font-black text-emerald-400">
            {counts.total > 0 ? Math.round((counts.offered / counts.total) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* progress bar with application stats and tracking */}
      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex mb-8 border border-white/5">
        <div style={{ width: `${getWidth(counts.applied)}%` }} className="h-full bg-indigo-500 transition-all duration-1000" />
        <div style={{ width: `${getWidth(counts.interviewing)}%` }} className="h-full bg-amber-400 transition-all duration-1000" />
        <div style={{ width: `${getWidth(counts.offered)}%` }} className="h-full bg-emerald-500 transition-all duration-1000" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applied" value={counts.applied} color="bg-indigo-500" />
        <StatCard title="Interviews" value={counts.interviewing} color="bg-amber-400" />
        <StatCard title="Offers" value={counts.offered} color="bg-emerald-500" />
        <StatCard title="Total" value={counts.total} color="bg-slate-700" />
      </div>
    </div>
  );
}

const StatCard = ({ title, value, color }) => (
  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/[0.08] transition-colors">
    <div className="flex items-center gap-2 mb-1">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

export default Analytics