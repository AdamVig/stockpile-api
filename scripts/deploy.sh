#!/bin/bash

# Set up SSH key for access to server
eval "$(ssh-agent -s)" # Start the ssh agent
ssh-add <(echo "$DEPLOY_KEY")

# Add git remote for deployment
git remote add prod $REPO_URI

# Deploy
git push prod master
