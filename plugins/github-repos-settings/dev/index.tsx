import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { githubReposSettingsPlugin, GithubReposSettingsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(githubReposSettingsPlugin)
  .addPage({
    element: <GithubReposSettingsPage />,
    title: 'Root Page',
    path: '/github-repos-settings'
  })
  .render();
