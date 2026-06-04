import type { ProblemForm } from '@/features/problems/api/problems-api.types';

export type SimilarProblemContext = {
  title?: string;
  description?: string;
};

const SIMILAR_PROBLEMS_LIMIT = 3;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length >= 3);
}

function scoreProblemRelevance(
  problem: ProblemForm,
  context: SimilarProblemContext,
): number {
  const haystack =
    `${problem.title ?? ''} ${problem.description ?? ''}`.toLowerCase();
  const tokens = [
    ...tokenize(context.title ?? ''),
    ...tokenize(context.description ?? ''),
  ];

  let score = 0;
  for (const token of new Set(tokens)) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export function pickSimilarProblems(
  problems: ProblemForm[],
  context: SimilarProblemContext,
  excludeProblemId?: string,
  limit = SIMILAR_PROBLEMS_LIMIT,
): ProblemForm[] {
  const candidates = problems.filter(
    problem =>
      problem.status === 'PUBLISHED' &&
      problem.id !== excludeProblemId,
  );

  const scored = candidates
    .map((problem, index) => ({
      problem,
      score: scoreProblemRelevance(problem, context),
      index,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    });

  const relevant = scored.some(entry => entry.score > 0);
  const pool = relevant ? scored.filter(entry => entry.score > 0) : [];

  return pool.slice(0, limit).map(entry => entry.problem);
}
