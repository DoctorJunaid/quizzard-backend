# QuizApp Backend – Documentation & Architecture

The backend is built with **Node.js, Express, and MongoDB (Mongoose)**. It follows a clean architecture with clear separation of concerns, designed for scalability and security.

## 🏗️ Folder Structure

```text
/backend
├── src/
│   ├── config/             # DB connection logic
│   ├── controllers/        # Logical request handlers
│   ├── middleware/         # Auth guards (JWT, Admin)
│   ├── models/             # Mongoose schemas (User, Quiz, Attempt, etc.)
│   ├── routes/             # Express route definitions
│   ├── utils/              # JWT & Google OAuth helpers
│   ├── app.js              # Express app configuration
│   └── server.js           # Server entry point
├── .env                    # Active configuration (secret)
├── .env.example            # Environment template
└── package.json            # Scripts & dependencies
```

## 🔐 Core Features & Anti-Cheat

### 1. Authentication
- **JWT & Bcrypt:** Secure login with hashed passwords and 7-day tokens.
- **Google OAuth:** Integrated with `google-auth-library` for seamless sign-in.
- **Role-Based Access:** Standard users can play; only admins can create quizzes/categories.

### 2. Gameplay & Anti-Cheat Logic
- **Server-Side Scoring:** Correct answers are **never** sent to the client during the quiz. Scoring happens on the server after submission using the `Attempt` model.
- **Duplicate Prevention:** Using the `isRepeatable` flag in the Quiz model, the server blocks users from retaking a quiz they've already completed.
- **Time Limits:** The server records the `startedAt` time and rejects submissions that exceed the quiz's allocated time (including questions-based limits + 30s grace).
- **In-Progress Guards:** If a user loses connection, they can resume their current `in_progress` attempt rather than starting a new one.

### 3. Progressive Systems
- **Auto-Leveling:** User level is automatically recalculated every 500 points on every `save()`.
- **Leaderboards:** Supports "All-Time", "Monthly", and "Weekly" views using MongoDB aggregation pipelines.

---

## 🚀 Getting Started

1.  **Dependencies:** Already installed via `npm install`.
2.  **Running the Server:**
    ```bash
    cd backend
    npm run dev
    ```
    *The server will start on `http://localhost:5000`.*

3.  **Seed Categories:**
    Once the server is running, the categories can be initialized by an admin. You can create an admin user or manually call the seed endpoint if you bypass auth for the first time.

4.  **API Health Check:**
    Visit `http://localhost:5000/api/health` to verify the server is alive.

---

## 🛠️ Main API Routes

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | Public | Register email/password |
| `/api/auth/google` | `POST` | Public | Sign in with Google ID token |
| `/api/categories` | `GET` | Public | List 12 quiz categories |
| `/api/quizzes` | `GET` | Public | List published quizzes |
| `/api/questions/:quizId` | `GET` | User | Get questions (isCorrect stripped) |
| `/api/attempts/start` | `POST` | User | Begin a quiz attempt |
| `/api/attempts/:id/submit`| `POST` | User | Score and complete the quiz |
| `/api/leaderboard` | `GET` | Public | View top players |
