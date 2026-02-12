import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
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
  onSnapshot, 
  query
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
  Share2
} from 'lucide-react';

// =================================================================
// 1. KONFIGURATION
// =================================================================

// A) FIREBASE CONFIG (Deine Daten)
const firebaseConfig = {
  apiKey: "AIzaSyCd9YnXbILct5RFgqqDCnvIODV5dVtKkmI",
  authDomain: "studio-fuchs.firebaseapp.com",
  projectId: "studio-fuchs",
  storageBucket: "studio-fuchs.firebasestorage.app",
  messagingSenderId: "743239245515",
  appId: "1:743239245515:web:b32ec9724c0dcc853b454e",
  measurementId: "G-SNL32ZC6S2"
};

// B) GOOGLE GEMINI API KEY (Dein Schlüssel)
const apiKey = "AIzaSyCNANgEIN8Y7HeJA-JGztQNKj2H-PJ3LLg"; 

// App ID für die Datenbank-Struktur
const appId = 'brand-dna-studio-fuchs-live';

// =================================================================
// SYSTEM START
// =================================================================

// Initialisierung (verhindert Mehrfach-Start)
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Fehler:", e);
}

const CATEGORIES = [
  {
    id: 1,
    label: "Local Service Business",
    icon: <Store className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Friseur / Barber", "Tattoo Studio", "Physio (lokal)", "Café / Restaurant"],
    typical_goals: ["Terminbuchungen", "Lokale Sichtbarkeit", "Google Bewertungen"]
  },
  {
    id: 2,
    label: "Medizin / Gesundheit / Pflege",
    icon: <HeartPulse className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Arztpraxis", "Zahnarzt", "Pflegedienst", "Therapiezentrum"],
    typical_goals: ["Vertrauen", "Aufklärung", "Patientengewinnung"]
  },
  {
    id: 3,
    label: "Handwerk / Produktion / E-Commerce",
    icon: <Wrench className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Kartenlabel", "Manufaktur", "Onlineshop", "DIY Brand"],
    typical_goals: ["Produktverkauf", "Markenaufbau", "Storytelling"]
  },
  {
    id: 4,
    label: "Personal Brand / Expert:in / Coaching",
    icon: <User className="w-8 h-8 mb-4 text-[#2c233e]/40 group-hover:text-[#e32338] transition-colors" />,
    examples: ["Coach", "Berater", "Speaker", "Trainer"],
    typical_goals: ["Autorität", "Leadgenerierung", "Community Aufbau"]
  }
];

const INTERVIEW_QUESTIONS = [
  { id: "brand_core", title: "Wer bist du?", text: "Erzähl kurz: Wer bist du und was machst du genau?" },
  { id: "target", title: "Deine Kunden", text: "Wer ist deine wichtigste Zielgruppe? Welches Problem löst du für sie?" },
  { id: "diff", title: "Dein Unterschied", text: "Was unterscheidet dich von anderen in deinem Bereich?" },
  { id: "offer", title: "Dein Angebot", text: "Was ist dein Hauptangebot aktuell? Welche Einstiegsangebote gibt es?" },
  { id: "goals", title: "Deine Ziele", text: "Was ist dein wichtigstes Ziel mit Social Media? (Anfragen, Verkäufe, Reichweite?)" },
  { id: "tone", title: "Dein Vibe", text: "Wie soll deine Marke wirken? Was passt GAR NICHT zu dir?" },
  { id: "content", title: "Deine Themen", text: "Welche Inhalte kannst du regelmäßig liefern? Gibt es feste Themen?" },
  { id: "proof", title: "Vertrauen", text: "Gibt es Referenzen, Kundenstimmen oder konkrete Beispiele?" }
];

const SYSTEM_INSTRUCTION = `
Du bist eine strategische Brand Intelligence & JSON Output Engine für eine deutsche Kreativagentur.
Analysiere den Rohtext und durchsuche URLs (Google Search Tool nutzen!).
Fasse Messaging, Conversion-Elemente und Fremdbild zusammen.
Integriere Web-Erkenntnisse in "inference_notes". KEINE neuen Felder!
OUTPUT: STRICT JSON ONLY.
`;

