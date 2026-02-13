export default async function handler(req, res) {
  // 1. CORS Headers: Erlaubt deiner App den Zugriff
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight-Anfragen sofort durchwinken
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Prüfen, ob der API Key in Vercel hinterlegt ist
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("SERVER FEHLER: GEMINI_API_KEY fehlt in den Vercel Environment Variables.");
    return res.status(500).json({ 
      error: 'MISSING_API_KEY', 
      message: 'Der Server hat keinen API Key. Bitte in Vercel Settings eintragen.' 
    });
  }

  try {
    // 3. Anfrage an Google weiterleiten
    const { model, ...googlePayload } = req.body;
    const targetModel = model || "gemini-2.5-flash-preview-09-2025";
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googlePayload)
      }
    );

    const data = await response.json();

    // Fehler von Google weitergeben
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Erfolg! Daten zurücksenden
    res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
