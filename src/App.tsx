/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import '@customagile/widget-ai/styles/rally-app-tokens.css';

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { AppHeader } from '@customagile/widget-ai/components/AppHeader';
import { EditModePanel, SettingRow } from '@customagile/widget-ai/components/EditModePanel';
import { useWidgetSettings, defineWidgetSettings } from '@customagile/widget-ai/components/settings';
import { RallyChart } from '@customagile/widget-ai/components/RallyChart';
import type { ChartData, ChartOptions } from 'chart.js';

import type {
  PiCycleTimeDataProvider,
  PiCycleTimeData,
  PiCycleTimeSettings,
} from './types';
import {
  PI_TYPE_OPTIONS,
  BUCKET_BY_OPTIONS,
} from './types';

// ── Settings defaults ──────────────────────────────────────────────────

const SETTINGS_DEFAULTS = defineWidgetSettings<PiCycleTimeSettings>({
  type:       'portfolioitem/feature',
  bucketBy:   'month',
  numBuckets: 10,
  query:      '',
});

// ── Colors (colorblind-safe: no red/green adjacency) ──────────────────

const IQR_COLOR        = '#0076c0';   // CA Blue — IQR bar fill
const IQR_BORDER_COLOR = '#004f82';   // Darker blue for bar border
const MEDIAN_COLOR     = '#003d66';   // Very dark blue for median line

// ── App Props ──────────────────────────────────────────────────────────

interface AppProps {
  rallyContext: RallyContext;
  data: PiCycleTimeDataProvider;
}

// ── Chart construction ─────────────────────────────────────────────────

/**
 * Build Chart.js data for a whisker chart.
 *
 * Axis approach: category x-axis (string bucket labels), linear y-axis.
 * No date adapter required — avoids the chart.js missing-adapter trap.
 *
 * The "whisker" effect is achieved with two overlaid datasets:
 *  1. Floating bar: [p25, p75] — the IQR box
 *  2. Scatter points at the median — rendered as a wide flat marker
 *
 * Chart.js floating bars accept `[min, max]` as the data value when the
 * dataset `type` is `bar` and x-axis is categorical. This is a built-in
 * Chart.js 4.x feature — no plugins needed.
 */
function buildChartData(piData: PiCycleTimeData): ChartData {
  const labels = piData.buckets.map((b) => b.label);

  return {
    labels,
    datasets: [
      // IQR floating bar (p25 → p75)
      {
        type:            'bar' as const,
        label:           'IQR (25th–75th percentile)',
        data:            piData.buckets.map((b) => [b.p25, b.p75]),
        backgroundColor: IQR_COLOR + '66',   // 40% opacity
        borderColor:     IQR_BORDER_COLOR,
        borderWidth:     1,
        borderSkipped:   false,
        barPercentage:   0.5,
        categoryPercentage: 0.7,
      } as unknown as import('chart.js').ChartDataset,

      // Median tick — scatter point drawn wide
      {
        type:            'scatter' as const,
        label:           'Median',
        data:            piData.buckets.map((b, i) => ({ x: i, y: b.median })),
        backgroundColor: MEDIAN_COLOR,
        borderColor:     MEDIAN_COLOR,
        pointStyle:      'line' as const,
        pointRadius:     16,
        pointBorderWidth: 3,
        rotation:        90,  // rotate so the line marker is horizontal
      } as unknown as import('chart.js').ChartDataset,
    ],
  };
}

