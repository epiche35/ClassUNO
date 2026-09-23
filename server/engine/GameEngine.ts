/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, CardColor, CardType, GameActionLog, GameState, GameStatus, Player } from '../../src/types/game.js';

export class GameEngine {
  public roomId: string;
  public roomCode: string;
  public status: GameStatus = 'LOBBY';
  public players: Player[] = [];
  public turnIndex: number = 0;
  public turnDirection: 1 | -1 = 1;
  public currentColor: 'red' | 'blue' | 'green' | 'yellow' = 'red';
  public currentCard!: Card;
  public drawPile: Card[] = [];
  public discardPile: Card[] = [];
  public playerHands: Map<string, Card[]> = new Map();
  public winnerId?: string;
  public roundWinnerId?: string;
  public roundScores: Record<string, number> = {};
  public totalScores: Record<string, number> = {};
  public lastAction?: GameActionLog;
  public wildPickerPlayerId?: string;
  public unoCallers: Set<string> = new Set();
  public drawnThisTurn: boolean = false;

  constructor(roomId: string, roomCode: string, players: Player[]) {
    this.roomId = roomId;
    this.roomCode = roomCode;
    this.players = players.map(p => ({ ...p, cardCount: 0, calledUno: false, score: 0 }));
    players.forEach(p => {
      this.totalScores[p.id] = 0;
      this.roundScores[p.id] = 0;
    });
  }

  public static createDeck(): Card[] {
    const deck: Card[] = [];
    let idCounter = 1;
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];

    for (const color of colors) {
      // One 0 per color
      deck.push({ id: `card_${idCounter++}`, color, type: 'number', value: 0 });

      // Two of each 1-9
      for (let v = 1; v <= 9; v++) {
        deck.push({ id: `card_${idCounter++}`, color, type: 'number', value: v });
        deck.push({ id: `card_${idCounter++}`, color, type: 'number', value: v });
      }

      // Two of each action
      for (let i = 0; i < 2; i++) {
        deck.push({ id: `card_${idCounter++}`, color, type: 'skip' });
        deck.push({ id: `card_${idCounter++}`, color, type: 'reverse' });
        deck.push({ id: `card_${idCounter++}`, color, type: 'draw2' });
      }
    }

