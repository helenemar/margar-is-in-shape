/**
 * Scoring logic for Margar is in Shape.
 * Kept pure so it can be used identically on any page (dashboard, classement, historique…).
 */

export type CheckinForScoring = {
  alimentation: string    // 'super_healthy' | 'ca_va' | 'faute'
  nb_verres_alcool: number
  has_activity: boolean   // at least one activity row for this checkin
}

/**
 * Points earned for a single day's check-in.
 * Max = 4 pts  (sport + super_healthy + no alcohol)
 *
 *   +1  at least one sport activity done
 *   +2  alimentation === 'super_healthy'
 *   +1  alimentation === 'ca_va'
 *   +0  alimentation === 'faute'
 *   +1  nb_verres_alcool === 0
 */
export function scoreDayCheckin(c: CheckinForScoring): number {
  let score = 0
  if (c.has_activity) score += 1
  if (c.alimentation === 'super_healthy') score += 2
  else if (c.alimentation === 'ca_va') score += 1
  if (c.nb_verres_alcool === 0) score += 1
  return score
}

/** Monthly score = sum of all daily scores. */
export function computeMonthlyScore(checkins: CheckinForScoring[]): number {
  return checkins.reduce((total, c) => total + scoreDayCheckin(c), 0)
}

export type MemberScore = {
  profileId: string
  prenom: string
  score: number
}

/** Returns a new array sorted by score descending. */
export function rankMembers(members: MemberScore[]): MemberScore[] {
  return [...members].sort((a, b) => b.score - a.score)
}
