#!/bin/bash

# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

# Fail fast if not running on Travis
[[ -n $TRAVIS ]] && printf "%s\n" "Must run on Travis; quitting" && exit

# Declare Travis CI environment variables
declare DEPLOY_KEY
declare REPO_URI

# Disable strict host key checking for SSH
printf "%s\n" "Host adamvig.com\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config

# Set up SSH key for access to server
eval "$(ssh-agent -s)" # Start the ssh agent
ssh-add <(echo "$DEPLOY_KEY")

# Add git remote for deployment
git remote add prod $REPO_URI

# Deploy
git push prod master
