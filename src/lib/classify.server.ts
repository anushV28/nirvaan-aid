import type { Category, Urgency } from "./nirvaan";

export type Classification = { category: Category; urgency: Urgency };

const CATEGORIES: Category[] = ["medical", "food", "shelter", "rescue", "general"];
const URGENCIES: Urgency[] = ["critical", "high", "medium", "low"];

const SYSTEM_PROMPT = `You triage emergency help requests during floods and disasters in India.
Read the request and respond with ONLY a JSON object, no prose, no markdown fences:
{"category":"medical|food|shelter|rescue","urgency":"critical|high|medium|low"}
Rules:
- rescue = trapped, stranded, rising water, needs evacuation or boat.
- medical = injury, illness, medicine, pregnancy, dialysis, oxygen.
- food = food, drinking water, milk, baby formula.
- shelter = displaced, needs a dry place, tents, blankets, clothing.
- critical = life threatening within hours (drowning risk, severe bleeding, infants/elderly trapped).
- high = urgent within a day. medium = important. low = can wait.`;

function coerce(raw: string): Classification | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { category?: string; urgency?: string };
    const category = CATEGORIES.includes(parsed.category as Category)
      ? (parsed.category as Category)
      : null;
    const urgency = URGENCIES.includes(parsed.urgency as Urgency)
      ? (parsed.urgency as Urgency)
      : null;
    if (!category || !urgency) return null;
    return { category, urgency };
  } catch {
    return null;
  }
}

export function heuristicClassify(text: string): Classification {
  const t = text.toLowerCase();
  let category: Category = "general";
  if (/(medic|injur|blood|hospital|doctor|pregnan|oxygen|dialysis|fever|dawa|દવા|दवा)/.test(t))
    category = "medical";
  else if (/(trap|stuck|strand|rescue|boat|roof|drown|water rising|fans|બચાવ|फंस|बचाव)/.test(t))
    category = "rescue";
  else if (/(food|hungry|water|milk|ration|khana|ખોરાક|भोजन|खाना)/.test(t)) category = "food";
  else if (/(shelter|home|house|blanket|tent|camp|આશ્રય|आश्रय)/.test(t)) category = "shelter";

  let urgency: Urgency = "medium";
  if (/(drown|dying|critical|bleeding|infant|newborn|no oxygen|rising fast|urgent!!)/.test(t))
    urgency = "critical";
  else if (/(urgent|immediately|elderly|child|trapped|stuck|rising)/.test(t)) urgency = "high";
  else if (/(when possible|later|not urgent|tomorrow)/.test(t)) urgency = "low";

  if (category === "rescue" && urgency === "medium") urgency = "high";
  return { category, urgency };
}

async function callAnthropic(description: string, key: string): Promise<Classification | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: description }],
      }),
    });
    if (!res.ok) {
      console.error("anthropic classify failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    return coerce(data.content?.[0]?.text ?? "");
  } catch (error) {
    console.error("anthropic classify error", error);
    return null;
  }
}

async function callGateway(description: string, key: string): Promise<Classification | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: description },
        ],
      }),
    });
    if (!res.ok) {
      console.error("gateway classify failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return coerce(data.choices?.[0]?.message?.content ?? "");
  } catch (error) {
    console.error("gateway classify error", error);
    return null;
  }
}

export async function classifyDescription(description: string): Promise<Classification> {
  const text = description.slice(0, 2000);
  const anthropicKey = process.env["ANTHROPIC_API_KEY"];
  if (anthropicKey) {
    const result = await callAnthropic(text, anthropicKey);
    if (result) return result;
  }
  const gatewayKey = process.env["LOVABLE_API_KEY"];
  if (gatewayKey) {
    const result = await callGateway(text, gatewayKey);
    if (result) return result;
  }
  return heuristicClassify(text);
}
