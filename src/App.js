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
  ChevronRight, 
  ChevronLeft, 
  Copy, 
  Check, 
  Loader2, 
  FileJson, 
  Store, 
  HeartPulse, 
  Wrench, 
  User,
  Sparkles,
  Lightbulb,
  Globe,
  Mic,
  Send,
  Briefcase,
  Inbox,
  ArrowRight,
  Square,
  UploadCloud,
  Share2,
  Lock,
  Unlock,
  MousePointerClick
} from 'lucide-react';

// =================================================================
// 1. KONFIGURATION (DEINE LIVE-DATEN)
// =================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCd9YnXbILct5RFgqqDCnvIODV5dVtKkmI",
  authDomain: "studio-fuchs.firebaseapp.com",
  projectId: "studio-fuchs",
  storageBucket: "studio-fuchs.firebasestorage.app",
  messagingSenderId: "743239245515",
  appId: "1:743239245515:web:b32ec9724c0dcc853b454e",
  measurementId: "G-SNL32ZC6S2"
};

const apiKey = "AIzaSyCNANgEIN8Y7HeJA-JGztQNKj2H-PJ3LLg"; 
const appId = 'brand-dna-studio-fuchs-live';
const ADMIN_PIN = "1704"; 

// =================================================================
// SYSTEM INITIALISIERUNG
// =================================================================

let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (e) {
  console.error("Firebase Init Fehler:", e);
}

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// =================================================================
// DATEN-STRUKTUREN
// =================================================================

const CATEGORIES = [
  {
    id: 1,
    label: "Local Service Business",
    icon: <Store className="w-10 h-10 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Friseur / Barber", "Tattoo Studio", "Physio (lokal)", "Café / Restaurant"]
  },
  {
    id: 2,
    label: "Medizin / Gesundheit / Pflege",
    icon: <HeartPulse className="w-10 h-10 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Arztpraxis", "Zahnarzt", "Pflegedienst", "Therapiezentrum"]
  },
  {
    id: 3,
    label: "Handwerk / Produktion / E-Commerce",
    icon: <Wrench className="w-10 h-10 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Kartenlabel", "Manufaktur", "Onlineshop", "DIY Brand"]
  },
  {
    id: 4,
    label: "Personal Brand / Expert:in / Coaching",
    icon: <User className="w-10 h-10 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Coach", "Berater", "Speaker", "Trainer"]
  }
];

const INTERVIEW_QUESTIONS = [
  { id: "brand_core", title: "Wer bist du?", text: "Erzähl kurz: Wer bist du und was machst du genau?" },
  { id: "target", title: "Deine Kunden", text: "Wer ist deine wichtigste Zielgruppe? Welches Problem löst du?" },
  { id: "diff", title: "Dein Unterschied", text: "Was unterscheidet dich von anderen in deinem Bereich?" },
  { id: "offer", title: "Dein Angebot", text: "Was ist dein Hauptangebot aktuell?" },
  { id: "goals", title: "Deine Ziele", text: "Was ist dein wichtigstes Ziel mit Social Media?" },
  { id: "tone", title: "Dein Vibe", text: "Wie soll deine Marke wirken? Was passt GAR NICHT zu dir?" },
  { id: "content", title: "Deine Themen", text: "Welche Inhalte kannst du regelmäßig liefern?" },
  { id: "proof", title: "Vertrauen", text: "Gibt es Referenzen, Kundenstimmen oder Beispiele?" }
];

const SYSTEM_INSTRUCTION = `Du bist eine strategische Brand DNA Engine für Studio Fuchs. Analysiere Rohtext und URLs. Nutze Google Search für Web-Intelligence. Gib NUR JSON aus.`;

// =================================================================
// HAUPTKOMPONENTE
// =================================================================