    // Wilds
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `card_${idCounter++}`, color: 'wild', type: 'wild' });
      deck.push({ id: `card_${idCounter++}`, color: 'wild', type: 'wild4' });
    }

    return deck;
  }

  public static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public startRound(): void {
    if (this.players.length < 2) {
      throw new Error('At least 2 players required to start a game.');
    }

    this.status = 'PLAYING';
    this.drawPile = GameEngine.shuffleDeck(GameEngine.createDeck());
    this.discardPile = [];
    this.playerHands.clear();
    this.unoCallers.clear();
    this.drawnThisTurn = false;
    this.wildPickerPlayerId = undefined;
    this.roundWinnerId = undefined;
    this.turnDirection = 1;

    // Deal 7 cards to each player
    for (const player of this.players) {
      const hand: Card[] = [];
      for (let i = 0; i < 7; i++) {
        if (this.drawPile.length > 0) {
          hand.push(this.drawPile.pop()!);
        }
      }
      this.playerHands.set(player.id, hand);
      player.cardCount = hand.length;
      player.calledUno = false;
    }

    // Draw top card for discard pile (avoid wild cards for start if possible)
    let initialCard = this.drawPile.pop()!;
    while (initialCard.color === 'wild' && this.drawPile.length > 0) {
      this.drawPile.unshift(initialCard);
      initialCard = this.drawPile.pop()!;
    }
    this.discardPile.push(initialCard);
    this.currentCard = initialCard;
    this.currentColor = initialCard.color as 'red' | 'blue' | 'green' | 'yellow';

    // Randomize first player or start with index 0
    this.turnIndex = Math.floor(Math.random() * this.players.length);

    this.logAction(
      this.getCurrentPlayer().id,
      this.getCurrentPlayer().name,
      `Round started! Top card is ${this.formatCardName(initialCard)}.`,
      'play'
    );
  }

  public getCurrentPlayer(): Player {
    return this.players[this.turnIndex];
  }

  public isCardPlayable(card: Card): boolean {
    if (card.color === 'wild') return true;
    if (card.color === this.currentColor) return true;
    if (card.type === this.currentCard.type) {
      if (card.type === 'number') {
        return card.value === this.currentCard.value;
      }
      return true;
    }
    return false;
  }

  public playCard(playerId: string, cardId: string, chosenColor?: 'red' | 'blue' | 'green' | 'yellow'): { success: boolean; error?: string } {
    if (this.status !== 'PLAYING') {
      return { success: false, error: 'Game is not in active play.' };
    }

    if (this.wildPickerPlayerId) {
      return { success: false, error: 'Waiting for player to choose wild color.' };
    }

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { success: false, error: "It is not your turn." };
    }

    const hand = this.playerHands.get(playerId);
    if (!hand) {
      return { success: false, error: 'Player hand not found.' };
    }

    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: 'You do not have this card in hand.' };
    }

    const card = hand[cardIndex];
    if (!this.isCardPlayable(card)) {
      return { success: false, error: 'Card does not match the active color or symbol.' };
    }

    // Card is valid, play it!
    hand.splice(cardIndex, 1);
    currentPlayer.cardCount = hand.length;
    this.discardPile.push(card);
    this.currentCard = card;
    this.drawnThisTurn = false;

    // Check if player called UNO
    if (hand.length === 1) {
      if (this.unoCallers.has(playerId)) {
        this.logAction(playerId, currentPlayer.name, `called UNO! 1 card remaining!`, 'uno');
        currentPlayer.calledUno = true;
      } else {
        // Did not call UNO yet; set penalty window
        currentPlayer.calledUno = false;
      }
    } else if (hand.length === 0) {
      // WINNER!
      return this.handleRoundEnd(playerId);
    } else {
      currentPlayer.calledUno = false;
      this.unoCallers.delete(playerId);
    }

    // Process card effect
    if (card.color === 'wild') {
      if (chosenColor) {
        this.currentColor = chosenColor;
        this.finishWildPlay(card, chosenColor, currentPlayer);
      } else {
        // Wait for color choice
        this.wildPickerPlayerId = playerId;
        this.logAction(playerId, currentPlayer.name, `played ${this.formatCardName(card)} and is choosing color...`, 'color');
      }
      return { success: true };
    }

    // Non-wild color
    this.currentColor = card.color as 'red' | 'blue' | 'green' | 'yellow';

    if (card.type === 'skip') {
      this.logAction(playerId, currentPlayer.name, `played Skip!`, 'skip');
      this.advanceTurn(2);
    } else if (card.type === 'reverse') {
      this.turnDirection = (this.turnDirection * -1) as 1 | -1;
      this.logAction(playerId, currentPlayer.name, `played Reverse! Turn direction reversed.`, 'reverse');
      if (this.players.length === 2) {
        // In 2 player UNO, Reverse acts like a Skip
        this.advanceTurn(2);
      } else {
        this.advanceTurn(1);
      }
    } else if (card.type === 'draw2') {
      const victim = this.peekNextPlayer();
      this.giveCardsToPlayer(victim.id, 2);
      this.logAction(playerId, currentPlayer.name, `played Draw Two! ${victim.name} draws 2 cards and skips turn.`, 'play');
      this.advanceTurn(2);
    } else {
      this.logAction(playerId, currentPlayer.name, `played ${this.formatCardName(card)}.`, 'play');
      this.advanceTurn(1);
    }

    return { success: true };
  }

  public chooseWildColor(playerId: string, color: 'red' | 'blue' | 'green' | 'yellow'): { success: boolean; error?: string } {
    if (this.wildPickerPlayerId !== playerId) {
      return { success: false, error: 'Not permitted to choose color.' };
    }

    this.currentColor = color;
    this.wildPickerPlayerId = undefined;
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    this.finishWildPlay(this.currentCard, color, player);
    return { success: true };
  }

  private finishWildPlay(card: Card, color: 'red' | 'blue' | 'green' | 'yellow', player: Player): void {
    const colorCapitalized = color.charAt(0).toUpperCase() + color.slice(1);
    if (card.type === 'wild4') {
      const victim = this.peekNextPlayer();
      this.giveCardsToPlayer(victim.id, 4);
      this.logAction(
        player.id,
        player.name,
        `played Wild Draw 4, set color to ${colorCapitalized}! ${victim.name} draws 4 cards and skips turn.`,
        'play'
      );
      this.advanceTurn(2);
    } else {
      this.logAction(player.id, player.name, `played Wild, set color to ${colorCapitalized}!`, 'color');
      this.advanceTurn(1);
    }
  }

  public drawCard(playerId: string): { success: boolean; card?: Card; error?: string } {
    if (this.status !== 'PLAYING') {
      return { success: false, error: 'Game not active.' };
    }

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { success: false, error: "It is not your turn." };
    }

    if (this.drawnThisTurn) {
      // Pass turn
      this.drawnThisTurn = false;
      this.logAction(playerId, currentPlayer.name, 'passed their turn.', 'play');
      this.advanceTurn(1);
      return { success: true };
    }

    const card = this.drawFromDeck();
    if (!card) {
      return { success: false, error: 'No cards available to draw.' };
    }

    const hand = this.playerHands.get(playerId) || [];
    hand.push(card);
    currentPlayer.cardCount = hand.length;
    this.drawnThisTurn = true;

    this.logAction(playerId, currentPlayer.name, 'drew a card.', 'draw');
    return { success: true, card };
  }

  public callUno(playerId: string): { success: boolean; message: string } {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Player not found.' };

    const hand = this.playerHands.get(playerId) || [];
    if (hand.length <= 2) {
      this.unoCallers.add(playerId);
      player.calledUno = true;
      this.logAction(playerId, player.name, `called UNO!`, 'uno');
      return { success: true, message: 'UNO called successfully!' };
    }

    return { success: false, message: 'You can only call UNO when you have 1 or 2 cards remaining!' };
  }

  public challengeUno(challengerId: string, targetPlayerId: string): { success: boolean; message: string } {
    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    const challenger = this.players.find(p => p.id === challengerId);
    if (!targetPlayer || !challenger) return { success: false, message: 'Player not found.' };

    const hand = this.playerHands.get(targetPlayerId) || [];
    if (hand.length === 1 && !targetPlayer.calledUno) {
      // Penalty: Target must draw 2 cards!
      this.giveCardsToPlayer(targetPlayerId, 2);
      this.logAction(
        challengerId,
        challenger.name,
        `caught ${targetPlayer.name} not saying UNO! ${targetPlayer.name} draws 2 penalty cards!`,
        'penalty'
      );
      return { success: true, message: `Caught ${targetPlayer.name}! They drew 2 cards.` };
    }

    return { success: false, message: 'Target player called UNO or does not have 1 card.' };
  }

  private handleRoundEnd(winnerId: string): { success: boolean } {
    this.status = 'ROUND_END';
    this.roundWinnerId = winnerId;
    const winner = this.players.find(p => p.id === winnerId);

    // Calculate score: points of remaining cards in opponents' hands
    let roundPoints = 0;
    for (const [pId, hand] of this.playerHands.entries()) {
      if (pId !== winnerId) {
        for (const card of hand) {
          if (card.type === 'number') {
            roundPoints += card.value ?? 0;
          } else if (card.type === 'skip' || card.type === 'reverse' || card.type === 'draw2') {
            roundPoints += 20;
          } else if (card.type === 'wild' || card.type === 'wild4') {
            roundPoints += 50;
          }
        }
      }
    }

    if (winner) {
      this.roundScores[winnerId] = roundPoints;
      this.totalScores[winnerId] = (this.totalScores[winnerId] || 0) + roundPoints;
      winner.score = this.totalScores[winnerId];

      this.logAction(
        winnerId,
        winner.name,
        `won the round and gained ${roundPoints} points!`,
        'win'
      );

      // Check for match winner (e.g. 500 points or single game)
      if (this.totalScores[winnerId] >= 500) {
        this.status = 'GAME_END';
        this.winnerId = winnerId;
      }
    }

    return { success: true };
  }

  private giveCardsToPlayer(playerId: string, count: number): void {
    const hand = this.playerHands.get(playerId);
    const player = this.players.find(p => p.id === playerId);
    if (!hand || !player) return;

    for (let i = 0; i < count; i++) {
      const card = this.drawFromDeck();
      if (card) hand.push(card);
    }
    player.cardCount = hand.length;
    player.calledUno = false;
    this.unoCallers.delete(playerId);
  }

  private drawFromDeck(): Card | null {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) return null;
      // Reshuffle discard pile except top card
      const topCard = this.discardPile.pop()!;
      this.drawPile = GameEngine.shuffleDeck(this.discardPile);
      this.discardPile = [topCard];
    }
    return this.drawPile.pop() || null;
  }

  private advanceTurn(steps: number): void {
    const n = this.players.length;
    let nextIndex = (this.turnIndex + steps * this.turnDirection) % n;
    while (nextIndex < 0) nextIndex += n;
    this.turnIndex = nextIndex;
    this.drawnThisTurn = false;
  }

  private peekNextPlayer(): Player {
    const n = this.players.length;
    let nextIndex = (this.turnIndex + 1 * this.turnDirection) % n;
    while (nextIndex < 0) nextIndex += n;
    return this.players[nextIndex];
  }

  private formatCardName(card: Card): string {
    const colorStr = card.color.toUpperCase();
    if (card.type === 'number') return `${colorStr} ${card.value}`;
    if (card.type === 'skip') return `${colorStr} SKIP`;
    if (card.type === 'reverse') return `${colorStr} REVERSE`;
    if (card.type === 'draw2') return `${colorStr} DRAW TWO`;
    if (card.type === 'wild') return 'WILD';
    if (card.type === 'wild4') return 'WILD DRAW FOUR';
    return card.type;
  }

  private logAction(playerId: string, playerName: string, text: string, type: GameActionLog['type']): void {
    this.lastAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerId,
      playerName,
      text,
      type,
      timestamp: Date.now(),
    };
  }

  public getSanitizedStateForPlayer(playerId: string): GameState {
    const myHand = this.playerHands.get(playerId) || [];
    return {
      roomId: this.roomId,
      roomCode: this.roomCode,
      status: this.status,
      players: this.players.map(p => ({
        ...p,
        hand: p.id === playerId ? myHand : undefined, // STRICTLY HIDE OTHER HANDS!
      })),
      currentPlayerId: this.getCurrentPlayer()?.id || '',
      turnIndex: this.turnIndex,
      turnDirection: this.turnDirection,
      currentColor: this.currentColor,
      currentCard: this.currentCard,
      drawPileCount: this.drawPile.length,
      discardPileCount: this.discardPile.length,
      winnerId: this.winnerId,
      roundWinnerId: this.roundWinnerId,
      roundScores: this.roundScores,
      totalScores: this.totalScores,
      lastAction: this.lastAction,
      wildPickerPlayerId: this.wildPickerPlayerId,
      myHand,
      unoCallers: Array.from(this.unoCallers),
    };
  }
}
