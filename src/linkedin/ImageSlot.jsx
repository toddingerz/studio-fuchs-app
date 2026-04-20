import React, { useRef } from 'react';

// Image slot used everywhere a picture (portrait, logo, machine photo,
// selfie, customer photo) lives in the posts. If no data URL is stored
// for this slot, renders a striped/gradient placeholder + slot key so
// the editor can still see the composition.

export default function ImageSlot({
  slotKey,
  images,
  onSetImage,
  shape = 'rect',
  width = '100%',
  height = '100%',
  tokens,
  label = 'Bild',
  variant = 'light',
  readOnly = false,
}) {
  const inputRef = useRef(null);
  const src = images?.[slotKey];

  const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? 12 : 0;
  const dark = variant === 'dark';

  const placeholderBg = dark
    ? `repeating-linear-gradient(135deg, ${tokens.marineDeep} 0 14px, ${tokens.marine} 14px 28px)`
    : `repeating-linear-gradient(135deg, ${tokens.paperDeep} 0 14px, ${tokens.paper} 14px 28px)`;

  const borderColor = dark ? 'transparent' : tokens.line;
  const labelColor = dark ? 'rgba(255,255,255,0.75)' : tokens.inkMute;

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onSetImage?.(slotKey, reader.result);
    reader.readAsDataURL(file);
  };

  const clear = (e) => {
    e.stopPropagation();
    onSetImage?.(slotKey, null);
  };

  const onClick = () => {
    if (readOnly) return;
    inputRef.current?.click();
  };

  return (
    <div
      onClick={onClick}
      style={{
        width,
        height,
        borderRadius: radius,
        border: src ? 'none' : `1px solid ${borderColor}`,
        background: src ? 'transparent' : placeholderBg,
        position: 'relative',
        overflow: 'hidden',
        cursor: readOnly ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={readOnly ? '' : 'Klicken zum Bild hochladen'}
    >
      {src ? (
        <>
          <img
            src={src}
            alt={label}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              borderRadius: radius,
            }}
          />
          {!readOnly && (
            <button
              type="button"
              onClick={clear}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,0.55)',
                color: '#fff',
                border: 'none',
                fontFamily: tokens.mono,
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              ×
            </button>
          )}
        </>
      ) : (
        <span
          style={{
            fontFamily: tokens.mono,
            fontSize: 12,
            color: labelColor,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            padding: '6px 12px',
            textAlign: 'center',
            background: dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.75)',
            borderRadius: 4,
            whiteSpace: 'pre-line',
            lineHeight: 1.4,
          }}
        >
          {label}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pick}
        style={{ display: 'none' }}
      />
    </div>
  );
}
