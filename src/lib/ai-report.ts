import { pillars, type PillarId } from '@/data/assessment';

export interface AIReportContent {
  executiveSummary: {
    narrative: string;
    keyInsight: string;
    topGaps: Array<{ pillar: string; gap: string; impact: string }>;
  };
  pillarAnalyses: Array<{
    pillarId: string;
    overallAssessment: string;
    questionBreakdown: Array<{
      questionId: string;
      assessment: string;
      recommendation: string;
      effort: 'low' | 'medium' | 'high';
    }>;
  }>;
  actionPlan: {
    quickWins: Array<{ action: string; impact: string }>;
    mediumTerm: Array<{ action: string; impact: string }>;
    strategic: Array<{ action: string; impact: string }>;
  };
  successMetrics: Array<{ metric: string; target: string; timeframe: string }>;
}

interface InputData {
  companyName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: string;
  selectedPillars: PillarId[];
  pillarScores: Record<string, { score: number; maxScore: number; percentage: number }>;
  answers: Record<string, string>;
}

function buildPrompt(data: InputData): string {
  const parts: string[] = [
    `CLIENT: ${data.companyName}`,
    `OVERALL: ${data.totalScore}/${data.maxScore} (${data.percentage}%) - ${data.level}`,
    '',
  ];

  for (const pid of data.selectedPillars) {
    const pillar = pillars.find((p) => p.id === pid);
    if (!pillar) continue;
    const ps = data.pillarScores[pid];
    if (!ps) continue;

    parts.push(`PILLAR ID="${pid}" NAME="${pillar.name}" (${ps.score}/${ps.maxScore} - ${ps.percentage}%)`);

    for (const q of pillar.questions) {
      const opt = q.options.find((o) => o.id === data.answers[q.id]);
      parts.push(`  Q ID="${q.id}" TEXT="${q.text}" ANSWER="${opt?.text ?? 'Not answered'}" (${opt?.score ?? 0}/3)`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

const SYSTEM_PROMPT = `You are a senior AI consultant at TechSpecialist Ltd. Generate a detailed diagnostic report in JSON.

RULES:
1. Use EXACT pillarId and questionId from the input data (e.g. "governance", "g1").
2. Every paragraph must reference the client's actual scores, answers, or data. Never write generic filler.
3. narrative: Write 4-6 detailed paragraphs. Start with their score and what it means. Identify the biggest theme. Frame the opportunity with concrete outcomes. Be specific about which pillars are strong and which need work.
4. keyInsight: One hard-hitting sentence that captures the most critical finding.
5. topGaps: Exactly 3 gaps. Each must cite a specific answer or score and state a concrete business impact.
6. overallAssessment: 3-5 sentences. Reference their pillar percentage, identify the core issue, explain why it matters.
7. assessment (per question): 2-3 sentences. Explain what their answer reveals and why that is a problem or strength.
8. recommendation: A specific, implementable action starting with an imperative verb. Include a tool, timeframe, or method where possible. Example: "Deploy Microsoft Purview within 60 days to establish a unified data governance layer."
9. effort: Rate honestly based on scope.
10. actionPlan actions: Must be specific and actionable with expected business outcomes.
11. successMetrics: Must be measurable, time-bound, and tied to their specific gaps.`;

const OUTPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    executiveSummary: {
      type: 'object' as const,
      properties: {
        narrative: { type: 'string' as const },
        keyInsight: { type: 'string' as const },
        topGaps: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              pillar: { type: 'string' as const },
              gap: { type: 'string' as const },
              impact: { type: 'string' as const },
            },
            required: ['pillar', 'gap', 'impact'] as const,
            additionalProperties: false,
          },
        },
      },
      required: ['narrative', 'keyInsight', 'topGaps'] as const,
      additionalProperties: false,
    },
    pillarAnalyses: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          pillarId: { type: 'string' as const },
          overallAssessment: { type: 'string' as const },
          questionBreakdown: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                questionId: { type: 'string' as const },
                assessment: { type: 'string' as const },
                recommendation: { type: 'string' as const },
                effort: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
              },
              required: ['questionId', 'assessment', 'recommendation', 'effort'] as const,
              additionalProperties: false,
            },
          },
        },
        required: ['pillarId', 'overallAssessment', 'questionBreakdown'] as const,
        additionalProperties: false,
      },
    },
    actionPlan: {
      type: 'object' as const,
      properties: {
        quickWins: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              action: { type: 'string' as const },
              impact: { type: 'string' as const },
            },
            required: ['action', 'impact'] as const,
            additionalProperties: false,
          },
        },
        mediumTerm: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              action: { type: 'string' as const },
              impact: { type: 'string' as const },
            },
            required: ['action', 'impact'] as const,
            additionalProperties: false,
          },
        },
        strategic: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              action: { type: 'string' as const },
              impact: { type: 'string' as const },
            },
            required: ['action', 'impact'] as const,
            additionalProperties: false,
          },
        },
      },
      required: ['quickWins', 'mediumTerm', 'strategic'] as const,
      additionalProperties: false,
    },
    successMetrics: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          metric: { type: 'string' as const },
          target: { type: 'string' as const },
          timeframe: { type: 'string' as const },
        },
        required: ['metric', 'target', 'timeframe'] as const,
        additionalProperties: false,
      },
    },
  },
  required: ['executiveSummary', 'pillarAnalyses', 'actionPlan', 'successMetrics'] as const,
  additionalProperties: false,
};

