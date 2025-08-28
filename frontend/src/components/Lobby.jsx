import React, { useState, useEffect } from "react";
// import { Input } from "@heroui/input";
// import { Button } from "@heroui/react";
import { useSocket } from "../providers/Sockets";
import { useNavigate } from "react-router-dom";
import { Shuffle, Users, Mail, Lock, Sparkles, Globe, History } from "lucide-react";
import { getAuth } from "firebase/auth";
import CallHistory from "./CallHistory.jsx";
import apiService from "../services/api.js";

// Mock components for demo
const Input = ({ value, onChange, label, type, placeholder, classNames, startContent, endContent, className, ...props }) => (
  <div className="relative">
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${className}`}
      {...props}
    />
    {endContent && <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{endContent}</div>}
  </div>
);

const Button = ({ children, onClick, disabled, className, startContent, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
    {...props}
  >
    {startContent}
    {children}
  </button>
);

export const EyeSlashFilledIcon = (props) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M21.2714 9.17834C20.9814 8.71834 20.6714 8.28834 20.3514 7.88834C19.9814 7.41834 19.2814 7.37834 18.8614 7.79834L15.8614 10.7983C16.0814 11.4583 16.1214 12.2183 15.9214 13.0083C15.5714 14.4183 14.4314 15.5583 13.0214 15.9083C12.2314 16.1083 11.4714 16.0683 10.8114 15.8483C10.8114 15.8483 9.38141 17.2783 8.35141 18.3083C7.85141 18.8083 8.01141 19.6883 8.68141 19.9483C9.75141 20.3583 10.8614 20.5683 12.0014 20.5683C13.7814 20.5683 15.5114 20.0483 17.0914 19.0783C18.7014 18.0783 20.1514 16.6083 21.3214 14.7383C22.2714 13.2283 22.2214 10.6883 21.2714 9.17834Z"
        fill="currentColor"
      />
      <path
        d="M14.0206 9.98062L9.98062 14.0206C9.47062 13.5006 9.14062 12.7806 9.14062 12.0006C9.14062 10.4306 10.4206 9.14062 12.0006 9.14062C12.7806 9.14062 13.5006 9.47062 14.0206 9.98062Z"
        fill="currentColor"
      />
      <path
        d="M18.25 5.74969L14.86 9.13969C14.13 8.39969 13.12 7.95969 12 7.95969C9.76 7.95969 7.96 9.76969 7.96 11.9997C7.96 13.1197 8.41 14.1297 9.14 14.8597L5.76 18.2497H5.75C4.64 17.3497 3.62 16.1997 2.75 14.8397C1.75 13.2697 1.75 10.7197 2.75 9.14969C3.91 7.32969 5.33 5.89969 6.91 4.91969C8.49 3.95969 10.22 3.42969 12 3.42969C14.23 3.42969 16.39 4.24969 18.25 5.74969Z"
        fill="currentColor"
      />
      <path
        d="M14.8581 11.9981C14.8581 13.5681 13.5781 14.8581 11.9981 14.8581C11.9381 14.8581 11.8881 14.8581 11.8281 14.8381L14.8381 11.8281C14.8581 11.8881 14.8581 11.9381 14.8581 11.9981Z"
        fill="currentColor"
      />
      <path
        d="M21.7689 2.22891C21.4689 1.92891 20.9789 1.92891 20.6789 2.22891L2.22891 20.6889C1.92891 20.9889 1.92891 21.4789 2.22891 21.7789C2.37891 21.9189 2.56891 21.9989 2.76891 21.9989C2.96891 21.9989 3.15891 21.9189 3.30891 21.7689L21.7689 3.30891C22.0789 3.00891 22.0789 2.52891 21.7689 2.22891Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const EyeFilledIcon = (props) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M21.25 9.14969C18.94 5.51969 15.56 3.42969 12 3.42969C10.22 3.42969 8.49 3.94969 6.91 4.91969C5.33 5.89969 3.91 7.32969 2.75 9.14969C1.75 10.7197 1.75 13.2697 2.75 14.8397C5.06 18.4797 8.44 20.5597 12 20.5597C13.78 20.5597 15.51 20.0397 17.09 19.0697C18.67 18.0897 20.09 16.6597 21.25 14.8397C22.25 13.2797 22.25 10.7197 21.25 9.14969ZM12 16.0397C9.76 16.0397 7.96 14.2297 7.96 11.9997C7.96 9.76969 9.76 7.95969 12 7.95969C14.24 7.95969 16.04 9.76969 16.04 11.9997C16.04 14.2297 14.24 16.0397 12 16.0397Z"
        fill="currentColor"
      />
      <path
        d="M11.9984 9.14062C10.4284 9.14062 9.14844 10.4206 9.14844 12.0006C9.14844 13.5706 10.4284 14.8506 11.9984 14.8506C13.5684 14.8506 14.8584 13.5706 14.8584 12.0006C14.8584 10.4306 13.5684 9.14062 11.9984 9.14062Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default function Lobby() {
    const navigate = useNavigate();

  useEffect(() => {
    let auth = null;
    let userEmail = "";

    try {
      const Auth = getAuth();
      if (Auth) auth = Auth;
    } catch (err) {
      navigate('/');
      return;
    }

    if (auth && auth.currentUser) {
      userEmail = auth.currentUser.email;

      let name = "";
      for (let i = 0; i < userEmail.length; i++) {
        if (userEmail[i] === "@") break;
        name += userEmail[i];
      }

      setEmail(name);
      
      // Set up user for call history
      setUser({
        id: auth.currentUser.uid,
        email: userEmail
      });
    } else {
      navigate('/');
    }
  }, [navigate]);



  const {socket} = useSocket();
  
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [user, setUser] = useState(null);
  const [showCallHistory, setShowCallHistory] = useState(false);

  useEffect(() => {
    // Mock socket listener
    console.log('Socket listener set up');
  }, []);

  const generateRandomRoomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setRoom(result);
  };

  const handleSubmit = () => {
    if (email && room) {
      setIsJoining(true);
            localStorage.setItem("roomid",room);

      console.log(email, room);
      socket.emit("join-room", { email: email, roomid: room });
      
      // Add a slight delay for animation
      setTimeout(() => {
        navigate(`/room/${room}`);
      }, 5);
    }
  };  useEffect(() => {
      socket.on("join-room", handleSubmit);
    }, [socket]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  // Floating particles animation
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 2}s`
      }}
    />
  ));

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-400/20 via-transparent to-transparent"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles}
      </div>

      {/* Grid pattern overlay */}
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/25">
              <Globe className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Join the Experience
            </h1>
            <p className="text-purple-200/80 text-lg">Connect with others in real-time</p>
          </div>

          {/* Form card */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-500">
            <div className="space-y-6">
              {/* Email input */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 z-10" />
                  <Input
                    value={email}
                    label="Email Address"
                    type="email"
                    className="pl-12"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Room ID input with generator */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 z-10" />
                  <Input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="pl-12 pr-20"
                    endContent={
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="Generate random room ID"
                          className="focus:outline-none hover:scale-110 transition-transform text-purple-300 hover:text-white"
                          type="button"
                          onClick={generateRandomRoomId}
                        >
                          <Shuffle className="w-5 h-5" />
                        </button>
                        <button
                          aria-label="toggle password visibility"
                          className="focus:outline-none hover:scale-110 transition-transform text-purple-300 hover:text-white"
                          type="button"
                          onClick={toggleVisibility}
                        >
                          {isVisible ? (
                            <EyeSlashFilledIcon className="text-xl" />
                          ) : (
                            <EyeFilledIcon className="text-xl" />
                          )}
                        </button>
                      </div>
                    }
                    label="Room ID"
                    type={isVisible ? "text" : "password"}
                    placeholder="Enter or generate room ID"
                  />
                </div>
              </div>

              {/* Generate room button */}
              <Button
                onClick={generateRandomRoomId}
                className="w-full bg-white/10 hover:bg-white/20 text-purple-200 border border-white/20 hover:border-white/30 transition-all duration-300"
                startContent={<Sparkles className="w-4 h-4" />}
              >
                Generate Random Room ID
              </Button>

              {/* Join button */}
              <Button
                className={`w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 text-white ${
                  isJoining ? 'scale-95 opacity-80' : 'hover:scale-[1.02]'
                }`}
                onClick={handleSubmit}
                disabled={!email || !room || isJoining}
                startContent={
                  isJoining ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )
                }
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </Button>
            </div>

            {/* Status indicator */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-purple-200/60">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Ready to connect
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-purple-200/40 text-sm">
              Secure • Real-time • Collaborative
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}