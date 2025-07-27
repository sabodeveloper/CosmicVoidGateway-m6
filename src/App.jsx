import { useStateTogether, useConnectedUsers, useIsTogether } from 'react-together'
import LobbyCreatorReactTogether from './components/LobbyCreatorReactTogether'
import LobbyRoomReactTogether from './components/LobbyRoomReactTogether'
import './App.css'

function App() {
  // Use React Together hooks for real-time collaboration
  const [lobbyState] = useStateTogether('lobby-state', {
    name: '',
    maxPlayers: 2,
    isActive: false,
    createdAt: null,
  })
  
  const connectedUsers = useConnectedUsers()
  const isTogether = useIsTogether()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔥 COSMIC VOID GATEWAY 🔥</h1>
          <div className="by-sabodev">by sabodev</div>
          <div className="connection-status">
            {isTogether ? (
              <span className="status connected">
                🌟 QUANTUM SYNC ACTIVE ({connectedUsers.length} entities)
              </span>
            ) : (
              <span className="status disconnected">
                ⚡ INITIALIZING NEURAL NETWORK...
              </span>
            )}
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {!isTogether ? (
          <div className="loading-state">
            <div className="quantum-spinner"></div>
            <p>🔮 CONNECTING TO PARALLEL DIMENSION...</p>
            <p className="sub-text">⚡ RESTORING TEMPORAL FLUX...</p>
          </div>
        ) : (!lobbyState.isActive && !lobbyState.name) ? (
          <LobbyCreatorReactTogether />
        ) : (
          <LobbyRoomReactTogether />
        )}
      </main>
    </div>
  )
}

export default App