const JSON_SCHEMA_INSTRUCTION = `\n\nRespond with JSON using the schema:\n{\n  "executiveSummary": {\n    "narrative": "4-6 detailed paragraphs",\n    "keyInsight": "one hard-hitting sentence",\n    "topGaps": [{"pillar": "pillar name", "gap": "specific gap", "impact": "concrete business impact"}]\n  },\n  "pillarAnalyses": [{\n    "pillarId": "exact ID from input",\n    "overallAssessment": "3-5 sentences",\n    "questionBreakdown": [{\n      "questionId": "exact ID from input",\n      "assessment": "2-3 sentences",\n      "recommendation": "specific action starting with verb",\n      "effort": "low|medium|high"\n    }]\n  }],\n  "actionPlan": {\n    "quickWins": [{"action": "specific action", "impact": "expected outcome"}],\n    "mediumTerm": [{"action": "specific action", "impact": "expected outcome"}],\n    "strategic": [{"action": "specific action", "impact": "expected outcome"}]\n  },\n  "successMetrics": [{"metric": "KPI", "target": "measurable target", "timeframe": "timeframe"}]\n}`;

async function generateWithClaude(prompt: string, userMessage: string): Promise<AIReportContent | null> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    output_config: {
      format: {
        type: 'json_schema',
        schema: OUTPUT_SCHEMA,
      },
    },
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;

  return JSON.parse(textBlock.text) as AIReportContent;
}

async function generateWithGroq(prompt: string, userMessage: string): Promise<AIReportContent | null> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage + JSON_SCHEMA_INSTRUCTION },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    console.error('Groq API error:', response.status, await response.text());
    return null;
  }

  const json = await response.json();
  return JSON.parse(json.choices[0].message.content) as AIReportContent;
}

export async function generateAIReport(data: InputData): Promise<AIReportContent | null> {
  const prompt = buildPrompt(data);
  const userMessage = `Generate a diagnostic report for this client:\n\n${prompt}`;

  // Try Claude first if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await generateWithClaude(prompt, userMessage);
      if (result) return result;
    } catch (err) {
      console.error('Claude generation failed, falling back to Groq:', err);
    }
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      return await generateWithGroq(prompt, userMessage);
    } catch (err) {
      console.error('Groq generation also failed:', err);
    }
  }

  console.error('No AI provider available — set ANTHROPIC_API_KEY or GROQ_API_KEY');
  return null;
}
