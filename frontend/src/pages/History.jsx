import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function History() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('medisense_history') || '[]')
    setSessions([...saved].reverse())
  }, [])

  const clearHistory = () => { localStorage.removeItem('medisense_history'); setSessions([]) }

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div className="page">
      <div className="history-header">
        <h2>{t('history')}</h2>
        {sessions.length > 0 && <button className="clear-btn" onClick={clearHistory}>{t('clear_all')}</button>}
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>{t('no_history')}</p>
          <button className="empty-link" onClick={() => navigate('/')}>Check your symptoms →</button>
        </div>
      ) : (
        sessions.map((s, i) => {
          const top = s.diagnosis?.top_conditions?.[0]
          const sev = top?.severity_level || 'mild'
          return (
            <div key={i} className="history-item" onClick={() => navigate('/results', { state: { result: s } })}>
              <div style={{flex:1}}>
                <div className="diagnosis-badges">
                  <span className={`badge-${sev}`}>{sev}</span>
                  {top?.see_doctor && <span style={{fontSize:'0.7rem',color:'#be123c',background:'#fff1f2',padding:'3px 10px',borderRadius:999,fontWeight:600}}>Doctor advised</span>}
                </div>
                <div className="history-condition">{top?.condition || 'Unknown'}</div>
                <div className="history-symptoms">{s.symptoms?.map(x => x.symptom).join(', ')}</div>
              </div>
              <div>
                <div className="history-date">{formatDate(s.generated_at)}</div>
                <div className="history-arrow">View →</div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}