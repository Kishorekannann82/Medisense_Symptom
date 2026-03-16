import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

export const checkSymptoms = (payload) =>
  api.post('/api/diagnosis/analyse', payload)

export const getSymptomList = () =>
  api.get('/api/symptom/list')

export const getMedicines = (condition, language = 'en') =>
  api.get(`/api/medicine/${condition}?language=${language}`)

export const translateText = (text, targetLang) =>
  api.post('/api/translate', { text, target_language: targetLang })

export default api
