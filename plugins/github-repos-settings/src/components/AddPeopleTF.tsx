import React, { useState } from 'react';
import { Octokit } from '@octokit/rest';
import { Button, TextField, Select, MenuItem, FormControl, Typography, Card, CardContent,Snackbar } from '@material-ui/core';

const formItemStyle = {
  marginBottom: '20px', // Adjust as needed
  marginRight: '100px',
  width: '100%'
};

interface Repo {
  owner: {
    login: string;
  };
  name: string;
}

interface AddPeopleFormProps {
  gh_token: string;
  repo: Repo;
}

const AddPeopleForm = ({ gh_token, repo }: AddPeopleFormProps) => {

  const [formValues, setFormValues] = useState({
    username: 'github_username',
    permission: 'admin',
    repository: 'terraform-module-github',
  });

  const [errors, setErrors] = useState({
    username: false,
    repository: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: !event.target.value });
    console.log(formValues)
  };

  const template = `
  resource "github_repository_collaborator" "${formValues.username}" {
    repository = "${formValues.repository}"
    username   = "${formValues.username}"
    permission = "${formValues.permission}"
  }
  `;

  const handleSubmit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    console.log(template)
  };

  let target_file = `Pay-Baymax/terraform-module/collaborator_${formValues.username}.tf`
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
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
      const newBranchName = `collaborator-add-people-by-backstage-${timestamp}`;
      await octokit.git.createRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `refs/heads/${newBranchName}`,
        sha: baseSha,
      });

      try {
        // Get file sha from new branch
        const { data: fileData } = await octokit.repos.getContent({
          owner: repo.owner.login,
          repo: repo.name,
          path: target_file,
          ref: newBranchName
        });
      
        // File exists, update it
        const message = `Update ${target_file} by Backstage`;
        await octokit.repos.createOrUpdateFileContents({
          owner: repo.owner.login,
          repo: repo.name,
          path: target_file,
          message: message,
          content: Buffer.from(template).toString('base64'),
          sha: fileData.sha,
          branch: newBranchName,
        });
      } catch (error) {
        // File doesn't exist, create it
        if (error.status === 404) {
          const message = `Create ${target_file} by Backstage`;
          await octokit.repos.createOrUpdateFileContents({
            owner: repo.owner.login,
            repo: repo.name,
            path: target_file,
            message: message,
            content: Buffer.from(template).toString('base64'),
            branch: newBranchName,
          });
        } else {
          // Some other error occurred
          console.error(error);
        }
      }

      try {
        // Create pull request
        await octokit.pulls.create({
          owner: repo.owner.login,
          repo: repo.name,
          title: `collaborator-add-people-by-backstage-${timestamp}`,
          head: newBranchName,
          base: defaultBranch,
        });
      }catch (error){
        console.error(error);
      }
      setOpenSuccessSnackbar(true);
      // console.log('New branch and pull request created successfully.');
    } catch (e) {
      console.error('Failed to create new branch and pull request:', e);
    }
  };

  return (
    <form noValidate autoComplete="off" onSubmit={handleSubmit}>
      <Card>
        <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
        <TextField
          required
          error={errors.repository}
          helperText={errors.repository ? 'Repository is required' : ''}
          name="repository"
          label="Repository"
          value={formValues.repository}
          onChange={handleChange}
        />
        <TextField
          required
          error={errors.username}
          helperText={errors.username ? 'Username is required' : ''}
          name="username"
          label="Username"
          value={formValues.username}
          onChange={handleChange}
        />
        <FormControl>
          <Select style={formItemStyle} name="permission" value={formValues.permission} onChange={handleChange}>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="pull">Pull</MenuItem>
            <MenuItem value="pull">Push</MenuItem>
          </Select>
        </FormControl>
        </div>
        {`resource 'github_repository_collaborator' '${formValues.username}' {
        repository = "${formValues.repository}"
        username   = "${formValues.username}"
        permission = "${formValues.permission}"
          }`.split('\n').map((line, index) => (
          <Typography key={index}>{line}</Typography>
        ))}
        </CardContent>
      </Card>
      <Button onClick={() => handleSaveBranchPR(repo)} color="primary">
        Save to new branch and pull request
      </Button>
      <Snackbar
        open={openSuccessSnackbar}
        autoHideDuration={1200}
        onClose={() => setOpenSuccessSnackbar(false)}
        message="Resource configuration has been saved and PR"
      />
    </form>
  );
}

export const AddPeopleTF = ({ gh_token, repo }:AddPeopleFormProps) => {
  return <AddPeopleForm gh_token={gh_token} repo={repo} />;
};

