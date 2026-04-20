import React, { useState, useCallback } from 'react';
import { VERSIONS } from './tokens';
import { TEMPLATES } from './templates';
import { DEFAULT_CLIENTS } from './defaults';
import { loadContent, saveContent, loadImages, saveImages, resetContent } from './storage';
import TweaksPanel from './TweaksPanel';

const PILLAR_LABELS = {
  1: { title: 'Säule 01 · Das Team',    sub: 'Menschen & Kultur' },
  2: { title: 'Säule 02 · Die Sache',   sub: 'Expertise, Normen, Deadlines' },
  3: { title: 'Säule 03 · Der Beweis',  sub: 'Referenzen, Cases, Zitate' },
};

function usePersistedState(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  const set = useCallback((v) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [val, set];
}

export default function Designer() {
  const [clients, setClients] = usePersistedState('sf_li_clients', DEFAULT_CLIENTS);
  const [versions, setVersions] = usePersistedState('sf_li_versions', VERSIONS);
  const [clientId, setClientId] = usePersistedState('sf_li_active_client', 'midok');
  const [versionId, setVersionId] = usePersistedState('sf_li_active_version', 'v2');
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);

  const activeClient = clients.find(c => c.id === clientId) || clients[0];
  const activeVersion = versions.find(v => v.id === versionId) || versions[0];

  // Content state — loaded from localStorage per client
  const [content, setContentState] = useState(() =>
    loadContent(activeClient.id, activeClient.content)
  );
  const [images, setImagesState] = useState(() =>
    loadImages(activeClient.id)
  );

  // Switch client or version — reload from storage
  const switchClient = (id) => {
    setClientId(id);
    const cl = clients.find(c => c.id === id);
    if (cl) {
      setContentState(loadContent(cl.id, cl.content));
      setImagesState(loadImages(cl.id));
    }
  };

  const switchVersion = (id) => {
    setVersionId(id);
    setActiveTemplateId(null);
  };

  const handleContentChange = (key, value) => {
    const next = { ...content, [key]: value };
    setContentState(next);
    saveContent(activeClient.id, next);
  };

  const handleImageChange = (slotKey, dataUrl) => {
    const next = { ...images, [slotKey]: dataUrl };
    setImagesState(next);
    saveImages(activeClient.id, next);
  };

  const handleReset = () => {
    resetContent(activeClient.id);
    setContentState({ ...activeClient.content });
    setImagesState({});
  };

  const openTweaks = (templateId) => {
    setActiveTemplateId(templateId);
    setTweaksOpen(true);
  };

  // Filter templates for active version
  const vTemplates = TEMPLATES.filter(t => t.versionId === versionId);
  const pillars = [1, 2, 3];

  const tokens = activeVersion.tokens;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: tokens.text, background: '#f0eee9' }}>

      {/* ── Top Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e4e8ec', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 56, flexShrink: 0, zIndex: 100 }}>
        {/* Brand */}
        <div style={{ fontFamily: tokens.text, fontWeight: 800, fontSize: 15, color: '#1a2a33', letterSpacing: -0.3, marginRight: 8, whiteSpace: 'nowrap' }}>
          Studio Fuchs
        </div>

        {/* Version tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f0eee9', borderRadius: 8, padding: 3, flex: 1, maxWidth: 480 }}>
          {versions.map(v => (
            <button
              key={v.id}
              onClick={() => switchVersion(v.id)}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: versionId === v.id ? '#fff' : 'transparent',
                color: versionId === v.id ? '#1a2a33' : '#6a7a86',
                boxShadow: versionId === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {v.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewVersion(true)}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#004d71' }}
            title="Neue Version erstellen"
          >
            + Version
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Client switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#8a969e', whiteSpace: 'nowrap' }}>Kunde:</span>
          <select
            value={clientId}
            onChange={e => {
              if (e.target.value === '__new__') { setShowNewClient(true); }
              else { switchClient(e.target.value); }
            }}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 12, background: '#fff', cursor: 'pointer' }}
          >
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">+ Neuer Kunde</option>
          </select>
        </div>

        {/* Edit button */}
        <button
          onClick={() => openTweaks(vTemplates[0]?.id)}
          style={{ padding: '7px 16px', background: '#004d71', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          ✎ Texte bearbeiten
        </button>
      </div>

      {/* ── Canvas ── */}
      <div
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'auto',
          padding: '48px 48px 80px',
          marginRight: tweaksOpen ? 420 : 0,
          transition: 'margin-right 0.2s',
        }}
      >
        {/* Version header card */}
        <div style={{
          background: tokens.paper, border: `1px solid ${tokens.line}`, borderRadius: 8,
          padding: '36px 48px', marginBottom: 48, maxWidth: 1200,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontFamily: tokens.mono, fontSize: 11, color: tokens.inkMute, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            {activeVersion.tagline}
          </div>
          <div style={{ fontFamily: tokens.display, fontSize: 48, lineHeight: 1.05, color: tokens.ink, fontWeight: tokens.headlineItalic ? 400 : 800, fontStyle: tokens.headlineItalic ? 'italic' : 'normal', letterSpacing: -1 }}>
            {content.clientName || 'midok'} · LinkedIn-Konzept<br />
            <span style={{ color: tokens.marine }}>{activeVersion.name}</span>
          </div>
          <div style={{ marginTop: 16, fontFamily: tokens.text, fontSize: 15, color: tokens.inkSoft, lineHeight: 1.6 }}>
            9 Templates · 3 Säulen · Klick auf Post → Tweaks-Panel öffnet sich mit allen Feldern.
          </div>
        </div>

        {/* Pillar sections */}
        {pillars.map(pillar => {
          const pTmpls = vTemplates.filter(t => t.pillar === pillar);
          const pl = PILLAR_LABELS[pillar];
          return (
            <div key={pillar} style={{ marginBottom: 64 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: tokens.text, fontSize: 20, fontWeight: 700, color: tokens.ink, letterSpacing: -0.3 }}>{pl.title}</div>
                <div style={{ fontFamily: tokens.text, fontSize: 13, color: tokens.inkMute, marginTop: 2 }}>{pl.sub}</div>
              </div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 8 }}>
                {pTmpls.map(tmpl => {
                  const Comp = tmpl.component;
                  const isActive = activeTemplateId === tmpl.id && tweaksOpen;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => openTweaks(tmpl.id)}
                      style={{ flexShrink: 0, cursor: 'pointer', position: 'relative' }}
                    >
                      {/* Label above */}
                      <div style={{ fontFamily: tokens.mono, fontSize: 10, color: tokens.inkMute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', gap: 6 }}>
                        <span style={{ fontWeight: 700 }}>{tmpl.label}</span>
                      </div>
                      {/* Post scaled to 360px */}
                      <div style={{
                        outline: isActive ? `2px solid ${tokens.marine}` : '2px solid transparent',
                        borderRadius: 10,
                        transition: 'outline 0.15s',
                      }}>
                        <Comp
                          c={content}
                          images={images}
                          tokens={tokens}
                          version={versionId}
                          onSetImage={handleImageChange}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tweaks Panel ── */}
      <TweaksPanel
        open={tweaksOpen}
        onClose={() => setTweaksOpen(false)}
        content={content}
        images={images}
        onContentChange={handleContentChange}
        onImageChange={handleImageChange}
        onReset={handleReset}
        activeTemplateId={activeTemplateId}
        tokens={tokens}
      />

      {/* ── New Version Modal ── */}
      {showNewVersion && (
        <NewVersionModal
          baseVersions={versions}
          onClose={() => setShowNewVersion(false)}
          onSave={(newV) => {
            const updated = [...versions, newV];
            setVersions(updated);
            switchVersion(newV.id);
            setShowNewVersion(false);
          }}
        />
      )}

      {/* ── New Client Modal ── */}
      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onSave={(newC) => {
            const updated = [...clients, newC];
            setClients(updated);
            switchClient(newC.id);
            setShowNewClient(false);
          }}
          defaultContent={activeClient.content}
        />
      )}
    </div>
  );
}

// ── New Version Modal ────────────────────────────────────────────────────────

function NewVersionModal({ baseVersions, onClose, onSave }) {
  const [name, setName] = useState('');
  const [baseId, setBaseId] = useState(baseVersions[0]?.id || 'v2');
  const [marine, setMarine] = useState('#004d71');
  const [sky, setSky] = useState('#6fbef3');
  const [paper, setPaper] = useState('#ffffff');

  const handleSave = () => {
    if (!name.trim()) return;
    const base = baseVersions.find(v => v.id === baseId) || baseVersions[0];
    const newV = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      tagline: 'Eigene Version',
      builtin: false,
      tokens: {
        ...base.tokens,
        marine,
        sky,
        skyPale: sky + '33',
        paper,
        paperDeep: paper,
      },
    };
    onSave(newV);
  };

  return (
    <Modal title="Neue Version erstellen" onClose={onClose}>
      <label style={labelStyle}>Name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. V3 · Dunkel" style={inputStyle} />

      <label style={labelStyle}>Basis</label>
      <select value={baseId} onChange={e => setBaseId(e.target.value)} style={inputStyle}>
        {baseVersions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>

      <label style={labelStyle}>Hauptfarbe (Marine)</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input type="color" value={marine} onChange={e => setMarine(e.target.value)} style={{ width: 40, height: 36, border: '1px solid #e0e0e0', borderRadius: 4 }} />
        <input type="text" value={marine} onChange={e => setMarine(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
      </div>

      <label style={labelStyle}>Akzentfarbe (Sky)</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input type="color" value={sky} onChange={e => setSky(e.target.value)} style={{ width: 40, height: 36, border: '1px solid #e0e0e0', borderRadius: 4 }} />
        <input type="text" value={sky} onChange={e => setSky(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
      </div>

      <label style={labelStyle}>Hintergrund</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input type="color" value={paper} onChange={e => setPaper(e.target.value)} style={{ width: 40, height: 36, border: '1px solid #e0e0e0', borderRadius: 4 }} />
        <input type="text" value={paper} onChange={e => setPaper(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
      </div>

      <button onClick={handleSave} disabled={!name.trim()} style={btnStyle}>Version erstellen</button>
    </Modal>
  );
}

// ── New Client Modal ─────────────────────────────────────────────────────────

function NewClientModal({ onClose, onSave, defaultContent }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
    onSave({
      id,
      name: name.trim(),
      industry: industry.trim(),
      content: { ...defaultContent, clientName: name.trim() },
    });
  };

  return (
    <Modal title="Neuen Kunden anlegen" onClose={onClose}>
      <label style={labelStyle}>Kundenname</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. ACME GmbH" style={inputStyle} />

      <label style={labelStyle}>Branche</label>
      <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="z.B. Sondermaschinenbau" style={inputStyle} />

      <div style={{ fontSize: 12, color: '#8a969e', marginBottom: 16 }}>
        Texte werden von midok übernommen — danach im Tweaks-Panel anpassen.
      </div>
      <button onClick={handleSave} disabled={!name.trim()} style={btnStyle}>Kunde anlegen</button>
    </Modal>
  );
}

// ── Shared modal wrapper ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2a33' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#4a5a66', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' };
const btnStyle  = { width: '100%', padding: '10px', background: '#004d71', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
