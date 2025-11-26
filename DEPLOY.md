# Deployment Instructions

This application is a Next.js app that uses Together AI for generating recommendations.

## Prerequisites

- A [Together AI](https://www.together.ai/) API Key.
- A Vercel account (recommended for deployment).

## Environment Variables

You must set the following environment variable in your deployment settings:

- `TOGETHER_API_KEY`: Your Together AI API key.

## Deploying on Vercel

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project into Vercel.
3.  In the "Configure Project" step, expand "Environment Variables".
4.  Add `TOGETHER_API_KEY` with your key value.
5.  Click "Deploy".

## Local Development

To run locally:

1.  Copy `.env.example` to `.env.local`.
2.  Add your API key to `.env.local`.
3.  Run `npm run dev`.
