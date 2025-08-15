const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    default: () => `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  whitePlayer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    socketId: {
      type: String,
      default: null
    },
    username: {
      type: String,
      default: null
    }
  },
  blackPlayer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    socketId: {
      type: String,
      default: null
    },
    username: {
      type: String,
      default: null
    }
  },
  spectators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    socketId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    }
  }],
  gameState: {
    type: String,
    default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Starting FEN
  },
  moves: [{
    player: {
      type: String,
      enum: ['white', 'black'],
      required: true
    },
    move: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notation: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  result: {
    type: String,
    enum: ['white_wins', 'black_wins', 'draw', 'abandoned'],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
gameSessionSchema.index({ status: 1 });
gameSessionSchema.index({ gameId: 1 });
gameSessionSchema.index({ 'whitePlayer.userId': 1 });
gameSessionSchema.index({ 'blackPlayer.userId': 1 });
gameSessionSchema.index({ lastActivity: 1 });
gameSessionSchema.index({ status: 1, lastActivity: 1 });

// Instance methods
gameSessionSchema.methods.addMove = function(player, move, notation) {
  this.moves.push({
    player,
    move,
    notation,
    timestamp: new Date()
  });
  this.lastActivity = new Date();
  return this.save();
};

gameSessionSchema.methods.assignWhitePlayer = function(userId, socketId, username) {
  this.whitePlayer = { userId, socketId, username };
  if (this.blackPlayer.userId) {
    this.status = 'active';
  }
  this.lastActivity = new Date();
  return this.save();
};

gameSessionSchema.methods.assignBlackPlayer = function(userId, socketId, username) {
  this.blackPlayer = { userId, socketId, username };
  if (this.whitePlayer.userId) {
    this.status = 'active';
  }
  this.lastActivity = new Date();
  return this.save();
};

gameSessionSchema.methods.addSpectator = function(userId, socketId, username) {
  // Remove existing spectator with same userId if exists
  this.spectators = this.spectators.filter(spec => spec.userId.toString() !== userId.toString());
  this.spectators.push({ userId, socketId, username });
  this.lastActivity = new Date();
  return this.save();
};

gameSessionSchema.methods.removePlayer = function(socketId) {
  if (this.whitePlayer.socketId === socketId) {
    // Only clear socketId, preserve userId and username for reconnection
    this.whitePlayer.socketId = null;
    console.log(`White player ${this.whitePlayer.username} disconnected, preserving userId for reconnection`);
  } else if (this.blackPlayer.socketId === socketId) {
    // Only clear socketId, preserve userId and username for reconnection
    this.blackPlayer.socketId = null;
    console.log(`Black player ${this.blackPlayer.username} disconnected, preserving userId for reconnection`);
  } else {
    this.spectators = this.spectators.filter(spec => spec.socketId !== socketId);
  }
  
  // Don't change status on disconnect - players can reconnect
  // Status should only change when explicitly leaving or game ending
  
  return this.save();
};

gameSessionSchema.methods.completeGame = function(result) {
  this.status = 'completed';
  this.result = result;
  this.completedAt = new Date();
  return this.save();
};

// Static methods
gameSessionSchema.statics.findActiveSession = function() {
  return this.findOne({ 
    status: { $in: ['waiting', 'active'] } 
  }).sort({ createdAt: 1 });
};

gameSessionSchema.statics.createNewSession = function() {
  return this.create({
    status: 'waiting'
  });
};

module.exports = mongoose.model('GameSession', gameSessionSchema);