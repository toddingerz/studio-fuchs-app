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
// 1. CONFIG & SETUP
// =================================================================

// Firebase Safe Init
let app, auth, db;
try {
  const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
  const firebaseConfig = JSON.parse(configStr);
  
  if (Object.keys(firebaseConfig).length > 0) {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase Init skipped", e);
}

// --- SETTINGS ---
const PREVIEW_API_KEY = ""; // NUR FÜR LOKALE VORSCHAU/TESTS
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

// =================================================================
// PROMPTS
// =================================================================

const JSON_SYSTEM_INSTRUCTION = `Du bist eine strategische Brand DNA Engine für Studio Fuchs. 
Aufgabe: Extrahiere aus Input eine präzise Marken-Identität nach Base44.
Format: REINES JSON. Keine Markdown-Formatierung.
Felder: story_core, story_dna, brand_voice_rules, tone_tags, no_go_tags, audiences, goals_top3, content_themes, content_formats, local_focus, proof_points, category, inference_notes.`;

const STRATEGY_SYSTEM_INSTRUCTION = `
Du bist Thorsten Fuchs, Sales-Mail-Architekt. Erstelle eine "Freystil Sales"-Analyse.
Struktur: 1. Cliffhanger-Betreff (A/B), 2. Hyperpersonalisierter Einstieg, 3. Pain/Potenzial, 4. Storybased Lösung, 5. Nutzen, 6. CTA.
Tonalität: Kurz, präzise, CEO-tauglich.
Antworte im JSON Format mit einem Feld "report".`;

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
  
  // Status & Results
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [appError, setAppError] = useState(null);

  // Results Data
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

  // 1. Auth & Init
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setAppMode('client');
      setIsMagicLink(true);
    }
    if (auth) {
        const init = async () => {
            try {
                if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
                    await signInWithCustomToken(auth, window.__initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) { console.error(e); }
        };
        init();
        return onAuthStateChanged(auth, u => setUser(u));
    }
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!db || !user || !isAdminLoggedIn) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubmissions(data.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsub();
  }, [user, isAdminLoggedIn]);

  // --- API CALL LOGIC ---
  const callAI = async (payload) => {
    const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('googleusercontent');
    
    if (!isLocal) {
        const res = await fetch('/api/gemini', {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gemini-2.5-flash-preview-09-2025", ...payload })
        });
        if (!res.ok) throw new Error((await res.json()).message || "Server Fehler");
        return await res.json();
    } 
    
    if (!PREVIEW_API_KEY) throw new Error("VORSCHAU: Bitte PREVIEW_API_KEY in Zeile 48 eintragen.");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${PREVIEW_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Google API Fehler");
    return await res.json();
  };

  // --- ACTIONS ---
  const handleClientSubmit = async () => {
    if (!clientName.trim() || !transcript.trim()) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        name: clientName, company: clientCompany, website: clientWebsite, social: clientSocial, 
        category: clientCategory, companySize: companySize, text: transcript, timestamp: Date.now()
      });
      setClientSubmitted(true);
    } catch (e) { setAppError("Fehler beim Senden"); }
    finally { setIsSending(false); }
  };

  const loadSubmission = (sub) => {
    setTranscript(sub.text);
    if (sub.category) { 
        if (sub.category === "Nicht sicher / Sonstiges") {
             setSelectedCategory(null);
        } else {
             const found = CATEGORIES.find(c => c.label === sub.category); 
             setSelectedCategory(found || null); 
        }
    }
    setCompanySize(sub.companySize || "");
    setActiveClientName(sub.name);
    setWebsiteUrl(sub.website || "");
    setSocialUrl(sub.social || "");
    setStep(2);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const cleanJsonResponse = (rawText) => {
    if (!rawText) return null;
    let cleaned = rawText.trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
    return cleaned;
  };

  const generateDNA = async () => {
    setIsGenerating(true); setStep(3); setAppError(null);
    try {
      const payload = {
        systemInstruction: { parts: [{ text: JSON_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Kunde: ${companySize}, ${selectedCategory?.label || "Unklar"}\nWeb: ${websiteUrl}\nInput: ${transcript}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      };
      const data = await callAI(payload);
      let text = data.candidates[0].content.parts[0].text.trim();
      setOutputJson(JSON.parse(cleanJsonResponse(text)));
      setStep(4);
    } catch (e) { setAppError(e.message); setStep(2); }
    finally { setIsGenerating(false); }
  };

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const payload = {
        systemInstruction: { parts: [{ text: STRATEGY_SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: `Kunde: ${activeClientName}, ${companySize}, ${selectedCategory?.label}\nWeb: ${websiteUrl}\nInput: ${transcript}` }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { report: { type: "STRING" } } } }
      };
      const data = await callAI(payload);
      const json = JSON.parse(cleanJsonResponse(data.candidates[0].content.parts[0].text));
      setStrategyReport(json.report);
    } catch (e) { setAppError(e.message); }
    finally { setIsGeneratingStrategy(false); }
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
      const raw = data.candidates[0].content.parts[0].text;
      setSocialHooks(JSON.parse(cleanJsonResponse(raw)));
    } catch (e) { setAppError(e.message); }
    finally { setIsGeneratingHooks(false); }
  };

  const processAudio = async (blob) => {
    setIsTranscribing(true);
    const reader = new FileReader(); reader.readAsDataURL(blob);
    reader.onload = async () => {
      try {
        const payload = { contents: [{ parts: [{ text: "Transkribiere auf Deutsch." }, { inlineData: { mimeType: 'audio/mp3', data: reader.result.split(',')[1] } }] }] };
        const data = await callAI(payload);
        const text = data.candidates[0].content.parts[0].text;
        setTranscript(prev => prev ? prev + "\n\n" + text : text);
      } catch (e) { setAppError(e.message); }
      finally { setIsTranscribing(false); }
    };
  };

  // --- RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const update = () => { analyserRef.current.getByteFrequencyData(dataArray); setAudioLevel(dataArray.reduce((a,b)=>a+b)/dataArray.length); animationFrameRef.current = requestAnimationFrame(update); };
      update();
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => { processAudio(new Blob(audioChunksRef.current, { type: 'audio/mp3' })); stream.getTracks().forEach(t=>t.stop()); };
      mediaRecorderRef.current.start();
      setIsRecording(true); setIsPaused(false);
    } catch (e) { setAppError("Mikrofon Fehler"); }
  };

  const togglePause = () => {
      if(!mediaRecorderRef.current) return;
      if(!isPaused) { mediaRecorderRef.current.stop(); setIsPaused(true); }
      else { audioChunksRef.current = []; mediaRecorderRef.current.start(); setIsPaused(false); }
  };

  const stopRecording = () => {
      if(mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      setIsRecording(false); setIsPaused(false);
      if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if(audioContextRef.current) audioContextRef.current.close();
  };

  // --- RENDER ---
  const copyText = (t) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  
  // MAGIC LINK COPY FIX
  const [isMagicLink, setIsMagicLink] = useState(false);
  
  if (appMode === 'select') return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 text-[#2c233e]">
       <div className="text-center mb-16"><h1 className="text-5xl font-bold mb-2">Designstudio <span className="text-[#e32338]">Fuchs</span></h1><p className="opacity-60 text-sm tracking-widest uppercase">Brand Intelligence</p></div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
         <button onClick={()=>setAppMode('client')} className="bg-white/70 p-12 rounded-[3rem] hover:bg-white transition-all shadow-xl"><User className="w-10 h-10 text-[#e32338] mx-auto mb-4"/><h2 className="text-2xl font-bold">Kunden-Portal</h2></button>
         <button onClick={()=>setAppMode('login')} className="bg-[#2c233e]/90 p-12 rounded-[3rem] hover:bg-[#2c233e] transition-all shadow-xl text-white"><Briefcase className="w-10 h-10 text-white mx-auto mb-4"/><h2 className="text-2xl font-bold">Agentur-Dashboard</h2></button>
       </div>
    </div>
  );

  if (appMode === 'login') return (
     <div className="min-h-screen bg-[#2c233e] flex items-center justify-center p-6">
        <form onSubmit={e=>{e.preventDefault(); if(pinInput===ADMIN_PIN) setIsAdminLoggedIn(true); else setLoginError(true);}} className="bg-white/10 p-12 rounded-[3rem] backdrop-blur-xl text-center text-white">
           <h2 className="text-2xl font-bold mb-8">ADMIN PIN</h2>
           <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-center text-2xl mb-4 outline-none"/>
           {isAdminLoggedIn ? setAppMode('agency') : loginError && <p className="text-[#e32338] mb-4">Falsch.</p>}
           <button type="submit" className="w-full bg-[#e32338] py-4 rounded-2xl font-bold">Login</button>
        </form>
     </div>
  );

  if (appMode === 'client') return (
     <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] p-6 text-[#2c233e]">
        {clientSubmitted ? <div className="flex flex-col items-center justify-center h-screen text-center"><div className="bg-white/60 p-16 rounded-[4rem] shadow-2xl"><Check className="w-16 h-16 text-[#e32338] mx-auto mb-6"/><h2 className="text-4xl font-bold mb-4">Danke!</h2><button onClick={()=>{setClientSubmitted(false); setAppMode('select');}} className="px-8 py-3 bg-[#2c233e] text-white rounded-full font-bold">Zurück</button></div></div> : (
          <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-4xl font-bold text-center mb-12">Deine Story.</h1>
            <div className="bg-white/40 border border-white/60 rounded-[3rem] p-8 shadow-xl mb-8 space-y-4">
               <div className="grid grid-cols-2 gap-4"><input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Name" className="bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none"/><input value={clientCompany} onChange={e=>setClientCompany(e.target.value)} placeholder="Firma" className="bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none"/></div>
               <div className="flex flex-wrap gap-2">{COMPANY_SIZES.map(s=><button key={s} onClick={()=>setCompanySize(s)} className={`px-3 py-2 rounded-lg text-xs border ${companySize===s?'bg-[#e32338] text-white':'bg-white/40'}`}>{s}</button>)}</div>
               <div className="grid grid-cols-2 gap-2">
                 {CATEGORIES.map(c=><button key={c.id} onClick={()=>setClientCategory(c.label)} className={`p-3 rounded-xl border text-left flex items-center gap-2 ${clientCategory===c.label?'bg-[#e32338] text-white':'bg-white/40'}`}><c.Icon className="w-4 h-4"/>{c.label}</button>)}
                 <button onClick={()=>setClientCategory("Nicht sicher / Sonstiges")} className={`p-3 rounded-xl border text-center text-xs ${clientCategory==="Nicht sicher / Sonstiges"?'bg-[#e32338] text-white':'bg-white/40'}`}>Ich weiß es nicht</button>
               </div>
               <div className="grid grid-cols-2 gap-4"><input value={clientWebsite} onChange={e=>setClientWebsite(e.target.value)} placeholder="Website URL" className="bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none"/><input value={clientSocial} onChange={e=>setClientSocial(e.target.value)} placeholder="Social Media" className="bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none"/></div>
            </div>
            <div className="bg-white/50 border border-white/60 rounded-[3rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/40 flex justify-center items-center gap-4">
                  {!isRecording ? <button onClick={startRecording} className="flex items-center gap-2 px-8 py-4 bg-[#e32338] text-white rounded-full font-bold shadow-lg"><Mic/> Aufnahme</button> : 
                  <div className="flex gap-2"><button onClick={togglePause} className={`px-6 py-4 rounded-full font-bold text-white ${isPaused ? 'bg-emerald-500' : 'bg-amber-500'}`}>{isPaused?<Play/>:<Pause/>}</button><button onClick={stopRecording} className="px-6 py-4 bg-[#2c233e] text-white rounded-full"><Square/></button></div>}
                  <div className="h-2 w-32 bg-white/30 rounded-full overflow-hidden ml-4"><div className="h-full bg-[#e32338] transition-all" style={{width:`${Math.min(100,audioLevel*2)}%`}}/></div>
               </div>
               {isTranscribing && <div className="p-4 text-center animate-pulse text-xs font-bold uppercase">Verarbeite Audio...</div>}
               <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Nachricht..." className="w-full bg-transparent p-8 text-lg min-h-[200px] outline-none resize-none"/>
               <div className="p-6 border-t border-white/40 flex justify-end"><button onClick={handleClientSubmit} disabled={isSending} className="bg-[#e32338] text-white px-8 py-3 rounded-full font-bold shadow-xl">{isSending?<Loader2 className="animate-spin"/>:'Absenden'}</button></div>
            </div>
          </div>
        )}
     </div>
  );

  // AGENCY DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
       <header className="px-8 h-20 flex items-center justify-between border-b border-white/20 bg-white/10 backdrop-blur-md sticky top-0 z-20">
          <span className="font-bold text-xl">Designstudio<span className="text-[#e32338]">Fuchs</span></span>
          <button onClick={()=>setAppMode('select')} className="text-xs font-bold opacity-50 hover:opacity-100 flex gap-2"><Lock className="w-4 h-4"/> Logout</button>
       </header>
       <main className="max-w-7xl mx-auto px-8 py-12 animate-in fade-in duration-700">
          {step === 1 && (
            <div className="mb-20">
               <h2 className="text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2 opacity-60"><Inbox className="w-4 h-4"/> Posteingang</h2>
               {activeClientName && <div className="mb-8 inline-flex items-center gap-3 bg-[#e32338] text-white px-8 py-4 rounded-full text-xs font-bold uppercase shadow-xl animate-in slide-in-from-left"><Sparkles className="w-4 h-4" /> Workspace: Daten von "{activeClientName}" aktiv <button onClick={() => { setActiveClientName(null); setTranscript(""); setWebsiteUrl(""); setSocialUrl(""); setCompanySize(""); setSelectedCategory(null); }} className="ml-4 hover:rotate-90 transition-transform"><Trash2 className="w-4 h-4" /></button></div>}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {submissions.map(sub => (
                   <div key={sub.id} className={`bg-white/60 p-8 rounded-[2.5rem] shadow-lg border border-white/60 hover:shadow-xl transition-all relative ${activeClientName === sub.name ? 'border-[#e32338] ring-2 ring-[#e32338]/20' : ''}`}>
                      <div className="flex justify-between mb-4"><span className="font-bold text-lg">{sub.name}</span><span className="text-[10px] bg-[#e32338]/10 text-[#e32338] px-2 py-1 rounded">{sub.category}</span></div>
                      <p className="text-sm italic opacity-60 line-clamp-3 mb-6">"{sub.text}"</p>
                      <button onClick={()=>loadSubmission(sub)} className="w-full py-3 bg-[#2c233e] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">Laden</button>
                   </div>
                 ))}
               </div>
               <div ref={categorySectionRef} className="mt-16 pt-16 border-t border-[#2c233e]/5">
                  <h1 className="text-4xl font-bold mb-8">Analyse Basis</h1>
                  <div className="grid grid-cols-2 gap-6">{CATEGORIES.map(c=><button key={c.id} onClick={()=>{setSelectedCategory(c); setStep(2);}} className={`p-8 rounded-[3rem] text-left transition-all ${selectedCategory?.id===c.id?'bg-[#2c233e] text-white':'bg-white/40 hover:bg-white'}`}><c.Icon className="w-8 h-8 mb-4"/><div className="font-bold text-xl">{c.label}</div></button>)}</div>
               </div>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-12">
               <div className="flex justify-between items-end">
                 <div><button onClick={()=>setStep(1)} className="flex items-center gap-2 text-xs font-bold opacity-50 mb-4 hover:opacity-100"><ChevronLeft className="w-4 h-4"/> Zurück</button><h2 className="text-4xl font-bold">Workspace.</h2></div>
                 <button onClick={generateDNA} disabled={!transcript} className="px-10 py-4 bg-[#e32338] text-white rounded-full font-bold uppercase text-xs shadow-xl hover:scale-105 transition-all">Analyse Starten</button>
               </div>
               {appError && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center">{appError}</div>}
               <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-8 bg-white/50 border border-white/60 rounded-[3rem] p-8 shadow-xl">
                     <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} className="w-full h-[500px] bg-transparent resize-none outline-none text-lg p-4" placeholder="Daten..."/>
                  </div>
                  <div className="col-span-4 bg-white/30 border border-white/60 rounded-[3rem] p-8">
                     <div className="text-xs font-bold uppercase opacity-50 mb-4">Client Info</div>
                     <div className="space-y-2 text-sm font-medium"><div>{activeClientName}</div><div>{companySize}</div><div>{selectedCategory?.label}</div></div>
                  </div>
               </div>
             </div>
          )}

          {step === 3 && <div className="h-[60vh] flex flex-col items-center justify-center"><div className="w-24 h-24 border-4 border-[#e32338]/20 border-t-[#e32338] rounded-full animate-spin mb-8"/><h2 className="text-3xl font-bold">Analysiere DNA...</h2></div>}

          {step === 4 && outputJson && (
             <div className="space-y-12">
               <div className="flex justify-between items-center">
                  <h1 className="text-4xl font-bold">DNA Extracted.</h1>
                  <button onClick={()=>{setStep(1); setOutputJson(null);}} className="px-8 py-3 bg-white text-[#2c233e] rounded-full text-xs font-bold uppercase shadow-lg">Neues Projekt</button>
               </div>

               {/* 1. BASE44 JSON EXPORT */}
               <div className="bg-[#2c233e] rounded-[3rem] p-10 shadow-2xl relative group">
                  <div className="absolute top-8 right-8 flex gap-4">
                     <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-2">Base44 JSON</span>
                     <button onClick={()=>copyText(JSON.stringify(outputJson, null, 2))} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20"><Copy className="w-4 h-4"/></button>
                  </div>
                  <pre className="text-white/80 font-mono text-xs overflow-auto max-h-[500px]">{JSON.stringify(outputJson, null, 2)}</pre>
               </div>

               {/* 2. FREYSTIL STRATEGIE REPORT */}
               <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[3rem] p-12 shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-2xl font-bold flex items-center gap-3"><FileText className="text-[#e32338]"/> Freystil Strategie Report</h3>
                     {!strategyReport && <button onClick={generateStrategy} disabled={isGeneratingStrategy} className="px-8 py-3 bg-[#e32338] text-white rounded-full text-xs font-bold uppercase shadow-lg flex items-center gap-2">{isGeneratingStrategy?<Loader2 className="animate-spin w-4 h-4"/>:<Sparkles className="w-4 h-4"/>} Generieren</button>}
                  </div>
                  {strategyReport && (
                    <div className="prose prose-lg text-[#2c233e] whitespace-pre-wrap bg-white p-10 rounded-[2rem] border border-white/60 shadow-sm relative">
                       <button onClick={()=>copyText(strategyReport)} className="absolute top-6 right-6 p-2 text-[#2c233e]/40 hover:text-[#e32338]"><Copy className="w-5 h-5"/></button>
                       {strategyReport}
                    </div>
                  )}
               </div>
             </div>
          )}
       </main>
       <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 6px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
       `}</style>
    </div>
  );
}