export default function App() {
  const [appMode, setAppMode] = useState('select'); 
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isMagicLink, setIsMagicLink] = useState(false);

  // Form States
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Client States
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [clientSocial, setClientSocial] = useState("");
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Agency States
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputJson, setOutputJson] = useState(null);
  const [socialHooks, setSocialHooks] = useState(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // 1. INITIALIZE AUTH & ROUTING
  useEffect(() => {
    // MAGIC LINK LOGIC: Check URL for ?view=client
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setAppMode('client');
      setIsMagicLink(true);
    }

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Authentifizierung fehlgeschlagen:", err);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH DATA
  useEffect(() => {
    if (!user || !db) return;
    const submissionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    const unsubscribe = onSnapshot(submissionsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => {
      if (appMode === 'agency') console.error("Firestore Error (normal for clients):", err);
    });
    return () => unsubscribe();
  }, [user, appMode]);

  // === HELPERS ===
  const copySimpleText = (text, callback) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { 
      document.execCommand('copy'); 
      if(callback) callback();
    } catch (err) {
      console.error("Copy failed", err);
      setError("Kopieren fehlgeschlagen.");
    }
    document.body.removeChild(textArea);
  };

  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP Error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(res => setTimeout(res, delays[i]));
      }
    }
  };

  const processAudio = async (file, targetSetter) => {
    if(apiKey.includes("EINFÜGEN")) { setError("API Key fehlt im Code!"); return; }
    
    setIsTranscribing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const payload = {
        contents: [{
          parts: [
            { text: "Transkribiere dieses Audio wortwörtlich auf Deutsch. Antworte nur mit dem Text." },
            { inlineData: { mimeType: file.type || 'audio/mp3', data: base64 } }
          ]
        }]
      };
      try {
        const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) targetSetter(prev => prev ? prev + "\n\n[🎙️ Audio]: " + text : "[🎙️ Audio]: " + text);
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

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // === ACTIONS ===
  const handleClientSubmit = async () => {
    if (!clientName.trim() || !transcript.trim()) {
      setError("Bitte fülle Name und Text/Audio aus.");
      return;
    }
    if (!user) {
      setError("Verbindung wird hergestellt...");
      return;
    }
    setIsSending(true);
    try {
      const submissionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
      await addDoc(submissionsRef, {
        name: clientName,
        company: clientCompany,
        website: clientWebsite,
        social: clientSocial,
        text: transcript,
        timestamp: Date.now()
      });
      setClientSubmitted(true);
    } catch (err) {
      setError("Fehler beim Senden. Bitte erneut versuchen.");
    } finally {
      setIsSending(false);
    }
  };

  const copyMagicLink = () => {
    const url = window.location.href.split('?')[0] + '?view=client';
    copySimpleText(url, () => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const loadFromInbox = (sub) => {
    setTranscript(sub.text);
    setWebsiteUrl(sub.website || "");
    setSocialUrl(sub.social || "");
    setStep(1); 
  };

  const generateDNA = async () => {
    if(apiKey.includes("EINFÜGEN")) { setError("API Key fehlt im Code!"); return; }
    setIsGenerating(true);
    setStep(3);
    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: [{ text: `Kategorie: ${selectedCategory.label}\nWebsite: ${websiteUrl}\nSocial: ${socialUrl}\nTranskript: ${transcript}` }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            story_core: { type: "STRING" }, story_dna: { type: "STRING" }, brand_voice_rules: { type: "STRING" },
            tone_tags: { type: "ARRAY", items: { type: "STRING" } }, no_go_tags: { type: "ARRAY", items: { type: "STRING" } },
            audiences: { type: "ARRAY", items: { type: "STRING" } }, goals_top3: { type: "ARRAY", items: { type: "STRING" } },
            content_themes: { type: "ARRAY", items: { type: "STRING" } }, content_formats: { type: "ARRAY", items: { type: "STRING" } },
            local_focus: { type: "STRING" }, proof_points: { type: "ARRAY", items: { type: "STRING" } },
            category: { type: "STRING" }, inference_notes: { type: "STRING" }
          },
          required: ["story_core", "story_dna", "brand_voice_rules", "tone_tags", "no_go_tags", "audiences", "goals_top3", "content_themes", "content_formats", "local_focus", "proof_points", "category", "inference_notes"]
        }
      }
    };
    try {
      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      setOutputJson(JSON.parse(res.candidates[0].content.parts[0].text));
      setStep(4);
    } catch (err) { setError("KI-Analyse fehlgeschlagen."); setStep(2); }
    finally { setIsGenerating(false); }
  };

  const generateHooks = async () => {
    if(apiKey.includes("EINFÜGEN")) { setError("API Key fehlt im Code!"); return; }
    setIsGeneratingHooks(true);
    const payload = {
      systemInstruction: { parts: [{ text: "Du bist Social Media Experte. Erstelle 5 virale Hooks." }] },
      contents: [{ parts: [{ text: JSON.stringify(outputJson) }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "STRING" } } }
    };
    try {
      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      setSocialHooks(JSON.parse(res.candidates[0].content.parts[0].text));
    } catch (err) { console.error(err); }
    finally { setIsGeneratingHooks(false); }
  };

  // === RENDERERS ===

  if (appMode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 selection:bg-[#e32338]/20">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-6xl font-bold text-[#2c233e] tracking-tight mb-3">Designstudio <span className="text-[#e32338]">Fuchs</span></h1>
          <p className="text-[#2c233e]/60 font-medium text-lg tracking-wide uppercase text-[12px]">Brand Intelligence System</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          
          {/* MAGIC LINK BUTTON */}
          <button onClick={copyMagicLink} className="group bg-white hover:bg-white/90 border-2 border-transparent hover:border-[#e32338]/10 p-12 rounded-[3rem] text-center shadow-lg transition-all duration-300 relative">
            <div className="w-24 h-24 rounded-full bg-[#e32338]/5 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><Share2 className="w-10 h-10 text-[#e32338]" /></div>
            <h2 className="text-3xl font-bold text-[#2c233e] mb-3">Kunden-Link</h2>
            <p className="text-[#2c233e]/60 font-medium">{linkCopied ? "Link kopiert!" : "Link für Kunden kopieren"}</p>
            {linkCopied && <div className="absolute top-8 right-8 bg-[#e32338] text-white p-2 rounded-full shadow-lg"><Check className="w-4 h-4" /></div>}
          </button>

          {/* AGENCY ENTER */}
          <button onClick={() => setAppMode('agency')} className="group bg-[#2c233e] hover:bg-[#1a1625] border-2 border-transparent p-12 rounded-[3rem] text-center shadow-2xl transition-all duration-300 relative">
            {submissions.length > 0 && <div className="absolute top-8 right-8 bg-[#e32338] text-white text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-bounce border-4 border-[#2c233e]">{submissions.length}</div>}
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><Briefcase className="w-10 h-10 text-white" /></div>
            <h2 className="text-3xl font-bold text-white mb-3">Agentur-Dashboard</h2>
            <p className="text-white/40 font-medium">Posteingang & Analyse.</p>
          </button>
        </div>
      </div>
    );
  }

  // === CLIENT MODE (DIREKTEINSTIEG) ===
  if (appMode === 'client') {
    if (clientSubmitted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/60 backdrop-blur-xl p-16 rounded-[4rem] max-w-xl shadow-2xl animate-in zoom-in-95 duration-500 border border-white/60">
            <div className="w-24 h-24 rounded-full bg-[#e32338]/10 flex items-center justify-center mx-auto mb-8"><Check className="w-12 h-12 text-[#e32338]" /></div>
            <h2 className="text-4xl font-bold text-[#2c233e] mb-6">Erfolgreich!</h2>
            <p className="text-xl text-[#2c233e]/70 leading-relaxed mb-10">Vielen Dank. Deine Daten wurden sicher an das Designstudio Fuchs übermittelt.</p>
            {!isMagicLink && <button onClick={() => { setAppMode('select'); setClientSubmitted(false); }} className="px-10 py-4 bg-[#2c233e] text-white font-bold rounded-full shadow-lg hover:bg-black transition-all text-sm uppercase tracking-widest">Zurück</button>}
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
        <header className="border-b border-white/30 bg-white/20 backdrop-blur-md sticky top-0 z-20 px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="font-bold text-2xl tracking-tight">Designstudio</span><span className="font-bold text-2xl tracking-tight text-[#e32338]">Fuchs</span></div>
          {!isMagicLink && <button onClick={() => setAppMode('select')} className="text-[11px] font-bold text-[#2c233e]/50 hover:text-[#e32338] uppercase tracking-widest transition-colors px-6 py-2 bg-white/40 rounded-full">Abbrechen</button>}
        </header>
        <main className="max-w-6xl mx-auto px-8 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight mb-6">Lass uns deine <span className="text-[#e32338]">Marke</span> stärken.</h1>
            <p className="text-xl text-[#2c233e]/60 font-medium">Füll deine Daten aus – getippt oder als Sprachnachricht.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] p-10 shadow-xl">
                <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 text-[#e32338] flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Inspiration für dich</h3>
                <div className="space-y-6">
                  {INTERVIEW_QUESTIONS.map(q => (
                    <div key={q.id} className="border-l-4 border-[#2c233e]/5 pl-6 hover:border-[#e32338] transition-colors"><p className="font-bold text-[#2c233e] mb-1">{q.title}</p><p className="text-sm opacity-50 leading-relaxed">{q.text}</p></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-8">
              {error && <div className="p-4 bg-[#e32338]/10 border border-[#e32338]/20 rounded-2xl text-[#e32338] text-sm font-bold">⚠️ {error}</div>}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] p-8 shadow-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Dein Name *" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#e32338]/20 transition-all font-medium" />
                  <input type="text" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Dein Unternehmen" className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#e32338]/20 transition-all font-medium" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2c233e]/5 pt-4">
                  <div className="relative"><Globe className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 opacity-30" /><input type="url" value={clientWebsite} onChange={e => setClientWebsite(e.target.value)} placeholder="Website URL" className="w-full bg-white/50 border border-white/60 rounded-2xl pl-12 pr-6 py-4 outline-none text-sm transition-all" /></div>
                  <div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold opacity-30 text-xs">@</span><input type="text" value={clientSocial} onChange={e => setClientSocial(e.target.value)} placeholder="Instagram Handle" className="w-full bg-white/50 border border-white/60 rounded-2xl pl-10 pr-6 py-4 outline-none text-sm transition-all" /></div>
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/40 bg-white/30 flex justify-center gap-6">
                  {!isRecording ? (
                    <button onClick={startRecording} className="flex items-center gap-3 px-10 py-5 bg-[#e32338] text-white rounded-full font-bold uppercase text-[11px] tracking-widest hover:bg-[#c91d31] transition-all shadow-lg"><Mic className="w-5 h-5" /> Aufnahme starten</button>
                  ) : (
                    <button onClick={stopRecording} className="flex items-center gap-3 px-10 py-5 bg-[#2c233e] text-white rounded-full font-bold uppercase text-[11px] tracking-widest animate-pulse shadow-lg"><Square className="w-5 h-5 fill-white" /> Stoppen</button>
                  )}
                  <label className="flex items-center gap-3 px-10 py-5 bg-white text-[#2c233e] rounded-full font-bold uppercase text-[11px] tracking-widest shadow-md cursor-pointer hover:shadow-xl transition-all"><UploadCloud className="w-5 h-5" /> Datei Upload<input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && processAudio(e.target.files[0], setTranscript)} /></label>
                </div>
                <div className="relative">
                  {isTranscribing && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-10"><Loader2 className="w-12 h-12 text-[#e32338] animate-spin mb-4" /><p className="text-lg font-bold text-[#2c233e] uppercase tracking-widest">Audio wird abgetippt...</p></div>}
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Dein Text erscheint hier..." className="w-full bg-transparent p-12 text-xl font-medium min-h-[400px] outline-none resize-none leading-relaxed placeholder:text-[#2c233e]/20" />
                </div>
                <div className="p-8 border-t border-white/40 bg-white/40 flex justify-end">
                  <button onClick={handleClientSubmit} disabled={!transcript.trim() || !clientName.trim() || isSending} className="flex items-center gap-3 bg-[#e32338] hover:bg-[#c91d31] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl transition-all disabled:opacity-30">{isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> An Agentur senden</>}</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // AGENCY MODE (DASHBOARD)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edd5e5] via-[#dcd2e6] to-[#c4c0e6] text-[#2c233e] font-sans selection:bg-[#e32338]/20">
      <header className="border-b border-white/30 bg-white/20 backdrop-blur-md sticky top-0 z-20 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="font-bold text-2xl tracking-tight">Designstudio</span><span className="font-bold text-2xl tracking-tight text-[#e32338]">Fuchs</span></div>
        <div className="flex items-center gap-10">
          <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest opacity-40">
            <span className={step >= 1 ? 'opacity-100 text-[#e32338]' : ''}>01 Kategorie</span>
            <span className={step >= 2 ? 'opacity-100 text-[#e32338]' : ''}>02 Analyse</span>
            <span className={step >= 4 ? 'opacity-100 text-[#e32338]' : ''}>03 Export</span>
          </div>
          <button onClick={() => setAppMode('select')} className="px-6 py-2 bg-[#2c233e] text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md">Menü</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {step === 1 && (
          <div className="mb-20">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-8 text-[#e32338] flex items-center gap-3"><Inbox className="w-5 h-5" /> Live Posteingang ({submissions.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.length === 0 ? (
                <div className="col-span-full border-2 border-dashed border-[#2c233e]/10 rounded-[3rem] p-16 text-center">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-20" /><p className="text-xl font-bold opacity-30">Keine Daten vorhanden.</p>
                </div>
              ) : (
                submissions.map(sub => (
                  <div key={sub.id} className="bg-white/60 backdrop-blur-md border border-white/60 p-10 rounded-[3rem] shadow-lg hover:shadow-2xl transition-all group relative">
                    <div className="flex justify-between items-start mb-6">
                      <div><h3 className="text-2xl font-bold tracking-tight text-[#2c233e] mb-1">{sub.name}</h3><p className="text-sm font-medium opacity-50">{sub.company || "Einzelperson"}</p></div>
                      <div className="px-3 py-1 bg-[#e32338]/10 text-[#e32338] rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {new Date(sub.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <p className="text-sm font-medium opacity-60 line-clamp-3 mb-10 italic">"{sub.text}"</p>
                    <button onClick={() => loadFromInbox(sub)} className="w-full py-5 bg-[#2c233e] text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 group-hover:bg-black transition-all">Laden <ArrowRight className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-20">
              <h1 className="text-5xl font-bold mb-16 tracking-tight">Analyse <span className="text-[#e32338]">Basis.</span></h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="group bg-white/40 border border-white/60 p-12 rounded-[3.5rem] text-left hover:bg-white shadow-xl hover:-translate-y-2 transition-all duration-300">
                    <div className="flex justify-between items-start">{cat.icon} <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all text-[#e32338]" /></div>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">{cat.label}</h3>
                    <p className="text-sm font-medium opacity-50 mb-8">{cat.examples.join(" • ")}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2, 3, 4 (Agency Workflow) - Unchanged Layout */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[11px] font-bold opacity-50 hover:opacity-100 hover:text-[#e32338] bg-white/40 px-6 py-3 rounded-full mb-6 transition-all"><ChevronLeft className="w-4 h-4" /> Zurück</button>
                <h2 className="text-4xl font-bold tracking-tight">Workspace & <span className="text-[#e32338]">Intelligence.</span></h2>
              </div>
              <button onClick={generateDNA} disabled={!transcript.trim() || isTranscribing} className="w-full md:w-auto px-12 py-5 bg-[#e32338] text-white rounded-full font-bold uppercase text-[12px] tracking-widest shadow-2xl hover:bg-[#c91d31] transition-all disabled:opacity-30">DNA Analyse starten</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[3rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl">
                  <div className="relative"><Globe className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 opacity-30" /><input type="text" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website URL" className="w-full bg-white/40 border border-[#2c233e]/5 rounded-2xl pl-14 pr-6 py-5 font-medium outline-none focus:ring-2 focus:ring-[#e32338]/20 transition-all shadow-sm" /></div>
                  <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold opacity-30 text-xs">@</span><input type="text" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="Social Media" className="w-full bg-white/40 border border-[#2c233e]/5 rounded-2xl pl-12 pr-6 py-5 font-medium outline-none focus:ring-2 focus:ring-[#e32338]/20 transition-all shadow-sm" /></div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                  {isTranscribing && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-10"><Loader2 className="w-12 h-12 text-[#e32338] animate-spin mb-6" /><p className="text-xl font-bold text-[#2c233e] tracking-widest uppercase">Wird abgetippt...</p></div>}
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Interview-Daten einfügen..." className="w-full bg-transparent p-16 text-2xl font-medium min-h-[500px] outline-none resize-none leading-relaxed placeholder:text-[#2c233e]/10" />
                </div>
              </div>
              <div className="lg:col-span-4 h-fit sticky top-32 bg-white/30 border border-white/60 rounded-[3rem] p-10 shadow-lg">
                <h3 className="text-[11px] font-bold uppercase tracking-widest mb-10 text-[#e32338] flex items-center gap-3"><Sparkles className="w-5 h-5" /> Agentur-Briefing</h3>
                <div className="space-y-8">
                  {INTERVIEW_QUESTIONS.map(q => (
                    <div key={q.id} className="border-l-2 border-[#e32338]/10 pl-6"><p className="text-sm font-bold text-[#2c233e] mb-1">{q.title}</p><p className="text-[13px] opacity-40 leading-snug">{q.text}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="h-[70vh] flex flex-col items-center justify-center animate-in fade-in duration-700 text-center">
            <div className="relative mb-12"><div className="w-32 h-32 border-4 border-[#e32338]/10 border-t-[#e32338] rounded-full animate-spin"></div><Sparkles className="w-8 h-8 text-[#e32338] absolute inset-0 m-auto animate-pulse" /></div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Analyse aktiv.</h2>
            <p className="text-xl text-[#2c233e]/50 font-medium max-w-md mx-auto leading-relaxed">Verbindung mit Web-Intelligence läuft...</p>
          </div>
        )}

        {step === 4 && outputJson && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div><h1 className="text-5xl font-bold tracking-tight mb-2">DNA <span className="text-[#e32338]">Extracted.</span></h1><p className="text-xl text-[#2c233e]/50 font-medium tracking-wide uppercase text-[12px]">Ready for Base44 Import</p></div>
                <div className="flex gap-4">
                  <button onClick={() => { setStep(1); setOutputJson(null); setSocialHooks(null); setTranscript(""); }} className="px-10 py-5 bg-white text-[#2c233e] rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl hover:text-[#e32338] transition-all">Posteingang</button>
                  <button onClick={() => { copySimpleText(JSON.stringify(outputJson, null, 2), () => { setCopied(true); setTimeout(()=>setCopied(false), 2000); }); }} className="px-10 py-5 bg-[#e32338] text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-2xl hover:bg-[#c91d31] transition-all flex items-center gap-3">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? 'Kopiert!' : 'JSON Kopieren'}
                  </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-[#2c233e] border border-white/10 rounded-[3.5rem] p-2 shadow-2xl overflow-hidden">
                 <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-widest text-white/40">JSON Schema</span><FileJson className="w-5 h-5 text-white/30" /></div>
                 <pre className="p-12 overflow-x-auto text-sm font-mono text-white/80 max-h-[700px] leading-relaxed"><code>{JSON.stringify(outputJson, null, 2)}</code></pre>
               </div>
               <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3.5rem] p-12 shadow-2xl space-y-10 h-fit">
                 <div><h3 className="text-3xl font-bold tracking-tight mb-4">Content <span className="text-[#e32338]">Inkubator.</span></h3><p className="text-lg text-[#2c233e]/50 font-medium">Strategische Hooks.</p></div>
                 {!socialHooks ? (
                    <button onClick={generateHooks} disabled={isGeneratingHooks} className="w-full py-6 bg-white text-[#2c233e] rounded-[2rem] font-bold uppercase text-[12px] tracking-widest shadow-lg hover:text-[#e32338] hover:shadow-2xl transition-all flex items-center justify-center gap-4">{isGeneratingHooks ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 text-[#e32338]" />} 5 Hooks generieren</button>
                 ) : (
                    <div className="space-y-6">
                      {socialHooks.map((hook, idx) => (
                        <div key={idx} className="p-8 bg-white border border-white/40 rounded-[2.5rem] group hover:border-[#e32338]/20 hover:shadow-xl transition-all flex justify-between items-start gap-6">
                          <div className="flex gap-6 items-start">
                            <span className="w-8 h-8 rounded-full bg-[#2c233e]/5 flex items-center justify-center text-[12px] font-bold text-[#e32338] shrink-0 shadow-inner">{idx + 1}</span>
                            <p className="text-[18px] font-medium leading-relaxed italic">"{hook}"</p>
                          </div>
                          <button onClick={() => { copySimpleText(hook); }} className="opacity-0 group-hover:opacity-100 p-3 bg-[#e32338]/5 rounded-xl transition-all text-[#e32338]"><Copy className="w-4 h-4" /></button>
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
