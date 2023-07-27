import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { Octokit } from '@octokit/rest';
import SettingsDialog from '../SettingsDialog';

let gh_token = 'ghp_';

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

export const DenseTable = ({ repos }: DenseTableProps) => {

  const [open, setOpen] = useState(false);
  const [currentRepo, setCurrentRepo] = useState<Repo | null>(null);

  const handleOpen = (repo: Repo) => {
    setCurrentRepo(repo)
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const classes = useStyles();

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
      {currentRepo && <SettingsDialog open={open} onClose={handleClose} repo={currentRepo} gh_token={gh_token} />}
      {/* < For handling pop-up edit boxes */}

    </>
  );
};

export const GithubSettingsFetchComponent = () => {
  const { value, loading, error } = useAsync(async (): Promise<Repo[]> => {
    const octokit = new Octokit({ auth: gh_token });

    const responses = await Promise.all([
      octokit.rest.repos.get({
        owner: 'Pay-Baymax',
        repo: 'github-terraform-backstage-poc',
      }),
      // octokit.rest.repos.get({
      //   owner: 't-maoshengye',
      //   repo: 'for-backstage-github-operation-test',
      // })
    ]);
    const repos = responses.map((response) => response.data);
    return repos

    // const [response1, response2] = await Promise.all([
    //   octokit.rest.repos.get({
    //     owner: 'Pay-Baymax',
    //     repo: 'github-terraform-backstage-poc',
    //   }),
    //   octokit.rest.repos.get({
    //     owner: 't-maoshengye',
    //     repo: 'for-backstage-github-operation-test',
    //   })
    // ]);
    // if (response1.status !== 200 || response2.status !== 200) {
    //   throw new Error(`GitHub API request failed`);
    // }
    // return [response1.data, response2.data];
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <DenseTable repos={value || []} />;
};
