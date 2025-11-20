# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack learning platform for SBF (Sportbootführerschein - Motor Boat License) exam preparation. It's a monorepo with a frontend Angular application and a Node.js/Express backend with MySQL database.

- **Frontend**: Angular 19 with standalone components, signals for state management, Angular Material for UI components, and Chart.js for data visualization
- **Backend**: Express.js with MySQL2, authentication (JWT, OAuth2), email support via Nodemailer, and comprehensive security middleware
- **Database**: MySQL for user data, questions, progress tracking, categories, bookmarks, and notes
- **Proxy**: Frontend uses proxy.conf.json to proxy API requests to backend (currently configured for https://lernapp.4roemer.de)

## Directory Structure

```
.
├── frontend/           # Angular 19 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── auth/          # Authentication components
│   │   │   │   │   ├── login/     # Login component
│   │   │   │   │   └── register/  # Registration component
│   │   │   │   ├── dashboard/     # Main dashboard
│   │   │   │   ├── learning/      # Learning mode components
│   │   │   │   │   ├── category-selection/  # Category selection
│   │   │   │   │   ├── chapter-list/        # Chapter list view
│   │   │   │   │   └── question-view/       # Question display
│   │   │   │   ├── exam/          # Exam mode components
│   │   │   │   │   ├── exam-mode/    # Timed exam
│   │   │   │   │   └── exam-result/  # Exam results display
│   │   │   │   ├── statistics/    # Progress and statistics
│   │   │   │   ├── profile/       # User profile management
│   │   │   │   └── shared/        # Reusable UI components
│   │   │   │       ├── header/       # Application header
│   │   │   │       ├── footer/       # Application footer
│   │   │   │       └── progress-bar/ # Progress indicator
│   │   │   ├── services/      # HTTP services (api.service, auth.service)
│   │   │   ├── guards/        # Route guards (auth.guard)
│   │   │   ├── interceptors/  # HTTP interceptors (auth.interceptor)
│   │   │   ├── models/        # TypeScript interfaces (models.ts)
│   │   │   ├── app.routes.ts  # Route configuration with lazy loading
│   │   │   └── app.config.ts  # Application configuration and providers
│   │   ├── environments/      # Environment-specific configuration
│   │   │   ├── environment.ts
│   │   │   ├── environment.development.ts
│   │   │   └── environment.prod.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss        # Global styles
│   ├── public/                # Static assets
│   ├── proxy.conf.json        # Proxy configuration for API requests
│   ├── angular.json           # Angular CLI configuration
│   ├── tsconfig.json          # TypeScript configuration
│   └── package.json
│
└── backend/            # Express.js API server
    ├── src/
    │   ├── server.js          # Express app initialization and middleware
    │   ├── config/
    │   │   └── database.js    # MySQL connection pool configuration
    │   ├── controllers/       # Route controllers
    │   │   ├── auth.controller.js      # Authentication logic
    │   │   ├── question.controller.js  # Question retrieval
    │   │   └── progress.controller.js  # Progress tracking, bookmarks, notes
    │   ├── routes/            # API route definitions
    │   │   ├── auth.routes.js          # Auth endpoints
    │   │   ├── question.routes.js      # Question endpoints
    │   │   └── progress.routes.js      # Progress endpoints
    │   ├── middleware/
    │   │   ├── auth.middleware.js      # JWT authentication
    │   │   └── validation.middleware.js # Input validation
    │   ├── services/
    │   │   └── email.service.js        # Email notifications (Nodemailer)
    │   └── utils/
    │       └── jwt.js                  # JWT token utilities
    ├── .env                   # Environment variables (do NOT commit - gitignored)
    ├── .env.example           # Example environment template
    └── package.json
```

## Frontend Commands

### Development
```bash
cd frontend
npm install              # Install dependencies
npm start               # Run dev server (ng serve) - http://localhost:4200
npm run watch           # Build in watch mode
```

### Build & Test
```bash
npm run build           # Build for development
npm run build:prod      # Production build with optimization
npm test                # Run unit tests with Karma
```

### Running a Single Test
```bash
npm test -- --browsers=Chrome --watch=true --include='**/specific-component.spec.ts'
```

## Backend Commands

### Development
```bash
cd backend
npm install             # Install dependencies
npm run dev             # Start with nodemon (watches for changes)
npm start               # Run production server
```

### Database
```bash
npm run migrate         # Run database migrations
```

### Testing
```bash
npm test                # Run Jest test suite
```

## Architecture

### Frontend Architecture

**Component Structure**: Uses standalone components exclusively (no NgModules).
- Components are lazy-loaded via routes
- Each component uses `input()` and `output()` functions instead of decorators
- State managed with Angular signals and `computed()` for derived values

**UI Framework & Libraries**:
- **Angular Material 19** - Material Design components for consistent UI
- **Chart.js** with **ng2-charts** - Data visualization for statistics and progress tracking
- **RxJS** - Reactive programming for async operations
- Custom shared components (header, footer, progress-bar) for reusable UI elements

**Key Routes**:
- `/` - Redirects to `/dashboard`
- `/login` - Authentication (public)
- `/register` - User registration (public)
- `/dashboard` - Main learning hub (protected by authGuard)
- `/learning/category-selection` - Select exam categories (protected)
- `/learning/question-view` - Learn mode with questions (protected)
- `/learning/questions/:schein/:kategorie` - Questions for specific license and category (protected)
- `/exam` - Timed exam mode (protected)
- `/statistics` - User progress and statistics with charts (protected)
- `/profile` - User profile management (protected)
- `/**` - Wildcard redirects to `/dashboard`

**Authentication Flow**:
- JWT tokens stored after login
- `authInterceptor` automatically adds token to all API requests
- `authGuard` protects routes, redirects to login if not authenticated
- Supports OAuth2 (Google, Facebook) in addition to email/password

**Component Organization**:
- **Auth Components**: Handle user registration, login, and authentication flows
- **Dashboard**: Main hub showing learning progress, quick actions, and statistics overview
- **Learning Components**:
  - Category selection for choosing topics to study
  - Chapter list for browsing through learning materials
  - Question view for practicing questions in learning mode (no time limit)
- **Exam Components**:
  - Exam mode for timed exam simulation
  - Exam result for displaying exam scores and detailed feedback
- **Statistics**: Visualizes user progress with charts, category breakdowns, and success rates
- **Profile**: User profile management, settings, and preferences
- **Shared Components**: Reusable UI components (header with navigation, footer, progress indicators)

**Key Models** (in `frontend/src/app/models/models.ts`):
- `User` - User information with roles (ADMIN, TRAINER, MITGLIED), email, name, preferred license
- `License` - Available boat license types
- `Category` - Question categories with nested subcategories
- `Unterkategorie` - Subcategories with question counts
- `Question` - Questions with text, images, license type, category, page reference, and answers array
- `Answer` - Individual answer options with letter identifier, text, and correctness flag
- `Progress` - Overall user progress (answered questions, correct answers, success rate)
- `CategoryProgress` - Detailed progress per category/subcategory
- `AuthResponse` - Authentication response (token, refreshToken, user data)
- `LoginRequest` / `RegisterRequest` - Authentication request payloads
- `SubmitAnswerRequest` / `SubmitAnswerResponse` - Answer submission and validation

### Backend Architecture

**Framework**: Express.js with middleware for security (helmet), CORS, compression, rate limiting, and logging.

**Authentication**:
- JWT tokens for session management
- Password hashing with bcryptjs
- Passport.js integration for OAuth2 (Google, Facebook)

**API Structure**:
- `auth.routes.js` - Login, register, logout, password management, profile management, OAuth2 (Google, Facebook)
- `question.routes.js` - Get licenses, categories, questions, question images, random questions
- `progress.routes.js` - Track user answers, get statistics, bookmarks, notes, wrong answers

**Controllers**:
- Separated from routes for clean architecture
- Handle business logic and database queries
- Email service for password resets and notifications

**Database**:
- MySQL via mysql2 driver
- Stores users, questions, progress, categories
- Migration system for schema management

**Security**:
- Rate limiting on API endpoints (configurable via .env)
- Input validation with express-validator
- CORS configured for frontend origin
- JWT token expiration and refresh mechanism
- Helmet.js for security headers
- Request compression for performance
- Morgan for request logging (dev mode shows detailed logs)

**API Endpoints**:

*Authentication (`/api/auth`)*:
- `POST /register` - Register new user
- `POST /login` - Login with email/password
- `POST /logout` - Logout (requires auth)
- `POST /change-password` - Change password (requires auth)
- `GET /me` - Get current user info (requires auth)
- `PUT /profile` - Update user profile (requires auth)
- `GET /google` - OAuth2 Google authentication
- `GET /google/callback` - Google OAuth callback
- `GET /facebook` - OAuth2 Facebook authentication
- `GET /facebook/callback` - Facebook OAuth callback

*Questions (`/api`)*:
- `GET /licenses` - Get available licenses (requires auth)
- `GET /categories/:schein` - Get categories for a license (requires auth)
- `GET /questions` - Get questions by category (requires auth, query params: schein, kategorie, unterkategorie)
- `GET /questions/:frage_id` - Get specific question (requires auth)
- `GET /questions/:frage_id/image` - Get question image (requires auth)
- `GET /questions/random` - Get random questions (requires auth)

*Progress (`/api/progress`)*:
- `POST /submit` - Submit answer for a question (requires auth)
- `GET /user` - Get overall user progress (requires auth)
- `GET /categories` - Get progress by category (requires auth)
- `GET /wrong` - Get questions answered incorrectly (requires auth)
- `GET /bookmarks` - Get bookmarked questions (requires auth)
- `POST /bookmarks/:frage_id` - Toggle bookmark on a question (requires auth)
- `POST /notes` - Save note for a question (requires auth)

*Health Check*:
- `GET /health` - Server health status (includes uptime, database info)
- `GET /` - API information and version

## Development Notes

### Common Tasks

**Add a New Route**:
1. Create component in `frontend/src/app/components/[feature]`
2. Add route configuration in `app.routes.ts` with lazy loading
3. Create backend route in `backend/src/routes/[feature].routes.js`
4. Implement controller in `backend/src/controllers/[feature].controller.js`

**Add New API Endpoint**:
1. Define route in backend routes file
2. Implement controller logic
3. Create/update service in frontend
4. Call service from component

**Authentication**:
- Frontend handles token in `auth.service.ts` via login/register
- Backend validates JWT in `auth.middleware.js`
- Token automatically included in requests via `auth.interceptor.ts`

### Important Angular Conventions

As noted in the existing CLAUDE.md file:
- Use standalone components (no NgModules)
- Use signals for state: `signal()`, `computed()`, `effect()`
- Use `input()` and `output()` instead of `@Input`/`@Output` decorators
- Use `class` and `style` bindings instead of `ngClass`/`ngStyle`
- Use control flow syntax: `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on all components
- Use `provideHttpClient` with `withInterceptors` for HTTP
- Lazy load feature components via routes

### Backend Configuration

Backend uses `.env` file for configuration (see `.env.example` for all options):

**Database**:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

**JWT & Security**:
- `JWT_SECRET` - Secret key for JWT signing (min 32 characters)
- `JWT_EXPIRES_IN` - Token expiration (e.g., 24h)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (e.g., 7d)
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 10)
- `SESSION_SECRET` - Session secret key

**OAuth2**:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` / `FACEBOOK_CALLBACK_URL`

**Email (SMTP)**:
- `SMTP_HOST` - SMTP server (e.g., smtp.kasserver.com)
- `SMTP_PORT` - SMTP port (default: 587)
- `SMTP_SECURE` - Use TLS (true/false)
- `SMTP_USER` / `SMTP_PASSWORD` - SMTP credentials
- `SMTP_FROM` - Sender email and name

**Application URLs**:
- `APP_URL` - Application URL
- `API_URL` - API URL
- `FRONTEND_URL` - Frontend URL (for CORS)

**Server**:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `RATE_LIMIT_MAX` - Max requests per window (default: 100)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in ms (default: 900000 = 15 min)

### Frontend Configuration

**Proxy Configuration** (`frontend/proxy.conf.json`):
- Proxies `/api` requests to backend server
- Currently configured for: `https://lernapp.4roemer.de`
- Used during development with `ng serve --proxy-config proxy.conf.json`

**Environment Files** (`frontend/src/environments/`):
- `environment.ts` - Default environment
- `environment.development.ts` - Development environment
- `environment.prod.ts` - Production environment with optimizations
- Configure API URLs and feature flags here

## Testing

- **Frontend**: Karma + Jasmine (test files: `*.spec.ts`)
- **Backend**: Jest (test files can follow Jest conventions)
- Tests should cover controllers, services, and critical business logic
- Use async/await for testing async code

## Deployment

**Frontend**:
- Build command: `npm run build:prod` (includes optimization, AOT compilation, build optimizer)
- Output directory: `dist/sbf-lernplattform/`
- Serves static files via web server (nginx, Apache, or hosting platform)
- Update `environment.prod.ts` with production API URL
- Update `proxy.conf.json` if using proxy in development

**Backend**:
- Production start: `npm start` (runs `node src/server.js`)
- Ensure all `.env` variables are properly configured
- Database migrations: `npm run migrate` (if needed)
- Server starts on port from `PORT` env variable (default: 3000)
- Health check available at `/health` endpoint
- Uses graceful shutdown handlers for SIGTERM/SIGINT

**Security Checklist**:
- Rate limiting, CORS, and helmet middleware protect the API
- JWT secrets should be strong (32+ characters)
- Database credentials secured via environment variables
- HTTPS/TLS enabled in production
- SMTP credentials for email notifications configured
- OAuth2 credentials properly set up (if using social login)

**Database**:
- MySQL database must be created and accessible
- Run any pending migrations before starting the server
- Regular backups recommended for production data

## Additional Notes

**Project Status**:
- API Version: 2.0.0 (adapted for existing database structure)
- Database identifier: d0455d0b
- Currently deployed at: https://lernapp.4roemer.de (backend)

**Development Workflow**:
1. Start backend: `cd backend && npm run dev` (runs on port 3000)
2. Start frontend: `cd frontend && npm start` (runs on port 4200, proxies API requests)
3. Access app at http://localhost:4200
4. Backend logs show all API requests in development mode

**Troubleshooting**:
- If database connection fails, check `.env` configuration
- If CORS errors occur, verify `FRONTEND_URL` in backend `.env`
- For proxy issues, check `proxy.conf.json` target URL
- Rate limiting errors: adjust `RATE_LIMIT_MAX` or `RATE_LIMIT_WINDOW_MS`
