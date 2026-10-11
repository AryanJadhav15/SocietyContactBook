# Comprehensive Codebase & Architecture Guide: SocietyContactBook

---

## Phase 1: Project Overview

### 1. Concise Overview
**SocietyContactBook** is a full-stack, multi-tenant residential society directory and management application. It allows residential housing societies to maintain a verified, structured contact book of service personnel, domestic workers (maids, cooks, drivers), maintenance technicians (electricians, plumbers), medical practitioners (doctors, clinics), society staff, security, and vendors. It associates these service providers with specific residential flats, tracks working schedules, services offered, and charges, and enforces role-based access control (RBAC) between society administrators and regular residents.

---

### 2. Core Problem Solved
In residential apartment complexes and gated societies:
* Contact details for domestic help, emergency technicians, and doctors are fragmented across paper registers, WhatsApp groups, or word-of-mouth.
* Information goes stale quickly when maids or drivers change timing, mobile numbers, or flats they work for.
* Residents cannot easily filter by availability (e.g., "Find an electrician available on Sunday afternoon" or "Find a cook working morning shifts in Wing B").
* Security and privacy risks arise when anyone can write unverified numbers on notice boards.
* SocietyContactBook centralizes this data into a verified, queryable, society-scoped database with audit logging and administrative curation.

---

