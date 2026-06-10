export function buildDirectPairKey(userAId: string, userBId: string): string {
  const [low, high] = [userAId, userBId].sort();
  return `${low}:${high}`;
}
