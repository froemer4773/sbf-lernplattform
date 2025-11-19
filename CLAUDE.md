# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack learning platform for SBF (Sportbootführerschein - Motor Boat License) exam preparation. It's a monorepo with a frontend Angular application and a Node.js/Express backend with MySQL database.

- **Frontend**: Angular 19 with standalone components and signals for state management
- **Backend**: Express.js with MySQL2, authentication (JWT, OAuth2), and email support
- **Database**: MySQL for user data, questions, progress tracking, and categories

## Directory Structure

```
.
├── frontend/           # Angular 19 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Feature components (auth, learning, exam, dashboard, etc.)
│   │   │   ├── services/      # HTTP services (api.service, auth.service)
│   │   │   ├── guards/        # Route guards (auth.guard)
│   │   │   ├── interceptors/  # HTTP interceptors (auth.interceptor)
│   │   │   ├── models/        # TypeScript interfaces and types
│   │   │   ├── app.routes.ts  # Route configuration with lazy loading
│   │   │   └── app.config.ts  # Application configuration and providers
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss        # Global styles
│   ├── angular.json           # Angular CLI configuration
│   └── tsconfig.json          # TypeScript configuration
│
└── backend/            # Express.js API server
    ├── src/
    │   ├── server.js          # Express app initialization
    │   ├── config/            # Database configuration
    │   ├── controllers/       # Route controllers (auth, question, progress)
    │   ├── routes/            # API route definitions
    │   ├── middleware/        # Express middleware (auth, validation)
    │   ├── services/          # Business logic (email service)
    │   └── utils/             # JWT utilities
    ├── .env                   # Environment variables (do NOT commit)
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

**Key Routes**:
- `/login` - Authentication
- `/register` - User registration
- `/dashboard` - Main learning hub (protected)
- `/learning/category-selection` - Select exam categories
- `/learning/question-view` - Learn mode with questions
- `/exam` - Timed exam mode
- `/statistics` - User progress and statistics
- `/profile` - User profile management

**Authentication Flow**:
- JWT tokens stored after login
- `authInterceptor` automatically adds token to all API requests
- `authGuard` protects routes, redirects to login if not authenticated
- Supports OAuth2 (Google, Facebook) in addition to email/password

**Key Models** (in `models.ts`):
- `User` - User information with roles (ADMIN, TRAINER, MITGLIED)
- `Question` - Questions with images, answers, and metadata
- `Answer` - Individual answer options with correctness flags
- `Progress` - User learning progress tracking
- `Category` / `Unterkategorie` - Question organization

### Backend Architecture

**Framework**: Express.js with middleware for security (helmet), CORS, compression, rate limiting, and logging.

**Authentication**:
- JWT tokens for session management
- Password hashing with bcryptjs
- Passport.js integration for OAuth2 (Google, Facebook)

**API Structure**:
- `auth.routes.js` - Login, register, logout, token refresh
- `question.routes.js` - Get questions, categories, images
- `progress.routes.js` - Track user answers, get statistics

**Controllers**:
- Separated from routes for clean architecture
- Handle business logic and database queries
- Email service for password resets and notifications

**Database**:
- MySQL via mysql2 driver
- Stores users, questions, progress, categories
- Migration system for schema management

**Security**:
- Rate limiting on API endpoints
- Input validation with express-validator
- CORS configured for frontend origin
- JWT token expiration and refresh mechanism

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

### Database Configuration

Backend connects to MySQL via `.env` variables:
- `DB_HOST` - Database host
- `DB_USER` - Database user
- `DB_PASS` - Database password
- `DB_NAME` - Database name

Use `.env.example` as a template for local setup.

### Frontend Environment Configuration

Check `frontend/src/environments/` for environment-specific API URLs and configuration.

## Testing

- **Frontend**: Karma + Jasmine (test files: `*.spec.ts`)
- **Backend**: Jest (test files can follow Jest conventions)
- Tests should cover controllers, services, and critical business logic
- Use async/await for testing async code

## Deployment

- Frontend builds to `dist/sbf-lernplattform/` with production optimizations
- Backend runs via `npm start` in production
- Rate limiting, CORS, and helmet middleware protect the API
- Ensure all environment variables are properly configured in production
