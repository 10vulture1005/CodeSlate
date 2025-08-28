import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../providers/Sockets";
import ReactPlayer from "react-player";
import { usePeer } from "../providers/Peer";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Clock,
  UserCheck,
  UserX,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";

import CodingRoom from "./CodingRoom";
import { LiveblocksProvider } from "@liveblocks/react";
import { RoomProvider } from "@liveblocks/react";

export default function Room() {
  const room = localStorage.getItem("roomid");

  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswere,
    setRemoteAnswer,
    sendStream,
    remoteStream,
  } = usePeer();

  // State management
  const [existingUsers, setExistingUsers] = useState([]);
  const [myStream, setMystream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState("");
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [outgoingCalls, setOutgoingCalls] = useState([]);
  const [activeCalls, setActiveCalls] = useState([]);
  const [callStatus, setCallStatus] = useState("idle");
  const [notcoding, setnotcoding] = useState(true);
  const [endvid, setendvid] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Handle new user joining (existing users receive this)
  const handleNewUser = useCallback(async (data) => {
    const { email } = data;
    console.log(`New user joined: ${email}`);
    setRemoteEmailId(email);
    setExistingUsers((prev) => [...prev.filter((u) => u !== email), email]);
  }, []);

  // Handle existing users list (new user receives this)
  const handleExistingUsers = useCallback(async (data) => {
    const { users } = data;
    console.log("Received existing users:", users);
    setExistingUsers(users);
  }, []);

  // Handle incoming call
  const handleIncomingCall = useCallback(async (data) => {
    const { email: from, offer } = data;
    console.log("Incoming call from", from);
    setRemoteEmailId(from);
    setIncomingCalls((prev) => {
      if (prev.some((call) => call.email === from)) {
        return prev;
      }
      return [...prev, { email: from, offer }];
    });
    setCallStatus("receiving");
  }, []);

  // Handle re-negotiation offer during active call
  const handleRenegotiationOffer = useCallback(
    async (data) => {
      const { email: from, offer } = data;
      console.log("Re-negotiation offer from", from);

      if (activeCalls.includes(from)) {
        try {
          const ans = await createAnswere(offer);
                  socket.emit("renegotiation-answer", { email: from, ans });
        console.log("Re-negotiation answer sent to", from);
        } catch (error) {
          console.error("Error handling re-negotiation:", error);
        }
      }
    },
    [activeCalls, createAnswere, socket]
  );

  // Handle re-negotiation answer
  const handleRenegotiationAnswer = useCallback(
    async (data) => {
      const { email: from, ans } = data;
      console.log("Re-negotiation answer from", from);

      try {
        await setRemoteAnswer(ans);
        setIsNegotiating(false);
        console.log("Re-negotiation completed with", from);
      } catch (error) {
        console.error("Error handling re-negotiation answer:", error);
        setIsNegotiating(false);
      }
    },
    [setRemoteAnswer]
  );

  // Accept a specific call
  const acceptCall = useCallback(
    async (callData) => {
      try {
        const ans = await createAnswere(callData.offer);
        socket.emit("call-accepted", { email: callData.email, ans });
        console.log("Call accepted with", callData.email);
        setActiveCalls((prev) => [...prev, callData.email]);
        setIncomingCalls((prev) =>
          prev.filter((call) => call.email !== callData.email)
        );
        setCallStatus("in-call");
        setRemoteEmailId(callData.email);
      } catch (error) {
        console.error("Error accepting call:", error);
      }
    },
    [createAnswere, socket]
  );

  // Reject a specific call
  const rejectCall = useCallback(
    (callData) => {
      socket.emit("call-rejected", { email: callData.email });
      setIncomingCalls((prev) =>
        prev.filter((call) => call.email !== callData.email)
      );
      if (incomingCalls.length <= 1) {
        setCallStatus("idle");
      }
      console.log("Call rejected from", callData.email);
    },
    [socket, incomingCalls.length]
  );

  // Initiate call to a user
  const callUser = useCallback(
    async (targetEmail) => {
      try {
        console.log(`Calling ${targetEmail}...`);
        const offer = await createOffer();
        socket.emit("calling-user", { email: targetEmail, offer });
        setOutgoingCalls((prev) => [
          ...prev.filter((u) => u !== targetEmail),
          targetEmail,
        ]);
        setRemoteEmailId(targetEmail);
        setCallStatus("calling");
      } catch (error) {
        console.error("Error calling user:", error);
      }
    },
    [createOffer, socket]
  );

  // Handle call accepted
  const handleCallAccepted = useCallback(
    async (data) => {
      const { email: accepterEmail, ans } = data;
              console.log("Call accepted by", accepterEmail);
      try {
        await setRemoteAnswer(ans);
        setActiveCalls((prev) => [...prev, accepterEmail]);
        setOutgoingCalls((prev) =>
          prev.filter((email) => email !== accepterEmail)
        );
        setCallStatus("in-call");
        setRemoteEmailId(accepterEmail);
      } catch (error) {
        console.error("Error handling call acceptance:", error);
      }
    },
    [setRemoteAnswer]
  );

  // Handle call rejected
  const handleCallRejected = useCallback(
    (data) => {
      const { email: rejecterEmail } = data;
              console.log("Call rejected by", rejecterEmail);
      setOutgoingCalls((prev) =>
        prev.filter((email) => email !== rejecterEmail)
      );
      if (outgoingCalls.length <= 1) {
        setCallStatus("idle");
      }
    },
    [outgoingCalls.length]
  );

  // Handle call timeout
  const handleCallTimeout = useCallback(
    (data) => {
      const { targetEmail, email } = data;
      const timedOutUser = targetEmail || email;
      console.log("⏰ Call timeout with", timedOutUser);
      setOutgoingCalls((prev) =>
        prev.filter((email) => email !== timedOutUser)
      );
      setIncomingCalls((prev) =>
        prev.filter((call) => call.email !== timedOutUser)
      );
      if (outgoingCalls.length <= 1 && incomingCalls.length <= 1) {
        setCallStatus("idle");
      }
    },
    [outgoingCalls.length, incomingCalls.length]
  );

  // Handle call ended
  const handleCallEnded = useCallback(
    (data) => {
      const { email } = data;
      console.log("Call ended with", email);
      setActiveCalls((prev) =>
        prev.filter((activeEmail) => activeEmail !== email)
      );
      if (activeCalls.length <= 1) {
        setCallStatus("idle");
      }
    },
    [activeCalls.length]
  );

  // End call
  const endCall = useCallback(
    (targetEmail) => {
      socket.emit("end-call", { email: targetEmail });
      setendvid(true);
      setActiveCalls((prev) => prev.filter((email) => email !== targetEmail));
      if (activeCalls.length <= 1) {
        setCallStatus("idle");
      }
      console.log("Ended call with", targetEmail);
    },
    [socket, activeCalls.length]
  );

  // Handle user disconnection
  const handleUserDisconnected = useCallback((data) => {
    const { email } = data;
    console.log("User disconnected:", email);
    setExistingUsers((prev) => prev.filter((u) => u !== email));
    setIncomingCalls((prev) => prev.filter((call) => call.email !== email));
    setOutgoingCalls((prev) => prev.filter((u) => u !== email));
    setActiveCalls((prev) => prev.filter((u) => u !== email));
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", handleNewUser);
    socket.on("existing-users", handleExistingUsers);
    socket.on("incomming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-timeout", handleCallTimeout);
    socket.on("call-ended", handleCallEnded);
    socket.on("user-disconnected", handleUserDisconnected);
    socket.on("renegotiation-offer", handleRenegotiationOffer);
    socket.on("renegotiation-answer", handleRenegotiationAnswer);

    return () => {
      socket.off("user-joined", handleNewUser);
      socket.off("existing-users", handleExistingUsers);
      socket.off("incomming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-timeout", handleCallTimeout);
      socket.off("call-ended", handleCallEnded);
      socket.off("user-disconnected", handleUserDisconnected);
      socket.off("renegotiation-offer", handleRenegotiationOffer);
      socket.off("renegotiation-answer", handleRenegotiationAnswer);
    };
  }, [
    socket,
    handleNewUser,
    handleExistingUsers,
    handleIncomingCall,
    handleCallAccepted,
    handleCallRejected,
    handleCallTimeout,
    handleCallEnded,
    handleUserDisconnected,
    handleRenegotiationOffer,
    handleRenegotiationAnswer,
  ]);

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMystream(stream);
  }, []);

  // Fixed negotiation handler
  const handleNegotiation = useCallback(async () => {
    if (!peer || !remoteEmailId || isNegotiating) return;

    try {
      setIsNegotiating(true);
      console.log("Starting re-negotiation with", remoteEmailId);

      const offer = await createOffer();
      socket.emit("renegotiation-offer", { email: remoteEmailId, offer });

      console.log("Re-negotiation offer sent to", remoteEmailId);
    } catch (error) {
      console.error("Error during re-negotiation:", error);
      setIsNegotiating(false);
    }
  }, [peer, remoteEmailId, socket, createOffer, isNegotiating]);

  const toggleVideo = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Auto-send stream when call becomes active
  useEffect(() => {
    if (activeCalls.length > 0 && myStream && !remoteStream) {
      console.log("Auto-sending stream to active call");
      sendStream(myStream);
    }
  }, [activeCalls, myStream, remoteStream, sendStream]);

  useEffect(() => {
    if (!peer) return;

    peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [peer, handleNegotiation]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  const getStatusColor = () => {
    switch (callStatus) {
      case "in-call":
        return "bg-green-500";
      case "calling":
        return "bg-yellow-500";
      case "receiving":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case "in-call":
        return isNegotiating ? "Connecting..." : "In Call";
      case "calling":
        return "Calling...";
      case "receiving":
        return "Incoming Call";
      default:
        return "Available";
    }
  };
  if (notcoding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Video Room</h1>
                <p className="text-purple-200">Room ID: {room}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-white text-sm ${getStatusColor()}`}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>{getStatusText()}</span>
                </div>
                <div className="flex items-center space-x-2 text-white/70">
                  <Users size={16} />
                  <span>{existingUsers.length + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Video Streams */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* My Video */}
            <div className="relative bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              <div className="aspect-video">
                <ReactPlayer
                  url={myStream}
                  playing
                  muted
                  width="100%"
                  height="100%"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-white text-sm font-medium">You</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleAudio}
                      className={`p-2 rounded-lg transition-all ${
                        isAudioEnabled
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      {isAudioEnabled ? (
                        <Mic size={16} />
                      ) : (
                        <MicOff size={16} />
                      )}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={`p-2 rounded-lg transition-all ${
                        isVideoEnabled
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      {isVideoEnabled ? (
                        <Video size={16} />
                      ) : (
                        <VideoOff size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              <div className="aspect-video">
                {remoteStream ? (
                  <ReactPlayer
                    url={remoteStream}
                    playing
                    width="100%"
                    height="100%"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white/50">
                      <Video size={48} className="mx-auto mb-2" />
                      <p>
                        {isNegotiating
                          ? "Connecting..."
                          : "Waiting for remote stream..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {remoteStream && (
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-white text-sm font-medium">
                      {remoteEmailId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Send Stream Button - Only show if not auto-sent */}
          {
            <div className="flex justify-center mb-8">
              <button
                onClick={() => {
                  setnotcoding(!notcoding);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
              >
                <span>Coding room</span>
              </button>
            </div>
          }

          {/* Incoming Calls */}
          {incomingCalls.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <PhoneIncoming className="mr-2" size={24} />
                Incoming Calls
              </h2>
              <div className="space-y-3">
                {incomingCalls.map((call, index) => (
                  <div
                    key={index}
                    className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <Phone className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {call.email}
                          </p>
                          <p className="text-blue-200 text-sm">
                            Incoming call...
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => acceptCall(call)}
                          className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                        >
                          <UserCheck size={16} />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => rejectCall(call)}
                          className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                        >
                          <UserX size={16} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Calls */}
          {activeCalls.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <PhoneCall className="mr-2 text-green-400" size={24} />
                Active Calls
              </h2>
              <div className="space-y-3">
                {activeCalls.map((email, index) => (
                  <div
                    key={index}
                    className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <PhoneCall className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{email}</p>
                          <p className="text-green-200 text-sm">
                            {remoteStream ? "Reconnecting..." : "Connected"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => endCall(email)}
                        className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                      >
                        <PhoneOff size={16} />
                        <span>End Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Calls */}
          {outgoingCalls.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <PhoneOutgoing className="mr-2 text-yellow-400" size={24} />
                Outgoing Calls
              </h2>
              <div className="space-y-3">
                {outgoingCalls.map((email, index) => (
                  <div
                    key={index}
                    className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                        <Clock className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{email}</p>
                        <p className="text-yellow-200 text-sm">Calling...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Users */}
          {existingUsers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Users className="mr-2" size={24} />
                Available Users ({existingUsers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {existingUsers.map((email, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium truncate">
                            {email}
                          </p>
                          <p className="text-white/60 text-sm">Online</p>
                        </div>
                      </div>
                      <button
                        onClick={() => callUser(email)}
                        disabled={
                          outgoingCalls.includes(email) ||
                          activeCalls.includes(email)
                        }
                        className={`p-2 rounded-lg font-semibold transition-all ${
                          activeCalls.includes(email)
                            ? "bg-green-500 text-white cursor-not-allowed"
                            : outgoingCalls.includes(email)
                            ? "bg-yellow-500 text-white cursor-not-allowed animate-pulse"
                            : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-105"
                        }`}
                      >
                        {activeCalls.includes(email) ? (
                          <PhoneCall size={16} />
                        ) : outgoingCalls.includes(email) ? (
                          <Clock size={16} />
                        ) : (
                          <Phone size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {existingUsers.length === 0 &&
            incomingCalls.length === 0 &&
            activeCalls.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto">
                  <Users size={64} className="text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Waiting for participants
                  </h3>
                  <p className="text-white/60">
                    Share the room ID with others to start your video call
                  </p>
                  <div className="mt-6 p-3 bg-black/30 rounded-lg">
                    <code className="text-purple-300 font-mono">{room}</code>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  } else {
    return (
      <>
        <LiveblocksProvider
          largeMessageStrategy="compress"
          publicApiKey={
            "pk_dev_2g-uyzuINNYjbUgdeNYgB2QzXW1Y3TvneMe7OUN1axNwPUJXBZ7sTZtWIE027Wls"
          }
        >
          <RoomProvider id="my-room">
            <button
              onClick={() => {
                setnotcoding(!notcoding);
              }}
              className="ml-80  mt-12 absolute bg-black/30 flex items-center space-x-2 bg-gradient-to-r text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              <span>video room</span>
            </button>
            <div className="w-0 h-0">
              <ReactPlayer 
                url={myStream} 
                
                playing 
                muted 
                width="100%" 
                height="100%"
                style={{ objectFit: 'cover' }}
              /><ReactPlayer 
                url={remoteStream} 
                playing 
                 
                width="100%" 
                height="100%"
                style={{ objectFit: 'cover' }}
              />
            </div>
            
            <CodingRoom  />
          </RoomProvider>
        </LiveblocksProvider>
      </>
    );
  }
}
