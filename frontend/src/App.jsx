import { useState, useEffect } from 'react'
import api from './api'
import './App.css'
import supabase from './supabase'
import Analytics from './components/Analytics'
import AdminDashboard from './components/AdminDashboard'

function App() {
const [applications, setApplications] = useState([])
 const [session, setSession] = useState(null)
 const [profile, setProfile] = useState({ skills: '', experience: '' })
  const [profileSaved, setProfileSaved] = useState(false)

 const [parseError, setParseError] = useState('')
  const [form, setForm] = useState({
    company: '',
    role: '',
    status: 'applied',
    job_url: '',
    notes: '',
    match_score: null,
    pros: [],
    cons: []
  })
  const [editingId, setEditingId] = useState(null)

  const [jobText, setJobText] = useState('')

  useEffect(() => {
    // check if user is already logged in on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // listen for login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

useEffect(() => {
  if (session) {
    api.get('/applications').then(res => setApplications(res.data))
    api.get('/profile').then(res => {
      if (res.data) setProfile(res.data)
    })
  }
}, [session])

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-sm w-full text-center shadow-sm">
          <span className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">CD</span>
          <h1 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">CareerDrive</h1>
          <p className="text-sm text-gray-500 mb-8">Track your job applications, powered by AI</p>
          <button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.company || !form.role) return

    if (editingId) {
      api.patch(`/applications/${editingId}`, form).then(res => {
        setApplications(applications.map(app => 
          app.id === editingId ? res.data[0] : app
        ))
        setEditingId(null)
        setForm({ company: '', role: '', status: 'applied', job_url: '', notes: '' })
      })
    } else {
      api.post('/applications', form).then(res => {
        setApplications([...applications, res.data[0]])
        setForm({ company: '', role: '', status: 'applied', job_url: '', notes: '' })
      })
    }
  }

  function handleDelete(id) {
    api.delete(`/applications/${id}`).then(() => {
      setApplications(applications.filter(app => app.id !== id))
    })
  }

  function handleEdit(app) {
    setEditingId(app.id)
    setForm({
      company: app.company,
      role: app.role,
      status: app.status,
      job_url: app.job_url || '',
      notes: app.notes || ''
    })
  }

  async function handleParse() {
    setParseError('')
    try {
      const res = await api.post('/parse-job', { text: jobText })
      setForm(prev => ({
        ...prev,
        company: res.data.company || '',
        role: res.data.role || '',
        notes: res.data.notes || '',
        match_score: res.data.match_score || null,
        pros: res.data.pros || '',
        cons: res.data.cons || '',

      }))
    } catch (err) {
      setParseError('Failed to parse job description. Try again.')
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">

      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">CD</span>
            <h1 className="font-semibold text-gray-900">CareerDrive</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user.email}</span>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
    
<div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
  <h2 className="font-semibold text-gray-900 mb-4">My Profile</h2>
  <div className="grid grid-cols-2 gap-3">
    <textarea
      placeholder="Your skills (e.g. React, Python, FastAPI, PostgreSQL)"
      value={profile.skills}
      onChange={e => setProfile({ ...profile, skills: e.target.value })}
      rows={3}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <textarea
      placeholder="Your experience and projects (e.g. Frontend Development Internship, Built Public Transport dashboard with FastAPI and React)"
      value={profile.experience}
      onChange={e => setProfile({ ...profile, experience: e.target.value })}
      rows={3}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
  <button
    onClick={() => api.post('/profile', profile).then(() => setProfileSaved(true))}
    className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
  >
    Save Profile
  </button>
  {profileSaved && <span className="text-sm text-green-600 ml-3">Saved!</span>}
</div>

<div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
  <h2 className="font-semibold text-gray-900 mb-4">
    {editingId ? 'Edit Application' : 'Add Application'}
  </h2>

  <div className="mb-4">
    <textarea
      placeholder="Paste job description here to auto-fill..."
      value={jobText}
      onChange={e => setJobText(e.target.value)}
      rows={3}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
    />
    <button
      type="button"
      onClick={handleParse}
      className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Parse with AI
    </button>
    {parseError && <p className="text-red-500 text-sm mt-1">{parseError}</p>}
  </div>

  <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
    <input
      name="company"
      placeholder="Company"
      value={form.company}
      onChange={handleChange}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      name="role"
      placeholder="Role"
      value={form.role}
      onChange={handleChange}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <select
      name="status"
      value={form.status}
      onChange={handleChange}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
    >
      <option value="applied">Applied</option>
      <option value="interviewing">Interviewing</option>
      <option value="offered">Offered</option>
      <option value="rejected">Rejected</option>
    </select>
    <input
      name="job_url"
      placeholder="Job URL"
      value={form.job_url}
      onChange={handleChange}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      name="notes"
      placeholder="Notes"
      value={form.notes}
      onChange={handleChange}
      className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <div className="col-span-2 flex gap-2">
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {editingId ? 'Update' : 'Add Application'}
      </button>
      {editingId && (
        <button
          type="button"
          onClick={() => { setEditingId(null); setForm({ company: '', role: '', status: 'applied', job_url: '', notes: '' }) }}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  </form>
</div>
     <Analytics applications={applications} />
{applications.map(app => (
  <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 mb-3 flex gap-5">
    
    {/* Score column */}
    {app.match_score !== null && (
      <div className="flex flex-col items-center justify-center min-w-[56px]">
        <span className={`text-3xl font-bold font-mono ${
          app.match_score >= 7 ? 'text-green-500' :
          app.match_score >= 4 ? 'text-yellow-500' :
          'text-red-400'
        }`}>
          {app.match_score}
        </span>
        <span className="text-xs text-gray-400">/10</span>
      </div>
    )}

    {/* Main content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{app.company}</h3>
          <p className="text-sm text-gray-500">{app.role}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ml-2 ${
          app.status === 'offered' ? 'bg-green-50 text-green-700' :
          app.status === 'interviewing' ? 'bg-yellow-50 text-yellow-700' :
          app.status === 'rejected' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {app.status}
        </span>
      </div>

      {/* Pros and cons */}
      {(app.pros?.length > 0 || app.cons?.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          {app.pros?.length > 0 && (
            <div>
              {app.pros.map(pro => (
                <p key={pro} className="text-xs text-green-700 flex gap-1">
                  <span>+</span>{pro}
                </p>
              ))}
            </div>
          )}
          {app.cons?.length > 0 && (
            <div>
              {app.cons.map(con => (
                <p key={con} className="text-xs text-red-500 flex gap-1">
                  <span>−</span>{con}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={() => handleEdit(app)} className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
        <button onClick={() => handleDelete(app.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
      </div>
    </div>
  </div>
))}
    
      <AdminDashboard />
      </main>
    </div>
  
  )
}

export default App