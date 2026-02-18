# Required Skills for TUNorth-EDMS Project

## 1. Backend Development (Go)
- **Language:** Go (Golang) version 1.22+ (Syntax, Goroutines, Channels)
- **Web Framework:** Fiber v2/v3 (High performance similar to Express.js)
- **Architecture:** Hexagonal Architecture (Ports and Adapters)
  - Understanding dependency injection.
  - Separating Core Logic from External Tools (DB, HTTP).
- **Database:** PostgreSQL & GORM (ORM library)
  - Struct tags for database mapping.
  - Migrations and Relationships (One-to-Many).

## 2. Frontend Development (Next.js)
- **Framework:** Next.js 16 (App Router paradigm)
- **Language:** TypeScript
- **Runtime:** Bun (Package manager & bundler)
- **Styling:** Tailwind CSS + Shadcn UI
  - Understanding utility-first CSS.
  - Customizing Radix UI components.
- **State Management:** Zustand (Global state without boilerplate)

## 3. DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose
- **Live Reload:** Air (for Go), Hot module replacement (for Next.js)
- **Server:** Ubuntu Command Line Basics

## 4. Specific Domain Knowledge
- **PDF Manipulation:** Understanding PDF structures, coordinates for placing signatures/stamps.
- **Digital Workflow:** Understanding the flow of "Receive -> Route -> Sign -> Finish".
- **Telegram Bot API:** Webhooks vs Polling, sending messages via HTTP.