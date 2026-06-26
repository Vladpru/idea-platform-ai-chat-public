export function AiChatThinkingAnimation() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 12"
      width="56"
      height="12"
      role="img"
      aria-label="AI is thinking"
    >
      <defs>
        <circle id="thinking-dot" r="3.1" fill="var(--brand-dark-blue)" />
      </defs>
      <style>{`
        .thinking-dot {
          opacity: 0.15;
          animation: thinking-pulse 1500ms cubic-bezier(0.25, 1, 0.5, 1) infinite both;
        }
        @keyframes thinking-pulse {
          0%   { opacity: 0.15; }
          20%  { opacity: 1; }
          80%  { opacity: 0.15; }
          100% { opacity: 0.15; }
        }
        @media (prefers-reduced-motion: reduce) {
          .thinking-dot { animation: none; opacity: 0.6; }
        }
        .d0 { animation-delay: 0ms; }
        .d1 { animation-delay: 200ms; }
        .d2 { animation-delay: 400ms; }
        .d3 { animation-delay: 600ms; }
        .d4 { animation-delay: 800ms; }
      `}</style>

      <use className="thinking-dot d0" href="#thinking-dot" x="6"  y="6" />
      <use className="thinking-dot d1" href="#thinking-dot" x="17" y="6" />
      <use className="thinking-dot d2" href="#thinking-dot" x="28" y="6" />
      <use className="thinking-dot d3" href="#thinking-dot" x="39" y="6" />
      <use className="thinking-dot d4" href="#thinking-dot" x="50" y="6" />
    </svg>
  );
}
