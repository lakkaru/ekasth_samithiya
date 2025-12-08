# Eksath API Documentation

## Base URL 

## Authentication
All protected routes require JWT token in header: 

### Auth Endpoints

1. Login
POST /auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "member"
  }
}

2. Register
POST /auth/register
Body: {
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "nic": "123456789V",
  "phone": "+94123456789"
}

### Member Endpoints

1. Get All Members
GET /member
Query Parameters:
- page (default: 1)
- limit (default: 10)
- sort (example: "name,-createdAt")
- fields (example: "name,email,phone")

2. Get Single Member
GET /member/:id
Response: {
  "success": true,
  "data": {
    "id": "member_id",
    "name": "Member Name",
    "email": "member@example.com",
    "dependants": [...],
    "loans": [...],
    "accounts": [...]
  }
}

### Loan Endpoints

1. Create Loan
POST /loan
Body: {
  "amount": 50000,
  "interestRate": 12,
  "term": 12,
  "purpose": "Business",
  "guarantors": [
    { "member": "member_id_1" },
    { "member": "member_id_2" }
  ]
}

2. Get Loans
GET /loan
Query Parameters:
- status (active/completed/defaulted/rejected)
- member (member_id)

### Account Endpoints

1. Create Account
POST /account
Body: {
  "type": "savings",
  "member": "member_id",
  "monthlyContribution": 1000
}

2. Process Transaction
POST /account/:id/deposit
POST /account/:id/withdraw
Body: {
  "amount": 1000,
  "description": "Monthly deposit"
}

### Report Endpoints

1. Get Overall Summary
GET /reports/summary
Response: {
  "success": true,
  "data": {
    "totalMembers": 100,
    "accounts": [
      {
        "_id": "savings",
        "count": 50,
        "totalBalance": 500000
      }
    ],
    "loans": [
      {
        "_id": "active",
        "count": 20,
        "totalAmount": 1000000,
        "totalPaid": 400000
      }
    ]
  }
}

2. Get Defaulted Loans
GET /reports/defaulted-loans

## Error Handling
All errors follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "code": "ERROR_CODE"
  }
}
```

