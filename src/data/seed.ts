/*
 * Demo data now lives in the backend (backend/src/seed). This file only keeps
 * the stand-in values for last month's inventory KPIs on the overview page.
 */

/**
 * Demo baseline for the "previous period" side of inventory KPI trends.
 * Live stock records have no history yet, so these values stand in for last month.
 */
export const previousPeriodBaseline = {
  products: 21,
  lowStock: 5,
  expiringSoon: 7,
};
