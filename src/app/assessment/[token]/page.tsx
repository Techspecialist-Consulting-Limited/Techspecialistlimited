/* eslint-disable react-hooks/purity, react-hooks/immutability, react-hooks/refs, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { VoiceWaveform, RecordingIndicator, TopicProgressBar } from '@/components/assessment';
import { BrandedLoader } from '@/components/recruitment';

const LOGO_URL = 'https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png';

type AssessmentState = 'loading' | 'ready' | 'instructions' | 'setup' | 'starting' | 'conversing' | 'completed' | 'error';
type ConversationPhase = 'ai_speaking' | 'listening' | 'recording' | 'processing';
type SetupStep = 'mic_request' | 'mic_testing' | 'speaker_test' | 'speaker_confirm' | 'connecting' | 'ready_to_start';

const SILENCE_THRESHOLD = 10;
const SILENCE_DURATION_MS = 2000;
const MIN_RECORDING_MS = 800;

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function generateTestTone(durationMs = 600, frequency = 520): Blob {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationMs / 1000);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); w(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  const fadeLen = Math.floor(numSamples * 0.1);
  for (let i = 0; i < numSamples; i++) {
    let a = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    if (i < fadeLen) a *= i / fadeLen;
    else if (i > numSamples - fadeLen) a *= (numSamples - i) / fadeLen;
    view.setInt16(44 + i * 2, a * 32767, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export default function AssessmentPortal() {
  const { token } = useParams();

  const [state, setState] = useState<AssessmentState>('loading');
  const [phase, setPhase] = useState<ConversationPhase>('ai_speaking');
  const [meta, setMeta] = useState<AssessmentMeta | null>(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentTopicLabel, setCurrentTopicLabel] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [aiDisplayText, setAiDisplayText] = useState('');
  const [hasReplayableMessage, setHasReplayableMessage] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [candidateTranscript, setCandidateTranscript] = useState('');
  const [completedTopics, setCompletedTopics] = useState<number[]>([]);

  const [setupStep, setSetupStep] = useState<SetupStep>('mic_request');
  const [micLevel, setMicLevel] = useState(0);
  const [setupError, setSetupError] = useState('');
  const [consentChecks, setConsentChecks] = useState({ guidelines: false, device: false, dataConsent: false });

  const wsRef = useRef<WebSocket | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const lastAiAudioRef = useRef<Blob[]>([]);
  const lastAiTextRef = useRef('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const vadFrameRef = useRef<number>(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const phaseRef = useRef(phase);
  const micTestFrameRef = useRef<number>(0);
  const greetingBlobRef = useRef<Blob | null>(null);
  const greetingConvIdRef = useRef('');
  const greetingTextRef = useRef('');
  const greetingTopicRef = useRef('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSkippingRef = useRef(false);
  const prevTopicIndexRef = useRef(0);
  phaseRef.current = phase;

  // ── Audio playback ──

  function playAudioBlob(blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); };
      audio.play().catch(() => resolve());
    });
  }

  function speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!text) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }

  function stopAllPlayback() {
    speechSynthesis.cancel();
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }

  // ── Load metadata ──

  useEffect(() => {
    fetch(`${API_BASE}/assessment/${token}`)
      .then((r) => { if (!r.ok) throw new Error('Invalid link'); return r.json(); })
      .then((data) => {
        setMeta(data);
        if (data.topic_labels?.[0]) setCurrentTopicLabel(data.topic_labels[0]);
        if (data.has_existing_session && data.existing_conversation_id)
          setConversationId(data.existing_conversation_id);
        setState('instructions');
      })
      .catch(() => { setErrorMsg('Failed to load assessment. Please check your link and try again.'); setState('error'); });
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
      if (micTestFrameRef.current) cancelAnimationFrame(micTestFrameRef.current);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
      wsRef.current?.close();
      stopAllPlayback();
    };
  }, []);

  // ── VAD (silence detection only — used DURING active recording as safety net) ──

  const startSilenceDetection = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    function check() {
      if (!analyserRef.current || phaseRef.current !== 'recording') return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      if (avg < SILENCE_THRESHOLD) {
        if (silenceStartRef.current === null) silenceStartRef.current = Date.now();
        else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
          const dur = recordingStartRef.current ? Date.now() - recordingStartRef.current : 0;
          if (dur >= MIN_RECORDING_MS) { handleDoneSpeaking(); return; }
        }
      } else {
        silenceStartRef.current = null;
      }
      vadFrameRef.current = requestAnimationFrame(check);
    }
    vadFrameRef.current = requestAnimationFrame(check);
  }, []);

  const stopSilenceDetection = () => {
    if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
    vadFrameRef.current = 0;
  };

  // ── Push-to-talk: manual start/stop recording ──

  const handleStartSpeaking = useCallback(() => {
    if (!mediaStreamRef.current || phaseRef.current === 'recording') return;
    stopAllPlayback();

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
    startSilenceDetection();
  }, [startSilenceDetection]);

  const handleDoneSpeaking = useCallback(() => {
    stopSilenceDetection();
    isSkippingRef.current = false;
    setPhase('processing');
    setProcessingStatus('Analyzing your response...');
    setCandidateTranscript('');
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleSkipQuestion = useCallback(() => {
    stopAllPlayback();
    stopSilenceDetection();
    isSkippingRef.current = true;
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    }
    setPhase('processing');
    setProcessingStatus('Moving to next question...');
    setCandidateTranscript('');
    if (mediaStreamRef.current) {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        sendAudioToWebSocket(blob);
      };
      recorder.start();
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 300);
    }
  }, []);

  const handleSkipPlayback = useCallback(() => {
    stopAllPlayback();
    setPhase('listening');
  }, []);

  const sendAudioToWebSocket = async (blob: Blob) => {
    const buffer = await blob.arrayBuffer();
    wsRef.current?.send(JSON.stringify({ type: 'audio', data: arrayBufferToBase64(buffer) }));
  };

  // ── Audio queue playback (WebSocket chunks) ──

  const playNextChunk = useCallback(() => {
    const queue = audioQueueRef.current;
    if (queue.length === 0) {
      isPlayingRef.current = false;
      setPhase('listening');
      return;
    }
    isPlayingRef.current = true;
    setPhase('ai_speaking');
    const blob = queue.shift()!;
    playAudioBlob(blob).then(() => playNextChunk());
  }, []);

  // ── WebSocket ──

  const connectWebSocket = useCallback((convId: string) => {
    const ws = new WebSocket(`${WS_BASE}/api/assessment/${token}/ws?conversation_id=${convId}`);
    wsRef.current = ws;
    ws.onopen = () => setPhase('listening');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'audio_chunk': {
          const binaryStr = atob(msg.data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          lastAiAudioRef.current.push(blob);
          audioQueueRef.current.push(blob);
          if (!isPlayingRef.current) playNextChunk();
          break;
        }
        case 'audio_done': {
          const topicLabel = msg.topic_label as string;
          if (topicLabel) {
            const oldIdx = prevTopicIndexRef.current;
            const newIdx = meta?.topic_labels?.indexOf(topicLabel) ?? -1;
            if (newIdx >= 0 && newIdx !== oldIdx) {
              setCompletedTopics((prev) => prev.includes(oldIdx) ? prev : [...prev, oldIdx]);
              prevTopicIndexRef.current = newIdx;
            }
            setCurrentTopicLabel(topicLabel);
            if (newIdx >= 0) setCurrentTopicIndex(newIdx);
          }

          const wasSkipping = isSkippingRef.current;
          isSkippingRef.current = false;

          if (audioQueueRef.current.length === 0 && !isPlayingRef.current) {
            if (msg.dev_mode_tts && lastAiTextRef.current) {
              setPhase('ai_speaking');
              speakText(lastAiTextRef.current).then(() => setPhase('listening'));
            } else {
              // After a skip, the AI already spoke the next question — go straight to listening
              setPhase(wasSkipping ? 'listening' : 'listening');
            }
          }
          if (msg.is_done) setTimeout(() => setState('completed'), 1500);
          break;
        }
        case 'transcript':
          if (msg.role === 'candidate') {
            if (!isSkippingRef.current) {
              setCandidateTranscript(msg.text);
            }
            setProcessingStatus(isSkippingRef.current ? 'Moving to next question...' : 'Preparing next question...');
          } else if (msg.role === 'ai') {
            lastAiTextRef.current = msg.text;
            lastAiAudioRef.current = [];
            setAiDisplayText(msg.text);
            setHasReplayableMessage(true);
            setCandidateTranscript('');
            setProcessingStatus('');
            setPhase('ai_speaking');
          }
          break;
        case 'interview_complete':
          setState('completed');
          break;
        case 'error':
          setErrorMsg(msg.message);
          setState('error');
          break;
      }
    };
    ws.onerror = () => { setErrorMsg('Connection lost. Please reload and try again.'); setState('error'); };
    ws.onclose = (event) => {
      if (event.code === 1000 || event.code === 1005) return;
      setState((cur) => {
        if (cur === 'completed' || cur === 'starting' || cur === 'ready' || cur === 'setup') return cur;
        setErrorMsg('Connection closed unexpectedly.');
        return 'error';
      });
    };
  }, [meta, playNextChunk, token]);

  // ── Setup flow ──

  const requestMicrophone = async () => {
    setSetupStep('mic_request');
    setSetupError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new AudioContext();
      await audioCtx.resume();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setSetupStep('mic_testing');
      startMicLevelMonitor(analyser);
    } catch {
      setSetupError('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
    }
  };

  const startMicLevelMonitor = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const check = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      setMicLevel(Math.min(sum / dataArray.length / 40, 1));
      micTestFrameRef.current = requestAnimationFrame(check);
    };
    micTestFrameRef.current = requestAnimationFrame(check);
    setTimeout(() => {
      if (micTestFrameRef.current) cancelAnimationFrame(micTestFrameRef.current);
      micTestFrameRef.current = 0;
      setSetupStep('speaker_test');
    }, 4000);
  };

  const playSpeakerTest = async () => {
    try {
      await playAudioBlob(generateTestTone(800, 520));
      setSetupStep('speaker_confirm');
    } catch {
      setSetupError('Could not play audio. Please check your volume.');
    }
  };

  const confirmSpeakerAndConnect = async () => {
    setSetupStep('connecting');
    try {
      if (conversationId) {
        setSetupStep('ready_to_start');
        return;
      }
      const res = await fetch(`${API_BASE}/assessment/${token}?action=start`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const convId = res.headers.get('X-Conversation-Id') || res.headers.get('x-conversation-id') || '';
      const topicLabel = res.headers.get('X-Topic-Label') || res.headers.get('x-topic-label') || '';
      const aiText = res.headers.get('X-AI-Text') || res.headers.get('x-ai-text') || '';

      greetingBlobRef.current = blob;
      greetingConvIdRef.current = convId;
      greetingTopicRef.current = topicLabel;
      greetingTextRef.current = aiText;
      setConversationId(convId);
      if (topicLabel) setCurrentTopicLabel(topicLabel);
      setSetupStep('ready_to_start');
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : 'Failed to connect. Please try again.');
      setSetupStep('speaker_confirm');
    }
  };

  const handleStartInterview = async () => {
    setState('conversing');
    setPhase('ai_speaking');

    const convId = greetingConvIdRef.current || conversationId || '';
    const aiText = greetingTextRef.current;
    const greetingBlob = greetingBlobRef.current;

    if (aiText) {
      setAiDisplayText(aiText);
      lastAiTextRef.current = aiText;
      setHasReplayableMessage(true);
    }

    if (greetingBlob && greetingBlob.size > 0) {
      lastAiAudioRef.current = [greetingBlob];
      await playAudioBlob(greetingBlob);
    } else if (aiText) {
      await speakText(aiText);
    }

    setPhase('listening');
    connectWebSocket(convId);
  };

  // ── Replay ──

  const handleReplay = async () => {
    stopSilenceDetection();
    stopAllPlayback();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    }

    setPhase('ai_speaking');

    if (lastAiAudioRef.current.length > 0 && lastAiAudioRef.current.some(b => b.size > 0)) {
      for (const blob of lastAiAudioRef.current) {
        if (blob.size > 0) await playAudioBlob(blob);
      }
    } else if (lastAiTextRef.current) {
      await speakText(lastAiTextRef.current);
    }

    setPhase('listening');
  };

  // ── End interview ──

  const endInterview = () => {
    stopSilenceDetection();
    stopAllPlayback();
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    wsRef.current?.send(JSON.stringify({ type: 'end' }));
    setPhase('processing');
    setProcessingStatus('Wrapping up your interview...');
  };

  // ── Render helpers ──

  const CheckIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Image src={LOGO_URL} alt="TechSpecialist" width={48} height={48} className="mb-6 h-12 w-auto" />
        <p className="text-[14px] text-white/50">Preparing your interview...</p>
      </div>
    );
  }

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

  if (state === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="w-full max-w-[440px] text-center" style={{ animation: 'fadeUp 0.5s ease' }}>
          <Image src={LOGO_URL} alt="TechSpecialist" width={40} height={40} className="mx-auto mb-8 h-10 w-auto" />
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '2px solid rgba(34, 197, 94, 0.3)' }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <h1 className="font-syne mb-3 text-[32px] font-extrabold text-white">All done</h1>
          <p className="mb-8 text-[15px] leading-relaxed text-white/60">
            Your interview has been submitted. We appreciate the time you took to speak with us, {meta?.candidate_name?.split(' ')[0]}.
          </p>
          <div className="rounded-xl px-6 py-5 text-left" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white/30">What happens next</p>
            <div className="space-y-3">
              {[
                'Our AI is evaluating your responses',
                'The hiring team will review your assessment',
                "We'll reach out with the outcome via email",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: 'rgba(69, 132, 237, 0.15)', color: 'var(--blue)' }}>{i + 1}</div>
                  <span className="text-[13px] leading-relaxed text-white/60">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 text-[11px] text-white/25">You can safely close this window.</p>
        </div>
      </div>
    );
  }

  if (state === 'instructions') {
    const allChecked = consentChecks.guidelines && consentChecks.device && consentChecks.dataConsent;
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12" style={{ background: 'linear-gradient(180deg, var(--navy) 0%, #0f1a30 100%)' }}>
        <div className="w-full max-w-[620px] rounded-2xl bg-white p-8 sm:p-10" style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.5s ease' }}>
          <div className="mb-6 flex items-center gap-3">
            <Image src={LOGO_URL} alt="TechSpecialist" width={36} height={36} className="h-9 w-auto" />
            <div>
              <h1 className="font-syne text-[22px] font-extrabold text-[var(--heading)]">Interview Preparation</h1>
              <p className="text-[12px] text-[var(--body)]">{meta?.candidate_name} &mdash; {meta?.job_title}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl p-5" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">How this interview works</p>
            <div className="space-y-3 text-[13px] leading-relaxed text-[var(--body)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>1</div>
                <p>You will be asked <strong>{meta?.topic_count || 3} questions</strong> by an AI interviewer. Each question covers a different topic relevant to the role.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>2</div>
                <p>The AI will speak the question aloud and display it as text on screen. Take your time to think before responding.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>3</div>
                <p>Click <strong>&quot;Start Speaking&quot;</strong> when you are ready to answer, and <strong>&quot;Done Speaking&quot;</strong> when you have finished. You can replay any question if needed.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>4</div>
                <p>Answer naturally and thoroughly. There are no trick questions — we want to understand your experience and thinking.</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-[12px] font-bold text-amber-800">Recommended setup</p>
            <p className="text-[12px] leading-relaxed text-amber-700">Use a <strong>laptop or desktop computer</strong> with a stable internet connection for the best experience. Ensure you are in a quiet environment with minimal background noise.</p>
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Please confirm the following</p>
            {[
              { key: 'guidelines' as const, label: 'I have read and understand the interview guidelines above' },
              { key: 'device' as const, label: 'I am using a device with a working microphone and speakers' },
              { key: 'dataConsent' as const, label: 'I consent to my voice responses being recorded and stored for assessment purposes. Data will be retained for the duration of the hiring process and deleted thereafter.' },
            ].map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consentChecks[key]}
                  onChange={(e) => setConsentChecks((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[var(--border)] accent-[var(--blue)]"
                />
                <span className="text-[13px] leading-relaxed text-[var(--body)]">{label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={() => setState('ready')}
            disabled={!allChecked}
            className="group flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 text-[15px] font-semibold text-white transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            style={{ background: allChecked ? 'linear-gradient(135deg, var(--navy), #1a2e50)' : '#9ca3af', boxShadow: allChecked ? '0 12px 40px rgba(8, 14, 30, 0.25)' : 'none' }}
          >
            Proceed to System Check
          </button>
        </div>
      </div>
    );
  }

  if (state === 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'linear-gradient(180deg, var(--navy) 0%, #0f1a30 50%, var(--bg-soft) 100%)' }}>
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-8 sm:p-10" style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.5s ease' }}>
          <div className="mb-6 flex items-center gap-3">
            <Image src={LOGO_URL} alt="TechSpecialist" width={36} height={36} className="h-9 w-auto" />
            <h1 className="font-syne text-[24px] font-extrabold text-[var(--heading)]">System Check</h1>
          </div>
          <div className="mb-6 text-[14px] text-[var(--body)]">
            <span className="font-semibold text-[var(--heading)]">{meta?.candidate_name}</span> &mdash; {meta?.job_title}
          </div>
          <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[var(--border)]" style={{ background: 'var(--border)' }}>
            {[
              { label: 'AI Interviewer', desc: 'Natural conversation' },
              { label: `${meta?.topic_count || 0} Topics`, desc: 'To discuss' },
              { label: 'Duration', desc: `~${(meta?.topic_count || 3) * 3} minutes` },
            ].map((item) => (
              <div key={item.label} className="bg-white p-4 text-center">
                <div className="text-[12px] font-bold text-[var(--heading)]">{item.label}</div>
                <div className="mt-1 text-[10px] text-[var(--body)]">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="mb-6 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Before you begin</p>
            {['A working microphone is required', 'Speakers or headphones for audio playback', 'A quiet environment is recommended'].map((text) => (
              <div key={text} className="flex items-center gap-3 text-[13px] text-[var(--body)]">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {text}
              </div>
            ))}
          </div>
          {meta?.has_existing_session && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
              You have an existing session. Click below to resume where you left off.
            </div>
          )}
          <button
            onClick={() => { setState('setup'); requestMicrophone(); }}
            className="group flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 text-[16px] font-semibold text-white transition-all hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, var(--navy), #1a2e50)', boxShadow: '0 12px 40px rgba(8, 14, 30, 0.25)' }}
          >
            {meta?.has_existing_session ? 'Resume Interview' : 'Set Up & Begin'}
          </button>
        </div>
      </div>
    );
  }

  if (state === 'setup') {
    const stepsDone = {
      mic: ['speaker_test', 'speaker_confirm', 'connecting', 'ready_to_start'].includes(setupStep),
      speaker: ['connecting', 'ready_to_start'].includes(setupStep),
      connection: setupStep === 'ready_to_start',
    };
    const stepsActive = {
      mic: ['mic_request', 'mic_testing'].includes(setupStep),
      speaker: ['speaker_test', 'speaker_confirm'].includes(setupStep),
      connection: setupStep === 'connecting',
    };
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'linear-gradient(180deg, var(--navy) 0%, #0f1a30 100%)' }}>
        <div className="w-full max-w-[500px] rounded-2xl bg-white p-8 sm:p-10" style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.4s ease' }}>
          <h2 className="font-syne mb-6 text-[20px] font-extrabold text-[var(--heading)]">System Check</h2>
          <div className="mb-8 space-y-4">
            {[
              { label: 'Microphone', done: stepsDone.mic, active: stepsActive.mic },
              { label: 'Speakers', done: stepsDone.speaker, active: stepsActive.speaker },
              { label: 'AI Connection', done: stepsDone.connection, active: stepsActive.connection },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{
                  background: s.done ? 'rgba(34, 197, 94, 0.1)' : s.active ? 'rgba(69, 132, 237, 0.1)' : 'var(--bg-soft)',
                  border: s.done ? '2px solid var(--score-high)' : s.active ? '2px solid var(--blue)' : '2px solid var(--border)',
                }}>
                  {s.done ? <CheckIcon /> : s.active ? <div className="h-4 w-4 rounded-full border-2 border-blue-200 border-t-[var(--blue)]" style={{ animation: 'spin 0.7s linear infinite' }} /> : <span className="text-[11px] font-bold text-[var(--body)]">{i + 1}</span>}
                </div>
                <span className="text-[14px] font-medium" style={{ color: s.done ? 'var(--score-high)' : s.active ? 'var(--heading)' : 'var(--body)' }}>
                  {s.label} {s.done && <span className="text-[12px] font-normal">-- Passed</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--border)] p-6" style={{ background: 'var(--bg-soft)' }}>
            {setupStep === 'mic_request' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(69, 132, 237, 0.08)' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                </div>
                <p className="mb-1 text-[14px] font-semibold text-[var(--heading)]">Requesting microphone access</p>
                <p className="text-[12px] text-[var(--body)]">Please click &quot;Allow&quot; when your browser asks for permission.</p>
              </div>
            )}
            {setupStep === 'mic_testing' && (
              <div className="text-center">
                <p className="mb-4 text-[14px] font-semibold text-[var(--heading)]">Microphone detected -- say something to test it</p>
                <div className="mx-auto mb-3 h-3 w-full max-w-[280px] overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-100" style={{ width: `${Math.max(micLevel * 100, 3)}%`, background: micLevel > 0.5 ? 'var(--score-high)' : 'var(--blue)' }} />
                </div>
                <p className="text-[11px] text-[var(--body)]">Listening for your voice...</p>
              </div>
            )}
            {setupStep === 'speaker_test' && (
              <div className="text-center">
                <p className="mb-4 text-[14px] font-semibold text-[var(--heading)]">Now let&apos;s test your speakers</p>
                <p className="mb-4 text-[12px] text-[var(--body)]">Click below to play a short test sound. Make sure your volume is turned up.</p>
                <button onClick={playSpeakerTest} className="btn-primary mx-auto">Play Test Sound</button>
              </div>
            )}
            {setupStep === 'speaker_confirm' && (
              <div className="text-center">
                <p className="mb-4 text-[14px] font-semibold text-[var(--heading)]">Did you hear the test sound?</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={confirmSpeakerAndConnect} className="rounded-lg px-6 py-2.5 text-[13px] font-semibold text-white" style={{ background: 'var(--score-high)' }}>Yes, I heard it</button>
                  <button onClick={playSpeakerTest} className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-[13px] font-semibold text-[var(--body)] hover:border-[var(--blue)] hover:text-[var(--blue)]">Play again</button>
                </div>
              </div>
            )}
            {setupStep === 'connecting' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <BrandedLoader size={32} text="" />
                <p className="text-[14px] font-semibold text-[var(--heading)]">Connecting to your AI interviewer...</p>
              </div>
            )}
            {setupStep === 'ready_to_start' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '2px solid var(--score-high)' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </div>
                <p className="mb-1 text-[14px] font-bold text-[var(--score-high)]">All systems ready</p>
                <p className="mb-5 text-[12px] text-[var(--body)]">Your microphone, speakers, and AI connection are all working.</p>
                <button
                  onClick={handleStartInterview}
                  className="group mx-auto flex items-center justify-center gap-3 rounded-full px-8 py-4 text-[16px] font-semibold text-white transition-all hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, var(--navy), #1a2e50)', boxShadow: '0 12px 40px rgba(8, 14, 30, 0.25)' }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="transition-transform group-hover:scale-110"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                  Start Interview
                </button>
              </div>
            )}
          </div>
          {setupError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="mb-2 text-[13px] font-medium text-red-700">{setupError}</p>
              <button onClick={requestMicrophone} className="text-[12px] font-semibold text-red-600 underline hover:text-red-800">Try Again</button>
            </div>
          )}
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state === 'starting') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <BrandedLoader size={48} text="Starting your interview..." />
      </div>
    );
  }

  /* ══════════════════════════════════════════
     CONVERSING STATE
     ══════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--navy)' }}>
      {/* Top bar */}
      <div
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(8, 14, 30, 0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Image src={LOGO_URL} alt="TechSpecialist" width={28} height={28} className="hidden h-7 w-auto sm:block" />
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

      {/* Main content area with timeline */}
      <div className="flex flex-1 pt-20 pb-40">

        {/* Vertical topic timeline -- left side, hidden on mobile */}
        {meta?.topic_labels && meta.topic_labels.length > 0 && (
          <div className="hidden lg:flex flex-col items-center py-8 pl-8 pr-4" style={{ minWidth: '200px' }}>
            {meta.topic_labels.map((label, i) => {
              const isDone = completedTopics.includes(i);
              const isCurrent = i === currentTopicIndex;
              const isFuture = !isDone && !isCurrent;
              return (
                <div key={i} className="flex items-start gap-3" style={{ flex: i < meta.topic_labels.length - 1 ? 1 : 'none', minHeight: i < meta.topic_labels.length - 1 ? '60px' : 'auto' }}>
                  {/* Dot + line */}
                  <div className="flex flex-col items-center" style={{ minHeight: '100%' }}>
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300"
                      style={{
                        background: isDone ? 'rgba(34, 197, 94, 0.15)' : isCurrent ? 'rgba(69, 132, 237, 0.15)' : 'rgba(255,255,255,0.04)',
                        border: isDone ? '2px solid #22c55e' : isCurrent ? '2px solid var(--blue)' : '2px solid rgba(255,255,255,0.1)',
                        boxShadow: isCurrent ? '0 0 12px rgba(69, 132, 237, 0.3)' : 'none',
                      }}
                    >
                      {isDone ? (
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      ) : (
                        <span className="text-[10px] font-bold" style={{ color: isCurrent ? 'var(--blue)' : 'rgba(255,255,255,0.25)' }}>{i + 1}</span>
                      )}
                    </div>
                    {i < meta.topic_labels.length - 1 && (
                      <div className="flex-1 w-[2px] my-1 rounded-full transition-all duration-500" style={{
                        background: isDone ? '#22c55e' : isCurrent ? 'linear-gradient(to bottom, var(--blue), rgba(255,255,255,0.08))' : 'rgba(255,255,255,0.08)',
                        minHeight: '24px',
                      }} />
                    )}
                  </div>
                  {/* Label */}
                  <p
                    className="pt-1 text-[12px] font-medium transition-all duration-300"
                    style={{
                      color: isDone ? '#22c55e' : isCurrent ? 'var(--blue)' : 'rgba(255,255,255,0.25)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      opacity: isFuture ? 0.5 : 1,
                    }}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Center content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6">

          {/* Phase visual */}
          <div className="mb-6">
            {phase === 'ai_speaking' && (
              <div className="flex flex-col items-center gap-4" style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full" style={{ background: 'rgba(69, 132, 237, 0.06)', border: '2px solid rgba(69, 132, 237, 0.15)', boxShadow: '0 0 60px var(--assess-glow-blue)' }}>
                  <VoiceWaveform isActive barCount={5} color="var(--blue)" />
                </div>
                <p className="text-[13px] font-medium text-white/50">Interviewer</p>
              </div>
            )}

            {phase === 'listening' && (
              <div className="flex flex-col items-center gap-5" style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full" style={{ background: 'rgba(34, 197, 94, 0.06)', border: '2px solid rgba(34, 197, 94, 0.2)' }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-[15px] font-semibold text-white">Your turn to respond</p>
                <p className="text-[12px] text-white/40">Click &quot;Start Speaking&quot; when you&apos;re ready</p>
              </div>
            )}

            {phase === 'recording' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <RecordingIndicator isRecording startTime={recordingStartRef.current || undefined} />
              </div>
            )}

            {phase === 'processing' && (
              <div className="flex flex-col items-center gap-5" style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full" style={{ background: 'rgba(69, 132, 237, 0.06)', border: '2px solid rgba(69, 132, 237, 0.15)' }}>
                  <div className="h-8 w-8 rounded-full border-[3px] border-white/10 border-t-[var(--blue)]" style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
                <p className="text-[14px] font-medium text-white/70">{processingStatus || 'Processing...'}</p>
                {candidateTranscript && (
                  <div className="w-full max-w-[420px] rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/30">You said</p>
                    <p className="text-[13px] leading-relaxed text-white/60">{candidateTranscript}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI question text -- persistent across all phases except processing */}
          {aiDisplayText && phase !== 'processing' && (
            <div className="w-full max-w-[520px] rounded-xl px-6 py-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-center text-[15px] leading-relaxed text-white/85">{aiDisplayText}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed bottom control bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-6 py-5"
        style={{ background: 'linear-gradient(to top, rgba(8, 14, 30, 0.98) 50%, transparent)', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-[520px] items-center justify-between">
          {/* Left: Replay */}
          <button
            onClick={handleReplay}
            disabled={phase === 'processing' || phase === 'recording' || !hasReplayableMessage}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Replay
          </button>

          {/* Center: Main action */}
          {phase === 'listening' && (
            <button
              onClick={handleStartSpeaking}
              className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 6px 24px rgba(34, 197, 94, 0.4)' }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              Start Speaking
            </button>
          )}

          {phase === 'recording' && (
            <button
              onClick={handleDoneSpeaking}
              className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-[15px] font-semibold text-white transition-all active:scale-95"
              style={{ background: '#ef4444', boxShadow: '0 6px 24px rgba(239, 68, 68, 0.4)', animation: 'pulse 2s ease-in-out infinite' }}
            >
              <div className="h-3 w-3 rounded-sm bg-white" />
              Done Speaking
            </button>
          )}

          {phase === 'ai_speaking' && (
            <button
              onClick={handleSkipPlayback}
              className="flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
              </svg>
              Skip to Answer
            </button>
          )}

          {phase === 'processing' && (
            <div className="flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium text-white/40">
              <div className="h-4 w-4 rounded-full border-2 border-white/10 border-t-white/50" style={{ animation: 'spin 0.8s linear infinite' }} />
              Processing...
            </div>
          )}

          {/* Right: Skip Question */}
          <button
            onClick={handleSkipQuestion}
            disabled={phase === 'processing' || phase === 'ai_speaking'}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Skip
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
      `}</style>
    </div>
  );
}
