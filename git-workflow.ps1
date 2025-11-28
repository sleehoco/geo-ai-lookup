# Git Workflow Helper Script (PowerShell)
# Usage: .\git-workflow.ps1 -Type [feature|fix|refactor|docs] -BranchName "branch-name" -CommitMessage "commit message"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("feature", "fix", "refactor", "docs", "test", "chore")]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$BranchName,
    
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

# Ensure we're on main and up to date
Write-Host "Switching to main branch..." -ForegroundColor Cyan
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Could not checkout main branch" -ForegroundColor Red
    exit 1
}

git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Could not pull latest changes from main" -ForegroundColor Yellow
}

# Create and switch to new branch
$Branch = "${Type}/${BranchName}"
Write-Host "Creating branch: $Branch" -ForegroundColor Cyan
git checkout -b $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Branch created: $Branch" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Make your changes"
    Write-Host "  2. git add ."
    Write-Host "  3. git commit -m `"$CommitMessage`""
    Write-Host "  4. git push origin $Branch"
    Write-Host "  5. Create a Pull Request on GitHub"
    Write-Host ""
} else {
    Write-Host "Error: Could not create branch" -ForegroundColor Red
    exit 1
}

