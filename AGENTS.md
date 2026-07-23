# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Project

SmartPharma is an online pharmacy monorepo:

- `backend/`: Spring Boot 3.5.x, Java 21, Gradle, PostgreSQL, Redis, Flyway, JWT/OAuth2, RBAC, WebSocket, SePay, GHN, S3.
- `frontend-customer/`: React 19, TypeScript, Vite, TailwindCSS 4, React Router, Axios, TanStack Query.
- `frontend-admin/`: React 19, TypeScript, Vite, TailwindCSS 4, React Hook Form, Framer Motion, rich text product admin.
- `frontend-pharmacist/`: React 19, TypeScript, Vite, TailwindCSS 4, WebSocket/STOMP consultation UI.
- `chatbot-ai/`: FastAPI chatbot service with Gemini/RAG/Qdrant and internal JWT auth.
- `rcm-service/`: FastAPI recommendation service with Qdrant and internal JWT auth.
- `data/`: supporting data tooling.

## Required Coordination

- Any code, schema, config, architecture, workflow, or documentation change must be reflected in the Notion project hub:
  `https://app.notion.com/p/Smart-Pharma-Project-Hub-3a65367fc07a81f0a31fc8476a11a64e`
- When Notion tools are available, update the hub or create/update a linked changelog/decision/documentation entry in the same turn.
- If Notion tools are unavailable, state that the Notion update is pending and include a concise note the user can add later.
- Never put secrets, tokens, `.env.local` contents, private keys, or customer/health data into Notion.

## Agent Skills

Use the installed skills when relevant:

- `smartpharma-local-run` for running the backend locally.
- `java-architect` for Spring Boot, JPA, security, Gradle, and backend debugging.
- `fastapi-python` for `chatbot-ai` and `rcm-service`.
- `vercel-react-best-practices` for React/Vite performance work.
- `vercel-composition-patterns` for React component architecture.
- `ui-ux-pro-max` for UI/UX, typography, palettes, accessibility, and data visualization.
- `responsive-craft` for responsive/mobile layout work and breakpoint preview.
- `frontend-testing-best-practices` for frontend tests.
- `codex-security-review` for security-sensitive changes.
- `codex-impl-review`, `codex-plan-review`, `codex-codebase-review`, and related review skills for review-heavy tasks.

Read a skill's `SKILL.md` before using it.

## Local Run Commands

Recommended full local stack:

```bash
docker compose -f docker-compose-local.yml up --build -d
```

Backend local run from `backend/`:

```bash
export $(grep -v '^#' .env.local | xargs) && ./gradlew bootRun --args='--spring.profiles.active=local'
```

Frontend dev servers:

```bash
cd frontend-customer && npm run dev
cd frontend-admin && npm run dev
cd frontend-pharmacist && npm run dev
```

Python services:

```bash
cd chatbot-ai && uvicorn app.main:app --port 8001
cd rcm-service && uvicorn app.main:app --port 8002
```

Expected URLs:

- Customer: `http://localhost:3000`
- Admin: `http://localhost:3001`
- Pharmacist: `http://localhost:3002`
- Backend API: `http://localhost:8080`
- Chatbot AI: `http://localhost:8001`
- RCM Service: `http://localhost:8002`
- Qdrant: `http://localhost:6333`

## Verification

Backend:

```bash
cd backend && ./gradlew test
cd backend && ./gradlew check
```

Frontend:

```bash
cd frontend-customer && npm run lint && npm run build
cd frontend-admin && npm run lint && npm run build
cd frontend-pharmacist && npm run lint && npm run build
```

Python services:

```bash
cd chatbot-ai && pytest
cd rcm-service && pytest
```

Run the smallest relevant verification first. Broaden testing when touching shared APIs, auth, order/payment, inventory, migrations, RBAC, or cross-service contracts.

## Engineering Rules

- Preserve existing architecture and naming patterns.
- Keep changes scoped to the requested behavior.
- Do not revert unrelated dirty work.
- Do not commit secrets or generated local artifacts.
- Prefer typed DTOs/contracts over ad hoc payloads.
- For backend API changes, update matching frontend API clients/types and any internal service clients.
- For database changes, use Flyway migrations under `backend/src/main/resources/db/migration/postgresql/`.
- Treat pharmacy, health, payment, auth, and RBAC flows as security-sensitive.
- For UI work, verify responsive behavior on mobile and desktop.
- For long-running servers, use a managed session and report the URL plus how to stop/check logs.

## Sensitive Areas

Use extra care and stronger verification for:

- JWT/OAuth2/internal JWT authentication.
- RBAC permissions and protected roles.
- SePay webhook/payment state transitions.
- GHN shipping and order tracking.
- Order cancellation, return, refund, and inventory side effects.
- Flash sale stock reservation and Redis/Lua claim logic.
- Chatbot medical guidance, RAG retrieval, and metadata generation.
- Recommendation service routing and fallback behavior.
