/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { wsapiQueryAll } from '@customagile/widget-ai/data/wsapi';
import type { ArtifactTypeKey } from '@customagile/widget-ai/types/rally-registry';
import type {
  PiCycleTimeDataProvider,
  PiCycleTimeData,
  PiCycleTimeSettings,
  BucketStats,
  BucketBy,
} from './types';

// ── Constants ──────────────────────────────────────────────────────────

const FETCH_LIMIT = 2000;

const FETCH_FIELDS =
  'ObjectID,FormattedID,Name,ActualStartDate,ActualEndDate';

// ── Raw portfolio item shape from WSAPI ────────────────────────────────

interface RawPiItem {
  ObjectID: number;
  FormattedID: string;
  Name: string;
  ActualStartDate: string | null;
  ActualEndDate: string | null;
}

// ── Date bucketing helpers ─────────────────────────────────────────────

/**
 * Return a stable bucket key and display label for a given date.
 * The key sorts lexicographically in chronological order.
 */
function bucketKeyAndLabel(date: Date, bucketBy: BucketBy): { key: string; label: string } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-based

  if (bucketBy === 'month') {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return { key, label: `${monthNames[month]} ${year}` };
  }

  if (bucketBy === 'quarter') {
    const q = Math.floor(month / 3) + 1;
    const key = `${year}-Q${q}`;
    return { key, label: `Q${q} ${year}` };
  }

  // year
  return { key: String(year), label: String(year) };
}

// ── Percentile helper ──────────────────────────────────────────────────

/**
 * Compute a percentile from a sorted array of numbers.
 * Uses linear interpolation (same as Excel PERCENTILE.INC).
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}

// ── Core bucketing logic ───────────────────────────────────────────────

function computeBuckets(
  items: RawPiItem[],
  settings: PiCycleTimeSettings,
): BucketStats[] {
  const { bucketBy, numBuckets } = settings;

  // Build a map: bucketKey → sorted list of cycle-time days
  const bucketMap = new Map<string, { label: string; days: number[] }>();

  for (const item of items) {
    if (!item.ActualStartDate || !item.ActualEndDate) continue;

    const start = new Date(item.ActualStartDate);
    const end = new Date(item.ActualEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    const cycleDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (cycleDays < 0) continue; // skip data anomalies

    const { key, label } = bucketKeyAndLabel(end, bucketBy);
    let bucket = bucketMap.get(key);
    if (!bucket) {
      bucket = { label, days: [] };
      bucketMap.set(key, bucket);
    }
    bucket.days.push(cycleDays);
  }

  // Sort keys chronologically (they're lexicographically sortable by design)
  const sortedKeys = [...bucketMap.keys()].sort();

  // Take the most-recent numBuckets
  const recentKeys = sortedKeys.slice(-numBuckets);

  return recentKeys.map((key) => {
    const { label, days } = bucketMap.get(key)!;
    const sorted = [...days].sort((a, b) => a - b);
    return {
      label,
      median: percentile(sorted, 0.5),
      p25:    percentile(sorted, 0.25),
      p75:    percentile(sorted, 0.75),
      count:  sorted.length,
    };
  });
}

// ── Provider factory ───────────────────────────────────────────────────

export function createRallyProvider(ctx: RallyContext): PiCycleTimeDataProvider {
  return {
    async fetchBuckets(settings: PiCycleTimeSettings): Promise<PiCycleTimeData> {
      const workspaceRef =
        typeof ctx.GlobalScope.Workspace === 'string'
          ? ctx.GlobalScope.Workspace
          : (ctx.GlobalScope.Workspace as { _ref?: string })?._ref;

      const projectRef =
        typeof ctx.GlobalScope.Project === 'string'
          ? ctx.GlobalScope.Project
          : (ctx.GlobalScope.Project as { _ref?: string })?._ref;

      // Build query: must have both dates; optionally add user query
      const dateFilter = '((ActualStartDate != null) AND (ActualEndDate != null))';
      const fullQuery = settings.query?.trim()
        ? `((${dateFilter}) AND (${settings.query.trim()}))`
        : dateFilter;

      const raw = await wsapiQueryAll(settings.type as ArtifactTypeKey, {
        fetch: FETCH_FIELDS,
        query: fullQuery,
        workspace: workspaceRef || undefined,
        project: projectRef || undefined,
        projectScopeDown: ctx.GlobalScope.ProjectScopeDown,
        order: 'ActualEndDate ASC',
        pagesize: FETCH_LIMIT,
      }) as unknown as RawPiItem[];

      const capped = raw.length >= FETCH_LIMIT;
      const buckets = computeBuckets(raw, settings);

      return {
        buckets,
        capped,
        totalFetched: raw.length,
      };
    },
  };
}
