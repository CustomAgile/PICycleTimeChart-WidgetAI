/**
 * Storybook config for Widget AI components.
 *
 * Loads stories from the installed @customagile/widget-ai package
 * so you can browse all widget-ai components locally.
 *
 * Run: npm run storybook
 */

import type { StorybookConfig } from '@storybook/react-vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    // widget-ai component stories and MDX docs from the installed package
    '../node_modules/@customagile/widget-ai/**/*.stories.@(ts|tsx|mdx)',
    // Your own stories (add .stories.tsx or .stories.mdx files in src/)
    '../src/**/*.stories.@(ts|tsx|mdx)',
  ],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@customagile/widget-ai': resolve(__dirname, '..', 'node_modules/@customagile/widget-ai'),
      '@widget-sdk': resolve(__dirname, '..', 'node_modules/@customagile/widget-ai'),
    };
    return config;
  },
};

export default config;