export default function App() {
  const [appMode, setAppMode] = useState('select'); 
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isMagicLink, setIsMagicLink] = useState(false);
  
  // Auth & Admin States
  const [pinInput, setPinInput] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Agency Workflow States
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputJson, setOutputJson] = useState(null);
  const [socialHooks, setSocialHooks] = useState(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Client Portal States
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [clientSocial, setClientSocial] = useState("");
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 1. INITIALISIERUNG & MAGIC LINK CHECK
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setAppMode('client');
      setIsMagicLink(true);
    }
    if (!auth) return;
    signInAnonymously(auth).catch(err => console.error(err));
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // 2. LIVE-POSTEINGANG SYNC
  useEffect(() => {
    if (!db || !user || !isAdminLoggedIn) return;
    const submissionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    return onSnapshot(submissionsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    });
  }, [user, isAdminLoggedIn]);

  // --- HELPERS ---
  const copySimpleText = (text, callback) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
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

  const processAudio = async (file, targetSetter) => {
    setIsTranscribing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch(`/api/gemini`, {
          method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  model: "gemini-2.5-flash-preview-09-2025",
  contents: [{
    parts: [
      { text: "Transkribiere dieses Audio wortwörtlich auf Deutsch. Antworte nur mit dem Text." },
      { inlineData: { mimeType: file.type || 'audio/mp3', data: base64 } }
    ]
  }]
})
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) targetSetter(prev => prev ? prev + "\n\n[🎙️ Audio]: " + text : "[🎙️ Audio]: " + text);
      } catch (err) { console.error(err); }
      finally { setIsTranscribing(false); }
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        processAudio(blob, setTranscript);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const handleClientSubmit = async () => {
    if (!clientName.trim() || !transcript.trim()) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        name: clientName, 
        company: clientCompany, 
        website: clientWebsite,
        social: clientSocial,
        text: transcript, 
        timestamp: Date.now()
      });
      setClientSubmitted(true);
    } catch (err) { console.error(err); }
    finally { setIsSending(false); }
  };

  const loadFromInbox = (sub) => {
    setTranscript(sub.text);
    setWebsiteUrl(sub.website || "");
    setSocialUrl(sub.social || "");
    setStep(1); 
  };

  const generateDNA = async () => {
    setIsGenerating(true); setStep(3);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ parts: [{ text: `Kategorie: ${selectedCategory.label}\nWebsite: ${websiteUrl}\nSocial: ${socialUrl}\nTranskript: ${transcript}` }] }],
          tools: [{ google_search: {} }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      setOutputJson(JSON.parse(data.candidates[0].content.parts[0].text));
      setStep(4);
    } catch (err) { setStep(2); }
    finally { setIsGenerating(false); }
  };

  const generateHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Erstelle 5 Social Media Hooks." }] },
          contents: [{ parts: [{ text: JSON.stringify(outputJson) }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      setSocialHooks(JSON.parse(data.candidates[0].content.parts[0].text));
    } catch (err) { console.error(err); }
    finally { setIsGeneratingHooks(false); }
  };

  // --- RENDERING ---

  // 1. START SCREEN (Lavendel-Verlauf + 2 Große Karten)
  if (appMode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-6xl font-bold text-[#2c233e] tracking-tight mb-3">Designstudio <span className="text-[#e32338]">Fuchs</span></h1>
          <p className="text-[#2c233e]/60 font-medium text-lg tracking-wide uppercase text-[12px]">Brand Intelligence System</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <button onClick={() => setAppMode('client')} className="group bg-white/70 backdrop-blur-md hover:bg-white border-2 border-transparent hover:border-[#e32338]/10 p-16 rounded-[4rem] text-center shadow-xl transition-all duration-300">
            <div className="w-24 h-24 rounded-full bg-[#e32338]/5 flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:scale-110 transition-transform"><User className="w-10 h-10 text-[#e32338]" /></div>
            <h2 className="text-3xl font-bold text-[#2c233e] mb-3">Kunden-Portal</h2>
            <p className="text-[#2c233e]/60 font-medium">Der einfache Weg für Kunden, Sprachnachrichten oder Texte einzureichen.</p>
          </button>

          <button onClick={() => setAppMode('login')} className="group bg-[#2c233e]/90 backdrop-blur-md hover:bg-[#2c233e] border-2 border-transparent p-16 rounded-[4rem] text-center shadow-2xl transition-all duration-300">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:scale-110 transition-transform"><Briefcase className="w-10 h-10 text-white" /></div>
            <h2 className="text-3xl font-bold text-white mb-3">Agentur-Dashboard</h2>
            <p className="text-white/40 font-medium">Das Analyse-Tool mit Base44 Export und KI Web-Intelligence.</p>
          </button>
        </div>
      </div>
    );
  }

  // 2. LOGIN (PIN-SPERRE)
  if (appMode === 'login') {
    return (
      <div className="min-h-screen bg-[#2c233e] flex items-center justify-center p-6">
        <form onSubmit={(e) => { e.preventDefault(); if(pinInput === ADMIN_PIN) setIsAdminLoggedIn(true); else setLoginError(true); }} className="bg-white/10 p-12 rounded-[3rem] w-full max-w-md backdrop-blur-xl border border-white/10 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8"><Unlock className="w-8 h-8 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">Admin Zugang</h2>
          <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="PIN" className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white text-center text-3xl tracking-[1em] outline-none mb-4" />
          {isAdminLoggedIn ? setAppMode('agency') : loginError && <p className="text-[#e32338] font-bold mb-4">PIN falsch!</p>}
          <div className="flex gap-4">
            <button type="button" onClick={() => setAppMode('select')} className="flex-1 text-white/40 font-bold uppercase text-xs">Abbruch</button>
            <button type="submit" className="flex-1 bg-[#e32338] text-white py-4 rounded-2xl font-bold uppercase text-xs">Login</button>
          </div>
        </form>
      </div>
    );
  }

  // 3. KUNDEN PORTAL
  if (appMode === 'client') {
    if (clientSubmitted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/60 backdrop-blur-xl p-16 rounded-[4rem] max-w-xl shadow-2xl border border-white/60">
            <div className="w-24 h-24 rounded-full bg-[#e32338]/10 flex items-center justify-center mx-auto mb-8"><Check className="w-12 h-12 text-[#e32338]" /></div>
            <h2 className="text-4xl font-bold text-[#2c233e] mb-6">Erfolgreich!</h2>
            <p className="text-xl text-[#2c233e]/70 leading-relaxed mb-10">Vielen Dank. Deine Daten wurden sicher an das Designstudio Fuchs übermittelt.</p>
            {!isMagicLink && <button onClick={() => { setAppMode('select'); setClientSubmitted(false); }} className="px-10 py-4 bg-[#2c233e] text-white font-bold rounded-full shadow-lg text-sm uppercase tracking-widest">Zurück</button>}
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
        <header className="border-b border-white/30 bg-white/20 backdrop-blur-md sticky top-0 z-20 px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="font-bold text-2xl tracking-tight">Designstudio</span><span className="font-bold text-2xl tracking-tight text-[#e32338]">Fuchs</span></div>
          {!isMagicLink && <button onClick={() => setAppMode('select')} className="text-[11px] font-bold text-[#2c233e]/50 hover:text-[#e32338] uppercase tracking-widest px-6 py-2 bg-white/40 rounded-full">Abbrechen</button>}
        </header>
        <main className="max-w-6xl mx-auto px-8 py-16 animate-in fade-in duration-700">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold tracking-tight mb-6">Lass uns deine <span className="text-[#e32338]">Geschichte</span> erzählen.</h1>
            <p className="text-xl opacity-60 font-medium">Tippe deine Antworten ein oder nutze die Sprachaufnahme.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] p-10 shadow-xl">
                <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 text-[#e32338] flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Leitfragen</h3>
                <div className="space-y-6">
                  {INTERVIEW_QUESTIONS.map(q => (
                    <div key={q.id} className="border-l-4 border-[#2c233e]/5 pl-6 hover:border-[#e32338] transition-colors"><p className="font-bold mb-1">{q.title}</p><p className="text-sm opacity-50">{q.text}</p></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white/40 border border-white/60 rounded-[3rem] p-8 shadow-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Dein Name *" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium" />
                  <input type="text" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Unternehmen" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none font-medium" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2c233e]/5 pt-4">
                  <input type="url" value={clientWebsite} onChange={e => setClientWebsite(e.target.value)} placeholder="Website URL" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none text-sm transition-all" />
                  <input type="text" value={clientSocial} onChange={e => setClientSocial(e.target.value)} placeholder="Instagram Handle" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none text-sm transition-all" />
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/40 flex justify-center gap-6">
                  {!isRecording ? (
                    <button onClick={startRecording} className="flex items-center gap-3 px-10 py-5 bg-[#e32338] text-white rounded-full font-bold uppercase text-[11px] tracking-widest shadow-lg"><Mic className="w-5 h-5" /> Aufnahme starten</button>
                  ) : (
                    <button onClick={() => mediaRecorderRef.current.stop()} className="flex items-center gap-3 px-10 py-5 bg-[#2c233e] text-white rounded-full font-bold uppercase text-[11px] tracking-widest animate-pulse shadow-lg"><Square className="w-5 h-5 fill-white" /> Stoppen</button>
                  )}
                  <label className="flex items-center gap-3 px-10 py-5 bg-white text-[#2c233e] rounded-full font-bold uppercase text-[11px] tracking-widest shadow-md cursor-pointer"><UploadCloud className="w-5 h-5" /> Upload<input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && processAudio(e.target.files[0], setTranscript)} /></label>
                </div>
                {isTranscribing && <div className="p-4 bg-white/50 text-center animate-pulse"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Audio wird abgetippt...</div>}
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Deine Nachricht..." className="w-full bg-transparent p-12 text-xl font-medium min-h-[400px] outline-none resize-none leading-relaxed" />
                <div className="p-8 border-t border-white/40 flex justify-end">
                  <button onClick={handleClientSubmit} disabled={isSending || !transcript || !clientName} className="bg-[#e32338] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl disabled:opacity-30">
                    {isSending ? <Loader2 className="animate-spin" /> : "An Agentur senden"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 4. AGENCY DASHBOARD (Mit Posteingang)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
      <header className="border-b border-white/30 bg-white/20 backdrop-blur-md sticky top-0 z-20 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="font-bold text-2xl tracking-tight">Designstudio</span><span className="font-bold text-2xl tracking-tight text-[#e32338]">Fuchs</span></div>
        <div className="flex items-center gap-8">
           <button onClick={copyMagicLink} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#e32338] bg-white px-6 py-2 rounded-full shadow-sm">{linkCopied ? "Kopiert!" : "Kunden-Link"}</button>
           <button onClick={() => { setIsAdminLoggedIn(false); setAppMode('select'); }} className="text-[11px] font-bold opacity-30 hover:opacity-100 flex items-center gap-2"><Lock className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 animate-in fade-in duration-700">
        
        {/* POSTEINGANG */}
        {step === 1 && (
          <div className="mb-20">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-8 text-[#e32338] flex items-center gap-3"><Inbox className="w-5 h-5" /> Live Posteingang ({submissions.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.length === 0 ? <div className="col-span-full border-2 border-dashed border-[#2c233e]/10 rounded-[3rem] p-16 text-center opacity-30 font-bold">Warte auf Kundendaten...</div> : submissions.map(sub => (
                <div key={sub.id} className="bg-white/60 backdrop-blur-md border border-white/60 p-10 rounded-[3rem] shadow-lg hover:shadow-2xl transition-all">
                  <h3 className="text-2xl font-bold mb-1">{sub.name}</h3>
                  <p className="text-sm opacity-50 mb-6">{sub.company || "Einzelperson"}</p>
                  <p className="text-sm italic opacity-60 line-clamp-3 mb-8">"{sub.text}"</p>
                  <button onClick={() => loadFromInbox(sub)} className="w-full py-5 bg-[#2c233e] text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3">Laden <ArrowRight className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="mt-20">
              <h1 className="text-5xl font-bold mb-16 tracking-tight">Analyse <span className="text-[#e32338]">Basis.</span></h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="group bg-white/40 border border-white/60 p-12 rounded-[3.5rem] text-left hover:bg-white shadow-xl hover:-translate-y-2 transition-all duration-300">
                    <div className="flex justify-between items-start">{cat.icon} <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all text-[#e32338]" /></div>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">{cat.label}</h3>
                    <p className="text-sm font-medium opacity-50">{cat.examples.join(" • ")}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-end mb-12">
               <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[11px] font-bold opacity-50 hover:text-[#e32338] bg-white/40 px-6 py-3 rounded-full transition-all"><ChevronLeft className="w-4 h-4" /> Zurück</button>
               <button onClick={generateDNA} disabled={!transcript || isTranscribing} className="px-12 py-5 bg-[#e32338] text-white rounded-full font-bold uppercase text-[12px] tracking-widest shadow-2xl">DNA Analyse starten</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-8 space-y-8">
                 <div className="bg-white/50 border border-white/60 rounded-[3rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl">
                   <input type="text" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website URL" className="bg-white/40 border border-[#2c233e]/5 rounded-2xl px-6 py-5 outline-none" />
                   <input type="text" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="Social Media" className="bg-white/40 border border-[#2c233e]/5 rounded-2xl px-6 py-5 outline-none" />
                 </div>
                 <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Text einfügen..." className="bg-white/60 w-full min-h-[500px] p-16 rounded-[3.5rem] outline-none text-2xl leading-relaxed resize-none" />
               </div>
               <div className="lg:col-span-4 bg-white/30 border border-white/60 rounded-[3rem] p-10 h-fit">
                 <h3 className="text-[11px] font-bold uppercase tracking-widest mb-10 text-[#e32338]">Briefing Fragen</h3>
                 <div className="space-y-6 opacity-40 text-sm">
                   {INTERVIEW_QUESTIONS.map(q => <div key={q.id} className="border-l-2 pl-4 border-[#2c233e]/10 py-1 font-bold">{q.title}</div>)}
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* LOADING */}
        {step === 3 && (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center">
            <div className="relative mb-12"><div className="w-32 h-32 border-4 border-[#e32338]/10 border-t-[#e32338] rounded-full animate-spin"></div><Sparkles className="w-8 h-8 text-[#e32338] absolute inset-0 m-auto animate-pulse" /></div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Analyse aktiv.</h2>
            <p className="text-xl opacity-40">Verbindung mit Web-Intelligence läuft...</p>
          </div>
        )}

        {/* OUTPUT */}
        {step === 4 && outputJson && (
          <div className="animate-in slide-in-from-bottom-4 duration-700 space-y-12">
             <div className="flex justify-between items-center">
                <h1 className="text-5xl font-bold tracking-tight">DNA <span className="text-[#e32338]">Extracted.</span></h1>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="px-10 py-5 bg-white text-[#2c233e] rounded-full text-[11px] font-bold uppercase shadow-xl">Posteingang</button>
                  <button onClick={() => { copySimpleText(JSON.stringify(outputJson, null, 2), () => setCopied(true)); setTimeout(()=>setCopied(false), 2000); }} className="px-10 py-5 bg-[#e32338] text-white rounded-full text-[11px] font-bold uppercase shadow-2xl flex items-center gap-3">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? 'Kopiert!' : 'JSON Kopieren'}
                  </button>
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-[#2c233e] border border-white/10 rounded-[3.5rem] p-10 shadow-2xl overflow-auto max-h-[700px]">
                 <pre className="text-white/80 font-mono text-sm leading-relaxed"><code>{JSON.stringify(outputJson, null, 2)}</code></pre>
               </div>
               <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3.5rem] p-12 shadow-2xl h-fit">
                 <h3 className="text-3xl font-bold mb-10">Content <span className="text-[#e32338]">Inkubator.</span></h3>
                 {!socialHooks ? <button onClick={generateHooks} disabled={isGeneratingHooks} className="w-full py-6 bg-white text-[#2c233e] rounded-[2rem] font-bold uppercase text-[12px] shadow-lg hover:text-[#e32338] transition-all flex items-center justify-center gap-4">{isGeneratingHooks ? <Loader2 className="animate-spin" /> : <Sparkles />} 5 Hooks generieren</button> : <div className="space-y-6">{socialHooks.map((h, i) => <div key={i} className="p-8 bg-white border border-white/40 rounded-[2.5rem] italic font-medium relative group hover:bg-[#e32338]/5 transition-colors">{h}<button onClick={() => copySimpleText(h)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[#e32338]"><Copy className="w-4 h-4" /></button></div>)}</div>}
               </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
