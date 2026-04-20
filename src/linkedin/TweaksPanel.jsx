import React, { useRef } from 'react';
import { SCHEMA, SHARED_SCHEMA } from './schema';
import { TEMPLATES } from './templates';

export default function TweaksPanel({ open, onClose, content, images, onContentChange, onImageChange, onReset, activeTemplateId, tokens }) {
  const inputRef = useRef({});

  if (!open) return null;

  const tmpl = TEMPLATES.find(t => t.id === activeTemplateId);
  const templateSchema = SCHEMA[activeTemplateId] || [];
  const imageSlots = tmpl?.imageSlots || [];

  const handleReset = () => {
    if (window.confirm('Alle Texte und Bilder auf die Standardwerte zurücksetzen?')) {
      onReset();
    }
  };

  const renderField = (field) => {
    const val = content[field.key] !== undefined ? content[field.key] : '';
    if (field.type === 'color') {
      return (
        <div key={field.key} style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4a5a66', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {field.label}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={val}
              onChange={e => onContentChange(field.key, e.target.value)}
              style={{ width: 40, height: 32, border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              value={val}
              onChange={e => onContentChange(field.key, e.target.value)}
              style={{ flex: 1, padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        </div>
      );
    }
    if (field.type === 'text') {
      return (
        <div key={field.key} style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4a5a66', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {field.label}
          </label>
          <input
            type="text"
            value={val}
            onChange={e => onContentChange(field.key, e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: 4, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
      );
    }
    // textarea (default)
    return (
      <div key={field.key} style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4a5a66', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {field.label}
        </label>
        <textarea
          value={val}
          onChange={e => onContentChange(field.key, e.target.value)}
          rows={val.length > 80 ? 4 : 2}
          style={{ width: '100%', padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: 4, fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.4 }}
        />
      </div>
    );
  };

  const pickImage = (slotKey) => {
    const el = inputRef.current[slotKey];
    if (el) el.click();
  };

  const handleImageFile = (slotKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImageChange(slotKey, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column', zIndex: 1000,
      fontFamily: tokens?.text || 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2a33' }}>Texte bearbeiten</div>
          {tmpl && <div style={{ fontSize: 11, color: '#8a969e', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tmpl.label}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleReset}
            style={{ padding: '6px 12px', background: '#f7f9fb', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#666' }}
          >
            ↺ Reset
          </button>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 18, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* Image slots */}
        {imageSlots.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#004d71', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Bilder
            </div>
            {imageSlots.map(slotKey => {
              const src = images?.[slotKey];
              return (
                <div key={slotKey} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid #e0e0e0', flexShrink: 0,
                    background: src ? 'transparent' : '#f0eee9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {src
                      ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 9, color: '#aaa', textAlign: 'center', padding: 4, lineHeight: 1.2 }}>{slotKey}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#4a5a66', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{slotKey.replace(/_/g, ' ')}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => pickImage(slotKey)}
                        style={{ padding: '5px 10px', background: '#004d71', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                      >
                        Bild hochladen
                      </button>
                      {src && (
                        <button
                          onClick={() => onImageChange(slotKey, null)}
                          style={{ padding: '5px 10px', background: '#f7f9fb', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#666' }}
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => { inputRef.current[slotKey] = el; }}
                    onChange={e => handleImageFile(slotKey, e)}
                    style={{ display: 'none' }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Global fields */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#004d71', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Allgemein</div>
          {SHARED_SCHEMA.map(renderField)}
        </div>

        {/* Template-specific fields */}
        {templateSchema.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#004d71', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              {tmpl?.label || 'Template'}
            </div>
            {templateSchema.filter(f => f.type !== 'image').map(renderField)}
          </div>
        )}
      </div>
    </div>
  );
}
