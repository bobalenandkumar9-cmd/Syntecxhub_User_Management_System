# Syntecxhub User Management System

A RESTful User Management API developed as part of the **Syntecxhub Web Development Internship**.

## 📌 Project Overview

The User Management System is a backend REST API that allows users to be created, retrieved, updated, and deleted.

The application uses **Node.js, Express.js, MongoDB, and Mongoose** and includes password hashing, basic authentication, input validation, and API testing with Postman.

## 🚀 Features

- Create a new user
- Retrieve all users
- Retrieve a user by ID
- Update user information
- Delete a user
- MongoDB database integration
- Mongoose schema and data modeling
- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- Input validation
- Error handling
- RESTful API architecture
- Postman API testing

## 🛠️ Technologies Used

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **bcryptjs**
- **JSON Web Token (JWT)**
- **Postman**
- **Git & GitHub**

## 📂 Project Structure

```text
Syntecxhub_User_Management_System
│
├── config
│   └── db.js
│
├── controllers
│   └── userController.js
│
├── middleware
│   └── authMiddleware.js
│
├── models
│   └── User.js
│
├── routes
│   └── userRoutes.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/bobalenandkumar9-cmd/Syntecxhub_User_Management_System.git
```

### 2. Navigate to the project directory

```bash
cd Syntecxhub_User_Management_System
```

### 3. Install dependencies

```bash
npm install
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/syntecxhub_user_management
PORT=5000
JWT_SECRET=your_secret_key
```

> **Important:** Never upload the `.env` file to GitHub because it may contain private credentials and secret keys.

## ▶️ Run the Application

Start the server using:

```bash
node server.js
```

The API will run at:

```text
http://localhost:5000
```

## 📡 API Endpoints

### Create User

```http
POST /api/users
```

Example request:

```json
{
    "name": "Nandkumar",
    "email": "nandkumar@example.com",
    "password": "123456"
}
```

### Get All Users

```http
GET /api/users
```

### Get User by ID

```http
GET /api/users/:id
```

### Update User

```http
PUT /api/users/:id
```

Example request:

```json
{
    "name": "Nandkumar Bobale",
    "email": "nandkumar@example.com"
}
```

### Delete User

```http
DELETE /api/users/:id
```

## 🔒 Authentication

The API uses **JWT-based authentication** to secure protected endpoints.

Passwords are hashed using **bcryptjs** before being stored in the database.

Authentication tokens are sent using the HTTP `Authorization` header:

```text
Authorization: Bearer <your_token>
```

## 🧪 API Testing

All API endpoints are tested using **Postman**.

The testing includes:

- User creation
- User retrieval
- User update
- User deletion
- Authentication
- Invalid input handling
- Error responses

## 🗄️ Database

The application uses **MongoDB** for data storage and **Mongoose** for schema definition and database interaction.

Each user contains
