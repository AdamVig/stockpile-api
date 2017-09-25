#!/bin/bash

# Expects DEPLOY_KEY to be a Base64-encoded private SSH key
# Expects REPO_URI to be like: ssh://user@domain:/path/to/repo.git

# Set up SSH key for access to server
eval "$(ssh-agent -s)" # Start the ssh agent
ssh-add <(echo "$DEPLOY_KEY"  | base64 --decode)

# Add git remote for deployment
git remote add prod $REPO_URI

# Deploy
git push prod master
