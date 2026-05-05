/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { WidgetSettings } from '@customagile/widget-ai/components/settings';

// ── Bucket-by options ──────────────────────────────────────────────────

export const BUCKET_BY_OPTIONS = [
  { value: 'month',   label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year',    label: 'Year' },
] as const;

export type BucketBy = typeof BUCKET_BY_OPTIONS[number]['value'];

// ── Portfolio item type options ────────────────────────────────────────

export const PI_TYPE_OPTIONS = [
  { value: 'portfolioitem/feature',     label: 'Feature' },
  { value: 'portfolioitem/epic',        label: 'Epic' },
  { value: 'portfolioitem/initiative',  label: 'Initiative' },
] as const;

export type PiType = typeof PI_TYPE_OPTIONS[number]['value'];

// ── Bucket statistics ──────────────────────────────────────────────────

/**
 * Percentile-based statistics for one x-axis bucket.
 * Cycle time is measured in calendar days.
 */
export interface BucketStats {
  /** Human-readable label for the bucket (e.g. "Jan 2025", "Q1 2025") */
  label: string;
  /** Median cycle time in days */
  median: number;
  /** 25th-percentile cycle time in days */
  p25: number;
  /** 75th-percentile cycle time in days */
  p75: number;
  /** Number of portfolio items that contributed to this bucket */
  count: number;
}

// ── Top-level data payload ─────────────────────────────────────────────

export interface PiCycleTimeData {
  /** Ordered list of time buckets for the chart x-axis */
  buckets: BucketStats[];
  /** True when the fetch cap (2000 items) was hit — UI should show a warning */
  capped: boolean;
  /** Total items fetched before bucketing */
  totalFetched: number;
}

// ── App settings ───────────────────────────────────────────────────────

export interface PiCycleTimeSettings extends WidgetSettings {
  /** WSAPI portfolio item type path */
  type: PiType;
  /** How to group items on the x-axis */
  bucketBy: BucketBy;
  /** How many buckets to show (most-recent N) */
  numBuckets: number;
  /** Optional WSAPI query to narrow the dataset */
  query: string;
}

// ── DataProvider interface ─────────────────────────────────────────────

export interface PiCycleTimeDataProvider {
  /**
   * Fetch portfolio items that have both ActualStartDate and ActualEndDate,
   * compute per-bucket cycle-time statistics, and return them in chronological
   * bucket order (oldest → newest).
   */
  fetchBuckets(settings: PiCycleTimeSettings): Promise<PiCycleTimeData>;
}
