import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const BODY_PARTS = [
  { value: 'skin',   label: '🩺 Skin'   },
  { value: 'eye',    label: '👁 Eye'    },
  { value: 'tongue', label: '👅 Tongue' },
  { value: 'throat', label: '🫁 Throat' },
]

export default function ImageUpload({ onImageResult }) {
  const { i18n } = useTranslation()
  const [preview, setPreview]   = useState(null)
  const [bodyPart, setBodyPart] = useState('skin')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setResult(null)
  }

  const analyseImage = async () => {
    const file = fileRef.current?.files[0]
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('body_part', bodyPart)
      form.append('language', i18n.language)
      const res = await axios.post(`${BASE_URL}/api/image/analyse`, form)
      setResult(res.data)
      if (res.data.visible_symptoms?.length > 0 && onImageResult) {
        onImageResult(res.data)
      }
    } catch {
      alert('Image analysis failed. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const sevColor = (s) => s === 'severe' ? '#ff4757' : s === 'moderate' ? '#ffb800' : '#00ff88'

  return (
    <div style={{ background: '#080f12', border: '1px solid #0f2d35', borderRadius: '14px', padding: '20px' }}>

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select value={bodyPart} onChange={e => setBodyPart(e.target.value)}
          style={{
            padding: '9px 14px', border: '1px solid #1a3a45', borderRadius: '10px',
            fontSize: '0.875rem', background: '#0d1117', color: '#e8f0fe',
            outline: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif'
          }}>
          {BODY_PARTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>

        <label style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 18px',
          background: 'rgba(0,212,255,0.08)', border: '1px solid #00d4ff',
          borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700,
          color: '#00d4ff', cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: 'Space Grotesk, sans-serif'
        }}>
          📷 Upload Image
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={handleFile} />
        </label>
      </div>

      {/* No image yet */}
      {!preview && (
        <div style={{
          border: '1.5px dashed #1a3a45', borderRadius: '12px',
          padding: '32px', textAlign: 'center', color: '#4a5f73'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔬</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Upload a photo to analyse</div>
          <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Skin rashes, eye redness, tongue, throat</div>
        </div>
      )}

      {/* Preview + analyse */}
      {preview && (
        <div style={{ marginBottom: '14px' }}>
          <img src={preview} alt="preview" style={{
            width: '120px', height: '120px', objectFit: 'cover',
            borderRadius: '10px', border: '2px solid rgba(0,212,255,0.3)',
            display: 'block', marginBottom: '10px'
          }} />
          <button onClick={analyseImage} disabled={loading} style={{
            padding: '9px 22px',
            background: loading ? '#1a2332' : 'linear-gradient(135deg, #00d4ff, #0099cc)',
            color: loading ? '#4a5f73' : '#080c10',
            border: 'none', borderRadius: '10px',
            fontSize: '0.875rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s'
          }}>
            {loading ? '⏳ Analysing...' : '🔍 Analyse Image'}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: '#0d1117', border: '1px solid #0f2d35',
          borderRadius: '12px', padding: '16px', marginTop: '4px'
        }}>
          <div style={{ fontWeight: 700, color: '#00d4ff', fontSize: '1rem', marginBottom: '6px' }}>
            {result.possible_condition}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#7a8fa6', lineHeight: 1.6, marginBottom: '10px' }}>
            {result.description}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {result.severity && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                background: `${sevColor(result.severity)}15`,
                color: sevColor(result.severity),
                border: `1px solid ${sevColor(result.severity)}30`
              }}>{result.severity}</span>
            )}
            {result.see_doctor && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                background: 'rgba(255,71,87,0.1)', color: '#ff4757',
                border: '1px solid rgba(255,71,87,0.2)'
              }}>🚨 See doctor recommended</span>
            )}
          </div>
          {result.visible_symptoms?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.visible_symptoms.map((s, i) => (
                <span key={i} style={{
                  fontSize: '0.72rem', padding: '3px 10px',
                  background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: '999px', color: '#00d4ff'
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}