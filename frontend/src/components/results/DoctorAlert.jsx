import { useTranslation } from 'react-i18next'

const ALERTS = {
  en: "Your symptoms suggest you should see a doctor today. Please do not delay.",
  ta: "உங்கள் அறிகுறிகள் மோசமாக உள்ளன. இன்றே மருத்துவரை சந்தியுங்கள்.",
  ml: "നിങ്ങളുടെ ലക്ഷണങ്ങൾ ഗുരുതരമാണ്. ഇന്ന് തന്നെ ഡോക്ടറെ കാണുക.",
  hi: "आपके लक्षण गंभीर हैं। आज ही डॉक्टर से मिलें।"
}

export default function DoctorAlert({ language }) {
  return (
    <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3">
      <span className="text-2xl">🚨</span>
      <p className="text-red-700 font-medium text-sm">{ALERTS[language] || ALERTS.en}</p>
    </div>
  )
}
