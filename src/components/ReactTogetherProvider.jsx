import { ReactTogether } from 'react-together'
import { useEffect, useState } from 'react'

export default function ReactTogetherProvider({ children }) {
  const apiKey = import.meta.env.VITE_REACT_TOGETHER_API_KEY
  const [sessionParams, setSessionParams] = useState(null)

  useEffect(() => {
    const initializeSession = () => {
      // Check URL for existing session parameters
      const urlParams = new URLSearchParams(window.location.search)
      const sessionName = urlParams.get('session')
      const sessionPassword = urlParams.get('password')
      
      if (sessionName && sessionPassword) {
        // Join existing session from URL
        setSessionParams({
          name: sessionName,
          password: sessionPassword,
          apiKey: apiKey
        })
      } else {
        // Create new session and update URL
        const newSessionName = `lobby-${Date.now()}`
        const newSessionPassword = "lobby-secure-2024"
        
        setSessionParams({
          name: newSessionName,
          password: newSessionPassword,
          apiKey: apiKey
        })
        
        // Update URL without refreshing the page
        const newUrl = new URL(window.location)
        newUrl.searchParams.set('session', newSessionName)
        newUrl.searchParams.set('password', newSessionPassword)
        window.history.pushState({}, '', newUrl)
      }
    }

    // Initialize session on mount
    initializeSession()

    // Listen for popstate events (back/forward button)
    const handlePopState = () => {
      initializeSession()
    }

    // Listen for custom session reset events
    const handleSessionReset = () => {
      setSessionParams(null)
      setTimeout(initializeSession, 100) // Small delay to ensure clean state
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('lobby-session-reset', handleSessionReset)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('lobby-session-reset', handleSessionReset)
    }
  }, [apiKey])

  if (!apiKey) {
    return (
      <div style={{
        padding: '2rem',
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#dc2626' }}>⚠️ API Key Required</h2>
        <p>Please set your React Together API key in the .env file:</p>
        <code style={{ background: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
          VITE_REACT_TOGETHER_API_KEY=api-key
        </code>
        <p>Get your free API key from: <a href="https://multisynq.io/coder" target="_blank">multisynq.io/coder</a></p>
      </div>
    )
  }

  if (!sessionParams) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Initializing session...</p>
      </div>
    )
  }

  // Function to get/generate initial nickname with persistence
  const deriveNickname = () => {
    // Try to get saved nickname from localStorage
    const savedNickname = localStorage.getItem('lobby-user-nickname')
    if (savedNickname) {
      return savedNickname
    }
    
    // Generate new random nickname if none saved
    const adjectives = ['Swift', 'Brave', 'Clever', 'Bold', 'Wise', 'Fierce', 'Noble', 'Quick', 'Strong', 'Bright']
    const animals = ['Tiger', 'Eagle', 'Lion', 'Wolf', 'Hawk', 'Bear', 'Fox', 'Shark', 'Panther', 'Dragon']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const animal = animals[Math.floor(Math.random() * animals.length)]
    return `${adj} ${animal}`
  }

  return (
    <ReactTogether
      apiKey={apiKey}
      appId="com.lobby.manager"
      sessionParams={sessionParams}
      deriveNickname={deriveNickname}
    >
      {children}
    </ReactTogether>
  )
}
