import React from 'react';

// Shared primitives rendered into the 1080×1080 artboard.
// Everything uses inline styles (pixel-accurate), never Tailwind —
// Tailwind is only used in the editor chrome.

export function MidokLogo({ tokens, size = 22, color, dot, withR = true }) {
  const ink = color || tokens.ink;
  const spot = dot || tokens.sky;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.15,
        fontFamily: tokens.text,
        fontWeight: 800,
        fontSize: size,
        color: ink,
        letterSpacing: -size * 0.04,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: size * 0.42,
          height: size * 0.42,
          background: spot,
          borderRadius: 1,
        }}
      />
      <span>
        m<span style={{ position: 'relative', top: -size * 0.03 }}>ı</span>dok
      </span>
      {withR && (
        <span
          style={{
            fontSize: size * 0.4,
            alignSelf: 'flex-start',
            marginTop: size * 0.1,
            fontWeight: 400,
          }}
        >
          ®
        </span>
      )}
    </div>
  );
}

export function PillBadge({ children, bg, color = '#fff', tokens }) {
  return (
    <span
      style={{
        background: bg || tokens.marine,
        color,
        fontFamily: tokens.text,
        fontSize: 14,
        fontWeight: 700,
        padding: '6px 16px',
        borderRadius: 999,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

// Header per version — V2 style pill + #xx, V1 style logo + mono.
export function PostHeader({ tokens, version, pillar, num, darkBg, badgeBg, badgeColor }) {
  if (version === 'v2') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 72,
          right: 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 5,
        }}
      >
        <PillBadge tokens={tokens} bg={badgeBg || tokens.marine} color={badgeColor || '#fff'}>
          {pillar}
        </PillBadge>
        <span
          style={{
            fontFamily: tokens.mono,
            fontSize: 15,
            color: darkBg ? 'rgba(255,255,255,0.55)' : tokens.inkMute,
            letterSpacing: 1,
          }}
        >
          #{num}
        </span>
      </div>
    );
  }
  // v1 editorial header
  const ink = darkBg ? '#fff' : tokens.ink;
  const mute = darkBg ? 'rgba(255,255,255,0.65)' : tokens.inkMute;
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 72,
        right: 72,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 5,
      }}
    >
      <MidokLogo tokens={tokens} size={26} color={ink} dot={tokens.sky} />
      <div
        style={{
          fontFamily: tokens.mono,
          fontSize: 14,
          color: mute,
          textTransform: 'uppercase',
          letterSpacing: 2,
          display: 'flex',
          gap: 16,
        }}
      >
        <span>{num}</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span>{pillar}</span>
      </div>
    </div>
  );
}

export function PostFooter({ tokens, version, darkBg, meta, contact }) {
  if (version === 'v2') {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          left: 72,
          right: 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <MidokLogo
          tokens={tokens}
          size={22}
          color={darkBg ? '#fff' : tokens.ink}
          dot={tokens.sky}
        />
        <span
          style={{
            fontFamily: tokens.text,
            fontSize: 13,
            fontWeight: 500,
            color: darkBg ? 'rgba(255,255,255,0.7)' : tokens.inkMute,
            letterSpacing: 0.3,
          }}
        >
          {contact}
        </span>
      </div>
    );
  }
  const ink = darkBg ? 'rgba(255,255,255,0.6)' : tokens.inkMute;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 72,
        right: 72,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: tokens.mono,
        fontSize: 13,
        color: ink,
        letterSpacing: 0.5,
      }}
    >
      <span>{meta || `${contact} · Maschinensicherheit & Technische Dokumentation`}</span>
      <span style={{ letterSpacing: 2 }}>↗</span>
    </div>
  );
}

// Scaled 1080×1080 post frame.
// display = the rendered width in px. Internally the artboard is always
// 1080×1080; we scale the world so templates can use fixed pixel values.
export function PostFrame({ children, display = 420, bg, tokens, label, idx, radius = 8 }) {
  const scale = display / 1080;
  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            paddingBottom: 10,
            fontFamily: tokens.mono,
            fontSize: 11,
            color: 'rgba(40,30,20,0.6)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            display: 'flex',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          {idx && <span style={{ fontWeight: 600 }}>{idx}</span>}
          <span>{label}</span>
        </div>
      )}
      <div
        style={{
          width: display,
          height: display,
          background: bg || tokens.paper,
          boxShadow:
            '0 1px 3px rgba(0,0,0,0.08), 0 10px 28px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: radius,
        }}
      >
        <div
          style={{
            width: 1080,
            height: 1080,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            position: 'relative',
            background: bg || tokens.paper,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Flat V2-style icons. Keep signatures identical so templates can swap sets.
export const Icons = {
  Shield: ({ size = 40, color }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 6 8 11v10c0 7 5 11 12 13 7-2 12-6 12-13V11L20 6Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m14 20 4 4 8-8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Smile: ({ size = 40, color }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="16" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="17" r="1.3" fill={color} />
      <circle cx="26" cy="17" r="1.3" fill={color} />
      <path
        d="M13 24c1.5 2.5 4 4 7 4s5.5-1.5 7-4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  CE: ({ size = 40, color }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M18 10a10 10 0 1 0 0 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M25 14a8 8 0 1 0 0 12m0-7h-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  Book: ({ size = 40, color }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M8 10v22l12-3 12 3V10L20 13 8 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 13v19" stroke={color} strokeWidth="1.5" />
    </svg>
  ),
};
