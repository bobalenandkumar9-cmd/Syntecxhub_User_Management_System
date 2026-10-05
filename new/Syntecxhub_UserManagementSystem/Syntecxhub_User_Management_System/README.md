# Syntecxhub User Management System

REST API for user registration, login (JWT) and role-based user management.
Built with Node.js, Express 5, MongoDB/Mongoose, bcryptjs and jsonwebtoken.

## Setup

```bash
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run dev               # or: npm start
```

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens (use a long random string) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `PORT` | Default `5000` |

### Create the first admin

Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env`, then:

```bash
npm run seed:admin
```

If the email already exists, that user is promoted to admin.

## Endpoints

Send the token as `Authorization: Bearer <token>`.

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/users` | Public | Register (role is always `user`) |
| POST | `/api/users/login` | Public | Log in, returns token |
| GET | `/api/users/profile` | Logged in | Current user |
| GET | `/api/users?page=1&limit=10` | Admin | List users (paginated) |
| GET | `/api/users/:id` | Self or admin | Get one user |
| PUT | `/api/users/:id` | Self or admin | Update `name`, `email`, `password`; only admins can change `role` |
| DELETE | `/api/users/:id` | Self or admin | Delete user |

### Examples

```bash
# register
curl -X POST localhost:5000/api/users -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'

# login
curl -X POST localhost:5000/api/users/login -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'

# profile
curl localhost:5000/api/users/profile -H "Authorization: Bearer <token>"
```

## Tests

```bash
npm test
```

Runs an offline test suite (no MongoDB needed) covering registration, login,
JWT protection, role checks, validation and CRUD.

## Project structure

```
app.js                  Express app (routes + error handling)
server.js               Loads env, connects to MongoDB, starts server
config/db.js            MongoDB connection
models/user.js          User schema (hashed password, role)
controllers/            Request handlers
routes/userRoutes.js    Route definitions
middleware/             auth (protect/authorize) and error handlers
utils/generateToken.js  JWT helper
scripts/createAdmin.js  Admin seeding script
test/api.test.js        API tests
```
