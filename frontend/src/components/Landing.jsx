import Spline from '@splinetool/react-spline';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate()
    const handleClick = ()=>{
        navigate('/login')
    }
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Spline canvas */}
      <Spline
        scene="https://prod.spline.design/C2OtVJxVnTayLCUp/scene.splinecode"
        className="w-full h-full"
      />
      
      {/* Cover for Spline branding - positioned at bottom right */}
      <div className="absolute bottom-0 right-0 w-32 h-16 bg-gradient-to-tl from-slate-900/90 to-transparent z-20"></div>
      
      {/* Main UI Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-8 px-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
              <span className="bg-gradient-to-r from-[#ff6c6c] via-[#ff3797] to-[#0073ff] bg-clip-text text-transparent">
                Welcome
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-[#1d1d1d] max-w-2xl mx-auto leading-relaxed">
              Experience interactive Coding Interview
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto">
            <button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleClick}
              className="group relative px-8 py-4 border-white  bg-transparent text-white font-semibold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/25 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-12 pointer-events-auto">
            {['Interactive', 'Real-time', 'Serverless', 'Monaco'].map((feature, index) => (
              <span
                key={feature}
                className="px-4 py-2 bg-white/10 backdrop-blur-md text-white/90 rounded-full text-sm font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-default"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CodeView
            </span>
          </div>
          
          {/* <div className="hidden md:flex space-x-8 text-white/80">
            <a href="#" className="hover:text-white transition-colors duration-200">Home</a>
            <a href="#" className="hover:text-white transition-colors duration-200">About</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Services</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Contact</a>
          </div> */}
          
          <button className="md:hidden text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>
      
      {/* Bottom Info Bar */}
      <div className="absolute bottom-5 left-6 right-5 z-20">
        <div className="flex justify-between items-center text-white/60 text-sm">
          <div className="flex items-center space-x-4">
            
          </div>
          
          <div className="hidden sm:flex items-center space-x-6">
            <span>Follow me</span>
            <div className="flex space-x-3 bg-gradient-to-r from-[#7568ff] to-[#3265ff] p-1 pr-2 pl-2 rounded-xl">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  <span className="text-xs">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Ambient Light Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}