import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Calendar, User } from 'lucide-react';
import apiService from '../services/api.js';

const CallHistory = ({ userId }) => {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSignIn, setLastSignIn] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchCallHistory();
    }
  }, [userId]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCallHistory(userId);
      setCallHistory(data.callHistory || []);
      setLastSignIn(data.lastSignIn);
      setError(null);
    } catch (err) {
      setError('Failed to load call history');
      console.error('Error fetching call history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds === 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCallTypeIcon = (callType) => {
    switch (callType) {
      case 'incoming':
        return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
      case 'missed':
        return <Phone className="w-4 h-4 text-red-500" />;
      default:
        return <Phone className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCallTypeColor = (callType) => {
    switch (callType) {
      case 'incoming':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'outgoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCallTypeLabel = (callType) => {
    switch (callType) {
      case 'incoming':
        return 'Incoming';
      case 'outgoing':
        return 'Outgoing';
      case 'missed':
        return 'Missed';
      default:
        return callType;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchCallHistory}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Call History</h3>
            <p className="text-sm text-gray-500">
              Since your last login {lastSignIn && formatTimestamp(lastSignIn)}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{callHistory.length} calls</span>
          </div>
        </div>
      </div>

      {/* Call List */}
      <div className="divide-y divide-gray-200">
        {callHistory.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No calls since your last login</p>
          </div>
        ) : (
          callHistory.map((call, index) => (
            <div key={call._id || index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getCallTypeIcon(call.callType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {call.remoteEmail}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCallTypeColor(call.callType)}`}>
                        {getCallTypeLabel(call.callType)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(call.duration)}</span>
                      </div>
                      <span>{formatTimestamp(call.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-400">
                    {new Date(call.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {callHistory.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Total calls: {callHistory.length}</span>
            <button
              onClick={fetchCallHistory}
              className="text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
