const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  gameStats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 1200
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster username lookups
userSchema.index({ username: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update game statistics
userSchema.methods.updateGameStats = function(result) {
  this.gameStats.gamesPlayed += 1;
  
  switch (result) {
    case 'win':
      this.gameStats.wins += 1;
      this.gameStats.rating += 25;
      break;
    case 'loss':
      this.gameStats.losses += 1;
      this.gameStats.rating = Math.max(800, this.gameStats.rating - 25);
      break;
    case 'draw':
      this.gameStats.draws += 1;
      this.gameStats.rating += 5;
      break;
  }
  
  return this.save();
};

// Instance method to get win rate
userSchema.methods.getWinRate = function() {
  if (this.gameStats.gamesPlayed === 0) return 0;
  return Math.round((this.gameStats.wins / this.gameStats.gamesPlayed) * 100);
};

// Static method to find user by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

module.exports = mongoose.model('User', userSchema);