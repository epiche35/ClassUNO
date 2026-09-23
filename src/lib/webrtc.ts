/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Socket } from 'socket.io-client';

export interface WebRTCConfig {
  socket: Socket;
  roomId: string;
  localPlayerId: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onError?: (errMessage: string) => void;
  onStatusChange?: (isConnected: boolean, isMuted: boolean) => void;
}

export class VoiceChatManager {
  private socket: Socket;
  private roomId: string;
  private localPlayerId: string;
  private localStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private isConnected: boolean = false;
  private isSpeaking: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private checkSpeakingInterval: any = null;

  private onSpeakingChange?: (isSpeaking: boolean) => void;
  private onError?: (errMessage: string) => void;
  private onStatusChange?: (isConnected: boolean, isMuted: boolean) => void;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(config: WebRTCConfig) {
    this.socket = config.socket;
    this.roomId = config.roomId;
    this.localPlayerId = config.localPlayerId;
    this.onSpeakingChange = config.onSpeakingChange;
    this.onError = config.onError;
    this.onStatusChange = config.onStatusChange;

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // When a peer joins voice, create an offer
    this.socket.on('voice:peer-joined', async ({ playerId }: { playerId: string }) => {
      if (!this.isConnected || playerId === this.localPlayerId) return;
      await this.initiateCall(playerId);
    });

    // When a peer leaves voice
    this.socket.on('voice:peer-left', ({ playerId }: { playerId: string }) => {
      this.closePeer(playerId);
    });

    // Handle signaling (offer, answer, ice-candidate)
    this.socket.on('voice:signal', async ({ fromPlayerId, signal }: { fromPlayerId: string; signal: any }) => {
      if (!this.isConnected || fromPlayerId === this.localPlayerId) return;

      try {
        let pc = this.peers.get(fromPlayerId);
        if (!pc) {
          pc = this.createPeerConnection(fromPlayerId);
        }

        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.socket.emit('voice:signal', {
              roomId: this.roomId,
              fromPlayerId: this.localPlayerId,
              targetPlayerId: fromPlayerId,
              signal: { sdp: pc.localDescription },
            });
          }
        } else if (signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('[WebRTC] Error adding ICE candidate:', e);
          }
        }
      } catch (err: any) {
        console.error('[WebRTC] Signal handling error:', err);
      }
    });
  }

  public async join(): Promise<boolean> {
    if (this.isConnected) return true;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.onError?.('Voice chat is not supported by your browser.');
        return false;
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.isConnected = true;
      this.isMuted = false;
      this.setupSpeakingDetector(this.localStream);

      this.socket.emit('voice:join', {
        roomId: this.roomId,
        playerId: this.localPlayerId,
      });

      this.onStatusChange?.(this.isConnected, this.isMuted);
      return true;
    } catch (err: any) {
      console.warn('[WebRTC] Microphone access denied or failed:', err);
      let msg = 'Could not access microphone. Please check permissions.';
      if (err.name === 'NotAllowedError') {
        msg = 'Microphone permission was denied. You can still play the card game!';
      }
      this.onError?.(msg);
      return false;
    }
  }

  public toggleMute(): boolean {
    if (!this.localStream) return this.isMuted;
    this.isMuted = !this.isMuted;

    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });

    if (this.isMuted && this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
      this.socket.emit('voice:speaking', {
        roomId: this.roomId,
        playerId: this.localPlayerId,
        isSpeaking: false,
        micMuted: true,
      });
    }

    this.onStatusChange?.(this.isConnected, this.isMuted);
    return this.isMuted;
  }

  public leave(): void {
    if (!this.isConnected) return;

    if (this.checkSpeakingInterval) {
      clearInterval(this.checkSpeakingInterval);
      this.checkSpeakingInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    for (const [playerId] of this.peers) {
      this.closePeer(playerId);
    }
    this.peers.clear();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.isConnected = false;
    this.isMuted = false;
    this.isSpeaking = false;

    this.socket.emit('voice:leave', {
      roomId: this.roomId,
      playerId: this.localPlayerId,
    });

    this.onStatusChange?.(false, false);
    this.onSpeakingChange?.(false);
  }

  private async initiateCall(targetPlayerId: string) {
    const pc = this.createPeerConnection(targetPlayerId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket.emit('voice:signal', {
        roomId: this.roomId,
        fromPlayerId: this.localPlayerId,
        targetPlayerId,
        signal: { sdp: pc.localDescription },
      });
    } catch (err) {
      console.error('[WebRTC] Call initiation failed:', err);
    }
  }

  private createPeerConnection(targetPlayerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peers.set(targetPlayerId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidate
    pc.onicecandidate = event => {
      if (event.candidate) {
        this.socket.emit('voice:signal', {
          roomId: this.roomId,
          fromPlayerId: this.localPlayerId,
          targetPlayerId,
          signal: { candidate: event.candidate },
        });
      }
    };

    // Remote Audio Stream
    pc.ontrack = event => {
      let audio = this.audioElements.get(targetPlayerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.audioElements.set(targetPlayerId, audio);
      }
      audio.srcObject = event.streams[0];
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(targetPlayerId);
      }
    };

    return pc;
  }

  private closePeer(playerId: string) {
    const pc = this.peers.get(playerId);
    if (pc) {
      pc.close();
      this.peers.delete(playerId);
    }
    const audio = this.audioElements.get(playerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      this.audioElements.delete(playerId);
    }
  }

  private setupSpeakingDetector(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.checkSpeakingInterval = setInterval(() => {
        if (!this.isConnected || this.isMuted || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const nowSpeaking = average > 22; // threshold for voice presence

        if (nowSpeaking !== this.isSpeaking) {
          this.isSpeaking = nowSpeaking;
          this.onSpeakingChange?.(nowSpeaking);
          this.socket.emit('voice:speaking', {
            roomId: this.roomId,
            playerId: this.localPlayerId,
            isSpeaking: nowSpeaking,
            micMuted: this.isMuted,
          });
        }
      }, 120);
    } catch (err) {
      console.warn('[WebRTC] Voice speaking detection disabled:', err);
    }
  }
}
