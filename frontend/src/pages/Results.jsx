import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

function UrgencyBar({ urgency }) {
  if (!urgency) return null
  const { urgency_score, urgency_label, urgency_color, urgency_icon, urgency_action } = urgency
  return (
    <div style={{ background:`${urgency_color}10`, border:`1.5px solid ${urgency_color}30`, borderRadius:'14px', padding:'20px', marginBottom:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <div>
          <div style={{ fontSize:'0.68rem', color:'#7a8fa6', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Urgency Score</div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'1.4rem' }}>{urgency_icon}</span>
            <span style={{ fontSize:'1.6rem', fontWeight:800, color:urgency_color, fontFamily:'Space Mono, monospace' }}>{urgency_score}/10</span>
            <span style={{ fontSize:'0.78rem', fontWeight:700, color:urgency_color, padding:'3px 10px', background:`${urgency_color}20`, borderRadius:'999px' }}>{urgency_label}</span>
          </div>
        </div>
        <div style={{ width:'100px' }}>
          <div style={{ height:'8px', background:'#1e2d3d', borderRadius:'4px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${urgency_score*10}%`, background:`linear-gradient(90deg,#00ff88,${urgency_color})`, borderRadius:'4px' }} />
          </div>
        </div>
      </div>
      <div style={{ fontSize:'0.875rem', color:urgency_color, fontWeight:600 }}>→ {urgency_action}</div>
    </div>
  )
}

function XAIBar({ symptom, weight }) {
  const level = weight > 0.6 ? 'high' : weight > 0.3 ? 'medium' : 'low'
  return (
    <div className="xai-row">
      <span className="xai-name">{symptom}</span>
      <div className="xai-bar-wrap"><div className={`xai-bar ${level}`} style={{width:`${weight*100}%`}} /></div>
      <span className={`xai-badge ${level}`}>{level}</span>
    </div>
  )
}

function DiagnosisCard({ condition, isTop }) {
  const [expanded, setExpanded] = useState(isTop)
  const pct      = Math.round((condition.confidence || 0) * 100)
  const sev      = condition.severity_level || 'mild'
  const medicines = condition.medicines || {}
  const remedies  = medicines.home_remedies || []
  const otc       = medicines.otc_medicines || []
  const shap      = condition.shap_explanation || []

  return (
    <div className={`diagnosis-card ${isTop ? 'top-card' : ''}`}>
      <div className="diagnosis-card-header" onClick={() => setExpanded(!expanded)}>
        <div style={{flex:1}}>
          <div className="diagnosis-badges">
            {isTop && <span className="badge-top">Most likely</span>}
            <span className={`badge-${sev}`}>{sev}</span>
          </div>
          <div className="diagnosis-name">{condition.condition}</div>
          <div className="diagnosis-desc">{condition.description}</div>
          <button className="expand-btn">{expanded ? 'Hide details' : 'Show details'}</button>
        </div>
        <div className="confidence-box">
          <div className="confidence-pct">{pct}%</div>
          <div className="confidence-label">confidence</div>
        </div>
      </div>

      {expanded && (
        <div className="xai-section">
          {shap.length > 0 && (
            <>
              <div className="section-title">Why this diagnosis?</div>
              {shap.map((s,i) => <XAIBar key={i} symptom={s.symptom} weight={s.weight} />)}
            </>
          )}
          {remedies.length > 0 && (
            <div style={{marginTop:16}}>
              <div className="section-title">Home Remedies</div>
              <div className="remedies-grid">
                {remedies.map((r,i) => (
                  <div key={i} className="remedy-item">
                    <div className="remedy-name">{r.remedy}</div>
                    <div className="remedy-instructions">{r.instructions}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {otc.length > 0 && (
            <div style={{marginTop:16}}>
              <div className="section-title">Medicines</div>
              {otc.map((m,i) => (
                <div key={i} className="medicine-item">
                  <div>
                    <div className="medicine-name">{m.name}</div>
                    <div className="medicine-generic">{m.generic}</div>
                  </div>
                  <div>
                    <div className="medicine-dosage">{m.dosage}</div>
                    <div className="medicine-freq">{m.frequency}</div>
                  </div>
                </div>
              ))}
              <div className="disclaimer">⚠ Always consult a doctor before taking medicines.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Results() {
  const { state }  = useLocation()
  const { t }      = useTranslation()
  const navigate   = useNavigate()
  const result     = state?.result
  if (!result) { navigate('/'); return null }

  const conditions  = result.diagnosis?.top_conditions || []
  const needsDoctor = result.urgency?.see_doctor || conditions.some(c => c.see_doctor)
  const followup    = result.followup_questions || []

  return (
    <div className="results-page">
      <button className="back-btn" onClick={() => navigate('/')}>← {t('back_home')}</button>

      <div className="results-header">
        <h2>{t('possible_conditions')}</h2>
        <p>{result.diagnosis?.timeline_summary}</p>
      </div>

      {/* Urgency Score */}
      <UrgencyBar urgency={result.urgency} />

      {/* Doctor alert */}
      {needsDoctor && (
        <div className="doctor-alert">
          <span className="doctor-alert-icon">🚨</span>
          <div>
            <div className="doctor-alert-title">{t('see_doctor')}</div>
            <div className="doctor-alert-msg">{t('see_doctor_message')}</div>
          </div>
        </div>
      )}

      {conditions.map((c,i) => <DiagnosisCard key={i} condition={c} isTop={i===0} />)}

      {followup.length > 0 && (
        <div className="followup-box">
          <div className="followup-title">Follow-up questions to monitor</div>
          <ul className="followup-list">
            {followup.map((q,i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}

      {/* Journey CTA */}
      <div style={{ marginTop:'24px', padding:'20px', background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:'14px', textAlign:'center' }}>
        <div style={{ fontSize:'0.875rem', color:'#7a8fa6', marginBottom:'12px' }}>
          Want to track how your symptoms change over multiple days?
        </div>
        <button onClick={() => navigate('/journey')} style={{
          padding:'10px 24px', background:'linear-gradient(135deg,#00d4ff,#0099cc)',
          color:'#080c10', border:'none', borderRadius:'10px',
          fontWeight:700, cursor:'pointer', fontFamily:'Space Grotesk, sans-serif'
        }}>📅 Start Symptom Journey</button>
      </div>
    </div>
  )
}