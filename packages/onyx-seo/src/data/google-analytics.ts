// ============================================================
// packages/onyx-seo/src/data/google-analytics.ts
// Google Analytics 4 Data API integration
// GOOGLE_ANALYTICS_KEY — user-provided, operator cost: $0
// ============================================================

import type { PagePerformance } from "../types.js";

const BASE_URL = "https://analyticsdata.googleapis.com/v1beta";

function getKey(): string {
  const key = process.env.GOOGLE_ANALYTICS_KEY;
  if (!key) throw new Error("GOOGLE_ANALYTICS_KEY is not set in environment");
  return key;
}

function getPropertyId(): string {
  const id = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!id)
    throw new Error(
      "GOOGLE_ANALYTICS_PROPERTY_ID is not set in environment"
    );
  return id;
}

/**
 * Fetches page-level performance metrics from Google Analytics 4.
 * Uses the GA4 Data API runReport endpoint.
 */
export async function getPagePerformance(
  url: string
): Promise<PagePerformance> {
  const key = getKey();
  const propertyId = getPropertyId();

  let pagePath: string;
  try {
    pagePath = new URL(url).pathname;
  } catch {
    pagePath = url;
  }

  const body = {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "sessions" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
    ],
    dimensionFilter: {
      filter: {
        fieldName: "pagePath",
        stringFilter: { matchType: "EXACT", value: pagePath },
      },
    },
  };

  const res = await fetch(
    `${BASE_URL}/properties/${propertyId}:runReport?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API error ${res.status}: ${err}`);
  }

  const data = await res.json();

  if (!data.rows || data.rows.length === 0) {
    return { sessions: 0, bounce: 0, avgTime: 0 };
  }

  const row = data.rows[0];
  return {
    sessions: parseFloat(row.metricValues?.[0]?.value ?? "0"),
    bounce: parseFloat(row.metricValues?.[1]?.value ?? "0"),
    avgTime: parseFloat(row.metricValues?.[2]?.value ?? "0"),
  };
}