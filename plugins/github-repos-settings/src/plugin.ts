import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const githubReposSettingsPlugin = createPlugin({
  id: 'github-repos-settings',
  routes: {
    root: rootRouteRef,
  },
});

export const GithubReposSettingsPage = githubReposSettingsPlugin.provide(
  createRoutableExtension({
    name: 'GithubReposSettingsPage',
    component: () =>
      import('./components/GithubSettingsComponent').then(m => m.GithubSettingsComponent),
    mountPoint: rootRouteRef,
  }),
);
