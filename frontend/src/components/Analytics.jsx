import { FunnelChart, Funnel, LabelList, Tooltip } from 'recharts'

const FUNNEL_DATA = [
  { value: 0, name: 'Applied', fill: '#60a5fa' },
  { value: 0, name: 'Interviewing', fill: '#f59e0b' },
  { value: 0, name: 'Offered', fill: '#10b981' },
  { value: 0, name: 'Rejected', fill: '#ef4444' },
]

function Analytics({ applications }) {
  const counts = {
    applied: applications.filter(a => a.status === 'applied').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offered: applications.filter(a => a.status === 'offered').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const total = applications.length

  const data = [
    { value: total, name: `Applied (${total})`, fill: '#60a5fa' },
    { value: counts.interviewing + counts.offered, name: `Interviewing (${counts.interviewing})`, fill: '#f59e0b' },
    { value: counts.offered, name: `Offered (${counts.offered})`, fill: '#10b981' },
  ]

  const conversionRate = total > 0 
    ? Math.round((counts.interviewing / total) * 100) 
    : 0

  return (
    <div>
      <h2>Application Funnel</h2>
      <p>Total applications: {total}</p>
      <p>Interview conversion rate: {conversionRate}%</p>
      <p>Rejected: {counts.rejected}</p>

      <FunnelChart width={400} height={300}>
        <Tooltip />
        <Funnel dataKey="value" data={data} isAnimated>
          <LabelList position="center" fill="#fff" dataKey="name" />
        </Funnel>
      </FunnelChart>
    </div>
  )
}

export default Analytics