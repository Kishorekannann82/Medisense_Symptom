import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MedicineCard from './MedicineCard'
import XAIExplanation from './XAIExplanation'

export default function DiagnosisCard({ condition, rank }) {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = useState(rank === 1)

  const confidencePct = Math.round((condition.confidence || 0) * 100)
  const severityColor = {
    mild: 'bg-green-100 text-green-700',
    moderate: 'bg-amber-100 text-amber-700',
    severe: 'bg-red-100 text-red-700'
  }[condition.severity_level] || 'bg-gray-100 text-gray-600'

  return (
    <div className={`bg-white rounded-2xl border p-5 ${rank === 1 ? 'border-blue-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {rank === 1 && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Most likely</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full ${severityColor}`}>{condition.severity_level}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{condition.condition}</h3>
          <p className="text-sm text-gray-600 mt-1">{condition.description}</p>
        </div>
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-blue-600">{confidencePct}%</div>
          <div className="text-xs text-gray-400">confidence</div>
        </div>
      </div>

      <button onClick={() => setShowDetails(!showDetails)}
        className="mt-3 text-sm text-blue-600 hover:underline">
        {showDetails ? 'Hide details' : 'Show details'}
      </button>

      {showDetails && (
        <div className="mt-4 space-y-3">
          {condition.shap_explanation && <XAIExplanation explanations={condition.shap_explanation} />}
          {condition.medicines && <MedicineCard data={condition.medicines} />}
        </div>
      )}
    </div>
  )
}
