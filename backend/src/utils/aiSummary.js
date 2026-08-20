const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5';

export const hasAISummaryProvider = Boolean(OPENAI_API_KEY);

function isTextLikeFile(file = {}) {
  const mime = file.mimetype || '';
  const name = (file.originalname || '').toLowerCase();
  return (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.csv')
  );
}

export function extractTextPreview(file) {
  if (!file?.buffer || !isTextLikeFile(file)) return '';
  return file.buffer.toString('utf8').replace(/\s+/g, ' ').slice(0, 12000);
}

function getOutputText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text.trim();
  const text = payload?.output
    ?.flatMap((item) => item.content || [])
    ?.map((content) => content.text || '')
    ?.join('\n')
    ?.trim();
  return text || '';
}

export async function generateAISummary({ resource, textPreview }) {
  if (!hasAISummaryProvider) {
    return {
      aiSummary: '',
      aiSummaryStatus: 'not_configured',
      aiSummarySource: textPreview ? 'document_text' : 'metadata',
      aiSummaryGeneratedAt: ''
    };
  }

  const source = textPreview ? 'document_text' : 'metadata';
  const prompt = `
Create a concise academic resource summary for StudyVault Pro.

Return 2-3 clear sentences only. Mention the likely topic coverage and how a student can use it. Do not invent exact chapter names, author names, marks, or exam years unless present in the input.

Resource metadata:
- Title: ${resource.title}
- Subject: ${resource.subject}
- Semester: ${resource.semester}
- Branch: ${resource.branch}
- Type: ${resource.type}
- Description: ${resource.description || 'Not provided'}
- Tags: ${resource.tags || 'Not provided'}
- File name: ${resource.originalName}

${textPreview ? `Readable document text preview:\n${textPreview}` : 'Readable document text was not available, so summarize from metadata only.'}
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
        store: false,
        max_output_tokens: 180
      })
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'AI summary generation failed.');
  }

  const payload = await response.json();
  const aiSummary = getOutputText(payload);
  if (!aiSummary) throw new Error('AI summary response was empty.');

  return {
    aiSummary,
    aiSummaryStatus: 'ready',
    aiSummarySource: source,
    aiSummaryGeneratedAt: new Date().toISOString()
  };
}
