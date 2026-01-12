// Review period display names mapping
export const reviewPeriodLabels: Record<string, string> = {
  'DAILY': 'Daily',
  'DAILY_WEEKLY': 'Daily/Weekly',
  'WEEKLY': 'Weekly',
  'WEEKLY_MONTHLY': 'Weekly/Monthly',
  'MONTHLY': 'Monthly',
  'REGULAR': 'Regular',
  'REGULAR_MONTHLY': 'Regular - meeting monthly',
  'MONTHLY_QUARTERLY': 'Monthly/Quarterly',
  'QUARTERLY': 'Quarterly',
  'HALF_YEARLY_QUARTERLY': 'Half yearly/Quarterly',
  'QUARTERLY_HALFYEARLY_ANNUALLY': 'Quarterly/Halfyearly/Annually',
  'ANNUALLY': 'Annually',
};

export const reviewPeriodOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'DAILY_WEEKLY', label: 'Daily/Weekly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'WEEKLY_MONTHLY', label: 'Weekly/Monthly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'REGULAR_MONTHLY', label: 'Regular - meeting monthly' },
  { value: 'MONTHLY_QUARTERLY', label: 'Monthly/Quarterly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY_QUARTERLY', label: 'Half yearly/Quarterly' },
  { value: 'QUARTERLY_HALFYEARLY_ANNUALLY', label: 'Quarterly/Halfyearly/Annually' },
  { value: 'ANNUALLY', label: 'Annually' },
];

export const getReviewPeriodLabel = (period: string): string => {
  return reviewPeriodLabels[period] || period;
};

