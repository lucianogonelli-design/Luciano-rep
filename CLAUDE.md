# CLAUDE.md

This file provides guidance for AI assistants (such as Claude) working in this repository.

## Repository Overview

- **Repository**: Luciano-rep
- **Owner**: lucianogonelli-design
- **Project**: Doctor CRM - Sistema de gestão de consultório médico com agente de IA para atendimento via WhatsApp

## Project Structure

```
/
├── CLAUDE.md                  # AI assistant guidance (this file)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── prisma/
│   ├── schema.prisma          # Database schema (SQLite)
│   └── seed.ts                # Demo data seed script
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── (dashboard)/       # Dashboard pages (with sidebar layout)
│   │   │   ├── layout.tsx     # Dashboard shell layout
│   │   │   ├── page.tsx       # Dashboard home
│   │   │   ├── patients/      # Patient management pages
│   │   │   ├── appointments/  # Appointment scheduling pages
│   │   │   ├── conversations/ # WhatsApp conversations page
│   │   │   ├── records/       # Medical records page
│   │   │   └── settings/ai/   # AI agent settings page
│   │   └── api/               # API routes
│   │       ├── patients/      # Patient CRUD
│   │       ├── appointments/  # Appointment CRUD
│   │       ├── medical-records/ # Medical record CRUD
│   │       ├── conversations/ # Conversation + messages CRUD
│   │       ├── dashboard/     # Dashboard statistics
│   │       ├── ai-settings/   # AI settings management
│   │       ├── chat/          # AI chat endpoint
│   │       └── whatsapp/webhook/ # WhatsApp webhook
│   ├── components/
│   │   ├── sidebar.tsx        # Navigation sidebar
│   │   └── ui/               # Reusable UI components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── modal.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       └── textarea.tsx
│   └── lib/
│       ├── db.ts              # Prisma client singleton
│       ├── utils.ts           # Utility functions
│       ├── whatsapp.ts        # WhatsApp Cloud API service
│       └── ai-agent.ts        # AI agent with Vercel AI SDK
└── .env.example               # Environment variables template
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7+
- **Database**: SQLite via Prisma ORM 6
- **Styling**: Tailwind CSS 3.4
- **AI**: Vercel AI SDK with OpenAI and Anthropic providers
- **WhatsApp**: Meta Cloud API (v21.0)
- **Icons**: Lucide React

## Development Workflow

### Branch Strategy

- **Main branch**: `master`
- **Feature branches**: Use the `claude/<description>-<id>` naming convention for AI-assisted work
- Always develop on feature branches, never commit directly to the main branch
- Open pull requests for review before merging

### Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed demo data** (optional):
   ```bash
   npm run db:seed
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open**: http://localhost:3000

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path (default: `file:./dev.db`) |
| `WHATSAPP_API_TOKEN` | Meta WhatsApp Business API token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp Business account ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token |
| `OPENAI_API_KEY` | OpenAI API key (if using GPT) |
| `ANTHROPIC_API_KEY` | Anthropic API key (if using Claude) |
| `AI_PROVIDER` | AI provider: `openai` or `anthropic` |
| `AI_MODEL` | AI model identifier |

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Code Conventions

- **Language**: TypeScript with strict mode
- **Components**: React functional components with hooks
- **Styling**: Tailwind CSS utility classes, using `cn()` utility for conditional classes
- **API Routes**: Next.js App Router route handlers with proper error handling
- **Database**: All DB access via Prisma client (`@/lib/db`)
- **Naming**: camelCase for variables/functions, PascalCase for components, kebab-case for file paths
- **Client components**: Must have `"use client"` directive when using hooks

## Key Guidelines for AI Assistants

1. **Read before editing** — Always read a file before proposing changes to it.
2. **Minimal changes** — Only make changes that are directly requested or clearly necessary.
3. **No guessing** — If something is unclear, investigate the codebase or ask rather than assuming.
4. **Security first** — Never introduce credentials, secrets, or sensitive data into the repository.
5. **Test your changes** — Run `npm run build` to verify changes compile correctly.
6. **Respect existing patterns** — Follow the conventions already established in the codebase.
7. **Keep this file updated** — When adding significant new infrastructure, update this CLAUDE.md accordingly.
