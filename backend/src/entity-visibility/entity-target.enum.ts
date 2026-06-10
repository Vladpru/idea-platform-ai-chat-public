export enum EntityTarget {
  IDEA = 'ideas',
  PROBLEM = 'problems',
  USER = 'users',
}

export const ENTITY_LINK_TARGETS = [
  EntityTarget.IDEA,
  EntityTarget.PROBLEM,
] as const;

export type EntityLinkTarget = (typeof ENTITY_LINK_TARGETS)[number];

export function isEntityLinkTarget(
  entityType: EntityTarget,
): entityType is EntityLinkTarget {
  return (
    entityType === EntityTarget.IDEA || entityType === EntityTarget.PROBLEM
  );
}
