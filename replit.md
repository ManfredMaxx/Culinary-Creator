# BakedWithRowan

## Overview

BakedWithRowan is a personal recipe collection web application that transforms cooking stories into beautiful recipes. Users can record recipes verbally using voice-to-text conversion, capture cooking stages with photos, and create printable recipe books to share with family and friends.

The application features:
- Voice-to-recipe transcription using AI
- Photo capture and AI-powered cooking stage recognition
- Recipe management (create, view, edit, delete)
- Recipe book generation with HTML and PDF export options
- Beautiful Michelin-star themed cookbook formatting
- User authentication via Replit Auth
- User profile management with editable personal information
- Account deletion with cascade cleanup of all user data
- Social features:
  - Public/private recipe visibility controls
  - Explore page showing public recipes from all users
  - Follow other users (chefs) from recipe detail pages or user profiles
  - Chefs feed showing recipes from followed users
  - Like/unlike recipes
  - Public user profiles with follow button
  - Clickable chef names on recipe cards and detail pages (links to chef profiles)
  - Editable profile name (display name) separate from username

## User Preferences

Preferred communication style: Simple, everyday language.

### Design Aesthetic
The app uses an elegant, Michelin-star French restaurant aesthetic:
- **Theme**: Dark, moody ambiance like a candlelit fine dining room
- **Primary Color**: Warm amber/gold (#d9a441) - like candlelight
- **Accent Color**: Deep burgundy/wine (#8B4557)
- **Background**: Rich dark tones (near-black with warm undertones)
- **Typography**: Playfair Display (serif) for headings, Plus Jakarta Sans for body
- **Effects**: Subtle candlelight flicker animations, atmospheric glows, chrome shimmer on hover
- **Iconography**: "bwr" text logo in Times New Roman font, lucide-react icons throughout (no emojis)
- **Branding**: App name is "BakedWithRowan" with lowercase "bwr" logo

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with React plugin
- **Theme**: Dark-first design with elegant Michelin-star restaurant aesthetic (candlelit, moody, sophisticated)

The frontend follows a pages-based structure with reusable components. Key pages include dashboard, recipe creation (with voice recording), recipe viewing, recipe book generation, and user profile management.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: Replit Auth with OpenID Connect, session-based using express-session
- **AI Integration**: OpenAI API (via Replit AI Integrations) for:
  - Speech-to-text transcription
  - Recipe parsing from voice input
  - Image generation capabilities

The server uses a modular integration pattern with dedicated folders under `server/replit_integrations/` for auth, audio processing, chat, image generation, and batch processing utilities.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Session Storage**: PostgreSQL via connect-pg-simple
- **Key Tables**:
  - `users` - User accounts from Replit Auth
  - `sessions` - Session management
  - `recipes` - Recipe metadata (title, description, times, servings, isPublic)
  - `ingredients` - Recipe ingredients with quantities and units
  - `recipe_steps` - Cooking instructions with optional images
  - `recipe_images` - Additional cooking stage photos
  - `conversations` / `messages` - Chat history for AI interactions
  - `follows` - User follow relationships (followerId + followingId composite key)
  - `recipe_likes` - Recipe likes (userId + recipeId composite key)

### Authentication Flow
The app uses Replit Auth with OIDC. Users authenticate through Replit's identity provider, and sessions are stored in PostgreSQL. The `isAuthenticated` middleware protects API routes, and user data is synced to the local database on login.

**ID Architecture** (designed for future auth provider migration):
- `id` (UUID): Internal primary key used for all database foreign keys (recipes, follows, likes)
- `replitId`: External auth provider identifier (the `sub` claim from OIDC)
- Auth flow: Login → lookup by `replitId` → use internal `id` for all operations
- Helper functions in routes.ts: `getUserId()` for optional auth, `requireUserId()` for authenticated routes
- Storage methods: `getUser(replitId)` for auth lookups, `getUserById(id)` for internal operations

## External Dependencies

### AI Services
- **OpenAI API** (via Replit AI Integrations): Used for speech-to-text, recipe parsing, and image generation
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Database
- **PostgreSQL**: Primary data store
- Environment variable: `DATABASE_URL`
- Migrations managed via Drizzle Kit (`npm run db:push`)

### Audio Processing
- **FFmpeg**: Required for audio format conversion (WebM/Opus to WAV for transcription)
- Client-side audio recording uses MediaRecorder API with WebM/Opus format
- Server converts to WAV before sending to OpenAI Whisper

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `openai`: AI API client
- `passport` / `openid-client`: Authentication
- `express-session` / `connect-pg-simple`: Session management
- `@tanstack/react-query`: Client-side data fetching
- `@radix-ui/*`: Accessible UI primitives for shadcn/ui components
- `puppeteer-core`: PDF generation from HTML (uses system chromium)