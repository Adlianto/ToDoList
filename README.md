<p align="center">
  <h1 align="center">Shared To-Do &amp; Schedule Workspace</h1>
  <p align="center">
    A focused, secure, and production-ready Server-Driven SPA for personal productivity and team collaboration.
  </p>
</p>

---

## Overview

**Shared To-Do & Schedule Workspace** is built with modern **Laravel 13**, **Inertia.js v3**, **React 19**, and **Tailwind CSS v4**. It bridges personal productivity with group collaboration by enforcing strict workspace boundaries, fine-grained role-based permissions, secure invitations, and real-time deadline monitoring.

---

## Core Features (MVP / P0)

### 1. Dual Workspace Architecture

- **Personal Workspace:** Automatically provisioned upon user registration in a single atomic database transaction. Guaranteed strictly 1-to-1 with the user and physically protected from deletion.
- **Group Workspaces:** Users can create collaborative workspaces for teams, projects, or study squads. The creator is atomically assigned the `Owner` role.

### 2. Multi-Role Authorization & Security

- **Roles:** `Owner`, `Admin`, and `Member`.
- **Policy Enforcement:** Strict checks via Laravel Policies preventing horizontal privilege escalation (IDOR) across workspaces.
- **Scoped Route Model Binding:** Nested endpoints `/workspaces/{workspace}/tasks/{task}` and `/workspaces/{workspace}/invitations/{invitation}` reject cross-workspace access with `404 Not Found`.

### 3. Two-Way Secure Invitations

- **Direct Username Invites:** Group owners and admins can invite registered users via `@username`.
- **High-Entropy One-Time Codes:** Generate 12-character join codes that can be shared via chat. Codes are stored as SHA-256 hashes (`token_hash`) and consumed atomically using pessimistic database locking (`lockForUpdate()`).

### 4. Task & Due Date Tracking

- **CRUD Operations:** Create, view, update status (`To Do`, `In Progress`, `Done`), inline edit titles, set deadlines, and delete tasks.
- **Role-Based Task Deletion:** Owners and Admins can delete any task in the workspace. Regular Members can only delete tasks they personally created.
- **Overdue Detection:** Real-time overdue alerts for pending tasks that have passed their deadline.
- **Cross-Workspace Dashboard:** Aggregates upcoming tasks, overdue tasks, and pending incoming invitations across all member workspaces.

### 5. Production Authentication Suite & Google OAuth

- **Google OAuth (Laravel Socialite):** One-click sign in/sign up. New users automatically receive an atomic personal workspace. Existing accounts are linked safely.
- **Standard Authentication:** Registration, Login with Remember Me, Forgot Password, Reset Password link notification, and Email Verification.
- **Password Settings:** Authenticated users can update their passwords (with support for OAuth users creating their first local password).
- **Rate Limiting:** Dedicated throttle limiters on `login`, `register`, `password-reset`, `oauth`, and `invitations`.

---

## Technology Stack

- **Backend:** Laravel 13 (PHP 8.3+)
- **Frontend Adapter:** Inertia.js v3
- **Client Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Typography:** Instrument Sans
- **Routing & Action Generation:** Laravel Wayfinder (`@laravel/vite-plugin-wayfinder`)
- **OAuth:** Laravel Socialite (Google Driver)
- **Database:** PostgreSQL (production / local) & SQLite (in-memory for tests)
- **Testing & Quality:** Pest v5, PHPStan / Larastan (Level 7), Laravel Pint, Vite Plus (`vp check`)

---

## Getting Started

### Prerequisites

- **PHP:** `^8.3` (with `pdo`, `mbstring`, `openssl`, `curl`, and `sqlite3` or `pgsql` extensions)
- **Composer:** `^2.7`
- **Node.js:** `^20` or `^22`
- **NPM** or **PNPM**
- **Database:** PostgreSQL or SQLite

