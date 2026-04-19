import axios from 'axios'

// In dev, Vite proxies /api → http://127.0.0.1:5000
// In production, FastAPI serves both the API and the built React files
const api = axios.create({ baseURL: '/' })

export default api
