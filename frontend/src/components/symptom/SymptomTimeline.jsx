export default function SymptomTimeline({ symptoms }) {
  if (!symptoms?.length) return null
  const maxDays = Math.max(...symptoms.map(s => s.duration_days || 1), 1)
  return (
    <div className="card card-body timeline-card" style={{marginTop: 16}}>
      <div className="timeline-title">Symptom Timeline</div>
      {symptoms.map((s, i) => (
        <div key={i} className="timeline-row">
          <span className="timeline-name">{s.symptom}</span>
          <div className="timeline-bar-wrap">
            <div className="timeline-bar" style={{width: `${Math.min((s.duration_days||1)/maxDays*100, 100)}%`}} />
          </div>
          <span className="timeline-days">{s.duration_days || 1}d</span>
        </div>
      ))}
    </div>
  )
}