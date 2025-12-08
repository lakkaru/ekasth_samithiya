# Eksath Samithiya - Security Setup

## 🚨 IMPORTANT SECURITY NOTICE

This repository previously contained exposed MongoDB credentials. These have been removed and must be rotated immediately.

## Immediate Security Actions Required

### 1. Rotate Database Credentials
- **URGENT**: Change your MongoDB Atlas password immediately
- Create new database users with strong passwords
- Update your connection strings

### 2. Rotate JWT Secret
- Generate a new, secure JWT secret key
- Update the JWT_SECRET in your environment variables

### 3. Environment Setup

1. Copy the example environment file:
   ```bash
   cp eksath_backend/.env.example eksath_backend/.env
   ```

2. Update the `.env` file with your actual credentials:
   ```
   MONGO_URI=mongodb+srv://your_new_username:your_new_password@your_cluster.mongodb.net/your_database
   JWT_SECRET=your_new_secure_jwt_secret
   ```

### 4. Verify Security

- Ensure `.env` files are in `.gitignore`
- Never commit actual credentials to version control
- Use environment variables for all sensitive data

## Exposed Credentials That Need Rotation

The following credentials were found exposed and must be changed:

1. **MongoDB Atlas Credentials:**
   - Username: `eksath`
   - Username: `lakkaru` 
   - Username: `lakkarudb`
   - These passwords are compromised and must be changed

2. **JWT Secret:**
   - Previous secret: `eksath_wilbagedara_samithiya`
   - Generate a new secure secret immediately

## Security Best Practices

1. Never hardcode credentials in source code
2. Always use environment variables for sensitive data
3. Regularly rotate passwords and API keys
4. Monitor for credential exposure in version control
5. Use tools like GitHub's secret scanning

## Files Fixed

- `testViceSecretary.js` - Removed hardcoded MongoDB URI
- `checkFunerals.js` - Removed hardcoded MongoDB URI  
- `checkAdmins.js` - Removed hardcoded MongoDB URI
- `.env` - Replaced with placeholder values
- Created `.env.example` - Template for environment setup
