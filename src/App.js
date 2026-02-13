import React, { useState, useRef, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
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
  UploadCloud, Lock, FileText, Pause, Play, Trash2, AlertCircle
} from 'lucide-react';

// =================================================================
// 1. STABILE INITIALISIERUNG (ONLINE ONLY)
// =================================================================

// Firebase Config direkt für Vercel Production hinterlegt
const firebaseConfig = {
  apiKey: "AIzaSyCd9YnXBiLct5RFgqqDCnvIODV5dVtKkmI",
  authDomain: "studio-fuchs.firebaseapp.com",
  projectId: "studio-fuchs",
  storageBucket: "studio-fuchs.firebasestorage.app",
  messagingSenderId: "743239245515",
  appId: "1:743239245515:web:b32ec9724c0dcc853b454e"
};

const appId = 'brand-dna-studio-fuchs-live';
const ADMIN_PIN = "1704"; 
const PROXY_URL = "/api/gemini"; // Relativer Pfad für Vercel API Routes

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// =================================================================
// DATEN (DEIN DESIGN-STAND)
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

const JSON_SYSTEM_INSTRUCTION = `Du bist eine strategische Brand DNA Engine für Studio Fuchs. Extrahiere aus Input eine präzise Marken-Identität nach Base44. Antworte AUSSCHLIESSLICH mit reinem JSON-Objekt.`;
const STRATEGY_SYSTEM_INSTRUCTION = `Du bist Thorsten Fuchs, Sales-Mail-Architekt. Erstelle eine "Freystil Sales"-Analyse. Antworte im JSON Format mit einem Feld "report".`;

// =================================================================
// APP
// =================================================================

