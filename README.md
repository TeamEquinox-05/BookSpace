# BookSpace

This project is a web application for booking places.

## Project Structure

The project is divided into two main parts:

- `frontend`: A React application built with Vite.
- `backend`: A Node.js application with Express and MongoDB.

## Prerequisites

- Node.js
- npm
- MongoDB

## Installation and Running

### Backend

1.  Navigate to the `backend` directory:
    ```sh
    cd backend
    ```
2.  Install the dependencies:
    ```sh
    npm install
    ```
3.  Create a `config/config.env` file with the following content:
    ```
    PORT=5000
    MONGO_URI=<your_mongodb_connection_string>
    EMAIL_USER=<your_gmail_address>
    EMAIL_PASS=<your_gmail_password_or_app_password>
    JWT_SECRET=<your_jwt_secret>
    ```
4.  Start the backend server:
    ```sh
    npm start
    ```

### Frontend

1.  Navigate to the `frontend` directory:
    ```sh
    cd frontend
    ```
2.  Install the dependencies:
    ```sh
    npm install
    ```
3.  Start the frontend development server:
    ```sh
    npm run dev
    ```

The frontend will be available at `http://localhost:5173` and will proxy API requests to the backend server running on `http://localhost:5000`.