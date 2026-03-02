import React, { useState } from 'react';

/* match and suitability score ring */
const MatchRing = ({ score }) => {
  const safeScore = score === null || score === undefined ? 0 : (score <= 10 ? score * 10 : score);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12 flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
        <circle
          cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ${
            safeScore >= 70 ? 'text-emerald-500' : safeScore >= 40 ? 'text-amber-500' : 'text-rose-500'
          }`}
        />
      </svg>
      <span className="absolute text-[10px] font-black text-slate-700">{safeScore}%</span>
    </div>
  );
};

export default function ApplicationCard({ app, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`group bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${
        isExpanded ? 'border-indigo-400 shadow-xl ring-4 ring-indigo-50' : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      {/* header (always visible) */}
      <div 
        className="p-5 flex items-center gap-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <MatchRing score={app.match_score} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors tracking-tight text-lg">
                {app.company}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                {app.role}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                app.status === 'offered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                app.status === 'interviewing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                app.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                {app.status}
              </span>
              {/* Arrow Indicator */}
              <svg className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* expandable insights (only on click) */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 animate-slide-down border-t border-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-2xl">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-emerald-600 rounded-full"></span> AI Strength Analysis
              </h4>
              <ul className="space-y-2">
                {app.pros?.length > 0 ? app.pros.map((p, i) => (
                  <li key={i} className="text-xs text-slate-600 font-medium flex items-start gap-2">
                    <span className="text-emerald-500 font-bold tracking-tighter">✓</span> {p}
                  </li>
                )) : <li className="text-xs text-slate-400 italic">No strengths noted</li>}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-rose-500 rounded-full"></span> Missing Skills
              </h4>
              <ul className="space-y-2">
                {app.cons?.length > 0 ? app.cons.map((c, i) => (
                  <li key={i} className="text-xs text-slate-600 font-medium flex items-start gap-2">
                    <span className="text-rose-400 font-bold tracking-tighter">!</span> {c}
                  </li>
                )) : <li className="text-xs text-slate-400 italic">No major skill gaps</li>}
              </ul>
            </div>
          </div>

          {/* Actions inside expansion */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => onEdit(app)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
               Edit Application
            </button>
            <button onClick={() => onDelete(app.id)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100">
               Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}