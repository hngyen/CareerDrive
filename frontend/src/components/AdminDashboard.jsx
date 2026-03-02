import { useEffect, useState } from 'react'
import api from '../api'

function AdminDashboard() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    api.get('/parse-logs').then(res => setLogs(res.data))
  }, [])

  const totalCost = logs.reduce((sum, log) => sum + log.estimated_cost_usd, 0)
  const avgLatency = logs.length > 0
    ? (logs.reduce((sum, log) => sum + log.latency_seconds, 0) / logs.length).toFixed(2)
    : 0
  const totalTokens = logs.reduce((sum, log) => sum + log.total_tokens, 0)

  return (
    <div>
      <h2>AI Parser Stats</h2>
      <p>Total parses: {logs.length}</p>
      <p>Total tokens used: {totalTokens}</p>
      <p>Avg latency: {avgLatency}s</p>
      <p>Total estimated cost: ${totalCost.toFixed(6)}</p>

      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Tokens</th>
            <th>Latency</th>
            <th>Cost (USD)</th>
            <th>Success</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.total_tokens}</td>
              <td>{log.latency_seconds}s</td>
              <td>${log.estimated_cost_usd.toFixed(6)}</td>
              <td>{log.success ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminDashboard