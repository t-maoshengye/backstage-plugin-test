import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableColumn, Progress, ResponseErrorPanel } from '@backstage/core-components';
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
  owner: { // Repo owner avatar
    login: string;
    avatar_url: string;
    html_url: string;
  };
};

type DenseTableProps = {
  repos: Repo[];
};

export const DenseTable = ({ repos }: DenseTableProps) => {
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
    name: repo.name,
    html_url: (
      <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
        {repo.html_url}
      </a>
    ),
    description: repo.description,
    };
  });

  return (
    <Table
      title="GitHub Repositories"
      options={{ search: true, paging: true, pageSize: 10, pageSizeOptions: [10, 20, 50] }}
      columns={columns}
      data={data}
    />
  );
};

export const GithubReposFetchComponent = () => {

  const { value, loading, error } = useAsync(async (): Promise<Repo[]> => {

    const octokit = new Octokit({ auth: 'ghp_' });
    
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
