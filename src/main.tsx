/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 *
 * PI Cycle Time Chart — entry point.
 *
 * In Rally: $RallyContext is injected by the Custom HTML Widget iframe.
 * In dev/debug: $RallyContext may be defined in the HTML before this script loads.
 *
 * Mock mode is controlled by __USE_MOCK__ (build-time constant) or
 * falls back to ?mock=true in the URL (dev server only).
 */

import '@customagile/widget-ai/styles/rally-app-tokens.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import App from './App';

// Injected by the Rally Custom HTML Widget iframe
declare const $RallyContext: RallyContext | undefined;

const params = new URLSearchParams(window.location.search);

// Default to mock in dev when __USE_MOCK__ is undefined (matches wsjf-grid pattern).
// Build-time __USE_MOCK__ flag overrides; ?live=true forces live mode in dev.
const useMock: boolean =
  typeof __USE_MOCK__ !== 'undefined'
    ? __USE_MOCK__
    : !params.has('live');

async function main() {
  let rallyContext: RallyContext;
  let data;

  if (useMock) {
    const { mockProvider, mockContext } = await import('./mock-data');
    rallyContext = {
      ...mockContext,
      isEditMode: params.get('editMode') === 'true',
    };
    data = mockProvider;
  } else {
    const { createRallyProvider } = await import('./data-provider');
    rallyContext = (typeof $RallyContext !== 'undefined')
      ? $RallyContext
      : {
          ...DEFAULT_RALLY_CONTEXT,
          Url: { origin: window.location.origin, href: window.location.href },
          User: { _ref: '', DisplayName: 'Dev User', EmailAddress: '', UserName: 'dev', ObjectID: 0 },
          WidgetName: 'PI Cycle Time Chart',
          WidgetUUID: 'dev-uuid',
          isEditMode: params.get('editMode') === 'true',
        };
    data = createRallyProvider(rallyContext);
  }

  const container = document.getElementById('root');
  if (!container) throw new Error('Root element not found');

  createRoot(container).render(
    <App rallyContext={rallyContext} data={data} />,
  );
}

main().catch((err) => {
  console.error('[pi-cycle-time-chart] startup error', err);
});
