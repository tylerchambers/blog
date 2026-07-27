import resumeMarkdown from '../content/resume.md?raw';

export function GET() {
  return new Response(resumeMarkdown, {
    headers: {
      'Content-Disposition': 'attachment; filename="Tyler-Chambers-Resume.md"',
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
