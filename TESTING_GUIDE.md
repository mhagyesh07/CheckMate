# Chess Game Testing Guide

## The Issue You Encountered

The problem you experienced was that both browser sessions were using the same user account ("bbb"). When the same user logs in from multiple browsers/tabs, the system correctly identifies them as the same user and assigns them the same role (black player in this case).

## How to Test Properly

### 1. Use Different User Accounts

I've created test users for you. Use these credentials:

**For Two-Player Games:**
- Browser 1: Username: `player1`, Password: `password123`
- Browser 2: Username: `player2`, Password: `password123`

**For Testing with Spectators:**
- Browser 1: Username: `player1`, Password: `password123` (will be white player)
- Browser 2: Username: `player2`, Password: `password123` (will be black player)  
- Browser 3: Username: `player3`, Password: `password123` (will be spectator)
- Browser 4: Username: `spectator1`, Password: `password123` (will be spectator)

### 2. Testing Steps

1. **Start the server**: `npm run dev`
2. **Open first browser tab**: 
   - Go to `http://localhost:3001`
   - Login with `player1` / `password123`
   - You should be assigned as white player
3. **Open second browser tab**:
   - Go to `http://localhost:3001` 
   - Login with `player2` / `password123`
   - You should be assigned as black player
4. **Test the game**: Make moves alternately between the two browsers

### 3. What Should Happen

- **First user (player1)**: Gets assigned as white player, receives role "w"
- **Second user (player2)**: Gets assigned as black player, receives role "b"
- **Additional users**: Get assigned as spectators

### 4. Reconnection Testing

To test reconnection:
1. Close one browser tab (simulates disconnect)
2. Reopen and login with the same user
3. Should reconnect to the same role in the same game

### 5. Multiple Sessions Testing

To test multiple game sessions:
1. Have two games running simultaneously
2. Each pair of players should be in separate game sessions
3. Spectators can join any active session

## Logs to Watch

When testing, watch the server console for these logs:
- `User [username] assigned role: [role] (recovered: [true/false])`
- `Assigning [username] as WHITE/BLACK player`
- `[username] reconnected as white/black player`

## Common Issues

1. **Same user in multiple tabs**: Will show as reconnection, same role
2. **No token**: User won't be able to connect to socket
3. **Invalid token**: Authentication will fail
4. **Server restart**: All users need to refresh and reconnect

## Creating More Test Users

If you need more test users, run:
```bash
node scripts/createTestUsers.js
```

Or manually create them through the signup form in the UI.