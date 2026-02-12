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
  Unlock
} from 'lucide-react';

// =================================================================
// 1. KONFIGURATION
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

// =================================================================
// DEIN ADMIN-CODE (Ändere die Zahl zwischen den Anführungszeichen)
// =================================================================
const ADMIN_PIN = "1704"; 

// =================================================================
// SYSTEM START
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

const CATEGORIES = [
  {
    id: 1,
    label: "Local Service Business",
    icon: <Store className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Friseur / Barber", "Tattoo Studio", "Physio (lokal)", "Café / Restaurant"]
  },
  {
    id: 2,
    label: "Medizin / Gesundheit / Pflege",
    icon: <HeartPulse className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Arztpraxis", "Zahnarzt", "Pflegedienst", "Therapiezentrum"]
  },
  {
    id: 3,
    label: "Handwerk / Produktion / E-Commerce",
    icon: <Wrench className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Kartenlabel", "Manufaktur", "Onlineshop", "DIY Brand"]
  },
  {
    id: 4,
    label: "Personal Brand / Expert:in / Coaching",
    icon: <User className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Coach", "Berater", "Speaker", "Trainer"]
  }
];

const INTERVIEW_QUESTIONS = [
  { id: "brand_core", title: "Wer bist du?", text: "Erzähl kurz: Wer bist du und was machst du genau?" },
  { id: "target", title: "Deine Kunden", text: "Wer ist deine wichtigste Zielgruppe?" },
  { id: "diff", title: "Dein Unterschied", text: "Was unterscheidet dich von anderen?" },
  { id: "offer", title: "Dein Angebot", text: "Was ist dein Hauptangebot aktuell?" },
  { id: "goals", title: "Deine Ziele", text: "Was ist dein wichtigstes Ziel mit Social Media?" },
  { id: "tone", title: "Dein Vibe", text: "Wie soll deine Marke wirken?" },
  { id: "content", title: "Deine Themen", text: "Welche Inhalte kannst du regelmäßig liefern?" },
  { id: "proof", title: "Vertrauen", text: "Referenzen, Kundenstimmen oder Beispiele?" }
];

const SYSTEM_INSTRUCTION = `Du bist eine strategische Brand DNA Engine für Studio Fuchs. Analysiere Rohtext und URLs. Nutze das Google Search Tool für Kontext. Gib NUR JSON aus.`;

