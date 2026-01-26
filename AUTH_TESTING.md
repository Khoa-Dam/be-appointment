# Auth Module Testing Guide

## 🧪 Test Auth Endpoints

### 1. Register (POST /auth/register)

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "name": "Test User",
    "role": "GUEST"
  }'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "email": "test@example.com",
  "name": "Test User",
  "role": "GUEST",
  "createdAt": "2026-01-26T..."
}
```

---

### 2. Register Host

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "123456",
    "name": "Dr. Smith",
    "role": "HOST",
    "specialty": "Cardiology",
    "description": "10 years experience",
    "address": "123 Medical St",
    "phone": "+1234567890"
  }'
```

---

### 3. Login (POST /auth/login)

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "role": "GUEST",
    "name": "Test User"
  }
}
```

**Save token for next requests:**
```bash
export TOKEN="your-access-token-here"
```

---

### 4. Get Current User (GET /auth/me)

**Request:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": "uuid",
  "email": "test@example.com",
  "name": "Test User",
  "role": "GUEST",
  "is_active": true,
  "created_at": "2026-01-26T..."
}
```

---

### 5. Logout (POST /auth/logout)

**Request:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## ❌ Error Cases

### Invalid Email
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123456",
    "name": "Test",
    "role": "GUEST"
  }'
```

**Response:**
```json
{
  "statusCode": 400,
  "message": ["Invalid email format"],
  "error": "Bad Request"
}
```

### Password Too Short
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "name": "Test",
    "role": "GUEST"
  }'
```

**Response:**
```json
{
  "statusCode": 400,
  "message": ["Password must be at least 6 characters"],
  "error": "Bad Request"
}
```

### Wrong Credentials
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrong-password"
  }'
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## 🔧 Debugging

### Check Server Logs
```bash
# In terminal running pnpm start:dev
# Look for errors
```

### Check Supabase Dashboard
1. Go to Supabase Dashboard → Authentication
2. Check if users are created
3. Go to Table Editor → users
4. Verify user data

### Common Issues

**1. "Cannot find module './dto'"**
- Fix: Make sure `src/auth/dto/index.ts` exists

**2. "ValidationPipe not found"**
- Need to add global validation pipe in `main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe());
```

**3. "Supabase signup failed"**
- Check .env file
- Verify Supabase credentials
- Check Supabase Dashboard → Authentication settings

---

## ✅ Success Criteria

- [ ] Register creates user in auth.users
- [ ] Register creates user in public.users
- [ ] Login returns JWT token
- [ ] GET /auth/me works with token
- [ ] Logout invalidates session
- [ ] Validation works (email, password, etc.)