### 3. Intended Users
The application defines two user roles via the `UserRole` enum in [`server/prisma/schema.prisma:10-13`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/prisma/schema.prisma#L10-L13):
1. **Society Administrator (`SOCIETY_ADMIN`)**:
   * Has full read and write permissions.
   * Creates and edits contacts, uploads photos, configures flat units, registers new users, and deactivates records.
2. **Resident (`RESIDENT`)**:
   * Has read-only access to the society dashboard, contact directory, contact details, and flat listings.
   * Can search and filter contacts, view phone numbers, see working hours and charges, and check which flats a helper works for.
   * Is blocked from administrative actions (creating contacts, adding flats, managing users).

---

### 4. Main Implemented Features
1. **Multi-Tenant Society Isolation**: Every entity belongs to a `societyId`; all queries and updates scope data strictly to that society.
2. **Authentication & Session Security**: HTTP-only session cookie authentication with JWT, CSRF double-submit token validation, and rate limiting.
3. **One-Time Bootstrap Setup**: Secured endpoint to create the initial society and master administrator account using a setup token.
4. **Interactive Dashboard**: Real-time KPI summary cards (active contacts, total contacts, active flats, active users), contact breakdown by category, and a list of recently updated contacts.
5. **Contact Directory & Filter Engine**: Search across names, mobile numbers, and contact codes; faceted filtering by category, subcategory, work type, and status; server-side sorting and pagination.
6. **Detailed Contact Profiles**: Structured records containing personal information, contact numbers, work details (experience, timings, days, charges), medical credentials (clinic, timings, home visits), and linked flat units.
7. **Flat Unit Management**: Directory of building wings and flat numbers, with cross-referencing to contacts working in those units.
8. **Admin User Management**: Admin panel to provision resident or administrator user accounts with bcrypt hashed passwords.
9. **Atomic Sequence Generation**: Per-society contact code generator (`CNT-000001`) implemented with row-level database locking (`SELECT ... FOR UPDATE`).
10. **Audit Logging**: Automatic tracking of contact creations, updates, and deactivations.

---

### 5. What a User Can Do
* **Log in / Log out**: Authenticate securely using email and password.
* **View Overview Metrics**: Inspect overall statistics on the home dashboard.
* **Search & Filter**: Search contacts dynamically by query text, filter by category dropdowns, or clear filters.
* **Inspect Profiles**: View a contact's working hours, charges, days available, clinic details (for medical contacts), and linked flats.
* **Create & Edit Contacts (Admin only)**: Complete multi-section forms capturing identity, work history, schedule, and flat associations.
* **Deactivate Contacts (Admin only)**: Soft-deactivate a contact so they are flagged as `INACTIVE`.
* **Add Flats (Admin only)**: Register new building flats into the system.
* **Provision Users (Admin only)**: Create new administrator or resident logins.

---

### 6. Limitations of the Current Implementation
* **No Self-Service Password Reset**: Users cannot reset forgotten passwords via email or SMS.
* **No Direct File Upload UI**: Although the backend routes ([`server/src/routes/contactRoutes.js:14-15`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/contactRoutes.js#L14-L15)) and upload middleware ([`server/src/middleware/upload.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/upload.js#L11-L27)) handle `multipart/form-data` via Multer, the frontend contact form ([`client/src/pages/ContactFormPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx#L82-L95)) submits JSON via `axios` and lacks a file input element.
* **Static File Serving Security**: Uploaded photos in `/uploads` are served statically ([`server/src/app.js:18`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js#L18)) without authenticated token validation.
* **Single Society Per Login**: The login endpoint takes `email` and `password`, finding the first matching user without requiring a society code identifier ([`server/src/services/authService.js:40-42`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/authService.js#L40-L42)).
* **Client-Side Pagination UI Absence**: The backend supports `page` and `pageSize`, but the frontend contact directory displays the first page results without a pagination controls component.

---

### 7. Technologies & Programming Languages
* **Languages**: JavaScript (ECMAScript Modules / Node.js ESM), SQL (MySQL 8 dialect), HTML5, CSS3.
* **Frontend**: React 18, Vite 6, Tailwind CSS 3, React Router v7, Axios, Lucide React.
* **Backend**: Node.js, Express 4, Prisma ORM 5, mysql2, JWT (`jsonwebtoken`), Bcrypt, Multer, Helmet, Express Rate Limit, Zod.
* **Testing**: Vitest, React Testing Library, JSDOM.

---

### 8. Project Structure Classification
This is a **full-stack monolithic workspace application** (configured via npm workspaces in the root [`package.json`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/package.json#L6-L9)). The repository contains a decoupled Single Page Application (SPA) frontend in `client/` and a RESTful API backend in `server/`.

---

### 9. How the Application Parts Connect

```
Browser (React SPA :5173)
   │
   │  HTTP / HTTPS (Credentials included: Cookie + x-csrf-token)
   ▼
Express REST API (:4000)
   ├── Middleware: Helmet, CORS, CookieParser, CSRF, Auth, Zod Validation
   ├── Controllers & Services: Business Logic & Access Control
   ▼
Database Layer
   ├── Prisma ORM (Relational CRUD, Schema, Migrations, Transactions)
   └── mysql2 Connection Pool (Raw SQL for Reporting & Search Aggregations)
```

---

### 10. Startup Lifecycle
1. **Root Command**: Running `npm run dev` in the project root triggers `concurrently` to spawn both workspace dev servers simultaneously ([`package.json:11`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/package.json#L11)).
2. **Server Initialization**:
   * Node starts `node --watch src/server.js` ([`server/package.json:8`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/package.json#L8)).
   * Environment variables in `.env` are parsed and validated by Zod ([`server/src/config/env.js:6-18`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/env.js#L6-L18)).
   * Express app is configured with security middleware, parsers, and route handlers ([`server/src/app.js:11-24`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js#L11-L24)).
   * Server listens on port 4000 ([`server/src/server.js:6`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/server.js#L6)).
3. **Client Initialization**:
   * Vite spins up a local dev server at `http://localhost:5173` ([`client/vite.config.js:6`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/vite.config.js#L6)).
   * When loaded in the browser, `index.html` loads `src/main.jsx`.
   * React mounts `AuthProvider` and `App`, triggering an immediate `GET /api/auth/me` to authenticate the user session.

---

### Detailed Directory Tree & File Inventory

```
SocietyContactBook/
├── package.json                         # Root npm workspaces definition
├── package-lock.json                    # Workspace lockfile
├── README.md                            # Setup guide, run commands, security notes
├── .gitignore                           # Git ignore rules
├── docs/
│   ├── DATABASE_DESIGN.md               # Architecture design document for DB schema
│   └── SQL_LEARNING_GUIDE.md            # Comprehensive SQL concepts & query explanation
├── client/                              # Frontend React + Vite SPA
│   ├── index.html                       # HTML entry point containing #root
│   ├── vite.config.js                   # Vite configuration (port 5173, React plugin)
│   ├── tailwind.config.js               # Tailwind design system tokens & colors
│   ├── postcss.config.js                # PostCSS config (Tailwind + Autoprefixer)
│   ├── package.json                     # Client scripts and dependencies
│   ├── eslint.config.js                 # Frontend linter configuration
│   └── src/
│       ├── main.jsx                     # Client DOM mount & React root
│       ├── App.jsx                      # Client router & page route definitions
│       ├── styles.css                   # Tailwind imports & reusable utility classes
│       ├── api/
│       │   └── client.js                # Axios instance with credentials & CSRF interceptor
│       ├── context/
│       │   └── AuthContext.jsx          # User session, login, logout, role state
│       ├── components/
│       │   ├── Layout.jsx               # Application shell (sidebar, header, outlet)
│       │   ├── ProtectedRoute.jsx       # Route guard for authenticated & admin routes
│       │   └── ui/
│       │       ├── ErrorBanner.jsx      # Reusable error message banner
│       │       ├── EmptyState.jsx       # Reusable zero-state placeholder
│       │       └── Field.jsx            # Form field wrapper with label
│       ├── pages/
│       │   ├── LoginPage.jsx            # Sign-in form
│       │   ├── LoginPage.test.jsx       # Vitest unit test for login form
│       │   ├── DashboardPage.jsx        # Stats dashboard & recent contacts
│       │   ├── ContactDirectoryPage.jsx # Contact list with live filters & search
│       │   ├── ContactDetailsPage.jsx   # Detailed contact profile view
│       │   ├── ContactFormPage.jsx      # Add/edit contact form
│       │   ├── FlatsPage.jsx            # Flat directory & creation panel
│       │   ├── UsersPage.jsx            # User management (admin only)
│       │   ├── AccessDeniedPage.jsx     # 403 error page
│       │   └── NotFoundPage.jsx         # 404 error page
│       └── utils/
│           └── format.js                # String, enum, and badge formatting helpers
└── server/                              # Backend Express REST API
    ├── package.json                     # Server dependencies and lifecycle scripts
    ├── eslint.config.js                 # Backend linter configuration
    ├── uploads/                         # Directory for uploaded contact photos
    ├── prisma/
    │   ├── schema.prisma                # Database schema, models, and enums
    │   ├── seed.js                      # Reference data seeding script
    │   └── migrations/
    │       └── 20261009080000_initial_schema/
    │           └── migration.sql        # Executable SQL DDL migration
    ├── tests/
    │   ├── contactCode.test.js          # Unit tests for contact code formatting
    │   └── contactValidation.test.js    # Unit tests for Zod contact validation
    └── src/
        ├── server.js                    # Server startup script (app.listen)
        ├── app.js                       # Express application factory & middleware setup
        ├── config/
        │   ├── env.js                   # Validated environment variables schema
        │   ├── prisma.js                # PrismaClient singleton instance
        │   └── mysql.js                 # mysql2 connection pool for raw queries
        ├── middleware/
        │   ├── auth.js                  # JWT verification, cookie management & role guard
        │   ├── csrf.js                  # CSRF header validation middleware
        │   ├── errorHandler.js          # Centralized error handler & 404 catcher
        │   ├── upload.js                # Multer disk storage and file validation
        │   └── validate.js              # Zod request validator middleware
        ├── routes/
        │   ├── index.js                 # Master router mounting sub-routes
        │   ├── authRoutes.js            # Authentication endpoints (/api/auth)
        │   ├── contactRoutes.js         # Contact CRUD endpoints (/api/contacts)
        │   ├── dashboardRoutes.js       # Dashboard reporting endpoint (/api/dashboard)
        │   ├── flatRoutes.js            # Flat management endpoints (/api/flats)
        │   ├── referenceRoutes.js       # Categories, services, work types (/api/references)
        │   └── userRoutes.js            # User management endpoints (/api/users)
        ├── controllers/
        │   ├── authController.js        # Auth request handlers
        │   ├── contactController.js     # Contact request handlers
        │   ├── dashboardController.js   # Dashboard request handler
        │   ├── flatController.js        # Flat request handlers
        │   ├── referenceController.js   # Reference data handlers
        │   └── userController.js        # User request handlers
        ├── services/
        │   ├── authService.js           # Password checks, admin setup & JWT payload
        │   ├── contactService.js        # Contact queries, transactions & sequence logic
        │   ├── dashboardService.js      # Aggregated SQL queries for KPI metrics
        │   ├── flatService.js           # Flat CRUD & contact association queries
        │   ├── referenceService.js      # Reference catalog queries and validation
        │   ├── userService.js           # User registration and listing
        │   └── auditService.js          # Audit log persistence
        ├── validators/
        │   ├── authSchemas.js           # Zod schemas for login and setup
        │   ├── commonSchemas.js         # Shared schemas (phone, pagination, id)
        │   ├── contactSchemas.js        # Zod schemas for contact creation & filtering
        │   ├── flatSchemas.js           # Zod schemas for flat operations
        │   └── userSchemas.js           # Zod schemas for user creation & updates
        └── utils/
            ├── asyncHandler.js          # Async wrapper eliminating try-catch in routes
            ├── contactCode.js           # Sequence-to-code formatting logic
            ├── httpError.js             # Custom HttpError class with status codes
            ├── pagination.js            # Page, pageSize, offset calculator
            └── password.js              # Bcrypt hashing and verification wrappers
```

#### Detailed Breakdown of Important Files & Folders

| File / Folder Path | Purpose & Why It Exists | What It Contains | Key Dependents | Impact If Missing or Broken |
| :--- | :--- | :--- | :--- | :--- |
| [`package.json`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/package.json) | Declares npm workspace hierarchy and top-level scripts. | Workspaces (`client`, `server`), scripts (`dev`, `db:migrate`, etc.). | Developer workflow, npm CLI. | Cannot run full stack concurrently or run workspace-wide scripts. |
| [`server/src/server.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/server.js) | Backend entry point. | Calls `createApp()` and binds listener to `PORT`. | Node runtime. | The backend HTTP server fails to boot. |
| [`server/src/app.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js) | Express app builder. | Registers Helmet, CORS, CookieParser, CSRF, static uploads, routes, error handlers. | [`server.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/server.js), tests. | API pipeline collapses; middleware or routes cannot execute. |
| [`server/src/config/env.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/env.js) | Environment configuration. | Zod schema validating `PORT`, `DATABASE_URL`, `JWT_SECRET`, etc. | All server modules. | Server crashes at startup if any required environment variable is invalid. |
| [`server/src/config/prisma.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/prisma.js) | Prisma client provider. | Configured `PrismaClient` singleton. | All services and auth middleware. | No database read/write operations can execute via Prisma ORM. |
| [`server/src/config/mysql.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/mysql.js) | Raw MySQL pool provider. | `mysql2/promise` connection pool. | [`dashboardService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/dashboardService.js), [`contactService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js). | Dashboard queries and contact directory search break. |
| [`server/prisma/schema.prisma`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/prisma/schema.prisma) | Declarative DB schema. | 13 models, 5 enums, indexes, foreign keys, cascading rules. | Prisma CLI, generated client. | Cannot run migrations or generate the database access client. |
| [`server/src/middleware/auth.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js) | Authentication & RBAC. | `requireAuth`, `requireRole`, session signing and cookie setters. | Protected routes in [`routes/index.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/index.js). | Security failure: unauthenticated users access private data, or all requests get 401. |
| [`server/src/middleware/csrf.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/csrf.js) | CSRF protection. | Compares `x-csrf-token` against cookie and JWT session claims. | [`app.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js). | All mutating HTTP requests (POST/PUT/PATCH) fail with 403, or CSRF attacks become possible. |
| [`server/src/services/contactService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js) | Core business logic. | Transactional contact creation, sequence numbering, raw SQL filtering. | [`contactController.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/contactController.js). | All contact management and directory functionality ceases to work. |
| [`client/src/main.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/main.jsx) | Frontend root. | Mounts React into DOM `#root`, sets up `BrowserRouter` and `AuthProvider`. | Browser, `index.html`. | Blank white screen in browser; React app does not initialize. |
| [`client/src/App.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/App.jsx) | Router configuration. | Declares all client routes and nests them inside layout and guards. | [`main.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/main.jsx). | No pages render; navigation breaks. |
| [`client/src/context/AuthContext.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/context/AuthContext.jsx) | Frontend session state. | Holds `user`, `loading`, `login()`, `logout()`, `isAdmin`. | [`ProtectedRoute.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ProtectedRoute.jsx), [`Layout.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/Layout.jsx), pages. | App cannot detect whether user is logged in; causes redirect loops. |
| [`client/src/api/client.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/api/client.js) | HTTP API client. | Axios instance with `withCredentials: true` and CSRF header interceptor. | All frontend pages and contexts. | Frontend cannot communicate with backend; requests fail auth and CSRF checks. |

---

## Phase 2: Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND STACK                         │
│  React 18.3 ── Vite 8.3 ── Tailwind CSS 3.4 ── Axios 1.7    │
│  React Router 7.18 ── Lucide React 0.468 ── Vitest 2.1      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / Cookies
┌──────────────────────────────▼──────────────────────────────┐
│                      BACKEND STACK                          │
│  Node.js (ESM) ── Express 4.21 ── Zod 3.23 ── Helmet 7.1    │
│  JWT 9.0 ── Bcrypt 6.0 ── Multer 2.0 ── Rate-Limit 7.4     │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL / TCP
┌──────────────────────────────▼──────────────────────────────┐
│                      DATABASE LAYER                         │
│  MySQL 8.0 (InnoDB) ── Prisma ORM 5.20 ── mysql2 3.11 Pool  │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Breakdown of Technologies

#### 1. React (v18.3.1)
* **What it is**: Component-based declarative UI library.
* **Why used**: Manages interactive views, re-renders efficiently when filters change, and simplifies stateful form handling.
* **Where it appears**: [`client/src/main.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/main.jsx), [`client/src/App.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/App.jsx), and all files under [`client/src/pages/`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/) and [`client/src/components/`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/).
* **Interaction**: Renders virtual DOM, binds event handlers, and synchronizes state via hooks (`useState`, `useEffect`, `useMemo`).
* **Dependent features**: All user interface elements.

#### 2. Vite (v8.3.4) & `@vitejs/plugin-react` (v5.1.0)
* **What it is**: Modern frontend build tool and local dev server powered by native browser ES modules and Rollup.
* **Why used**: Fast Cold Start, Instant Hot Module Replacement (HMR), and streamlined bundling.
* **Where it appears**: [`client/vite.config.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/vite.config.js), [`client/package.json`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/package.json#L7-L9).
* **Interaction**: Compiles `.jsx` files and hosts the client development server on port 5173.
* **Dependent features**: Client development workflow and production compilation (`npm run build`).

#### 3. React Router DOM (v7.18.4)
* **What it is**: Declarative client-side routing library.
* **Why used**: Enables Single Page Application (SPA) navigation without page reloads.
* **Where it appears**: [`client/src/App.jsx:1-35`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/App.jsx#L1-L35), [`client/src/components/Layout.jsx:31-41`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/Layout.jsx#L31-L41), [`client/src/components/ProtectedRoute.jsx:8-10`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ProtectedRoute.jsx#L8-L10).
* **Interaction**: Matches URL paths against route elements and renders corresponding components into `<Outlet />`.
* **Dependent features**: Multi-page navigation, URL parameter parsing (`/contacts/:id`), protected redirects.

#### 4. Tailwind CSS (v3.4.14) & PostCSS (v8.4.47)
* **What it is**: Utility-first CSS framework.
* **Why used**: Custom responsive design system without bulky CSS files.
* **Where it appears**: [`client/tailwind.config.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/tailwind.config.js), [`client/src/styles.css`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/styles.css). Custom colors defined: `brand` (`#256D85`), `accent` (`#7C9D4E`), `ink` (`#17202A`), `surface` (`#F6F8FB`).
* **Interaction**: Generates utility classes consumed across all React components.
* **Dependent features**: Entire visual presentation, badges, layouts, and responsive grids.

#### 5. Axios (v1.7.7)
* **What it is**: Promise-based HTTP client for the browser.
* **Why used**: Interceptors allow global headers (`x-csrf-token`) and credentials configuration (`withCredentials: true`).
* **Where it appears**: [`client/src/api/client.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/api/client.js).
* **Interaction**: Sends asynchronous JSON requests to Express backend on port 4000.
* **Dependent features**: All frontend data fetching and mutations.

#### 6. Express (v4.21.1)
* **What it is**: Minimalist web application framework for Node.js.
* **Why used**: Robust HTTP routing, middleware pipeline, and JSON API handling.
* **Where it appears**: [`server/src/app.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js), [`server/src/server.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/server.js), and all files under [`server/src/routes/`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/).
* **Interaction**: Listens on port 4000, routes incoming HTTP requests through security middleware to controllers.
* **Dependent features**: Entire backend REST API.

#### 7. Prisma ORM (v5.20.0)
* **What it is**: Type-safe Object-Relational Mapper (ORM) and schema migration engine.
* **Why used**: Model declarations, automated migrations, relational graph fetching (`include`), and transaction guarantees.
* **Where it appears**: [`server/prisma/schema.prisma`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/prisma/schema.prisma), [`server/src/config/prisma.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/prisma.js), and throughout services.
* **Interaction**: Communicates with MySQL over TCP; translates queries into optimized SQL.
* **Dependent features**: Relational queries, transactional contact creation, seed execution, schema migrations.

#### 8. mysql2 (v3.11.3)
* **What it is**: High-performance MySQL client library for Node.js supporting connection pooling and prepared statements.
* **Why used**: Executes complex raw SQL queries (multi-table joins, subqueries, `GROUP_CONCAT`, aggregation) for the dashboard and search engine.
* **Where it appears**: [`server/src/config/mysql.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/mysql.js), [`server/src/services/dashboardService.js:4-35`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/dashboardService.js#L4-L35), [`server/src/services/contactService.js:56-77`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L56-L77).
* **Interaction**: Manages a connection pool of 10 connections directly against `DATABASE_URL`.
* **Dependent features**: Dashboard analytics and contact search/filtering queries.

#### 9. Zod (v3.23.8)
* **What it is**: TypeScript-first schema declaration and validation library.
* **Why used**: Enforces strict runtime validation on environment variables, query strings, URL parameters, and JSON payloads.
* **Where it appears**: [`server/src/config/env.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/env.js), [`server/src/middleware/validate.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/validate.js), and all files under [`server/src/validators/`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/validators/).
* **Interaction**: Inspects incoming `req.body`, `req.query`, and `req.params`; rejects invalid payloads with 400 Bad Request.
* **Dependent features**: Request validation across all API endpoints.

#### 10. JSON Web Token (`jsonwebtoken` v9.0.2)
* **What it is**: RFC 7519 compact URL-safe claims representation.
* **Why used**: Stateless authentication token containing user ID, society ID, role, and CSRF token.
* **Where it appears**: [`server/src/middleware/auth.js:9-13`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js#L9-L13), [`server/src/middleware/csrf.js:14`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/csrf.js#L14).
* **Interaction**: Encoded into an HTTP-only cookie during login; verified on each incoming request.
* **Dependent features**: User authentication and session persistence.

#### 11. Bcrypt (v6.0.0)
* **What it is**: Key-derivation and password hashing function with configurable salt rounds.
* **Why used**: Secures user passwords at rest using 12 salt rounds.
* **Where it appears**: [`server/src/utils/password.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/utils/password.js), [`server/src/services/authService.js:17`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/authService.js#L17), [`server/src/services/userService.js:12`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/userService.js#L12).
* **Interaction**: Hashes passwords on creation; verifies candidate passwords during login.
* **Dependent features**: User authentication security.

#### 12. Multer (v2.0.2)
* **What it is**: Node.js middleware for handling `multipart/form-data`.
* **Why used**: Validates and stores uploaded contact photograph files to the disk.
* **Where it appears**: [`server/src/middleware/upload.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/upload.js), [`server/src/routes/contactRoutes.js:14-15`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/contactRoutes.js#L14-L15).
* **Interaction**: Inspects MIME type (`image/jpeg`, `image/png`, `image/webp`), limits file size to 2 MB, writes files to `/uploads`.
* **Dependent features**: Contact photograph upload endpoint.

#### 13. Helmet (v7.1.0) & CORS (v2.8.5) & Express Rate Limit (v7.4.1)
* **What they are**: HTTP security and rate-limiting middleware libraries.
* **Why used**: Helmet sets secure HTTP headers (XSS filter, framing restrictions); CORS restricts cross-origin access to `CLIENT_URL`; Rate Limiter stops brute-force attacks on login (25 attempts per 15 minutes).
* **Where they appear**: [`server/src/app.js:13-14`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js#L13-L14), [`server/src/routes/authRoutes.js:10-13`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/authRoutes.js#L10-L13).
* **Interaction**: Intercepts requests early in the Express pipeline.
* **Dependent features**: Overall network and authentication security.

#### 14. Vitest (v2.1.3)
* **What it is**: Fast unit testing framework natively integrated with Vite.
* **Where it appears**: [`server/tests/`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/tests/), [`client/src/pages/LoginPage.test.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/LoginPage.test.jsx).
* **Dependent features**: Automated test suites (`npm test`).

#### Technologies NOT Used in this Codebase
* **Redux / Zustand / MobX**: Not present; application uses React Context API and local component state.
* **Tailwind Component Libraries (shadcn/ui, daisyUI)**: Not present; all UI components are handwritten with Tailwind utility classes.
* **External Cloud Storage (AWS S3, Cloudinary)**: Not present; file storage uses local disk storage (`uploads/`).
* **WebSockets / Server-Sent Events**: Not present; communication is purely RESTful HTTP.

---

## Phase 3: Application Architecture

### Architectural Layers and Responsibilities

The application follows a **Modular Layered Architecture** with distinct client, server, and data tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER (Browser)                           │
│  Pages / Views  ──>  Components  ──>  AuthContext  ──>  Axios Client   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / Cookie / x-csrf-token
┌───────────────────────────────────▼────────────────────────────────────┐
│                        SERVER TIER (Node.js)                           │
│  Express App (app.js)                                                  │
│   ├── Global Middleware: Helmet, CORS, CookieParser, CSRF              │
│   └── API Master Router (routes/index.js)                              │
│        ├── Route Guards: requireAuth, requireRole                      │
│        ├── Route Validators: validate(ZodSchema)                       │
│        ├── Controllers: Parse HTTP inputs & format JSON responses      │
│        └── Services: Business rules, audit logs & domain transactions  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                     │
┌────────▼──────────────┐                             ┌────────▼──────────────┐
│  PRISMA ORM (Data)    │                             │  MYSQL2 POOL (Data)   │
│  Schema, Migrations,  │                             │  Complex Aggregates,  │
│  CRUD, Transactions   │                             │  Search, GROUP_CONCAT │
└────────┬──────────────┘                             └────────┬──────────────┘
         │                                                     │
         └──────────────────────────┬──────────────────────────┘
                                    │ SQL (TCP)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    DATABASE TIER (MySQL 8 InnoDB)                      │
│      13 Tables, Foreign Keys, Unique Keys, Row-Level Sequence Locks    │
└────────────────────────────────────────────────────────────────────────┘
```

### Actual Concrete Execution Diagram

Tracing a user searching for a contact:

```
User enters query into Search Input
│
▼
[client/src/pages/ContactDirectoryPage.jsx:46]
State Update: setFilters({ ...filters, search: 'Sunita' })
│
▼
[client/src/pages/ContactDirectoryPage.jsx:19-22]
Trigger useEffect([filters])
│
▼
[client/src/api/client.js:8-14]
Axios sends GET /api/contacts?search=Sunita (withCredentials: true)
│
▼
[server/src/app.js:13-20]
Global Middleware pipeline: Helmet -> CORS -> CookieParser -> requireCsrf (skips safe GET)
│
▼
[server/src/routes/index.js:15]
Auth Guard: requireAuth [server/src/middleware/auth.js:37-53]
Verifies JWT cookie -> Fetches user from DB -> Attaches req.user
│
▼
[server/src/routes/contactRoutes.js:12]
Request Validation: validate(contactListSchema) [server/src/middleware/validate.js]
Validates query parameters -> Stores clean object in req.validated
│
▼
[server/src/controllers/contactController.js:3-5]
Controller Handler: listContacts(req, res)
Calls contactService.listContacts(req.user.societyId, req.validated.query)
│
▼
[server/src/services/contactService.js:21-80]
Service Layer: Assembles SQL with parameterized filters ('co.society_id = ?', 'co.person_name LIKE ?')
Executes query on sqlPool [server/src/config/mysql.js]
│
▼
MySQL Database (InnoDB)
Executes parameterized SELECT join query with LIMIT and OFFSET
│
▼
[server/src/services/contactService.js:79]
Service returns { items: rows, page: 1, pageSize: 20, total: count }
│
▼
[server/src/controllers/contactController.js:4]
Controller responds: res.json({ success: true, data: { items, page, pageSize, total } })
│
▼
[client/src/pages/ContactDirectoryPage.jsx:21]
Axios receives response -> unwrap(response) -> setData(data)
│
▼
ContactDirectoryPage re-renders with matching contact cards
```

### Execution Boundaries & Environmental Separation
* **Runs in Browser**: React components, React Router navigation, `AuthContext` state, Axios client, DOM event listeners.
* **Runs on Server**: Node.js/Express, routing, middleware checks, JWT decoding, Bcrypt hashing, Zod schema validation, transaction coordinator.
* **Communicates with Database**: Only the backend server (`server/src/services/*`) communicates with MySQL via Prisma or `mysql2`. The frontend has zero direct database access.
* **Communicates with External Services**: None. The application operates entirely self-contained without external SaaS dependencies.
* **Where Validation Occurs**:
  * **Frontend**: Basic HTML5 constraints (`required`, `type="email"`, `minLength`) and UI type guards.
  * **Backend**: Strict schema validation via Zod middleware before controllers run ([`server/src/middleware/validate.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/validate.js)).
  * **Database**: Model constraints, unique keys (`UNIQUE(society_id, contact_code)`), check constraints, and foreign key cascades.
* **Where Errors are Handled**:
  * **Backend**: Unhandled errors bubble to [`server/src/middleware/errorHandler.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/errorHandler.js), translating Prisma constraint errors (`P2002`, `P2003`) into standard HTTP status codes (`409`, `400`).
  * **Frontend**: API promises catch errors and set state in component-level `error` variables, rendering [`client/src/components/ui/ErrorBanner.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ui/ErrorBanner.jsx).

---

## Phase 4: Frontend Explanation

### A. Application Entry Point
* **Entry File**: [`client/src/main.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/main.jsx).
* **Execution Sequence**:
  1. Browser loads [`client/index.html`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/index.html), discovering `<script type="module" src="/src/main.jsx">`.
  2. `main.jsx` imports React, ReactDOM, `BrowserRouter`, `AuthProvider`, `styles.css`, and `App`.
  3. `ReactDOM.createRoot(document.getElementById('root'))` mounts the application tree into the `#root` `div`.
  4. Global styles and Tailwind base directives are injected via `styles.css`.
  5. `AuthProvider` mounts, executing its initial session verification effect (`GET /api/auth/me`).

### B. Routing and Navigation
* **Routing Mechanism**: React Router v7 (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`).
* **Route Configuration Table**:

| Path | Element / Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/login` | [`LoginPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/LoginPage.jsx) | Public (Redirects if logged in) | User sign-in page |
| `/access-denied` | [`AccessDeniedPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/AccessDeniedPage.jsx) | Public | Displayed when a Resident visits an Admin route |
| `/` | [`DashboardPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/DashboardPage.jsx) | Authenticated | Main KPI statistics & recent contacts |
| `/contacts` | [`ContactDirectoryPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx) | Authenticated | Contact search and filter table |
| `/contacts/new` | [`ContactFormPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx) | Authenticated | Create a new contact |
| `/contacts/:id` | [`ContactDetailsPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDetailsPage.jsx) | Authenticated | View a full contact profile |
| `/contacts/:id/edit`| [`ContactFormPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx) | Authenticated | Edit an existing contact |
| `/flats` | [`FlatsPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/FlatsPage.jsx) | Authenticated | View and create society flats |
| `/users` | [`UsersPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/UsersPage.jsx) | **Admin Only** | Manage resident and admin user logins |
| `*` | [`NotFoundPage`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/NotFoundPage.jsx) | Public | Catch-all 404 page |

* **Route Protection**:
  * Implemented in [`client/src/components/ProtectedRoute.jsx:4-11`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ProtectedRoute.jsx#L4-L11).
  * If `loading` is true, renders a centered loading spinner.
  * If `!user`, redirects immediately to `/login` via `<Navigate to="/login" replace />`.
  * If `adminOnly` is true and `!isAdmin`, redirects to `/access-denied`.
  * Otherwise, renders child routes through `<Outlet />`.

---

### C. Components and Hierarchy

```
App
├── Routes
│   ├── LoginPage
│   ├── AccessDeniedPage
│   ├── NotFoundPage
│   └── ProtectedRoute (Auth Guard)
│       └── Layout (Shell)
│           ├── Sidebar Navigation (NavLink items)
│           ├── Header (User badge, logout button, mobile menu toggle)
│           └── Main Content (<Outlet />)
│               ├── DashboardPage
│               ├── ContactDirectoryPage
│               │   ├── Search & Filter Bar
│               │   ├── EmptyState
│               │   └── Contact Card Rows
│               ├── ContactDetailsPage
│               │   └── Info Sections (Contact, Work, Medical, Flats)
│               ├── ContactFormPage
│               │   ├── ErrorBanner
│               │   ├── Field (Form wrapper)
│               │   └── CheckboxGroup (Multi-select pill buttons)
│               ├── FlatsPage
│               │   ├── Add Flat Form (Admin only)
│               │   └── Flats Table
│               └── UsersPage (Admin ProtectedRoute)
│                   ├── Create User Form
│                   └── User Accounts List
```

#### Major Component Specifications

1. **[`Layout.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/Layout.jsx)**:
   * **Responsibility**: Responsive application layout containing sidebar and top bar.
   * **State**: `open` (boolean, toggles mobile sidebar drawer).
   * **Hooks**: `useAuth()` (access user details, logout handler), `useLocation()` (active route title).
   * **Child Components**: `NavLink`, `Link`, `LogOut`, `Menu`, `Shield`, `<Outlet />`.

2. **[`ContactDirectoryPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx)**:
   * **Responsibility**: Main directory browser with faceted search and status deactivation.
   * **State**: `references` (categories and work types catalog), `filters` (`{ search, categoryId, subcategoryId, status, workTypeId }`), `data` (paginated API response).
   * **API Calls**: `GET /api/references`, `GET /api/contacts`, `PATCH /api/contacts/:id/deactivate`.
   * **Child Components**: [`EmptyState`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ui/EmptyState.jsx).

3. **[`ContactFormPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx)**:
   * **Responsibility**: Multi-section form handling both creation and editing of contacts.
   * **State**: `form` (nested object representing identity, work details, medical details, flat associations), `references`, `flats`, `error`, `saving`.
   * **API Calls**: `GET /api/references`, `GET /api/flats`, `GET /api/contacts/:id` (if editing), `POST /api/contacts`, `PUT /api/contacts/:id`.
   * **Child Components**: [`Field`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ui/Field.jsx), [`ErrorBanner`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ui/ErrorBanner.jsx), `CheckboxGroup`.

4. **[`ContactDetailsPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDetailsPage.jsx)**:
   * **Responsibility**: Read-only display of all contact attributes.
   * **State**: `contact` (hydrated contact object graph).
   * **API Calls**: `GET /api/contacts/:id`.
   * **Child Components**: `Info` (definition list wrapper).

---

### D. User Interactions
* **Searching Contacts**: Typing in the search input updates `filters.search` in `ContactDirectoryPage`. The `useEffect` listening to `[filters]` triggers an immediate Axios request, replacing `data.items`.
* **Category Dropdown Selection**: Selecting a category updates `filters.categoryId` and resets `filters.subcategoryId` to `''`. The subcategory dropdown automatically derives and displays only subcategories belonging to that selected category ([`client/src/pages/ContactDirectoryPage.jsx:54`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx#L54)).
* **Deactivating a Contact**: Clicking the deactivate button in `ContactDirectoryPage` displays a native `window.confirm()`. If confirmed, calls `api.patch('/contacts/${id}/deactivate')` and refreshes the list by creating a new filter state reference ([`client/src/pages/ContactDirectoryPage.jsx:27-30`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx#L27-L30)).
* **Adding a Flat Association in Contact Form**: Clicking "Add flat association" appends a new item `{ flatId: flatOptions[0]?.id || '', relationship: '', timing: '', remarks: '' }` to `form.flatAssociations` ([`client/src/pages/ContactFormPage.jsx:161`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx#L161)).

---

### E. State Management
* **Shared State (`AuthContext`)**:
  * Stored in [`client/src/context/AuthContext.jsx:7-8`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/context/AuthContext.jsx#L7-L8).
  * Holds `user` object (`id`, `name`, `email`, `role`, `societyId`, `status`) and `loading` boolean.
  * Derived state `isAdmin` (`user?.role === 'SOCIETY_ADMIN'`).
  * Persisted across browser sessions using HTTP-only cookies and validated on initial page load via `GET /api/auth/me`.
* **CSRF Token State**:
  * Stored in `localStorage.getItem('csrfToken')` and synchronized when `login` or `GET /api/auth/me` resolves.
  * Injected into outgoing request headers by Axios request interceptor ([`client/src/api/client.js:8-14`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/api/client.js#L8-L14)).
* **Local Component State**:
  * Managed via `useState` inside individual pages (`data`, `filters`, `form`, `error`, `saving`).
  * Not persisted to storage; re-fetched when navigating between pages.

---

## Phase 5: Backend Explanation

### 1. Backend Entry Point & Server Initialization
* **Entry Point**: [`server/src/server.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/server.js).
* **Process**: Imports `createApp()` from [`server/src/app.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js), imports validated `env` from [`server/src/config/env.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/env.js), instantiates the Express application, and calls `app.listen(env.PORT)`.

### 2. Middleware Registration & Execution Order
Middleware executes in this strict sequence in [`server/src/app.js:13-22`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js#L13-L22):
1. `helmet()`: Sets secure HTTP response headers.
2. `cors({ origin: env.CLIENT_URL, credentials: true })`: Allows requests from `http://localhost:5173` and permits cookie transmission.
3. `cookieParser()`: Parses Cookie header into `req.cookies`.
4. `express.json({ limit: '1mb' })`: Parses incoming JSON request bodies.
5. `express.urlencoded({ extended: true })`: Parses URL-encoded form data.
6. `express.static('/uploads')`: Serves static image files from the uploads directory.
7. `requireCsrf`: Intercepts unsafe HTTP methods (POST, PUT, PATCH, DELETE) and validates CSRF tokens.
8. `/api` Router: Mounts route handlers.
9. `notFoundHandler`: Catches unmatched URLs and produces a 404 HttpError.
10. `errorHandler`: Centralized error handler catching all thrown exceptions.

---

### Route Catalog & API Specification

| HTTP Method | Endpoint Path | Handler / Controller | Middleware Chain | Required Auth | Summary & Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Inline | None | None | Health check endpoint |
| **POST** | `/api/auth/setup` | `authController.setup` | `authLimiter`, `validate(setupSchema)` | Setup Token | Initial society & admin creation |
| **POST** | `/api/auth/login` | `authController.loginUser` | `authLimiter`, `validate(loginSchema)` | Public | Authenticates user & sets cookies |
| **POST** | `/api/auth/logout` | `authController.logoutUser` | `requireAuth` | Authenticated | Clears auth & CSRF cookies |
| **GET** | `/api/auth/me` | `authController.currentUser` | `requireAuth` | Authenticated | Returns current user profile |
| **GET** | `/api/dashboard` | `dashboardController.dashboard`| `requireAuth` | Authenticated | Fetches aggregated KPI stats |
| **GET** | `/api/contacts` | `contactController.listContacts`| `requireAuth`, `validate(contactListSchema)` | Authenticated | Filtered contact search list |
| **GET** | `/api/contacts/:id` | `contactController.getContact` | `requireAuth`, `validate(idParam)` | Authenticated | Fetches single contact graph |
| **POST** | `/api/contacts` | `contactController.createContact`| `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `upload.single()`, `validate(createContactSchema)` | **Admin Only** | Creates contact in transaction |
| **PUT** | `/api/contacts/:id` | `contactController.updateContact`| `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `upload.single()`, `validate(updateContactSchema)` | **Admin Only** | Updates contact in transaction |
| **PATCH** | `/api/contacts/:id/deactivate` | `contactController.deactivateContact` | `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `validate(idParam)` | **Admin Only** | Soft deactivates contact |
| **GET** | `/api/flats` | `flatController.listFlats` | `requireAuth`, `validate(flatListSchema)` | Authenticated | Lists society flats |
| **POST** | `/api/flats` | `flatController.createFlat` | `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `validate(createFlatSchema)` | **Admin Only** | Creates a flat |
| **PUT** | `/api/flats/:id` | `flatController.updateFlat` | `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `validate(updateFlatSchema)` | **Admin Only** | Updates flat details |
| **GET** | `/api/flats/:id/contacts` | `flatController.getFlatContacts` | `requireAuth`, `validate(idParam)` | Authenticated | Contacts linked to a flat |
| **GET** | `/api/references` | `referenceController.listReferences` | `requireAuth` | Authenticated | Categories, work types, services |
| **POST** | `/api/references/categories/:categoryId/subcategories` | `referenceController.createSubcategory` | `requireAuth`, `requireRole('SOCIETY_ADMIN')` | **Admin Only** | Creates a subcategory |
| **POST** | `/api/references/services` | `referenceController.createService` | `requireAuth`, `requireRole('SOCIETY_ADMIN')` | **Admin Only** | Creates a service |
| **POST** | `/api/references/work-types` | `referenceController.createWorkType` | `requireAuth`, `requireRole('SOCIETY_ADMIN')` | **Admin Only** | Creates a work type |
| **GET** | `/api/users` | `userController.listUsers` | `requireAuth`, `requireRole('SOCIETY_ADMIN')` | **Admin Only** | Lists society users |
| **POST** | `/api/users` | `userController.createUser` | `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `validate(createUserSchema)` | **Admin Only** | Registers a new user |
| **PUT** | `/api/users/:id` | `userController.updateUser` | `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `validate(updateUserSchema)` | **Admin Only** | Updates user role/status |

---

### Architectural Terminology in this Backend
* **Route**: Declares the HTTP endpoint path, method, and attaches middleware functions ([`server/src/routes/contactRoutes.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/contactRoutes.js)).
* **Middleware**: Functions that execute in sequence before the controller to inspect, validate, or reject the request ([`server/src/middleware/auth.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js), [`server/src/middleware/validate.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/validate.js)).
* **Controller**: Extracts validated parameters from `req`, calls service methods, and serializes output into HTTP status codes and JSON payloads ([`server/src/controllers/contactController.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/contactController.js)).
* **Service**: Encapsulates business logic, database transactions, sequence counters, access checks, and audit logging ([`server/src/services/contactService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js)).
* **Model**: Declarative Prisma representation of database tables, constraints, and relationships ([`server/prisma/schema.prisma`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/prisma/schema.prisma)).

---

## Phase 6: Database and Data Flow

### 1. Database Identification & Connection Mechanism
* **Database**: MySQL 8.0 with InnoDB storage engine.
* **Character Set & Collation**: `utf8mb4` with `utf8mb4_unicode_ci`.
* **Prisma Connection**: Initialized via `@prisma/client` using connection URL in `DATABASE_URL` ([`server/src/config/prisma.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/prisma.js)).
* **mysql2 Pool Connection**: Initialized via `mysql2/promise` with a connection limit of 10 and named placeholders support ([`server/src/config/mysql.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/config/mysql.js)).

---

### 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    societies ||--o{ users : "has members"
    societies ||--o{ categories : "defines"
    categories ||--o{ subcategories : "contains"
    societies ||--o{ contacts : "owns"
    categories ||--o{ contacts : "classifies"
    subcategories ||--o{ contacts : "sub-classifies"
    contacts ||--o| contact_work_details : "has"
    contact_work_details ||--o{ contact_working_days : "scheduled on"
    contacts ||--o{ contact_work_types : "tagged with"
    work_types ||--o{ contact_work_types : "links to"
    contacts ||--o{ contact_services : "provides"
    services ||--o{ contact_services : "links to"
    societies ||--o{ flats : "contains"
    contacts ||--o{ contact_flat_associations : "serves"
    flats ||--o{ contact_flat_associations : "associated with"
    contacts ||--o| medical_details : "possesses"
    societies ||--o| contact_sequences : "tracks counter"
    societies ||--o{ audit_logs : "records events"
```

---

### 3. Detailed Table Specifications

#### 1. `societies`
* **Purpose**: Root multi-tenant entity representing a residential society.
* **Columns**:
  * `id`: `INTEGER AUTO_INCREMENT` (PK)
  * `name`: `VARCHAR(160)` NOT NULL
  * `code`: `VARCHAR(40)` NOT NULL (Unique Key `societies_code_key`)
  * `created_at`, `updated_at`: `DATETIME(3)`

#### 2. `users`
* **Purpose**: User accounts for administrators and residents.
* **Columns**:
  * `id`: `INTEGER AUTO_INCREMENT` (PK)
  * `society_id`: `INTEGER` NOT NULL (FK -> `societies.id` ON DELETE RESTRICT)
  * `name`: `VARCHAR(120)` NOT NULL
  * `email`: `VARCHAR(180)` NOT NULL
  * `password_hash`: `VARCHAR(255)` NOT NULL
  * `role`: `ENUM('SOCIETY_ADMIN', 'RESIDENT')` DEFAULT `'RESIDENT'`
  * `status`: `ENUM('ACTIVE', 'INACTIVE')` DEFAULT `'ACTIVE'`
  * `created_at`, `updated_at`: `DATETIME(3)`
* **Constraints & Indexes**:
  * `UNIQUE KEY (society_id, email)`
  * `INDEX (society_id, role)`

#### 3. `categories` & `subcategories`
* **Purpose**: Two-level classification hierarchy for contacts.
* **`categories` Columns**: `id` (PK), `society_id` (FK), `name` (`VARCHAR(80)`), `is_system` (`BOOLEAN`).
  * `UNIQUE KEY (society_id, name)`
* **`subcategories` Columns**: `id` (PK), `society_id` (FK), `category_id` (FK -> `categories.id` ON DELETE CASCADE), `name` (`VARCHAR(100)`), `is_system` (`BOOLEAN`).
  * `UNIQUE KEY (category_id, name)`

#### 4. `contacts`
* **Purpose**: Core identity record for service personnel.
* **Columns**:
  * `id`: `INTEGER AUTO_INCREMENT` (PK)
  * `society_id`: `INTEGER` (FK -> `societies.id` ON DELETE CASCADE)
  * `contact_code`: `VARCHAR(20)` NOT NULL (e.g., `CNT-000001`)
  * `category_id`: `INTEGER` (FK -> `categories.id` ON DELETE RESTRICT)
  * `subcategory_id`: `INTEGER` (FK -> `subcategories.id` ON DELETE RESTRICT)
  * `person_name`: `VARCHAR(140)` NOT NULL
  * `gender`: `ENUM('FEMALE', 'MALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY')`
  * `photo_path`: `VARCHAR(255)` NULL
  * `mobile_number`: `VARCHAR(20)` NOT NULL
  * `alternate_mobile`: `VARCHAR(20)` NULL
  * `whatsapp_available`: `BOOLEAN` DEFAULT false
  * `status`: `ENUM('ACTIVE', 'INACTIVE')` DEFAULT `'ACTIVE'`
  * `created_by_id`: `INTEGER` NULL (FK -> `users.id` ON DELETE SET NULL)
  * `updated_by_id`: `INTEGER` NULL (FK -> `users.id` ON DELETE SET NULL)
* **Constraints & Indexes**:
  * `UNIQUE KEY (society_id, contact_code)`
  * `INDEX (society_id, person_name)`, `INDEX (society_id, mobile_number)`, `INDEX (society_id, status)`, `INDEX (category_id, subcategory_id)`

#### 5. `contact_work_details` & `contact_working_days`
* **Purpose**: 1-to-1 extension table for work specifics; 1-to-many child table for working days.
* **`contact_work_details` Columns**: `id` (PK), `contact_id` (FK UNIQUE -> `contacts.id` ON DELETE CASCADE), `experience_years` (INT), `working_since` (INT), `preferred_start` (`VARCHAR(10)`), `preferred_end` (`VARCHAR(10)`), `service_area` (`VARCHAR(160)`), `availability` (`VARCHAR(120)`), `charges` (`VARCHAR(120)`), `remarks` (`TEXT`).
* **`contact_working_days` Columns**: `id` (PK), `work_detail_id` (FK -> `contact_work_details.id` ON DELETE CASCADE), `day` (`ENUM('MONDAY', ..., 'SUNDAY')`).
  * `UNIQUE KEY (work_detail_id, day)`

#### 6. `medical_details`
* **Purpose**: 1-to-1 extension table for Medical category contacts.
* **Columns**: `id` (PK), `contact_id` (FK UNIQUE -> `contacts.id` ON DELETE CASCADE), `specialization` (`VARCHAR(120)`), `clinic_name` (`VARCHAR(160)`), `clinic_address` (`TEXT`), `clinic_phone` (`VARCHAR(20)`), `consultation_timing` (`VARCHAR(120)`), `appointment_availability` (`VARCHAR(120)`), `home_visit_status` (`BOOLEAN`).

#### 7. Linking Tables: `contact_work_types`, `contact_services`, `contact_flat_associations`
* **`contact_work_types`**: Composite PK `(contact_id, work_type_id)`.
* **`contact_services`**: Composite PK `(contact_id, service_id)`.
* **`contact_flat_associations`**: PK `id`, `society_id`, `contact_id`, `flat_id`, `relationship`, `timing`, `remarks`.
  * `UNIQUE KEY (contact_id, flat_id, relationship)`.

#### 8. `contact_sequences`
* **Purpose**: Atomic per-society integer sequence counter.
* **Columns**: `society_id` (`INTEGER` PK), `next_value` (`INTEGER` DEFAULT 1).

#### 9. `audit_logs`
* **Purpose**: Immutable history of administrative mutations.
* **Columns**: `id` (PK), `society_id` (FK), `actor_user_id` (INT NULL), `action` (`VARCHAR(80)`), `entity_type` (`VARCHAR(80)`), `entity_id` (INT NULL), `metadata` (`JSON` NULL), `created_at` (`DATETIME(3)`).

---

## Phase 7: Complete Feature-by-Feature Walkthrough

### Feature 1: User Authentication & Session Management
1. **Purpose**: Securely identifies users, issues signed session cookies, establishes role permissions, and protects against unauthorized access.
2. **User Workflow**: User navigates to `/login`, enters email and password, and clicks "Sign in". Upon success, gets redirected to the dashboard.
3. **Frontend Implementation**:
   * Component: [`client/src/pages/LoginPage.jsx:7-55`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/LoginPage.jsx#L7-L55).
   * Context: [`client/src/context/AuthContext.jsx:21-25`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/context/AuthContext.jsx#L21-L25) (`login(email, password)`).
   * Storage: Saves returned `csrfToken` into `localStorage`.
4. **Backend Implementation**:
   * Route: `POST /api/auth/login` in [`server/src/routes/authRoutes.js:13`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/authRoutes.js#L13).
   * Middleware: `authLimiter`, `validate(loginSchema)`.
   * Controller: `loginUser` in [`server/src/controllers/authController.js:12-17`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/authController.js#L12-L17).
   * Service: `login` in [`server/src/services/authService.js:39-54`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/authService.js#L39-L54).
5. **Database Interaction**: Reads row from `users` matching `email` where `status = 'ACTIVE'`.
6. **Execution Flow**:
   * Form submits -> Axios posts credentials -> Route rate limiter checks IP -> Zod validates email format and password length -> `authService.login` finds user and invokes `bcrypt.compare` -> `signSession` generates JWT containing user ID, role, society ID, and random CSRF hex -> `setAuthCookies` writes `society_contact_session` (HTTP-only) and `csrf_token` cookies -> Response returns user payload.
7. **Error Handling**: Throws `HttpError(401, 'Invalid email or password')` on wrong credentials; returns 429 if rate limit exceeded.
8. **Code References**:
   * [`server/src/services/authService.js:39-54`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/authService.js#L39-L54)
   * [`server/src/middleware/auth.js:7-30`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js#L7-L30)
9. **Example**:
   * Input: `{ "email": "admin@example.com", "password": "ValidPassword123" }`
   * Output: Cookie set, JSON: `{ "success": true, "data": { "user": { "id": 1, "role": "SOCIETY_ADMIN" }, "csrfToken": "a3f8..." } }`.

---

### Feature 2: Contact Creation (Admin Only)
1. **Purpose**: Registers a new verified contact profile, atomically generates a human-readable contact code (`CNT-000001`), and links working details, medical information, and flat units.
2. **User Workflow**: Admin clicks "Add contact" (`/contacts/new`), selects Category and Subcategory, fills in personal and work information, chooses working days, optionally links flat numbers, and clicks "Save contact".
3. **Frontend Implementation**:
   * Component: [`client/src/pages/ContactFormPage.jsx:26-174`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx#L26-L174).
   * Event Handler: `submit(event)` normalizes string numbers to numeric integers via `normalize(form)` and posts to `/contacts`.
4. **Backend Implementation**:
   * Route: `POST /api/contacts` in [`server/src/routes/contactRoutes.js:14`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/contactRoutes.js#L14).
   * Middleware: `requireAuth`, `requireRole('SOCIETY_ADMIN')`, `upload.single('photograph')`, `validate(createContactSchema)`.
   * Controller: `createContact` in [`server/src/controllers/contactController.js:11-14`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/contactController.js#L11-L14).
   * Service: `createContact` in [`server/src/services/contactService.js:88-118`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L88-L118).
5. **Database Interaction**: Runs an atomic transaction (`prisma.$transaction`):
   * Acquires row lock on `contact_sequences`: `SELECT next_value FROM contact_sequences WHERE society_id = ? FOR UPDATE;`
   * Increments `next_value`.
   * Inserts row into `contacts`.
   * Upserts `contact_work_details` and bulk inserts `contact_working_days`.
   * If medical, upserts `medical_details`.
   * Bulk inserts `contact_work_types`, `contact_services`, and `contact_flat_associations`.
   * Inserts row into `audit_logs`.
6. **Execution Flow**:
   * Form submit -> Zod validates schema -> `assertCategoryPair` confirms subcategory belongs to category -> Transaction begins -> Sequence generated -> Contact row created -> Related tables populated -> Audit logged -> Full hydrated contact returned.
7. **Error Handling**: Transaction automatically rolls back if any child table insert fails; duplicate mobile/code returns 409 Conflict.
8. **Code References**:
   * [`server/src/services/contactService.js:88-118`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L88-L118)
   * [`server/src/services/contactService.js:160-166`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L160-L166)
9. **Example**:
   * Created Contact: Code `CNT-000001`, Person: "Sunita Patil", Category: "Domestic Help" / "Maid", Flats linked: A-101.

---

### Feature 3: Contact Directory Search & Filtering
1. **Purpose**: Enables residents and admins to search contacts in real time using text search and structured filters.
2. **User Workflow**: User navigates to `/contacts`, types into the search box or picks from Category / Subcategory / Status / Work Type dropdowns. The table updates instantly.
3. **Frontend Implementation**:
   * Component: [`client/src/pages/ContactDirectoryPage.jsx:9-103`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx#L9-L103).
   * State: `filters` object triggers `useEffect` on change, dispatching `api.get('/contacts', { params })`.
4. **Backend Implementation**:
   * Route: `GET /api/contacts` in [`server/src/routes/contactRoutes.js:12`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/contactRoutes.js#L12).
   * Controller: `listContacts` in [`server/src/controllers/contactController.js:3-5`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/contactController.js#L3-L5).
   * Service: `listContacts` in [`server/src/services/contactService.js:21-80`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L21-L80).
5. **Database Interaction**:
   * Executes parameterized raw SQL on `sqlPool` with dynamic `WHERE` clauses, `INNER JOIN categories`, `INNER JOIN subcategories`, `LEFT JOIN contact_work_types`, `GROUP_CONCAT(DISTINCT wt.name)`, and `LIMIT ? OFFSET ?`.
   * Executes a matching `COUNT(*)` query for pagination metadata.
6. **Execution Flow**:
   * Client filter changes -> Axios calls API -> Zod validates query string -> Service constructs parameter array -> `sqlPool.execute()` runs queries -> Controller responds with items list and total count -> UI updates table rows.
7. **Error Handling**: Malformed query parameters rejected with 400 Bad Request by Zod validator.
8. **Code References**:
   * [`server/src/services/contactService.js:56-77`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L56-L77)
9. **Example**:
   * Query: `?search=Sunita&categoryId=1&status=ACTIVE`
   * Matches contacts whose name, phone, or code matches "Sunita" under Category ID 1.

---

### Feature 4: Flat Unit Management
1. **Purpose**: Maintains an inventory of physical flats/apartments within the society to which service personnel can be linked.
2. **User Workflow**: Admin visits `/flats`, enters Building Wing (e.g., "Tower A"), Flat Number (e.g., "102"), and Floor (e.g., "1st"), and clicks "Save flat".
3. **Frontend Implementation**:
   * Component: [`client/src/pages/FlatsPage.jsx:12-64`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/FlatsPage.jsx#L12-L64).
   * State: `flats` array, `form` object. Form displays only for admins.
4. **Backend Implementation**:
   * Route: `POST /api/flats` in [`server/src/routes/flatRoutes.js:12`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/flatRoutes.js#L12).
   * Controller: `createFlat` in [`server/src/controllers/flatController.js:7-9`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/flatController.js#L7-L9).
   * Service: `createFlat` in [`server/src/services/flatService.js:27-29`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/flatService.js#L27-L29).
5. **Database Interaction**: `prisma.flat.create({ data: { ...data, societyId } })`.
6. **Execution Flow**:
   * Form submitted -> Checked for `SOCIETY_ADMIN` role -> Zod validates fields -> Prisma inserts row -> 201 Created returned -> Client reloads flat list.
7. **Error Handling**: Duplicate flat within the same building and society triggers Prisma `P2002`, returning 409 Conflict.
8. **Code References**:
   * [`server/src/services/flatService.js:27-29`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/flatService.js#L27-L29)
   * [`server/src/validators/flatSchemas.js:14-25`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/validators/flatSchemas.js#L14-L25)
9. **Example**:
   * Input: `{ "building": "Wing B", "flatNumber": "402", "floor": "4" }`
   * Creates Flat ID 2.

---

### Feature 5: Real-Time Society Analytics Dashboard
1. **Purpose**: Provides quick operational insights into contact counts, active flats, users, category distributions, and recently updated records.
2. **User Workflow**: User logs in or navigates to `/`. The dashboard presents 4 metric cards, a horizontal bar distribution of contacts by category, and a list of recently modified contacts.
3. **Frontend Implementation**:
   * Component: [`client/src/pages/DashboardPage.jsx:6-63`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/DashboardPage.jsx#L6-L63).
   * State: `data` loaded via `useEffect` from `GET /api/dashboard`.
4. **Backend Implementation**:
   * Route: `GET /api/dashboard` in [`server/src/routes/dashboardRoutes.js:7`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/dashboardRoutes.js#L7).
   * Controller: `dashboard` in [`server/src/controllers/dashboardController.js:3-5`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/dashboardController.js#L3-L5).
   * Service: `getDashboardStats` in [`server/src/services/dashboardService.js:3-42`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/dashboardService.js#L3-L42).
5. **Database Interaction**: Runs 3 raw SQL queries via `sqlPool`:
   * Summary scalar counts via subselects.
   * `LEFT JOIN contacts` grouped by `categories.id` and `categories.name`.
   * Top 6 contacts ordered by `updated_at DESC`.
6. **Execution Flow**:
   * Mounts DashboardPage -> GET /api/dashboard -> Verifies auth -> Runs aggregate queries -> Returns payload `{ summary, contactsByCategory, recentlyUpdated }` -> UI renders charts and cards.
7. **Error Handling**: Database errors caught by `errorHandler`, returning 500.
8. **Code References**:
   * [`server/src/services/dashboardService.js:4-35`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/dashboardService.js#L4-L35)
9. **Example Output**:
   * Summary: `{ activeContacts: 14, totalContacts: 15, activeFlats: 48, activeUsers: 5 }`.

---

## Phase 8: Trace Actual Execution Flows

### Workflow: Creating a New Contact from Start to Finish

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Society Administrator
    participant Browser as React SPA (ContactFormPage)
    participant Client as Axios Client
    participant Express as Express API App
    participant Auth as Auth & CSRF Middleware
    participant Val as Zod Validate Middleware
    participant Ctrl as Contact Controller
    participant Svc as Contact Service
    participant DB as MySQL 8 (Prisma & Pool)

    Admin->>Browser: Enters details and clicks "Save contact"
    Browser->>Browser: normalize(form) transforms numeric strings
    Browser->>Client: api.post('/contacts', payload)
    Note over Client: Interceptor injects x-csrf-token from localStorage
    Client->>Express: HTTP POST /api/contacts (Cookies + Header)
    Express->>Auth: requireCsrf validates tokens
    Auth-->>Express: Next()
    Express->>Auth: requireAuth verifies JWT cookie
    Auth->>DB: prisma.user.findFirst(...)
    DB-->>Auth: User record returned
    Auth-->>Express: req.user attached
    Express->>Auth: requireRole('SOCIETY_ADMIN') checks role
    Auth-->>Express: Next()
    Express->>Val: validate(createContactSchema) checks payload
    Val-->>Express: req.validated attached
    Express->>Ctrl: createContact(req, res)
    Ctrl->>Svc: createContact(societyId, userId, data)
    
    rect rgb(240, 248, 255)
    Note over Svc,DB: Atomic Database Transaction
    Svc->>DB: assertCategoryPair & assertSocietyReferences
    Svc->>DB: tx.$queryRaw "SELECT next_value FROM contact_sequences FOR UPDATE"
    DB-->>Svc: returns nextValue (e.g. 1)
    Svc->>DB: tx.$executeRaw "UPDATE contact_sequences SET next_value = 2"
    Svc->>DB: tx.contact.create(...)
    Svc->>DB: tx.contactWorkDetail.upsert(...)
    Svc->>DB: tx.contactWorkingDay.createMany(...)
    Svc->>DB: tx.contactWorkType.createMany(...)
    Svc->>DB: tx.contactFlatAssociation.createMany(...)
    end

    Svc->>DB: auditService.audit(...) writes to audit_logs
    Svc-->>Ctrl: returns hydrated contact graph
    Ctrl-->>Client: HTTP 201 { success: true, data: contact }
    Client-->>Browser: Promise resolves with contact
    Browser->>Admin: navigate('/contacts/1') displays profile
```

#### Synchronous vs Asynchronous Steps
* **Synchronous Operations**:
  * Form event prevention (`event.preventDefault()`).
  * Payload preparation and normalization (`normalize(form)`).
  * Axios request interceptor reading `localStorage`.
  * Middleware evaluation (`requireRole`, `SAFE_METHODS.has`).
  * Contact code formatting (`formatContactCode(1)` -> `'CNT-000001'`).
* **Asynchronous Operations**:
  * HTTP request/response exchange over TCP network.
  * Cookie parsing and JWT cryptographic verification.
  * Asynchronous database queries (`await tx.contact.create(...)`, `await sqlPool.execute(...)`).
  * Bcrypt password operations (`await bcrypt.compare(...)`).

---

## Phase 9: Authentication and Security

### Complete Authentication Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       LOGIN WORKFLOW                        │
│                                                             │
│  User submits Email + Password                              │
│         │                                                   │
│         ▼                                                   │
│  Backend verifies Bcrypt Hash (12 rounds)                   │
│         │                                                   │
│         ▼                                                   │
│  crypto.randomBytes(24) generates CSRF secret               │
│         │                                                   │
│         ▼                                                   │
│  JWT signed with: { sub, societyId, role, csrf }            │
│         │                                                   │
│         ▼                                                   │
│  Set HTTP-Only Cookie: society_contact_session = JWT        │
│  Set Readable Cookie: csrf_token = csrf                     │
│  Return JSON: { user, csrfToken: csrf }                     │
└─────────────────────────────────────────────────────────────┘
```

1. **Bootstrap Setup (`POST /api/auth/setup`)**:
   * Uses a secret header `x-setup-token` matching `env.SETUP_TOKEN` ([`server/src/services/authService.js:7-12`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/authService.js#L7-L12)).
   * Refuses to run if any `SOCIETY_ADMIN` already exists in the database.
   * Creates the first `Society` and initial `User`.
2. **Password Hashing**:
   * Uses Bcrypt with 12 salt rounds (`SALT_ROUNDS = 12`) in [`server/src/utils/password.js:3-6`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/utils/password.js#L3-L6).
3. **Session Cookies & Token Storage**:
   * Auth token stored in HTTP-only cookie `society_contact_session` (cannot be accessed by JavaScript, mitigating XSS token theft).
   * In production, cookie flags include `secure: true` and `sameSite: 'strict'`.
4. **CSRF Protection (Double Submit + Claim Match)**:
   * Handled in [`server/src/middleware/csrf.js:7-20`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/csrf.js#L7-L20).
   * For modifying requests (POST, PUT, PATCH, DELETE), verifies that:
     1. `req.get('x-csrf-token')` exists.
     2. It matches `req.cookies.csrf_token`.
     3. It matches the cryptographic `csrf` claim signed inside the verified JWT!
5. **Backend Role Authorization**:
   * Enforced on routes via `requireRole('SOCIETY_ADMIN')` in [`server/src/middleware/auth.js:55-59`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js#L55-L59).
   * Frontend route guards ([`client/src/components/ProtectedRoute.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/components/ProtectedRoute.jsx)) provide UX guidance, but the backend rejects unauthorized actions with 403 Forbidden.
6. **Multi-Tenant Scoping**:
   * Every SQL query filters by `societyId` extracted from the verified session (`req.user.societyId`), preventing cross-society data leaks.

---

## Phase 10: Configuration and Running the Application

### 1. Prerequisites & Runtime Versions
* **Node.js**: v18.0.0 or higher (supports native ESM, `node --watch`, crypto).
* **npm**: v8.0.0 or higher (supports npm workspaces).
* **MySQL**: MySQL 8.0 server running locally or accessible via network.

---

### 2. Available NPM Scripts

| Location | Command | Purpose |
| :--- | :--- | :--- |
| **Root** | `npm run dev` | Runs both client and server concurrently |
| **Root** | `npm run build` | Builds client production bundle |
| **Root** | `npm test` | Runs tests in both server and client |
| **Root** | `npm run lint` | Lints server and client code |
| **Root** | `npm run prisma:generate`| Re-generates Prisma client library |
| **Root** | `npm run db:migrate` | Applies Prisma migrations in dev mode |
| **Root** | `npm run db:seed` | Seeds database with reference categories |
| **Server**| `npm run dev --workspace server` | Runs server with `node --watch` |
| **Client**| `npm run dev --workspace client` | Runs Vite dev server |

---

### 3. Environment Variables Configuration

#### Server (`server/.env` based on `server/.env.example`)
* `NODE_ENV`: Set to `development` or `production`.
* `PORT`: Server port (defaults to `4000`).
* `CLIENT_URL`: URL of frontend application (`http://localhost:5173`).
* `DATABASE_URL`: MySQL connection URI (`mysql://user:password@localhost:3306/society_contact_book`).
* `JWT_SECRET`: Random string at least 24 characters long.
* `COOKIE_NAME`: Session cookie name (`society_contact_session`).
* `SETUP_TOKEN`: Secret string required to run the one-time admin setup endpoint.
* `UPLOAD_DIR`: Path to photo uploads folder (`uploads`).
* `MAX_UPLOAD_BYTES`: Maximum upload size in bytes (`2097152` = 2 MB).

#### Client (`client/.env` based on `client/.env.example`)
* `VITE_API_BASE_URL`: API prefix (`http://localhost:4000/api`).

---

### 4. Step-by-Step Setup and Startup Commands

#### Step A: Database Provisioning in MySQL
```sql
CREATE DATABASE society_contact_book CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'society_app'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON society_contact_book.* TO 'society_app'@'localhost';
FLUSH PRIVILEGES;
```

#### Step B: Environment Files Setup
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with your DATABASE_URL, JWT_SECRET, and SETUP_TOKEN
```

#### Step C: Install Dependencies, Migrate, Seed, and Run
```bash
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

#### Step D: Create Initial Administrator
Run this curl command using your configured `SETUP_TOKEN`:
```bash
curl -X POST http://localhost:4000/api/auth/setup \
  -H "Content-Type: application/json" \
  -H "x-setup-token: your_setup_token_from_env" \
  -d '{
    "societyName": "Green Valley Society",
    "societyCode": "GV01",
    "name": "Super Admin",
    "email": "admin@greenvalley.com",
    "password": "SecurePassword123"
  }'
```

#### Step E: Verification
* Backend Health: Open `http://localhost:4000/api/health` -> Expect `{ "success": true, "data": { "status": "ok" } }`.
* Frontend: Open `http://localhost:5173` -> Log in using created credentials -> Expect to see the dashboard.

---

## Phase 11: Code Quality and Potential Issues

### Confirmed Defects & Implementation Discrepancies

#### 1. Frontend Contact Form Missing File Upload (Multipart Form Data)
* **Location**: [`client/src/pages/ContactFormPage.jsx:82-95`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx#L82-L95)
* **What it is**: The backend routes accept contact photos via Multer (`upload.single('photograph')`), but the frontend form only sends a JSON payload with no file input element or `FormData` serialization.
* **Why it matters**: Contact photographs cannot be uploaded through the web UI despite backend support.
* **Suggested Solution**: Add `<input type="file" accept="image/*" />` to `ContactFormPage` and use `FormData` when submitting.

#### 2. Cross-Society Email Collision During Login
* **Location**: [`server/src/services/authService.js:40-42`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/authService.js#L40-L42)
* **What it is**: `prisma.user.findFirst({ where: { email: email.toLowerCase(), status: 'ACTIVE' } })`.
* **Why it matters**: The schema allows identical emails in different societies (`@@unique([societyId, email])`). If two users share an email across societies, `findFirst` non-deterministically selects the first one.
* **Suggested Solution**: Require `societyCode` on the login form or enforce global email uniqueness across the entire system.

#### 3. Missing Category ID Parameter Validation in Reference Routes
* **Location**: [`server/src/routes/referenceRoutes.js:9`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/referenceRoutes.js#L9) and [`server/src/controllers/referenceController.js:10-13`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/controllers/referenceController.js#L10-L13)
* **What it is**: Route `POST /categories/:categoryId/subcategories` lacks `validate(idParam)` on params; controller does `Number(req.params.categoryId)`, which becomes `NaN` if non-numeric characters are passed.
* **Suggested Solution**: Attach `validate(idParam)` to the route in `referenceRoutes.js`.

---

### Security & Operational Risks

#### 4. Unauthenticated Public Serving of Uploaded Images
* **Location**: [`server/src/app.js:18`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js#L18) (`app.use('/uploads', express.static(...))`).
* **Risk**: Uploaded contact photos are served statically without checking authentication cookies. Anyone with the URL can view pictures.
* **Suggested Solution**: Protect the `/uploads` route with `requireAuth` or stream photos through an authenticated controller.

#### 5. Lack of UI Pagination Controls
* **Location**: [`client/src/pages/ContactDirectoryPage.jsx:20-22`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx#L20-L22)
* **Risk**: Backend defaults to returning 20 records (`LIMIT 20 OFFSET 0`). If a society has 200 contacts, users cannot navigate to records 21–200 in the UI.
* **Suggested Solution**: Add page navigation buttons (`Next`, `Previous`, `Page 1 of N`) bound to `filters.page`.

---

## Phase 12: Mental Model & Learning Guide

### A. The Big Picture
Think of **SocietyContactBook** as a secure, digital guardhouse register combined with a verified neighborhood yellow pages:
* **The Centerpiece**: The `Contact` record (who the person is, what services they provide, what their schedule looks like, and which flats they work for).
* **The Safety Net**: Strict multi-tenant isolation (`society_id` on every query), role permissions (only Admins can change data), and CSRF token verification.
* **The Performance Strategy**: Prisma ORM manages schemas and transactional changes; raw MySQL connection pools run fast aggregate reporting and search queries.

---

### B. The 10 Most Important Files

1. [`server/prisma/schema.prisma`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/prisma/schema.prisma): The foundational data blueprint defining all 13 models, foreign keys, and enums.
2. [`server/src/app.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js): The central Express pipeline configuring security, CSRF, cookies, and routes.
3. [`server/src/middleware/auth.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js): The security gatekeeper handling JWT tokens, cookies, and role checks.
4. [`server/src/middleware/csrf.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/csrf.js): Double-submit CSRF protection validating tokens against JWT claims.
5. [`server/src/services/contactService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js): The primary business logic engine handling transactional contact creation, locking sequences, and raw SQL queries.
6. [`server/src/services/dashboardService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/dashboardService.js): Demonstrates high-performance multi-table SQL aggregation queries.
7. [`client/src/context/AuthContext.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/context/AuthContext.jsx): Global client session state management, login/logout, and user hydration.
8. [`client/src/api/client.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/api/client.js): Centralized Axios instance attaching CSRF tokens and handling credentials.
9. [`client/src/pages/ContactDirectoryPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx): The primary user screen showing real-time filtering, search, and contact cards.
10. [`client/src/pages/ContactFormPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx): The comprehensive form component demonstrating complex nested form state and data normalization.

---

### C. The Most Important Functions
* `requireAuth(req, res, next)` ([`server/src/middleware/auth.js:37`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js#L37)): Verifies session cookies and protects endpoints.
* `createContact(societyId, userId, data)` ([`server/src/services/contactService.js:88`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L88)): Coordinates atomic multi-table transaction and sequence counter.
* `nextContactNumber(tx, societyId)` ([`server/src/services/contactService.js:160`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L160)): Executes row-level locking (`SELECT ... FOR UPDATE`) to guarantee unique contact codes.
* `listContacts(societyId, query)` ([`server/src/services/contactService.js:21`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js#L21)): Compiles dynamic SQL with parameterized search and pagination.
* `unwrap(response)` ([`client/src/api/client.js:16`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/api/client.js#L16)): Extracts data payloads cleanly from server responses.

---

### D. The Complete Data Journey
1. **User Action**: User types or selects inputs in the React UI.
2. **Component State**: React state updates locally via `useState`.
3. **API Request**: Axios intercepts request, attaches `x-csrf-token` from `localStorage`, and sends payload with session cookies.
4. **Server Middleware**: Helmet sets headers -> CORS verifies origin -> CookieParser reads cookies -> CSRF matches tokens -> Auth checks JWT -> Zod validates payload format.
5. **Controller & Service**: Controller hands validated object to Service -> Service enforces business rules and starts database transaction.
6. **Database Persistence**: MySQL locks sequence row -> Inserts contact -> Inserts work details and flat associations -> Writes audit log.
7. **Response & UI Render**: Express responds with JSON 201 -> Axios unwrap parses data -> React updates state -> UI re-renders with fresh record.

---

### E. Recommended Learning Sequence
1. **Database Foundations**: Read [`docs/DATABASE_DESIGN.md`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/docs/DATABASE_DESIGN.md) and [`server/prisma/schema.prisma`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/prisma/schema.prisma). Understand how models relate to each other.
2. **SQL Concepts**: Read [`docs/SQL_LEARNING_GUIDE.md`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/docs/SQL_LEARNING_GUIDE.md) and study [`server/src/services/dashboardService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/dashboardService.js) to understand joins and aggregation.
3. **Server Entry & Flow**: Inspect [`server/src/app.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/app.js) and [`server/src/routes/index.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/index.js) to trace how requests traverse middleware.
4. **Security & Auth**: Study [`server/src/middleware/auth.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/auth.js) and [`server/src/middleware/csrf.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/csrf.js).
5. **Transactions & Business Logic**: Walk through [`server/src/services/contactService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js), especially `createContact` and `nextContactNumber`.
6. **Frontend State & Routing**: Read [`client/src/App.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/App.jsx), [`client/src/context/AuthContext.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/context/AuthContext.jsx), and [`client/src/api/client.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/api/client.js).
7. **Complex Forms & UI**: Study [`client/src/pages/ContactFormPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx) and [`client/src/pages/ContactDirectoryPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx).

---

### F. Glossary of Terms
* **Multi-Tenancy**: Software architecture where a single instance serves multiple distinct customer groups (societies), keeping data partitioned via a tenant key (`societyId`).
* **Row-Level Locking (`SELECT ... FOR UPDATE`)**: A database transaction lock that prevents any other concurrent transaction from reading or updating the selected row until the current transaction commits.
* **Double Submit CSRF**: Security mechanism where a random token is sent both in a cookie and in a request header; the server verifies both match to ensure the request originated from the legitimate client application.
* **HTTP-Only Cookie**: A cookie attribute preventing client-side JavaScript (`document.cookie`) from reading the cookie value, mitigating token theft via XSS vulnerabilities.
* **Faceted Search**: Browsing technique allowing users to narrow down query results by applying multiple simultaneous category, status, and attribute filters.
* **Junction / Linking Table**: A database table containing foreign keys linking two other tables together in a Many-to-Many relationship (e.g., `contact_work_types`).

---

### G. Knowledge Check: 10 Practice Questions

Attempt to answer these questions based on what you have learned from the codebase:

1. *(Basic)* Which specific database table and column define whether a user is an administrator or a resident?
2. *(Basic)* Where is the user's authentication JWT stored when they log in, and why is client-side JavaScript prevented from reading it?
3. *(Intermediate)* In [`server/src/routes/contactRoutes.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/routes/contactRoutes.js), which middleware function prevents a `RESIDENT` from creating or editing contacts?
4. *(Intermediate)* How does [`server/src/services/contactService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/contactService.js) prevent two administrators from accidentally generating the exact same contact code (`CNT-000001`) if they save a contact at the exact same millisecond?
5. *(Intermediate)* Why does [`client/src/api/client.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/api/client.js) attach the `x-csrf-token` header only for POST, PUT, PATCH, and DELETE requests, but skip it for GET and HEAD requests?
6. *(Intermediate)* What happens inside [`server/src/middleware/errorHandler.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/middleware/errorHandler.js) when Prisma throws a known request error with code `P2002`?
7. *(Advanced)* Why does the application use both Prisma Client and a raw `mysql2` connection pool instead of using only Prisma for all queries?
8. *(Advanced)* In [`client/src/pages/ContactFormPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactFormPage.jsx), what conditional rendering logic decides whether to show the "Medical details" form section versus the "Associated flats" form section?
9. *(Advanced)* If an administrator deactivates a contact in [`client/src/pages/ContactDirectoryPage.jsx`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/client/src/pages/ContactDirectoryPage.jsx), is that contact physically deleted (`DELETE FROM contacts`) from MySQL, or does something else happen?
10. *(Advanced)* How does [`server/src/services/authService.js`](file:///Users/aryan/Computer%20Science/Projects/SocietyContactBook/server/src/services/authService.js) ensure that the `/api/auth/setup` endpoint cannot be maliciously reused to create unauthorized admin accounts after the application has been deployed?