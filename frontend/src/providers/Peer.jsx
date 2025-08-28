import React, { useState,createContext, useContext, useMemo,useEffect, useCallback } from 'react'

export const usePeer = ()=>useContext(PeerContext);
const PeerContext=createContext(null);
export const PeerProvider=(props)=>{
  const [remoteStream,setRemoteStream] = useState(null);
    const peer = useMemo(()=> new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
    }),[])


    const createOffer = async ()=>{
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    }

    const createAnswere = async (offer)=>{
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;

    }
    const setRemoteAnswer = async (ans)=>{
      await peer.setRemoteDescription(ans);
    }

const [tracksAdded, setTracksAdded] = useState(false);

const sendStream = async (stream) => {
  if (tracksAdded) return; // ✅ Prevent adding again

  const tracks = stream.getTracks();
  for (const track of tracks) {
    peer.addTrack(track, stream);
  }

  setTracksAdded(true);
}



    const handleTrackEvent=useCallback((ev)=>{
        const streams = ev.streams;
        setRemoteStream(streams[0])
    },[]);




    useEffect(()=>{
      peer.addEventListener('track',handleTrackEvent);
        return()=>{
          peer.removeEventListener('track',handleTrackEvent)
        }
      
    },[peer,handleTrackEvent])

    return <PeerContext.Provider value={{peer ,createOffer,createAnswere,setRemoteAnswer,sendStream,remoteStream}}>{props.children}</PeerContext.Provider>
}