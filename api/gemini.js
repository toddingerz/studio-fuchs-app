export default async function handler(req, res) {
  // CORS Headers für Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'MISSING_API_KEY', message: 'API Key fehlt in Vercel.' });
  }

  try {
    const { model, ...body } = req.body;
    const targetModel = model || "gemini-2.5-flash-preview-09-2025";
    
    // WICHTIG: Die URL muss exakt so aufgebaut sein für Gemini 1.5/2.5
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
        return res.status(response.status).json(data);
    }
    
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
