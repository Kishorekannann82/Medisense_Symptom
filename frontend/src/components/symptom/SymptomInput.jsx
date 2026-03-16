import { useState } from 'react'

const QUICK_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Cold', 'Body ache', 'Fatigue',
  'Nausea', 'Stomach pain', 'Chest pain', 'Dizziness', 'Skin rash',
  'Sore throat', 'Back pain', 'Joint pain', 'Vomiting', 'Diarrhea',
  'Breathlessness', 'Itching', 'Sweating', 'Loss of appetite'
]

const SEVERITY_OPTIONS = [
  { label: 'Mild',     emoji: '😐', value: 3, color: '#00ff88', desc: 'Bearable, not affecting daily life' },
  { label: 'Moderate', emoji: '😟', value: 6, color: '#ffb800', desc: 'Uncomfortable, affecting some activities' },
  { label: 'Severe',   emoji: '😣', value: 9, color: '#ff4757', desc: 'Very painful, hard to function' },
]

const DURATION_OPTIONS = [
  { label: 'Today',    value: 1 },
  { label: '2-3 days', value: 2 },
  { label: '4-7 days', value: 5 },
  { label: '1+ week',  value: 10 },
]

function SymptomPopup({ symptom, onConfirm, onClose }) {
  const [severity, setSeverity] = useState(null)
  const [duration, setDuration] = useState(null)
  const canConfirm = severity !== null && duration !== null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#111820', border: '1px solid #1e2d3d',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.68rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Adding symptom</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e8f0fe' }}>🤒 {symptom}</div>
        </div>

        {/* Severity */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7a8fa6', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            How bad is it?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SEVERITY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSeverity(opt.value)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '10px',
                border: `1.5px solid ${severity === opt.value ? opt.color : '#1e2d3d'}`,
                background: severity === opt.value ? `${opt.color}18` : '#0d1117',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                fontFamily: 'Space Grotesk, sans-serif'
              }}>
                <span style={{ fontSize: '1.4rem' }}>{opt.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: severity === opt.value ? opt.color : '#e8f0fe' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#4a5f73', marginTop: '2px' }}>{opt.desc}</div>
                </div>
                {severity === opt.value && <span style={{ color: opt.color }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7a8fa6', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            How long have you had this?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DURATION_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setDuration(opt.value)} style={{
                padding: '11px', borderRadius: '10px',
                border: `1.5px solid ${duration === opt.value ? '#00d4ff' : '#1e2d3d'}`,
                background: duration === opt.value ? 'rgba(0,212,255,0.1)' : '#0d1117',
                color: duration === opt.value ? '#00d4ff' : '#7a8fa6',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                transition: 'all 0.15s', fontFamily: 'Space Grotesk, sans-serif'
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: '1px solid #1e2d3d', background: 'transparent',
            color: '#7a8fa6', cursor: 'pointer', fontWeight: 600,
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem'
          }}>Cancel</button>
          <button onClick={() => canConfirm && onConfirm(severity, duration)}
            disabled={!canConfirm} style={{
              flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
              background: canConfirm ? 'linear-gradient(135deg, #00d4ff, #0099cc)' : '#1a2332',
              color: canConfirm ? '#080c10' : '#4a5f73',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: '0.9rem',
              fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s'
            }}>
            {canConfirm ? 'Add Symptom ✓' : 'Select both options'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Severity helpers ───────────────────────────────────────
const getSeverityColor = (v) => v <= 3 ? '#00ff88' : v <= 6 ? '#ffb800' : '#ff4757'
const getSeverityLabel = (v) => v <= 3 ? 'Mild' : v <= 6 ? 'Moderate' : 'Severe'
const getDurationLabel = (d) => d <= 1 ? 'Today' : d <= 3 ? `${d} days` : d <= 7 ? `${d} days` : '1+ week'

export default function SymptomInput({ symptoms, setSymptoms }) {
  const [text, setText] = useState('')
  const [popup, setPopup] = useState(null)

  const openPopup = (name) => {
    const n = name.trim()
    if (!n) return
    if (symptoms.find(s => s.symptom.toLowerCase() === n.toLowerCase())) {
      setSymptoms(prev => prev.filter(s => s.symptom.toLowerCase() !== n.toLowerCase()))
      return
    }
    setPopup(n)
  }

  const confirmSymptom = (severity, duration) => {
    setSymptoms(prev => [...prev, { symptom: popup, severity, duration_days: duration }])
    setPopup(null)
    setText('')
  }

  const removeSymptom = (idx) => setSymptoms(prev => prev.filter((_, i) => i !== idx))

  return (
    <div>
      {popup && <SymptomPopup symptom={popup} onConfirm={confirmSymptom} onClose={() => setPopup(null)} />}

      {/* Quick chips */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.68rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 700 }}>
          Tap a symptom to add
        </div>
        <div className="chip-grid">
          {QUICK_SYMPTOMS.map(s => {
            const added = symptoms.find(x => x.symptom.toLowerCase() === s.toLowerCase())
            return (
              <button key={s} className={`chip ${added ? 'selected' : ''}`} onClick={() => openPopup(s)}>
                {added ? '✓ ' : ''}{s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom input */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.68rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 700 }}>
          Or type a custom symptom
        </div>
        <div className="symptom-input-row">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && text.trim() && openPopup(text)}
            placeholder="e.g. neck pain, eye irritation..." />
          <button className="add-btn" onClick={() => text.trim() && openPopup(text)}>+</button>
        </div>
      </div>

      {/* Added list */}
      {symptoms.length > 0 && (
        <div>
          <div style={{ fontSize: '0.68rem', color: '#4a5f73', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 700 }}>
            Added — {symptoms.length} symptom{symptoms.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {symptoms.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#0d1117',
                border: '1px solid #1e2d3d', borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e8f0fe' }}>{s.symptom}</span>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                    background: `${getSeverityColor(s.severity)}15`,
                    color: getSeverityColor(s.severity),
                    border: `1px solid ${getSeverityColor(s.severity)}30`
                  }}>{getSeverityLabel(s.severity)}</span>
                  <span style={{ fontSize: '0.72rem', color: '#4a5f73' }}>🕐 {getDurationLabel(s.duration_days)}</span>
                </div>
                <button onClick={() => removeSymptom(i)} style={{
                  background: 'none', border: 'none', color: '#4a5f73',
                  cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0 4px',
                  flexShrink: 0
                }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}