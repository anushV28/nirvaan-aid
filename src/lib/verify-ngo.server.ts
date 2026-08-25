export type VerificationResult = {
  status: "verified" | "review" | "suspicious";
  score: number;
  notes: string;
};

export type OrgFacts = {
  org_name: string;
  registration_number: string | null;
  contact_person: string;
  contact_phone: string;
  email: string;
  website: string | null;
  area_of_operation: string | null;
  resources_available: string | null;
};

const SYSTEM_PROMPT = `You audit whether a relief organization applying to a disaster coordination platform in India looks genuine.
Respond with ONLY JSON: {"score": 0-100, "notes": "one short paragraph of the concrete checks and red flags"}.
Consider: plausible registration number format, professional email domain vs free mail, working-looking website, specific area of operation and resources, name consistency, generic or copy-pasted text.
Be conservative: missing registration number or website lowers the score.`;

function heuristicScore(org: OrgFacts, siteReachable: boolean | null): VerificationResult {
  let score = 40;
  const notes: string[] = [];
  if (org.registration_number && org.registration_number.trim().length >= 6) {
    score += 20;
    notes.push("Registration number provided.");
  } else notes.push("No registration number provided.");
  if (siteReachable === true) {
    score += 20;
    notes.push("Website is reachable.");
  } else if (siteReachable === false) {
    score -= 10;
    notes.push("Website could not be reached.");
  } else notes.push("No website provided.");
  if (org.email && !/@(gmail|yahoo|hotmail|outlook)\./i.test(org.email)) {
    score += 10;
    notes.push("Uses an organizational email domain.");
  } else notes.push("Uses a free email provider.");
  if ((org.resources_available ?? "").trim().length > 25) {
    score += 10;
    notes.push("Describes concrete resources.");
  }
  score = Math.max(0, Math.min(100, score));
  return {
    score,
    status: score >= 70 ? "verified" : score >= 45 ? "review" : "suspicious",
    notes: notes.join(" "),
  };
}

async function checkWebsite(url: string | null): Promise<boolean | null> {
  if (!url) return null;
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const res = await fetch(target, { method: "GET", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

async function aiReview(org: OrgFacts, siteReachable: boolean | null) {
  const key = process.env["LOVABLE_API_KEY"];
  const anthropic = process.env["ANTHROPIC_API_KEY"];
  const userContent = `${JSON.stringify(org, null, 2)}\nWebsite reachable: ${String(siteReachable)}`;
  try {
    if (anthropic) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropic,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content?: Array<{ text?: string }> };
        return parse(data.content?.[0]?.text ?? "");
      }
    }
    if (key) {
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
            { role: "user", content: userContent },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return parse(data.choices?.[0]?.message?.content ?? "");
      }
    }
  } catch (error) {
    console.error("ngo verification error", error);
  }
  return null;
}

function parse(raw: string): { score: number; notes: string } | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { score?: number; notes?: string };
    if (typeof parsed.score !== "number") return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      notes: String(parsed.notes ?? "").slice(0, 800),
    };
  } catch {
    return null;
  }
}

export async function verifyOrganization(org: OrgFacts): Promise<VerificationResult> {
  const siteReachable = await checkWebsite(org.website);
  const base = heuristicScore(org, siteReachable);
  const ai = await aiReview(org, siteReachable);
  if (!ai) return base;
  const score = Math.round(base.score * 0.4 + ai.score * 0.6);
  return {
    score,
    status: score >= 70 ? "verified" : score >= 45 ? "review" : "suspicious",
    notes: `${ai.notes}\n\nAutomated checks: ${base.notes}`,
  };
}
