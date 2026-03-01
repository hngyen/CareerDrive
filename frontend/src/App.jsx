import { useState, useEffect } from 'react'
import api from './api'
import './App.css'
import supabase from './supabase'

function App() {
const [applications, setApplications] = useState([])
 const [session, setSession] = useState(null)
  const [form, setForm] = useState({
    company: '',
    role: '',
    status: 'applied',
    job_url: '',
    notes: ''
  })
  const [editingId, setEditingId] = useState(null)

  const [jobText, setJobText] = useState('')

  async function handleParse() {
    const res = await api.post('/parse-job', { text: jobText })
    setForm(prev => ({
      ...prev,
      company: res.data.company || '',
      role: res.data.role || '',
      notes: res.data.notes || ''
    }))
  }

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
    }
  }, [session])

  if (!session) {
    return (
      <div>
        <h1>Job Tracker</h1>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
          Sign in with Google
        </button>
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
    
  return (
    <div>
      <h1>Job Tracker</h1>
      <p>Welcome, {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>

      <form onSubmit={handleSubmit}>
        <input name="company" placeholder="Company" value={form.company} onChange={handleChange} />
        <input name="role" placeholder="Role" value={form.role} onChange={handleChange} />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offered">Offered</option>
          <option value="rejected">Rejected</option>
        </select>
        <input name="job_url" placeholder="Job URL" value={form.job_url} onChange={handleChange} />
        <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        <button type="submit">{editingId ? 'Update' : 'Add Application'}</button>
      </form>

      {applications.map(app => (
        <div key={app.id}>
          <h3>{app.company} — {app.role}</h3>
          <p>Status: {app.status}</p>
          <button onClick={() => handleEdit(app)}>Edit</button>
          <button onClick={() => handleDelete(app.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}

export default App