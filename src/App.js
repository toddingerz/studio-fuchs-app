import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { 
  Activity, 
  Send, 
  Lock, 
  Database, 
  Cpu, 
  FileText, 
  Target, 
  Zap, 
  ChevronRight, 
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Search
} from 'lucide-react';

// --- CONFIGURATION ---
// BITTE HIER DEINE FIREBASE CONFIG EINFÜGEN
// Kopiere das Objekt aus deiner Firebase Console -> Project Settings -> General -> Web App
const firebaseConfig = JSON.parse(__firebase_config);

// --- GLOBAL VARIABLES & INIT ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Use the global appId provided by the environment, fallback if needed
const appId = typeof __app_id !== 'undefined' ? __app_id : 'brand-dna-studio-fuchs-live';

const PIN_CODE = "1234"; // Simple Admin PIN
const COLLECTION_NAME = "submissions";

// --- GEMINI API HELPER ---
// Uses the direct API for the preview environment.
const callGemini = async (prompt, systemInstruction = "") => {
  const apiKey = ""; // API Key injected by environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Keine Antwort generiert.";
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};

// --- PROMPTS ---
const PROMPTS = {
  clientImmediate: (data) => `
    Analysiere diese Brand-Daten und erstelle eine KURZE, wertvolle Sofort-Ausgabe für den Kunden.
    Daten: Name: ${data.name}, Firma: ${data.company}, Branche: ${data.category}, Text: ${data.transcript}.
    
    Output Format (Markdown):
    ## 🧬 Mini Brand Pulse
    **1. Positionierungspotenzial:** [Ein Satz]
    **2. Content-Richtung:** [Zwei konkrete Themen-Ideen]
    **3. Strategischer Impuls:** [Ein "Aha"-Moment oder Tipp]
    
    Halte es ermutigend, professionell und kurz.
  `,
  brandDNA: (data) => `
    Extrahiere die tiefere Brand DNA aus diesen Daten für Base44.
    Input: ${JSON.stringify(data)}
    
    Output MUSS valides JSON sein (ohne Markdown Code Blocks):
    {
      "core_understanding": "...",
      "differentiation_factor": "...",
      "customer_reality": "...",
      "communication_boundaries": ["...", "..."],
      "trust_signals": ["...", "..."],
      "context_factors": "...",
      "tone_of_voice": "..."
    }
    Interpretieren, verdichten, Behavioral Brand Logic anwenden.
  `,
  contentHooks: (data) => `
    Erstelle 5 virale, psychologisch fundierte Content Hooks basierend auf dieser Brand DNA.
    Branche: ${data.category}. Kontext: ${data.transcript}.
    
    Output Format: Liste mit 5 Bulletpoints. Konkret, "Scroll-Stopping".
  `,
  salesAnalysis: (data) => `
    Führe eine strategische Sales Intelligence Analyse durch.
    Input: ${data.transcript} | ${data.website}
    
    Analysiere:
    - Positionierungs-Lücken
    - Conversion-Hebel
    - Emotionale Trigger im Text
    
    Output Format: Kurzer, knallharter Strategie-Report (Markdown). Keine Floskeln.
  `
};

// --- COMPONENTS ---

// 1. Debug Panel
const DebugPanel = ({ user, dbStatus, logs }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-green-500 text-xs p-2 font-mono border-t border-green-900 z-50 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
    <div className="flex gap-4">
      <span><span className="text-gray-500">AUTH:</span> {user ? 'ANON_USER' : 'OFFLINE'}</span>
      <span><span className="text-gray-500">UID:</span> {user?.uid?.slice(0, 8)}...</span>
      <span><span className="text-gray-500">DB:</span> {dbStatus}</span>
    </div>
    <div className="flex gap-4">
       <span><span className="text-gray-500">LAST LOG:</span> {logs[0] || 'Ready'}</span>
    </div>
  </div>
);

