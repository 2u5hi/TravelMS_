# TravelMS

TravelMS is a full-stack travel management system built with **Angular**, **Node.js/Express**, and **MySQL**. The application supports user registration and login, trip creation, expense tracking, report generation, and an **admin trip approval workflow**.

## Features

- User registration and login
- Role-based access for **Admin** and **User** accounts
- Create, edit, and delete trips
- Admin can **approve** or **reject** pending trip requests
- Record trip expenses
- Generate expense reports
- MySQL-backed data storage

## Tech Stack

- **Frontend:** Angular 21
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Authentication:** simple role-based login using stored user records

## Project Structure

```text
TravelMS-main/
├── app/
│   ├── components/
│   │   ├── expenses/
│   │   ├── login/
│   │   ├── reports/
│   │   ├── trips/
│   │   └── users/
│   ├── guards/
│   └── services/
├── src/
├── server.js
├── db.js
├── setup.sql
├── package.json
└── .env.example
```

## Main Modules

### Users
Admins can manage user records. New users can also register from the login page.

### Trips
Users can submit trip requests. New trips are saved with status **Pending**. Admins can review trips and approve or reject them.

### Expenses
Users can log trip-related expenses, including category, amount, description, and receipt URL.

### Reports
Reports summarize trip expenses and can be generated from recorded expenses.

## Admin Approve / Reject Flow

1. A user signs in and creates a trip.
2. The backend saves the trip with status **Pending**.
3. An admin signs in and opens the **Trips** page.
4. Pending trips show **Approve** and **Reject** buttons.
5. When an admin clicks a button, the frontend calls:
   - `PATCH /api/trips/:id/status`
6. The backend updates the trip status to either:
   - `Approved`
   - `Rejected`

## Prerequisites

Before running the project, install:

- **Node.js** and **npm**
- **MySQL Server**
- **Angular CLI** (optional, but helpful)

To install Angular CLI globally:

```bash
npm install -g @angular/cli
```

If your Mac blocks a global install because of permissions, you can still run the project with the local Angular CLI using:

```bash
npx ng serve
```

## Installation and Setup

### 1. Extract the zip

Unzip the project and open the folder in your terminal.

```bash
cd TravelMS-main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a guide.

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=travelmanagement
```

### 4. Create the database

Run the SQL setup script:

```bash
mysql -u root -p < setup.sql
```

## Important database note

The current backend code uses these user columns:

- `password_hash`
- `created_at`

If your current `setup.sql` does **not** include them, add them before testing login and user management.

Run these SQL commands in MySQL if needed:

```sql
USE travelmanagement;

ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255) NULL,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

Also, if you want the database default for trips to match the approval workflow, run:

```sql
USE travelmanagement;

ALTER TABLE trips
MODIFY status VARCHAR(50) NOT NULL DEFAULT 'Pending';
```

## Create an admin account

If you do not already have an admin record, create one in MySQL. Since the backend uses bcrypt-hashed passwords when users are created through the app, the easiest option for demo purposes is to insert an admin row **without** a password hash and use the default password `admin`.

```sql
USE travelmanagement;

INSERT INTO users (first_name, last_name, email, role, phone_number)
VALUES ('Admin', 'User', 'admin@travelms.com', 'Admin', '555-123-4567');
```

Then sign in with:

- **Email:** `admin@travelms.com`
- **Password:** `admin`

For a regular user, you can use the registration form in the app.

## Running the application

### Start the backend

```bash
npm run server
```

Backend runs at:

```text
http://localhost:3000
```

### Start the frontend

In a second terminal:

```bash
npm start
```

or:

```bash
npx ng serve
```

Frontend runs at:

```text
http://localhost:4200
```

## API Endpoints

### Auth
- `POST /api/auth/login`

### Users
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Trips
- `GET /api/trips`
- `POST /api/trips`
- `PUT /api/trips/:id`
- `PATCH /api/trips/:id/status`
- `DELETE /api/trips/:id`

### Expenses
- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

### Reports
- `GET /api/reports`
- `POST /api/reports`
- `DELETE /api/reports/:id`

## Demo Steps

### User demo
1. Register a new user account.
2. Log in as the user.
3. Create a trip.
4. Confirm the trip status shows **Pending**.

### Admin demo
1. Log out.
2. Log in as admin.
3. Open the **Trips** page.
4. Find the pending trip.
5. Click **Approve** or **Reject**.
6. Confirm the trip status updates immediately.

## Common Issues

### 1. `EACCES` when installing Angular CLI
Use the local CLI instead:

```bash
npx ng serve
```

### 2. MySQL connection error
Check that:
- MySQL is running
- your `.env` credentials are correct
- the `travelmanagement` database exists

### 3. `Unknown column 'password_hash'` or `created_at`
Run the `ALTER TABLE users` commands listed above.

### 4. `Data truncated for column 'category'`
This usually means the value being inserted does not match the database column definition. Check the allowed size or allowed values in your `expenses` table schema.

## Future Improvements

- JWT-based authentication
- upload receipts as files instead of URLs
- dashboard analytics
- better role-based route protection on the backend
- email notifications for approved/rejected trips

## Author

Created for the Travel Management System sprint project.
