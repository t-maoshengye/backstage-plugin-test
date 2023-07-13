import { githubReposPlugin } from './plugin';

describe('github-repos', () => {
  it('should export plugin', () => {
    expect(githubReposPlugin).toBeDefined();
  });
});