export default function App() {
  const [appMode, setAppMode] = useState('select'); 
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
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
  
  // Status & Locking
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [appError, setAppError] = useState(null);
  const isAiBusy = isTranscribing || isGenerating || isGeneratingHooks || isGeneratingStrategy;

  // Results
  const [outputJson, setOutputJson] = useState(null);
  const [socialHooks, setSocialHooks] = useState(null);
  const [strategyReport, setStrategyReport] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Client Portal
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
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

  // --- 1. AUTH & LISTENERS ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') setAppMode('client');
    
    // Anonym anmelden für Firestore Zugriff
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth Init Error", e);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !user || !isAdminLoggedIn) return;
    const submissionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    const unsubscribe = onSnapshot(submissionsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (error) => {
      console.error("Firestore Error", error);
    });
    return () => unsubscribe();
  }, [user, isAdminLoggedIn]);

  // --- 2. AI & API LOGIK (DEBOUNCE & BACKOFF) ---
  const callAI = async (payload, maxRetries = 5) => {
    if (isAiBusy) return; // Request-Lock
    
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    model: "gemini-2.5-flash-preview-09-2025", 
                    ...payload // Direkte Struktur für Google API
                })
            });

            if (res.status === 429 && i < maxRetries - 1) {
                await new Promise(r => setTimeout(r, delays[i]));
                continue;
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
            return data;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, delays[i]));
        }
    }
  };

  // --- 3. ACTIONS ---
  const processAudio = async (blob) => {
    if (isAiBusy) return;
    setIsTranscribing(true); setAppError(null);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = async () => {
      try {
        const cleanMime = blob.type.split(';')[0] || 'audio/webm';
        const data = await callAI({ 
          contents: [{ parts: [{ text: "Transkribiere auf Deutsch." }, { inlineData: { mimeType: cleanMime, data: reader.result.split(',')[1] } }] }] 
        });
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) setTranscript(prev => prev ? prev + "\n\n" + text : text);
      } catch (err) { setAppError("KI überlastet. Bitte kurz warten."); }
      finally { setIsTranscribing(false); }
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const update = () => {
        if(!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioLevel(dataArray.reduce((a,b)=>a+b)/dataArray.length);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        processAudio(new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true); setIsPaused(false);
    } catch (e) { setAppError("Mikrofon-Zugriff verweigert."); }
  };

  const handleClientSubmit = async () => {
    if (!clientName.trim() || !transcript.trim() || !user) return;
    setIsSending(true); setAppError(null);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        name: clientName, company: clientCompany, category: clientCategory, 
        companySize: companySize, text: transcript, timestamp: Date.now()
      });
      setClientSubmitted(true);
    } catch (err) { setAppError("Datenbank-Fehler beim Senden."); }
    finally { setIsSending(false); }
  };

  const generateDNA = async () => {
    if (isAiBusy || !transcript) return;
    setIsGenerating(true); setStep(3); setAppError(null);
    try {
      const data = await callAI({
        systemInstruction: { parts: [{ text: JSON_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Kunde: ${companySize}, ${selectedCategory?.label}\nInput: ${transcript}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const res = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setOutputJson(JSON.parse(res.trim()));
      setStep(4);
    } catch (err) { setAppError("KI-Fehler bei DNA Analyse."); setStep(2); }
    finally { setIsGenerating(false); }
  };

  const generateStrategy = async () => {
    if (isAiBusy) return;
    setIsGeneratingStrategy(true);
    try {
      const data = await callAI({
        systemInstruction: { parts: [{ text: STRATEGY_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Kunde: ${activeClientName}\nInput: ${transcript}` }] }]
      });
      const res = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
      setStrategyReport(String(res.report));
    } catch (err) { setAppError("KI-Fehler beim Report."); }
    finally { setIsGeneratingStrategy(false); }
  };

  const loadFromInbox = (sub) => {
    setTranscript(sub.text || "");
    setCompanySize(sub.companySize || "");
    setActiveClientName(sub.name || "Gast");
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = (txt) => {
    const el = document.createElement('textarea');
    el.value = txt; document.body.appendChild(el);
    el.select(); document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const copyMagicLink = () => {
    const url = window.location.href.split('?')[0] + '?view=client';
    copyToClipboard(url);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
  };

  // --- RENDER ---
  if (appMode === 'select') return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 text-[#2c233e]">
      <div className="text-center mb-16 animate-in fade-in zoom-in duration-700">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-3">Designstudio <span className="text-[#e32338]">Fuchs</span></h1>
        <p className="opacity-60 font-medium text-lg uppercase tracking-widest text-[12px]">Brand Intelligence System</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        <button onClick={() => setAppMode('client')} className="group bg-white/70 backdrop-blur-md hover:bg-white p-16 rounded-[4rem] text-center shadow-xl transition-all duration-300">
          <div className="w-24 h-24 rounded-full bg-[#e32338]/5 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><User className="w-10 h-10 text-[#e32338]" /></div>
          <h2 className="text-3xl font-bold mb-3">Kunden-Portal</h2>
          <p className="opacity-60 font-medium text-sm">Briefing & Daten übermitteln.</p>
        </button>
        <button onClick={() => setAppMode('login')} className="group bg-[#2c233e]/90 p-16 rounded-[4rem] text-center shadow-2xl transition-all duration-300 text-white">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><Briefcase className="w-10 h-10 text-white" /></div>
          <h2 className="text-3xl font-bold mb-3">Agentur-Dashboard</h2>
          <p className="opacity-40 font-medium text-sm">Analyse & Strategie.</p>
        </button>
      </div>
    </div>
  );

  if (appMode === 'login') return (
    <div className="min-h-screen bg-[#2c233e] flex items-center justify-center p-6 text-white text-center">
      <form onSubmit={(e) => { e.preventDefault(); if(pinInput === ADMIN_PIN) { setIsAdminLoggedIn(true); setAppMode('agency'); } else setLoginError(true); }} className="bg-white/10 p-12 rounded-[3rem] w-full max-w-md backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-white">Admin PIN</h2>
        <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="PIN" className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-center text-3xl tracking-[1em] outline-none mb-4" />
        {loginError && <p className="text-[#e32338] font-bold mb-4">PIN falsch!</p>}
        <div className="flex gap-4"><button type="button" onClick={() => setAppMode('select')} className="flex-1 opacity-40 font-bold uppercase text-xs">Abbruch</button><button type="submit" className="flex-1 bg-[#e32338] py-4 rounded-2xl font-bold uppercase text-xs">Login</button></div>
      </form>
    </div>
  );

  if (appMode === 'client') return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans">
      <header className="px-8 h-24 flex items-center justify-between border-b border-white/20 bg-white/10 backdrop-blur-md">
        <div className="font-bold text-2xl">Designstudio<span className="text-[#e32338]">Fuchs</span></div>
        <button onClick={() => setAppMode('select')} className="text-xs font-bold opacity-40 uppercase px-6 py-2 bg-white/40 rounded-full">Abbrechen</button>
      </header>
      <main className="max-w-6xl mx-auto px-8 py-16 animate-in fade-in duration-700">
        {clientSubmitted ? (
          <div className="text-center py-20 bg-white/40 backdrop-blur-xl rounded-[4rem] shadow-2xl border border-white/60 animate-in fade-in">
            <Check className="w-20 h-20 text-[#e32338] mx-auto mb-8" />
            <h2 className="text-4xl font-bold mb-4 text-[#2c233e]">Erfolgreich!</h2>
            <p className="text-xl opacity-60 mb-10">Deine Nachricht wurde sicher übermittelt.</p>
            <button onClick={() => { setClientSubmitted(false); setAppMode('select'); }} className="px-12 py-4 bg-[#2c233e] text-white rounded-full font-bold shadow-xl hover:bg-black">Startseite</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] p-10 shadow-xl">
                <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 text-[#e32338] flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Leitfragen</h3>
                <div className="space-y-6">
                  {INTERVIEW_QUESTIONS.map(q => (
                    <div key={q.id} className="border-l-4 border-[#2c233e]/5 pl-6"><p className="font-bold text-sm mb-1">{q.title}</p><p className="text-xs opacity-50">{q.text}</p></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-8">
              {appError && <div className="bg-red-50 text-red-600 p-6 rounded-3xl font-bold animate-in slide-in-from-top-2">{String(appError)}</div>}
              <div className="bg-white/40 border border-white/60 rounded-[3rem] p-10 shadow-xl space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Name *" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium" />
                  <input type="text" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Firma" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase opacity-40 ml-2 text-[#2c233e]">Teamgröße</label>
                  <div className="flex flex-wrap gap-2">{COMPANY_SIZES.map(s => <button key={s} onClick={() => setCompanySize(s)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${companySize === s ? 'bg-[#e32338] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/50 hover:bg-white/50'}`}>{s}</button>)}</div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase opacity-40 ml-2 text-[#2c233e]">Bereich</label>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map(c => <button key={c.id} onClick={() => setClientCategory(c.label)} className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${clientCategory === c.label ? 'bg-[#e32338] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/60 hover:bg-white/50'}`}><div className="flex items-center gap-2 font-bold text-xs"><c.Icon className="w-4 h-4" /> {c.label}</div></button>)}
                    <button onClick={() => setClientCategory("Nicht sicher")} className={`p-4 rounded-2xl text-center border font-bold text-xs col-span-2 ${clientCategory === "Nicht sicher" ? 'bg-[#2c233e] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/40'}`}>Ich bin mir nicht sicher</button>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 border border-white/60 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="p-8 border-b border-white/40 flex justify-center items-center gap-6 bg-white/20">
                  {!isRecording ? <button onClick={startRecording} className="flex items-center gap-3 px-12 py-6 bg-[#e32338] text-white rounded-full font-bold uppercase text-[12px] tracking-widest shadow-lg hover:scale-105 transition-all"><Mic className="w-6 h-6" /> Aufnahme</button> : <div className="flex gap-4 items-center"><div className="h-2 w-48 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-[#e32338] transition-all" style={{ width: `${Math.min(100, audioLevel * 2)}%` }} /></div><button onClick={() => mediaRecorderRef.current?.stop()} className="p-4 bg-[#2c233e] text-white rounded-full"><Square /></button></div>}
                </div>
                {isTranscribing && <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 text-[#e32338] animate-spin mb-4" /><p className="text-xs font-bold uppercase tracking-widest text-[#2c233e]">KI schreibt...</p></div>}
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Deine Nachricht..." className="w-full bg-transparent p-12 text-xl font-medium min-h-[400px] outline-none resize-none leading-relaxed placeholder:text-[#2c233e]/20" />
                <div className="p-8 border-t border-white/40 flex justify-end bg-white/10"><button onClick={handleClientSubmit} disabled={isSending || isAiBusy || !transcript || !clientName} className="bg-[#e32338] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl disabled:opacity-30 transform hover:translate-x-1 transition-all">{isSending ? <Loader2 className="animate-spin" /> : 'Senden'}</button></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans">
      <header className="px-8 h-20 flex items-center justify-between border-b border-white/20 bg-white/10 backdrop-blur-md sticky top-0 z-20">
        <span className="font-bold text-xl tracking-tight">Designstudio<span className="text-[#e32338]">Fuchs</span></span>
        <div className="flex items-center gap-8"><button onClick={copyMagicLink} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#e32338] bg-white px-6 py-2 rounded-full shadow-sm">{linkCopied ? "Kopiert!" : "Kunden-Link"}</button><button onClick={() => { setIsAdminLoggedIn(false); setAppMode('select'); }} className="text-[11px] font-bold opacity-30 hover:opacity-100 flex items-center gap-2 transition-all"><Lock className="w-4 h-4" /> Logout</button></div>
      </header>
      <main className="max-w-7xl mx-auto px-8 py-12 animate-in fade-in duration-700">
        {step === 1 && (
          <div className="mb-20">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2 opacity-60"><Inbox className="w-4 h-4" /> Posteingang ({submissions.length})</h2>
            {activeClientName && <div className="mb-8 inline-flex items-center gap-3 bg-[#e32338] text-white px-8 py-4 rounded-full text-xs font-bold uppercase shadow-xl animate-in slide-in-from-left"><Sparkles className="w-4 h-4" /> Workspace: {String(activeClientName)} aktiv <button onClick={() => { setActiveClientName(null); setTranscript(""); setCompanySize(""); setSelectedCategory(null); }} className="ml-4 hover:rotate-90 transition-transform"><Trash2 className="w-4 h-4" /></button></div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{submissions.map(sub => (
                <div key={sub.id} className={`bg-white/60 p-8 rounded-[2.5rem] shadow-lg border border-white/60 hover:shadow-xl transition-all relative ${activeClientName === sub.name ? 'border-[#e32338] ring-2 ring-[#e32338]/20' : ''}`}>
                  <div className="flex justify-between mb-4"><span className="font-bold text-lg">{String(sub.name || "Gast")}</span><span className="text-[10px] bg-[#e32338]/10 text-[#e32338] px-2 py-1 rounded font-bold uppercase">{String(sub.category || "Unklar")}</span></div>
                  <p className="text-sm italic opacity-60 line-clamp-3 mb-10 leading-relaxed font-medium">"{String(sub.text || "")}"</p>
                  <button onClick={() => loadFromInbox(sub)} className="w-full py-4 bg-[#2c233e] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">Laden</button>
                </div>
              ))}</div>
            <div className="mt-24 pt-16 border-t border-[#2c233e]/5">
              <h1 className="text-4xl font-bold mb-12">Analyse <span className="text-[#e32338]">Basis.</span></h1>
              <div className="grid grid-cols-2 gap-6">{CATEGORIES.map(c => <button key={c.id} onClick={() => { setSelectedCategory(c); setStep(2); }} className={`p-8 rounded-[3rem] text-left transition-all ${selectedCategory?.id === c.id ? 'bg-[#2c233e] text-white' : 'bg-white/40 hover:bg-white'}`}><c.Icon className={`w-8 h-8 mb-6 ${selectedCategory?.id === c.id ? 'text-[#e32338]' : 'text-[#2c233e]/30'}`} /><div className="font-bold text-2xl">{c.label}</div></button>)}</div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
            <div className="flex justify-between items-end gap-8">
              <div><button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-bold opacity-50 mb-4 hover:opacity-100"><ChevronLeft className="w-4 h-4" /> Zurück</button><h2 className="text-4xl font-bold tracking-tight text-[#2c233e]">Workspace.</h2></div>
              <button onClick={handleDNAAnalyse} disabled={!transcript || isAiBusy} className="px-12 py-5 bg-[#e32338] text-white rounded-full font-bold uppercase text-[12px] tracking-widest shadow-2xl hover:scale-105 transition-all">DNA Analyse Starten</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 bg-white/50 border border-white/60 rounded-[3rem] p-10 shadow-xl">
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} className="w-full h-[600px] bg-transparent resize-none outline-none text-xl leading-relaxed font-medium" placeholder="Input Daten..." />
              </div>
              <div className="lg:col-span-4 bg-white/30 border border-white/60 rounded-[3.5rem] p-10 h-fit shadow-sm text-[#2c233e]">
                <h3 className="text-[10px] font-bold uppercase opacity-50 mb-10 tracking-widest">Client Meta Info</h3>
                <div className="space-y-6 text-sm font-bold uppercase">
                  <div className="flex justify-between pb-4 border-b border-[#2c233e]/5"><span>Name:</span><span>{String(activeClientName) || "Gast"}</span></div>
                  <div className="flex justify-between pb-4 border-b border-[#2c233e]/5"><span>Größe:</span><span>{String(companySize) || "N.A."}</span></div>
                  <div className="flex justify-between"><span>Bereich:</span><span>{selectedCategory?.label || "Unklar"}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 3 && <div className="h-[70vh] flex flex-col items-center justify-center text-center"><div className="relative mb-12"><div className="w-32 h-32 border-4 border-[#e32338]/10 border-t-[#e32338] rounded-full animate-spin"></div><Sparkles className="w-8 h-8 text-[#e32338] absolute inset-0 m-auto animate-pulse" /></div><h2 className="text-4xl font-bold mb-4 tracking-tight text-[#2c233e]">Analyse aktiv.</h2><p className="text-xl opacity-40">Intelligence Bot kalibriert Ergebnisse...</p></div>}
        {step === 4 && outputJson && (
          <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-12">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold tracking-tight text-[#2c233e]">Analyse <span className="text-[#e32338]">Fertig.</span></h1>
              <div className="flex gap-4"><button onClick={() => { setStep(1); setOutputJson(null); setStrategyReport(null); }} className="px-10 py-5 bg-white text-[#2c233e] rounded-full text-[11px] font-bold uppercase shadow-xl hover:text-[#e32338] transition-all">Posteingang</button><button onClick={() => copyToClipboard(JSON.stringify(outputJson, null, 2))} className="px-10 py-5 bg-[#e32338] text-white rounded-full text-[11px] font-bold uppercase shadow-2xl flex items-center gap-3 hover:bg-[#c91d31] transition-all">{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} Kopieren</button></div>
            </div>
            <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[4rem] p-12 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10"><div><h3 className="text-3xl font-bold mb-2 flex items-center gap-3 tracking-tight"><FileText className="w-8 h-8 text-[#e32338]" /> Freystil Sales <span className="text-[#e32338]">Report.</span></h3></div>{!strategyReport && <button onClick={generateStrategy} disabled={isAiBusy} className="px-10 py-5 bg-white text-[#2c233e] border-2 border-[#e32338]/10 rounded-full font-bold uppercase text-[11px] tracking-widest shadow-lg flex items-center gap-3 hover:bg-[#e32338] hover:text-white transition-all">{isGeneratingStrategy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Report erstellen</button>}</div>
              {strategyReport && <div className="bg-white rounded-[3rem] p-12 border border-white/60 relative group shadow-inner"><button onClick={() => copyToClipboard(strategyReport)} className="absolute top-8 right-8 p-4 bg-white hover:bg-[#e32338] hover:text-white rounded-full transition-all shadow-md active:scale-95"><Copy className="w-5 h-5" /></button><div className="prose prose-lg text-[#2c233e] whitespace-pre-wrap font-medium leading-relaxed max-w-none">{String(strategyReport)}</div></div>}
            </div>
            <div className="bg-[#2c233e] border border-white/10 rounded-[4rem] p-10 shadow-2xl overflow-auto max-h-[800px] custom-scrollbar"><div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5"><span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Base44 Schema Output</span><FileJson className="w-5 h-5 text-white/30" /></div><pre className="text-white/80 font-mono text-sm leading-relaxed"><code>{JSON.stringify(outputJson, null, 2)}</code></pre></div>
          </div>
        )}
      </main>
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(227, 35, 56, 0.2); border-radius: 10px; }` }} />
    </div>
  );
}
