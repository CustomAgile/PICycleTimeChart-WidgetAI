/**
 * Storybook preview config — theme and density toggles.
 */

import type { Preview } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import '@customagile/widget-ai/styles/rally-app-tokens.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' as const },
          { value: 'dark', title: 'Dark', icon: 'moon' as const },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Layout density',
      toolbar: {
        title: 'Density',
        icon: 'bottombar',
        items: [
          { value: 'comfortable', title: 'Comfortable', icon: 'grow' as const },
          { value: 'compact', title: 'Compact', icon: 'collapse' as const },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    density: 'comfortable',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      const density = context.globals.density || 'comfortable';

      useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        if (density === 'compact') {
          root.setAttribute('data-density', 'compact');
        } else {
          root.removeAttribute('data-density');
        }
      }, [theme, density]);

      return (
        <div
          data-theme={theme}
          data-density={density === 'compact' ? 'compact' : undefined}
          style={{
            padding: 'var(--ca-space-4)',
            backgroundColor: 'var(--ca-surface-page)',
            color: 'var(--ca-text-primary)',
            fontFamily: 'var(--ca-font-family)',
            fontSize: 'var(--ca-font-size-base)',
            minHeight: '100px',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
