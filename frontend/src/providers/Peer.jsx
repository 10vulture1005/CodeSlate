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
      try {
        // Validate the offer object
        if (!offer || typeof offer !== 'object') {
          throw new Error('Offer is not a valid object');
        }
        
        if (!offer.type || !offer.sdp) {
          throw new Error(`Invalid offer: missing type (${offer.type}) or sdp (${!!offer.sdp})`);
        }
        
        if (offer.type !== 'offer') {
          throw new Error(`Invalid offer type: expected 'offer', got '${offer.type}'`);
        }
        
        console.log('Creating answer for offer:', { type: offer.type, sdpLength: offer.sdp?.length });
        
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        
        console.log('Created answer:', { type: answer.type, sdpLength: answer.sdp?.length });
        return answer;
      } catch (error) {
        console.error('Error in createAnswere:', error);
        console.error('Offer object:', offer);
        throw error;
      }
    }
    const setRemoteAnswer = async (ans)=>{
      try {
        if (!ans || typeof ans !== 'object') {
          throw new Error('Answer is not a valid object');
        }
        
        if (!ans.type || !ans.sdp) {
          throw new Error(`Invalid answer: missing type (${ans.type}) or sdp (${!!ans.sdp})`);
        }
        
        if (ans.type !== 'answer') {
          throw new Error(`Invalid answer type: expected 'answer', got '${ans.type}'`);
        }
        
        console.log('Setting remote answer:', { type: ans.type, sdpLength: ans.sdp?.length });
        await peer.setRemoteDescription(ans);
      } catch (error) {
        console.error('Error in setRemoteAnswer:', error);
        console.error('Answer object:', ans);
        throw error;
      }
    }

const [tracksAdded, setTracksAdded] = useState(false);

const sendStream = async (stream) => {
  if (tracksAdded) return; 

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