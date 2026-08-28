import type { Category, Urgency } from "./nirvaan";

export type Classification = { category: Category; urgency: Urgency };

const CATEGORIES: Category[] = ["medical", "food", "shelter", "rescue", "general"];
const URGENCIES: Urgency[] = ["critical", "high", "medium", "low"];

export const FALLBACK: Classification = { category: "general", urgency: "medium" };

const SYSTEM_PROMPT = `You are an emergency dispatch triage assistant for floods and disasters in India.
Classify the citizen's free-text help request.

category (pick one):
- rescue: trapped, stranded, immobile, rising water, needs evacuation or a boat.
- medical: injury, illness, medicine, pregnancy, dialysis, oxygen, breathing trouble.
- food: food, drinking water, milk, baby formula, rations.
- shelter: displaced, needs a dry place, tents, blankets, clothing.
- general: unclear or does not fit the above.

urgency (pick one):
- critical: life threatening within hours — "can't breathe", severe bleeding, drowning risk, "water rising", trapped infants or elderly.
- high: urgent within a day; trapped or immobile people, children, elderly, medical distress.
- medium: important but not immediately life threatening.
- low: can wait.

Weigh trapped/immobile people, medical distress, children, elderly, and life-threatening language toward higher urgency.
If the description is too vague to classify confidently, answer category "general" and urgency "medium".
Respond with JSON only.`;

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
  if (/(medic|injur|blood|hospital|doctor|pregnan|oxygen|dialysis|fever|breath|dawa|દવા|दवा)/.test(t))
    category = "medical";
  else if (/(trap|stuck|strand|rescue|boat|roof|drown|water rising|બચાવ|फंस|बचाव)/.test(t))
    category = "rescue";
  else if (/(food|hungry|water|milk|ration|khana|ખોરાક|भोजन|खाना)/.test(t)) category = "food";
  else if (/(shelter|home|house|blanket|tent|camp|આશ્રય|आश्रय)/.test(t)) category = "shelter";

  let urgency: Urgency = "medium";
  if (/(drown|dying|critical|bleeding|infant|newborn|can'?t breathe|no oxygen|rising fast)/.test(t))
    urgency = "critical";
  else if (/(urgent|immediately|elderly|child|trapped|stuck|rising)/.test(t)) urgency = "high";
  else if (/(when possible|later|not urgent|tomorrow)/.test(t)) urgency = "low";

  if (category === "rescue" && urgency === "medium") urgency = "high";
  return { category, urgency };
}

async function callGateway(description: string, key: string): Promise<Classification | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: description },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "triage",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                category: { type: "string", enum: CATEGORIES },
                urgency: { type: "string", enum: URGENCIES },
              },
              required: ["category", "urgency"],
            },
          },
        },
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
  } finally {
    clearTimeout(timer);
  }
}

export async function classifyDescription(description: string): Promise<Classification> {
  try {
    const text = description.slice(0, 2000);
    const gatewayKey = process.env["LOVABLE_API_KEY"];
    if (gatewayKey) {
      const result = await callGateway(text, gatewayKey);
      if (result) return result;
    }
    return heuristicClassify(text);
  } catch (error) {
    console.error("classify error", error);
    return FALLBACK;
  }
}
