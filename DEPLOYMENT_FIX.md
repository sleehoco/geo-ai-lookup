# Fixing Vercel Deployment Error

## Problem
Your deployment failed with this error:
```
Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.
```

This happened because the `TOGETHER_API_KEY` environment variable wasn't set in Vercel.

## Solution

### Step 1: Add Environment Variable
You're already on the Environment Variables page. Now:

1. **Name**: Enter `TOGETHER_API_KEY`
2. **Value**: Paste your Together AI API key (from your `.env.local` file)
3. **Environments**: Check all three boxes:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
4. Click the **"Save"** or **"Add"** button

### Step 2: Redeploy
After adding the environment variable:

1. Go to the **"Deployments"** tab
2. Find the failed deployment (the one with the red X)
3. Click the **"..."** menu (three dots) on the right
4. Select **"Redeploy"**
5. Confirm the redeployment

### Step 3: Wait for Success
The build should now succeed! It will take about 2-3 minutes. You'll see a green checkmark when it's done.

## Your Live URL
Once deployed successfully, your app will be live at:
`https://geo-ai-lookup.vercel.app`

(or whatever custom domain Vercel assigned)
