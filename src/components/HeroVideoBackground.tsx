'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const VIDEO_SRC =
  'https://res.cloudinary.com/daqmbfctv/video/upload/v1786533751/WhatsApp_Video_2026-08-12_at_12.04.56_tueklx.mp4';

/* Frame 0 of the same asset, so the still and the clip are seamless at handoff. */
const STILL_SRC =
  'https://res.cloudinary.com/daqmbfctv/video/upload/so_0,c_limit,w_1920/v1786533751/WhatsApp_Video_2026-08-12_at_12.04.56_tueklx.jpg';

/* Below this the still carries the hero on its own — the clip is 2.4 MB. */
const VIDEO_MIN_WIDTH = 768;

/* Bright, handheld boardroom footage. Dimming and desaturating it keeps white headline copy
   readable, and the light blur settles the camera shake so it reads as a backdrop rather than
   something the visitor is meant to watch. Paired with the scrims below to hold ~11:1 on the
   headline while the room stays clearly legible. */
const FOOTAGE_FILTER = 'saturate(0.45) contrast(1.05) brightness(0.5) blur(2px)';

/* Slowed well below real time so the pan drifts rather than moves. Stretches the 10.6s clip to
   roughly 26s a loop. `playbackRate` is a property with no React prop, so it is set imperatively. */
const PLAYBACK_RATE = 0.4;

/* The clip ends on the wall screen and restarts on the wide table shot, so the loop is a hard cut.
   Fading out over the last stretch dissolves into the still underneath — which is frame 0, exactly
   what plays next — turning the snap into a soft handover. Media seconds, so ~1.25s of wall clock
   at the rate above. */
const LOOP_FADE_SECONDS = 0.5;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const WIDE_ENOUGH_QUERY = `(min-width: ${VIDEO_MIN_WIDTH}px)`;

function subscribeToPlaybackConditions(onChange: () => void) {
  const queries = [window.matchMedia(REDUCED_MOTION_QUERY), window.matchMedia(WIDE_ENOUGH_QUERY)];
  queries.forEach((query) => query.addEventListener('change', onChange));
  return () => queries.forEach((query) => query.removeEventListener('change', onChange));
}

function readPlaybackAllowed() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return (
    !saveData &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches &&
    window.matchMedia(WIDE_ENOUGH_QUERY).matches
  );
}

/* The server has no viewport to measure, so it always renders the still alone. */
function readPlaybackAllowedOnServer() {
  return false;
}

export default function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [atLoopSeam, setAtLoopSeam] = useState(false);
  const videoAllowed = useSyncExternalStore(
    subscribeToPlaybackConditions,
    readPlaybackAllowed,
    readPlaybackAllowedOnServer
  );

  const handleCanPlay = () => {
    const video = videoRef.current;
    if (video) video.playbackRate = PLAYBACK_RATE;
    setVideoReady(true);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    // Identical values bail out of re-rendering, so this is cheap despite firing continuously.
    setAtLoopSeam(video.duration - video.currentTime < LOOP_FADE_SECONDS);
  };

  // Stop decoding frames once the hero scrolls away.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = PLAYBACK_RATE;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.playbackRate = PLAYBACK_RATE;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [videoAllowed]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#080e1e]" aria-hidden="true">
      {/* Footage — still paints immediately, clip cross-fades in on top when it can play */}
      <div className="absolute inset-0 scale-[1.06]" style={{ filter: FOOTAGE_FILTER }}>
        <Image
          src={STILL_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {videoAllowed && (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            tabIndex={-1}
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[900ms] ease-in-out ${
              videoReady && !atLoopSeam ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Readability scrim — even top-to-bottom below lg, where the copy is centred over the frame */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,14,30,0.86) 0%, rgba(8,14,30,0.78) 45%, rgba(8,14,30,0.86) 100%)',
        }}
      />
      {/* …and diagonal on desktop, heaviest under the headline column, lifting toward the panel */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            'linear-gradient(100deg, rgba(8,14,30,0.88) 0%, rgba(8,14,30,0.74) 38%, rgba(8,14,30,0.52) 72%, rgba(8,14,30,0.6) 100%)',
        }}
      />

      {/* Brand light, same palette as the services hero */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 22% 12%, rgba(69,132,237,0.22) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 82% 88%, rgba(239,101,38,0.12) 0%, transparent 60%)',
        }}
      />

      {/* 60px grid, carried over from the rest of the dark sections */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Edge vignette so the fixed header reads cleanly and the section seam stays flat */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: 'linear-gradient(180deg, rgba(8,14,30,0.9) 0%, transparent 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{ background: 'linear-gradient(0deg, #080e1e 0%, transparent 100%)' }}
      />
    </div>
  );
}
