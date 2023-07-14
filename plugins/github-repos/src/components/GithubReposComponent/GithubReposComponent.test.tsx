import React from 'react';
import { GithubReposComponent } from './GithubReposComponent';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from "@backstage/test-utils";

describe('GithubReposComponent', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render', async () => {
    await renderInTestApp(<GithubReposComponent />);
    expect(screen.getByText('Welcome to github-repos!')).toBeInTheDocument();
  });
});
