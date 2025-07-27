# 🔥 COSMIC VOID GATEWAY

A real-time collaborative gaming portal built with React Together and Multisynq. Create and join lobbies for 2 players with live chat, ready states, and session sharing.

## Features

- **Create Lobbies**: Set up gaming portals with automatic player assignment
- **Real-time Collaboration**: Powered by React Together for instant synchronization
- **Live Chat**: Built-in chat system for lobby communication
- **Ready States**: Players can mark themselves as ready
- **Session Sharing**: Share lobby URLs for easy joining
- **Snake Battle Game**: Built-in two-player snake game
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- React Together API key (get free at [multisynq.io/coder](https://multisynq.io/coder))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API key:
   - Copy `.env` file
   - Replace `your_api_key_here` with your actual React Together API key

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Creating a Lobby

1. Click "ACTIVATE QUANTUM PORTAL"
2. Share the generated URL with friends
3. Wait for Player 2 to join
4. Mark yourself as ready
5. Start the game when both players are ready

### Joining a Lobby

1. Click on a shared lobby URL
2. Join the lobby and chat with other players
3. Mark yourself as ready when prepared
4. Start the game when both players are ready

## Technology Stack

- **React**: Frontend framework
- **React Together**: Real-time collaboration
- **Multisynq**: Synchronization infrastructure
- **Vite**: Build tool and dev server
- **CSS3**: Modern styling with gradients and animations

## API Reference

This app uses React Together hooks:

- `useStateTogether`: Synchronized state across users
- `useConnectedUsers`: Track connected users
- `useFunctionTogether`: Synchronized function calls
- `useCreateRandomSession`: Create new sessions
- `useJoinUrl`: Get shareable URLs
- `useLeaveSession`: Leave current session

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this code for your own projects.

## Credits

**by sabodev** 🌟
