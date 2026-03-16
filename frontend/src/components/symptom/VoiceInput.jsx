import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VoiceInput({ onSymptomsDetected }) {
  const { i18n } = useTranslation()
  const [recording, setRecording] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [transcript, setTranscript] = useState('')
  const [detected, setDetected]   = useState([])
  const [error, setError]         = useState('')
  const mediaRef  = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    setError(''); setTranscript(''); setDetected([])
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRef.current  = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => uploadAudio(stream)
      recorder.start()
      setRecording(true)
    } catch {
      setError('Microphone permission denied. Please allow mic access.')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  const uploadAudio = async (stream) => {
    setLoading(true)
    stream.getTracks().forEach(t => t.stop())
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const form = new FormData()
      form.append('audio', blob, 'voice.webm')
      form.append('language', i18n.language)
      const res = await axios.post(`${BASE_URL}/api/voice/transcribe`, form)
      setTranscript(res.data.transcribed_text || '')
      if (res.data.detected_symptoms?.length > 0) {
        setDetected(res.data.detected_symptoms)
        onSymptomsDetected(res.data.detected_symptoms)
      }
    } catch {
      setError('Could not process voice. Try typing instead.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0d0a1a', border: '1px solid #2d1f4e', borderRadius: '14px', padding: '24px' }}>

      {/* Instruction */}
      <div style={{ fontSize: '0.78rem', color: '#7a8fa6', marginBottom: '16px', lineHeight: 1.6 }}>
        🎙 Press the button and say your symptoms in any language.<br/>
        <span style={{ color: '#4a5f73' }}>e.g. "I have fever and headache for 2 days"</span>
      </div>

      {/* Record button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={recording ? stopRecording : startRecording} disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 24px', borderRadius: '10px', border: 'none',
            background: recording
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            color: 'white', fontWeight: 700, fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Space Grotesk, sans-serif',
            opacity: loading ? 0.5 : 1,
            boxShadow: recording
              ? '0 0 20px rgba(239,68,68,0.4)'
              : '0 4px 16px rgba(124,58,237,0.35)',
            animation: recording ? 'pulse 1.2s ease infinite' : 'none',
            transition: 'all 0.2s'
          }}>
          <span style={{ fontSize: '1.1rem' }}>{recording ? '⏹' : '🎙'}</span>
          {recording ? 'Stop Recording' : 'Start Recording'}
        </button>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 600 }}>
            <div style={{
              width: '14px', height: '14px',
              border: '2px solid rgba(167,139,250,0.3)',
              borderTopColor: '#a78bfa', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite'
            }} />
            Processing...
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={{
          marginTop: '16px', padding: '14px',
          background: '#0d1117', border: '1px solid #2d1f4e', borderRadius: '10px'
        }}>
          <div style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Heard
          </div>
          <div style={{ fontSize: '0.9rem', color: '#e8f0fe', lineHeight: 1.6 }}>{transcript}</div>
        </div>
      )}

      {/* Detected symptoms */}
      {detected.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '0.68rem', color: '#00d4ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            ✓ Detected symptoms — added automatically
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {detected.map((s, i) => (
              <span key={i} style={{
                fontSize: '0.8rem', padding: '4px 12px', borderRadius: '999px',
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
                color: '#00d4ff', fontWeight: 600
              }}>{s.symptom}</span>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)',
          borderRadius: '10px', fontSize: '0.82rem', color: '#ff4757'
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  )
}