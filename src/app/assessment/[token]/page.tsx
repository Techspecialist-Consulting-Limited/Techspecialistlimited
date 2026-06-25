/* eslint-disable react-hooks/purity, react-hooks/immutability, react-hooks/refs, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { VoiceWaveform, RecordingIndicator, ListeningOrb, TopicProgressBar } from '@/components/assessment';
import { BrandedLoader } from '@/components/recruitment';

type AssessmentState = 'loading' | 'ready' | 'starting' | 'conversing' | 'completed' | 'error';
type ConversationPhase = 'ai_speaking' | 'listening' | 'recording' | 'processing';

const SPEECH_THRESHOLD = 15;
const SILENCE_THRESHOLD = 8;
const SILENCE_DURATION_MS = 1500;
const MIN_RECORDING_MS = 500;

const WS_BASE = process.env.NEXT_PUBLIC_ASSESSMENT_WS_URL || 'ws://localhost:8000';
const API_BASE = '/api/recruitment';

interface AssessmentMeta {
  candidate_name: string;
  job_title: string;
  topic_labels: string[];
  topic_count: number;
  topic_time_limit: number;
  instructions: string;
  has_existing_session: boolean;
  existing_conversation_id: string | null;
}

function playAudio(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.play();
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function AssessmentPortal() {
  const { token } = useParams();
  const [state, setState] = useState<AssessmentState>('loading');
  const [phase, setPhase] = useState<ConversationPhase>('listening');
  const [meta, setMeta] = useState<AssessmentMeta | null>(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentTopicLabel, setCurrentTopicLabel] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const lastAiChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const vadFrameRef = useRef<number>(0);
  const aiTextRef = useRef('');
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    fetch(`${API_BASE}/assessment/${token}`)
      .then((r) => r.json())
      .then((data) => {
        setMeta(data);
        if (data.topic_labels?.[0]) setCurrentTopicLabel(data.topic_labels[0]);
        if (data.has_existing_session && data.existing_conversation_id)
          setConversationId(data.existing_conversation_id);
        setState('ready');
      })
      .catch(() => { setErrorMsg('Failed to load assessment'); setState('error'); });
  }, [token]);

  useEffect(() => {
    if (phase === 'recording') {
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    }
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, [phase]);

  useEffect(() => {
    return () => {
      if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
      wsRef.current?.close();
    };
  }, []);

  const startVAD = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    function checkVolume() {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      const recording = mediaRecorderRef.current?.state === 'recording';
      if (avg > SPEECH_THRESHOLD && !recording && phaseRef.current === 'listening') startRecordingFromVAD();
      else if (avg < SILENCE_THRESHOLD && recording) {
        if (silenceStartRef.current === null) silenceStartRef.current = Date.now();
        else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
          const dur = recordingStartRef.current ? Date.now() - recordingStartRef.current : 0;
          if (dur >= MIN_RECORDING_MS) { stopRecordingAndSubmit(); return; }
        }
      } else silenceStartRef.current = null;
      vadFrameRef.current = requestAnimationFrame(checkVolume);
    }
    vadFrameRef.current = requestAnimationFrame(checkVolume);
  }, []);

  const stopVAD = () => { if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current); vadFrameRef.current = 0; };

  const startRecordingFromVAD = () => {
    if (!mediaStreamRef.current) return;
    silenceStartRef.current = null;
    const recorder = new MediaRecorder(mediaStreamRef.current);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      sendAudioToWebSocket(blob);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    recordingStartRef.current = Date.now();
    setPhase('recording');
  };

  const stopRecordingAndSubmit = () => {
    stopVAD();
    setPhase('processing');
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  const sendAudioToWebSocket = async (blob: Blob) => {
    const buffer = await blob.arrayBuffer();
    wsRef.current?.send(JSON.stringify({ type: 'audio', data: arrayBufferToBase64(buffer) }));
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    aiTextRef.current = '';
  };

  const playNextChunk = useCallback(() => {
    const queue = audioQueueRef.current;
    if (queue.length === 0) {
      isPlayingRef.current = false;
      setPhase('listening');
      setTimeout(() => startVAD(), 200);
      return;
    }
    isPlayingRef.current = true;
    setPhase('ai_speaking');
    const blob = queue.shift()!;
    playAudio(blob).then(() => playNextChunk());
  }, [startVAD]);

  const initMicAndAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const audioCtx = new AudioContext();
    audioCtx.resume();
    audioContextRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
  };

  const connectWebSocket = (convId: string) => {
    const ws = new WebSocket(`${WS_BASE}/api/assessment/${token}/ws?conversation_id=${convId}`);
    wsRef.current = ws;
    ws.onopen = () => { setState('conversing'); setPhase('listening'); setTimeout(() => startVAD(), 500); };
    ws.onmessage = (event) => handleWSMessage(JSON.parse(event.data));
    ws.onerror = () => { setErrorMsg('Connection lost'); setState('error'); };
    ws.onclose = (event) => {
      if (event.code === 1000 || event.code === 1005) return;
      setState((cur) => {
        if (cur === 'completed' || cur === 'starting' || cur === 'ready') return cur;
        setErrorMsg('Connection closed unexpectedly');
        return 'error';
      });
    };
  };

  const handleStartInterview = async () => {
    setState('starting');
    try {
      await initMicAndAudio();
      if (conversationId) { connectWebSocket(conversationId); return; }
      const res = await fetch(`${API_BASE}/assessment/${token}?action=start`, { method: 'POST' });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.detail || `Error ${res.status}`); }
      const blob = await res.blob();
      const convId = res.headers.get('X-Conversation-Id') || res.headers.get('x-conversation-id') || '';
      const topicLabel = res.headers.get('X-Topic-Label') || res.headers.get('x-topic-label') || '';
      const aiText = res.headers.get('X-AI-Text') || res.headers.get('x-ai-text') || '';
      setConversationId(convId);
      if (topicLabel) setCurrentTopicLabel(topicLabel);
      if (blob.size > 0) await playAudio(blob);
      else if (aiText) await new Promise<void>((resolve) => { const u = new SpeechSynthesisUtterance(aiText); u.onend = () => resolve(); speechSynthesis.speak(u); });
      connectWebSocket(convId);
    } catch (e) { setErrorMsg(e instanceof Error ? e.message : 'Failed to start interview'); setState('error'); }
  };

  const handleWSMessage = useCallback((msg: Record<string, unknown>) => {
    switch (msg.type) {
      case 'audio_chunk': {
        const binaryStr = atob(msg.data as string);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        if (audioQueueRef.current.length === 0 && !isPlayingRef.current)
          lastAiChunksRef.current = [blob];
        else
          lastAiChunksRef.current.push(blob);
        audioQueueRef.current.push(blob);
        if (!isPlayingRef.current) playNextChunk();
        break;
      }
      case 'audio_done': {
        const topicLabel = msg.topic_label as string;
        if (topicLabel) {
          setCurrentTopicLabel(topicLabel);
          const idx = meta?.topic_labels?.indexOf(topicLabel) ?? -1;
          if (idx >= 0) setCurrentTopicIndex(idx);
        }
        if (audioQueueRef.current.length === 0 && !isPlayingRef.current) {
          if ((msg as Record<string, unknown>).dev_mode_tts && aiTextRef.current) {
            const u = new SpeechSynthesisUtterance(aiTextRef.current);
            u.onend = () => startVAD();
            speechSynthesis.speak(u);
          } else { setPhase('listening'); setTimeout(() => startVAD(), 200); }
        }
        if (msg.is_done) setTimeout(() => setState('completed'), 1000);
        break;
      }
      case 'transcript': if ((msg.role as string) === 'ai') aiTextRef.current = msg.text as string; break;
      case 'interview_complete': setState('completed'); break;
      case 'error': setErrorMsg(msg.message as string); setState('error'); break;
    }
  }, [startVAD, playNextChunk, meta]);

  const handleRepeat = () => {
    if (lastAiChunksRef.current.length === 0) return;
    stopVAD();
    audioQueueRef.current = [...lastAiChunksRef.current];
    isPlayingRef.current = false;
    playNextChunk();
  };

  const endInterview = () => {
    stopVAD();
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    wsRef.current?.send(JSON.stringify({ type: 'end' }));
    setPhase('processing');
  };

  /* ── LOADING STATE ── */
  if (state === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold text-white" style={{ background: 'var(--blue)' }}>TS</div>
          <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shimmer 2s infinite' }} />
        </div>
        <p className="text-[14px] text-white/50">Preparing your interview...</p>
      </div>
    );
  }

  /* ── ERROR STATE ── */
  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 text-center" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--heading)]">Something went wrong</h2>
          <p className="mb-6 text-[13px] text-[var(--body)]">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  /* ── COMPLETED STATE ── */
  if (state === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'linear-gradient(135deg, var(--blue), #1a3a6e)' }}>
        <div className="w-full max-w-[520px] rounded-2xl bg-white p-10 text-center" style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.5s ease' }}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(69, 132, 237, 0.1)' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <h1 className="font-syne mb-2 text-[28px] font-extrabold text-[var(--heading)]">Interview Complete</h1>
          <p className="mb-6 text-[15px] leading-relaxed text-[var(--body)]">
            Thank you for speaking with us. Your responses have been recorded and will be reviewed by our team.
          </p>
          <div className="mx-auto mb-6 h-[2px] w-12 rounded" style={{ background: 'linear-gradient(90deg, var(--blue), var(--orange))' }} />
          <div className="mb-6 space-y-3 text-left">
            <div className="flex items-center gap-3"><div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: 'var(--blue)' }}>1</div><span className="text-[13px] text-[var(--body)]">Your responses are being evaluated</span></div>
            <div className="flex items-center gap-3"><div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: 'var(--blue)' }}>2</div><span className="text-[13px] text-[var(--body)]">Our team will review the assessment</span></div>
            <div className="flex items-center gap-3"><div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: 'var(--blue)' }}>3</div><span className="text-[13px] text-[var(--body)]">You&apos;ll hear from us with next steps</span></div>
          </div>
          <div className="flex h-8 items-center justify-center gap-2 text-[11px] text-[var(--body)]">
            <div className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white" style={{ background: 'var(--blue)' }}>TS</div>
            TechSpecialist
          </div>
        </div>
      </div>
    );
  }

  /* ── READY / BRIEFING STATE ── */
  if (state === 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'linear-gradient(180deg, var(--navy) 0%, #0f1a30 50%, var(--bg-soft) 100%)' }}>
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-8 sm:p-10" style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.5s ease' }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(69, 132, 237, 0.1)' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
            </div>
            <h1 className="font-syne text-[24px] font-extrabold text-[var(--heading)]">Voice Interview</h1>
          </div>

          <div className="mb-6 text-[14px] text-[var(--body)]">
            <span className="font-semibold text-[var(--heading)]">{meta?.candidate_name}</span> &mdash; {meta?.job_title}
          </div>

          {/* What to expect */}
          <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[var(--border)]" style={{ background: 'var(--border)' }}>
            {[
              { icon: '🤖', label: 'AI Interviewer', desc: 'Natural conversation' },
              { icon: '📋', label: `${meta?.topic_count || 0} Topics`, desc: 'To discuss' },
              { icon: '⏱', label: 'Duration', desc: `~${(meta?.topic_count || 3) * 3} minutes` },
            ].map((item) => (
              <div key={item.label} className="bg-white p-4 text-center">
                <div className="mb-1 text-lg">{item.icon}</div>
                <div className="text-[12px] font-bold text-[var(--heading)]">{item.label}</div>
                <div className="text-[10px] text-[var(--body)]">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          {meta?.instructions && (
            <div className="mb-6 rounded-lg p-4" style={{ background: 'rgba(69, 132, 237, 0.04)', borderLeft: '3px solid var(--blue)' }}>
              <p className="text-[13px] leading-relaxed text-[var(--body)]">{meta.instructions}</p>
            </div>
          )}

          {/* Requirements */}
          <div className="mb-6 space-y-2">
            {[
              { icon: '🎤', text: 'Microphone access required' },
              { icon: '🔊', text: 'Audio output needed' },
              { icon: '🤫', text: 'Quiet environment recommended' },
            ].map((req) => (
              <div key={req.text} className="flex items-center gap-3 text-[13px] text-[var(--body)]">
                <span>{req.icon}</span> {req.text}
              </div>
            ))}
          </div>

          {/* Existing session banner */}
          {meta?.has_existing_session && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
              You have an existing session. Click below to resume.
            </div>
          )}

          {/* Start button */}
          <button
            onClick={handleStartInterview}
            className="group flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 text-[16px] font-semibold text-white transition-all hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg, var(--navy), #1a2e50)',
              boxShadow: '0 12px 40px rgba(8, 14, 30, 0.25)',
            }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="transition-transform group-hover:scale-110">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
            {meta?.has_existing_session ? 'Resume Interview' : 'Start Interview'}
          </button>
        </div>
      </div>
    );
  }

  /* ── STARTING STATE ── */
  if (state === 'starting') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <BrandedLoader size={48} text="Connecting to your interviewer..." />
      </div>
    );
  }

  /* ── CONVERSING STATE ── */
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--navy)' }}>
      {/* Top bar */}
      <div
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(8, 14, 30, 0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="hidden h-7 w-7 items-center justify-center rounded text-[9px] font-bold text-white sm:flex" style={{ background: 'var(--blue)' }}>TS</div>
          <div>
            <div className="text-[12px] font-semibold text-white/80">{meta?.candidate_name}</div>
            <div className="text-[10px] text-white/40">AI Interview</div>
          </div>
        </div>

        {meta?.topic_labels && (
          <div className="hidden sm:block">
            <TopicProgressBar topics={meta.topic_labels} currentIndex={currentTopicIndex} />
          </div>
        )}

        <div className="flex items-center gap-4">
          {phase === 'recording' && (
            <div className="text-[14px] font-bold text-red-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
            </div>
          )}
          <button onClick={endInterview} className="text-[11px] font-medium text-red-400/70 transition-colors hover:text-red-400">
            End Interview
          </button>
        </div>
      </div>

      {/* Mobile topic label */}
      {currentTopicLabel && (
        <div className="fixed left-0 right-0 top-[52px] z-40 flex justify-center py-2 sm:hidden">
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
            {currentTopicLabel}
          </span>
        </div>
      )}

      {/* Main visualization */}
      <div className="flex flex-1 flex-col items-center justify-center pt-16">
        {phase === 'ai_speaking' && (
          <div className="flex flex-col items-center gap-6" style={{ animation: 'fadeUp 0.3s ease' }}>
            <div
              className="flex h-[120px] w-[120px] items-center justify-center rounded-full"
              style={{ background: 'rgba(69, 132, 237, 0.06)', border: '2px solid rgba(69, 132, 237, 0.15)', boxShadow: '0 0 60px var(--assess-glow-blue)' }}
            >
              <VoiceWaveform isActive barCount={5} color="var(--blue)" />
            </div>
            <div className="text-center">
              <p className="text-[16px] font-medium text-white">Interviewer is speaking...</p>
            </div>
          </div>
        )}

        {phase === 'listening' && (
          <div className="flex flex-col items-center" style={{ animation: 'fadeUp 0.3s ease' }}>
            <ListeningOrb />
            <button
              onClick={handleRepeat}
              className="mt-6 flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium text-white/50 transition-all hover:bg-white/5 hover:text-white/80"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              Repeat
            </button>
          </div>
        )}

        {phase === 'recording' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <RecordingIndicator isRecording startTime={recordingStartRef.current || undefined} />
          </div>
        )}

        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-5" style={{ animation: 'fadeUp 0.3s ease' }}>
            <div
              className="flex h-[120px] w-[120px] items-center justify-center rounded-full"
              style={{ background: 'rgba(69, 132, 237, 0.06)', border: '2px solid rgba(69, 132, 237, 0.15)' }}
            >
              <div className="h-8 w-8 rounded-full border-[3px] border-white/10 border-t-[var(--blue)]" style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
            <p className="text-[14px] text-white/50">Processing your response...</p>
            <div className="relative h-1 w-48 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 1.5s infinite' }} />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