function buildChartOptions(piData: PiCycleTimeData): ChartOptions {
  const maxDays =
    piData.buckets.length > 0
      ? Math.ceil(Math.max(...piData.buckets.map((b) => b.p75)) * 1.15)
      : 100;

  return {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display:  true,
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          // Show all stats for the hovered bucket
          beforeBody: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx == null || idx >= piData.buckets.length) return [];
            const b = piData.buckets[idx];
            return [
              `Median:  ${b.median.toFixed(1)} days`,
              `75th pct: ${b.p75.toFixed(1)} days`,
              `25th pct: ${b.p25.toFixed(1)} days`,
              `Count:   ${b.count} items`,
            ];
          },
          label: () => '',  // suppress per-dataset default label
        },
      },
    },
    scales: {
      x: {
        type:  'category' as const,
        title: {
          display: true,
          text:    'Time Period',
        },
      },
      y: {
        type:  'linear' as const,
        min:   0,
        max:   maxDays,
        title: {
          display: true,
          text:    'Cycle Time (days)',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };
}

// ── App component ──────────────────────────────────────────────────────

export default function App({ rallyContext, data }: AppProps) {
  // ── Settings ────────────────────────────────────────────────────────
  const { settings, updateSetting, updateSettings } = useWidgetSettings<PiCycleTimeSettings>(
    rallyContext,
    SETTINGS_DEFAULTS,
  );

  // ── Data fetch ───────────────────────────────────────────────────────
  const [piData, setPiData] = useState<PiCycleTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const settingsKey = JSON.stringify(settings);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    data
      .fetchBuckets(settings)
      .then((result) => {
        if (!cancelled) {
          setPiData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load PI cycle time data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, settingsKey, tick]);

  // ── Chart data ───────────────────────────────────────────────────────
  const chartData: ChartData | undefined = piData ? buildChartData(piData) : undefined;
  const chartOptions: ChartOptions = piData ? buildChartOptions(piData) : {};

  // ── EditMode ─────────────────────────────────────────────────────────
  if (rallyContext.isEditMode) {
    return (
      <EditModePanel
        appName="PI Cycle Time Chart"
        version="0.1.0"
        appSlug="pi-cycle-time-chart"
        settings={settings as unknown as Record<string, unknown>}
        onSave={(dirty: Partial<PiCycleTimeSettings>) => updateSettings(dirty)}
        onClose={() => { /* Rally controls EditMode exit */ }}
      >
        <SettingRow label="Portfolio Item Type" settingKey="type">
          <select
            value={settings.type}
            onChange={(e) => updateSetting('type', e.target.value as PiCycleTimeSettings['type'])}
            style={selectStyle}
          >
            {PI_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Bucket By" settingKey="bucketBy">
          <select
            value={settings.bucketBy}
            onChange={(e) => updateSetting('bucketBy', e.target.value as PiCycleTimeSettings['bucketBy'])}
            style={selectStyle}
          >
            {BUCKET_BY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Number of Buckets" settingKey="numBuckets">
          <input
            type="number"
            min={1}
            max={52}
            value={settings.numBuckets}
            onChange={(e) => updateSetting('numBuckets', parseInt(e.target.value, 10) || 10)}
            style={{ ...inputStyle, width: '80px' }}
          />
        </SettingRow>

        <SettingRow label="Query (optional WSAPI filter)" settingKey="query">
          <input
            type="text"
            value={settings.query}
            onChange={(e) => updateSetting('query', e.target.value)}
            placeholder='e.g. (State = "Accepted")'
            style={inputStyle}
          />
        </SettingRow>
      </EditModePanel>
    );
  }

  // ── View mode ────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display:         'flex',
        flexDirection:   'column',
        height:          '100%',
        fontFamily:      'var(--ca-font-family)',
        backgroundColor: 'var(--ca-surface-page)',
        color:           'var(--ca-text-primary)',
        overflow:        'hidden',
      }}
    >
      <AppHeader
        title="PI Cycle Time Chart"
        help={{
          content: (
            <>
              <p>
                This chart shows the distribution of Portfolio Item cycle times grouped into
                time buckets. Cycle time is the number of calendar days between
                <strong> Actual Start Date</strong> and <strong>Actual End Date</strong>.
              </p>
              <p>
                Each bucket shows the <strong>median</strong> (horizontal tick) and the
                <strong> interquartile range</strong> (25th–75th percentile bar).
                Only items with both dates recorded are included.
              </p>
              <p>
                Use Edit Mode to change the Portfolio Item type, bucket granularity,
                number of buckets shown, and an optional WSAPI query filter.
                Up to 2,000 items are fetched; a warning appears if the limit is hit.
              </p>
            </>
          ),
        }}
      >
        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh chart data"
          title="Refresh"
          style={refreshButtonStyle(loading)}
        >
          Refresh
        </button>
      </AppHeader>

      {/* Fetch-cap warning */}
      {piData?.capped && !loading && (
        <div
          role="alert"
          style={bannerStyle('var(--ca-status-yellow-bg, #fff8e1)', 'var(--ca-text-primary)')}
        >
          <strong>Note:</strong> The 2,000-item fetch limit was reached
          ({piData.totalFetched} items). Some periods may be incomplete.
          Refine your query or reduce scope for full accuracy.
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={bannerStyle('var(--ca-status-red-bg)', 'var(--ca-status-red)')}
        >
          Error loading PI cycle time data: {error}
        </div>
      )}

      {/* Chart */}
      <div style={{ flex: 1, padding: 'var(--ca-space-2)', overflow: 'hidden' }}>
        <RallyChart
          type="bar"
          data={chartData}
          loading={loading}
          error={error}
          options={chartOptions}
          height={480}
          emptyMessage="No portfolio items with both Actual Start Date and Actual End Date were found for the current settings."
        />
      </div>

      {/* Bucket item-count legend */}
      {piData && piData.buckets.length > 0 && !loading && (
        <div
          style={{
            padding:       'var(--ca-space-1) var(--ca-space-2)',
            fontSize:      'var(--ca-font-size-xs)',
            color:         'var(--ca-text-secondary)',
            borderTop:     '1px solid var(--ca-border-default)',
            display:       'flex',
            gap:           'var(--ca-space-3)',
            flexWrap:      'wrap',
          }}
        >
          {piData.buckets.map((b) => (
            <span key={b.label}>
              {b.label}: {b.count} item{b.count !== 1 ? 's' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  padding:         '4px 8px',
  fontSize:        'var(--ca-font-size-sm)',
  color:           'var(--ca-text-primary)',
  backgroundColor: 'var(--ca-surface-raised)',
  border:          '1px solid var(--ca-border-default)',
  borderRadius:    'var(--ca-radius-xs)',
};

const inputStyle: React.CSSProperties = {
  width:           '100%',
  boxSizing:       'border-box',
  padding:         '4px 8px',
  fontSize:        'var(--ca-font-size-sm)',
  color:           'var(--ca-text-primary)',
  backgroundColor: 'var(--ca-surface-raised)',
  border:          '1px solid var(--ca-border-default)',
  borderRadius:    'var(--ca-radius-xs)',
};

function refreshButtonStyle(loading: boolean): React.CSSProperties {
  return {
    padding:         '4px 10px',
    fontSize:        'var(--ca-font-size-sm)',
    color:           'var(--ca-text-primary)',
    backgroundColor: 'var(--ca-surface-raised)',
    border:          '1px solid var(--ca-border-default)',
    borderRadius:    'var(--ca-radius-xs)',
    cursor:          loading ? 'default' : 'pointer',
    opacity:         loading ? 0.6 : 1,
  };
}

function bannerStyle(bg: string, color: string): React.CSSProperties {
  return {
    margin:       'var(--ca-space-2)',
    padding:      'var(--ca-space-2)',
    backgroundColor: bg,
    color,
    borderRadius: 'var(--ca-radius-sm)',
    fontSize:     'var(--ca-font-size-sm)',
  };
}
