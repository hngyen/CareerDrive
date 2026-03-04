import { useEffect, useState } from 'react'
import api from './api'
import supabase from './supabase'
import Analytics from './components/Analytics.jsx' 
import AdminDashboard from './components/AdminDashboard.jsx'
import ApplicationCard from './ApplicationCard';

// CSS animations
const styles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slideup {
    animation: slideUp 0.5s ease-out forwards;
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .shimmer-bar {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 1000px 100%;
    animation: shimmer 3s infinite;
  }

  @keyframes glowBorder {
    0%, 100% { 
      box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(99, 102, 241, 0.05);
    }
    50% { 
      box-shadow: 0 0 20px 1px rgba(99, 102, 241, 0.6), inset 0 0 30px rgba(99, 102, 241, 0.15);
    }
  }
  
  .animate-glow-border {
    animation: glowBorder 3s ease-in-out infinite;
  }
`;

// dummy data for demo mode
const DEMO_APPLICATIONS = [
  { id: 1, company: 'Google', role: 'Software Engineer', status: 'interviewing', job_url: '', notes: 'Pending second round', match_score: 85, pros: ['Strong system design', 'Good DSA skills'], cons: ['Limited ML experience'], created_at: '2026-03-02T10:30:00.000Z' },
  { id: 2, company: 'Microsoft', role: 'Frontend Developer', status: 'offered', job_url: '', notes: 'Offer extended', match_score: 92, pros: ['React expert', 'UI/UX knowledge'], cons: [], created_at: '2025-02-27T14:45:00.000Z' },
  { id: 3, company: 'Amazon', role: 'Backend Engineer', status: 'applied', job_url: '', notes: 'Application submitted', match_score: 72, pros: ['Cloud experience'], cons: ['Limited AWS hands-on'], created_at: '2026-03-03T09:15:00.000Z' },
  { id: 4, company: 'Meta', role: 'Full Stack Engineer', status: 'rejected', job_url: '', notes: 'Not selected', match_score: 58, pros: ['Problem solving'], cons: ['Weak TypeScript', 'Limited distributed systems'], created_at: '2025-02-25T11:20:00.000Z' },
  { id: 5, company: 'Apple', role: 'iOS Developer', status: 'interviewing', job_url: '', notes: 'Waiting for final round', match_score: 78, pros: ['Swift proficient', 'App design'], cons: ['Limited SwiftUI'], created_at: '2026-03-01T16:00:00.000Z' },
  { id: 6, company: 'Tesla', role: 'ML Engineer', status: 'applied', job_url: '', notes: 'Under review', match_score: 68, pros: ['Python strong', 'ML theory'], cons: ['Limited production ML', 'No CV experience'], created_at: '2026-03-04T08:30:00.000Z' },
  { id: 7, company: 'Atlassian', role: 'Product Engineer', status: 'interviewing', job_url: '', notes: 'Technical screen passed', match_score: 88, pros: ['Collaboration tools exp', 'React/Node focus'], cons: ['Jira API unfamiliarity'], created_at: '2026-03-01T09:00:00.000Z' },
  { id: 8, company: 'Canva', role: 'Graphic Engineer', status: 'applied', job_url: '', notes: 'Applied via referral', match_score: 81, pros: ['WebGL knowledge', 'Canvas API'], cons: ['Low experience in Rust'], created_at: '2026-03-03T11:20:00.000Z' },
  { id: 9, company: 'Netflix', role: 'Senior Platform Engineer', status: 'rejected', job_at: '', notes: 'Resume screen failed', match_score: 64, pros: ['Microservices expert'], cons: ['Needs more high-scale ops'], created_at: '2026-02-20T15:10:00.000Z' },
  { id: 10, company: 'Airbnb', role: 'Full Stack Developer', status: 'offered', job_url: '', notes: 'Negotiating salary', match_score: 95, pros: ['GraphQL master', 'Design systems'], cons: [], created_at: '2026-02-28T13:00:00.000Z' },
  { id: 11, company: 'Uber', role: 'Infrastructure Engineer', status: 'interviewing', job_url: '', notes: 'System design next week', match_score: 77, pros: ['Docker/K8s skills'], cons: ['Limited Go experience'], created_at: '2026-03-04T12:00:00.000Z' }
]

const DEMO_PROFILE = { skills: 'Python, JavaScript, React, Node.js, SQL, MongoDB, Docker, AWS, Git. Strong in algorithms and system design. Background in full-stack web development with 3+ years experience.' };

const DEMO_LOGS = [
  { id: 1, total_tokens: 1250, latency_seconds: 0.85, estimated_cost_usd: 0.0015, success: true, created_at: '2026-03-04T11:55:00.000Z' },
  { id: 2, total_tokens: 2100, latency_seconds: 1.2, estimated_cost_usd: 0.0032, success: true, created_at: '2026-03-04T11:50:00.000Z' },
  { id: 3, total_tokens: 890, latency_seconds: 4.5, estimated_cost_usd: 0.0011, success: false, created_at: '2026-03-04T11:45:00.000Z' },
  { id: 4, total_tokens: 1850, latency_seconds: 0.92, estimated_cost_usd: 0.0028, success: true, created_at: '2026-03-04T11:40:00.000Z' },
  { id: 5, total_tokens: 2300, latency_seconds: 1.5, estimated_cost_usd: 0.0035, success: true, created_at: '2026-03-04T11:27:30.000Z' },
  { id: 6, total_tokens: 4567, latency_seconds: 0.4, estimated_cost_usd: 0.0015, success: true, created_at: '2026-03-04T11:25:00.000Z' },
  { id: 7, total_tokens: 6767, latency_seconds: 1.8, estimated_cost_usd: 0.0095, success: true, created_at: '2026-03-04T11:25:48.000Z' },
  { id: 8, total_tokens: 500, latency_seconds: 5.4, estimated_cost_usd: 0.0011, success: false, created_at: '2026-03-04T11:23:02.000Z' },
  { id: 9, total_tokens: 345, latency_seconds: 0.87, estimated_cost_usd: 0.0022, success: false, created_at: '2026-03-04T11:11:00.000Z' },
  { id: 10, total_tokens: 2677, latency_seconds: 1.8, estimated_cost_usd: 0.0035, success: true, created_at: '2026-03-04T11:09:30.000Z' },
];

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
  const [isDemo, setIsDemo] = useState(false)
  const [profile, setProfile] = useState({ skills: '', experience: '' })
  const [profileUpdatedAt, setProfileUpdatedAt] = useState(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [parseError, setParseError] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [jobText, setJobText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dailyGoal, setDailyGoal] = useState(5);
  const [highlightedStat, setHighlightedStat] = useState(null);
  const [form, setForm] = useState({
    company: '', role: '', status: 'applied', job_url: '', notes: '',
    match_score: null, pros: [], cons: []
  })
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  // Auth & Data Loading
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      api.get('/applications').then(res => setApplications(res.data))
      api.get('/profile').then(res => { if (res.data) { setProfile(res.data); setProfileUpdatedAt(new Date()); } })
    }
    if (isDemo) {
      setApplications(DEMO_APPLICATIONS);
      setProfile(DEMO_PROFILE);
      setProfileUpdatedAt(new Date());
      // for demo mode, automatically load log mock updates periodically
      const interval = setInterval(() => {

        // Simulate new log arrivals
        setApplications(prev => [...prev]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [session, isDemo])

  const isProfileStale = profileUpdatedAt && new Date() - new Date(profileUpdatedAt) > 24 * 60 * 60 * 1000
  const todayApplications = applications.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length
  const dailyGoalMet = todayApplications >= dailyGoal

  // Logic Handle
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
      setParseError('AI Quota exceeded. Try again tomorrow!');
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

  // demo mode entry point
  const handleDemoMode = () => {
    setSession(null);
    setIsDemo(true);
  };

  // Conditional render for login (signed out, new users etc)
  if (!session && !isDemo) {
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
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">or try the</p>
            <button 
              onClick={handleDemoMode}
              className="w-full px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-sm font-bold text-white hover:from-slate-800 hover:to-slate-700 transition-all active:scale-95"
            >
              ✨ Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
  <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 font-['DM_Sans']">
    <style>{styles}</style>
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 transition-transform group-hover:scale-110">CD</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">CareerDrive</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</p>
            <p className="text-sm font-bold text-slate-700">{isDemo ? 'Demo User' : session?.user.email.split('@')[0]}</p>
          </div>
          <button onClick={() => isDemo ? setIsDemo(false) : supabase.auth.signOut()} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            {isDemo ? 'Exit Demo' : 'Sign Out'}
          </button>
        </div>
      </div>
    </nav>

    <main className="max-w-7xl mx-auto p-6 lg:p-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COL - Sidebar */}
        <div className="md:col-span-4 space-y-6 md:border-r md:border-slate-200/50 md:pr-6 sticky top-24 h-fit" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.4) 100%)', backdropFilter: 'blur(10px)' }}>
          
          {/* Momentum + Filter */}
          <section className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Application Momentum</p>
            <h3 className="text-2xl font-bold italic">Keep Up The Momentum.</h3>
            
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-tighter">
                  <span>Daily Goal</span>
                  <span>{todayApplications} / {dailyGoal}</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${dailyGoalMet ? 'bg-emerald-300 animate-pulse' : 'bg-white'}`}
                    style={{ width: `${Math.min((todayApplications / dailyGoal) * 100, 100)}%` }}
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
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm animate-glow-border">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-800 uppercase tracking-widest">
              <span className="text-indigo-500">✨</span> {editingId ? 'Edit Entry' : 'Smart Import'}
            </h2>
            <textarea
              placeholder="Paste job description..."
              value={jobText} onChange={e => setJobText(e.target.value)}
              className="w-full h-32 p-4 text-sm bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none"
            />
            <button 
              onClick={() => isDemo ? setShowSignInPrompt(true) : handleParse()} 
              disabled={isParsing} 
              className="w-full mt-3 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg">
              {isParsing ? 'CareerDrive Processing...' : 'Auto-Fill with AI'}
            </button>
            {parseError && <p className="text-rose-500 text-[10px] mt-2 text-center font-bold">{parseError}</p>}
          </section>

          {/* Form Section (manual input and confirm) */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm" style={{ filter: isParsing ? 'blur(4px) grayscale(100%)' : 'none', opacity: isParsing ? 0.5 : 1, pointerEvents: isParsing ? 'none' : 'auto', transition: 'all 0.3s' }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-none outline-none" />
                <input name="role" placeholder="Role" value={form.role} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-none outline-none" />
              </div>
              <select name="status" value={form.status} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-none font-bold outline-none font-['DM_Sans'] capitalize">
                {['applied', 'interviewing', 'offered', 'rejected'].map(s => <option key={s} value={s} className="font-['DM_Sans']">{s}</option>)}
              </select>
              <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest">
                {editingId ? 'Save Changes' : 'Confirm Application'}
              </button>
            </form>
          </section>

          {/* user/applicant profile */}
          <section className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Applicant Profile</h2>
              {isProfileStale && <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">STALE CONTEXT</span>}
            </div>
            <div className="text-[8px] text-slate-400 font-bold mb-2 tracking-tighter">Updated: {profileUpdatedAt ? new Date(profileUpdatedAt).toLocaleString() : 'Never'}</div>
            <textarea
              placeholder="Your skills (e.g. React, Python), experience..."
              value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })}
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl mb-2 min-h-[80px] outline-none"
            />
            <button 
              onClick={() => isDemo ? setShowSignInPrompt(true) : api.post('/profile', profile).then(() => { setProfileUpdatedAt(new Date()); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000); })} 
              className="w-full py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black hover:bg-indigo-50 transition-all uppercase">
              {profileSaved ? '✓ Updated' : 'Update Context'}
            </button>
          </section>
        </div>

        {/* RIGHT COL */}
        <div className="md:col-span-8 space-y-6">
          <section className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <Analytics applications={applications} highlightedStat={highlightedStat} setHighlightedStat={setHighlightedStat} />

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

            {applications
              .filter(app => app.company.toLowerCase().includes(searchTerm.toLowerCase()))
              .filter(app => filterStatus === 'all' || app.status === filterStatus)
              .length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-400 p-8">
                <p className="text-lg font-black tracking-tight mb-2">No Applications Yet</p>
                <p className="text-sm font-medium">Start applying! Great things never come to those who wait.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                {applications
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
                }
              </div>
            )}
          </div>

          {/* system oversight and LLM-Ops logging*/}
          <AdminDashboard isDemo={isDemo} demoLogs={DEMO_LOGS} />
        </div>
      </div>

      {/* sign in prompt in demo mode */}
      {showSignInPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center font-['DM_Sans'] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-slideup">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-sm text-gray-600 mb-6">Sign in to save your progress and unlock AI-powered features.</p>
            <button 
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 mb-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
              Sign in with Google
            </button>
            <button 
              onClick={() => setShowSignInPrompt(false)}
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              Continue with Demo
            </button>
          </div>
        </div>
      )}
    </main>
  </div>
)
}

export default App;