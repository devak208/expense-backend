require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const categoryRoutes = require('./routes/category');
const subcategoryRoutes = require('./routes/subcategory');
const expenseRoutes = require('./routes/expensesroute');
const bankAccountRoutes = require('./routes/bankaccounts');
const errorHandler = require('./middleware/errorHandler');
const syncUser = require('./middleware/syncUser');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip || req.connection.remoteAddress}`);

  // Log request headers (excluding sensitive ones)
  const safeHeaders = { ...req.headers };
  delete safeHeaders.authorization; // Don't log auth tokens
  delete safeHeaders.cookie; // Don't log cookies
  console.log(`[${timestamp}] Headers:`, JSON.stringify(safeHeaders, null, 2));

  // Log request body for POST/PUT/PATCH requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const safeBody = { ...req.body };
    // Remove sensitive fields if any
    delete safeBody.password;
    delete safeBody.token;
    console.log(`[${timestamp}] Body:`, JSON.stringify(safeBody, null, 2));
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] Response: ${res.statusCode} - Duration: ${duration}ms`);

    // Log response body for errors
    if (res.statusCode >= 400 && chunk) {
      try {
        const responseBody = chunk.toString();
        console.log(`[${timestamp}] Error Response Body:`, responseBody);
      } catch (e) {
        console.log(`[${timestamp}] Could not parse response body`);
      }
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Expense Tracker API is running' });
});

// Protected routes - all routes require Clerk authentication
app.use('/api/categories', ClerkExpressRequireAuth(), syncUser, categoryRoutes);
app.use('/api/subcategories', ClerkExpressRequireAuth(), syncUser, subcategoryRoutes);
app.use('/api/expenses', ClerkExpressRequireAuth(), syncUser, expenseRoutes);
app.use('/api/bank-accounts', ClerkExpressRequireAuth(), syncUser, bankAccountRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});