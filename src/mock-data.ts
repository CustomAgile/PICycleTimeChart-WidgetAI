/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type { PiCycleTimeDataProvider, PiCycleTimeData } from './types';

// ── Mock bucket data ───────────────────────────────────────────────────
//
// Eight monthly buckets representing realistic Feature cycle times
// across a 8-month project window. Values are in calendar days.
// Distribution: median ~30–60 days, with the 25th–75th percentile
// whiskers spanning ±10–20 days around the median.

const MOCK_BUCKETS_DATA: PiCycleTimeData = {
  buckets: [
    {
      label:  'Oct 2024',
      median: 62,
      p25:    42,
      p75:    85,
      count:  14,
    },
    {
      label:  'Nov 2024',
      median: 55,
      p25:    38,
      p75:    74,
      count:  18,
    },
    {
      label:  'Dec 2024',
      median: 48,
      p25:    31,
      p75:    68,
      count:  11,
    },
    {
      label:  'Jan 2025',
      median: 43,
      p25:    29,
      p75:    61,
      count:  22,
    },
    {
      label:  'Feb 2025',
      median: 37,
      p25:    24,
      p75:    55,
      count:  19,
    },
    {
      label:  'Mar 2025',
      median: 52,
      p25:    33,
      p75:    71,
      count:  25,
    },
    {
      label:  'Apr 2025',
      median: 41,
      p25:    26,
      p75:    58,
      count:  17,
    },
    {
      label:  'May 2025',
      median: 34,
      p25:    21,
      p75:    49,
      count:  21,
    },
  ],
  capped:       false,
  totalFetched: 147,
};

// ── Mock provider ──────────────────────────────────────────────────────

export const mockProvider: PiCycleTimeDataProvider = {
  fetchBuckets: async (_settings) => {
    // Simulate async delay so loading states are visible in dev
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_BUCKETS_DATA;
  },
};

// ── Mock context ───────────────────────────────────────────────────────

export const mockContext: RallyContext = {
  ...DEFAULT_RALLY_CONTEXT,
  User: {
    _ref:          '/user/999',
    DisplayName:   'Mock User',
    EmailAddress:  'mock@example.com',
    UserName:      'mockuser',
    ObjectID:      999,
  },
  WidgetName:  'PI Cycle Time Chart',
  WidgetUUID:  'mock-pi-cycle-time-uuid',
  isEditMode:  false,
  Settings: {
    type:       'portfolioitem/feature',
    bucketBy:   'month',
    numBuckets: '8',
    query:      '',
  },
};
