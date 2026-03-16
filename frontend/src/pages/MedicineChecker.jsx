import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const COMMON_MEDICINES = [
  "Crocin","Dolo 650","Combiflam","Brufen","Aspirin",
  "Cetcip","Pan 40","Gelusil","Digene","Electral ORS",
  "Metformin","Salbutamol","Vitamin D3","Iron tablets",
  "Azithromycin","Amoxicillin","Ciprofloxacin","Alcohol"
]

const SEV_COLOR = { high:'#ff4757', moderate:'#ffb800', low:'#00ff88', safe:'#00ff88' }

const inputStyle = {
  padding:'9px 14px', border:'1px solid #1e2d3d', borderRadius:'10px',
  background:'#0d1117', color:'#e8f0fe',
  fontFamily:'Space Grotesk, sans-serif', fontSize:'0.875rem', outline:'none'
}

export default function MedicineChecker() {
  const navigate      = useNavigate()
  const uploadRef     = useRef()   // ONLY for initial upload
  const changeRef     = useRef()   // ONLY for change photo

  const [tab, setTab]             = useState('manual')
  const [medicines, setMedicines] = useState([])
  const [input, setInput]         = useState('')
  const [age, setAge]             = useState('')
  const [conditions, setConditions] = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const [prescFile, setPrescFile]       = useState(null)
  const [prescPreview, setPrescPreview] = useState(null)
  const [prescLoading, setPrescLoading] = useState(false)
  const [prescResult, setPrescResult]   = useState(null)

  const handleInput = (val) => {
    setInput(val)
    setSuggestions(val.length >= 1
      ? COMMON_MEDICINES.filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0,5)
      : [])
  }

  const addMedicine = (med) => {
    const m = med.trim()
    if (!m || medicines.find(x => x.toLowerCase()===m.toLowerCase())) return
    setMedicines(prev => [...prev, m])
    setInput(''); setSuggestions([])
  }

  const removeMedicine = (idx) => setMedicines(prev => prev.filter((_,i)=>i!==idx))

  const checkInteractions = async () => {
    if (medicines.length < 2) { alert('Add at least 2 medicines'); return }
    setLoading(true); setResult(null)
    try {
      const res = await axios.post(`${BASE_URL}/api/medicine-check/check`, {
        medicines, language:'en',
        age: age ? parseInt(age) : null,
        conditions: conditions || ""
      })
      setResult(res.data)
    } catch { alert('Backend error') }
    finally { setLoading(false) }
  }

  // ── Prescription ─────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPrescFile(file)
    setPrescPreview(URL.createObjectURL(file))
    setPrescResult(null)
  }

  const readPrescription = async () => {
    if (!prescFile) {
      alert('Please select a prescription photo first')
      return
    }
    setPrescLoading(true)
    try {
      const form = new FormData()
      form.append('image', prescFile)
      form.append('language', 'en')
      const res = await axios.post(`${BASE_URL}/api/prescription/read`, form)
      setPrescResult(res.data)
      if (res.data.medicines?.length > 0) {
        const names = res.data.medicines.map(m => m.name).filter(Boolean)
        setMedicines(prev => {
          const existing = prev.map(p => p.toLowerCase())
          const newOnes  = names.filter(n => !existing.includes(n.toLowerCase()))
          return [...prev, ...newOnes]
        })
      }
    } catch(e) {
      console.error(e)
      alert('Could not read prescription. Try a clearer photo.')
    } finally {
      setPrescLoading(false)
    }
  }

  const TABS = [
    { id:'manual',       icon:'💊', label:'Type Medicines'       },
    { id:'prescription', icon:'📄', label:'Upload Prescription'  },
  ]

  return (
    <div className="page">
      <button className="back-btn" onClick={()=>navigate('/')}>← Back</button>

      <div className="hero" style={{marginBottom:'28px'}}>
        <div className="hero-eyebrow">💊 Medicine Safety</div>
        <h1><span className="block">Medicine</span><span className="block cyan">Interaction Check.</span></h1>
        <p>Check if your medicines are safe together.<br/>
          <span style={{color:'#4a5f73',fontSize:'0.82rem'}}>
            Type names from your strip, or photo your prescription
          </span>
        </p>
      </div>

      {/* Tabs */}
      <div className="tab-row" style={{marginBottom:'20px'}}>
        {TABS.map(t=>(
          <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ PRESCRIPTION TAB ══════════════════════════════ */}
      {tab==='prescription' && (
        <div className="card" style={{marginBottom:'16px'}}>
          <div className="card-body">

            {/* Instructions */}
            <div style={{background:'rgba(0,212,255,0.05)',border:'1px solid rgba(0,212,255,0.12)',borderRadius:'10px',padding:'12px',marginBottom:'20px'}}>
              <div style={{fontSize:'0.78rem',color:'#7a8fa6',lineHeight:1.9}}>
                📸 Take a clear photo of your doctor's prescription<br/>
                🤖 AI reads all medicine names automatically<br/>
                ✅ We check which combinations are safe
              </div>
            </div>

            {/* Step 1 — Select photo */}
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>
                Step 1 — Select prescription photo
              </div>

              {/* Hidden file input */}
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                style={{display:'none'}}
                onChange={handleFileSelect}
              />
              <input
                ref={changeRef}
                type="file"
                accept="image/*"
                style={{display:'none'}}
                onChange={handleFileSelect}
              />

              {!prescPreview ? (
                <div
                  onClick={()=>uploadRef.current?.click()}
                  style={{
                    border:'1.5px dashed #1e2d3d', borderRadius:'12px',
                    padding:'40px 20px', textAlign:'center', cursor:'pointer',
                    transition:'all 0.15s'
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#00d4ff'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#1e2d3d'}
                >
                  <div style={{fontSize:'3rem',marginBottom:'10px'}}>📄</div>
                  <div style={{fontSize:'0.9rem',fontWeight:600,color:'#7a8fa6',marginBottom:'4px'}}>
                    Tap to select prescription photo
                  </div>
                  <div style={{fontSize:'0.75rem',color:'#4a5f73'}}>
                    JPG or PNG — doctor's handwritten or printed prescription
                  </div>
                </div>
              ) : (
                <div>
                  <img src={prescPreview} alt="prescription" style={{
                    width:'100%', maxHeight:'280px', objectFit:'contain',
                    borderRadius:'10px', border:'1px solid rgba(0,212,255,0.25)',
                    background:'#0d1117', marginBottom:'10px'
                  }}/>
                  <button
                    onClick={()=>changeRef.current?.click()}
                    style={{
                      padding:'7px 16px', borderRadius:'8px',
                      border:'1px solid #1e2d3d', background:'transparent',
                      color:'#7a8fa6', cursor:'pointer', fontSize:'0.78rem',
                      fontFamily:'Space Grotesk, sans-serif', fontWeight:600
                    }}>
                    📷 Change Photo
                  </button>
                </div>
              )}
            </div>

            {/* Step 2 — Read button */}
            <div>
              <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>
                Step 2 — Read prescription
              </div>
              <button
                onClick={readPrescription}
                disabled={!prescFile || prescLoading}
                style={{
                  width:'100%', padding:'14px', borderRadius:'10px', border:'none',
                  background: (!prescFile || prescLoading)
                    ? '#1a2332'
                    : 'linear-gradient(135deg,#00d4ff,#0099cc)',
                  color: (!prescFile || prescLoading) ? '#4a5f73' : '#080c10',
                  fontWeight:700, fontSize:'0.95rem',
                  cursor: (!prescFile || prescLoading) ? 'not-allowed' : 'pointer',
                  fontFamily:'Space Grotesk, sans-serif',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  transition:'all 0.2s'
                }}>
                {prescLoading
                  ? <><div className="spinner" style={{borderTopColor:'#4a5f73'}}/> Reading prescription...</>
                  : prescFile
                    ? '🤖 Read Prescription Now'
                    : '← Select a photo first'
                }
              </button>
            </div>

            {/* Result */}
            {prescResult && (
              <div style={{marginTop:'20px'}}>
                {!prescResult.readable || !prescResult.success ? (
                  <div style={{padding:'14px',background:'rgba(255,71,87,0.08)',border:'1px solid rgba(255,71,87,0.2)',borderRadius:'10px',color:'#ff4757',fontSize:'0.875rem'}}>
                    ⚠ Could not read prescription clearly. Try a clearer photo in good lighting.
                  </div>
                ) : (
                  <div>
                    {(prescResult.doctor || prescResult.diagnosis) && (
                      <div style={{background:'#0d1117',border:'1px solid #1e2d3d',borderRadius:'10px',padding:'12px',marginBottom:'12px'}}>
                        {prescResult.doctor    && <div style={{fontSize:'0.78rem',color:'#7a8fa6',marginBottom:'4px'}}>👨‍⚕️ <span style={{color:'#00d4ff'}}>{prescResult.doctor}</span></div>}
                        {prescResult.diagnosis && <div style={{fontSize:'0.78rem',color:'#7a8fa6'}}>🏥 Diagnosis: <span style={{color:'#e8f0fe'}}>{prescResult.diagnosis}</span></div>}
                      </div>
                    )}

                    <div style={{fontSize:'0.68rem',color:'#00ff88',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>
                      ✓ {prescResult.medicines?.length} medicines found — added to checker
                    </div>

                    {prescResult.medicines?.map((med,i)=>(
                      <div key={i} style={{background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.15)',borderRadius:'10px',padding:'12px',marginBottom:'8px'}}>
                        <div style={{fontWeight:700,color:'#e8f0fe',marginBottom:'4px'}}>
                          💊 {med.name}
                          {med.dosage && <span style={{color:'#00d4ff',fontSize:'0.82rem',marginLeft:'8px'}}>— {med.dosage}</span>}
                        </div>
                        {med.frequency && <div style={{fontSize:'0.78rem',color:'#00ff88'}}>⏰ {med.frequency}</div>}
                        {med.duration  && <div style={{fontSize:'0.78rem',color:'#7a8fa6'}}>📅 {med.duration}</div>}
                      </div>
                    ))}

                    {prescResult.notes && (
                      <div style={{background:'rgba(255,184,0,0.06)',border:'1px solid rgba(255,184,0,0.2)',borderRadius:'10px',padding:'12px',marginTop:'8px'}}>
                        <div style={{fontSize:'0.72rem',color:'#ffb800',fontWeight:700,marginBottom:'4px'}}>📝 Doctor's Notes</div>
                        <div style={{fontSize:'0.82rem',color:'rgba(255,184,0,0.8)'}}>{prescResult.notes}</div>
                      </div>
                    )}

                    <button onClick={()=>setTab('manual')} style={{
                      marginTop:'16px', width:'100%', padding:'12px',
                      borderRadius:'10px', border:'1.5px solid #00d4ff',
                      background:'rgba(0,212,255,0.08)', color:'#00d4ff',
                      fontWeight:700, cursor:'pointer',
                      fontFamily:'Space Grotesk, sans-serif', fontSize:'0.875rem'
                    }}>
                      🔍 Check These for Interactions →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MANUAL TAB ════════════════════════════════════ */}
      {tab==='manual' && (
        <>
          <div className="card" style={{marginBottom:'16px'}}>
            <div className="card-body">
              <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>
                Your medicines ({medicines.length} added)
              </div>

              {medicines.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'14px'}}>
                  {medicines.map((m,i)=>(
                    <span key={i} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',background:'rgba(0,212,255,0.08)',border:'1px solid rgba(0,212,255,0.2)',borderRadius:'999px',fontSize:'0.82rem',color:'#00d4ff',fontWeight:600}}>
                      💊 {m}
                      <button onClick={()=>removeMedicine(i)} style={{background:'none',border:'none',color:'#00d4ff',cursor:'pointer',opacity:0.6,fontSize:'1.1rem',lineHeight:1}}>×</button>
                    </span>
                  ))}
                </div>
              )}

              <div style={{fontSize:'0.65rem',color:'#4a5f73',marginBottom:'8px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Tap to add</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'14px'}}>
                {COMMON_MEDICINES.map(m=>{
                  const added = medicines.find(x=>x.toLowerCase()===m.toLowerCase())
                  return (
                    <button key={m}
                      onClick={()=>added ? removeMedicine(medicines.findIndex(x=>x.toLowerCase()===m.toLowerCase())) : addMedicine(m)}
                      style={{padding:'5px 12px',borderRadius:'999px',cursor:'pointer',fontSize:'0.78rem',fontWeight:500,transition:'all 0.15s',fontFamily:'Space Grotesk, sans-serif',border:added?'1px solid #00d4ff':'1px solid #1e2d3d',background:added?'rgba(0,212,255,0.15)':'#0d1117',color:added?'#00d4ff':'#7a8fa6'}}>
                      {added?'✓ ':''}{m}
                    </button>
                  )
                })}
              </div>

              <div style={{position:'relative'}}>
                <div className="symptom-input-row">
                  <input value={input} onChange={e=>handleInput(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&input.trim()&&addMedicine(input)}
                    placeholder="Type any other medicine name..."/>
                  <button className="add-btn" onClick={()=>addMedicine(input)}>+</button>
                </div>
                {suggestions.length>0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:'52px',background:'#111820',border:'1px solid #1e2d3d',borderRadius:'10px',zIndex:10,overflow:'hidden',marginTop:'4px'}}>
                    {suggestions.map((s,i)=>(
                      <div key={i} onClick={()=>addMedicine(s)}
                        style={{padding:'10px 14px',fontSize:'0.875rem',color:'#e8f0fe',cursor:'pointer',borderBottom:i<suggestions.length-1?'1px solid #1e2d3d':'none'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#1a2332'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        💊 {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
                <input type="number" placeholder="Age (optional)" value={age} onChange={e=>setAge(e.target.value)} style={{...inputStyle,flex:1}}/>
                <input placeholder="Any illness? (diabetes, BP...)" value={conditions} onChange={e=>setConditions(e.target.value)} style={{...inputStyle,flex:2}}/>
              </div>
            </div>
          </div>

          <button className="check-btn" onClick={checkInteractions} disabled={loading||medicines.length<2}>
            {loading?<><div className="spinner"/><span>Checking safety...</span></>:'🔍 Check if Safe'}
          </button>
          {medicines.length<2 && <p className="check-hint">Add at least 2 medicines to check</p>}

          {result && (
            <div style={{marginTop:'28px'}}>
              <div style={{padding:'20px',borderRadius:'14px',marginBottom:'20px',background:result.safe_to_take?'rgba(0,255,136,0.06)':'rgba(255,71,87,0.06)',border:`1.5px solid ${result.safe_to_take?'rgba(0,255,136,0.25)':'rgba(255,71,87,0.25)'}`}}>
                <div style={{fontSize:'1.1rem',fontWeight:700,marginBottom:'8px',color:result.safe_to_take?'#00ff88':'#ff4757'}}>
                  {result.safe_to_take?'✅ Safe to Take Together':'🚨 Dangerous Combination!'}
                </div>
                <div style={{fontSize:'0.875rem',color:'#7a8fa6',lineHeight:1.6}}>{result.summary}</div>
              </div>

              {result.interactions?.length>0 && (
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>⚠ Interactions Found</div>
                  {result.interactions.map((item,i)=>(
                    <div key={i} style={{padding:'14px 16px',borderRadius:'12px',marginBottom:'8px',background:`${SEV_COLOR[item.severity]||'#ffb800'}0a`,border:`1px solid ${SEV_COLOR[item.severity]||'#ffb800'}25`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                        <span style={{fontSize:'0.85rem',fontWeight:700,color:'#e8f0fe'}}>{item.medicines?.join(' + ')}</span>
                        <span style={{fontSize:'0.65rem',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:`${SEV_COLOR[item.severity]}20`,color:SEV_COLOR[item.severity]}}>{(item.severity||'').toUpperCase()}</span>
                      </div>
                      <div style={{fontSize:'0.82rem',color:'#7a8fa6',marginBottom:'4px'}}>{item.effect}</div>
                      {item.advice&&<div style={{fontSize:'0.78rem',color:'#00d4ff'}}>→ {item.advice}</div>}
                    </div>
                  ))}
                </div>
              )}

              {result.timing_advice?.length>0 && (
                <div style={{background:'#0d1117',border:'1px solid #1e2d3d',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
                  <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>⏰ When to Take</div>
                  {result.timing_advice.map((t,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<result.timing_advice.length-1?'1px solid #1e2d3d':'none'}}>
                      <span style={{fontSize:'0.85rem',color:'#e8f0fe',fontWeight:600}}>💊 {t.medicine}</span>
                      <span style={{fontSize:'0.78rem',color:'#00d4ff',fontWeight:600}}>{t.when}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.food_warnings?.length>0 && (
                <div style={{background:'rgba(255,184,0,0.05)',border:'1px solid rgba(255,184,0,0.2)',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
                  <div style={{fontSize:'0.68rem',color:'#ffb800',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>🍽 Food & Drink Warnings</div>
                  {result.food_warnings.map((w,i)=>(
                    <div key={i} style={{fontSize:'0.82rem',color:'rgba(255,184,0,0.8)',padding:'4px 0'}}>⚠ {w}</div>
                  ))}
                </div>
              )}

              {result.side_effects?.length>0 && (
                <div style={{background:'#0d1117',border:'1px solid #1e2d3d',borderRadius:'12px',padding:'16px'}}>
                  <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>Side Effects to Watch</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {result.side_effects.map((s,i)=>(
                      <span key={i} style={{fontSize:'0.75rem',padding:'4px 10px',borderRadius:'999px',background:'rgba(255,71,87,0.08)',border:'1px solid rgba(255,71,87,0.2)',color:'#ff8a94'}}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}