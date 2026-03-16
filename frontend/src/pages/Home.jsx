import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import SymptomInput from '../components/symptom/SymptomInput'
import SymptomTimeline from '../components/symptom/SymptomTimeline'
import VoiceInput from '../components/symptom/VoiceInput'
import ImageUpload from '../components/symptom/ImageUpload'
import { checkSymptoms } from '../services/api'

export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading] = useState(false)
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [tab, setTab] = useState('text')

  const addVoiceSymptoms = (detected) => {
    const newOnes = detected.filter(d => !symptoms.find(s => s.symptom.toLowerCase() === d.symptom.toLowerCase()))
    setSymptoms(prev => [...prev, ...newOnes])
  }

  const addImageSymptoms = (result) => {
    const newS = (result.visible_symptoms || []).map(s => ({ symptom: s, severity: 5, duration_days: 1 }))
    const newOnes = newS.filter(d => !symptoms.find(s => s.symptom.toLowerCase() === d.symptom.toLowerCase()))
    setSymptoms(prev => [...prev, ...newOnes])
  }

  const handleCheck = async () => {
    if (!symptoms.length) return
    setLoading(true)
    try {
      const res = await checkSymptoms({ symptoms, language: i18n.language, age: age ? parseInt(age) : null, gender: gender || null })
      const history = JSON.parse(localStorage.getItem('medisense_history') || '[]')
      history.push(res.data)
      localStorage.setItem('medisense_history', JSON.stringify(history.slice(-50)))
      navigate('/results', { state: { result: res.data } })
    } catch {
      alert('Cannot connect to backend. Make sure it is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    { id: 'text',  icon: '⌨', label: 'Type'  },
    { id: 'voice', icon: '🎙', label: 'Voice' },
    { id: 'image', icon: '📷', label: 'Image' },
  ]

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-eyebrow">AI-Powered Symptom Analysis</div>
        <h1>
          <span className="block">Intelligent</span>
          <span className="block cyan">Health Check.</span>
        </h1>
        <p>Describe your symptoms and get instant AI-powered diagnosis in Tamil, Malayalam, Hindi or English.</p>
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

      <div className="tab-row">
        {TABS.map(tb => (
          <button key={tb.id} className={`tab-btn ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
            <span>{tb.icon}</span> {tb.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {tab === 'text'  && <SymptomInput symptoms={symptoms} setSymptoms={setSymptoms} />}
          {tab === 'voice' && <VoiceInput onSymptomsDetected={addVoiceSymptoms} />}
          {tab === 'image' && <ImageUpload onImageResult={addImageSymptoms} />}
        </div>
      </div>

      {symptoms.length > 0 && <SymptomTimeline symptoms={symptoms} />}

      <button className="check-btn" onClick={handleCheck} disabled={loading || !symptoms.length}>
        {loading
          ? <><div className="spinner" /><span>Analysing symptoms...</span></>
          : <><span>⚡</span>{t('check_now')}</>}
      </button>
      {!symptoms.length && <p className="check-hint">Tap a symptom above to get started</p>}
    </div>
  )
}