export type UserEntitlementState = {
  programmeAccess?: 'NONE' | 'PAYMENT_PENDING' | 'ACTIVE' | 'COMPLETED'
  programmeId?: string
  trackId?: string
  cohortId?: string
  partnerStatus?: 'NONE' | 'PENDING' | 'ACTIVE'
}

export function canAccessLearning(user: UserEntitlementState) {
  return user.programmeAccess === 'ACTIVE' || user.programmeAccess === 'COMPLETED'
}

export function canAccessClass(user: UserEntitlementState, item?: { programmeId?: string; trackId?: string; cohortId?: string }) {
  if (!canAccessLearning(user)) return false
  if (!item) return true
  return (!item.programmeId || item.programmeId === user.programmeId) && (!item.trackId || item.trackId === user.trackId) && (!item.cohortId || item.cohortId === user.cohortId)
}

export function canAccessProject(user: UserEntitlementState, item?: { programmeId?: string; trackId?: string }) {
  if (!canAccessLearning(user)) return false
  if (!item) return true
  return (!item.programmeId || item.programmeId === user.programmeId) && (!item.trackId || item.trackId === user.trackId)
}

export function canAccessPartnerResources(user: UserEntitlementState) {
  return user.partnerStatus === 'ACTIVE'
}

export function canRequestPartnerPayout(user: UserEntitlementState) {
  return user.partnerStatus === 'ACTIVE'
}
