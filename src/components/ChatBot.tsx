'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const TOKEN_ENDPOINT = 'https://fa64327063b1ee6cb6ac5ab348f9f9.01.environment.api.powerplatform.com/powervirtualagents/botsbyschema/cr86a_robinaIntelligenceGuide/directline/token?api-version=2022-03-01-preview';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const webchatRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const webChatRenderedRef = useRef(false);
  const storeRef = useRef<any>(null);
  const pendingMessageRef = useRef('');

  async function openChat(initialMessage = '') {
    setIsOpen(true);
    setIsLoading(true);
    if (!webchatRef.current) {
      setIsLoading(false);
      return;
    }

    if (webChatRenderedRef.current) {
      setIsLoading(false);
      if (initialMessage && storeRef.current) {
        storeRef.current.dispatch({
          type: 'WEB_CHAT/SEND_MESSAGE',
          payload: { text: initialMessage }
        });
      }
      return;
    }

    try {
      const res = await fetch(TOKEN_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(`Token request failed: ${res.status} ${res.statusText}`);
      const tokenPayload = await res.json();

      const token = tokenPayload.token || tokenPayload.conversationToken || tokenPayload.directLineToken;
      if (!token) throw new Error('No Direct Line token returned by the token endpoint.');

      const directLine = (window as any).WebChat.createDirectLine({ token });

      storeRef.current = (window as any).WebChat.createStore(
        {},
        ({ dispatch }: any) => (next: any) => (action: any) => {
          if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
            setIsLoading(false);
            if (initialMessage) {
              dispatch({ type: 'WEB_CHAT/SEND_MESSAGE', payload: { text: initialMessage } });
            } else if (pendingMessageRef.current) {
              dispatch({ type: 'WEB_CHAT/SEND_MESSAGE', payload: { text: pendingMessageRef.current } });
              pendingMessageRef.current = '';
            }
          }
          if (action.type === 'WEB_CHAT/SEND_MESSAGE') {
            setShowIntro(false);
          }
          return next(action);
        }
      );

      const styleOptions = {
        hideUploadButton: true,
        botAvatarImage: 'https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_2206,w_2696/tbs_7274jpg_gmfio2_68362b.jpg',
        userAvatarInitials: 'You',
        botAvatarBackgroundColor: '#0d1f3c',
        userAvatarBackgroundColor: '#2563eb',
        bubbleBorderRadius: 14,
        bubbleFromUserBorderRadius: 14,
        bubbleBackground: '#ffffff',
        bubbleBorderWidth: 1,
        bubbleBorderColor: 'rgba(13,31,60,0.10)',
        bubbleFromUserBackground: '#1a4faa',
        bubbleFromUserBorderWidth: 0,
        bubbleFromUserBorderColor: 'transparent',
        bubbleTextColor: '#0d1f3c',
        bubbleFromUserTextColor: '#ffffff',
        suggestedActionBackground: '#ffffff',
        suggestedActionBorderColor: 'rgba(37,99,235,0.22)',
        suggestedActionBorderRadius: 8,
        suggestedActionBorderWidth: 1,
        suggestedActionTextColor: '#1a4faa',
        suggestedActionBackgroundColorOnHover: '#eef3ff',
        suggestedActionBorderColorOnHover: 'rgba(37,99,235,0.40)',
        sendBoxBackground: '#ffffff',
        sendBoxBorderTop: '1px solid rgba(13,31,60,0.09)',
        sendBoxTextColor: '#0d1f3c',
        sendBoxPlaceholderColor: '#8a9ab5',
        sendBoxButtonColor: '#2563eb',
        sendBoxButtonColorOnHover: '#1a4faa',
        sendBoxHeight: 54,
        timestampColor: '#8a9ab5',
        primaryFont: 'DM Sans, system-ui, -apple-system, sans-serif',
        rootHeight: '100%',
        rootWidth: '100%',
        bubbleMinHeight: 32,
        avatarSize: 38,
        messageActivityWordBreak: 'break-word'
      };

      (window as any).WebChat.renderWebChat(
        { directLine, store: storeRef.current, styleOptions },
        webchatRef.current
      );

      webChatRenderedRef.current = true;
    } catch (err) {
      setIsLoading(false);
      console.error('[TechSpecialist Copilot]', err);
      alert('The chat assistant could not be loaded.\nPlease check the Direct Line token endpoint and web channel settings.');
    }
  }

  function closeChat() {
    setIsOpen(false);
  }

  async function handleToggle() {
    if (isOpen) {
      closeChat();
    } else {
      await openChat();
    }
  }

  async function handleStarter(message: string) {
    pendingMessageRef.current = message;
    await openChat(message);
  }

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeChat();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <div className="ts-widget" id="tsChatWidget" ref={widgetRef}>
      <div
        className={`ts-panel ${isOpen ? 'open' : ''}`}
        id="tsChatPanel"
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Chat with Robina"
      >
        <div className="ts-panel-header">
          <div className="ts-panel-header-noise"></div>

          <div className="ts-header-left">
            <div className="ts-avatar-stack">
              <Image
                className="ts-avatar"
                src="https://res.cloudinary.com/daqmbfctv/image/upload/v1773840810/TBS_7274.jpg_gmfio2.jpg"
                alt="Robina"
              />
              <span className="ts-status-dot" aria-label="Online"></span>
            </div>

            <div className="ts-header-copy">
              <div className="ts-header-eyebrow">TechSpecialist Intelligence</div>
              <div className="ts-header-name">Robina</div>
            </div>
          </div>

          <div className="ts-header-right">
            <div className="ts-copilot-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Copilot
            </div>

            <button className="ts-btn-icon ts-close-btn" onClick={closeChat} aria-label="Close chat">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {showIntro && (
          <div className="ts-intro" id="tsChatIntro">
            <div className="ts-intro-spark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span>Ready to assist</span>
            </div>

            <h2 className="ts-intro-heading">How can I help you today?</h2>
            <p className="ts-intro-body">
              I can walk you through TechSpecialist&apos;s services, sector expertise,
              implementation approach, and help identify your ideal next step.
            </p>

            <div className="ts-starters">
              <button type="button" className="ts-starter" onClick={() => handleStarter("What services does TechSpecialist offer?")}>
                <span className="ts-starter-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <span className="ts-starter-label">Services &amp; Solutions</span>
              </button>

              <button type="button" className="ts-starter" onClick={() => handleStarter("Which industries and sectors do you support?")}>
                <span className="ts-starter-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 21h18M5 21V10l7-7 7 7v11"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 21v-6h4v6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="ts-starter-label">Sectors We Serve</span>
              </button>

              <button type="button" className="ts-starter" onClick={() => handleStarter("What does your implementation timeline look like?")}>
                <span className="ts-starter-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M12 7v5l3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="ts-starter-label">Timeline &amp; Delivery</span>
              </button>

              <button type="button" className="ts-starter" onClick={() => handleStarter("How do I get in touch with your team?")}>
                <span className="ts-starter-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="ts-starter-label">Contact the Team</span>
              </button>
            </div>
          </div>
        )}

        <div className="ts-body">
          <div id="webchat" role="main" aria-label="Conversation with Robina" ref={webchatRef}></div>
        </div>

        <div className="ts-panel-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Powered by Microsoft Copilot Studio
        </div>
      </div>

      <button
        className="ts-launcher"
        id="tsChatToggle"
        onClick={handleToggle}
        aria-label="Chat with Robina, TechSpecialist's intelligence guide"
        aria-expanded={isOpen}
        disabled={isLoading}
      >
        <span className="ts-launcher-ping"></span>
        <Image
          className="ts-launcher-avatar"
          src="https://res.cloudinary.com/daqmbfctv/image/upload/v1773840810/TBS_7274.jpg_gmfio2.jpg"
          alt=""
          aria-hidden="true"
        />
        <div className="ts-launcher-copy">
          <span className="ts-launcher-label">
            {isLoading ? 'Loading...' : 'Chat with Robina'}
          </span>
          <span className="ts-launcher-sub">
            {isLoading ? 'Connecting...' : 'Intelligence Guide · Online now'}
          </span>
        </div>
        <span className="ts-launcher-chevron" aria-hidden="true">
          {isLoading ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-spin">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 4.5L6 8l3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </button>
      </div>
    </>
  );
}
