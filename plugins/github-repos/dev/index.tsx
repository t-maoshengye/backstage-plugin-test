import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { githubReposPlugin, GithubReposPage } from '../src/plugin';

createDevApp()
  .registerPlugin(githubReposPlugin)
  .addPage({
    element: <GithubReposPage />,
    title: 'Root Page',
    path: '/github-repos'
  })
  .render();
