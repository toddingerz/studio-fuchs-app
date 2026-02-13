import React, { useState, useRef, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  ChevronRight, ChevronLeft, Copy, Check, Loader2, FileJson, Store, HeartPulse, Wrench, User, 
  Sparkles, HelpCircle, Lightbulb, Globe, Mic, Send, Briefcase, Inbox, ArrowRight, Square, 
  UploadCloud, Share2, Lock, Unlock, MousePointerClick, FileText, Pause, Play, Trash2, 
  AlertCircle, Users, LayoutGrid
} from 'lucide-react';

// =================================================================
// 1. KONFIGURATION
// =================================================================

// Firebase Safe Init
let app, auth, db;
try {
  // Versucht Config zu lesen, ignoriert Fehler im Build/Preview
  const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
  const firebaseConfig = JSON.parse(configStr);
  
  if (Object.keys(firebaseConfig).length > 0) {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase Init skipped (Build mode or missing config)");
}

// --- WICHTIG: API KEY FÜR VORSCHAU ---
// Auf Vercel wird dieser Key ignoriert (da läuft es über den Server).
// Hier in der Vorschau MUSS er rein, sonst geht es nicht.
const PREVIEW_API_KEY = ""; 

const appId = 'brand-dna-studio-fuchs-live';
const ADMIN_PIN = "1704"; 

// =================================================================
// DATEN
// =================================================================

const COMPANY_SIZES = ["Nur ich (Solo)", "1-5 Mitarbeiter", "6-20 Mitarbeiter", "21-100 Mitarbeiter", "Über 100 Mitarbeiter"];

const CATEGORIES = [
  { id: "local", label: "Local Service Business", Icon: Store, examples: ["Friseur", "Tattoo", "Physio"] },
  { id: "med", label: "Medizin / Gesundheit", Icon: HeartPulse, examples: ["Arzt", "Zahnarzt", "Pflege"] },
  { id: "craft", label: "Handwerk / Produktion", Icon: Wrench, examples: ["Manufaktur", "Bau", "E-Com"] },
  { id: "brand", label: "Personal Brand", Icon: User, examples: ["Coach", "Berater", "Speaker"] }
];

const INTERVIEW_QUESTIONS = [
  { id: "brand_core", title: "Wer bist du?", text: "Erzähl kurz: Wer bist du und was machst du genau?" },
  { id: "target", title: "Deine Kunden", text: "Wer ist deine wichtigste Zielgruppe? Welches Problem löst du für sie?" },
  { id: "diff", title: "Dein Unterschied", text: "Was unterscheidet dich von anderen in deinem Bereich?" },
  { id: "offer", title: "Dein Angebot", text: "Was ist dein Hauptangebot aktuell?" },
  { id: "goals", title: "Deine Ziele", text: "Was ist dein wichtigstes Ziel mit Social Media?" },
  { id: "tone", title: "Dein Vibe", text: "Wie soll deine Marke wirken? Was passt GAR NICHT zu dir?" },
  { id: "content", title: "Deine Themen", text: "Welche Inhalte kannst du regelmäßig liefern? Gibt es feste Themen?" },
  { id: "proof", title: "Vertrauen", text: "Gibt es Referenzen, Kundenstimmen oder Beispiele?" }
];

const JSON_SYSTEM_INSTRUCTION = `Du bist eine strategische Brand DNA Engine für Studio Fuchs. 
Deine Aufgabe: Extrahiere aus Rohtext, Firmengröße und Web-Daten eine präzise Marken-Identität nach dem Base44-Standard.
Gib AUSSCHLIESSLICH valides JSON aus. Keine Erklärungen.`;

const STRATEGY_SYSTEM_INSTRUCTION = `
Du bist Thorsten Fuchs von designstudiofuchs.de, spezialisierter Sales-Mail-Architekt.
Erstelle eine "Freystil Sales"-Analyse.
STRUKTUR: Cliffhanger-Betreff, Einstieg, Pain/Potenzial, Storybased Lösung, Nutzen, CTA.
Antworte im JSON Format mit einem Feld "report".`;

// =================================================================
// APP
// =================================================================

export default function App() {
  const [appMode, setAppMode] = useState('select'); 
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [activeClientName, setActiveClientName] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Workspace
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [transcript, setTranscript] = useState("");
  
  // Status
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [appError, setAppError] = useState(null);

  // Results
  const [outputJson, setOutputJson] = useState(null);
  const [socialHooks, setSocialHooks] = useState(null);
  const [strategyReport, setStrategyReport] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Client Input
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [clientSocial, setClientSocial] = useState("");
  const [clientCategory, setClientCategory] = useState(null);
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const categorySectionRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Init & Auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setAppMode('client');
      setIsMagicLink(true);
    }
    if (auth) {
        const initAuth = async () => {
            try {
                if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
                    await signInWithCustomToken(auth, window.__initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) { console.error("Auth Error", e); }
        };
        initAuth();
        return onAuthStateChanged(auth, (u) => setUser(u));
    }
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!db || !user || !isAdminLoggedIn) return;
    try {
      const submissionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
      const unsubscribe = onSnapshot(submissionsRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      });
      return () => unsubscribe();
    } catch (err) { console.error("Firestore Error", err); }
  }, [user, isAdminLoggedIn]);

  // --- HELPER ---
  const copySimpleText = (text, callback) => {
    if (!text) return;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); if(callback) callback(); } catch (err) {}
    document.body.removeChild(textArea);
  };

  const copyMagicLink = () => {
    const url = window.location.href.split('?')[0] + '?view=client';
    copySimpleText(url, () => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const cleanJsonResponse = (rawText) => {
    if (!rawText) return null;
    let cleaned = rawText.trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
    return cleaned;
  };

  // --- INTELLIGENTER API CALL ---
  const callAI = async (payload) => {
    // Check: Laufen wir auf Vercel/Production?
    const isVercel = window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('studio-fuchs') ||
                     window.location.hostname.includes('localhost'); // Localhost hat oft auch Proxy Setup

    // Wenn wir in der Vorschau sind (blob/googleusercontent), MÜSSEN wir den Key direkt nutzen.
    // Proxy URLs wie "/api/gemini" funktionieren in Blobs nicht.
    const isPreview = window.location.hostname.includes('googleusercontent');

    if (!isPreview && isVercel) {
        // VERCEL MODE: Nutze sicheres Backend
        const response = await fetch('/api/gemini', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gemini-2.5-flash-preview-09-2025", ...payload })
        });
        if (response.status === 404) throw new Error("Backend API nicht gefunden (404).");
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || "Server Fehler");
        return data;
    } else {
        // PREVIEW MODE: Nutze direkten Key
        if (!PREVIEW_API_KEY) throw new Error("VORSCHAU-MODUS: Bitte API Key in Zeile 48 eintragen.");
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${PREVIEW_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Google API Fehler");
        return data;
    }
  };

  // --- LOGIC ---
  const processAudio = async (file, targetSetter) => {
    setIsTranscribing(true); setAppError(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const payload = { contents: [{ parts: [{ text: "Transkribiere dieses Audio auf Deutsch." }, { inlineData: { mimeType: file.type || 'audio/mp3', data: base64 } }] }] };
        const data = await callAI(payload);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) targetSetter(prev => prev ? prev + " " + text : text);
      } catch (err) { setAppError(err.message); }
      finally { setIsTranscribing(false); }
    };
  };

  const startRecording = async () => {
    setAppError(null);
    try {
      if (!navigator.mediaDevices) throw new Error("Kein Mikrofon-Zugriff.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateVisualizer = () => {
        if(!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioLevel(dataArray.reduce((a, b) => a + b) / dataArray.length);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        processAudio(blob, setTranscript);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) { setAppError("Mikrofonfehler: " + err.message); }
  };
  
  const togglePause = () => {
      if (!mediaRecorderRef.current) return;
      if (!isPaused) { mediaRecorderRef.current.stop(); setIsPaused(true); } 
      else { audioChunksRef.current = []; mediaRecorderRef.current.start(); setIsPaused(false); }
  };
  
  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      setIsRecording(false); setIsPaused(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
  };

  const handleClientSubmit = async () => {
    if (!clientName.trim() || !transcript.trim()) return;
    setIsSending(true);
    try {
      if (!db) throw new Error("Datenbank nicht verfügbar");
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        name: clientName, company: clientCompany, website: clientWebsite, social: clientSocial, 
        category: clientCategory, companySize: companySize, text: transcript, timestamp: Date.now()
      });
      setClientSubmitted(true);
    } catch (err) { setAppError("Senden fehlgeschlagen: " + err.message); }
    finally { setIsSending(false); }
  };

  const loadFromInbox = (sub) => {
    setTranscript(sub.text);
    setWebsiteUrl(sub.website || "");
    setSocialUrl(sub.social || "");
    setCompanySize(sub.companySize || "");
    if (sub.category) {
        const found = CATEGORIES.find(c => c.label === sub.category);
        setSelectedCategory(found || null);
    }
    setActiveClientName(sub.name);
    setStep(2); 
    setTimeout(() => { categorySectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const generateDNA = async () => {
    setIsGenerating(true); setStep(3); setAppError(null);
    try {
      const payload = {
        systemInstruction: { parts: [{ text: JSON_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Firmengröße: ${companySize}\nBereich: ${selectedCategory?.label || "Unklar"}\nWeb: ${websiteUrl}\nSocial: ${socialUrl}\nInput: ${transcript}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      };
      const data = await callAI(payload);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setOutputJson(JSON.parse(cleanJsonResponse(rawText)));
      setStep(4);
    } catch (err) { 
        setAppError(err.message); 
        setStep(2); 
    }
    finally { setIsGenerating(false); }
  };

  const generateHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const payload = {
        systemInstruction: { parts: [{ text: "Erstelle 5 Social Media Hooks basierend auf der DNA." }] },
        contents: [{ parts: [{ text: JSON.stringify(outputJson) }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "STRING" } } }
      };
      const data = await callAI(payload);
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setSocialHooks(JSON.parse(cleanJsonResponse(raw)));
    } catch (err) { console.error(err); }
    finally { setIsGeneratingHooks(false); }
  };

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const payload = {
        systemInstruction: { parts: [{ text: STRATEGY_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Kunde: ${activeClientName}\nFirma: ${clientCompany}\nGröße: ${companySize}\nBereich: ${selectedCategory?.label}\nWebsite: ${websiteUrl}\nInterview: ${transcript}` }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { report: { type: "STRING" } } } }
      };
      const data = await callAI(payload);
      const jsonResponse = JSON.parse(cleanJsonResponse(data.candidates?.[0]?.content?.parts?.[0]?.text));
      setStrategyReport(jsonResponse.report);
    } catch (err) { setAppError("Strategie-Fehler: " + err.message); } 
    finally { setIsGeneratingStrategy(false); }
  };

  // --- RENDER ---
  // (Identisch zum vorherigen Design, nur Logik-Fixes angewendet)
  
  if (appMode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 text-[#2c233e]">
        <div className="text-center mb-16 animate-in fade-in zoom-in duration-700">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-3">Designstudio <span className="text-[#e32338]">Fuchs</span></h1>
          <p className="opacity-60 font-medium text-lg tracking-wide uppercase text-[12px]">Brand Intelligence System</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
          <button onClick={() => setAppMode('client')} className="group bg-white/70 backdrop-blur-md hover:bg-white p-16 rounded-[4rem] text-center shadow-xl transition-all">
            <div className="w-24 h-24 rounded-full bg-[#e32338]/5 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><User className="w-10 h-10 text-[#e32338]" /></div>
            <h2 className="text-3xl font-bold mb-3">Kunden-Portal</h2>
            <p className="opacity-60 font-medium text-sm">Briefing & Daten übermitteln.</p>
          </button>
          <button onClick={() => setAppMode('login')} className="group bg-[#2c233e]/90 p-16 rounded-[4rem] text-center shadow-2xl transition-all text-white">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><Briefcase className="w-10 h-10 text-white" /></div>
            <h2 className="text-3xl font-bold mb-3">Agentur-Dashboard</h2>
            <p className="opacity-40 font-medium text-sm">Analyse, Base44 & Strategie.</p>
          </button>
        </div>
      </div>
    );
  }

  if (appMode === 'login') {
    return (
      <div className="min-h-screen bg-[#2c233e] flex items-center justify-center p-6 text-white text-center">
        <form onSubmit={(e) => { e.preventDefault(); if(pinInput === ADMIN_PIN) setIsAdminLoggedIn(true); else setLoginError(true); }} className="bg-white/10 p-12 rounded-[3rem] w-full max-w-md backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">Admin PIN</h2>
          <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="PIN" className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-center text-3xl tracking-[1em] outline-none mb-4" />
          {isAdminLoggedIn ? setAppMode('agency') : loginError && <p className="text-[#e32338] font-bold mb-4">PIN falsch!</p>}
          <div className="flex gap-4"><button type="button" onClick={() => setAppMode('select')} className="flex-1 opacity-40 font-bold uppercase text-xs">Abbruch</button><button type="submit" className="flex-1 bg-[#e32338] py-4 rounded-2xl font-bold uppercase text-xs">Login</button></div>
        </form>
      </div>
    );
  }

  if (appMode === 'client') {
    if (clientSubmitted) return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 text-center text-[#2c233e]">
        <div className="bg-white/60 backdrop-blur-xl p-16 rounded-[4rem] max-w-xl shadow-2xl border border-white/60">
          <Check className="w-16 h-16 text-[#e32338] mx-auto mb-8" />
          <h2 className="text-4xl font-bold mb-6">Erfolgreich!</h2>
          <p className="text-xl opacity-70 mb-10">Deine Daten sind sicher übermittelt. Wir melden uns!</p>
          {!isMagicLink && <button onClick={() => { setAppMode('select'); setClientSubmitted(false); }} className="px-10 py-4 bg-[#2c233e] text-white font-bold rounded-full text-sm uppercase tracking-widest">Startseite</button>}
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
        <header className="px-8 h-24 flex items-center justify-between border-b border-white/20 bg-white/10 backdrop-blur-md">
          <div className="font-bold text-2xl">Designstudio<span className="text-[#e32338]">Fuchs</span></div>
          {!isMagicLink && <button onClick={() => setAppMode('select')} className="text-xs font-bold opacity-40 uppercase tracking-widest px-6 py-2 bg-white/40 rounded-full transition-all">Abbrechen</button>}
        </header>
        <main className="max-w-6xl mx-auto px-8 py-16 animate-in fade-in duration-700">
          <div className="text-center mb-16"><h1 className="text-5xl font-bold tracking-tight mb-4">Deine <span className="text-[#e32338]">Marke</span> schärfen.</h1></div>
          {appError && <div className="max-w-xl mx-auto mb-8 bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold">{appError}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5"><div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] p-10 shadow-xl"><h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 text-[#e32338] flex items-center gap-2"><Lightbulb className="w-5 h-5"/> Leitfragen</h3><div className="space-y-6">{INTERVIEW_QUESTIONS.map(q=><div key={q.id} className="border-l-4 border-[#2c233e]/5 pl-6"><p className="font-bold text-sm">{q.title}</p><p className="text-xs opacity-50">{q.text}</p></div>)}</div></div></div>
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white/40 border border-white/60 rounded-[3rem] p-8 shadow-xl space-y-4">
                <div className="grid grid-cols-2 gap-4"><input type="text" value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Name *" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium"/><input type="text" value={clientCompany} onChange={e=>setClientCompany(e.target.value)} placeholder="Firma" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium"/></div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase opacity-40">Teamgröße</label><div className="flex flex-wrap gap-2">{COMPANY_SIZES.map(s=><button key={s} onClick={()=>setCompanySize(s)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${companySize === s ? 'bg-[#e32338] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/50'}`}>{s}</button>)}</div></div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase opacity-40">Bereich</label><div className="grid grid-cols-2 gap-2">{CATEGORIES.map(c=><button key={c.id} onClick={()=>setClientCategory(c.label)} className={`p-3 rounded-2xl text-left border transition-all ${clientCategory === c.label ? 'bg-[#e32338] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/60'}`}><div className="flex items-center gap-2 font-bold text-xs"><c.Icon className="w-4 h-4"/>{c.label}</div></button>)}</div></div>
                <div className="grid grid-cols-2 gap-4 border-t border-[#2c233e]/5 pt-4"><input type="url" value={clientWebsite} onChange={e=>setClientWebsite(e.target.value)} placeholder="Website URL" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none text-xs"/><input type="text" value={clientSocial} onChange={e=>setClientSocial(e.target.value)} placeholder="Instagram" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none text-xs"/></div>
              </div>
              <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="p-8 border-b border-white/40 flex justify-center gap-6">
                  {!isRecording ? <button onClick={startRecording} className="flex items-center gap-3 px-12 py-6 bg-[#e32338] text-white rounded-full font-bold uppercase text-[12px] tracking-widest shadow-lg hover:bg-[#c91d31] transition-all"><Mic className="w-6 h-6"/> Aufnahme</button> : <div className="flex flex-col items-center gap-4"><div className="h-2 w-48 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-[#e32338]" style={{width:`${Math.min(100,audioLevel*2)}%`}}/></div><div className="flex gap-4"><button onClick={togglePause} className="px-8 py-4 bg-emerald-500 text-white rounded-full font-bold uppercase text-[10px]">{isPaused?<Play className="w-4 h-4"/>:<Pause className="w-4 h-4"/>}</button><button onClick={stopRecording} className="px-8 py-4 bg-[#2c233e] text-white rounded-full font-bold uppercase text-[10px]"><Square className="w-4 h-4"/></button></div></div>}
                  {!isRecording && <label className="text-[10px] font-bold opacity-30 uppercase cursor-pointer hover:opacity-100 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Upload<input type="file" accept="audio/*" className="hidden" onChange={e=>e.target.files[0] && processAudio(e.target.files[0], setTranscript)}/></label>}
                </div>
                {isTranscribing && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 text-[#e32338] animate-spin"/><p className="text-xs font-bold uppercase">Transkribiere...</p></div>}
                <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Deine Nachricht..." className="w-full bg-transparent p-12 text-xl font-medium min-h-[300px] outline-none resize-none placeholder:text-[#2c233e]/10"/>
                <div className="p-8 border-t border-white/40 flex justify-end bg-white/10"><button onClick={handleClientSubmit} disabled={isSending||!transcript||!clientName} className="bg-[#e32338] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl disabled:opacity-30 flex items-center gap-3">{isSending?<Loader2 className="animate-spin"/>:<><Send className="w-4 h-4"/> Absenden</>}</button></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 4. AGENCY DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
      <header className="border-b border-white/30 bg-white/20 backdrop-blur-md sticky top-0 z-20 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="font-bold text-2xl tracking-tight">Designstudio</span><span className="font-bold text-2xl tracking-tight text-[#e32338]">Fuchs</span></div>
        <div className="flex items-center gap-8">
           <button onClick={copyMagicLink} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#e32338] bg-white px-6 py-2 rounded-full shadow-sm hover:shadow-md transition-all">{linkCopied ? "Kopiert!" : "Kunden-Link"}</button>
           <button onClick={() => { setIsAdminLoggedIn(false); setAppMode('select'); }} className="text-[11px] font-bold opacity-30 hover:opacity-100 flex items-center gap-2 transition-all"><Lock className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 animate-in fade-in duration-700">
        
        {step === 1 && (
          <div className="mb-20">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-8 text-[#e32338] flex items-center gap-3"><Inbox className="w-5 h-5" /> Live Posteingang ({submissions.length})</h2>
            
            {activeClientName && (
                <div className="mb-8 inline-flex items-center gap-3 bg-[#e32338] text-white px-8 py-4 rounded-full text-xs font-bold uppercase shadow-xl animate-in slide-in-from-left">
                    <Sparkles className="w-4 h-4" /> Workspace: Daten von "{activeClientName}" aktiv
                    <button onClick={() => { setActiveClientName(null); setTranscript(""); setWebsiteUrl(""); setSocialUrl(""); setCompanySize(""); setSelectedCategory(null); }} className="ml-4 hover:rotate-90 transition-transform"><Trash2 className="w-4 h-4" /></button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.length === 0 ? <div className="col-span-full border-2 border-dashed border-[#2c233e]/10 rounded-[4rem] p-24 text-center opacity-30 font-bold">Warte auf Kundendaten...</div> : submissions.map(sub => (
                <div key={sub.id} className={`bg-white/60 backdrop-blur-md border p-10 rounded-[3.5rem] shadow-lg hover:shadow-2xl transition-all relative ${activeClientName === sub.name ? 'border-[#e32338] scale-95' : 'border-white/60'}`}>
                  <h3 className="text-2xl font-bold mb-1">{sub.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-[9px] font-bold bg-[#2c233e]/5 px-2 py-1 rounded uppercase tracking-widest">{sub.companySize || "N.A."}</span>
                    <span className="text-[9px] font-bold bg-[#e32338]/10 px-2 py-1 rounded uppercase tracking-widest">{sub.category || "Unklar"}</span>
                  </div>
                  <p className="text-sm italic opacity-60 line-clamp-3 mb-10 leading-relaxed">"{sub.text}"</p>
                  <button onClick={() => loadFromInbox(sub)} className="w-full py-5 bg-[#2c233e] text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all">
                    Workspace laden <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-24" ref={categorySectionRef}>
              <h1 className="text-5xl font-bold mb-16 tracking-tight">Analyse <span className="text-[#e32338]">Basis.</span></h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className={`group p-12 rounded-[4rem] text-left transition-all duration-300 shadow-xl hover:-translate-y-2 ${selectedCategory?.label === cat.label ? 'bg-[#2c233e] text-white border-transparent' : 'bg-white/40 border border-white/60 hover:bg-white'}`}>
                    <div className="flex justify-between items-start mb-6"><cat.Icon className={`w-6 h-6 ${selectedCategory?.label === cat.label ? 'text-[#e32338]' : 'text-[#2c233e]/30'}`} /> <ArrowRight className={`w-6 h-6 transition-all ${selectedCategory?.label === cat.label ? 'opacity-100 text-[#e32338]' : 'opacity-0'}`} /></div>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">{cat.label}</h3>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
             <div className="flex justify-between items-end gap-8">
               <div><button onClick={() => setStep(1)} className="flex items-center gap-2 text-[11px] font-bold opacity-50 hover:text-[#e32338] bg-white/40 px-6 py-3 rounded-full transition-all mb-4"><ChevronLeft className="w-4 h-4" /> Zurück</button><h2 className="text-4xl font-bold tracking-tight">Workspace & <span className="text-[#e32338]">Analyse.</span></h2></div>
               <button onClick={generateDNA} disabled={!transcript || isTranscribing} className="px-12 py-5 bg-[#e32338] text-white rounded-full font-bold uppercase text-[12px] tracking-widest shadow-2xl hover:bg-[#c91d31] transition-all transform hover:scale-105 active:scale-95">DNA Analyse starten</button>
             </div>
             {appError && <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl font-bold text-sm">{appError}</div>}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-8 space-y-8">
                 <div className="bg-white/50 border border-white/60 rounded-[3rem] p-8 space-y-6 shadow-xl"><div className="grid grid-cols-2 gap-6"><div className="relative"><Globe className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 opacity-30" /><input type="text" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website URL" className="w-full bg-white/40 border border-[#2c233e]/5 rounded-2xl pl-14 pr-6 py-5 font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#e32338]/20 transition-all" /></div><div className="relative"><User className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 opacity-30" /><input type="text" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="Social Media" className="w-full bg-white/40 border border-[#2c233e]/5 rounded-2xl pl-14 pr-6 py-5 font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#e32338]/20 transition-all" /></div></div></div>
                 <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Interview-Daten einfügen..." className="bg-white/60 backdrop-blur-xl w-full min-h-[600px] p-16 rounded-[4rem] border border-white/60 outline-none text-2xl leading-relaxed resize-none shadow-2xl placeholder:text-[#2c233e]/10" />
               </div>
               <div className="lg:col-span-4 h-fit sticky top-28"><div className="bg-white/30 border border-white/60 rounded-[3.5rem] p-10 shadow-lg"><h3 className="text-[11px] font-bold uppercase tracking-widest mb-10 text-[#e32338]">Details</h3><div className="space-y-4 text-xs font-bold uppercase opacity-60"><div>Größe: {companySize || "N.A."}</div><div>Bereich: {selectedCategory?.label || "N.A."}</div></div></div></div>
             </div>
          </div>
        )}
        {step === 3 && <div className="h-[70vh] flex flex-col items-center justify-center text-center"><div className="relative mb-12"><div className="w-32 h-32 border-4 border-[#e32338]/10 border-t-[#e32338] rounded-full animate-spin"></div><Sparkles className="w-8 h-8 text-[#e32338] absolute inset-0 m-auto animate-pulse" /></div><h2 className="text-4xl font-bold mb-4 tracking-tight">Analyse aktiv.</h2><p className="text-xl opacity-40">Freystil Sales Bot kalibriert Ergebnisse...</p></div>}
        {step === 4 && outputJson && (
          <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-12">
             <div className="flex justify-between items-center gap-8">
                <div><h1 className="text-5xl font-bold tracking-tight mb-2">Analyse <span className="text-[#e32338]">Fertig.</span></h1></div>
                <div className="flex gap-4"><button onClick={() => { setStep(1); setOutputJson(null); setSocialHooks(null); setStrategyReport(null); }} className="px-10 py-5 bg-white text-[#2c233e] rounded-full text-[11px] font-bold uppercase shadow-xl hover:text-[#e32338] transition-all">Inbox</button><button onClick={() => { copySimpleText(JSON.stringify(outputJson, null, 2), () => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }} className="px-10 py-5 bg-[#e32338] text-white rounded-full text-[11px] font-bold uppercase shadow-2xl flex items-center gap-3 hover:bg-[#c91d31] transition-all">{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? 'Kopiert!' : 'JSON (Base44)'}</button></div>
             </div>
             
             <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[4rem] p-12 shadow-2xl">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10"><div><h3 className="text-3xl font-bold mb-2 flex items-center gap-3"><FileText className="w-8 h-8 text-[#e32338]" /> Freystil Sales <span className="text-[#e32338]">Report.</span></h3><p className="text-lg opacity-60 font-medium max-w-xl">Strategische Sales Mail & Analyse nach dem Freystil-Framework.</p></div>{!strategyReport && <button onClick={generateStrategy} disabled={isGeneratingStrategy} className="px-10 py-5 bg-white text-[#2c233e] border-2 border-[#e32338]/10 rounded-full font-bold uppercase text-[11px] tracking-widest shadow-lg flex items-center gap-3 hover:bg-[#e32338] hover:text-white transition-all">{isGeneratingStrategy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Report erstellen</button>}</div>
               {strategyReport && <div className="bg-white rounded-[3rem] p-12 border border-white/60 relative group"><button onClick={() => copySimpleText(strategyReport)} className="absolute top-8 right-8 p-4 bg-white hover:bg-[#e32338] hover:text-white rounded-full transition-all shadow-md active:scale-95"><Copy className="w-5 h-5" /></button><div className="prose prose-lg text-[#2c233e] whitespace-pre-wrap font-medium leading-relaxed max-w-none">{strategyReport}</div></div>}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12"><div className="bg-[#2c233e] border border-white/10 rounded-[4rem] p-10 shadow-2xl overflow-auto max-h-[800px]"><pre className="text-white/80 font-mono text-sm leading-relaxed"><code>{JSON.stringify(outputJson, null, 2)}</code></pre></div><div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[4rem] p-12 shadow-2xl h-fit"><h3 className="text-3xl font-bold mb-10 flex items-center gap-3"><Sparkles className="w-6 h-6 text-[#e32338]" /> Content <span className="text-[#e32338]">Inkubator.</span></h3>{!socialHooks ? <button onClick={generateHooks} disabled={isGeneratingHooks} className="w-full py-8 bg-white text-[#2c233e] rounded-[2.5rem] font-bold uppercase text-[12px] shadow-xl hover:text-[#e32338] transition-all flex items-center justify-center gap-4">{isGeneratingHooks ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />} 5 Hooks generieren</button> : <div className="space-y-6">{socialHooks.map((h, i) => <div key={i} className="p-8 bg-white border border-white/40 rounded-[2.5rem] italic font-medium relative group hover:bg-[#e32338]/5 transition-all shadow-sm transform hover:-translate-y-1">{h}<button onClick={() => copySimpleText(h)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[#e32338] hover:scale-110 transition-all"><Copy className="w-4 h-4" /></button></div>)}</div>}</div></div>
          </div>
        )}
      </main>
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(227, 35, 56, 0.2); border-radius: 10px; }`}} />
    </div>
  );
}
