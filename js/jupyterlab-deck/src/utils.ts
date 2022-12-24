export interface IRankedId {
  rank: number;
  id: string;
}

export function sortByRankThenId(a: IRankedId, b: IRankedId) {
  return a.rank - b.rank || a.id.localeCompare(b.id);
}
