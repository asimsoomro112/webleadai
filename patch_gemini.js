const fs = require('fs');
let code = fs.readFileSync('lib/gemini.ts', 'utf8');

// Replace the buggy generatedGeminiResponse implementations
const newImpl = `
export async function generateSalesCopilotAdvice(lead: Lead, profile: AgencyProfile, query: string): Promise<string> {
  const ai = getGeminiClient();
  const prompt = \`You are an expert sales copilot for an agency: \${profile.name}.
Lead: \${lead.businessName} (\${lead.category}).
Question: \${query}
Provide a short, actionable piece of advice (1-2 paragraphs) for the sales rep.\`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
    return res.text || 'No advice generated';
  } catch (err) {
    console.error(err);
    return 'Error generating advice.';
  }
}

export async function generateEmailReply(lead: Lead, profile: AgencyProfile, action: string, objection?: string) {
  const ai = getGeminiClient();
  const prompt = \`You are a sales rep for \${profile.name}.
Lead: \${lead.businessName}.
They replied to your email with a \${action}. \${objection ? 'Objection: ' + objection : ''}
Draft a short reply and determine if they are 'positive', 'negative', or 'objection'.
Return JSON with { "reply": "...", "suggestedStatus": "positive|negative|objection" }\`;
  try {
    const res = await ai.models.generateContent({ 
      model: 'gemini-3.5-flash', 
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(res.text || '{}');
  } catch (err) {
    console.error(err);
    return { reply: 'Thanks for getting back to us. Let me know if you change your mind.', suggestedStatus: action === 'accept' ? 'positive' : 'negative' };
  }
}

export async function generateProjectHandoff(lead: Lead, profile: AgencyProfile, instructions: string) {
  const ai = getGeminiClient();
  const prompt = \`Generate a project handoff brief.
Lead: \${lead.businessName}.
Agency: \${profile.name}.
Instructions: \${instructions}.
Return JSON with { "summary": "...", "timeline": "...", "deliverables": ["..."] }\`;
  try {
    const res = await ai.models.generateContent({ 
      model: 'gemini-3.5-flash', 
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(res.text || '{}');
  } catch (err) {
    console.error(err);
    return { summary: instructions, timeline: 'TBD', deliverables: [] };
  }
}
`;

// Remove the appended buggy implementations using regex
code = code.replace(/export async function generateSalesCopilotAdvice[\s\S]*?(EOF|$)/, newImpl);

fs.writeFileSync('lib/gemini.ts', code);
