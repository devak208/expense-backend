# Expense Tracker API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All API endpoints require Clerk authentication. Include the `Authorization` header with your Clerk JWT token:
```
Authorization: Bearer <your-clerk-jwt-token>
```

## Endpoints

### Health Check
- **GET** `/health`
- **Description**: Check if the API is running
- **Response**:
```json
{
  "status": "OK",
  "message": "Expense Tracker API is running"
}
```

---

## Categories

### Get All Categories
- **GET** `/api/categories`
- **Description**: Retrieve all categories for the authenticated user
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string",
      "userId": "string",
      "createdAt": "2025-10-21T00:00:00.000Z",
      "updatedAt": "2025-10-21T00:00:00.000Z",
      "_count": {
        "expenses": 0,
        "subcategories": 0
      }
    }
  ]
}
```

### Get Single Category
- **GET** `/api/categories/{id}`
- **Parameters**: `id` (category ID)
- **Response**: Same as above but single object

### Create Category
- **POST** `/api/categories`
- **Body**:
```json
{
  "name": "Food",
  "description": "Food and dining expenses",
  "icon": "🍕"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { /* category object */ }
}
```

### Update Category
- **PUT** `/api/categories/{id}`
- **Parameters**: `id` (category ID)
- **Body**: Same as create (optional fields)
- **Response**:
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": { /* updated category */ }
}
```

### Delete Category
- **DELETE** `/api/categories/{id}`
- **Parameters**: `id` (category ID)
- **Response**:
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## Subcategories

### Get All Subcategories
- **GET** `/api/subcategories`
- **Query Parameters**:
  - `categoryId` (optional): Filter by category
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string",
      "categoryId": "string",
      "userId": "string",
      "createdAt": "2025-10-21T00:00:00.000Z",
      "updatedAt": "2025-10-21T00:00:00.000Z",
      "category": { /* category object */ },
      "_count": {
        "expenses": 0
      }
    }
  ]
}
```

### Get Single Subcategory
- **GET** `/api/subcategories/{id}`
- **Parameters**: `id` (subcategory ID)

### Create Subcategory
- **POST** `/api/subcategories`
- **Body**:
```json
{
  "categoryId": "category-id",
  "name": "Groceries",
  "description": "Grocery shopping",
  "icon": "🛒"
}
```

### Update Subcategory
- **PUT** `/api/subcategories/{id}`
- **Body**: Same as create (optional fields)

### Delete Subcategory
- **DELETE** `/api/subcategories/{id}`

---

## Bank Accounts

### Get All Bank Accounts
- **GET** `/api/bank-accounts`
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "accountNumber": "string",
      "bankName": "string",
      "accountType": "string",
      "balance": 0,
      "currency": "string",
      "isActive": true,
      "userId": "string",
      "createdAt": "2025-10-21T00:00:00.000Z",
      "updatedAt": "2025-10-21T00:00:00.000Z",
      "_count": {
        "expenses": 0
      }
    }
  ]
}
```

### Get Single Bank Account
- **GET** `/api/bank-accounts/{id}`

### Create Bank Account
- **POST** `/api/bank-accounts`
- **Body**:
```json
{
  "name": "Main Checking",
  "accountNumber": "1234567890",
  "bankName": "Bank of America",
  "accountType": "checking",
  "balance": 1000.00,
  "currency": "USD",
  "isActive": true
}
```

### Update Bank Account
- **PUT** `/api/bank-accounts/{id}`
- **Body**: Same as create (optional fields)

### Delete Bank Account
- **DELETE** `/api/bank-accounts/{id}`

---

## Expenses

### Get All Expenses
- **GET** `/api/expenses`
- **Query Parameters**:
  - `categoryId` (optional)
  - `subcategoryId` (optional)
  - `bankAccountId` (optional)
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "amount": 0,
      "description": "string",
      "date": "2025-10-21T00:00:00.000Z",
      "paymentMethod": "string",
      "tags": ["string"],
      "categoryId": "string",
      "subcategoryId": "string",
      "bankAccountId": "string",
      "userId": "string",
      "createdAt": "2025-10-21T00:00:00.000Z",
      "updatedAt": "2025-10-21T00:00:00.000Z",
      "category": { /* category object */ },
      "subcategory": { /* subcategory object */ },
      "bankAccount": { /* bank account object */ }
    }
  ],
  "count": 1
}
```

### Get Single Expense
- **GET** `/api/expenses/{id}`

### Get Expense Statistics
- **GET** `/api/expenses/stats/summary`
- **Query Parameters**:
  - `startDate` (optional)
  - `endDate` (optional)
  - `categoryId` (optional)
- **Response**:
```json
{
  "success": true,
  "data": {
    "totalExpenses": 100.50,
    "expenseCount": 5,
    "averageExpense": 20.10,
    "categoryBreakdown": {
      "Food": {
        "total": 50.00,
        "count": 2
      }
    }
  }
}
```

### Create Expense
- **POST** `/api/expenses`
- **Body**:
```json
{
  "amount": 25.99,
  "categoryId": "category-id",
  "subcategoryId": "subcategory-id", // optional
  "bankAccountId": "bank-account-id",
  "description": "Lunch at restaurant",
  "date": "2025-10-21T12:00:00.000Z", // optional, defaults to now
  "paymentMethod": "card", // optional, defaults to "cash"
  "tags": ["lunch", "restaurant"] // optional
}
```
- **Note**: This will automatically deduct the amount from the bank account balance

### Update Expense
- **PUT** `/api/expenses/{id}`
- **Body**: Same as create (optional fields)
- **Note**: Balance adjustments are handled automatically

### Delete Expense
- **DELETE** `/api/expenses/{id}`
- **Note**: This will automatically add the amount back to the bank account balance

---

## Error Responses
All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid auth)
- `404`: Not Found
- `500`: Internal Server Error

## Postman Collection
You can import this as a Postman collection. Make sure to:
1. Set up an environment variable for `base_url` = `http://localhost:3000`
2. Set up an environment variable for `auth_token` with your Clerk JWT
3. Add the Authorization header to all requests: `Bearer {{auth_token}}`