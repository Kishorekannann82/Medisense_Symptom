import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

const LANGUAGES = [
  { code:'en', label:'English' },
  { code:'ta', label:'தமிழ்' },
  { code:'ml', label:'മലയാളം' },
  { code:'hi', label:'हिंदी' },
]

const NAV_LINKS = [
  { path:'/',         label:'Check',   icon:'🩺' },
  { path:'/journey',  label:'Journey', icon:'📅' },
  { path:'/family',   label:'Family',  icon:'👨‍👩‍👧' },
  { path:'/medicine', label:'Medicines',icon:'💊' },
  { path:'/history',  label:'History', icon:'📋' },
]

export default function Navbar() {
  const { i18n } = useTranslation()
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <div className="brand-icon">🩺</div>
        <span><span style={{color:'#00d4ff'}}>Medi</span>Sense</span>
      </div>
      <div className="navbar-right">
        <span className="badge-pill" style={{display:'none'}}>AI-POWERED</span>
        {NAV_LINKS.map(link => (
          <button key={link.path}
            className={`nav-btn ${location.pathname===link.path?'active':''}`}
            onClick={() => navigate(link.path)}>
            {link.icon} {link.label}
          </button>
        ))}
        <select className="lang-select" value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)}>
          {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
    </nav>
  )
}