import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReactTogetherProvider from './components/ReactTogetherProvider.jsx'

const apiKey = import.meta.env.VITE_REACT_TOGETHER_API_KEY

if (apiKey) {
  console.log('✅ React Together API key found:', `${apiKey.substring(0, 8)}...`)
  console.log('🚀 Initializing React Together for real-time collaboration')
} else {
  console.log('⚠️ No API key found - React Together features will be disabled')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReactTogetherProvider>
      <App />
    </ReactTogetherProvider>
  </StrictMode>,
)
