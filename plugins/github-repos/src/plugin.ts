import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const githubReposPlugin = createPlugin({
  id: 'github-repos',
  routes: {
    root: rootRouteRef,
  },
});

export const GithubReposPage = githubReposPlugin.provide(
  createRoutableExtension({
    name: 'GithubReposPage',
    component: () =>
      import('./components/GithubReposComponent').then(m => m.GithubReposComponent),
    mountPoint: rootRouteRef,
  }),
);
