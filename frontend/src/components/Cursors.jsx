import React, { useEffect, useState } from 'react';

// Safe user color generation
const getUserColor = (userId) => {
  if (!userId) return '#4F46E5'; // Default color if no userId
  
  try {
    // Handle both string and object userId
    const id = typeof userId === 'object' ? userId.id || userId.name || 'default' : userId;
    
    if (typeof id !== 'string') return '#4F46E5';
    
    // Generate color from user ID
    const colors = [
      '#EF4444', '#F97316', '#F59E0B', '#EAB308',
      '#84CC16', '#22C55E', '#10B981', '#14B8A6',
      '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
      '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
      '#F43F5E'
    ];
    
    // Create hash from string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Get color from hash
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  } catch (error) {
    console.warn('Error generating user color:', error);
    return '#4F46E5'; // Fallback color
  }
};

// Safe user name generation
const getUserName = (user) => {
  if (!user) return 'Anonymous';
  
  try {
    if (typeof user === 'string') return user;
    if (user.name) return user.name;
    if (user.id) return `User ${user.id}`;
    return 'Anonymous';
  } catch (error) {
    console.warn('Error getting user name:', error);
    return 'Anonymous';
  }
};

export const Cursors = ({ yProvider }) => {
  const [cursors, setCursors] = useState(new Map());
  
  useEffect(() => {
    if (!yProvider || !yProvider.awareness) {
      console.warn('YProvider or awareness not available');
      return;
    }

    const awareness = yProvider.awareness;
    
    const handleAwarenessUpdate = ({ added, updated, removed }) => {
      try {
        setCursors(prevCursors => {
          const newCursors = new Map(prevCursors);
          
          // Handle removed users
          if (removed) {
            removed.forEach(clientId => {
              newCursors.delete(clientId);
            });
          }
          
          // Handle added and updated users
          const allChangedUsers = [...(added || []), ...(updated || [])];
          
          allChangedUsers.forEach(clientId => {
            const state = awareness.getStates().get(clientId);
            
            if (state && state.user) {
              const cursor = state.cursor;
              const selection = state.selection;
              
              newCursors.set(clientId, {
                clientId,
                user: state.user,
                cursor,
                selection,
                color: getUserColor(state.user),
                name: getUserName(state.user),
              });
            } else {
              // Remove cursor if no valid state
              newCursors.delete(clientId);
            }
          });
          
          return newCursors;
        });
      } catch (error) {
        console.error('Error handling awareness update:', error);
      }
    };

    // Add the event listener
    awareness.on('update', handleAwarenessUpdate);
    
    // Initial sync
    try {
      const states = awareness.getStates();
      const initialCursors = new Map();
      
      states.forEach((state, clientId) => {
        if (state && state.user) {
          initialCursors.set(clientId, {
            clientId,
            user: state.user,
            cursor: state.cursor,
            selection: state.selection,
            color: getUserColor(state.user),
            name: getUserName(state.user),
          });
        }
      });
      
      setCursors(initialCursors);
    } catch (error) {
      console.error('Error during initial cursor sync:', error);
    }

    // Cleanup
    return () => {
      try {
        awareness.off('update', handleAwarenessUpdate);
      } catch (error) {
        console.warn('Error removing awareness listener:', error);
      }
    };
  }, [yProvider]);

  // Don't render anything if no cursors or yProvider
  if (!yProvider || cursors.size === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative', pointerEvents: 'none' }}>
      {Array.from(cursors.values()).map(({ clientId, cursor, color, name }) => {
        // Only render if cursor position is available
        if (!cursor || typeof cursor.line !== 'number' || typeof cursor.column !== 'number') {
          return null;
        }

        return (
          <div
            key={clientId}
            style={{
              position: 'absolute',
              left: `${cursor.column * 7}px`, // Approximate character width
              top: `${cursor.line * 18}px`, // Approximate line height
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            {/* Cursor line */}
            <div
              style={{
                width: '2px',
                height: '18px',
                backgroundColor: color,
                position: 'relative',
              }}
            >
              {/* User name label */}
              <div
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '0px',
                  backgroundColor: color,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  opacity: 0.9,
                }}
              >
                {name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};