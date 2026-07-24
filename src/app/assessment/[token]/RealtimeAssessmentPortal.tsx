/* eslint-disable react-hooks/purity, react-hooks/immutability, react-hooks/refs, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { TopicProgressBar } from '@/components/assessment';
import { BrandedLoader } from '@/components/recruitment';

const LOGO_URL = 'https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png';

type AssessmentState = 'loading' | 'ready' | 'instructions' | 'setup' | 'conversing' | 'completed' | 'error' | 'expired' | 'terminated_violation';
type ConversationPhase = 'ai_speaking' | 'listening' | 'processing';
type SetupStep = 'mic_request' | 'mic_testing' | 'speaker_test' | 'speaker_confirm' | 'connecting' | 'ready_to_start';

const PLAYBACK_SAMPLE_RATE = 24000;
const CAPTURE_SAMPLE_RATE = 24000;
const HR_CONTACT_EMAIL = 'HR@mswitchgroup.com';

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
  interview_max_minutes?: number;
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToInt16Array(b64: string): Int16Array {
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return new Int16Array(bytes.buffer);
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

export default function RealtimeAssessmentPortal() {
  const { token } = useParams();

  const [state, setState] = useState<AssessmentState>('loading');
  const [phase, setPhase] = useState<ConversationPhase>('ai_speaking');
  const [meta, setMeta] = useState<AssessmentMeta | null>(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentTopicLabel, setCurrentTopicLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [aiDisplayText, setAiDisplayText] = useState('');
  const [hasReplayableMessage, setHasReplayableMessage] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [candidateTranscript, setCandidateTranscript] = useState('');
  const [completedTopics, setCompletedTopics] = useState<number[]>([]);
  const [transcriptLog, setTranscriptLog] = useState<{ role: 'ai' | 'candidate'; text: string }[]>([]);
  const [liveMicLevel, setLiveMicLevel] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const [setupStep, setSetupStep] = useState<SetupStep>('mic_request');
  const [micLevel, setMicLevel] = useState(0);
  const [setupError, setSetupError] = useState('');
  const [consentChecks, setConsentChecks] = useState({ guidelines: false, device: false, integrityPolicy: false, dataConsent: false });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureNodeRef = useRef<AudioWorkletNode | null>(null);
  const micTestFrameRef = useRef<number>(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevTopicIndexRef = useRef(0);
  const lastAiTextRef = useRef('');
  const newAiTurnRef = useRef(true);
  const audioFinishedRef = useRef(false);
  const finalScoreReceivedRef = useRef(false);
  const interviewStartRef = useRef(0);
  // Guards against a fast double-click sending two overlapping "skip"/"end"
  // messages before React re-renders the disabled button — the realtime API
  // errors (and can behave erratically) if a second response.create() fires
  // while the first is still in flight.
  const actionLockRef = useRef(false);

  // Playback scheduling for streamed PCM16 chunks
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastAiBuffersRef = useRef<AudioBuffer[]>([]);
  const currentTurnBuffersRef = useRef<AudioBuffer[]>([]);
  const aiSpeakingWatchdogRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const liveMicFrameRef = useRef<number>(0);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // ── Playback of the one-off REST greeting (mp3, from the shared /start endpoint) ──

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

  // ── PCM16 streaming playback ──

  function getPlaybackContext(): AudioContext {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
    }
    return playbackCtxRef.current;
  }

  function schedulePcmChunk(base64Data: string, forReplay = false) {
    const ctx = getPlaybackContext();
    const int16 = base64ToInt16Array(base64Data);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;

    const buffer = ctx.createBuffer(1, float32.length, PLAYBACK_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);
    if (!forReplay) currentTurnBuffersRef.current.push(buffer);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
    scheduledSourcesRef.current.push(source);
    source.onended = () => {
      scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source);
    };
  }

  function stopScheduledPlayback() {
    for (const source of scheduledSourcesRef.current) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    scheduledSourcesRef.current = [];
    nextStartTimeRef.current = playbackCtxRef.current ? playbackCtxRef.current.currentTime : 0;
  }

  function stopAllPlayback() {
    speechSynthesis.cancel();
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    stopScheduledPlayback();
  }

  // A brief, understated two-note cue marking "your turn to speak" — deliberately
  // not a game-y beep, closer to a soft notification chime.
  function playTurnCue() {
    const ctx = getPlaybackContext();
    const now = ctx.currentTime;
    [[523.25, 0], [659.25, 0.09]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.05, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  // ── Live mic level meter (runs continuously while it's the candidate's turn) ──

  useEffect(() => {
    if (phase !== 'listening' || !analyserRef.current) {
      setLiveMicLevel(0);
      return;
    }
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const check = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      setLiveMicLevel(Math.min(sum / dataArray.length / 40, 1));
      liveMicFrameRef.current = requestAnimationFrame(check);
    };
    liveMicFrameRef.current = requestAnimationFrame(check);
    return () => {
      if (liveMicFrameRef.current) cancelAnimationFrame(liveMicFrameRef.current);
    };
  }, [phase]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [transcriptLog]);

  // ── Countdown timer (interview_max_minutes, configured per job) ──

  useEffect(() => {
    if (state !== 'conversing' || !meta?.interview_max_minutes) return;
    const totalMs = meta.interview_max_minutes * 60 * 1000;
    const tick = () => {
      const remaining = Math.max(0, totalMs - (Date.now() - interviewStartRef.current));
      setSecondsLeft(Math.ceil(remaining / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state, meta]);

  // ── Load metadata ──

  useEffect(() => {
    fetch(`${API_BASE}/assessment/${token}`)
      .then(async (r) => {
        if (r.status === 410) { setState('expired'); return null; }
        if (!r.ok) throw new Error('Invalid link');
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setMeta(data);
        if (data.topic_labels?.[0]) setCurrentTopicLabel(data.topic_labels[0]);
        if (data.has_existing_session && data.existing_conversation_id)
          setConversationId(data.existing_conversation_id);
        setState('instructions');
      })
      .catch(() => { setErrorMsg('Failed to load assessment. Please check your link and try again.'); setState('error'); });
  }, [token]);

  useEffect(() => {
    return () => {
      if (micTestFrameRef.current) cancelAnimationFrame(micTestFrameRef.current);
      if (aiSpeakingWatchdogRef.current) clearInterval(aiSpeakingWatchdogRef.current);
      captureNodeRef.current?.disconnect();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
      playbackCtxRef.current?.close();
      wsRef.current?.close();
      stopAllPlayback();
    };
  }, []);

  // ── Continuous mic capture via AudioWorklet ──

  const startContinuousCapture = useCallback(async () => {
    if (!mediaStreamRef.current || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    await ctx.audioWorklet.addModule('/worklets/pcm-capture-processor.js');
    const source = ctx.createMediaStreamSource(mediaStreamRef.current);
    const node = new AudioWorkletNode(ctx, 'pcm-capture-processor', {
      processorOptions: { targetSampleRate: CAPTURE_SAMPLE_RATE },
    });
    node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ type: 'audio', data: arrayBufferToBase64(e.data) }));
    };
    source.connect(node);
    captureNodeRef.current = node;
  }, []);

  // ── WebSocket ──

  // Only flip to the "completed" screen once BOTH the closing statement has
  // actually finished playing (not a guessed timeout) AND the final score has
  // arrived — otherwise the screen can swap away while the AI is still talking.
  function maybeFinishInterview() {
    if (audioFinishedRef.current && finalScoreReceivedRef.current) {
      setState('completed');
    }
  }

  const connectWebSocket = useCallback((convId: string) => {
    const ws = new WebSocket(`${WS_BASE}/api/assessment/${token}/realtime-ws?conversation_id=${convId}`);
    wsRef.current = ws;
    ws.onopen = () => {
      setPhase('listening');
      startContinuousCapture();
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'audio_chunk':
          actionLockRef.current = false;
          setPhase('ai_speaking');
          schedulePcmChunk(msg.data);
          break;
        case 'interrupt':
          actionLockRef.current = false;
          stopScheduledPlayback();
          currentTurnBuffersRef.current = [];
          newAiTurnRef.current = true;
          setPhase('listening');
          break;
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
          lastAiBuffersRef.current = currentTurnBuffersRef.current;
          currentTurnBuffersRef.current = [];

          const ctx = playbackCtxRef.current;
          const remainingMs = ctx ? Math.max(0, (nextStartTimeRef.current - ctx.currentTime) * 1000) : 0;
          if (aiSpeakingWatchdogRef.current) clearTimeout(aiSpeakingWatchdogRef.current);
          if (msg.is_done) {
            // Wait for the closing statement's audio to actually finish playing
            // (not a flat guessed delay) before allowing the completed screen.
            audioFinishedRef.current = false;
            setTimeout(() => {
              audioFinishedRef.current = true;
              maybeFinishInterview();
            }, remainingMs + 300);
          } else {
            aiSpeakingWatchdogRef.current = setTimeout(() => {
              setPhase('listening');
              playTurnCue();
            }, remainingMs + 150) as unknown as ReturnType<typeof setInterval>;
          }
          break;
        }
        case 'transcript_delta':
          if (newAiTurnRef.current) {
            setAiDisplayText(msg.text);
            newAiTurnRef.current = false;
          } else {
            setAiDisplayText((prev) => prev + msg.text);
          }
          setPhase('ai_speaking');
          break;
        case 'transcript':
          if (msg.role === 'candidate') {
            newAiTurnRef.current = true;
            setCandidateTranscript(msg.text);
            setProcessingStatus('Preparing next question...');
            setTranscriptLog((prev) => [...prev, { role: 'candidate', text: msg.text }]);
          } else if (msg.role === 'ai') {
            // Authoritative full text, in case any deltas were dropped — resyncs the caption.
            lastAiTextRef.current = msg.text;
            setAiDisplayText(msg.text);
            setHasReplayableMessage(true);
            setCandidateTranscript('');
            setProcessingStatus('');
            setPhase('ai_speaking');
            setTranscriptLog((prev) => [...prev, { role: 'ai', text: msg.text }]);
          }
          break;
        case 'interview_complete':
          finalScoreReceivedRef.current = true;
          maybeFinishInterview();
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
        if (cur === 'completed' || cur === 'ready' || cur === 'setup' || cur === 'terminated_violation') return cur;
        setErrorMsg('Connection closed unexpectedly.');
        return 'error';
      });
    };
  }, [meta, token, startContinuousCapture]);

  // ── Setup flow (mic/speaker check — identical UX to the legacy portal) ──

  const requestMicrophone = async () => {
    setSetupStep('mic_request');
    setSetupError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
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

  const greetingBlobRef = useRef<Blob | null>(null);
  const greetingConvIdRef = useRef('');
  const greetingTextRef = useRef('');
  const greetingTopicRef = useRef('');

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
    interviewStartRef.current = Date.now();

    const convId = greetingConvIdRef.current || conversationId || '';
    const aiText = greetingTextRef.current;
    const greetingBlob = greetingBlobRef.current;

    if (aiText) {
      setAiDisplayText(aiText);
      lastAiTextRef.current = aiText;
      setHasReplayableMessage(true);
    }

    if (greetingBlob && greetingBlob.size > 0) {
      await playAudioBlob(greetingBlob);
    } else if (aiText) {
      await speakText(aiText);
    }

    connectWebSocket(convId);
  };

  // ── Replay ──

  const handleReplay = async () => {
    stopAllPlayback();
    setPhase('ai_speaking');

    if (lastAiBuffersRef.current.length > 0) {
      const ctx = getPlaybackContext();
      let t = ctx.currentTime;
      for (const buffer of lastAiBuffersRef.current) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(t);
        t += buffer.duration;
      }
      nextStartTimeRef.current = t;
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, (t - ctx.currentTime) * 1000)));
    } else if (lastAiTextRef.current) {
      await speakText(lastAiTextRef.current);
    }

    setPhase('listening');
  };

  // ── Skip / End interview ──

  const handleSkipQuestion = useCallback(() => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setPhase('processing');
    setProcessingStatus('Moving to next question...');
    setCandidateTranscript('');
    wsRef.current?.send(JSON.stringify({ type: 'skip' }));
  }, []);

  const endInterview = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    stopAllPlayback();
    // Candidate-initiated end has no AI closing statement to wait for.
    audioFinishedRef.current = true;
    wsRef.current?.send(JSON.stringify({ type: 'end' }));
    setPhase('processing');
    setProcessingStatus('Wrapping up your interview...');
  };

  // ── Anti-cheating: leaving the interview tab/window ends the session immediately ──

  const handleViolationRef = useRef<(reason: string) => void>(() => {});
  handleViolationRef.current = (reason: string) => {
    stopAllPlayback();
    captureNodeRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'violation', reason }));
    }
    wsRef.current?.close();
    setState('terminated_violation');
  };

  useEffect(() => {
    if (state !== 'conversing') return;

    const onVisibilityChange = () => {
      if (document.hidden) handleViolationRef.current('tab_hidden');
    };
    const onBlur = () => handleViolationRef.current('window_blur');

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [state]);

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

  if (state === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 text-center" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--heading)]">Assessment Link Expired</h2>
          <p className="mb-4 text-[13px] leading-relaxed text-[var(--body)]">
            This assessment link is no longer valid. If you believe this is an error or would like a new invitation, please contact our HR team.
          </p>
          <button onClick={() => window.location.href = '/careers'} className="btn-primary">Browse Careers</button>
        </div>
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

  if (state === 'terminated_violation') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 text-center" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--heading)]">Interview ended</h2>
          <p className="mb-4 text-[13px] leading-relaxed text-[var(--body)]">
            Your interview was ended automatically because you left this window or switched to another tab or application. This is a security measure to protect the integrity of the assessment.
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--body)]">
            If you believe this happened in error, please reach out to our HR team at{' '}
            <a href={`mailto:${HR_CONTACT_EMAIL}`} className="font-semibold" style={{ color: 'var(--blue)' }}>{HR_CONTACT_EMAIL}</a>.
          </p>
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
    const allChecked = consentChecks.guidelines && consentChecks.device && consentChecks.integrityPolicy && consentChecks.dataConsent;
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12" style={{ background: 'linear-gradient(180deg, var(--navy) 0%, #0f1a30 100%)' }}>
        <div className="w-full max-w-[620px] rounded-2xl bg-white p-8 sm:p-10" style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.5s ease' }}>
          <div className="mb-6 flex items-center gap-3">
            <Image src={LOGO_URL} alt="TechSpecialist" width={36} height={36} className="h-9 w-auto" />
            <div>
              <h1 className="font-syne text-[22px] font-extrabold text-[var(--heading)]">Interview Preparation</h1>
              <p className="text-[12px] text-[var(--body)]">{meta?.candidate_name} · {meta?.job_title}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl p-5" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">How this interview works</p>
            <div className="space-y-3 text-[13px] leading-relaxed text-[var(--body)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>1</div>
                <p>You will discuss <strong>{meta?.topic_count || 3} topics</strong> with an AI interviewer. Each topic may include a follow-up question or two, depending on your answers.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>2</div>
                <p>The AI will speak the question aloud and display it as text on screen. Take your time to think before responding.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>3</div>
                <p>Just speak naturally when it&apos;s your turn. The AI listens continuously and knows when you&apos;re done. There are no buttons to press.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--blue)' }}>4</div>
                <p>Answer naturally and thoroughly. There are no trick questions. We want to understand your experience and thinking.</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-[12px] font-bold text-amber-800">Recommended setup</p>
            <p className="text-[12px] leading-relaxed text-amber-700"><strong>Headphones are strongly recommended</strong> to avoid the AI hearing its own voice through your speakers. Use a laptop or desktop computer with a stable internet connection, in a quiet environment.</p>
          </div>

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-[12px] font-bold text-red-800">Assessment integrity policy</p>
            <ul className="space-y-1 text-[12px] leading-relaxed text-red-700" style={{ paddingLeft: '16px', listStyleType: 'disc' }}>
              <li>Stay on this page for the entire interview. Switching tabs, opening another window, or minimizing the browser will end the session immediately.</li>
              {/* <li>The AI interviewer only discusses the interview questions. It will not answer unrelated questions and will not respond to attempts to change how it behaves.</li> */}
              <li>Complete the interview yourself, in one sitting, without outside assistance.</li>
            </ul>
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Please confirm the following</p>
            {[
              { key: 'guidelines' as const, label: 'I have read and understand the interview guidelines above' },
              { key: 'device' as const, label: 'I am using a device with a working microphone and speakers' },
              { key: 'integrityPolicy' as const, label: 'I understand the assessment integrity policy above, including that leaving this page ends the interview immediately' },
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
            {['A working microphone is required', 'Headphones recommended for the best experience', 'A quiet environment is recommended'].map((text) => (
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
            <div className="text-[10px] text-white/40">AI Interview (Live)</div>
          </div>
        </div>
        {meta?.topic_labels && (
          <div className="hidden sm:block">
            <TopicProgressBar topics={meta.topic_labels} currentIndex={currentTopicIndex} />
          </div>
        )}
        <div className="flex items-center gap-3">
          {secondsLeft !== null && (
            <span
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold tabular-nums sm:flex"
              style={{
                border: `1px solid ${secondsLeft <= 120 ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.1)'}`,
                color: secondsLeft <= 120 ? '#f87171' : 'rgba(255,255,255,0.5)',
              }}
            >
              {formatCountdown(secondsLeft)}
            </span>
          )}
          <span className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/40 sm:flex" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" style={{ animation: 'pulseDot 2s ease-in-out infinite' }} />
            Live
          </span>
          <button
            onClick={endInterview}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white/60 transition-colors hover:border-red-400/40 hover:text-red-400"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
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
          <div className="hidden lg:flex flex-col items-center py-8 pl-8 pr-4" style={{ width: '220px' }}>
            {meta.topic_labels.map((label, i) => {
              const isDone = completedTopics.includes(i);
              const isCurrent = i === currentTopicIndex;
              const isFuture = !isDone && !isCurrent;
              return (
                <div key={i} className="flex items-start gap-3" style={{ flex: i < meta.topic_labels.length - 1 ? 1 : 'none', minHeight: i < meta.topic_labels.length - 1 ? '60px' : 'auto' }}>
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

        {/* Center content: interview panel -- flex-1 with a matching spacer on the right so it centers on the full page width, not just the leftover space next to the sidebar */}
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          {/* "Your turn" banner -- deliberately unmissable: full-width, high-contrast, own row above the panel */}
          {phase === 'listening' && (
            <div
              className="mb-3 flex w-full max-w-[560px] items-center gap-3 rounded-lg px-5 py-3.5"
              style={{ background: '#16a34a', animation: 'bannerIn 0.25s ease' }}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              </div>
              <div>
                <p className="text-[14px] font-bold leading-tight text-white">Your turn to speak</p>
                <p className="text-[11.5px] leading-tight text-white/80">I&apos;ll know when you&apos;re done, no need to press anything</p>
              </div>
            </div>
          )}

          <div
            className="w-full max-w-[560px] overflow-hidden rounded-xl transition-shadow"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
              border: phase === 'listening' ? '1px solid rgba(34, 197, 94, 0.45)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: phase === 'listening'
                ? '0 0 0 3px rgba(34, 197, 94, 0.12), 0 24px 60px -20px rgba(0,0,0,0.55)'
                : '0 24px 60px -20px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--blue), rgba(69, 132, 237, 0.15))' }} />
            {/* Status row */}
            <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: phase === 'listening' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(69, 132, 237, 0.12)',
                    border: `1px solid ${phase === 'listening' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(69, 132, 237, 0.25)'}`,
                  }}
                >
                  {phase === 'ai_speaking' && (
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.6-.72-1.6-1.6v-4.8c0-.88.72-1.6 1.6-1.6h2.24z" /></svg>
                  )}
                  {phase === 'listening' && (
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                  )}
                  {phase === 'processing' && (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/15 border-t-[var(--blue)]" style={{ animation: 'spin 0.8s linear infinite' }} />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white/90">
                    {phase === 'ai_speaking' && 'Interviewer speaking'}
                    {phase === 'listening' && 'Your turn to respond'}
                    {phase === 'processing' && (processingStatus || 'Processing...')}
                  </p>
                  <p className="text-[11px] text-white/40">
                    {phase === 'ai_speaking' && 'Please wait for the question to finish'}
                    {phase === 'listening' && "Speak naturally. I'll know when you're done"}
                    {phase === 'processing' && candidateTranscript && `"${candidateTranscript}"`}
                  </p>
                </div>
              </div>

              {/* Level meter */}
              <div className="flex h-6 items-end gap-[3px]" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => {
                  const active = phase === 'ai_speaking' || (phase === 'listening' && liveMicLevel > i / 5);
                  return (
                    <div
                      key={i}
                      className="w-[3px] rounded-full transition-all duration-150"
                      style={{
                        height: phase === 'ai_speaking' ? undefined : `${6 + i * 3}px`,
                        minHeight: '6px',
                        background: active ? (phase === 'listening' ? '#22c55e' : 'var(--blue)') : 'rgba(255,255,255,0.12)',
                        animation: phase === 'ai_speaking' ? `waveBar 1.2s ease-in-out ${i * 0.15}s infinite` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Current line */}
            <div className="px-6 py-7">
              {aiDisplayText && (
                <p className="text-[17px] leading-relaxed tracking-[0.01em] text-white/90">{aiDisplayText}</p>
              )}
              {!aiDisplayText && <p className="text-[14px] text-white/30">Connecting…</p>}
            </div>
          </div>

          {/* Live transcript -- desktop only, gives the session a visible back-and-forth record */}
          {transcriptLog.length > 0 && (
            <div
              className="mt-4 hidden w-full max-w-[560px] flex-1 flex-col overflow-hidden rounded-xl lg:flex"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', maxHeight: '220px' }}
            >
              <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/30" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                Transcript
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                {transcriptLog.map((entry, i) => (
                  <div key={i} className="text-[12.5px] leading-relaxed">
                    <span className="font-semibold" style={{ color: entry.role === 'ai' ? 'var(--blue)' : '#22c55e' }}>
                      {entry.role === 'ai' ? 'Interviewer: ' : 'You: '}
                    </span>
                    <span className="text-white/60">{entry.text}</span>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Spacer -- mirrors the sidebar's width so the center content is truly centered on the page, not just the leftover space */}
        {meta?.topic_labels && meta.topic_labels.length > 0 && (
          <div className="hidden lg:block" style={{ width: '220px' }} />
        )}
      </div>

      {/* ── Fixed bottom toolbar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4"
        style={{ background: 'rgba(8, 14, 30, 0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-[560px] items-center justify-between gap-3">
          <button
            onClick={handleReplay}
            disabled={phase === 'processing' || !hasReplayableMessage}
            className="flex items-center gap-2 rounded-md px-3.5 py-2 text-[12.5px] font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Replay
          </button>

          <button
            onClick={handleSkipQuestion}
            disabled={phase === 'processing'}
            className="flex items-center gap-2 rounded-md px-3.5 py-2 text-[12.5px] font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Skip question
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes waveBar { 0%, 100% { height: 6px; } 50% { height: 22px; } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bannerIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
