import { useTranslation } from 'react-i18next'

export default function MedicineCard({ data }) {
  const { t } = useTranslation()
  if (!data) return null

  return (
    <div className="space-y-3">
      {data.home_remedies?.length > 0 && (
        <div className="bg-green-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-green-700 mb-2">{t('home_remedy')}</h4>
          {data.home_remedies.map((r, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm font-medium text-green-800">{r.remedy}</p>
              <p className="text-xs text-green-600">{r.instructions}</p>
            </div>
          ))}
        </div>
      )}
      {data.otc_medicines?.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2">{t('medicine')}</h4>
          {data.otc_medicines.map((m, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm font-medium text-blue-800">{m.name} <span className="font-normal text-xs">({m.dosage})</span></p>
              <p className="text-xs text-blue-600">{m.frequency}</p>
              {m.warnings?.length > 0 && <p className="text-xs text-amber-600 mt-0.5">⚠ {m.warnings[0]}</p>}
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">{data.disclaimer}</p>
        </div>
      )}
    </div>
  )
}
