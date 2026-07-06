import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

const LATEX_SYMBOLS: [RegExp, string][] = [
  [/\$\\rightarrow\$/g, '→'],
  [/\$\\leftarrow\$/g, '←'],
  [/\$\\Rightarrow\$/g, '⇒'],
  [/\$\\Leftarrow\$/g, '⇐'],
  [/\$\\leftrightarrow\$/g, '↔'],
  [/\$\\Leftrightarrow\$/g, '⇔'],
  [/\$\\uparrow\$/g, '↑'],
  [/\$\\downarrow\$/g, '↓'],
  [/\$\\cdot\$/g, '·'],
  [/\$\\times\$/g, '×'],
  [/\$\\div\$/g, '÷'],
  [/\$\\pm\$/g, '±'],
  [/\$\\leq\$/g, '≤'],
  [/\$\\geq\$/g, '≥'],
  [/\$\\neq\$/g, '≠'],
  [/\$\\approx\$/g, '≈'],
  [/\$\\infty\$/g, '∞'],
  [/\$\\in\$/g, '∈'],
  [/\$\\notin\$/g, '∉'],
  [/\$\\subset\$/g, '⊂'],
  [/\$\\supset\$/g, '⊃'],
  [/\$\\cup\$/g, '∪'],
  [/\$\\cap\$/g, '∩'],
];

function preprocessLatex(text: string): string {
  let result = text;
  for (const [pattern, replacement] of LATEX_SYMBOLS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return md.render(preprocessLatex(markdown));
}
