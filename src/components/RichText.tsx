'use client'

import React from 'react'

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/)

    if (!boldMatch && !linkMatch) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    const boldIdx = boldMatch ? boldMatch.index! : Infinity
    const linkIdx = linkMatch ? linkMatch.index! : Infinity

    if (linkIdx < boldIdx) {
      const m = linkMatch!
      if (m.index! > 0) parts.push(<span key={key++}>{remaining.slice(0, m.index!)}</span>)
      parts.push(
        <a key={key++} href={m[2]} className="text-[#4584ed] underline underline-offset-2 hover:no-underline">
          {m[1]}
        </a>
      )
      remaining = remaining.slice(m.index! + m[0].length)
    } else {
      const m = boldMatch!
      if (m.index! > 0) parts.push(<span key={key++}>{remaining.slice(0, m.index!)}</span>)
      parts.push(<strong key={key++} className="font-semibold">{m[1]}</strong>)
      remaining = remaining.slice(m.index! + m[0].length)
    }
  }

  return <>{parts}</>
}

export function RichParagraph({ text, className = '' }: { text: string; className?: string }) {
  return <p className={`text-[17px] leading-[1.8] text-[#5f6368] dark:text-gray-300 ${className}`}>{renderInline(text)}</p>
}

export function RichBullet({ text }: { text: string }) {
  return <li className="text-[17px] leading-[1.8] text-[#5f6368] dark:text-gray-300">{renderInline(text)}</li>
}
