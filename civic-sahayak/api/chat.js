// Vercel serverless function: POST /api/chat  { messages: [{role, content}] }
// Set ANTHROPIC_API_KEY in your Vercel project's environment variables.
const SYSTEM = `You are Civic Sahayak, a helpful assistant for Indian citizens.
Help with civic services, government schemes, documents, and filing grievances.
Reply in the user's language (English, Hindi or Hinglish). Keep answers short and practical, with clear steps.
Only mention official portals you are confident about, and remind users to verify eligibility and fees on the official website.
For emergencies, point to 112 (emergency) and 108 (ambulance). Do not invent scheme details.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "API key not set" });
  const messages = (req.body && req.body.messages || []).slice(-10)
    .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) }));
  if (!messages.length) return res.status(400).json({ error: "No messages" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 600, system: SYSTEM, messages }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data });
    res.status(200).json({ reply: data.content.map(b => b.text || "").join("") });
  } catch (e) {
    res.status(500).json({ error: "Upstream error" });
  }
};
