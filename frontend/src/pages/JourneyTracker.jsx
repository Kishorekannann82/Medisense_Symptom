import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SymptomInput from '../components/symptom/SymptomInput'

const BASE_URL = 'http://localhost:8000'

// ── Urgency Bar ────────────────────────────────────────────
function UrgencyBar({ score, label, color, action, icon }) {
  return (
    <div style={{
      background: `${color}10`, border: `1.5px solid ${color}30`,
      borderRadius: '14px', padding: '20px', marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: '#7a8fa6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Urgency Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color, fontFamily: 'Space Mono, monospace' }}>{score}/10</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color, padding: '3px 10px', background: `${color}20`, borderRadius: '999px' }}>{label}</span>
          </div>
        </div>
        {/* Score bar */}
        <div style={{ width: '120px' }}>
          <div style={{ height: '8px', background: '#1e2d3d', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score * 10}%`, background: `linear-gradient(90deg, #00ff88, ${color})`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.875rem', color, fontWeight: 600 }}>→ {action}</div>
    </div>
  )
}

// ── Trend Chart ────────────────────────────────────────────
function TrendChart({ severityTrend, days }) {
  if (!severityTrend?.length) return null
  const max = Math.max(...severityTrend, 1)

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ fontSize: '0.68rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: 700 }}>
        Severity Trend — {severityTrend.length} days
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px' }}>
        {severityTrend.map((val, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              height: `${(val / max) * 50}px`,
              background: val > 6 ? '#ff4757' : val > 4 ? '#ffb800' : '#00ff88',
              transition: 'height 0.5s ease', minHeight: '4px'
            }} />
            <span style={{ fontSize: '0.65rem', color: '#4a5f73' }}>D{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Journey Page ──────────────────────────────────────
export default function JourneyTracker() {
  const navigate   = useNavigate()
  const [step, setStep]         = useState('start') // start | tracking | result
  const [journeyId, setJourneyId] = useState(null)
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading]   = useState(false)
  const [dayResult, setDayResult] = useState(null)
  const [allDays, setAllDays]   = useState([])
  const [age, setAge]           = useState('')
  const [gender, setGender]     = useState('')

  // Load existing journey from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('active_journey')
    if (saved) {
      const j = JSON.parse(saved)
      setJourneyId(j.journey_id)
      setAllDays(j.days || [])
      setStep('tracking')
    }
  }, [])

  const startJourney = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/api/journey/start`, {
        age: age ? parseInt(age) : null,
        gender: gender || null,
        language: 'en'
      })
      const jid = res.data.journey_id
      setJourneyId(jid)
      localStorage.setItem('active_journey', JSON.stringify({ journey_id: jid, days: [] }))
      setStep('tracking')
    } catch { alert('Backend error') }
    finally { setLoading(false) }
  }

  const submitDay = async () => {
    if (!symptoms.length) return
    setLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/api/journey/${journeyId}/day`, {
        symptoms,
        language: 'en'
      })
      const result = res.data
      setDayResult(result)
      const newDays = [...allDays, { day: result.day_number, symptoms }]
      setAllDays(newDays)
      localStorage.setItem('active_journey', JSON.stringify({ journey_id: journeyId, days: newDays }))
      setSymptoms([])
      setStep('result')
    } catch { alert('Backend error') }
    finally { setLoading(false) }
  }

  const continueJourney = () => {
    setSymptoms([])
    setDayResult(null)
    setStep('tracking')
  }

  const endJourney = () => {
    localStorage.removeItem('active_journey')
    navigate('/')
  }

  // ── Start screen ────────────────────────────────────────
  if (step === 'start') return (
    <div className="page">
      <div className="hero">
        <div className="hero-eyebrow">📅 Multi-day Tracking</div>
        <h1><span className="block">Symptom</span><span className="block cyan">Journey.</span></h1>
        <p>Track your symptoms day by day. Our AI monitors your progression and alerts you when to see a doctor.</p>
      </div>

      {/* How it works */}
      <div style={{ background: '#111820', border: '1px solid #1e2d3d', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.7rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 700 }}>How it works</div>
        {[
          { icon: '1️⃣', text: 'Add your symptoms today' },
          { icon: '2️⃣', text: 'Come back tomorrow and add again' },
          { icon: '3️⃣', text: 'AI tracks progression and alerts if worsening' },
          { icon: '📋', text: 'Get a report to show your doctor' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < 3 ? '1px solid #1e2d3d' : 'none' }}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.875rem', color: '#7a8fa6' }}>{item.text}</span>
          </div>
        ))}
      </div>

      <div className="patient-row">
        <input type="number" placeholder="Age (optional)" value={age} onChange={e => setAge(e.target.value)} />
        <select value={gender} onChange={e => setGender(e.target.value)}>
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <button className="check-btn" onClick={startJourney} disabled={loading}>
        {loading ? <><div className="spinner" /><span>Starting...</span></> : '📅 Start Symptom Journey'}
      </button>
    </div>
  )

  // ── Tracking screen ─────────────────────────────────────
  if (step === 'tracking') return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.68rem', color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 700 }}>
          Day {allDays.length + 1} of your journey
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e8f0fe' }}>How are you feeling today?</h2>
        <p style={{ fontSize: '0.875rem', color: '#7a8fa6', marginTop: '4px' }}>Add symptoms you are experiencing RIGHT NOW</p>
      </div>

      {/* Previous days summary */}
      {allDays.length > 0 && (
        <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.68rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 700 }}>Previous days</div>
          {allDays.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < allDays.length - 1 ? '1px solid #1e2d3d' : 'none' }}>
              <span style={{ fontSize: '0.75rem', color: '#00d4ff', fontFamily: 'Space Mono, monospace', minWidth: '40px' }}>Day {d.day}</span>
              <span style={{ fontSize: '0.78rem', color: '#7a8fa6' }}>{d.symptoms.map(s => s.symptom).join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <SymptomInput symptoms={symptoms} setSymptoms={setSymptoms} />
        </div>
      </div>

      <button className="check-btn" onClick={submitDay} disabled={loading || !symptoms.length}
        style={{ marginTop: '20px' }}>
        {loading ? <><div className="spinner" /><span>Analysing...</span></> : '⚡ Analyse Today\'s Symptoms'}
      </button>
      {!symptoms.length && <p className="check-hint">Add today's symptoms to continue</p>}
    </div>
  )

  // ── Result screen ────────────────────────────────────────
  if (step === 'result' && dayResult) return (
    <div className="results-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Home</button>

      <div className="results-header">
        <div style={{ fontSize: '0.68rem', color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontWeight: 700 }}>
          Day {dayResult.day_number} Analysis
        </div>
        <h2>Journey Update</h2>
        <p style={{ marginTop: '6px', color: '#7a8fa6' }}>
          Trend: <span style={{
            fontWeight: 700,
            color: dayResult.trend_analysis?.trend === 'worsening' ? '#ff4757'
                 : dayResult.trend_analysis?.trend === 'improving' ? '#00ff88' : '#ffb800'
          }}>{dayResult.trend_analysis?.trend?.toUpperCase()}</span>
          {dayResult.new_symptoms_today?.length > 0 && (
            <span style={{ color: '#ffb800', marginLeft: '12px' }}>
              ⚠ {dayResult.new_symptoms_today.length} new symptom(s) today
            </span>
          )}
        </p>
      </div>

      {/* Urgency Score */}
      <UrgencyBar
        score={dayResult.urgency_score}
        label={dayResult.urgency_label}
        color={dayResult.urgency_color}
        action={dayResult.urgency_action}
        icon={dayResult.urgency_score >= 7 ? '🚨' : dayResult.urgency_score >= 5 ? '⚠️' : '✅'}
      />

      {/* Escalation alert */}
      {dayResult.escalation_alert && (
        <div style={{ background: 'rgba(255,71,87,0.08)', border: '1.5px solid rgba(255,71,87,0.3)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, color: '#ff4757', fontSize: '1rem', marginBottom: '6px' }}>
            🚨 {dayResult.escalation_alert.message}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#ff8a94' }}>{dayResult.escalation_alert.action}</div>
        </div>
      )}

      {/* Trend chart */}
      <TrendChart severityTrend={dayResult.severity_trend} />

      {/* Top diagnosis */}
      {dayResult.diagnosis?.top_conditions?.[0] && (
        <div style={{ background: '#111820', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.68rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 700 }}>Most likely condition</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#e8f0fe' }}>{dayResult.diagnosis.top_conditions[0].condition}</div>
          <div style={{ fontSize: '0.875rem', color: '#7a8fa6', marginTop: '6px', lineHeight: 1.6 }}>{dayResult.diagnosis.top_conditions[0].description}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00d4ff', marginTop: '8px', fontFamily: 'Space Mono, monospace' }}>
            {Math.round((dayResult.diagnosis.top_conditions[0].confidence || 0) * 100)}% confidence
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={continueJourney} style={{
          flex: 1, padding: '13px', borderRadius: '10px',
          border: '1.5px solid #00d4ff', background: 'rgba(0,212,255,0.08)',
          color: '#00d4ff', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem'
        }}>📅 Add Tomorrow</button>
        <button onClick={endJourney} style={{
          flex: 1, padding: '13px', borderRadius: '10px',
          border: '1px solid #1e2d3d', background: 'transparent',
          color: '#7a8fa6', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem'
        }}>✓ End Journey</button>
      </div>
    </div>
  )

  return null
}