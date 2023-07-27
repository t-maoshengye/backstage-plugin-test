import React, { useState, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent } from '@material-ui/core';
import { Grid, Card, CardContent, Typography } from '@material-ui/core';
import { List, ListItem, ListItemText } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { Octokit } from '@octokit/rest';
import { AddPeopleTF } from './AddPeopleTF';

interface Repo {
  owner: {
    login: string;
  };
  name: string;
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  repo: Repo;
  gh_token: String;
}

const SettingsDialog = ({ open, onClose, repo, gh_token }:SettingsDialogProps) => {
  // console.log("🚀 ~ file: SettingsDialog.tsx:6 ~ SettingsDialog ~ open, onClose, owner, repo:", open, onClose, repo)
  const octokit = new Octokit({ auth: gh_token });

 
  const [branches, setBranches] = useState<string[]>([]);
  const [webhooks, setWebhooks] = useState<(string | undefined)[]>([]);

  useEffect(() => {
    if(repo) {
      // Get Repo's branchs
      // octokit.rest.repos.listBranches({
      //   owner: repo.owner.login,
      //   repo: repo.name
      // }).then(({ data }) => {
      //   const branchNames = data.map(branch => branch.name);
      //   setBranches(branchNames);
      // }).catch(err => {
      //   console.error(err);
      // });

      // Get branchs with configured protection
      const protectedBranches: string[] = [];
      octokit.rest.repos.listBranches({
        owner: repo.owner.login,
        repo: repo.name
      }).then(({ data }) => {
        data.forEach(branch => {
          octokit.rest.repos.getBranchProtection({
            owner: repo.owner.login,
            repo: repo.name,
            branch: branch.name
          }).then(() => {
            protectedBranches.push(branch.name);
            setBranches(protectedBranches);
          }).catch(err => {
            if (err.status !== 404) {
              console.error('404');
            }
          });
        });
      }).catch(err => {
        if (err.status !== 404) {
          console.error(err);
        }
      });



      // Get Repo's webhooks
      octokit.rest.repos.listWebhooks({
        owner: repo.owner.login,
        repo: repo.name
      }).then(({ data }) => {
        const webhookUrls = data.map(webhook => webhook.config.url);
        setWebhooks(webhookUrls);
      }).catch(err => {
        console.error(err);
      });
    }
  }, [repo]);

  return (
    <div>
      <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      >
        <DialogTitle id="alert-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <span>Github Settings</span>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Collaborators and Teams
                </Typography>
                <Typography variant="body2" component="div">
                  <AddPeopleTF gh_token={gh_token} repo={repo}/>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Branch protection rules
                </Typography>
                <Typography variant="body2" component="div">
                <List>
                  {branches.map((name, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={name} />
                    </ListItem>
                  ))}
                </List>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Runners
                </Typography>
                <Typography variant="body2" component="div">
                  
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Webhooks
                </Typography>
                <List>
                  {webhooks.map((url, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={url} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
          {/* add card here */}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SettingsDialog;
