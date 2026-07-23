# CLAUDE.md

## Build and Run Commands
- **Full stack local**: `docker compose -f docker-compose-local.yml up --build -d`
- **Backend (Spring Boot)**: `cd backend && export $(grep -v '^#' .env.local | xargs) && ./gradlew bootRun --args='--spring.profiles.active=local'`
- **Customer Frontend (React/Vite)**: `cd frontend-customer && npm run dev`
- **Admin Frontend (React/Vite)**: `cd frontend-admin && npm run dev`
- **Pharmacist Frontend (React/Vite)**: `cd frontend-pharmacist && npm run dev`
- **Chatbot Service (FastAPI)**: `cd chatbot-ai && uvicorn app.main:app --port 8001`
- **Recommendation Service (FastAPI)**: `cd rcm-service && uvicorn app.main:app --port 8002`

## Verification and Testing
- **Backend**: `cd backend && ./gradlew test && ./gradlew check`
- **Frontend Customer**: `cd frontend-customer && npm run lint && npm run build`
- **Frontend Admin**: `cd frontend-admin && npm run lint && npm run build`
- **Frontend Pharmacist**: `cd frontend-pharmacist && npm run lint && npm run build`
- **Chatbot AI**: `cd chatbot-ai && pytest`
- **Recommendation Service**: `cd rcm-service && pytest`

## Engineering Guidelines
Refer to [AGENTS.md](AGENTS.md) for detailed guidelines, including:
- Notion project hub updates.
- Flyway database migration requirements.
- Core architecture & security conventions.
