# Expense Tracker Backend

A Node.js backend for expense tracking with Clerk authentication and PostgreSQL database using Prisma ORM.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Update the `.env` file with your database URL and Clerk keys:
```
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker?schema=public"
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_CLERK_FRONTEND_API=your_clerk_frontend_api
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma migrate dev --name init
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

## API Documentation

See `API_DOCUMENTATION.md` for detailed API endpoints and examples.

## Postman Collection

Import `Expense_Tracker_API.postman_collection.json` into Postman for testing.

### Postman Setup
1. Import the collection
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `auth_token`: Your Clerk JWT token
3. All requests include the Authorization header automatically

## Database Schema

- **Users**: Synced from Clerk authentication
- **Categories**: User-defined expense categories
- **Subcategories**: Nested under categories
- **Bank Accounts**: User's financial accounts with balance tracking
- **Expenses**: Individual expense records with automatic balance updates

## Features

- 🔐 Clerk authentication integration
- 💾 PostgreSQL database with Prisma ORM
- 🔄 Automatic user synchronization
- 💰 Real-time balance updates
- 📊 Expense statistics and filtering
- 🏷️ Tagging system for expenses
- 📱 RESTful API design