export default function App() {
  const [appMode, setAppMode] = useState('select'); 
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isMagicLink, setIsMagicLink] = useState(false);
  
  // Login & Admin States
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
  const [error, setError] = useState(null);

  // Client States
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [clientSocial, setClientSocial] = useState("");
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const categoriesRef = useRef(null); 

  // 1. INITIALIZE AUTH & ROUTING
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setAppMode('client');
      setIsMagicLink(true);
    }
    if (!auth) return;
    signInAnonymously(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // 2. FETCH DATA (NUR FÜR ADMIN)
  useEffect(() => {
    if (!db || !user || !isAdminLoggedIn) return;
    const submissionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    return onSnapshot(submissionsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    });
  }, [user, isAdminLoggedIn]);

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminLoggedIn(true);
      setAppMode('agency');
      setLoginError(false);
    } else {
      setLoginError(true);
      setPinInput("");
    }
  };

  const copySimpleText = (text, callback) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try { document.execCommand('copy'); if(callback) callback(); } catch (err) {}
    document.body.removeChild(textArea);
  };

  const loadFromInbox = (sub) => {
    setTranscript(sub.text);
    setWebsiteUrl(sub.website || "");
    setSocialUrl(sub.social || "");
    setTimeout(() => {
      categoriesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const processAudio = async (file, targetSetter) => {
    setIsTranscribing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Transkribiere Audio wortwörtlich auf Deutsch." }, { inlineData: { mimeType: file.type || 'audio/mp3', data: base64 } }] }] })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) targetSetter(prev => prev ? prev + "\n\n" + text : text);
      } catch (err) { setError("Transkription fehlgeschlagen."); }
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
    } catch (err) { setError("Mikrofon-Zugriff verweigert."); }
  };

  const handleClientSubmit = async () => {
    if (!clientName.trim() || !transcript.trim()) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        name: clientName, company: clientCompany, website: clientWebsite, social: clientSocial, text: transcript, timestamp: Date.now()
      });
      setClientSubmitted(true);
    } catch (err) { setError("Senden fehlgeschlagen."); }
    finally { setIsSending(false); }
  };

  const generateDNA = async () => {
    setIsGenerating(true); setStep(3);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ parts: [{ text: `Kategorie: ${selectedCategory.label}\nWebsite: ${websiteUrl}\nSocial: ${socialUrl}\nText: ${transcript}` }] }],
          tools: [{ google_search: {} }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      setOutputJson(JSON.parse(data.candidates[0].content.parts[0].text));
      setStep(4);
    } catch (err) { setError("KI Analyse fehlgeschlagen."); setStep(2); }
    finally { setIsGenerating(false); }
  };

  const generateHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Du bist Social Media Experte. Erstelle 5 virale Hooks basierend auf dieser DNA." }] },
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

  if (appMode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 selection:bg-[#e32338]/20">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-6xl font-bold text-[#2c233e] mb-3">Designstudio <span className="text-[#e32338]">Fuchs</span></h1>
          <p className="text-[#2c233e]/60 font-medium uppercase text-[12px] tracking-widest">Brand Intelligence System</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
          <button onClick={() => setAppMode('client')} className="group bg-white p-12 rounded-[3rem] text-center shadow-lg transition-all hover:scale-[1.02] border border-transparent hover:border-[#e32338]/20">
            <div className="w-20 h-20 rounded-full bg-[#e32338]/5 flex items-center justify-center mx-auto mb-6 transition-colors group-hover:bg-[#e32338]/10"><User className="w-8 h-8 text-[#e32338]" /></div>
            <h2 className="text-2xl font-bold text-[#2c233e]">Kunden-Portal</h2>
            <p className="text-sm opacity-50 mt-2">Marken-Check starten</p>
          </button>
          <button onClick={() => setAppMode('login')} className="group bg-[#2c233e] p-12 rounded-[3rem] text-center shadow-2xl transition-all hover:scale-[1.02]">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 transition-colors group-hover:bg-white/10"><Lock className="w-8 h-8 text-white" /></div>
            <h2 className="text-2xl font-bold text-white">Agentur-Login</h2>
            <p className="text-sm text-white/40 mt-2">Interner Bereich</p>
          </button>
        </div>
      </div>
    );
  }

  if (appMode === 'login') {
    return (
      <div className="min-h-screen bg-[#2c233e] flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white/10 p-12 rounded-[3rem] w-full max-w-md backdrop-blur-xl border border-white/10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8"><Unlock className="w-8 h-8 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-8">Admin Zugang</h2>
          <input 
            type="password" 
            value={pinInput} 
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN" 
            autoFocus
            className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-white text-center text-2xl tracking-[1em] outline-none focus:border-[#e32338] transition-all mb-4"
          />
          {loginError && <p className="text-[#e32338] text-sm font-bold mb-6">Falsche PIN!</p>}
          <div className="flex gap-4">
            <button type="button" onClick={() => setAppMode('select')} className="flex-1 py-4 text-white/40 font-bold uppercase text-[11px] tracking-widest hover:text-white">Abbrechen</button>
            <button type="submit" className="flex-1 bg-[#e32338] text-white py-4 rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-lg hover:bg-[#c91d31] transition-all">Einloggen</button>
          </div>
        </form>
      </div>
    );
  }

  if (appMode === 'client') {
    if (clientSubmitted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] to-[#c4c0e6] flex flex-col items-center justify-center p-6">
          <div className="bg-white p-16 rounded-[4rem] shadow-2xl text-center max-w-lg animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><Check className="w-10 h-10" /></div>
            <h2 className="text-3xl font-bold mb-4">Gesendet!</h2>
            <p className="opacity-60 mb-8 font-medium">Deine Daten wurden sicher an Studio Fuchs übermittelt.</p>
            <button onClick={() => setAppMode('select')} className="px-10 py-4 bg-[#2c233e] text-white rounded-full font-bold shadow-lg hover:bg-black transition-all">Fertig</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white text-[#2c233e]">
        <header className="p-8 flex justify-between items-center border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
           <div className="font-bold text-xl tracking-tight">Studio <span className="text-[#e32338]">Fuchs</span></div>
           <button onClick={() => setAppMode('select')} className="text-xs uppercase font-bold opacity-30 hover:opacity-100 transition-opacity">Abbrechen</button>
        </header>
        <main className="max-w-4xl mx-auto p-8 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-bold mb-12 tracking-tight">Deine <span className="text-[#e32338]">Marken-DNA</span>.</h1>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Dein Name *" value={clientName} onChange={e => setClientName(e.target.value)} className="p-5 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-[#e32338]/20 transition-all border border-transparent focus:border-[#e32338]/10" />
              <input type="text" placeholder="Unternehmen" value={clientCompany} onChange={e => setClientCompany(e.target.value)} className="p-5 bg-gray-50 rounded-2xl outline-none transition-all border border-transparent focus:border-[#e32338]/10" />
            </div>
            <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100">
              <div className="flex justify-center gap-4 mb-8">
                <button onClick={isRecording ? () => setIsRecording(false) : startRecording} className={`flex items-center gap-3 px-10 py-5 rounded-full font-bold transition-all shadow-md ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#2c233e] text-white hover:bg-black'}`}>
                  {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-5 h-5" />} {isRecording ? 'Stopp' : 'Audio Aufnahme'}
                </button>
              </div>
              <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Erzähl uns deine Geschichte oder nutze die Aufnahme..." className="w-full bg-transparent min-h-[300px] outline-none text-xl leading-relaxed resize-none" />
            </div>
            {error && <p className="text-[#e32338] text-sm font-bold bg-[#e32338]/5 p-4 rounded-xl">⚠️ {error}</p>}
            <button onClick={handleClientSubmit} disabled={isSending || !transcript || !clientName} className="w-full py-6 bg-[#e32338] text-white rounded-3xl font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-[#c91d31] transition-all disabled:opacity-30">
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Daten absenden</>}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- AGENCY DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#f8f7fa] text-[#2c233e]">
      <header className="bg-[#2c233e] p-6 text-white flex justify-between items-center px-10 sticky top-0 z-10 shadow-lg">
        <div className="font-bold text-xl tracking-tight">Studio <span className="text-[#e32338]">Fuchs</span> Admin</div>
        <button onClick={() => { setIsAdminLoggedIn(false); setAppMode('select'); }} className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2"><Lock className="w-3 h-3" /> Ausloggen</button>
      </header>
      
      <main className="max-w-7xl mx-auto p-10 animate-in fade-in duration-700">
        {step === 1 && (
          <div className="space-y-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#e32338] mb-6 flex items-center gap-2"><Inbox className="w-4 h-4" /> Posteingang ({submissions.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.length === 0 ? <p className="opacity-30 italic p-10 bg-white rounded-3xl border border-dashed text-center w-full col-span-full">Keine neuen Einsendungen...</p> : submissions.map(sub => (
                  <div key={sub.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-[#e32338]/10 group">
                    <h3 className="text-xl font-bold mb-1">{sub.name}</h3>
                    <p className="text-sm opacity-40 mb-6">{sub.company || 'Einzelperson'}</p>
                    <p className="text-sm line-clamp-2 italic mb-8 opacity-60">"{sub.text}"</p>
                    <button onClick={() => loadFromInbox(sub)} className="w-full py-4 bg-[#2c233e] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">Laden <ArrowRight className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            
            <div ref={categoriesRef} className="pt-12 border-t">
              <h2 className="text-4xl font-bold mb-12 tracking-tight">Analyse <span className="text-[#e32338]">Workspace</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="bg-white p-10 rounded-[3rem] text-left hover:shadow-2xl transition-all border border-transparent hover:border-[#e32338]/20 group flex flex-col items-start shadow-sm">
                    <div className="group-hover:scale-110 transition-transform">{cat.icon}</div>
                    <h3 className="text-2xl font-bold group-hover:text-[#e32338] transition-colors">{cat.label}</h3>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-bold opacity-30 mb-8 hover:opacity-100 transition-opacity"><ChevronLeft className="w-4 h-4" /> Zurück</button>
             <div className="flex justify-between items-end mb-12 flex-wrap gap-6">
                <h2 className="text-4xl font-bold tracking-tight">Marken <span className="text-[#e32338]">Details</span></h2>
                <button onClick={generateDNA} className="px-10 py-5 bg-[#e32338] text-white rounded-full font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-[#c91d31] transition-all">Analyse starten</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Website URL" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="p-5 bg-white rounded-2xl shadow-sm outline-none focus:ring-2 ring-[#e32338]/10" />
                    <input type="text" placeholder="Social Handle" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} className="p-5 bg-white rounded-2xl shadow-sm outline-none focus:ring-2 ring-[#e32338]/10" />
                  </div>
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)} className="w-full min-h-[500px] p-10 bg-white rounded-[3.5rem] shadow-sm outline-none text-xl leading-relaxed resize-none" />
                </div>
                <div className="bg-white/50 p-10 rounded-[3.5rem] h-fit space-y-8 border border-white">
                   <h4 className="font-bold text-[#e32338] uppercase text-[10px] tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4" /> Leitfaden</h4>
                   {INTERVIEW_QUESTIONS.map(q => <div key={q.id} className="border-l-2 pl-4 border-gray-200 py-1 hover:border-[#e32338] transition-colors"><p className="text-sm font-bold opacity-40">{q.title}</p></div>)}
                </div>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in">
            <Loader2 className="w-12 h-12 text-[#e32338] animate-spin mb-6" />
            <h2 className="text-3xl font-bold tracking-tight">Generiere Marken-DNA...</h2>
          </div>
        )}

        {step === 4 && outputJson && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-center flex-wrap gap-8">
                <h2 className="text-4xl font-bold tracking-tight">KI <span className="text-[#e32338]">Extrakt</span></h2>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="px-8 py-4 bg-white rounded-full font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Abbrechen</button>
                  <button onClick={() => { copySimpleText(JSON.stringify(outputJson, null, 2), () => setCopied(true)); setTimeout(()=>setCopied(false), 2000); }} className="px-8 py-4 bg-[#e32338] text-white rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-[#c91d31] transition-all">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Kopiert!' : 'JSON Kopieren'}
                  </button>
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#2c233e] p-10 rounded-[3rem] text-white/80 font-mono text-[11px] overflow-auto max-h-[600px] shadow-2xl border border-white/5">
                  <pre>{JSON.stringify(outputJson, null, 2)}</pre>
                </div>
                <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-gray-100">
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">Social Media <span className="text-[#e32338]">Hooks</span> <Sparkles className="w-5 h-5 text-[#e32338]" /></h3>
                  {!socialHooks ? (
                    <button onClick={generateHooks} disabled={isGeneratingHooks} className="w-full py-10 border-2 border-dashed border-gray-200 rounded-[2.5rem] font-bold opacity-40 hover:opacity-100 hover:border-[#e32338] hover:text-[#e32338] transition-all flex flex-col items-center gap-4">
                      {isGeneratingHooks ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                      {isGeneratingHooks ? 'Hooks werden erstellt...' : '5 KI Hooks generieren'}
                    </button>
                  ) : (
                    <div className="space-y-6">
                      {socialHooks.map((h, i) => (
                        <div key={i} className="p-8 bg-gray-50 rounded-[2.5rem] italic font-medium leading-relaxed group relative hover:bg-gray-100 transition-colors">
                          <p className="pr-10">"{h}"</p>
                          <button onClick={() => copySimpleText(h)} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-xl shadow-sm text-[#e32338]"><Copy className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
