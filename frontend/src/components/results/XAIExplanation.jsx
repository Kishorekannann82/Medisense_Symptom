import { useTranslation } from 'react-i18next'

export default function XAIExplanation({ explanations }) {
  const { t } = useTranslation()
  const impactColor = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-green-400' }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h4 className="text-sm font-medium text-gray-600 mb-3">{t('why_this')}</h4>
      <div className="space-y-2">
        {explanations?.slice(0, 4).map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm text-gray-700 w-28 truncate">{e.symptom}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${impactColor[e.impact] || 'bg-gray-400'}`}
                style={{ width: `${e.weight * 100}%` }} />
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded ${e.impact === 'high' ? 'bg-red-100 text-red-600' : e.impact === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
              {e.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
