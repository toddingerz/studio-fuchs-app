import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase'; 
import { 
  Activity, Lock, Cpu, Target, Zap, ChevronRight, CheckCircle, 
  LayoutDashboard, LogOut
} from 'lucide-react';

// --- KONSTANTEN ---
const APP_ID = 'brand-dna-studio-fuchs-live';
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/submissions`;
const PIN_CODE = "1234";

// --- PROMPTS ---
const PROMPTS = {
  clientImmediate: (data) => `
    Analysiere: Name: ${data.name}, Firma: ${data.company}, Branche: ${data.category}, Text: ${data.transcript}.
    Erstelle Markdown Output:
    ## 🧬 Mini Brand Pulse
    **1. Potenzial:** [Ein Satz]
    **2. Content:** [Zwei Ideen]
    **3. Impuls:** [Ein Tipp]
  `,
  brandDNA: (data) => `
    Extrahiere Brand DNA für Base44. Input: ${JSON.stringify(data)}.
    JSON Output Format:
    {
      "core_understanding": "string",
      "differentiation_factor": "string",
      "customer_reality": "string",
      "communication_boundaries": ["string"],
      "trust_signals": ["string"],
      "context_factors": "string",
      "tone_of_voice": "string"
    }
  `,
  contentHooks: (data) => `
    Erstelle 5 virale Hooks für ${data.category}. Kontext: ${data.transcript}.
    JSON Output Format:
    {
      "hooks": [
        { "hook": "Headline", "psychology": "Why it works" }
      ]
    }
  `,
  salesAnalysis: (data) => `
    Sales Intelligence Analyse für ${data.website}.
    JSON Output Format:
    {
      "positioning_gap": "string",
      "conversion_levers": ["string"],
      "emotional_triggers": ["string"],
      "strategic_advice": "string"
    }
  `
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('client');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [submissions, setSubmissions] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [clientResult, setClientResult] = useState(null);
  
  const [logs, setLogs] = useState([]);
  const [dbStatus, setDbStatus] = useState('Connecting...');
  const [lastError, setLastError] = useState(null);

  const log = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 3)]);

  // 1. Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        setLastError(`Auth Fail: ${e.message}`);
        setDbStatus('Auth Error');
      }
    };
    initAuth();

    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setDbStatus('Ready');
        log(`Auth: ${u.uid.slice(0, 6)}...`);
      } else {
        setUser(null);
        setDbStatus('Offline');
      }
    });
  }, []);

  // 2. Admin Data Sync
  useEffect(() => {
    if (view !== 'admin-dashboard' || !user) return;

    try {
      const q = query(collection(db, COLLECTION_PATH), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, 
        (snap) => {
          const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSubmissions(subs);
          log(`Sync: ${subs.length} items`);
        },
        (err) => {
          setLastError(`DB Read: ${err.message}`);
          setDbStatus('Read Error');
        }
      );
      return () => unsub();
    } catch (e) {
      setLastError(`Query Error: ${e.message}`);
    }
  }, [view, user]);

  // --- API CALLER ---
  const callGeminiApi = async ({ model, system, userPrompt, jsonOnly }) => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system,
          user: userPrompt,
          jsonOnly
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      return data.result;
    } catch (e) {
      setLastError(`AI Error: ${e.message}`);
      throw e;
    }
  };

  // --- HANDLERS ---
  const handleClientSubmit = async (formData) => {
    if (!user) return alert("System initialisiert noch...");
    setLoading(true);
    setClientResult(null);

    try {
      const feedback = await callGeminiApi({
        model: 'gemini-1.5-flash',
        userPrompt: PROMPTS.clientImmediate(formData),
        jsonOnly: false
      });

      await addDoc(collection(db, COLLECTION_PATH), {
        ...formData,
        clientAnalysis: feedback,
        timestamp: serverTimestamp(),
        status: 'new'
      });

      setClientResult(feedback);
      log('Submission success');
    } catch (e) {
      alert("Fehler beim Absenden.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (field, promptGen, isJson) => {
    if (!currentSub) return;
    setLoading(true);

    try {
      const result = await callGeminiApi({
        model: 'gemini-2.5-flash',
        userPrompt: promptGen(currentSub),
        jsonOnly: isJson
      });

      const docRef = doc(db, COLLECTION_PATH, currentSub.id);
      await updateDoc(docRef, { [field]: result });
      
      setCurrentSub(prev => ({ ...prev, [field]: result }));
      log(`Action ${field} updated`);
    } catch (e) {
      alert(`Action failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const FormInput = ({ name, placeholder, req = false }) => (
    <input name={name} required={req} placeholder={placeholder} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
  );

  // --- VIEWS ---
  if (view === 'client') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 pb-24 font-sans">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">Brand DNA Collector</h1>
            <button onClick={() => setView('login')} className="text-xs text-slate-500 uppercase font-semibold tracking-wider hover:text-white transition-colors">Partner</button>
          </div>

          {clientResult ? (
            <div className="bg-slate-900 border border-indigo-900/50 rounded-2xl p-6 animate-fade-in shadow-2xl">
              <div className="flex items-center gap-3 text-green-400 mb-4">
                <CheckCircle /> <span className="font-bold">Analyse bereit</span>
              </div>
              <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: clientResult.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
              <button onClick={() => window.location.reload()} className="mt-6 w-full py-3 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 text-slate-300 transition-colors">Neu starten</button>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleClientSubmit(Object.fromEntries(fd));
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput name="name" placeholder="Name" req />
                <FormInput name="company" placeholder="Firma" req />
              </div>
              <FormInput name="category" placeholder="Branche" req />
              <FormInput name="website" placeholder="Website URL" />
              <textarea name="transcript" required rows="5" placeholder="Erzähle über deine Marke..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"></textarea>
              <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20">
                {loading ? <Activity className="animate-spin" /> : <>Absenden <ChevronRight /></>}
              </button>
            </form>
          )}
        </div>
        <DebugPanel user={user} dbStatus={dbStatus} lastError={lastError} logs={logs} />
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <form onSubmit={(e) => {
            e.preventDefault();
            if(pin === PIN_CODE) setView('admin-dashboard');
            else alert('Wrong PIN');
        }} className="w-full max-w-sm text-center">
            <Lock className="mx-auto text-slate-600 mb-4" size={32} />
            <input type="password" autoFocus value={pin} onChange={e => setPin(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-center text-2xl text-white tracking-widest mb-4 outline-none focus:border-indigo-500 transition-colors" placeholder="PIN" />
            <button className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition-colors">Unlock</button>
            <button type="button" onClick={() => setView('client')} className="mt-4 text-slate-500 text-sm hover:text-white transition-colors">Cancel</button>
        </form>
      </div>
    );
  }

  // ADMIN VIEWS
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-indigo-400" /> Admin Inbox
          </h2>
          <div className="flex gap-4">
            {currentSub && <button onClick={() => setCurrentSub(null)} className="text-sm text-slate-400 hover:text-white transition-colors">Back to List</button>}
            <button onClick={() => setView('client')} className="flex items-center gap-2 text-xs bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800 hover:text-white transition-colors"><LogOut size={12}/> Exit</button>
          </div>
        </header>

        {!currentSub ? (
          <div className="grid gap-4">
            {submissions.map(sub => (
              <div key={sub.id} onClick={() => setCurrentSub(sub)} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:bg-slate-800 cursor-pointer transition-all flex justify-between items-center group">
                <div>
                  <h3 className="font-bold text-lg group-hover:text-indigo-300 transition-colors">{sub.company}</h3>
                  <p className="text-slate-400 text-sm">{sub.name} • {sub.category}</p>
                </div>
                <div className="flex items-center gap-3">
                    {sub.dna_json && <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full border border-green-900/30"><Cpu size={10}/> DNA</span>}
                    <ChevronRight className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
            {submissions.length === 0 && <div className="text-center text-slate-500 py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">Keine Daten gefunden.</div>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            <div className="col-span-1 bg-slate-900 p-6 rounded-xl border border-slate-800 overflow-y-auto custom-scrollbar">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Source Data</h3>
                <div className="space-y-6 text-sm">
                    <div>
                      <label className="text-slate-500 block text-xs mb-1">Company</label>
                      <div className="text-lg font-semibold">{currentSub.company}</div>
                      <div className="text-indigo-400 text-xs">{currentSub.website}</div>
                    </div>
                    <div>
                      <label className="text-slate-500 block text-xs mb-1">Transcript</label>
                      <p className="bg-slate-950 p-3 rounded-lg mt-1 text-slate-300 leading-relaxed border border-slate-800/50">{currentSub.transcript}</p>
                    </div>
                </div>
            </div>

            <div className="col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 overflow-y-auto custom-scrollbar space-y-6">
                <ActionSection 
                    title="Brand DNA (JSON)" 
                    icon={<Cpu size={16}/>}
                    data={currentSub.dna_json} 
                    loading={loading}
                    onRun={() => handleAdminAction('dna_json', PROMPTS.brandDNA, true)}
                />
                <ActionSection 
                    title="Content Hooks (JSON)" 
                    icon={<Zap size={16}/>}
                    data={currentSub.hooks} 
                    loading={loading}
                    onRun={() => handleAdminAction('hooks', PROMPTS.contentHooks, true)}
                />
                <ActionSection 
                    title="Sales Intel (JSON)" 
                    icon={<Target size={16}/>}
                    data={currentSub.sales_analysis} 
                    loading={loading}
                    onRun={() => handleAdminAction('sales_analysis', PROMPTS.salesAnalysis, true)}
                />
            </div>
          </div>
        )}
      </div>
      <DebugPanel user={user} dbStatus={dbStatus} lastError={lastError} logs={logs} />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}

const ActionSection = ({ title, icon, data, loading, onRun }) => (
    <div className="border border-slate-700/50 rounded-lg p-4 bg-slate-950/50">
        <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold flex items-center gap-2 text-indigo-300">{icon} {title}</h4>
            <button disabled={loading} onClick={onRun} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-colors font-medium">
                {data ? 'Regenerate' : 'Generate'}
            </button>
        </div>
        {data ? (
            <pre className="text-xs font-mono text-emerald-400 bg-black p-4 rounded-lg overflow-x-auto border border-emerald-900/30">
                {typeof data === 'string' ? data : JSON.stringify(JSON.parse(data), null, 2)}
            </pre>
        ) : <div className="text-xs text-slate-600 italic py-4 text-center border border-dashed border-slate-800 rounded-lg">Not generated yet</div>}
    </div>
);

const DebugPanel = ({ user, dbStatus, lastError, logs }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 text-[10px] font-mono flex justify-between items-center opacity-90 text-slate-400 z-50">
    <div className="flex gap-4">
      <span className={user ? "text-green-500 font-bold" : "text-red-500 font-bold"}>AUTH: {user ? 'ONLINE' : 'OFFLINE'}</span>
      <span>UID: {user?.uid?.slice(0,6) || '---'}</span>
      <span className={dbStatus.includes('Error') ? "text-red-500" : "text-blue-400"}>DB: {dbStatus}</span>
    </div>
    <div className="flex gap-4">
        {lastError && <span className="text-red-500 font-bold">ERR: {lastError.slice(0, 30)}...</span>}
        <span className="text-slate-600 hidden md:inline">{logs[0]}</span>
    </div>
  </div>
);
