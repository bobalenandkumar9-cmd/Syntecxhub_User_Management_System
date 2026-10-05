# Syntecxhub User Management System

A RESTful API for user registration, authentication and role-based user management, built with **Node.js, Express and MongoDB**. Built as part of an internship project at **Syntecxhub**.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)

## Features

- User registration and login with **JWT** authentication
- Passwords hashed with **bcrypt** and never returned in responses
- **Role-based access control** (`user` and `admin`)
- Full **CRUD** for users, with pagination on the user list
- Users can manage their own account; admins can manage everyone
- Input validation (email format, password length, valid ids)
- Centralized error handling with correct HTTP status codes
- Admin seeding script and an offline test suite

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB with Mongoose |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcryptjs` |
| Config | `dotenv` |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- MongoDB running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Installation

```bash
git clone <your-repo-url>
cd Syntecxhub_User_Management_System
npm install
```

### Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env        # on Windows: copy .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port (default `5000`) | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/user_management` |
| `JWT_SECRET` | Secret used to sign tokens. Use a long random string | `a1b2c3...` |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) | `7d` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by the admin seed script | |

> Never commit your `.env` file. It is already listed in `.gitignore`.

### Run the server

```bash
npm run dev      # development, auto-restarts with nodemon
npm start        # production
```

The API is now available at `http://localhost:5000`.

### Create the first admin

Registration always creates a normal `user`, so the first admin is created with a script. Set the `ADMIN_*` values in `.env`, then run:

```bash
npm run seed:admin
```

If the email already exists, that account is promoted to admin.

## API Reference

Base URL: `http://localhost:5000/api/users`

Protected routes need this header:

```
Authorization: Bearer <token>
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Public | Register a new user (role is always `user`) |
| `POST` | `/login` | Public | Log in and receive a JWT |
| `GET` | `/profile` | Logged in | Get the current user's profile |
| `GET` | `/?page=1&limit=10` | Admin | List all users (paginated) |
| `GET` | `/:id` | Self or admin | Get a user by id |
| `PUT` | `/:id` | Self or admin | Update `name`, `email`, `password`. Only an admin can change `role` |
| `DELETE` | `/:id` | Self or admin | Delete a user |

### Examples

**Register**

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'
```

```json
{
  "message": "User created successfully",
  "user": {
    "id": "6650f1c2a1b2c3d4e5f67890",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  },
  "token": "<jwt>"
}
```

**Login**

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'
```

```json
{
  "message": "Login successful",
  "user": { "id": "6650f1c2a1b2c3d4e5f67890", "name": "Test User", "email": "test@example.com", "role": "user" },
  "token": "<jwt>"
}
```

**Get profile**

```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <token>"
```

**List users (admin)**

```bash
curl "http://localhost:5000/api/users?page=1&limit=5" \
  -H "Authorization: Bearer <admin-token>"
```

### Status codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | User created |
| `400` | Validation error, invalid id, or malformed JSON |
| `401` | Missing, invalid or expired token, or wrong login credentials |
| `403` | Not allowed (for example, a normal user calling an admin route) |
| `404` | User or route not found |
| `409` | Email already in use |
| `500` | Server error |

## Project Structure

```
Syntecxhub_User_Management_System/
├── app.js                    # Express app: routes and error handling
├── server.js                 # Loads env, connects to MongoDB, starts server
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   └── user.js               # User schema (hashed password, roles)
├── controllers/
│   └── userController.js     # Request handlers
├── routes/
│   └── userRoutes.js         # Route definitions
├── middleware/
│   ├── authMiddleware.js     # protect (JWT) and authorize (roles)
│   └── errorMiddleware.js    # 404 and error handlers
├── utils/
│   └── generateToken.js      # JWT helper
├── scripts/
│   └── createAdmin.js        # Admin seeding script
├── test/
│   └── api.test.js           # Offline API tests
├── .env.example
└── package.json
```

## Testing

```bash
npm test
```

The test suite runs without a database. It covers registration, login, JWT protection, role checks, validation and CRUD.

## Security Notes

- Passwords are hashed with bcrypt before they are stored.
- Login returns the same error for an unknown email and a wrong password.
- Users cannot make themselves admin through registration or profile updates.
- A token stops working once its user has been deleted.
- Secrets live in `.env`, which is not committed.

## Screenshots

Add your Postman screenshots to a `screenshots/` folder and link them here:

```markdown
![Register](screenshots/register.png)
![Login](screenshots/login.png)
![Admin user list](screenshots/admin-users.png)
```

## Author

**Nandkumar Bobale**
B.Tech Computer Engineering, Don Bosco Institute of Technology, Mumbai
GitHub: [your-username](https://github.com/your-username)


