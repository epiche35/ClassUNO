/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, ChatMessage, GameState, Player, Room } from './types/game.js';
import { clearSession, getSavedSession, getSocket, saveSession } from './lib/socket.js';
import { VoiceChatManager } from './lib/webrtc.js';
import { soundManager } from './lib/audio.js';
import { Navbar } from './components/layout/Navbar.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { LobbyView } from './components/lobby/LobbyView.js';
import { UnoTable } from './components/game/UnoTable.js';
import { PlayerHand } from './components/game/PlayerHand.js';
import { ColorPickerModal } from './components/game/ColorPickerModal.js';
import { RoundOverModal } from './components/game/RoundOverModal.js';
import { CreateRoomModal } from './components/modals/CreateRoomModal.js';
import { JoinRoomModal } from './components/modals/JoinRoomModal.js';
import { HowToPlayModal } from './components/modals/HowToPlayModal.js';
import { ChatPanel } from './components/chat/ChatPanel.js';
import { VoiceControlBar } from './components/voice/VoiceControlBar.js';
import { MessageSquare, Volume2, ShieldAlert } from 'lucide-react';

export default function App() {
  const socket = getSocket();

  // App & Navigation State
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinInitialCode, setJoinInitialCode] = useState('');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);

  // Voice Chat State
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceManagerRef = useRef<VoiceChatManager | null>(null);

  // Connection alert banner
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Initial URL Params Check & Session Restoration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setJoinInitialCode(roomParam.toUpperCase());
        setIsJoinOpen(true);
      } else {
        // Attempt session restore
        const saved = getSavedSession();
        if (saved && socket.connected) {
          socket.emit(
            'room:join',
            {
              playerName: saved.playerName,
              roomCode: saved.roomCode,
              avatar: saved.playerAvatar,
              existingPlayerId: saved.playerId,
            },
            (res: any) => {
              if (res && res.success) {
                setCurrentRoom(res.room);
                setLocalPlayer(res.player);
                if (res.chatHistory) setChatMessages(res.chatHistory);
              } else {
                clearSession();
              }
            }
          );
        }
      }
    }
  }, []);

  // 2. Socket Listeners
  useEffect(() => {
    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('room:update', (updatedRoom: Room) => {
      setCurrentRoom(updatedRoom);
      // Sync local player record
      if (localPlayer) {
        const found = updatedRoom.players.find((p) => p.id === localPlayer.id);
        if (found) {
          setLocalPlayer((prev) => (prev ? { ...prev, ...found } : null));
        }
      }
    });

    socket.on('game:state', (newGameState: GameState) => {
      setGameState(newGameState);

      // Play turn alert if now local player's turn
      if (localPlayer && newGameState.currentPlayerId === localPlayer.id) {
        soundManager.playTurnAlert();
      }

      // Check if wild color picker is required for local player
      if (newGameState.wildPickerPlayerId === localPlayer?.id) {
        setIsColorPickerOpen(true);
      } else {
        setIsColorPickerOpen(false);
      }
    });

    socket.on('chat:new', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
      if (!isChatOpen && msg.playerId !== localPlayer?.id) {
        setUnreadChatCount((prev) => prev + 1);
        soundManager.playChat();
      }
    });

    socket.on('voice:speaking-state', ({ playerId, isSpeaking, micMuted }) => {
      setCurrentRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === playerId ? { ...p, isSpeaking, micMuted } : p
          ),
        };
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:update');
      socket.off('game:state');
      socket.off('chat:new');
      socket.off('voice:speaking-state');
    };
  }, [localPlayer, isChatOpen]);

  // Voice Chat Cleanup on Room Leave / Unmount
  useEffect(() => {
    return () => {
      if (voiceManagerRef.current) {
        voiceManagerRef.current.leave();
        voiceManagerRef.current = null;
      }
    };
  }, [currentRoom?.id]);

  // Handlers for Room Creation & Joining
  const handleCreateRoom = (data: {
    playerName: string;
    roomName: string;
    maxPlayers: number;
    password?: string;
    isPublic: boolean;
    avatar: string;
  }) => {
    socket.emit('room:create', data, (res: any) => {
      if (res.success) {
        setCurrentRoom(res.room);
        setLocalPlayer(res.player);
        setIsCreateOpen(false);
        saveSession({
          roomId: res.room.id,
          roomCode: res.room.code,
          playerId: res.player.id,
          playerName: res.player.name,
          playerAvatar: res.player.avatar,
        });
        soundManager.playJoin();
      } else {
        showNotification(res.error || 'Failed to create room.');
      }
    });
  };

  const handleJoinRoom = (data: {
    playerName: string;
    roomCode: string;
    password?: string;
    avatar: string;
  }) => {
    socket.emit('room:join', data, (res: any) => {
      if (res.success) {
        setCurrentRoom(res.room);
        setLocalPlayer(res.player);
        if (res.chatHistory) setChatMessages(res.chatHistory);
        setIsJoinOpen(false);
        saveSession({
          roomId: res.room.id,
          roomCode: res.room.code,
          playerId: res.player.id,
          playerName: res.player.name,
          playerAvatar: res.player.avatar,
        });
        soundManager.playJoin();
      } else {
        showNotification(res.error || 'Failed to join room.');
      }
    });
  };

  // Lobby Handlers
  const handleToggleReady = () => {
    if (!currentRoom || !localPlayer) return;
    const nextReady = !localPlayer.isReady;
    socket.emit('player:ready', {
      roomId: currentRoom.id,
      playerId: localPlayer.id,
      isReady: nextReady,
    });
    setLocalPlayer((prev) => (prev ? { ...prev, isReady: nextReady } : null));
  };

  const handleStartGame = () => {
    if (!currentRoom || !localPlayer) return;
    socket.emit('game:start', { roomId: currentRoom.id, playerId: localPlayer.id }, (res: any) => {
      if (!res.success) {
        showNotification(res.error || 'Could not start game.');
      }
    });
  };

  const handleLeaveRoom = () => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.leave();
      voiceManagerRef.current = null;
    }
    if (currentRoom && localPlayer) {
      socket.emit('room:leave', { roomId: currentRoom.id, playerId: localPlayer.id });
    }
    clearSession();
    setCurrentRoom(null);
    setLocalPlayer(null);
    setGameState(null);
    setChatMessages([]);
    setVoiceConnected(false);
  };

  // Gameplay Handlers
  const handlePlayCard = (card: Card) => {
    if (!currentRoom || !localPlayer) return;

    if (card.color === 'wild') {
      // Need color selection
      setPendingWildCard(card);
      setIsColorPickerOpen(true);
      return;
    }

    socket.emit(
      'game:play-card',
      {
        roomId: currentRoom.id,
        playerId: localPlayer.id,
        cardId: card.id,
      },
      (res: any) => {
        if (!res.success) {
          showNotification(res.error || 'Invalid move.');
        }
      }
    );
  };

  const handleSelectWildColor = (color: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!currentRoom || !localPlayer) return;

    if (pendingWildCard) {
      // Direct play with chosen color
      socket.emit(
        'game:play-card',
        {
          roomId: currentRoom.id,
          playerId: localPlayer.id,
          cardId: pendingWildCard.id,
          chosenColor: color,
        },
        (res: any) => {
          if (!res.success) {
            showNotification(res.error || 'Invalid move.');
          }
          setPendingWildCard(null);
          setIsColorPickerOpen(false);
        }
      );
    } else {
      // Waiting wild picker state
      socket.emit(
        'game:choose-color',
        {
          roomId: currentRoom.id,
          playerId: localPlayer.id,
          color,
        },
        (res: any) => {
          if (!res.success) {
            showNotification(res.error || 'Could not select color.');
          }
          setIsColorPickerOpen(false);
        }
      );
    }
  };

  const handleDrawCard = () => {
    if (!currentRoom || !localPlayer) return;
    socket.emit('game:draw-card', { roomId: currentRoom.id, playerId: localPlayer.id }, (res: any) => {
      if (!res.success) {
        showNotification(res.error || 'Cannot draw card.');
      }
    });
  };

  const handleCallUno = () => {
    if (!currentRoom || !localPlayer) return;
    socket.emit('game:uno', { roomId: currentRoom.id, playerId: localPlayer.id }, (res: any) => {
      showNotification(res.message);
    });
  };

  const handleChallengeUno = (targetPlayerId: string) => {
    if (!currentRoom || !localPlayer) return;
    socket.emit(
      'game:challenge-uno',
      {
        roomId: currentRoom.id,
        challengerId: localPlayer.id,
        targetPlayerId,
      },
      (res: any) => {
        showNotification(res.message);
      }
    );
  };

  const handleRematch = () => {
    if (!currentRoom || !localPlayer) return;
    socket.emit('game:rematch', { roomId: currentRoom.id, playerId: localPlayer.id }, (res: any) => {
      if (!res.success) {
        showNotification(res.error || 'Could not start rematch.');
      }
    });
  };

  // Chat Handlers
  const handleSendMessage = (message: string) => {
    if (!currentRoom || !localPlayer) return;
    socket.emit('chat:send', { roomId: currentRoom.id, playerId: localPlayer.id, message });
  };

  // Voice Chat Handlers
  const handleJoinVoice = async () => {
    if (!currentRoom || !localPlayer) return;
    setVoiceError(null);

    if (!voiceManagerRef.current) {
      voiceManagerRef.current = new VoiceChatManager({
        socket,
        roomId: currentRoom.id,
        localPlayerId: localPlayer.id,
        onSpeakingChange: (speaking) => setVoiceSpeaking(speaking),
        onError: (err) => setVoiceError(err),
        onStatusChange: (conn, muted) => {
          setVoiceConnected(conn);
          setVoiceMuted(muted);
        },
      });
    }

    const success = await voiceManagerRef.current.join();
    if (success) {
      setVoiceConnected(true);
    }
  };

  const handleLeaveVoice = () => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.leave();
      setVoiceConnected(false);
      setVoiceSpeaking(false);
    }
  };

  const handleToggleMute = () => {
    if (voiceManagerRef.current) {
      const isMuted = voiceManagerRef.current.toggleMute();
      setVoiceMuted(isMuted);
    }
  };

  const isMyTurn = Boolean(
    gameState && localPlayer && gameState.currentPlayerId === localPlayer.id && gameState.status === 'PLAYING'
  );

  const playersInVoice = currentRoom?.players.filter((p) => p.voiceConnected) || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#090b10] text-slate-100 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenJoin={() => setIsJoinOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onNavigateHome={() => {
          if (!currentRoom) return;
          if (confirm('Leave current room and return to homepage?')) {
            handleLeaveRoom();
          }
        }}
        inGame={Boolean(currentRoom)}
      />

      {/* Connection Alert Banner */}
      {connectionStatus !== 'connected' && (
        <div className="w-full bg-amber-500 text-slate-950 font-semibold text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Connection lost. Reconnecting to server...</span>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 py-2 px-5 rounded-2xl bg-slate-900/95 border border-rose-500/40 text-rose-300 font-medium text-xs sm:text-sm shadow-2xl backdrop-blur-md animate-bounce">
          {notification}
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex relative w-full overflow-hidden">
        {!currentRoom ? (
          /* 1. Landing Page */
          <LandingPage
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenJoin={(code) => {
              if (code) setJoinInitialCode(code);
              setIsJoinOpen(true);
            }}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          />
        ) : currentRoom.status === 'LOBBY' || !gameState || gameState.status === 'LOBBY' ? (
          /* 2. Room Lobby */
          <div className="flex-1 flex flex-col justify-between py-6">
            <LobbyView
              room={currentRoom}
              localPlayer={localPlayer!}
              onToggleReady={handleToggleReady}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
            />

            {/* Voice Bar in Lobby */}
            <div className="w-full flex justify-center pb-4">
              <VoiceControlBar
                isConnected={voiceConnected}
                isMuted={voiceMuted}
                isSpeaking={voiceSpeaking}
                playersInVoice={playersInVoice}
                onJoin={handleJoinVoice}
                onLeave={handleLeaveVoice}
                onToggleMute={handleToggleMute}
                error={voiceError}
              />
            </div>
          </div>
        ) : (
          /* 3. Active UNO Game Table */
          <div className="flex-1 flex flex-col justify-between relative game-table-felt overflow-hidden">
            {/* Top Game Header: Voice Controls & Chat Toggle */}
            <div className="w-full px-4 pt-2 flex items-center justify-between z-30">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl">
                  {currentRoom.code}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  {currentRoom.name}
                </span>
              </div>

              {/* Voice Chat Bar */}
              <VoiceControlBar
                isConnected={voiceConnected}
                isMuted={voiceMuted}
                isSpeaking={voiceSpeaking}
                playersInVoice={playersInVoice}
                onJoin={handleJoinVoice}
                onLeave={handleLeaveVoice}
                onToggleMute={handleToggleMute}
                error={voiceError}
              />

              {/* Chat Toggle Button */}
              <button
                onClick={() => {
                  setIsChatOpen(!isChatOpen);
                  setUnreadChatCount(0);
                }}
                className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                  isChatOpen
                    ? 'bg-rose-500 border-rose-400 text-white'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
                {unreadChatCount > 0 && !isChatOpen && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            </div>

            {/* Central UNO Arena */}
            <UnoTable
              gameState={gameState}
              localPlayer={localPlayer!}
              onDrawCard={handleDrawCard}
              onChallengeUno={handleChallengeUno}
              isMyTurn={isMyTurn}
            />

            {/* Bottom Current Player Hand */}
            <PlayerHand
              hand={gameState.myHand || []}
              gameState={gameState}
              localPlayer={localPlayer!}
              onPlayCard={handlePlayCard}
              onDrawCard={handleDrawCard}
              onCallUno={handleCallUno}
              isMyTurn={isMyTurn}
            />
          </div>
        )}

        {/* Real-time Slide-out Chat Panel */}
        {currentRoom && localPlayer && (
          <div
            className={`fixed sm:relative top-0 right-0 h-full z-40 transition-transform duration-300 ease-in-out ${
              isChatOpen ? 'translate-x-0' : 'translate-x-full sm:hidden'
            }`}
          >
            <ChatPanel
              messages={chatMessages}
              localPlayer={localPlayer}
              onSendMessage={handleSendMessage}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        initialCode={joinInitialCode}
        onClose={() => setIsJoinOpen(false)}
        onSubmit={handleJoinRoom}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <ColorPickerModal
        isOpen={isColorPickerOpen}
        onSelectColor={handleSelectWildColor}
      />

      {gameState && localPlayer && (
        <RoundOverModal
          gameState={gameState}
          localPlayer={localPlayer}
          onRematch={handleRematch}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}
