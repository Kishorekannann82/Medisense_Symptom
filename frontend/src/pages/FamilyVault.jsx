import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const RELATIONS = ['Father','Mother','Son','Daughter','Grandfather','Grandmother','Brother','Sister','Spouse','Other']
const REL_EMOJI = { Father:'👨', Mother:'👩', Son:'👦', Daughter:'👧', Grandfather:'👴', Grandmother:'👵', Brother:'👦', Sister:'👧', Spouse:'💑', Other:'👤' }

const QUICK_SYMPTOMS = [
  'Fever','Headache','Cough','Cold','Body ache','Fatigue',
  'Nausea','Stomach pain','Chest pain','Vomiting','Diarrhea',
  'Skin rash','Sore throat','Dizziness','Breathlessness'
]

const inputStyle = {
  padding:'10px 14px', border:'1px solid #1e2d3d', borderRadius:'10px',
  background:'#0d1117', color:'#e8f0fe',
  fontFamily:'Space Grotesk, sans-serif', fontSize:'0.875rem', outline:'none', width:'100%'
}

// ── Symptom Picker Popup ───────────────────────────────
function SymptomPicker({ member, vaultId, onDone, onClose }) {
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  const toggle = (s) => setSymptoms(prev =>
    prev.find(x=>x.symptom===s)
      ? prev.filter(x=>x.symptom!==s)
      : [...prev, {symptom:s, severity:5, duration_days:1}]
  )

  const save = async () => {
    if (!symptoms.length) return
    setLoading(true)
    try {
      // Get diagnosis first
      let diagnosis = 'Unknown'
      try {
        const diagRes = await axios.post(`${BASE_URL}/api/diagnosis/analyse`, { symptoms, language:'en' })
        diagnosis = diagRes.data?.diagnosis?.top_conditions?.[0]?.condition || 'Unknown'
      } catch(e) { console.log('Diagnosis skipped') }

      // Save to vault using member_id from member object
      await axios.post(
        `${BASE_URL}/api/family/${vaultId}/member/${member.member_id}/symptoms`,
        { symptoms, diagnosis }
      )
      setDone(true)
      setTimeout(()=>onDone(), 1000)
    } catch(e) {
      console.error('Save error:', e.response?.data || e.message)
      alert('Error saving. Check console.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={onClose}>
      <div style={{background:'#111820',border:'1px solid #1e2d3d',borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'420px',maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

        {done ? (
          <div style={{textAlign:'center',padding:'20px'}}>
            <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>✅</div>
            <div style={{fontSize:'1rem',fontWeight:700,color:'#00ff88'}}>Symptoms saved!</div>
            <div style={{fontSize:'0.82rem',color:'#7a8fa6',marginTop:'6px'}}>Checking for family outbreak...</div>
          </div>
        ) : (
          <>
            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px'}}>Recording symptoms for</div>
              <div style={{fontSize:'1.2rem',fontWeight:700,color:'#e8f0fe'}}>{REL_EMOJI[member.relation]||'👤'} {member.name}</div>
              <div style={{fontSize:'0.75rem',color:'#7a8fa6'}}>{member.relation} · {member.age} yrs · ID: {member.member_id}</div>
            </div>

            <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>
              Select symptoms
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'20px'}}>
              {QUICK_SYMPTOMS.map(s=>{
                const sel = symptoms.find(x=>x.symptom===s)
                return (
                  <button key={s} onClick={()=>toggle(s)} style={{
                    padding:'7px 14px',borderRadius:'999px',cursor:'pointer',
                    fontSize:'0.82rem',fontWeight:500,transition:'all 0.15s',
                    fontFamily:'Space Grotesk, sans-serif',
                    border:sel?'1.5px solid #00d4ff':'1px solid #1e2d3d',
                    background:sel?'rgba(0,212,255,0.15)':'#0d1117',
                    color:sel?'#00d4ff':'#7a8fa6'
                  }}>{sel?'✓ ':''}{s}</button>
                )
              })}
            </div>

            {symptoms.length>0 && (
              <div style={{fontSize:'0.78rem',color:'#00d4ff',marginBottom:'16px',fontWeight:600}}>
                {symptoms.length} symptom{symptoms.length>1?'s':''} selected
              </div>
            )}

            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:'10px',border:'1px solid #1e2d3d',background:'transparent',color:'#7a8fa6',cursor:'pointer',fontWeight:600,fontFamily:'Space Grotesk, sans-serif'}}>Cancel</button>
              <button onClick={save} disabled={loading||!symptoms.length} style={{
                flex:2,padding:'11px',borderRadius:'10px',border:'none',
                background:(!loading&&symptoms.length)?'linear-gradient(135deg,#00d4ff,#0099cc)':'#1a2332',
                color:(!loading&&symptoms.length)?'#080c10':'#4a5f73',
                fontWeight:700,cursor:(!loading&&symptoms.length)?'pointer':'not-allowed',
                fontFamily:'Space Grotesk, sans-serif',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'
              }}>
                {loading?<><div className="spinner" style={{width:'14px',height:'14px',borderWidth:'2px',borderTopColor:'#4a5f73'}}/> Saving...</>:'Save Symptoms ✓'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────
export default function FamilyVault() {
  const navigate = useNavigate()
  const [fullVault, setFullVault]   = useState(null)  // raw vault with member_ids
  const [summary, setSummary]       = useState(null)  // summary with alerts
  const [vaultId, setVaultId]       = useState(localStorage.getItem('family_vault_id'))
  const [loading, setLoading]       = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [newMember, setNewMember]   = useState({name:'',age:'',gender:'male',relation:'Father'})
  const [picker, setPicker]         = useState(null)  // member object from fullVault

  useEffect(()=>{ if(vaultId) loadVault() },[vaultId])

  const loadVault = async () => {
    try {
      // Load both full (for member_ids) and summary (for alerts/visit counts)
      const [fullRes, sumRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/family/${vaultId}/full`),
        axios.get(`${BASE_URL}/api/family/${vaultId}`)
      ])
      if (!fullRes.data.error) setFullVault(fullRes.data)
      if (!sumRes.data.error)  setSummary(sumRes.data)
    } catch(e) { console.error(e) }
  }

  const createVault = async () => {
    if (!familyName.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/api/family/create`, {family_name:familyName})
      const id  = res.data.vault_id
      localStorage.setItem('family_vault_id', id)
      setVaultId(id)
      setTimeout(loadVault, 300)
    } catch { alert('Error') }
    finally { setLoading(false) }
  }

  const addMember = async () => {
    if (!newMember.name||!newMember.age) return
    setLoading(true)
    try {
      await axios.post(`${BASE_URL}/api/family/${vaultId}/member`, {
        name:newMember.name, age:parseInt(newMember.age),
        gender:newMember.gender, relation:newMember.relation
      })
      setNewMember({name:'',age:'',gender:'male',relation:'Father'})
      setShowAdd(false)
      await loadVault()
    } catch { alert('Error') }
    finally { setLoading(false) }
  }

  const onSymptomDone = async () => {
    setPicker(null)
    await loadVault()
  }

  // Get visit count from summary for a member name
  const getVisits = (name) => {
    const m = summary?.members?.find(x=>x.name===name)
    return m?.total_visits || 0
  }

  const getLastDiag = (name) => {
    const m = summary?.members?.find(x=>x.name===name)
    return m?.last_diagnosis || null
  }

  // ── CREATE ─────────────────────────────────────────
  if (!vaultId) return (
    <div className="page">
      <button className="back-btn" onClick={()=>navigate('/')}>← Back</button>
      <div className="hero" style={{marginBottom:'32px'}}>
        <div className="hero-eyebrow">👨‍👩‍👧 Family Health</div>
        <h1><span className="block">Family</span><span className="block cyan">Health Vault.</span></h1>
        <p>Track your whole family's health. Get outbreak alert if 2+ members fall sick with same illness.</p>
      </div>
      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-body">
          <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',fontWeight:700}}>Name your family</div>
          <input placeholder="e.g. Kumar Family" value={familyName} onChange={e=>setFamilyName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createVault()} style={inputStyle}/>
        </div>
      </div>
      <button className="check-btn" onClick={createVault} disabled={loading||!familyName.trim()}>
        {loading?<><div className="spinner"/><span>Creating...</span></>:'👨‍👩‍👧 Create Family Vault'}
      </button>
    </div>
  )

  // ── VAULT ──────────────────────────────────────────
  const members = fullVault?.members || []

  return (
    <div className="page">
      {picker && <SymptomPicker member={picker} vaultId={vaultId} onDone={onSymptomDone} onClose={()=>setPicker(null)}/>}

      <button className="back-btn" onClick={()=>navigate('/')}>← Back</button>

      <div style={{marginBottom:'24px'}}>
        <div style={{fontSize:'0.68rem',color:'#00d4ff',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'4px',fontWeight:700}}>Family Health Vault</div>
        <h2 style={{fontSize:'1.4rem',fontWeight:700,color:'#e8f0fe'}}>{summary?.family_name||fullVault?.family_name}</h2>
        <p style={{fontSize:'0.82rem',color:'#7a8fa6',marginTop:'4px'}}>{members.length} members</p>
      </div>

      {/* Outbreak alerts */}
      {summary?.alerts?.length>0 && summary.alerts.map((alert,i)=>(
        <div key={i} style={{padding:'16px 18px',borderRadius:'14px',marginBottom:'12px',background:alert.severity==='high'?'rgba(255,71,87,0.08)':'rgba(255,184,0,0.08)',border:`1.5px solid ${alert.severity==='high'?'rgba(255,71,87,0.35)':'rgba(255,184,0,0.35)'}`}}>
          <div style={{fontSize:'1rem',fontWeight:700,color:alert.severity==='high'?'#ff4757':'#ffb800',marginBottom:'6px'}}>{alert.message}</div>
          <div style={{fontSize:'0.82rem',color:'#7a8fa6',marginBottom:'8px'}}>{alert.action}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {alert.members?.map((m,j)=>(
              <span key={j} style={{fontSize:'0.72rem',padding:'2px 10px',borderRadius:'999px',background:'rgba(255,71,87,0.1)',color:'#ff4757',border:'1px solid rgba(255,71,87,0.2)',fontWeight:600}}>{m}</span>
            ))}
          </div>
        </div>
      ))}

      {summary?.alerts?.length===0 && members.some(m=>getVisits(m.name)>0) && (
        <div style={{background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'12px',padding:'14px 16px',marginBottom:'16px'}}>
          <div style={{fontSize:'0.875rem',color:'#00ff88',fontWeight:600}}>✅ No outbreak detected — everyone looks okay!</div>
        </div>
      )}

      {/* Members */}
      {members.map((member,i)=>(
        <div key={i} style={{background:'#111820',border:'1px solid #1e2d3d',borderRadius:'14px',padding:'16px 18px',marginBottom:'10px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'12px',background:'rgba(0,212,255,0.08)',border:'1px solid rgba(0,212,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem'}}>
                {REL_EMOJI[member.relation]||'👤'}
              </div>
              <div>
                <div style={{fontWeight:700,color:'#e8f0fe',fontSize:'0.95rem'}}>{member.name}</div>
                <div style={{fontSize:'0.75rem',color:'#4a5f73',marginTop:'2px'}}>{member.relation} · {member.age} yrs</div>
                {getLastDiag(member.name) && (
                  <div style={{fontSize:'0.72rem',color:'#00d4ff',marginTop:'3px'}}>Last: {getLastDiag(member.name)}</div>
                )}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'0.72rem',color:'#4a5f73',marginBottom:'6px'}}>{getVisits(member.name)} visit{getVisits(member.name)!==1?'s':''}</div>
              <button onClick={()=>setPicker(member)} style={{padding:'7px 14px',background:'rgba(0,212,255,0.1)',border:'1px solid rgba(0,212,255,0.25)',borderRadius:'8px',color:'#00d4ff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Space Grotesk, sans-serif'}}>
                + Add Symptoms
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add member */}
      {showAdd ? (
        <div className="card" style={{marginBottom:'16px'}}>
          <div className="card-body">
            <div style={{fontSize:'0.68rem',color:'#4a5f73',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'14px',fontWeight:700}}>Add Family Member</div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Name" value={newMember.name} onChange={e=>setNewMember({...newMember,name:e.target.value})} style={inputStyle}/>
              <div style={{display:'flex',gap:'10px'}}>
                <input type="number" placeholder="Age" value={newMember.age} onChange={e=>setNewMember({...newMember,age:e.target.value})} style={{...inputStyle,flex:1}}/>
                <select value={newMember.gender} onChange={e=>setNewMember({...newMember,gender:e.target.value})} style={{...inputStyle,flex:1}}>
                  <option value="male">Male</option><option value="female">Female</option>
                </select>
              </div>
              <select value={newMember.relation} onChange={e=>setNewMember({...newMember,relation:e.target.value})} style={inputStyle}>
                {RELATIONS.map(r=><option key={r} value={r}>{REL_EMOJI[r]||'👤'} {r}</option>)}
              </select>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1px solid #1e2d3d',background:'transparent',color:'#7a8fa6',cursor:'pointer',fontFamily:'Space Grotesk, sans-serif',fontWeight:600}}>Cancel</button>
                <button onClick={addMember} disabled={loading} style={{flex:2,padding:'10px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#00d4ff,#0099cc)',color:'#080c10',fontWeight:700,cursor:'pointer',fontFamily:'Space Grotesk, sans-serif'}}>Add Member</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowAdd(true)} style={{width:'100%',padding:'14px',borderRadius:'12px',border:'1.5px dashed #1e2d3d',background:'transparent',color:'#4a5f73',fontWeight:600,cursor:'pointer',fontFamily:'Space Grotesk, sans-serif',fontSize:'0.875rem',marginTop:'4px'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#00d4ff';e.currentTarget.style.color='#00d4ff'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e2d3d';e.currentTarget.style.color='#4a5f73'}}>
          + Add Family Member
        </button>
      )}
    </div>
  )
}