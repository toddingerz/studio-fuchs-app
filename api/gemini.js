export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Healthcheck & Model Logging
  if (req.method === 'GET') {
    const supportedModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    console.log('Gemini Proxy Ready. Supported Models:', supportedModels);
    return res.status(200).json({ 
      status: 'ok', 
      service: 'Gemini Proxy', 
      supported_models: supportedModels 
    });
  }

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Main Logic
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server Config Error: Missing API Key' });
  }

  try {
    const { model: requestedModel, system = '', user, jsonOnly = false } = req.body || {};

    if (!user) {
      return res.status(400).json({ error: 'Missing user prompt' });
    }

    // 🔧 FIX: Enforce Stable Model Names
    // Map incoming requests (including legacy/latest tags) to stable 1.5 versions
    let targetModel = 'gemini-1.5-flash'; // Default

    if (requestedModel) {
      if (requestedModel.includes('pro') || requestedModel.includes('2.')) {
        // Use Pro for complex tasks or if 2.x was requested
        targetModel = 'gemini-1.5-pro';
      } else {
        // Default fall-through for flash variants
        targetModel = 'gemini-1.5-flash';
      }
    }

    let finalSystemPrompt = system;
    if (jsonOnly) {
      finalSystemPrompt += " Output MUST be valid raw JSON only. No Markdown blocks, no explanations.";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: user }] }],
      systemInstruction: { parts: [{ text: finalSystemPrompt }] },
      generationConfig: {
        temperature: jsonOnly ? 0.2 : 0.7,
      }
    };

    if (jsonOnly) {
       payload.generationConfig.responseMimeType = "application/json";
    }

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      throw new Error(data.error?.message || 'Upstream API Error');
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // JSON Cleanup & Validation
    if (jsonOnly && typeof text === 'string') {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        JSON.parse(text); 
      } catch (e) {
        console.error("JSON Parse Error:", text);
        return res.status(500).json({ error: 'Model failed to generate valid JSON', raw: text });
      }
    }

    return res.status(200).json({ result: text, used_model: targetModel });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
