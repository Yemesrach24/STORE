# Inventory Management API Documentation

## Overview

This document provides comprehensive documentation for the Inventory Management System API built with Next.js 14, TypeScript, and MongoDB.

**Base URL**: `http://localhost:3000` (development)

## Authentication

All API endpoints require authentication using Clerk. Include the authorization token in the request headers:

```
Authorization: Bearer <your-clerk-token>
```

## API Endpoints

### 1. Authentication

#### Get Current User
```http
GET /api/users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "clerkId": "user_2abc123def456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "admin",
    "isActive": true,
    "phone": "+1234567890",
    "location": "New York, NY",
    "bio": "Inventory manager",
    "timezone": "America/New_York",
    "language": "en",
    "currency": "USD",
    "dateFormat": "MM/DD/YYYY",
    "emailNotifications": true,
    "lowStockAlerts": true,
    "weeklyReports": false,
    "marketingEmails": false,
    "theme": "system",
    "autoLogout": true,
    "twoFactorAuth": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. User Management

#### Update User Settings
```http
PATCH /api/users/{userId}/settings
```

**Request Body:**
```json
{
  "phone": "+1234567890",
  "location": "New York, NY",
  "bio": "Inventory manager",
  "timezone": "America/New_York",
  "language": "en",
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "emailNotifications": true,
  "lowStockAlerts": true,
  "weeklyReports": false,
  "marketingEmails": false,
  "theme": "system",
  "autoLogout": true,
  "twoFactorAuth": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "phone": "+1234567890",
    "location": "New York, NY",
    "bio": "Inventory manager",
    "timezone": "America/New_York",
    "language": "en",
    "currency": "USD",
    "dateFormat": "MM/DD/YYYY",
    "emailNotifications": true,
    "lowStockAlerts": true,
    "weeklyReports": false,
    "marketingEmails": false,
    "theme": "system",
    "autoLogout": true,
    "twoFactorAuth": false,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Categories

#### Get Categories
```http
GET /api/categories
```

**Query Parameters:**
- `search` (optional): Search categories by name
- `parentId` (optional): Filter by parent category ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Electronics",
      "description": "Electronic devices and accessories",
      "color": "#3B82F6",
      "icon": "laptop",
      "parentId": null,
      "userId": "507f1f77bcf86cd799439011",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Create Category
```http
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "color": "#3B82F6",
  "icon": "laptop",
  "parentId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "color": "#3B82F6",
    "icon": "laptop",
    "parentId": null,
    "userId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Inventory Items

#### Get Items
```http
GET /api/items
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search items by name, description, or SKU
- `category` (optional): Filter by category ID
- `stockStatus` (optional): Filter by stock status (in-stock, low-stock, out-of-stock)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Laptop",
        "description": "High-performance laptop",
        "quantity": 10,
        "price": 999.99,
        "categoryId": "507f1f77bcf86cd799439012",
        "category": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Electronics"
        },
        "sku": "LAP001",
        "barcode": "1234567890123",
        "unit": "piece",
        "minQuantity": 2,
        "maxQuantity": 50,
        "location": "Warehouse A",
        "supplier": "Tech Supplies Inc",
        "costPrice": 800.00,
        "isActive": true,
        "tags": ["electronics", "computer"],
        "imageUrl": null,
        "totalValue": 9999.90,
        "profitMargin": 199.99,
        "stockStatus": "in-stock",
        "stockPercentage": 20.0,
        "userId": "507f1f77bcf86cd799439011",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Create Item
```http
POST /api/items
```

**Request Body:**
```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "quantity": 10,
  "price": 999.99,
  "categoryId": "507f1f77bcf86cd799439012",
  "sku": "LAP001",
  "barcode": "1234567890123",
  "unit": "piece",
  "minQuantity": 2,
  "maxQuantity": 50,
  "location": "Warehouse A",
  "supplier": "Tech Supplies Inc",
  "costPrice": 800.00,
  "tags": ["electronics", "computer"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Laptop",
    "description": "High-performance laptop",
    "quantity": 10,
    "price": 999.99,
    "categoryId": "507f1f77bcf86cd799439012",
    "sku": "LAP001",
    "barcode": "1234567890123",
    "unit": "piece",
    "minQuantity": 2,
    "maxQuantity": 50,
    "location": "Warehouse A",
    "supplier": "Tech Supplies Inc",
    "costPrice": 800.00,
    "isActive": true,
    "tags": ["electronics", "computer"],
    "imageUrl": null,
    "userId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get Item by ID
```http
GET /api/items/{itemId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Laptop",
    "description": "High-performance laptop",
    "quantity": 10,
    "price": 999.99,
    "categoryId": "507f1f77bcf86cd799439012",
    "category": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Electronics"
    },
    "sku": "LAP001",
    "barcode": "1234567890123",
    "unit": "piece",
    "minQuantity": 2,
    "maxQuantity": 50,
    "location": "Warehouse A",
    "supplier": "Tech Supplies Inc",
    "costPrice": 800.00,
    "isActive": true,
    "tags": ["electronics", "computer"],
    "imageUrl": null,
    "totalValue": 9999.90,
    "profitMargin": 199.99,
    "stockStatus": "in-stock",
    "stockPercentage": 20.0,
    "userId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Update Item
```http
PUT /api/items/{itemId}
```

**Request Body:**
```json
{
  "name": "Updated Laptop",
  "description": "Updated description",
  "quantity": 15,
  "price": 1099.99,
  "categoryId": "507f1f77bcf86cd799439012",
  "sku": "LAP001-UPD",
  "barcode": "1234567890124",
  "unit": "piece",
  "minQuantity": 3,
  "maxQuantity": 60,
  "location": "Warehouse B",
  "supplier": "Updated Tech Supplies",
  "costPrice": 900.00,
  "tags": ["electronics", "computer", "updated"]
}
```

