import { githubReposSettingsPlugin } from './plugin';

describe('github-repos-settings', () => {
  it('should export plugin', () => {
    expect(githubReposSettingsPlugin).toBeDefined();
  });
});
