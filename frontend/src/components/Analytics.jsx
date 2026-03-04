function Analytics({ applications, highlightedStat, setHighlightedStat }) {
  const counts = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offered: applications.filter(a => a.status === 'offered').length,
  };

  // custom percentages
  const getWidth = (count) => counts.total > 0 ? (count / counts.total) * 100 : 0;
  const offerRate = counts.total > 0 ? Math.round((counts.offered / counts.total) * 100) : 0;

  // guage offer rate
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offerOffset = circumference - (offerRate / 100) * circumference;

  return (
    <div className="relative z-10 font-['DM_Sans']" style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.02)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Live Pipeline Analytics</h2>
          <p className="text-2xl font-bold text-white tracking-tight">Application Flow</p>
        </div>
        {/* offer rate radial gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
            <circle
              cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offerOffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${offerRate >= 30 ? 'text-emerald-400' : offerRate >= 10 ? 'text-amber-400' : 'text-slate-500'}`}
              style={{ filter: `drop-shadow(0 0 4px currentColor)` }}
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-lg font-black text-emerald-400">{offerRate}%</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-widest">Offer Rate</div>
          </div>
        </div>
      </div>

      {/* progress bar with shimmer effect */}
      <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden flex mb-8 border border-white/5">
        <div style={{ width: `${getWidth(counts.applied)}%` }} className="h-full bg-indigo-500 transition-all duration-1000 relative" />
        <div style={{ width: `${getWidth(counts.interviewing)}%` }} className={`h-full transition-all duration-1000 relative ${highlightedStat === 'interviewing' ? 'bg-amber-400' : 'bg-amber-400/60'}`} />
        <div style={{ width: `${getWidth(counts.offered)}%` }} className={`h-full transition-all duration-1000 relative ${highlightedStat === 'offered' ? 'bg-emerald-500' : 'bg-emerald-500/60'}`} />
        <div className="shimmer-bar absolute inset-0" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applied" value={counts.applied} color="bg-indigo-500" stat="applied" highlighted={highlightedStat} setHighlightedStat={setHighlightedStat} />
        <StatCard title="Interviews" value={counts.interviewing} color="bg-amber-400" stat="interviewing" highlighted={highlightedStat} setHighlightedStat={setHighlightedStat} />
        <StatCard title="Offers" value={counts.offered} color="bg-emerald-500" stat="offered" highlighted={highlightedStat} setHighlightedStat={setHighlightedStat} />
        <StatCard title="Total" value={counts.total} color="bg-slate-700" stat="total" highlighted={highlightedStat} setHighlightedStat={setHighlightedStat} />
      </div>
    </div>
  );
}

const StatCard = ({ title, value, color, stat, highlighted, setHighlightedStat }) => (
  <div 
    className={`bg-white/5 border transition-all duration-200 p-4 rounded-2xl cursor-pointer ${
      highlighted === stat ? 'border-white/30 bg-white/[0.12] scale-105' : 'border-white/10 hover:bg-white/[0.08]'
    }`}
    onMouseEnter={() => setHighlightedStat(stat)}
    onMouseLeave={() => setHighlightedStat(null)}
  >
    <div className="flex items-center gap-2 mb-1">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

export default Analytics