### Installation

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd ToDoList
    ```

2. **Install PHP and Node dependencies:**

    ```bash
    composer install
    npm install
    ```

3. **Configure Environment:**
   Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

4. **Set Up Database:**
   Update your database credentials in `.env`:

    ```env
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=laravel
    DB_USERNAME=postgres
    DB_PASSWORD=your_password
    ```

    _(Or set `DB_CONNECTION=sqlite` and create `database/database.sqlite`)_

    Run migrations:

    ```bash
    php artisan migrate
    ```

5. **Configure Google OAuth (Optional for Local Dev):**
   In `.env`:

    ```env
    GOOGLE_CLIENT_ID=your-google-client-id
    GOOGLE_CLIENT_SECRET=your-google-client-secret
    GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
    ```

6. **Generate Wayfinder Routes:**

    ```bash
    php artisan wayfinder:generate --with-form --no-interaction
    ```

7. **Build Frontend Assets:**

    ```bash
    npm run build
    ```

8. **Start Development Servers:**
    ```bash
    # Run both Laravel and Vite development servers
    composer dev
    ```
    Or run them separately:
    ```bash
    php artisan serve
    npm run dev
    ```
    Visit `http://localhost:8000` in your browser.

---

## Testing & Quality Assurance

This codebase follows rigorous verification standards:

| Tool                   | Command                | Description                                                          |
| :--------------------- | :--------------------- | :------------------------------------------------------------------- |
| **Full CI Suite**      | `composer ci:check`    | Runs format check, TypeScript check, Pint, PHPStan, and Pest         |
| **Pest Test Suite**    | `php artisan test`     | Executes 41 automated Feature and Integration tests (447 assertions) |
| **Static Analysis**    | `composer types:check` | Analyzes code with PHPStan / Larastan at **Level 7 (0 errors)**      |
| **Code Style**         | `composer lint:check`  | Validates formatting against Laravel Pint / PSR-12                   |
| **Auto-Fix Style**     | `composer lint`        | Automatically formats PHP files with Pint                            |
| **TypeScript Check**   | `npm run types:check`  | Type-checks frontend code with `tsc --noEmit`                        |
| **Frontend Formatter** | `npm run check`        | Checks formatting and linting via Vite Plus                          |

---

## Project Structure

```text
app/
├── Enums/                     # WorkspaceType, WorkspaceRole, InvitationStatus, TaskStatus
├── Http/
│   ├── Controllers/
│   │   ├── Auth/              # Login, Register, OAuth, Password Reset, Verification, Settings
│   │   ├── DashboardController.php
│   │   ├── InvitationController.php
│   │   ├── TaskController.php
│   │   ├── WorkspaceController.php
│   │   └── WorkspaceInvitationController.php
│   ├── Middleware/
│   │   └── HandleInertiaRequests.php
│   └── Requests/              # Dedicated FormRequests for all inputs
├── Models/                    # User, Workspace, WorkspaceMember, Invitation, Task
└── Policies/                  # WorkspacePolicy, InvitationPolicy, TaskPolicy

resources/
├── css/app.css                # Tailwind CSS v4 setup and theme configuration
└── js/
    ├── actions/               # Wayfinder auto-generated typed controller actions
    ├── layouts/               # AppLayout with sidebar, header & mobile subnav
    ├── pages/
    │   ├── auth/              # Login, Register, Forgot Password, Reset Password, Verify Email
    │   ├── settings/          # Password & Security settings
    │   ├── workspaces/        # Workspace Index, Create, and Detail/Tasks
    │   ├── invitations/       # Incoming Invitations & Join Code claim
    │   ├── dashboard.tsx      # Overview of upcoming & overdue tasks
    │   └── welcome.tsx        # High-conversion landing page
    ├── routes/                # Wayfinder auto-generated route definitions
    └── types/                 # Shared TypeScript interfaces
```

---

## License

This application is open-sourced software licensed under the [MIT license](LICENSE).
