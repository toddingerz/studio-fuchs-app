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
// 1. KONFIGURATION (ONLINE ONLY)
// =================================================================

let app, auth, db;
const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'brand-dna-studio-fuchs-live';
// FIX: Aggressive Bereinigung der appId für Firebase Pfade (Regel 1 konform)
const appId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_');

const initFirebase = () => {
  if (db && auth) return true; // Bereits erfolgreich initialisiert
  try {
    // Prüfen, ob die globale Config-Variable existiert
    const configSource = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
    
    if (configSource) {
      // Firebase erwartet ein Objekt. Wir parsen nur, wenn es ein String ist.
      const firebaseConfig = typeof configSource === 'string' ? JSON.parse(configSource) : configSource;
      
      // Standalone Initialisierung ohne NgModules (React Pattern)
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      return true;
    }
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
  return false;
};

// Sofortiger Initialisierungsversuch beim Laden
initFirebase();

const ADMIN_PIN = "1704"; 
const PROXY_URL = "/api/gemini"; 

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

const JSON_SYSTEM_INSTRUCTION = `Du bist eine strategische Brand DNA Engine für Studio Fuchs. Extrahiere aus Input eine präzise Marken-Identität nach Base44. Format: REINES JSON.`;
const STRATEGY_SYSTEM_INSTRUCTION = `Du bist Thorsten Fuchs von designstudiofuchs.de, Sales-Mail-Architekt. Erstelle eine ehrliche "Freystil Sales"-Analyse direkt an den Kunden. Antworte im JSON Format mit einem Feld "report".`;

// =================================================================
// APP COMPONENT
// =================================================================

export default function App() {
  const [appMode, setAppMode] = useState('select'); 
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeClientName, setActiveClientName] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [transcript, setTranscript] = useState("");
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [appError, setAppError] = useState(null);

  const [outputJson, setOutputJson] = useState(null);
  const [socialHooks, setSocialHooks] = useState(null);
  const [strategyReport, setStrategyReport] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
  const categorySectionRef = useRef(null);

  // --- ACTIONS & LOGIK ---

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

  const callAI = async (payload, maxRetries = 7) => {
    const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('googleusercontent');
    const delays = [1000, 2000, 4000, 8000, 16000, 32000, 64000];

    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(PROXY_URL, {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "gemini-2.5-flash-preview-09-2025", ...payload })
            });

            if (res.status === 429 && i < maxRetries - 1) {
                await new Promise(r => setTimeout(r, delays[i]));
                continue;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(String(err.message || err.error || `Server Fehler: ${res.status}`));
            }
            return await res.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, delays[i]));
        }
    }
  };

  const processAudio = async (blob) => {
    setIsTranscribing(true); setAppError(null);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = async () => {
      try {
        const cleanMimeType = blob.type.split(';')[0] || 'audio/webm';
        const data = await callAI({ contents: [{ parts: [{ text: "Transkribiere dieses Audio wortwörtlich auf Deutsch. Antworte nur mit dem Text." }, { inlineData: { mimeType: cleanMimeType, data: reader.result.split(',')[1] } }] }] });
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) setTranscript(prev => prev ? prev + "\n\n" + text : text);
      } catch (err) { setAppError("Transkription fehlgeschlagen: " + String(err.message)); }
      finally { setIsTranscribing(false); }
    };
  };

  const startRecording = async () => {
    setAppError(null);
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
        setAudioLevel(dataArray.reduce((a, b) => a + b) / dataArray.length);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
        processAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true); setIsPaused(false);
    } catch (err) { setAppError("Mikrofonfehler: " + String(err.message)); }
  };
  
  const togglePause = () => {
      if (!mediaRecorderRef.current) return;
      if (!isPaused) { mediaRecorderRef.current.pause(); setIsPaused(true); setAudioLevel(0); } 
      else { mediaRecorderRef.current.resume(); setIsPaused(false); }
  };
  
  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      setIsRecording(false); setIsPaused(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const handleClientSubmit = async () => {
    if (!clientName.trim() || !transcript.trim()) return;
    setIsSending(true);
    setAppError(null);
    try {
      // FIX: Sicherstellen, dass die Datenbank bereit ist (Regel 3)
      const success = initFirebase();
      if (!success) throw new Error("Firebase konnte nicht initialisiert werden. Bitte Konfiguration prüfen.");
      
      // FIX: Authentifizierung vor dem Schreibvorgang sicherstellen (Regel 3)
      if (!auth.currentUser) {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(auth, __initial_auth_token);
          } else {
              await signInAnonymously(auth);
          }
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        name: clientName, company: clientCompany, website: websiteUrl, social: socialUrl, 
        category: clientCategory, companySize: companySize, text: transcript, timestamp: Date.now()
      });
      setClientSubmitted(true);
    } catch (err) { 
        console.error("Submit Error:", err);
        setAppError("Senden fehlgeschlagen: " + String(err.message)); 
    }
    finally { setIsSending(false); }
  };

  const loadFromInbox = (sub) => {
    setTranscript(sub.text || "");
    if (sub.category) {
        if (sub.category === "Nicht sicher") setSelectedCategory(null);
        else { const found = CATEGORIES.find(c => c.label === sub.category); setSelectedCategory(found || null); }
    }
    setCompanySize(sub.companySize || "");
    setActiveClientName(String(sub.name || "Gast"));
    setWebsiteUrl(sub.website || "");
    setSocialUrl(sub.social || "");
    setStep(2); 
    setTimeout(() => { categorySectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const handleDNAAnalyse = async () => {
    setIsGenerating(true); setStep(3); setAppError(null);
    try {
      const data = await callAI({
        systemInstruction: { parts: [{ text: JSON_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Input: ${transcript}\nFirmengröße: ${companySize}\nBereich: ${selectedCategory?.label || "Nicht sicher"}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setOutputJson(JSON.parse(cleanJsonResponse(rawJson)));
      setStep(4);
    } catch (err) { setAppError(String(err.message)); setStep(2); }
    finally { setIsGenerating(false); }
  };

  const handleStrategyAnalyse = async () => {
    setIsGeneratingStrategy(true);
    try {
      const data = await callAI({
        systemInstruction: { parts: [{ text: STRATEGY_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Kunde: ${activeClientName}\nInterview: ${transcript}` }] }]
      });
      const res = JSON.parse(cleanJsonResponse(data.candidates?.[0]?.content?.parts?.[0]?.text));
      setStrategyReport(String(res.report));
    } catch (err) { setAppError("Bericht-Fehler: " + String(err.message)); } 
    finally { setIsGeneratingStrategy(false); }
  };

  const generateHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const data = await callAI({
        systemInstruction: { parts: [{ text: "Erstelle 5 Social Media Hooks basierend auf der DNA." }] },
        contents: [{ parts: [{ text: JSON.stringify(outputJson) }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "STRING" } } }
      });
      const raw = data.candidates[0].content.parts[0].text;
      setSocialHooks(JSON.parse(cleanJsonResponse(raw)));
    } catch (e) { setAppError(String(e.message)); }
    finally { setIsGeneratingHooks(false); }
  };

  // --- EFFECTS ---

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') setAppMode('client');
    
    const startAuth = async () => {
        const success = initFirebase();
        if (success && auth) {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) { console.error("Initial Auth Error:", e); }
            onAuthStateChanged(auth, setUser);
        }
    };
    startAuth();
  }, []);

  useEffect(() => {
    if (!db || !user || !isAdminLoggedIn) return;
    try {
      const submissionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
      const unsubscribe = onSnapshot(submissionsRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      }, (err) => {
        console.error("Sync Error:", err);
      });
      return () => unsubscribe();
    } catch (err) { console.error("Firestore Sync Error", err); }
  }, [user, isAdminLoggedIn]);

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
      <form onSubmit={(e) => { 
        e.preventDefault(); 
        if(pinInput === ADMIN_PIN) {
          setIsAdminLoggedIn(true);
          setAppMode('agency'); 
        } else {
          setLoginError(true);
        }
      }} className="bg-white/10 p-12 rounded-[3rem] w-full max-w-md backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">Admin PIN</h2>
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
        <button onClick={() => setAppMode('select')} className="text-xs font-bold opacity-40 uppercase px-6 py-2 bg-white/40 rounded-full hover:bg-white transition-all">Abbrechen</button>
      </header>
      <main className="max-w-6xl mx-auto px-8 py-16 animate-in fade-in duration-700">
        {clientSubmitted ? (
          <div className="text-center py-20 bg-white/40 backdrop-blur-xl rounded-[4rem] shadow-2xl border border-white/60 animate-in fade-in">
            <Check className="w-20 h-20 text-[#e32338] mx-auto mb-8" />
            <h2 className="text-4xl font-bold mb-4">Erfolgreich!</h2>
            <p className="text-xl opacity-60 mb-10">Deine Nachricht wurde sicher übermittelt.</p>
            <button onClick={() => { setClientSubmitted(false); setAppMode('select'); }} className="px-12 py-4 bg-[#2c233e] text-white rounded-full font-bold">Zur Startseite</button>
          </div>
        ) : (
          <>
            <div className="text-center mb-16"><h1 className="text-5xl font-bold tracking-tight mb-4">Deine <span className="text-[#e32338]">Marke</span> schärfen.</h1></div>
            {appError && <div className="max-w-xl mx-auto mb-8 bg-red-50 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2"><AlertCircle className="w-6 h-6" /><p className="text-sm font-bold">{String(appError)}</p></div>}
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
                <div className="bg-white/40 border border-white/60 rounded-[3rem] p-10 shadow-xl space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Name *" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium" />
                    <input type="text" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Firma" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase opacity-40 ml-2">Wie groß ist dein Team?</label>
                    <div className="flex flex-wrap gap-2">{COMPANY_SIZES.map(s => <button key={s} onClick={() => setCompanySize(s)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${companySize === s ? 'bg-[#e32338] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/50 hover:bg-white/50'}`}>{s}</button>)}</div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase opacity-40 ml-2">In welchem Bereich bist du tätig?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORIES.map(c => <button key={c.id} onClick={() => setClientCategory(c.label)} className={`p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${clientCategory === c.label ? 'bg-[#e32338] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/60 hover:bg-white/50'}`}><div className="flex items-center gap-2 font-bold text-xs"><c.Icon className="w-4 h-4" /> {c.label}</div></button>)}
                      <button onClick={() => setClientCategory("Nicht sicher")} className={`p-4 rounded-2xl text-center border font-bold text-xs col-span-2 ${clientCategory === "Nicht sicher" ? 'bg-[#2c233e] text-white border-transparent' : 'bg-white/30 border-white/60 text-[#2c233e]/40'}`}>Ich bin mir nicht sicher</button>
                    </div>
                  </div>
                </div>
                <div className="bg-white/50 border border-white/60 rounded-[3rem] overflow-hidden shadow-2xl relative">
                  <div className="p-8 border-b border-white/40 flex justify-center items-center gap-6 bg-white/20">
                    {!isRecording ? (
                      <button onClick={startRecording} className="flex items-center gap-3 px-12 py-6 bg-[#e32338] text-white rounded-full font-bold uppercase text-[12px] tracking-widest shadow-lg hover:bg-[#c91d31] transition-all transform hover:scale-105 active:scale-95"><Mic className="w-6 h-6" /> Aufnahme starten</button>
                    ) : (
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="h-2 w-48 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-[#e32338] transition-all" style={{ width: `${Math.min(100, audioLevel * 2)}%` }} /></div>
                        <div className="flex gap-4">
                          <button onClick={togglePause} className={`flex items-center gap-3 px-8 py-5 text-white rounded-full font-bold uppercase text-[10px] shadow-lg transition-all ${isPaused ? 'bg-emerald-500' : 'bg-amber-500'}`}>{isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />} {isPaused ? "Weiter" : "Pause"}</button>
                          <button onClick={stopRecording} className="flex items-center gap-3 px-8 py-5 bg-[#2c233e] text-white rounded-full font-bold uppercase text-[10px] shadow-lg"><Square className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                  {isTranscribing && <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-10"><Loader2 className="w-10 h-10 text-[#e32338] animate-spin mb-4" /><p className="text-xs font-bold uppercase tracking-widest">KI schreibt Nachricht...</p></div>}
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Deine Nachricht hier..." className="w-full bg-transparent p-12 text-xl font-medium min-h-[400px] outline-none resize-none leading-relaxed placeholder:text-[#2c233e]/20" />
                  <div className="p-8 border-t border-white/40 flex justify-end bg-white/10">
                    <button onClick={handleClientSubmit} disabled={isSending || !transcript || !clientName} className="bg-[#e32338] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl disabled:opacity-30 flex items-center gap-3 transform hover:translate-x-1 transition-all">
                      {isSending ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4" /> Analyse senden</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );

  // --- AGENCY DASHBOARD ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
      <header className="px-8 h-20 flex items-center justify-between border-b border-white/20 bg-white/10 backdrop-blur-md sticky top-0 z-20">
        <span className="font-bold text-xl">Designstudio<span className="text-[#e32338]">Fuchs</span></span>
        <div className="flex items-center gap-8">
          <button onClick={copyMagicLink} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#e32338] bg-white px-6 py-2 rounded-full shadow-sm hover:shadow-md transition-all">{linkCopied ? "Kopiert!" : "Kunden-Link"}</button>
          <button onClick={() => { setIsAdminLoggedIn(false); setAppMode('select'); }} className="text-[11px] font-bold opacity-30 hover:opacity-100 flex items-center gap-2 transition-all"><Lock className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-8 py-12 animate-in fade-in duration-700">
        {step === 1 && (
          <div className="mb-20">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2 opacity-60"><Inbox className="w-4 h-4" /> Posteingang ({submissions.length})</h2>
            {activeClientName && <div className="mb-8 inline-flex items-center gap-3 bg-[#e32338] text-white px-8 py-4 rounded-full text-xs font-bold uppercase shadow-xl animate-in slide-in-from-left"><Sparkles className="w-4 h-4" /> Workspace: {String(activeClientName)} aktiv <button onClick={() => { setActiveClientName(null); setTranscript(""); setWebsiteUrl(""); setSocialUrl(""); setCompanySize(""); setSelectedCategory(null); }} className="ml-4 hover:rotate-90 transition-transform"><Trash2 className="w-4 h-4" /></button></div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {submissions.map(sub => (
                <div key={sub.id} className={`bg-white/60 p-8 rounded-[2.5rem] shadow-lg border border-white/60 hover:shadow-xl transition-all relative ${activeClientName === sub.name ? 'border-[#e32338] ring-2 ring-[#e32338]/20' : ''}`}>
                  <div className="flex justify-between mb-4"><span className="font-bold text-lg">{String(sub.name || "Gast")}</span><span className="text-[10px] bg-[#e32338]/10 text-[#e32338] px-2 py-1 rounded">{String(sub.category || "Unklar")}</span></div>
                  <p className="text-sm italic opacity-60 line-clamp-3 mb-10 leading-relaxed">"{String(sub.text || "")}"</p>
                  <button onClick={() => loadFromInbox(sub)} className="w-full py-3 bg-[#2c233e] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">Laden</button>
                </div>
              ))}
            </div>
            <div className="mt-16 pt-16 border-t border-[#2c233e]/5">
              <h1 className="text-4xl font-bold mb-8">Analyse Basis</h1>
              <div className="grid grid-cols-2 gap-6">{CATEGORIES.map(c => <button key={c.id} onClick={() => { setSelectedCategory(c); setStep(2); }} className={`p-8 rounded-[3rem] text-left transition-all ${selectedCategory?.id === c.id ? 'bg-[#2c233e] text-white' : 'bg-white/40 hover:bg-white'}`}><c.Icon className="w-8 h-8 mb-4" /><div className="font-bold text-xl">{c.label}</div></button>)}</div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
            <div className="flex justify-between items-end gap-8">
              <div><button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-bold opacity-50 mb-4 hover:opacity-100"><ChevronLeft className="w-4 h-4" /> Zurück</button><h2 className="text-4xl font-bold tracking-tight">Workspace.</h2></div>
              <button onClick={handleDNAAnalyse} disabled={!transcript || isGenerating} className="px-10 py-4 bg-[#e32338] text-white rounded-full font-bold uppercase text-xs shadow-xl hover:scale-105 transition-all">Analyse Starten</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white/50 border border-white/60 rounded-[3rem] p-10 shadow-xl">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="relative"><Globe className="w-4 h-4 absolute left-4 top-4 opacity-30" /><input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website URL" className="w-full bg-white/40 border border-[#2c233e]/5 rounded-xl pl-10 pr-4 py-3 outline-none" /></div>
                  <div className="relative"><User className="w-4 h-4 absolute left-4 top-4 opacity-30" /><input value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="Social Media" className="w-full bg-white/40 border border-[#2c233e]/5 rounded-xl pl-10 pr-4 py-3 outline-none" /></div>
                </div>
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} className="w-full h-[500px] bg-transparent resize-none outline-none text-lg leading-relaxed" placeholder="Input Daten..." />
              </div>
              <div className="lg:col-span-4 bg-white/30 border border-white/60 rounded-[3rem] p-10 h-fit shadow-sm">
                <h3 className="text-[10px] font-bold uppercase opacity-50 mb-6">Client Meta Info</h3>
                <div className="space-y-4 text-sm font-bold">
                  <div className="flex justify-between pb-2 border-b border-[#2c233e]/5"><span>Name:</span><span>{String(activeClientName) || "Gast"}</span></div>
                  <div className="flex justify-between pb-2 border-b border-[#2c233e]/5"><span>Größe:</span><span>{String(companySize) || "N.A."}</span></div>
                  <div className="flex justify-between"><span>Bereich:</span><span>{selectedCategory?.label || "Unklar"}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 3 && <div className="h-[70vh] flex flex-col items-center justify-center text-center"><div className="relative mb-12"><div className="w-32 h-32 border-4 border-[#e32338]/10 border-t-[#e32338] rounded-full animate-spin"></div><Sparkles className="w-8 h-8 text-[#e32338] absolute inset-0 m-auto animate-pulse" /></div><h2 className="text-4xl font-bold mb-4">Analyse aktiv.</h2><p className="text-xl opacity-40">Intelligence Bot kalibriert Ergebnisse...</p></div>}
        {step === 4 && outputJson && (
          <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-12">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold">Analyse <span className="text-[#e32338]">Fertig.</span></h1>
              <div className="flex gap-4"><button onClick={() => { setStep(1); setOutputJson(null); setStrategyReport(null); }} className="px-10 py-5 bg-white text-[#2c233e] rounded-full text-[11px] font-bold uppercase shadow-xl hover:text-[#e32338] transition-all">Posteingang</button><button onClick={() => copySimpleText(JSON.stringify(outputJson, null, 2), () => { setCopied(true); setTimeout(() => setCopied(false), 2000); })} className="px-10 py-5 bg-[#e32338] text-white rounded-full text-[11px] font-bold uppercase shadow-2xl flex items-center gap-3 hover:bg-[#c91d31] transition-all">{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? 'Kopiert!' : 'JSON für Base44'}</button></div>
            </div>
            {/* STRATEGIE REPORT CARD */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[4rem] p-12 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10"><div><h3 className="text-3xl font-bold mb-2 flex items-center gap-3"><FileText className="w-8 h-8 text-[#e32338]" /> Freystil Sales <span className="text-[#e32338]">Report.</span></h3><p className="text-lg opacity-60 font-medium max-w-xl">Strategische Sales Mail & Analyse nach dem Freystil-Framework.</p></div>{!strategyReport && <button onClick={handleStrategyAnalyse} disabled={isGeneratingStrategy} className="px-10 py-5 bg-white text-[#2c233e] border-2 border-[#e32338]/10 rounded-full font-bold uppercase text-[11px] tracking-widest shadow-lg flex items-center gap-3 hover:bg-[#e32338] hover:text-white transition-all">{isGeneratingStrategy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Report erstellen</button>}</div>
              {strategyReport && <div className="bg-white rounded-[3rem] p-12 border border-white/60 relative group shadow-inner"><button onClick={() => copySimpleText(strategyReport)} className="absolute top-8 right-8 p-4 bg-white hover:bg-[#e32338] hover:text-white rounded-full transition-all shadow-md active:scale-95"><Copy className="w-5 h-5" /></button><div className="prose prose-lg text-[#2c233e] whitespace-pre-wrap font-medium leading-relaxed max-w-none">{String(strategyReport)}</div></div>}
            </div>
            {/* JSON BOX */}
            <div className="bg-[#2c233e] border border-white/10 rounded-[4rem] p-10 shadow-2xl overflow-auto max-h-[800px]"><div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10"><span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Base44 Schema Output</span><FileJson className="w-5 h-5 text-white/40" /></div><pre className="text-white/80 font-mono text-sm leading-relaxed"><code>{JSON.stringify(outputJson, null, 2)}</code></pre></div>
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[4rem] p-12 shadow-2xl h-fit">
                 <h3 className="text-3xl font-bold mb-10 flex items-center gap-3"><Sparkles className="w-6 h-6 text-[#e32338]" /> Content <span className="text-[#e32338]">Inkubator.</span></h3>
                 {!socialHooks ? <button onClick={generateHooks} disabled={isGeneratingHooks} className="w-full py-8 bg-white text-[#2c233e] rounded-[2.5rem] font-bold uppercase text-[12px] shadow-xl hover:text-[#e32338] transition-all flex items-center justify-center gap-4">{isGeneratingHooks ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />} 5 Hooks generieren</button> : <div className="space-y-6">{socialHooks.map((h, i) => <div key={i} className="p-8 bg-white border border-white/40 rounded-[2.5rem] italic font-medium relative group hover:bg-[#e32338]/5 transition-all shadow-sm transform hover:-translate-y-1">{String(h)}<button onClick={() => copySimpleText(h)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[#e32338] hover:scale-110 transition-all"><Copy className="w-4 h-4" /></button></div>)}</div>}
            </div>
          </div>
        )}
      </main>
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(227, 35, 56, 0.2); border-radius: 10px; }` }} />
    </div>
  );
}