// 2. Client Portal
const ClientPortal = ({ onSubmit, loading, result }) => {
  const [formData, setFormData] = useState({
    name: '', company: '', teamSize: '1-5', category: '', website: '', social: '', transcript: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-8 animate-fade-in">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500/20 rounded-full text-green-400">
              <CheckCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Daten empfangen</h2>
              <p className="text-slate-400">Deine erste KI-Analyse ist bereit.</p>
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 prose prose-invert prose-p:text-slate-300">
             <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm mb-4">Wir melden uns in Kürze mit den Deep-Dive Ergebnissen.</p>
            <button onClick={() => window.location.reload()} className="text-indigo-400 hover:text-indigo-300 text-sm">
              Neue Anfrage starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 mb-2">
          Brand DNA Collector
        </h1>
        <p className="text-slate-400">Designstudio Fuchs Intelligence System</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input required name="name" placeholder="Dein Name" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" onChange={handleChange} />
          <input required name="company" placeholder="Firma" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" onChange={handleChange} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <select name="teamSize" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" onChange={handleChange}>
            <option value="1">Solo</option>
            <option value="2-10">2-10 Mitarbeiter</option>
            <option value="11-50">11-50 Mitarbeiter</option>
            <option value="50+">50+ Mitarbeiter</option>
          </select>
          <input required name="category" placeholder="Branche / Kategorie" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" onChange={handleChange} />
        </div>

        <input name="website" placeholder="Website URL" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" onChange={handleChange} />
        <input name="social" placeholder="Wichtigster Social Link" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" onChange={handleChange} />

        <div className="relative">
          <textarea required name="transcript" rows="6" placeholder="Erzähl uns von deiner Marke: Mission, Probleme, Ziele... (Oder Transcript Paste)" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none" onChange={handleChange}></textarea>
          <div className="absolute bottom-3 right-3 text-slate-500 text-xs flex items-center gap-1">
            <Sparkles size={12} /> AI Ready
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="animate-pulse">Analysiere Daten...</span>
          ) : (
            <>
              Absenden & Analyse erhalten <ChevronRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// 3. Admin Dashboard
const AdminDashboard = ({ submissions, onViewDetail }) => (
  <div className="max-w-6xl mx-auto">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <LayoutDashboard className="text-indigo-400" /> 
        Submissions Inbox
      </h2>
      <div className="text-slate-400 text-sm">
        {submissions.length} Einträge
      </div>
    </div>

    <div className="grid gap-4">
      {submissions.length === 0 && (
        <div className="text-center py-20 text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
          Keine Einreichungen gefunden.
        </div>
      )}
      {submissions.map((sub) => (
        <div key={sub.id} onClick={() => onViewDetail(sub)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${sub.dna_json ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                {sub.company?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">{sub.company}</h3>
                <p className="text-slate-400 text-sm">{sub.name} • {sub.category}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-slate-500 font-mono">
                {sub.timestamp?.toDate().toLocaleDateString('de-DE')}
              </span>
              {sub.dna_json && (
                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20 flex items-center gap-1">
                  <Activity size={10} /> DNA Analyzed
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 4. Admin Detail View
const AdminDetail = ({ submission, onBack, onAction, actionLoading }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const cleanJSON = (text) => {
      if(!text) return null;
      try {
          return JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
          return text;
      }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
          <ChevronRight className="rotate-180" size={16} /> Zurück
        </button>
        <div className="flex gap-2">
            <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">ID: {submission.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
        {/* Left: Data Source */}
        <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Source Data</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-slate-500 text-xs mb-1">Company</label>
              <div className="text-white font-medium text-lg">{submission.company}</div>
              <div className="text-indigo-400 text-sm">{submission.website}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-slate-500 text-xs mb-1">Contact</label>
                  <div className="text-slate-200 text-sm">{submission.name}</div>
               </div>
               <div>
                  <label className="block text-slate-500 text-xs mb-1">Size</label>
                  <div className="text-slate-200 text-sm">{submission.teamSize}</div>
               </div>
            </div>

            <div>
              <label className="block text-slate-500 text-xs mb-1">Transcript / Input</label>
              <div className="bg-slate-800/50 p-3 rounded-lg text-slate-300 text-sm leading-relaxed border border-slate-700/50">
                {submission.transcript}
              </div>
            </div>
            
             <div>
              <label className="block text-slate-500 text-xs mb-1">Initial Client Output</label>
              <div className="p-3 rounded-lg text-slate-400 text-xs leading-relaxed border border-slate-800 italic">
                {submission.clientAnalysis?.slice(0, 150)}...
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Engine */}
        <div className="col-span-8 flex flex-col gap-4 h-full">
          {/* Action Bar */}
          <div className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-xl flex gap-2 shrink-0">
             <button 
                onClick={() => setActiveTab('dna')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'dna' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400'}`}
             >
               <Cpu size={16} /> Brand DNA
             </button>
             <button 
                onClick={() => setActiveTab('hooks')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'hooks' ? 'bg-pink-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400'}`}
             >
               <Zap size={16} /> Content Hooks
             </button>
             <button 
                onClick={() => setActiveTab('sales')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'sales' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400'}`}
             >
               <Target size={16} /> Sales Intel
             </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto relative custom-scrollbar">
            
            {activeTab === 'dna' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Brand DNA Extraction</h3>
                    <button 
                        onClick={() => onAction('dna_json', PROMPTS.brandDNA(submission))}
                        disabled={actionLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? <Activity className="animate-spin" size={16} /> : <Sparkles size={16} />} 
                        {submission.dna_json ? 'Regenerate DNA' : 'Generate DNA'}
                    </button>
                </div>
                {submission.dna_json ? (
                   <pre className="bg-black/50 p-4 rounded-xl border border-indigo-900/30 text-indigo-300 font-mono text-sm overflow-x-auto">
                      {cleanJSON(submission.dna_json)}
                   </pre>
                ) : (
                   <div className="h-40 flex items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl">No DNA extracted yet.</div>
                )}
              </div>
            )}

            {activeTab === 'hooks' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Viral Content Hooks</h3>
                    <button 
                        onClick={() => onAction('hooks', PROMPTS.contentHooks(submission))}
                        disabled={actionLoading}
                        className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                         {actionLoading ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />} 
                         Generate Hooks
                    </button>
                </div>
                {submission.hooks ? (
                    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700 prose prose-invert max-w-none prose-li:text-pink-100 prose-strong:text-pink-400">
                        <div dangerouslySetInnerHTML={{ __html: submission.hooks.replace(/\n/g, '<br/>') }} />
                    </div>
                ) : (
                   <div className="h-40 flex items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl">No Hooks generated yet.</div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Strategic Sales Analysis</h3>
                    <button 
                        onClick={() => onAction('sales_analysis', PROMPTS.salesAnalysis(submission))}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? <Activity className="animate-spin" size={16} /> : <Target size={16} />} 
                        Run Analysis
                    </button>
                </div>
                 {submission.sales_analysis ? (
                    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700 prose prose-invert max-w-none prose-headings:text-emerald-400">
                        <div dangerouslySetInnerHTML={{ __html: submission.sales_analysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-200">$1</strong>').replace(/### (.*)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>') }} />
                    </div>
                ) : (
                   <div className="h-40 flex items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl">No Analysis run yet.</div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('client'); // client, admin-login, admin-dashboard, admin-detail
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [dbStatus, setDbStatus] = useState('Init...');
  const [submissions, setSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Logger
  const log = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 4)]);

  // Auth & Init
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (e) {
        log(`Auth Error: ${e.message}`);
      }
    };
    init();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setDbStatus(u ? 'Connected' : 'Disconnected');
      log(u ? `User logged in: ${u.uid}` : 'User logged out');
    });
    return () => unsubscribe();
  }, []);

  // Fetch Submissions (Admin Only)
  useEffect(() => {
    if (view !== 'admin-dashboard' || !user) return;
    
    // Using global artifacts path structure
    const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME),
        orderBy('timestamp', 'desc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(subs);
        log(`Fetched ${subs.length} submissions`);
    }, (error) => {
        log(`Fetch Error: ${error.message}`);
        setDbStatus('Error');
    });

    return () => unsub();
  }, [view, user]);

  // Handlers
  const handleClientSubmit = async (data) => {
    if (!user) { alert("System connecting... please wait."); return; }
    setLoading(true);
    log("Processing client submission...");

    try {
      // 1. Generate Immediate Value (Mini Strategy)
      const miniStrategy = await callGemini(PROMPTS.clientImmediate(data));
      
      // 2. Save to Firestore
      // Adhering to artifacts path rule
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME), {
        ...data,
        clientAnalysis: miniStrategy,
        timestamp: serverTimestamp(),
        status: 'new'
      });
      
      log(`Saved ID: ${docRef.id}`);
      setSubmissionResult(miniStrategy);
    } catch (e) {
      log(`Error: ${e.message}`);
      alert("Fehler bei der Verarbeitung. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pin === PIN_CODE) {
      setView('admin-dashboard');
      setPin('');
    } else {
      alert("Access Denied");
    }
  };

  const handleAdminAction = async (field, prompt) => {
    if (!currentSubmission) return;
    setLoading(true);
    log(`Running AI Action: ${field}...`);
    
    try {
        let result = await callGemini(prompt);
        
        // Sanitize JSON if needed
        if (field === 'dna_json') {
            result = result.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        // Update Doc
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, currentSubmission.id);
        await updateDoc(docRef, {
            [field]: result
        });

        // Update local state immediately for better UX
        setCurrentSubmission(prev => ({ ...prev, [field]: result }));
        log(`Action ${field} completed.`);
    } catch (e) {
        log(`AI Action Error: ${e.message}`);
        alert("AI Processing Failed");
    } finally {
        setLoading(false);
    }
  };

  // View Routing
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
        {/* Navigation Bar */}
        <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div 
                    className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 cursor-pointer"
                    onClick={() => { setView('client'); setSubmissionResult(null); }}
                >
                    FUCHS<span className="font-light text-indigo-400">.INTEL</span>
                </div>
                <div className="flex gap-4">
                    {view === 'client' && (
                        <button onClick={() => setView('admin-login')} className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-semibold">
                            Partner Access
                        </button>
                    )}
                    {(view === 'admin-dashboard' || view === 'admin-detail') && (
                        <button onClick={() => setView('client')} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                            <LogOut size={12} /> Exit
                        </button>
                    )}
                </div>
            </div>
        </nav>

        {/* Main Content */}
        <main className="p-6 pb-20">
            {view === 'client' && (
                <ClientPortal onSubmit={handleClientSubmit} loading={loading} result={submissionResult} />
            )}

            {view === 'admin-login' && (
                <div className="flex items-center justify-center h-[60vh]">
                    <form onSubmit={handleAdminLogin} className="w-full max-w-xs text-center">
                        <Lock className="mx-auto mb-4 text-slate-600" size={32} />
                        <h2 className="text-xl font-medium text-white mb-6">Security Check</h2>
                        <input 
                            type="password" 
                            autoFocus
                            placeholder="PIN Entry" 
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center text-white focus:ring-2 focus:ring-indigo-500 outline-none tracking-[1em] text-lg mb-4"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-colors text-sm font-medium">
                            Verify Identity
                        </button>
                    </form>
                </div>
            )}

            {view === 'admin-dashboard' && (
                <AdminDashboard 
                    submissions={submissions} 
                    onViewDetail={(sub) => { setCurrentSubmission(sub); setView('admin-detail'); }} 
                />
            )}

            {view === 'admin-detail' && currentSubmission && (
                <AdminDetail 
                    submission={currentSubmission} 
                    onBack={() => setView('admin-dashboard')}
                    onAction={handleAdminAction}
                    actionLoading={loading}
                />
            )}
        </main>

        <DebugPanel user={user} dbStatus={dbStatus} logs={logs} />
        
        {/* Style injection for Custom Scrollbar & Animations */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
          
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
    </div>
  );
}
