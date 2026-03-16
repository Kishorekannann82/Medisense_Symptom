import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import './i18n'
import './App.css'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import Results from './pages/Results'
import History from './pages/History'
import JourneyTracker from './pages/JourneyTracker'
import MedicineChecker from './pages/MedicineChecker'
import FamilyVault from './pages/FamilyVault'

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#080c10',color:'#00d4ff'}}>Loading...</div>}>
        <div style={{minHeight:'100vh',background:'#080c10'}}>
          <Navbar />
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/results"  element={<Results />} />
            <Route path="/history"  element={<History />} />
            <Route path="/journey"  element={<JourneyTracker />} />
            <Route path="/medicine" element={<MedicineChecker />} />
            <Route path="/family"   element={<FamilyVault />} />
          </Routes>
        </div>
      </Suspense>
    </BrowserRouter>
  )
}