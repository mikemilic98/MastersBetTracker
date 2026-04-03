import type { Participant, Pool } from "@prisma/client";

export class PoolEditForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PoolEditForbiddenError";
  }
}

export function assertParticipantSelfServeAllowed(
  pool: Pool,
  participant: Participant,
  now: Date = new Date(),
): void {
  if (pool.picksLocked) {
    throw new PoolEditForbiddenError("Pool picks are locked");
  }
  if (participant.locked) {
    throw new PoolEditForbiddenError("Your entry is locked by an admin");
  }
  if (pool.cutoffAt && now > pool.cutoffAt) {
    throw new PoolEditForbiddenError("Pick cutoff has passed");
  }
}
