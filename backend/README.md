# Micro Chirp App

## Project Description

The Micro Chirp App is a minimalistic web application for sharing short messages (chirps), designed following microservices principles. The project consists of independent Frontend and Backend components that interact via an API.

## Features

- **User Registration & Authentication:** Users can register, log in, and log out. JWT authentication is used to secure API endpoints.
- **Chirp Creation:** Authenticated users can publish their chirps.
- **Chirp Feed:** All chirps are displayed in a central feed.
- **Session Persistence:** The JWT token is stored in localStorage to maintain user sessions.

## Technologies Used

### Frontend

- **React:** A JavaScript library for building user interfaces.
- **Vite:** A fast build tool for React projects.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **React Router:** For declarative routing in the application.
- **React Query (TanStack Query):** For managing server state and asynchronous data.
- **Axios:** A promise-based HTTP client for making API requests.
- **Tailwind CSS (or other CSS library/framework):** For styling components.
- **Vercel:** Platform used for Frontend deployment.

### Backend

- **Bun:** An incredibly fast JavaScript runtime, bundler, package manager, and test runner.
- **Hono:** An ultra-fast, lightweight web framework for Edge, Cloudflare Workers, Node.js, and Bun.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **Knex.js:** A SQL query builder for Node.js, used for database interactions.
- **`pg` (Node.js PostgreSQL client):** PostgreSQL database driver.
- **`bcryptjs`:** For password hashing.
- **`jsonwebtoken`:** For working with JSON Web Tokens (JWT).
- **`dotenv`:** For loading environment variables from `.env` files.
- **PostgreSQL:** Relational database management system.
- **Render:** Platform used for Backend deployment.

## Local Setup and Running the Project

### Prerequisites

- Node.js (LTS version recommended)
- Bun (Install if you plan to use it for running the Backend)
- PostgreSQL (locally installed or access to a remote database)

### Database Setup

1.  Ensure PostgreSQL is installed and running.
2.  Create a new database for the project, e.g., `micro_chirp_db`.
3.  Create a database user with appropriate permissions if necessary.

### Backend Setup

1.  Clone the repository:

    ```bash
    git clone https://github.com/Terrad77/micro-chirp-app.git
    cd micro-chirp-app/backend
    ```

2.  Install dependencies:

    ```bash
    bun install
    # или npm install / yarn install, if you prefer not to use Bun
    ```

3.  Create a `.env` file in the root of the `backend` directory (next to `package.json`) and add the following environment variables, replacing placeholders with your actual data:

    ```env
    DATABASE_URL="postgresql://user:password@host:port/database_name"
    JWT_SECRET="your_very_secret_key_for_jwt"
    FRONTEND_URL="http://localhost:5173" # The URL of your local frontend
    ```

    - `DATABASE_URL`: Your PostgreSQL database connection string.
    - `JWT_SECRET`: Any long, random string used to sign JWT tokens.
    - `FRONTEND_URL`: The URL from which API requests will originate (for CORS).

4.  Run database migrations to create necessary tables (`users`, `chirps`):

    ```bash
    bunx knex migrate:latest --knexfile src/knexfile.cjs
    ```

    Ensure this command runs successfully.

5.  Start the Backend server:

    ```bash
    bun run start
    # or npm start / yarn start
    ```

    The backend will typically run on `http://localhost:3000` (or the port specified in your code).

### Frontend Setup

1.  Navigate to the Frontend directory:

    ```bash
    cd ../frontend
    ```

2.  Install dependencies:

    ```bash
    npm install
    # or yarn install / bun install
    ```

3.  Create a `.env` file in the root of the `frontend` directory and add the following environment variable:

    ```env
    VITE_BACKEND_URL="http://localhost:3000" # The URL of your local backend
    ```

4.  Start the Frontend application:

    ```bash
    npm run dev
    # or yarn dev / bun dev
    ```

    The application will open in your browser, usually at `http://localhost:5173` (or another port assigned by Vite).

## Deployment

### Frontend (Vercel)

The frontend is deployed on Vercel. Ensure that the `VITE_BACKEND_URL` environment variable is configured to the URL of your live Backend server on Render.

### Backend (Render)

The backend is deployed on Render.com. Ensure that the `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` (should be the URL of your deployed Frontend on Vercel) environment variables are correctly set in your Render service settings.
