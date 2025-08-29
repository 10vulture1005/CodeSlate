import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import CodeEditor from "./components/CodeEditor";
import axios from "axios";
import { encode as btoa } from "base-64"; 


import {
  Autocomplete,
  AutocompleteSection,
  AutocompleteItem,
} from "@heroui/react";

import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import CodingRoom from "./components/CodingRoom";
import Lobby from './components/Lobby'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PeerProvider } from './providers/Peer'
import { SocketProvider } from './providers/Sockets'
import Room from './components/Room'
import Login from "./components/Signinup";
import Home from "./components/Landing";
// import Lobby from "./components/prevlobby";
function App() {


  return (

      <SocketProvider>
      <PeerProvider>

    <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/lobby' element={<Lobby/>}/>
        <Route path={`/room/:roomid`} element={<Room/>}/>
      
      
    </Routes>
      </PeerProvider>
    </SocketProvider>

  );
}

export default App;
