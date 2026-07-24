export type SubscriptionPlan = {
  id: string
  name: string
  months: number
  amount: number
  currency: 'INR'
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  plan_12: { id: 'plan_12', name: '12 months', months: 12, amount: 5999, currency: 'INR' },
  plan_24: { id: 'plan_24', name: '24 months', months: 24, amount: 10999, currency: 'INR' },
  plan_36: { id: 'plan_36', name: '36 months', months: 36, amount: 20999, currency: 'INR' }
}

export function addPlanMonths(start: Date, months: number) {
  const result = new Date(start)
  const originalDay = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const finalDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(originalDay, finalDay))
  return result
}
