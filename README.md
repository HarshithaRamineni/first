# AiXOps - AI-Powered Developer Operations

**Automate email follow-ups, GitHub reminders, and activity tracking with AI.**

AiXOps is a SaaS platform that helps developers and teams automate routine operational tasks. It integrates with Gmail and GitHub to track developer activity and handle reminders automatically.

## Features

- 📧 **Email Follow-ups** - Automatically detect unanswered emails and create reminders
- 🐙 **GitHub Tracking** - Monitor PRs awaiting review, stale issues, and assigned tasks
- 🔔 **Smart Reminders** - Get notified at the right time for follow-ups
- 📊 **Activity Dashboard** - Track all your automations in one place
- 🔐 **OAuth Authentication** - Secure sign-in with Google and GitHub

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5 with Google & GitHub OAuth
- **Deployment**: Vercel with Cron Jobs

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- Google Cloud Console OAuth credentials
- GitHub OAuth App credentials

### Installation

1. **Clone and install dependencies**
   ```bash
   cd AiXOps
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - From GitHub Developer Settings

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## OAuth Setup

### Google OAuth (for Gmail)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Gmail API
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Homepage URL: `http://localhost:3000`
4. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth handlers
│   │   ├── cron/          # Background job endpoints
│   │   ├── integrations/  # Integration API
│   │   └── reminders/     # Reminders CRUD API
│   ├── login/             # Login page
│   └── page.tsx           # Landing page
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Prisma client
│   ├── gmail.ts           # Gmail integration
│   ├── github.ts          # GitHub integration
│   └── utils.ts           # Utility functions
└── middleware.ts          # Route protection
```

## Cron Jobs

AiXOps uses Vercel Cron to run background jobs:

- **Email Check** (`/api/cron/email-check`) - Runs every 4 hours
- **GitHub Check** (`/api/cron/github-check`) - Runs every 6 hours

## Deployment

Deploy to Vercel:

```bash
vercel
```

Make sure to:
1. Set all environment variables in Vercel dashboard
2. Update OAuth callback URLs to your production domain
3. Connect your PostgreSQL database

## License

MIT
