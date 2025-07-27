import React, { useState, useEffect } from 'react'
import { useStateTogether, useConnectedUsers, useStateTogetherWithPerUserValues, useJoinUrl, useLeaveSession } from 'react-together'
import Game from '../Game.jsx'

export default function LobbyRoomReactTogether() {
  const [lobbyState, setLobbyState] = useStateTogether('lobby-state', {
    name: '',
    maxPlayers: 2,
    isActive: false,
    createdAt: null,
    gameStarted: false
  })

  const [playerReady, setPlayerReady, allPlayerReady] = useStateTogetherWithPerUserValues('player-ready', false)
  
  const connectedUsers = useConnectedUsers()
  const isHost = connectedUsers && connectedUsers[0]?.isYou
  const joinUrl = useJoinUrl()
  const leaveSession = useLeaveSession()
  
  const isLobbyFull = connectedUsers.length >= (lobbyState?.maxPlayers || 2)
  const canJoinLobby = connectedUsers.length <= (lobbyState?.maxPlayers || 2)
  
  React.useEffect(() => {
    if (connectedUsers.length > (lobbyState?.maxPlayers || 2)) {
      const maxPlayers = lobbyState?.maxPlayers || 2
      const currentUser = connectedUsers.find(u => u.isYou)
      const currentUserIndex = connectedUsers.findIndex(u => u.isYou)
      
      if (currentUserIndex >= maxPlayers) {
        console.log(`QUANTUM FLUX OVERLOAD (${connectedUsers.length}/${maxPlayers}). TERMINATING EXCESS ENTITY.`)
        leaveSession()
      }
    }
  }, [connectedUsers.length, lobbyState?.maxPlayers, leaveSession])

  const [showInvite, setShowInvite] = useState(false)

  const getUserDisplayName = (user) => {
    if (!user?.id) return 'UNKNOWN ENTITY'
    // Use Player 1 and Player 2 based on connection order
    const userIndex = connectedUsers.findIndex(u => u.id === user.id)
    return `PLAYER ${userIndex + 1}`
  }

  const handleToggleReady = () => {
    setPlayerReady(!playerReady)
  }

  const handleLeave = async () => {
    if (confirm('🚨 TERMINATE QUANTUM CONNECTION? 🚨')) {
      try {
        await leaveSession()
        
        setLobbyState({
          name: '',
          maxPlayers: 2,
          isActive: false,
          createdAt: null,
          gameStarted: false
        })
        
        const newUrl = new URL(window.location)
        newUrl.search = ''
        window.history.pushState({}, '', newUrl)
        
        window.dispatchEvent(new CustomEvent('lobby-session-reset'))
        
      } catch (error) {
        console.error('QUANTUM FLUX ERROR:', error)
        window.location.reload()
      }
    }
  }

  const copyJoinUrl = () => {
    if (joinUrl) {
      navigator.clipboard.writeText(joinUrl)
      alert('🌟 QUANTUM SIGNATURE COPIED! 🌟')
    }
  }

  const readyCount = Object.values(allPlayerReady || {}).filter(Boolean).length
  const allReady = (connectedUsers?.length || 0) >= 2 && readyCount === (connectedUsers?.length || 0)

  if (lobbyState?.gameStarted) {
    return <Game />
  }
  
  const currentUserIndex = connectedUsers.findIndex(u => u.isYou)
  const maxPlayers = lobbyState?.maxPlayers || 2
  
  if (connectedUsers.length > maxPlayers && currentUserIndex >= maxPlayers) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '3rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '3px solid #ff006e',
          borderRadius: '20px',
          padding: '3rem 2rem',
          maxWidth: '500px',
          boxShadow: '0 0 50px rgba(255, 0, 110, 0.5)',
          color: '#fff',
          fontFamily: 'Courier New, monospace'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ color: '#ff006e', marginBottom: '1rem', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>QUANTUM FLUX OVERLOAD!</h1>
          <p style={{ color: '#06ffa5', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
            DIMENSION PORTAL AT MAXIMUM CAPACITY
          </p>
          <div style={{
            background: 'rgba(255, 0, 110, 0.2)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '2px solid #ff006e'
          }}>
            <strong style={{ color: '#ff006e', fontSize: '1.5rem' }}>{connectedUsers.length}/{maxPlayers}</strong>
            <span style={{ color: '#fff', marginLeft: '0.5rem' }}> QUANTUM ENTITIES ACTIVE</span>
          </div>
          <p style={{ color: '#8338ec', fontSize: '1rem', marginBottom: '2rem', fontWeight: '600' }}>
            QUANTUM FLUX DISRUPTION DETECTED. CREATE NEW DIMENSION PORTAL.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                window.history.replaceState({}, '', window.location.pathname)
                window.location.reload()
              }}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(45deg, #ff006e, #8338ec)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 0 20px rgba(255, 0, 110, 0.5)'
              }}
            >
              🔥 CREATE NEW PORTAL
            </button>
            <button 
              onClick={() => window.location.href = window.location.origin}
              style={{
                padding: '1rem 2rem',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                border: '2px solid #8338ec',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              🏠 QUANTUM EXIT
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lobby-room">
      <div className="lobby-header">
        <div className="lobby-info">
          <h2>🔥 {lobbyState?.name || 'QUANTUM LOADING...'} 🔥</h2>
          <div className="lobby-meta">
            <span className="player-count" style={{
              color: isLobbyFull ? '#ff006e' : '#06ffa5',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              ⚡ {connectedUsers?.length || 0}/{lobbyState?.maxPlayers || 2} QUANTUM ENTITIES
              {isLobbyFull && ' 🚫 FLUX OVERLOAD'}
            </span>

            <span style={{ fontSize: '0.9rem', opacity: 0.8, fontWeight: '600' }}>
              🌟 QUANTUM ENTANGLEMENT ACTIVE
            </span>
          </div>
        </div>
        
        <div className="lobby-actions">
          <button 
            className="invite-btn"
            onClick={() => setShowInvite(!showInvite)}
            disabled={isLobbyFull}
            style={{
              opacity: isLobbyFull ? 0.5 : 1,
              cursor: isLobbyFull ? 'not-allowed' : 'pointer'
            }}
            title={isLobbyFull ? 'QUANTUM FLUX OVERLOAD - NO MORE ENTITIES ALLOWED' : 'INVITE QUANTUM BEINGS'}
          >
            🌟 {isLobbyFull ? 'OVERLOAD' : 'INVITE'}
          </button>
          <button 
            className="leave-btn"
            onClick={handleLeave}
          >
            🚪 QUANTUM EXIT
          </button>
          {isHost && (
            <button
              className="start-game-btn"
              style={{ 
                marginLeft: '1rem', 
                background: 'linear-gradient(45deg, #06ffa5, #3a86ff)', 
                color: '#000', 
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer'
              }}
              onClick={() => setLobbyState(state => ({ ...state, gameStarted: true }))}
              disabled={connectedUsers.length < 2}
            >
              🚀 INITIATE QUANTUM GAME
            </button>
          )}
        </div>
      </div>

      {showInvite && joinUrl && (
        <div className="invite-section">
          <h3>🌐 INVITE QUANTUM BEINGS</h3>
          <div className="join-url-container">
            <input
              type="text"
              value={joinUrl}
              readOnly
              className="join-url"
            />
            <button onClick={copyJoinUrl} className="copy-btn">
              🌟 COPY QUANTUM SIGNATURE
            </button>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: '#06ffa5', fontWeight: '600' }}>
            🚀 REAL-TIME QUANTUM ENTANGLEMENT POWERED BY NEURAL SYNC
          </p>
        </div>
      )}

      <div className="lobby-content">
        <div className="players-section">
          <h3>QUANTUM ENTITIES ({connectedUsers?.length || 0}/{lobbyState?.maxPlayers || 2})</h3>
          
          <div className="players-list">
            {(connectedUsers || []).map(user => {
              const userId = user?.userId || user?.id
              const isReady = (allPlayerReady || {})[userId] || false
              return (
                <div key={userId || Math.random()} className={`player-card ${isReady ? 'ready' : ''}`}>
                  <div className="player-info">
                    <span className="player-name">
                      {getUserDisplayName(user)} {user?.isYou && '(YOUR QUANTUM SELF)'}
                    </span>
                    <span className="player-status">
                      {isReady ? '✅ QUANTUM READY' : '⏳ QUANTUM STANDBY'}
                    </span>
                  </div>
                  {user?.isYou && (
                    <button
                      className={`ready-btn ${isReady ? 'ready' : ''}`}
                      onClick={handleToggleReady}
                    >
                      {isReady ? 'QUANTUM STANDBY' : 'QUANTUM READY'}
                    </button>
                  )}
                </div>
              )
            })}
            
            {Array.from({ length: Math.max(0, (lobbyState?.maxPlayers || 2) - (connectedUsers?.length || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="player-card empty">
                <div className="player-info">
                  <span className="player-name">AWAITING QUANTUM ENTITY...</span>
                </div>
              </div>
            ))}
          </div>

          {allReady && (
            <div className="all-ready-banner">
              🌟 ALL QUANTUM ENTITIES READY! GAME INITIATION POSSIBLE!
              <div style={{ fontSize: '1rem', marginTop: '0.5rem', opacity: 0.9, fontWeight: '600' }}>
                🚀 QUANTUM ENTANGLEMENT SYNCHRONIZED
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