#### Update Item Quantity
```http
PATCH /api/items/{itemId}
```

**Request Body:**
```json
{
  "quantity": 20,
  "type": "ADJUSTMENT",
  "reason": "Stock adjustment",
  "notes": "Manual inventory correction"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "507f1f77bcf86cd799439013",
      "quantity": 20,
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "transaction": {
      "id": "507f1f77bcf86cd799439014",
      "itemId": "507f1f77bcf86cd799439013",
      "type": "ADJUSTMENT",
      "previousQuantity": 10,
      "newQuantity": 20,
      "quantityChange": 10,
      "reason": "Stock adjustment",
      "notes": "Manual inventory correction",
      "userId": "507f1f77bcf86cd799439011",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Delete Item
```http
DELETE /api/items/{itemId}
```

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

#### Export Items
```http
GET /api/items/export
```

**Query Parameters:**
- `format` (optional): Export format (csv, pdf) - default: csv
- `category` (optional): Filter by category ID
- `stockStatus` (optional): Filter by stock status

**Response:** CSV file download

### 5. Admin - User Management

#### Get Users (Admin Only)
```http
GET /api/admin/users
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Users per page (default: 10, max: 100)
- `search` (optional): Search users by name or email
- `role` (optional): Filter by role (admin, manager, user)
- `status` (optional): Filter by status (active, inactive)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "clerkId": "user_2abc123def456",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "admin",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Create User (Admin Only)
```http
POST /api/admin/users
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "manager",
  "isActive": true
}
```

#### Update User (Admin Only)
```http
PUT /api/admin/users/{userId}
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "role": "admin",
  "isActive": true
}
```

#### Delete User (Admin Only)
```http
DELETE /api/admin/users/{userId}
```

#### Bulk Actions (Admin Only)
```http
PATCH /api/admin/users/bulk
```

**Request Body:**
```json
{
  "action": "activate",
  "userIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Available Actions:**
- `activate`: Activate selected users
- `deactivate`: Deactivate selected users
- `delete`: Delete selected users
- `changeRole`: Change role for selected users (requires `role` field)

#### Export Users (Admin Only)
```http
GET /api/admin/users/export
```

**Query Parameters:**
- `search` (optional): Search users by name or email
- `role` (optional): Filter by role
- `status` (optional): Filter by status

### 6. Admin - Inventory Management

#### Get Global Inventory (Admin Only)
```http
GET /api/admin/inventory
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search items by name, description, or SKU
- `category` (optional): Filter by category ID
- `stockStatus` (optional): Filter by stock status

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Laptop",
        "description": "High-performance laptop",
        "quantity": 10,
        "price": 999.99,
        "categoryId": "507f1f77bcf86cd799439012",
        "category": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Electronics"
        },
        "sku": "LAP001",
        "barcode": "1234567890123",
        "unit": "piece",
        "minQuantity": 2,
        "maxQuantity": 50,
        "location": "Warehouse A",
        "supplier": "Tech Supplies Inc",
        "costPrice": 800.00,
        "isActive": true,
        "tags": ["electronics", "computer"],
        "imageUrl": null,
        "totalValue": 9999.90,
        "profitMargin": 199.99,
        "stockStatus": "in-stock",
        "stockPercentage": 20.0,
        "user": {
          "id": "507f1f77bcf86cd799439011",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "stats": {
      "totalItems": 150,
      "totalValue": 150000.00,
      "lowStockItems": 15,
      "outOfStockItems": 5
    }
  }
}
```

#### Export Global Inventory (Admin Only)
```http
GET /api/admin/inventory/export
```

**Query Parameters:**
- `search` (optional): Search items by name, description, or SKU
- `category` (optional): Filter by category ID
- `stockStatus` (optional): Filter by stock status

### 7. Admin - Analytics

#### Get Analytics (Admin Only)
```http
GET /api/admin/analytics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 25,
      "active": 23,
      "inactive": 2,
      "admins": 3,
      "managers": 5,
      "regularUsers": 17,
      "newThisMonth": 5
    },
    "inventory": {
      "totalItems": 150,
      "totalValue": 150000.00,
      "lowStockItems": 15,
      "outOfStockItems": 5,
      "categories": 8,
      "itemsAddedThisMonth": 25
    },
    "system": {
      "status": "healthy",
      "uptime": "99.9%",
      "lastBackup": "2024-01-15T02:00:00.000Z",
      "storageUsed": "75%"
    },
    "recentActivity": [
      {
        "id": "507f1f77bcf86cd799439015",
        "type": "item_created",
        "description": "New item 'Laptop' added",
        "userId": "507f1f77bcf86cd799439011",
        "userName": "John Doe",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "field": "Invalid value"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Regular endpoints**: 100 requests per minute
- **Admin endpoints**: 50 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## Testing

Use the provided Postman collection (`postman_collection.json`) to test all endpoints. The collection includes:

1. Environment variables for easy configuration
2. Pre-configured requests for all endpoints
3. Example request bodies
4. Authentication setup

### Setup Instructions

1. Import the Postman collection
2. Set up environment variables:
   - `baseUrl`: Your API base URL (e.g., `http://localhost:3000`)
   - `authToken`: Your Clerk authentication token
   - `userId`: User ID for testing
   - `itemId`: Item ID for testing
   - `categoryId`: Category ID for testing

3. Get your authentication token from Clerk dashboard or browser developer tools
4. Update the `authToken` variable with your token
5. Start testing the endpoints

## Environment Variables

Required environment variables for the API:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# MongoDB
MONGODB_URI=mongodb://localhost:27017/inventory-management

# Rate Limiting (optional)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

## Support

For API support and questions, please refer to the project documentation or create an issue in the repository. 