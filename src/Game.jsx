import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStateTogether, useConnectedUsers } from 'react-together';

const SnakeGame = () => {
  const connectedUsers = useConnectedUsers();
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  
  // Game state - synchronized across players
  const [gameState, setGameState] = useStateTogether('snake-game-state', {
    isStarted: false,
    isPaused: false,
    gameOver: false,
    winner: null,
    food: { x: 0, y: 0 },
    score: { player1: 0, player2: 0 }
  });

  // Snake states - synchronized per player
  const [snake1, setSnake1] = useStateTogether('snake1', {
    body: [{ x: 50, y: 200 }],
    direction: 'right',
    alive: true
  });

  const [snake2, setSnake2] = useStateTogether('snake2', {
    body: [{ x: 750, y: 200 }],
    direction: 'left',
    alive: true
  });

  // Local state
  const [keys, setKeys] = useState({});
  const [countdown, setCountdown] = useState(0);
  const isHost = connectedUsers && connectedUsers[0]?.isYou;
  const isPlayer1 = connectedUsers && connectedUsers[0]?.isYou;
  const isPlayer2 = connectedUsers && connectedUsers[1]?.isYou;

  // Game constants
  const GRID_SIZE = 20;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const GAME_SPEED = 150;

  // Generate random food position
  const generateFood = useCallback(() => {
    const x = Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE;
    const y = Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE;
    return { x, y };
  }, []);

  // Initialize game
  const startGame = useCallback(() => {
    if (!isHost) return;
    
    // Countdown before game starts
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        isStarted: true,
        isPaused: false,
        gameOver: false,
        winner: null,
        food: generateFood(),
        score: { player1: 0, player2: 0 }
      }));

      setSnake1({
        body: [{ x: 50, y: 200 }],
        direction: 'right',
        alive: true
      });

      setSnake2({
        body: [{ x: 750, y: 200 }],
        direction: 'left',
        alive: true
      });
    }, 3000);
  }, [isHost, setGameState, setSnake1, setSnake2, generateFood]);

  // Reset game
  const resetGame = useCallback(() => {
    if (!isHost) return;
    
    setGameState(prev => ({
      ...prev,
      isStarted: false,
      isPaused: false,
      gameOver: false,
      winner: null,
      food: { x: 0, y: 0 },
      score: { player1: 0, player2: 0 }
    }));
  }, [isHost, setGameState]);

  // Move snake
  const moveSnake = useCallback((snake, direction) => {
    const head = { ...snake.body[0] };
    
    switch (direction) {
      case 'up': head.y -= GRID_SIZE; break;
      case 'down': head.y += GRID_SIZE; break;
      case 'left': head.x -= GRID_SIZE; break;
      case 'right': head.x += GRID_SIZE; break;
      default: break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
      return { ...snake, alive: false };
    }

    // Check self collision
    if (snake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
      return { ...snake, alive: false };
    }

    const newBody = [head, ...snake.body];
    
    // Check food collision
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
      // Don't remove tail - snake grows
      setGameState(prev => ({
        ...prev,
        food: generateFood(),
        score: {
          player1: isPlayer1 ? prev.score.player1 + 1 : prev.score.player1,
          player2: isPlayer2 ? prev.score.player2 + 1 : prev.score.player2
        }
      }));
    } else {
      // Remove tail
      newBody.pop();
    }

    return { ...snake, body: newBody };
  }, [gameState.food, setGameState, generateFood, isPlayer1, isPlayer2]);

  // Check snake collision
  const checkSnakeCollision = useCallback((snake1, snake2) => {
    const head1 = snake1.body[0];
    const head2 = snake2.body[0];

    // Head to head collision
    if (head1.x === head2.x && head1.y === head2.y) {
      return { snake1: { ...snake1, alive: false }, snake2: { ...snake2, alive: false } };
    }

    // Head to body collision
    const snake1HitBody2 = snake2.body.some(segment => segment.x === head1.x && segment.y === head1.y);
    const snake2HitBody1 = snake1.body.some(segment => segment.x === head2.x && segment.y === head2.y);

    return {
      snake1: snake1HitBody2 ? { ...snake1, alive: false } : snake1,
      snake2: snake2HitBody1 ? { ...snake2, alive: false } : snake2
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameState.isStarted || gameState.isPaused || gameState.gameOver || countdown > 0) return;

    const gameLoop = () => {
      // Move snakes based on their directions
      const newSnake1 = moveSnake(snake1, snake1.direction);
      const newSnake2 = moveSnake(snake2, snake2.direction);

      // Check collision between snakes
      const collisionResult = checkSnakeCollision(newSnake1, newSnake2);

      setSnake1(collisionResult.snake1);
      setSnake2(collisionResult.snake2);

      // Check game over
      if (!collisionResult.snake1.alive || !collisionResult.snake2.alive) {
        let winner = null;
        if (!collisionResult.snake1.alive && !collisionResult.snake2.alive) {
          winner = 'TIE!';
        } else if (!collisionResult.snake1.alive) {
          winner = 'PLAYER 2 WINS!';
        } else {
          winner = 'PLAYER 1 WINS!';
        }

        setGameState(prev => ({
          ...prev,
          gameOver: true,
          winner
        }));
      }
    };

    gameLoopRef.current = setInterval(gameLoop, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isStarted, gameState.isPaused, gameState.gameOver, snake1, snake2, moveSnake, checkSnakeCollision, setSnake1, setSnake2, setGameState, countdown]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      setKeys(prev => ({ ...prev, [key]: true }));

      // Player 1 controls (WASD)
      if (isPlayer1 && snake1.alive) {
        switch (key) {
          case 'w': if (snake1.direction !== 'down') setSnake1(prev => ({ ...prev, direction: 'up' })); break;
          case 's': if (snake1.direction !== 'up') setSnake1(prev => ({ ...prev, direction: 'down' })); break;
          case 'a': if (snake1.direction !== 'right') setSnake1(prev => ({ ...prev, direction: 'left' })); break;
          case 'd': if (snake1.direction !== 'left') setSnake1(prev => ({ ...prev, direction: 'right' })); break;
          default: break;
        }
      }

      // Player 2 controls (Arrow keys)
      if (isPlayer2 && snake2.alive) {
        switch (key) {
          case 'arrowup': if (snake2.direction !== 'down') setSnake2(prev => ({ ...prev, direction: 'up' })); break;
          case 'arrowdown': if (snake2.direction !== 'up') setSnake2(prev => ({ ...prev, direction: 'down' })); break;
          case 'arrowleft': if (snake2.direction !== 'right') setSnake2(prev => ({ ...prev, direction: 'left' })); break;
          case 'arrowright': if (snake2.direction !== 'left') setSnake2(prev => ({ ...prev, direction: 'right' })); break;
          default: break;
        }
      }

      // Space to pause (host only)
      if (isHost && key === ' ' && gameState.isStarted && !gameState.gameOver) {
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      setKeys(prev => ({ ...prev, [key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlayer1, isPlayer2, snake1, snake2, setSnake1, setSnake2, isHost, gameState.isStarted, gameState.gameOver, setGameState]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background with gradient
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid with subtle pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw food (apple)
    if (gameState.food.x > 0 && gameState.food.y > 0) {
      ctx.beginPath();
      ctx.arc(gameState.food.x + GRID_SIZE/2, gameState.food.y + GRID_SIZE/2, GRID_SIZE/2, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4757';
      ctx.fill();
      ctx.strokeStyle = '#ff6b81';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Leaf on apple
      ctx.beginPath();
      ctx.moveTo(gameState.food.x + GRID_SIZE/2 + 5, gameState.food.y + GRID_SIZE/2 - 8);
      ctx.quadraticCurveTo(
        gameState.food.x + GRID_SIZE/2 + 10, gameState.food.y + GRID_SIZE/2 - 15,
        gameState.food.x + GRID_SIZE/2 + 15, gameState.food.y + GRID_SIZE/2 - 10
      );
      ctx.fillStyle = '#2ed573';
      ctx.fill();
    }

    // Draw snake 1 (green)
    snake1.body.forEach((segment, index) => {
      const isHead = index === 0;
      const size = isHead ? GRID_SIZE : GRID_SIZE - 2;
      const offset = isHead ? 0 : 1;
      
      // Body segment
      ctx.beginPath();
      ctx.roundRect(segment.x + offset, segment.y + offset, size, size, [5]);
      ctx.fillStyle = snake1.alive 
        ? (isHead ? '#00b894' : '#00d166') 
        : (isHead ? '#555' : '#444');
      ctx.fill();
      
      if (isHead) {
        // Eyes
        ctx.beginPath();
        ctx.arc(segment.x + 5, segment.y + 5, 3, 0, Math.PI * 2);
        ctx.arc(segment.x + 15, segment.y + 5, 3, 0, Math.PI * 2);
        ctx.fillStyle = snake1.alive ? 'white' : '#999';
        ctx.fill();
        
        // Pupils
        ctx.beginPath();
        ctx.arc(
          segment.x + (snake1.direction === 'left' ? 3 : snake1.direction === 'right' ? 7 : 5),
          segment.y + (snake1.direction === 'up' ? 3 : snake1.direction === 'down' ? 7 : 5),
          1.5, 0, Math.PI * 2
        );
        ctx.arc(
          segment.x + (snake1.direction === 'left' ? 13 : snake1.direction === 'right' ? 17 : 15),
          segment.y + (snake1.direction === 'up' ? 3 : snake1.direction === 'down' ? 7 : 5),
          1.5, 0, Math.PI * 2
        );
        ctx.fillStyle = 'black';
        ctx.fill();
      }
    });

    // Draw snake 2 (blue)
    snake2.body.forEach((segment, index) => {
      const isHead = index === 0;
      const size = isHead ? GRID_SIZE : GRID_SIZE - 2;
      const offset = isHead ? 0 : 1;
      
      // Body segment
      ctx.beginPath();
      ctx.roundRect(segment.x + offset, segment.y + offset, size, size, [5]);
      ctx.fillStyle = snake2.alive 
        ? (isHead ? '#0984e3' : '#74b9ff') 
        : (isHead ? '#555' : '#444');
      ctx.fill();
      
      if (isHead) {
        // Eyes
        ctx.beginPath();
        ctx.arc(segment.x + 5, segment.y + 5, 3, 0, Math.PI * 2);
        ctx.arc(segment.x + 15, segment.y + 5, 3, 0, Math.PI * 2);
        ctx.fillStyle = snake2.alive ? 'white' : '#999';
        ctx.fill();
        
        // Pupils
        ctx.beginPath();
        ctx.arc(
          segment.x + (snake2.direction === 'left' ? 3 : snake2.direction === 'right' ? 7 : 5),
          segment.y + (snake2.direction === 'up' ? 3 : snake2.direction === 'down' ? 7 : 5),
          1.5, 0, Math.PI * 2
        );
        ctx.arc(
          segment.x + (snake2.direction === 'left' ? 13 : snake2.direction === 'right' ? 17 : 15),
          segment.y + (snake2.direction === 'up' ? 3 : snake2.direction === 'down' ? 7 : 5),
          1.5, 0, Math.PI * 2
        );
        ctx.fillStyle = 'black';
        ctx.fill();
      }
    });

    // Draw countdown
    if (countdown > 0) {
      ctx.font = 'bold 72px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(countdown.toString(), CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }

    // Draw pause screen
    if (gameState.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
      
      ctx.font = '24px Arial';
      ctx.fillText('Press SPACE to continue', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    }
  }, [snake1, snake2, gameState.food, gameState.isPaused, countdown]);

  if (!gameState.isStarted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        fontFamily: '"Press Start 2P", cursive, Arial, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 0 30px rgba(0, 180, 148, 0.3)',
          border: '2px solid rgba(0, 180, 148, 0.5)'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '2rem',
            color: '#00b894',
            textShadow: '0 0 10px rgba(0, 180, 148, 0.5)',
            letterSpacing: '2px'
          }}>
            🐍 TWO-PLAYER SNAKE BATTLE
          </h1>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            marginBottom: '30px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#74b9ff',
              marginBottom: '20px'
            }}>🎮 GAME RULES</h2>
            
            <p style={{ 
              fontSize: '1.1rem', 
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              Connected Players: <span style={{ color: '#fdcb6e' }}>{connectedUsers.length}/2</span>
            </p>
            
            <div style={{ 
              textAlign: 'left', 
              marginBottom: '30px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div>
                <h3 style={{ color: '#00b894', fontSize: '1.2rem' }}>🎯 CONTROLS:</h3>
                <div style={{
                  background: 'rgba(0, 180, 148, 0.1)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginTop: '10px'
                }}>
                  <p><strong style={{ color: '#00b894' }}>PLAYER 1 (Green):</strong></p>
                  <p>W - Up</p>
                  <p>A - Left</p>
                  <p>S - Down</p>
                  <p>D - Right</p>
                </div>
              </div>
              
              <div>
                <h3 style={{ color: '#0984e3', fontSize: '1.2rem' }}>🎯 CONTROLS:</h3>
                <div style={{
                  background: 'rgba(9, 132, 227, 0.1)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginTop: '10px'
                }}>
                  <p><strong style={{ color: '#0984e3' }}>PLAYER 2 (Blue):</strong></p>
                  <p>↑ - Up</p>
                  <p>← - Left</p>
                  <p>↓ - Down</p>
                  <p>→ - Right</p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(253, 203, 110, 0.1)',
              padding: '15px',
              borderRadius: '10px',
              border: '1px solid rgba(253, 203, 110, 0.3)',
              marginBottom: '20px'
            }}>
              <p><strong style={{ color: '#fdcb6e' }}>OBJECTIVE:</strong> Eat red apples to grow!</p>
              <p><strong style={{ color: '#ff7675' }}>WARNING:</strong> Don't hit walls or other snakes!</p>
            </div>

            {connectedUsers.map((user, index) => (
              <div key={user.id} style={{
                background: index === 0 
                  ? 'rgba(0, 180, 148, 0.2)' 
                  : 'rgba(9, 132, 227, 0.2)',
                padding: '15px',
                margin: '10px 0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                border: `2px solid ${index === 0 ? '#00b894' : '#0984e3'}`,
                boxShadow: `0 0 15px ${index === 0 ? 'rgba(0, 180, 148, 0.3)' : 'rgba(9, 132, 227, 0.3)'}`
              }}>
                <span style={{ 
                  fontSize: '1.8rem',
                  filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'
                }}>
                  {index === 0 ? '🐍' : '🐍'}
                </span>
                <span style={{ 
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: index === 0 ? '#00b894' : '#0984e3'
                }}>
                  {user.nickname || `Player ${index + 1}`}
                </span>
                {user.isYou && <span style={{ 
                  fontSize: '0.9rem', 
                  background: 'rgba(255,255,255,0.2)',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  marginLeft: 'auto'
                }}>(YOU)</span>}
              </div>
            ))}
          </div>

          {isHost && connectedUsers.length === 2 ? (
            <button
              onClick={startGame}
              style={{
                background: 'linear-gradient(45deg, #00b894, #00d166)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                fontSize: '1.2rem',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 5px 20px rgba(0, 180, 148, 0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 180, 148, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 5px 20px rgba(0, 180, 148, 0.4)';
              }}
            >
              🚀 START GAME
            </button>
          ) : (
            <div style={{
              background: 'rgba(253, 203, 110, 0.2)',
              padding: '15px 30px',
              borderRadius: '50px',
              border: '2px solid #fdcb6e',
              boxShadow: '0 0 20px rgba(253, 203, 110, 0.3)',
              textAlign: 'center',
              fontSize: '1.1rem'
            }}>
              <p style={{ margin: 0 }}>
                ⏳ Waiting for {2 - connectedUsers.length} more player...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState.gameOver) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        fontFamily: '"Press Start 2P", cursive, Arial, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 0 30px rgba(255, 107, 129, 0.3)',
          border: '2px solid rgba(255, 107, 129, 0.5)'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '30px',
            color: '#ff7675',
            textShadow: '0 0 10px rgba(255, 107, 129, 0.5)'
          }}>
            🏆 GAME OVER!
          </h1>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            marginBottom: '30px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: '20px',
              color: gameState.winner.includes('1') ? '#00b894' : 
                    gameState.winner.includes('2') ? '#0984e3' : '#fdcb6e',
              textShadow: gameState.winner.includes('1') ? '0 0 10px rgba(0, 180, 148, 0.5)' :
                           gameState.winner.includes('2') ? '0 0 10px rgba(9, 132, 227, 0.5)' :
                           '0 0 10px rgba(253, 203, 110, 0.5)'
            }}>
              {gameState.winner}
            </h2>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'rgba(0, 180, 148, 0.1)',
                padding: '15px 25px',
                borderRadius: '10px',
                border: '2px solid #00b894',
                minWidth: '150px'
              }}>
                <p style={{ marginBottom: '10px', color: '#00b894' }}>PLAYER 1</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{gameState.score.player1}</p>
              </div>
              
              <div style={{
                background: 'rgba(9, 132, 227, 0.1)',
                padding: '15px 25px',
                borderRadius: '10px',
                border: '2px solid #0984e3',
                minWidth: '150px'
              }}>
                <p style={{ marginBottom: '10px', color: '#0984e3' }}>PLAYER 2</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{gameState.score.player2}</p>
              </div>
            </div>

            {isHost && (
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button
                  onClick={startGame}
                  style={{
                    background: 'linear-gradient(45deg, #00b894, #00d166)',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    fontSize: '1rem',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 5px 20px rgba(0, 180, 148, 0.4)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 180, 148, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 5px 20px rgba(0, 180, 148, 0.4)';
                  }}
                >
                  🔄 PLAY AGAIN
                </button>
                <button
                  onClick={resetGame}
                  style={{
                    background: 'linear-gradient(45deg, #ff7675, #d63031)',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    fontSize: '1rem',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 5px 20px rgba(255, 107, 129, 0.4)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 129, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 5px 20px rgba(255, 107, 129, 0.4)';
                  }}
                >
                  🏠 BACK TO LOBBY
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      fontFamily: '"Press Start 2P", cursive, Arial, sans-serif',
      padding: '20px',
      gap: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          color: '#00b894',
          textShadow: '0 0 5px rgba(0, 180, 148, 0.5)',
          margin: 0
        }}>
          🐍 SNAKE BATTLE
        </h1>
        
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          {isHost && (
            <button
              onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 15px',
                fontSize: '0.8rem',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {gameState.isPaused ? '▶ CONTINUE' : '⏸ PAUSE'}
            </button>
          )}
          
          {isHost && (
            <button
              onClick={resetGame}
              style={{
                background: 'rgba(255, 107, 129, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 107, 129, 0.5)',
                padding: '8px 15px',
                fontSize: '0.8rem',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              🏠 LOBBY
            </button>
          )}
        </div>
      </div>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '50px',
        backdropFilter: 'blur(5px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        gap: '40px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '15px',
            height: '15px',
            background: '#00b894',
            borderRadius: '50%',
            boxShadow: '0 0 10px #00b894'
          }}></div>
          <span>PLAYER 1: {gameState.score.player1}</span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '15px',
            height: '15px',
            background: '#0984e3',
            borderRadius: '50%',
            boxShadow: '0 0 10px #0984e3'
          }}></div>
          <span>PLAYER 2: {gameState.score.player2}</span>
        </div>
      </div>

      <div style={{
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        border: '3px solid rgba(255, 255, 255, 0.1)'
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
        
        {countdown > 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              fontSize: '100px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 0 20px rgba(255,255,255,0.7)'
            }}>
              {countdown}
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        marginTop: '10px'
      }}>
        <div style={{
          background: 'rgba(0, 180, 148, 0.1)',
          padding: '10px 20px',
          borderRadius: '10px',
          border: '1px solid rgba(0, 180, 148, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.8rem', marginBottom: '5px', color: '#00b894' }}>PLAYER 1</div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <kbd style={{
              background: 'rgba(0, 180, 148, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>W</kbd>
            <kbd style={{
              background: 'rgba(0, 180, 148, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>A</kbd>
            <kbd style={{
              background: 'rgba(0, 180, 148, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>S</kbd>
            <kbd style={{
              background: 'rgba(0, 180, 148, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>D</kbd>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(9, 132, 227, 0.1)',
          padding: '10px 20px',
          borderRadius: '10px',
          border: '1px solid rgba(9, 132, 227, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.8rem', marginBottom: '5px', color: '#0984e3' }}>PLAYER 2</div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <kbd style={{
              background: 'rgba(9, 132, 227, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>↑</kbd>
            <kbd style={{
              background: 'rgba(9, 132, 227, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>←</kbd>
            <kbd style={{
              background: 'rgba(9, 132, 227, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>↓</kbd>
            <kbd style={{
              background: 'rgba(9, 132, 227, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem'
            }}>→</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;