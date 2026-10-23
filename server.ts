import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[CampaignPilot AI] GoogleGenAI client initialized successfully with gemini-3.8-flash.');
  } catch (err) {
    console.error('[CampaignPilot AI] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.log('[CampaignPilot AI] No valid GEMINI_API_KEY found. Rule-based diagnostic fallback active.');
}

// Health & Status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: !!aiClient,
    provider: aiClient ? 'gemini' : 'rule_based_fallback',
    model: aiClient ? 'gemini-3.8-flash' : 'rule-engine',
    awsBedrockReady: true,
    timestamp: new Date().toISOString(),
  });
});

// Campaign Diagnosis AI Endpoint
app.post('/api/diagnose', async (req: Request, res: Response) => {
  const { campaign, historicalContext, explicitBenchmarks } = req.body;

  if (!campaign || !campaign.name) {
    return res.status(400).json({ error: 'Valid campaign data is required for diagnosis.' });
  }

  // If Gemini is not configured, signal client to use the rule-based fallback
  if (!aiClient) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY not configured on server.',
      fallbackAvailable: true,
      provider: 'rule_based',
    });
  }

  try {
    const prompt = `
You are an expert digital marketing analytics assistant named CampaignPilot AI.
Analyze the provided campaign data carefully. Calculate or verify the key metrics, identify strengths and weaknesses, compare metrics with the provided historical data or explicit benchmarks, and generate practical, prioritized recommendations.
Distinguish observed facts from hypotheses. Never invent missing data, benchmark values, advertising costs, or performance results. If data is insufficient, explain what additional information is required.

CAMPAIGN DATA:
${JSON.stringify(campaign, null, 2)}

ADDITIONAL CONTEXT / BENCHMARKS:
${JSON.stringify({ historicalContext, explicitBenchmarks }, null, 2)}

Return ONLY valid JSON matching this exact structure:
{
  "executive_summary": "Concise 2-3 sentence executive assessment grounded in observed data",
  "strengths": ["Clear strength 1 grounded in real numbers", "Clear strength 2"],
  "performance_concerns": ["Observed performance issue 1 with metric evidence", "Observed issue 2"],
  "possible_causes": [
    "Hypothesis: Possible cause A (distinguished clearly as hypothesis, not fact)",
    "Hypothesis: Possible cause B"
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Actionable title",
      "explanation": "Concrete reasoning based on metrics",
      "metric_evidence": "e.g. CTR is 0.85% vs 2.10% benchmark",
      "priority": "High" | "Medium" | "Low",
      "category": "creative" | "audience" | "landing_page" | "budget" | "bidding" | "conversion",
      "implementation_steps": [
        "Step 1",
        "Step 2"
      ],
      "expected_impact": "Expected outcome as an estimate (do not guarantee exact percentages)",
      "status": "pending"
    }
  ],
  "confidence": "High" | "Medium" | "Low",
  "missing_data": [
    "Additional tracking or data needed to verify hypotheses"
  ],
  "benchmark_comparisons": [
    {
      "metric": "CTR",
      "campaignValue": "0.85%",
      "benchmarkValue": "1.50%",
      "status": "below"
    }
  ]
}
`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out after 9 seconds')), 9000)
    );

    const response: any = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      }),
      timeoutPromise,
    ]);

    const responseText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean possible markdown code fence
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return res.json({
      success: true,
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      diagnosis: parsedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn('[CampaignPilot AI] Diagnosis error or timeout, providing fallback:', error?.message);
    return res.json({
      success: false,
      error: error?.message || 'AI model response timed out. Falling back to analytical engine.',
      fallbackAvailable: true,
      provider: 'rule_based',
    });
  }
});

// AI Marketing Assistant Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, campaignsSummary, activeCampaignId } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY not configured on server.',
      fallbackAvailable: true,
      provider: 'rule_based',
    });
  }

  try {
    const userMessage = messages[messages.length - 1]?.text || '';
    const conversationHistory = messages.slice(0, -1).map((m: any) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

    const prompt = `
You are the CampaignPilot AI Marketing Assistant, an expert digital marketing analyst.
Answer the user's question accurately using ONLY the provided campaign dataset and factual marketing principles.
Never fabricate data, numbers, or unrecorded campaigns.
If the data is insufficient to answer definitively, state what data is missing.
Provide concise, actionable, and formatted answers (with bullet points or short paragraphs).

CAMPAIGN DATASET AVAILABLE:
${JSON.stringify(campaignsSummary, null, 2)}
ACTIVE SELECTED CAMPAIGN ID: ${activeCampaignId || 'None (all campaigns)'}

CONVERSATION HISTORY:
${conversationHistory}

USER QUESTION:
${userMessage}
`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Chat generation timed out after 8 seconds')), 8000)
    );

    const response: any = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      }),
      timeoutPromise,
    ]);

    return res.json({
      success: true,
      reply: response.text || 'I analyzed your campaign data, but could not produce a response.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn('[CampaignPilot AI] Chat error or timeout:', error?.message);
    return res.json({
      success: false,
      error: error?.message || 'Chat generation failed.',
      fallbackAvailable: true,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampaignPilot AI] Server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[CampaignPilot AI] Failed to start server:', err);
  process.exit(1);
});
