'use client';

import { useMemo } from 'react';

interface Message {
  role: 'ai' | 'candidate';
  content: string;
  topic_label?: string;
}

interface TranscriptViewerProps {
  messages: Message[];
  maxHeight?: number;
}

export default function TranscriptViewer({ messages, maxHeight = 500 }: TranscriptViewerProps) {
  const topicBreaks = useMemo(() => {
    const breaks: number[] = [];
    const seen = new Set<string>();
    messages.forEach((msg, i) => {
      if (msg.topic_label && !seen.has(msg.topic_label)) {
        seen.add(msg.topic_label);
        breaks.push(i);
      }
    });
    return breaks;
  }, [messages]);

  const exchangeCount = Math.ceil(messages.length / 2);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-soft)] px-5 py-3 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 text-[11px] text-[var(--body)]">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <span className="font-semibold">{exchangeCount} exchanges</span>
          <span className="mx-1 opacity-40">·</span>
          <span>{topicBreaks.length} topics</span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          maxHeight,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {messages.map((msg, i) => {
          const isTopicStart = topicBreaks.includes(i);

          return (
            <div key={i}>
              {isTopicStart && msg.topic_label && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                  <span
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                    style={{
                      color: 'var(--status-assessment)',
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                    }}
                  >
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    {msg.topic_label}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                }}
              >
                <div
                  className={msg.role === 'ai' ? 'bg-[var(--bg-soft)]' : 'bg-[var(--blue)]'}
                  style={{
                    maxWidth: '78%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'ai' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    color: msg.role === 'ai' ? 'var(--heading)' : '#fff',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
                    boxShadow: msg.role === 'ai' ? 'none' : '0 2px 8px rgba(69, 132, 237, 0.25)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      opacity: 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {msg.role === 'ai' ? (
                      <>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        AI Interviewer
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Candidate
                      </>
                    )}
                  </div>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}