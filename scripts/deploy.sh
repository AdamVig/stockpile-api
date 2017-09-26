#!/bin/bash

# Expects DEPLOY_KEY to be a Base64-encoded private SSH key
# Expects REPO_URI to be like: ssh://user@domain:/path/to/repo.git

# Start the ssh agent
eval "$(ssh-agent -s)"

# Disable strict host key checking for SSH
mkdir -p ~/.ssh
[[ -f /.dockerenv ]] && echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config

# Set up SSH key for access to server
ssh-add <(echo "$DEPLOY_KEY"  | base64 --decode)

# Add git remote for deployment
git remote add prod $REPO_URI

# Deploy
git push prod master

# Build docs
npm install --only-dev --quiet
npm run docs

# Deploy docs
rsync -rvz docs "$HOST:/var/www/stockpile-api/docs"
