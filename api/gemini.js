export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Validate API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing in environment variables');
    return res.status(500).json({ error: 'Server Configuration Error' });
  }

  try {
    // 1. Model Strategy Logic
    // Extract 'model' from body to determine strategy, then separate it from the Google payload
    const { model: requestedModel, ...googlePayload } = req.body;

    // Default: Fast Model (Client-facing, Hooks, Transcription)
    let targetModel = 'gemini-1.5-flash';

    // Upgrade: Deep Analysis Model (Brand DNA, Sales Intel)
    // Only switch if explicitly requested and valid
    if (requestedModel === 'gemini-2.5-flash') {
      targetModel = 'gemini-2.5-flash';
    }

    // 2. Target Google Generative Language API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 3. Send payload WITHOUT the 'model' field (Google API rejects unknown fields)
      body: JSON.stringify(googlePayload),
    });

    const data = await response.json();

    // Forward upstream errors
    if (!response.ok) {
      console.error(`Gemini API Error (${targetModel}):`, data);
      return res.status(response.status).json(data);
    }

    // Return successful response
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
