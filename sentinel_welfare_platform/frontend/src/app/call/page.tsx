'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, 
  RefreshCw, ArrowLeft, HeartHandshake, User, CheckCircle2 
} from 'lucide-react';
import { AshokStambh } from '@/components/AshokStambh';
import { useLanguage } from '@/context/LanguageContext';

function MobileCallContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const myParam = searchParams.get('my') || '9876543200';
  const targetParam = searchParams.get('target') || '9876543210';
  const roleParam = searchParams.get('role') || 'family';

  const [myNumber, setMyNumber] = useState(myParam);
  const [targetNumber, setTargetNumber] = useState(targetParam);
  const [callerRole, setCallerRole] = useState(roleParam);

  const [callStarted, setCallStarted] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [diagStatus, setDiagStatus] = useState('Ready');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const candidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clean1 = myNumber.replace(/\D/g, '').slice(-10) || '9876543200';
  const clean2 = targetNumber.replace(/\D/g, '').slice(-10) || '9876543210';
  const sortedRoom = [clean1, clean2].sort().join('_');
  const roomId = `call_${sortedRoom}`;

  const createSyntheticMediaStream = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      let angle = 0;
      
      const drawFrame = () => {
        if (!ctx) return;
        ctx.fillStyle = '#0a2540';
        ctx.fillRect(0, 0, 640, 480);

        angle = (angle + 0.05) % (Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(320, 240, 60 + Math.sin(angle) * 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SENTINEL SECURE MOBILE P2P', 320, 180);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '18px monospace';
        ctx.fillText(`+91 ${clean1}`, 320, 245);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = '14px sans-serif';
        ctx.fillText('Encrypted Mobile Stream Active', 320, 320);

        requestAnimationFrame(drawFrame);
      };
      drawFrame();

      return canvas.captureStream(20);
    } catch (e) {
      return null;
    }
  };

  const startMobileCall = async () => {
    setCallStarted(true);
    setCallDuration(0);
    setDiagStatus('Connecting mobile media...');
    candidateQueue.current = [];

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
        ]
      });
      pcRef.current = pc;

      let acquiredStream: MediaStream | null = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          acquiredStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: 'user' }
          });
        }
      } catch (mediaErr) {
        console.warn('Mobile media blocked on HTTP. Synthetic video active.', mediaErr);
        setDiagStatus('Camera blocked on HTTP; encrypted stream active.');
      }

      if (!acquiredStream) {
        acquiredStream = createSyntheticMediaStream();
      }

      if (acquiredStream) {
        localStreamRef.current = acquiredStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = acquiredStream;
        acquiredStream.getTracks().forEach(track => pc.addTrack(track, acquiredStream!));
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setHasRemoteVideo(true);
          setCallConnected(true);
          setDiagStatus('Live 1:1 Video Connected!');
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallConnected(true);
          setDiagStatus('P2P ICE Connected');
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
          }
        }
      };

      // Connect to WebSocket signaling server using host IP
      const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      const ws = new WebSocket(`ws://${host}:8000/api/signaling/ws/${roomId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setDiagStatus(`Connected to room: ${roomId}`);
        ws.send(JSON.stringify({ type: 'peer_ready' }));
      };

      ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data);
          
          if (data.type === 'peer_joined' || data.type === 'peer_ready') {
            setDiagStatus('Peer online. Exchanging Offer...');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify(offer));
          } else if (data.type === 'offer') {
            setDiagStatus('Received Offer. Replying with Answer...');
            await pc.setRemoteDescription(new RTCSessionDescription(data));

            while (candidateQueue.current.length > 0) {
              const c = candidateQueue.current.shift();
              if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify(answer));
          } else if (data.type === 'answer') {
            setDiagStatus('Received Answer. Finalizing connection...');
            await pc.setRemoteDescription(new RTCSessionDescription(data));

            while (candidateQueue.current.length > 0) {
              const c = candidateQueue.current.shift();
              if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
          } else if (data.candidate) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
            } else {
              candidateQueue.current.push(data.candidate);
            }
          } else if (data.type === 'peer_disconnected') {
            setCallConnected(false);
            setHasRemoteVideo(false);
            setDiagStatus('Laptop peer disconnected.');
          }
        } catch (e) {
          console.error('[Mobile Call] Handler error:', e);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ candidate: event.candidate }));
        }
      };

    } catch (err) {
      console.error('[Mobile Call] Error:', err);
      setDiagStatus('Connection error.');
    }
  };

  const endMobileCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (pcRef.current) pcRef.current.close();
    if (wsRef.current) wsRef.current.close();
    setCallStarted(false);
    setCallConnected(false);
    setHasRemoteVideo(false);
    setCallDuration(0);
    setDiagStatus('Call Ended');
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Mobile Top Header */}
      <div className="p-3 bg-[#0a2540] border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AshokStambh className="w-6 h-8 brightness-200" />
          <div>
            <h1 className="text-xs font-bold tracking-tight">
              {t("SENTINEL SECURE CALL", "सेंटिनल सुरक्षित कॉल")}
            </h1>
            <p className="text-[10px] text-emerald-400">P2P Encrypted (MHA Directive §6a)</p>
          </div>
        </div>
        <Link 
          href="/"
          className="text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300"
        >
          {t("Exit", "बंद करें")}
        </Link>
      </div>

      {/* Screen 1: Answer / Join Call Screen */}
      {!callStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center animate-pulse">
              <div className="w-18 h-18 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                <Video className="w-9 h-9 text-white" />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {t("Incoming Call Invitation", "इनकमिंग वीडियो कॉल आमंत्रण")}
            </span>
            <h2 className="text-xl font-bold text-white pt-1">
              {callerRole === 'soldier' ? t("Family Member (+91 " + clean2 + ")", "परिवार सदस्य (+91 " + clean2 + ")") : t("Paramilitary Personnel (+91 " + clean2 + ")", "जवान (+91 " + clean2 + ")")}
            </h2>
            <p className="text-xs text-slate-400">
              {t("Your Phone: ", "आपका फ़ोन: ")}<strong className="text-white">+91 {clean1}</strong>
            </p>
          </div>

          {/* Number Adjustment Inputs */}
          <div className="w-full max-w-xs bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-left space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                {t("This Phone's Number:", "इस फ़ोन का नंबर:")}
              </label>
              <input
                type="tel"
                value={myNumber}
                onChange={(e) => setMyNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                {t("Laptop User's Number:", "लैपटॉप यूज़र का नंबर:")}
              </label>
              <input
                type="tel"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-white text-xs"
              />
            </div>
          </div>

          <button
            onClick={startMobileCall}
            className="w-full max-w-xs py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
          >
            <Phone className="w-5 h-5 text-white animate-bounce" />
            <span>{t("Answer & Connect 1:1 Video", "कॉल उठाएं एवं वीडियो से जुड़ें")}</span>
          </button>
        </div>
      ) : (

        /* Screen 2: Active Call View */
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* Main Remote View */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/80">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {callConnected ? t("Exchanging WebRTC Media...", "मीडिया स्ट्रीम कनेक्ट हो रही है...") : t("Connecting to Laptop Peer...", "लैपटॉप से कनेक्शन स्थापित हो रहा है...")}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    {diagStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Self View Floating PIP */}
            <div className="absolute top-4 right-4 w-28 h-40 bg-slate-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-mono">
                {t("You", "आप")}
              </div>
            </div>

            {/* Top Status Overlay */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-xs font-mono text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{callConnected ? formatDuration(callDuration) : t("Negotiating...", "कनेक्ट हो रहा है...")}</span>
              </span>
              <span className="text-[9px] text-amber-300 bg-black/70 px-2 py-0.5 rounded max-w-[200px] truncate">
                {diagStatus}
              </span>
            </div>
          </div>

          {/* Bottom Floating Call Controls */}
          <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-center gap-6 z-30">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-4 rounded-full transition shadow-lg ${
                micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white'
              }`}
            >
              {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button
              onClick={endMobileCall}
              className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl transition transform active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`p-4 rounded-full transition shadow-lg ${
                videoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white'
              }`}
            >
              {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          </div>

        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="py-2 px-4 bg-[#06182a] border-t border-slate-800 text-center text-[10px] text-slate-500">
        Sentinel Secure WebRTC • Ministry of Home Affairs, Govt. of India
      </div>
    </div>
  );
}

export default function MobileCallScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs">
        Loading Sentinel Call Screen...
      </div>
    }>
      <MobileCallContent />
    </Suspense>
  );
}
