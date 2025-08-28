import React, { useContext, useMemo } from "react";
import {io} from "socket.io-client";
import { createContext } from "react";
const Socketcontext = createContext(null);



export const useSocket=()=>{
    return useContext(Socketcontext);
}
export const SocketProvider = (props)=>{
    const socket  = useMemo(()=>io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080"
        ,{
            transports: ["websocket"],
            withCredentials: true
        }
    ),[]);
    return (
        <Socketcontext.Provider value={{socket}}>

            {props.children}
        </Socketcontext.Provider>
    )
}