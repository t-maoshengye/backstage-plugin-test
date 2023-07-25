import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Snackbar,
} from '@material-ui/core';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { Octokit } from '@octokit/rest';

const useStyles = makeStyles({
  avatar: {
    height: 32,
    width: 32,
    borderRadius: '50%',
  },
});

type Repo = {
  name: string; // Repo name
  html_url: string; // Repo URL
  description: string | null; // Repo description
  owner: {
    // Repo owner avatar
    login: string;
    avatar_url: string;
    html_url: string;
  };
};

type DenseTableProps = {
  repos: Repo[];
};

let gh_token = 'ghp_';
let target_file = '.gitignore';

export const DenseTable = ({ repos }: DenseTableProps) => {
  const classes = useStyles();

  // > For handling pop-up edit boxes
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [currentRepo, setCurrentRepo] = useState<Repo | null>(null);
  const [fileSha, setFileSha] = useState<string | null>(null);

  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);

  const handleOpen = async (repo: Repo) => {
    try {
      // Remember the current repository.
      // For edit save button
      setCurrentRepo(repo);

      const octokit = new Octokit({ auth: gh_token });
      const response = await octokit.repos.getContent({
        owner: repo.owner.login,
        repo: repo.name,
        path: target_file,
      });

      if (response.status !== 200) {
        throw new Error(`GitHub API request failed: ${response.status}`);
      }

      const content = Buffer.from(response.data.content, 'base64').toString();
      setDialogContent(content);

      const fileSha = response.data.sha;
      setFileSha(fileSha);

      setOpen(true);
    } catch (e: any) {
      setOpen(true);
      setError(e.message);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleSave = async (repo: Repo) => {
    try {
      const octokit = new Octokit({ auth: gh_token });

      const now = new Date();
      const timestamp =
        now.getFullYear() +
        '' +
        (now.getMonth() + 1) +
        '' +
        now.getDate() +
        '' +
        now.getHours() +
        '' +
        now.getMinutes() +
        '' +
        now.getSeconds();
      const message = `Update ${target_file} by Backstage at ${timestamp}`;

      await octokit.repos.createOrUpdateFileContents({
        owner: repo.owner.login,
        repo: repo.name,
        path: target_file,
        message: message,
        content: Buffer.from(dialogContent).toString('base64'),
        sha: fileSha,
      });
      console.log(message);
      setOpenSuccessSnackbar(true);
      handleClose();
    } catch (e) {
      setOpen(true);
      setError(e.message);
    }
  };

  const handleSaveBranchPR = async (repo: Repo) => {
    try {
      const octokit = new Octokit({ auth: gh_token });

      const now = new Date();
      const timestamp =
        now.getFullYear() +
        '' +
        (now.getMonth() + 1) +
        '' +
        now.getDate() +
        '' +
        now.getHours() +
        '' +
        now.getMinutes() +
        '' +
        now.getSeconds();

      // get default branch
      const { data: repoData } = await octokit.repos.get({
        owner: repo.owner.login,
        repo: repo.name,
      });
      const defaultBranch = String(repoData.default_branch);

      // Get the SHA of the latest commit on the base branch
      const { data: refData } = await octokit.git.getRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${defaultBranch}`,
      });
      const baseSha = refData.object.sha;
  
      // Create new branch
      const newBranchName = `create-by-backstage-${timestamp}`;
      await octokit.git.createRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `refs/heads/${newBranchName}`,
        sha: baseSha,
      });

      // Get file sha from new branch
      const { data: fileData } = await octokit.repos.getContent({
        owner: repo.owner.login,
        repo: repo.name,
        path: target_file,
        ref: newBranchName
      });

      // Update file in the new branch
      const message = `Update ${target_file} by Backstage at ${timestamp}`;
      await octokit.repos.createOrUpdateFileContents({
        owner: repo.owner.login,
        repo: repo.name,
        path: target_file,
        message: message,
        content: Buffer.from(dialogContent).toString('base64'),
        sha: fileData.sha,
        branch: newBranchName,
      });

      // Create pull request
      await octokit.pulls.create({
        owner: repo.owner.login,
        repo: repo.name,
        title: `pr-by-backstage-${timestamp}`,
        head: newBranchName,
        base: 'main',
      });
  
      // console.log('New branch and pull request created successfully.');
      setOpenSuccessSnackbar(true);
      handleClose();
    } catch (e) {
      console.error('Failed to create new branch and pull request:', e);
    }
  };
  // < For handling pop-up edit boxes

  const columns: TableColumn[] = [
    { title: '', field: 'avatar', width: '5%' },
    { title: 'Name', field: 'name', width: '25%' },
    { title: 'URL', field: 'html_url', width: '35%' },
    { title: 'Description', field: 'description' },
  ];

  const data = repos.map(repo => {
    return {
      id: repo.name,
      avatar: (
        <a href={repo.owner.html_url} target="_blank" rel="noopener noreferrer">
          <img
            src={repo.owner.avatar_url}
            className={classes.avatar}
            alt={repo.owner.login}
          />
        </a>
      ),
      // > Click pops up edit box
      name: (
        <a href="#" onClick={() => handleOpen(repo)}>
          {repo.name}
        </a>
      ),
      // < Click pops up edit box
      html_url: (
        <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
          {repo.html_url}
        </a>
      ),
      description: repo.description,
    };
  });

  return (
    <>
      <Table
        title="GitHub Repositories"
        options={{
          search: true,
          paging: true,
          pageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
        columns={columns}
        data={data}
      />
      {/* > For handling pop-up edit boxes */}
      <Dialog open={open} onClose={handleClose} fullWidth={true}>
        {error ? (
          <>
            <DialogTitle>Error</DialogTitle>
            <DialogContent>
              <p>{error}</p>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>Edit .gitignore</DialogTitle>
            <DialogContent>
              <TextField
                multiline
                minRows={10}
                fullWidth
                value={dialogContent}
                onChange={e => setDialogContent(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={() => handleSave(currentRepo)} color="primary">
                Save
              </Button>
              <Button onClick={() => handleSaveBranchPR(currentRepo)} color="primary">
                Save to new branch and pull request
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      {/* < For handling pop-up edit boxes */}

      <Snackbar
        open={openSuccessSnackbar}
        autoHideDuration={1200}
        onClose={() => setOpenSuccessSnackbar(false)}
        message="File updated successfully"
      />
    </>
  );
};

export const GithubReposFetchComponent = () => {
  const { value, loading, error } = useAsync(async (): Promise<Repo[]> => {
    const octokit = new Octokit({ auth: gh_token });

    const response = await octokit.repos.listForAuthenticatedUser({
      visibility: 'public',
      affiliation: 'owner',
    });
    if (response.status !== 200) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }
    return response.data;
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <DenseTable repos={value || []} />;
};
