import { useEffect, useState } from 'react'
import api from './api'
import supabase from './supabase'
import Analytics from './components/Analytics.jsx' 
import AdminDashboard from './components/AdminDashboard.jsx'
import ApplicationCard from './ApplicationCard';

// suitability score ring
const MatchRing = ({ score }) => {
  const safeScore = Math.min(Math.max(score || 0, 0), 100);
  
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  const getColorClass = () => {
    if (safeScore >= 70) return 'text-emerald-500';
    if (safeScore >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="relative flex items-center justify-center w-12 h-12 flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90">

        {/* background*/}
        <circle 
          cx="24" cy="24" r={radius} 
          stroke="currentColor" strokeWidth="3.5" 
          fill="transparent" 
          className="text-slate-100" 
        />
        {/* progress ring */}
        <circle
          cx="24" cy="24" r={radius} 
          stroke="currentColor" strokeWidth="3.5" 
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColorClass()}`}
          style={{ filter: `drop-shadow(0 0 2px currentColor)` }}
        />
      </svg>
      {/* percentage*/}
      <span className="absolute text-[9px] font-black text-slate-700 tracking-tighter">
        {Math.round(safeScore)}%
      </span>
    </div>
  )
}

function App() {
  const [applications, setApplications] = useState([])
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState({ skills: '', experience: '' })
  const [parseError, setParseError] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [jobText, setJobText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    company: '', role: '', status: 'applied', job_url: '', notes: '',
    match_score: null, pros: [], cons: []
  })

  // Auth & Data Loading
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      api.get('/applications').then(res => setApplications(res.data))
      api.get('/profile').then(res => { if (res.data) setProfile(res.data) })
    }
  }, [session])

  // 3. Logic Handle
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleDelete = (id) => api.delete(`/applications/${id}`).then(() => setApplications(applications.filter(app => app.id !== id)))
  const handleEdit = (app) => {
    setEditingId(app.id);
    setForm({ ...app, job_url: app.job_url || '', notes: app.notes || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleParse() {
    if (!jobText) return;
    setIsParsing(true);
    setParseError('');
    try {
      const res = await api.post('/parse-job', { text: jobText });
      setForm(prev => ({
        ...prev,
        company: res.data.company || '',
        role: res.data.role || '',
        notes: res.data.notes || '',
        match_score: res.data.match_score || null,
        pros: res.data.pros || [],
        cons: res.data.cons || [],
      }));
    } catch (err) {
      setParseError('Failed to parse. Check API connection.');
    } finally {
      setIsParsing(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.company || !form.role) return;
    const method = editingId ? 'patch' : 'post';
    const url = editingId ? `/applications/${editingId}` : '/applications';

    api[method](url, form).then(res => {
      if (editingId) {
        setApplications(applications.map(app => app.id === editingId ? res.data[0] : app));
      } else {
        setApplications([...applications, res.data[0]]);
      }
      setEditingId(null);
      setForm({ company: '', role: '', status: 'applied', job_url: '', notes: '', match_score: null, pros: [], cons: [] });
      setJobText('');
    })
  }

  // Conditional render for login (signed out, new users etc)
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-['DM_Sans']">
        <div className="bg-white rounded-3xl border border-gray-200 p-10 max-w-sm w-full text-center shadow-xl">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-4">CD</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">CareerDrive</h1>
          <p className="text-sm text-gray-500 mb-8 font-medium">Your AI-Powered Job Pipeline</p>
          <button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // 5. Main App
return (
  <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 font-['DM_Sans']">
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 transition-transform group-hover:scale-110">CD</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">CareerDrive</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</p>
            <p className="text-sm font-bold text-slate-700">{session.user.email.split('@')[0]}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Sign Out</button>
        </div>
      </div>
    </nav>

    <main className="max-w-7xl mx-auto p-6 lg:p-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COL */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Momentum + Filter */}
          <section className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Application Momentum</p>
            <h3 className="text-2xl font-bold italic">Keep Up The Momentum.</h3>
            
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-tighter">
                  <span>Daily Goal</span>
                  <span>{applications.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length} / 5</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all duration-1000" 
                    style={{ width: `${Math.min((applications.length / 5) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2">
                <input 
                  type="text" 
                  placeholder="Filter by company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-xs placeholder:text-white/40 focus:bg-white/20 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Smart Import/Parser */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-800 uppercase tracking-widest">
              <span className="text-indigo-500">✨</span> {editingId ? 'Edit Entry' : 'Smart Import'}
            </h2>
            <textarea
              placeholder="Paste job description..."
              value={jobText} onChange={e => setJobText(e.target.value)}
              className="w-full h-32 p-4 text-sm bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none"
            />
            <button onClick={handleParse} disabled={isParsing} className="w-full mt-3 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg">
              {isParsing ? 'RailVision Processing...' : 'Auto-Fill with AI'}
            </button>
            {parseError && <p className="text-rose-500 text-[10px] mt-2 text-center font-bold">{parseError}</p>}
          </section>

          {/* Form Section (manual input and confirm) */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-none outline-none" />
                <input name="role" placeholder="Role" value={form.role} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-none outline-none" />
              </div>
              <select name="status" value={form.status} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-none font-bold outline-none capitalize">
                {['applied', 'interviewing', 'offered', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest">
                {editingId ? 'Save Changes' : 'Confirm Application'}
              </button>
            </form>
          </section>

          {/* user/applicant profile */}
          <section className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Engineer Profile</h2>
            <textarea
              placeholder="Your skills (e.g. React, Python, AWS)..."
              value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })}
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl mb-2 min-h-[80px] outline-none"
            />
            <button onClick={() => api.post('/profile', profile).then(() => setProfileSaved(true))} className="w-full py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black hover:bg-indigo-50 transition-all uppercase">
              Update Context
            </button>
          </section>
        </div>

        {/* RIGHT COL */}
        <div className="md:col-span-8 space-y-6">
          <section className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <Analytics applications={applications} />

            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
          </section>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-black text-slate-800 tracking-tight italic">Active Pipeline</h2>
              <div className="flex gap-2">
                {['all', 'interviewing', 'offered'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[550px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {applications
                .filter(app => app.company.toLowerCase().includes(searchTerm.toLowerCase()))
                .filter(app => filterStatus === 'all' || app.status === filterStatus)
                .length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-400">
                  <p className="font-bold tracking-tight">No matching applications found.</p>
                </div>
              ) : (
                applications
                  .filter(app => app.company.toLowerCase().includes(searchTerm.toLowerCase()))
                  .filter(app => filterStatus === 'all' || app.status === filterStatus)
                  .map(app => (
                    <ApplicationCard 
                      key={app.id} 
                      app={app} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                    />
                  ))
              )}
            </div>
          </div>

          {/* system oversight and LLM-Ops logging*/}
          <AdminDashboard />
        </div>
      </div>
    </main>
  </div>
)
}

export default App;