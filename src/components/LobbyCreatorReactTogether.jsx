import { useState } from 'react'
import { useStateTogether, useConnectedUsers, useCreateRandomSession, useJoinUrl } from 'react-together'

export default function LobbyCreatorReactTogether() {
  const [lobbyState, setLobbyState] = useStateTogether('lobby-state', {
    name: '',
    maxPlayers: 2,
    isActive: false,
    createdAt: null
  })

  const connectedUsers = useConnectedUsers()
  const createRandomSession = useCreateRandomSession()
  const joinUrl = useJoinUrl()

  const [localForm, setLocalForm] = useState({
    maxPlayers: 2
  })

  const [showJoinUrl, setShowJoinUrl] = useState(false)

  const handleCreateLobby = async () => {
    const newLobbyState = {
      name: 'COSMIC VOID GATEWAY',
      maxPlayers: parseInt(localForm.maxPlayers),
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    setLobbyState(newLobbyState)
    setShowJoinUrl(true)
  }

  const handleCreateNewSession = async () => {
    try {
      await createRandomSession()
      setShowJoinUrl(true)
    } catch (error) {
      console.error('Failed to create new session:', error)
      alert('💥 QUANTUM FLUX DISRUPTION! 💥')
    }
  }

  const copyJoinUrl = () => {
    if (joinUrl) {
      const customJoinUrl = joinUrl.replace(/https?:\/\/[0-9.]+:5173/, 'https://monad-devil-level.duckdns.org')
      navigator.clipboard.writeText(customJoinUrl)
      alert('🌟 QUANTUM LINK COPIED! 🌟')
    }
  }

  const displayJoinUrl = joinUrl ? joinUrl.replace(/https?:\/\/[0-9.]+:5173/, 'https://monad-devil-level.duckdns.org') : ''

  if (lobbyState.isActive) {
    return (
      <div className="lobby-creator">
        <div className="creator-card">
          <h2>🌟 QUANTUM PORTAL ACTIVATED! 🌟</h2>
          <div className="lobby-details">
            <h3>🔥 {lobbyState.name} 🔥</h3>
            <p>⚡ MAX ENTITIES: {lobbyState.maxPlayers}</p>
            <p>🌌 CONNECTED BEINGS: {connectedUsers.length}</p>
          </div>

          {showJoinUrl && joinUrl && (
            <div className="join-code-section">
              <h4>🌐 SHARE THIS QUANTUM SIGNATURE:</h4>
              <div className="join-url-container">
                <input
                  type="text"
                  value={displayJoinUrl}
                  readOnly
                  className="join-url"
                />
                <button onClick={copyJoinUrl} className="copy-btn">
                  🌟 COPY QUANTUM LINK
                </button>
              </div>
              <p className="sync-info">🚀 REAL-TIME QUANTUM ENTANGLEMENT ACTIVE</p>
            </div>
          )}

          <div className="lobby-actions">
            <button 
              onClick={handleCreateNewSession}
              className="create-btn"
            >
              🔄 GENERATE NEW QUANTUM FLUX
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lobby-creator">
      <div className="creator-card">
        <h2>🔥 CREATE QUANTUM DIMENSION PORTAL 🔥</h2>
        <p>⚡ INITIALIZE COLLABORATIVE REALITY MATRIX FOR 2 ENTITIES</p>
        
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="maxPlayers">⚡ MAXIMUM ENTITIES</label>
            <select
              id="maxPlayers"
              value={localForm.maxPlayers}
              onChange={(e) => setLocalForm(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
            >
              <option value={2}>2 QUANTUM BEINGS</option>
            </select>
          </div>

          <div className="preview-section">
            <h3>🔮 QUANTUM PREVIEW</h3>
            <div className="lobby-preview">
              <div className="preview-header">
                <span className="preview-emoji">🔥</span>
                <span className="preview-name">
                  COSMIC VOID GATEWAY
                </span>
              </div>
              <div className="preview-details">
                <span>⚡ {localForm.maxPlayers} MAX ENTITIES</span>
                <span>👤 PLAYER 1 & PLAYER 2</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreateLobby}
            className="create-btn"
          >
            🚀 ACTIVATE QUANTUM PORTAL
          </button>
        </div>

        <div className="connection-info">
          <p>🔗 CONNECTED ENTITIES: {connectedUsers.length}</p>
          <p>🚀 POWERED BY QUANTUM ENTANGLEMENT & NEURAL SYNC</p>
        </div>
      </div>
    </div>
  )
}
