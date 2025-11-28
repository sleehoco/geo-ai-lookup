#!/bin/bash
# Git Workflow Helper Script
# Usage: ./git-workflow.sh [feature|fix|refactor|docs] "branch-name" "commit message"

TYPE=$1
BRANCH_NAME=$2
COMMIT_MSG=$3

if [ -z "$TYPE" ] || [ -z "$BRANCH_NAME" ] || [ -z "$COMMIT_MSG" ]; then
    echo "Usage: ./git-workflow.sh [feature|fix|refactor|docs] \"branch-name\" \"commit message\""
    echo "Example: ./git-workflow.sh feature \"add-user-auth\" \"feat: add user authentication\""
    exit 1
fi

# Ensure we're on main and up to date
echo "Switching to main branch..."
git checkout main
git pull origin main

# Create and switch to new branch
BRANCH="${TYPE}/${BRANCH_NAME}"
echo "Creating branch: ${BRANCH}"
git checkout -b "$BRANCH"

echo ""
echo "Branch created: ${BRANCH}"
echo "Make your changes, then run:"
echo "  git add ."
echo "  git commit -m \"${COMMIT_MSG}\""
echo "  git push origin ${BRANCH}"
echo ""
echo "Then create a Pull Request on GitHub!"

