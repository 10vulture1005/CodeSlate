// liveblocks.config.js
import { createClient } from "@liveblocks/client";

export const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
  
  // Configure large message strategy to handle big documents
  largeMessageStrategy: {
    // Split large messages into chunks
    maxMessageSize: 16384, // 16KB chunks (default WebSocket limit is usually 64KB)
    
    // Use HTTP fallback for very large messages
    httpFallback: true,
    
    // Retry configuration
    maxRetries: 3,
    retryInterval: 1000,
  },
  
  // Additional optimizations
  throttle: 100, // Throttle updates to 100ms
  
  // Connection options
  connectionOptions: {
    // Reduce initial connection timeout
    connectionTimeout: 5000,
    
    // Enable compression if supported
    enableCompression: true,
  },
});

// Alternative configuration using resolveUsers and resolveMentionSuggestions
export const liveblocks = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
  
  // Handle large messages by splitting them
  largeMessageStrategy: "split",
  
  // Optimize for code collaboration
  resolveUsers: async ({ userIds }) => {
    // Implement user resolution logic
    return userIds.map(userId => ({
      id: userId,
      info: {
        name: `User ${userId}`,
        avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${userId}`,
      },
    }));
  },
  
  resolveMentionSuggestions: async ({ text }) => {
    // Implement mention suggestions if needed
    return [];
  },
});

// Room configuration helper
export const createRoomConfig = (roomId) => ({
  id: roomId,
  
  // Initial presence for the room
  initialPresence: {
    cursor: null,
    selection: null,
    user: {
      id: Math.random().toString(36).substr(2, 9),
      name: "Anonymous",
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    },
  },
  
  // Initial storage for Y.js document
  initialStorage: {
    // Y.js document will be automatically created
  },
  
  // Optimize for collaborative editing
  optimisticUpdates: true,
  
  // Handle connection states
  onConnectionStateChange: (state) => {
    console.log("Connection state changed:", state);
  },
  
  // Handle errors
  onError: (error) => {
    console.error("Liveblocks error:", error);
  },
});

// Utility function to handle large content updates
export const updateLargeContent = async (yText, content, maxChunkSize = 1000) => {
  return new Promise((resolve, reject) => {
    try {
      // Use Y.js transaction to batch operations
      yText.doc.transact(() => {
        // Clear current content
        const currentLength = yText.length;
        if (currentLength > 0) {
          yText.delete(0, currentLength);
        }
        
        // Insert content in chunks
        if (content.length > maxChunkSize) {
          for (let i = 0; i < content.length; i += maxChunkSize) {
            const chunk = content.slice(i, i + maxChunkSize);
            yText.insert(i, chunk);
          }
        } else {
          yText.insert(0, content);
        }
      });
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};