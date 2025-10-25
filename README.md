# Expense Tracker Backend

Express.js backend with TypeScript, Clerk authentication, and Prisma ORM.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with these variables:
PORT=6000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker"
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:8081

# 3. Setup database
npm run prisma:generate
npm run prisma:migrate

# 4. Start server
npm run dev
```

## Tech Stack

- Express.js + TypeScript
- Clerk Authentication
- Prisma ORM + PostgreSQL
- Auto user sync on login

## API Endpoints

### Public

- `GET /` - API info
- `GET /api/health` - Health check

### Protected (requires auth token)

- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/stats` - User stats

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database GUI
```

## Project Structure

```
src/
├── config/          # Database & environment config
├── middleware/      # Auth & error handling
├── routes/          # API routes
├── types/           # TypeScript types
└── index.ts         # Server entry point
```

## Get Clerk Keys

1. Go to https://dashboard.clerk.com
2. Create/select your app
3. Copy API keys from dashboard
4. Add to `.env` file

---

Built with Express, TypeScript, Clerk & Prisma
