# 💊 SmartPharma – Online Pharmacy Platform

<div align="center">

**A comprehensive online pharmacy platform with real-time pharmacist consultation, RBAC, AI-powered chat metadata, and internal-service product recommendations.**

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.9-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi&logoColor=white)

</div>

---

## 📖 Overview

**SmartPharma** is a full-featured online pharmacy system with a Spring Boot backend, role-specific React interfaces, and supporting AI services. It enables customers to purchase medications, receive real-time pharmacist consultations via chat, and get AI-powered smart product recommendations.

The current architecture includes:

- centralized RBAC for backend and admin permissions
- internal JWT authentication between backend, chatbot-ai, and rcm-service
- async chatbot metadata generation for conversation `title` and `summary`

The system provides **3 separate interfaces** tailored for each role: **Customer**, **Pharmacist**, and **Administrator**.


---

## 👥 User Roles

| Role | Description |
|---|---|
| **Customer** | Browse products, place orders, chat with pharmacists and AI |
| **Pharmacist** | Conduct consultations and support customer health questions |
| **Staff** | Manage catalog, inventory, orders, and operational workflows |
| **Super Admin** | Manage users, RBAC, payments, analytics, and protected system settings |

---

## ✨ Key Features

### 🛒 Customer
- Registration & Login (JWT + OAuth2)
- Product search & filtering by category, active ingredient, and usage
- Product details, ratings & reviews
- Shopping cart management & order placement
- Payment via COD or bank transfer with SePay integration
- Shipping fee calculation, shipment creation, delivery lead time, and tracking via GHN
- Real-time order and delivery tracking
- Live chat consultation with pharmacists (WebSocket)
- AI chat consultation powered by Gemini + RAG
- AI-powered smart product recommendations

### 💬 Pharmacist
- Online/Offline status management
- Accept & conduct consultation sessions via real-time chat
- Access consultation context and patient history
- Recommend products during customer consultation

### 🛠️ Staff & Super Admin
- Product & category management (CRUD with Rich Text Editor)
- Inventory management
- Order management & payment tracking
- Pharmacist account & consultation session management
- User management with permission-based RBAC
- Role & permission management with protected roles and audit logging
- Analytics dashboard & revenue reports

### 🤖 AI & Machine Learning
- **AI Chatbot**: Medication consultation API using Gemini, RAG with Qdrant, PostgreSQL-backed user context, and internal JWT protection
- **Recommendation Service**: Hybrid product recommendations using Qdrant content search, item-based collaborative filtering from events, and trending fallback

---

## 🏗️ System Architecture

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Frontend Customer│  │  Frontend Admin  │  │Frontend Pharmacist│
│   (React + Vite) │  │  (React + Vite)  │  │  (React + Vite)  │
│    Port: 3000    │  │    Port: 3001    │  │    Port: 3002    │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   Backend API    │
                    │  (Spring Boot)   │
                    │    Port: 8080    │
                    └─────────┬────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌────────────┐       ┌─────────┐         ┌─────────┐
   │ PostgreSQL │       │Chatbot  │         │  RCM    │
   │  Port:5434 │       │   AI    │         │ Service │
   └────────────┘       │Port:8001│         │Port:8002│
          ▲             └────┬────┘         └────┬────┘
          │                  │                   │
          └──────────────────┴──────────┬────────┘
                                        ▼
                                  ┌─────────┐
                                  │ Qdrant  │
                                  │Port:6333│
                                  └─────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Description |
|---|---|
| **Java 21** | Primary programming language |
| **Spring Boot 3.5.9** | Backend framework |
| **Spring Security + OAuth2** | Authentication & authorization (JWT) |
| **RBAC custom layer** | Permission-based authorization across roles |
| **Spring Data JPA** | ORM for PostgreSQL |
| **Spring Data JPA + PostgreSQL** | Chat history and metadata storage |
| **Spring WebSocket** | Real-time chat communication |
| **Flyway** | Database migration management |
| **AWS S3 SDK** | Media upload & management |
| **SePay** | Bank transfer payment QR and webhook reconciliation |
| **GHN** | Shipping fee, shipment creation, lead time, and tracking integration |
| **SpringDoc OpenAPI** | API documentation (Swagger UI) |
| **Lombok** | Boilerplate code reduction |

### Frontend (×3)
| Technology | Description |
|---|---|
| **React 19** | UI Library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool & dev server |
| **TailwindCSS 4** | Utility-first CSS framework |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client |
| **React Query (TanStack)** | Server state management (Customer) |
| **React Hook Form** | Form handling (Admin, Pharmacist) |
| **Framer Motion** | Animations (Admin, Pharmacist) |
| **React Quill** | Rich Text Editor (Admin) |

### AI Services (Python)
| Technology | Description |
|---|---|
| **FastAPI** | Web framework for AI services |
| **Google Gemini** | LLM for chatbot |
| **Google GenAI SDK** | Gemini generation and embedding client |
| **Qdrant** | Vector database for RAG and content-based recommendations |
| **PostgreSQL** | User context, product data, inventory, reviews, and behavior events |
| **Cohere** | Optional reranking dependency for chatbot retrieval |
| **Internal JWT** | Backend-to-service authentication for chatbot and recommendation APIs |

### Infrastructure
| Technology | Description |
|---|---|
| **Docker Compose** | Container orchestration |
| **PostgreSQL 15** | Primary relational database |

---

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (recommended)
- Or install manually:
  - Java 21+
  - Node.js 18+
  - Python 3.10+
  - PostgreSQL 15+

### Run with Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd online-pharmacy

# 2. Create .env files from templates
cp backend/.env.example backend/.env
cp chatbot-ai/.env.example chatbot-ai/.env
cp rcm-service/.env.example rcm-service/.env
cp frontend-customer/.env.example frontend-customer/.env
cp frontend-admin/.env.example frontend-admin/.env
cp frontend-pharmacist/.env.example frontend-pharmacist/.env

# 3. Edit .env files with your actual credentials
#    (API keys, database credentials, etc.)

# 4. Start all local services, including Qdrant
docker compose -f docker-compose-local.yml up --build -d
```

### Run Manually (Development)

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your database configuration
./gradlew bootRun
```

#### Frontend (Customer / Admin / Pharmacist)
```bash
cd frontend-customer  # or frontend-admin, frontend-pharmacist
cp .env.example .env
npm install
npm run dev
```

#### AI Services
```bash
# Chatbot AI
cd chatbot-ai
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --port 8001

# Recommendation Service
cd rcm-service
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --port 8002
```

Notes:

- `chatbot-ai` exposes `/api/v1/chat` and `/api/v1/chat/metadata` behind internal JWT auth.
- `rcm-service` only accepts recommendation requests with backend-issued internal JWTs.
- Chat metadata is generated asynchronously after the main reply so the chat response path stays fast.

---

## 🌐 Service URLs

| Service | URL | Description |
|---|---|---|
| Frontend Customer | [http://localhost:3000](http://localhost:3000) | Customer-facing storefront |
| Frontend Admin | [http://localhost:3001](http://localhost:3001) | Admin dashboard |
| Frontend Pharmacist | [http://localhost:3002](http://localhost:3002) | Pharmacist workspace |
| Backend API | [http://localhost:8080](http://localhost:8080) | REST API server |
| Chatbot AI | [http://localhost:8001](http://localhost:8001) | Chatbot API |
| RCM Service | [http://localhost:8002](http://localhost:8002) | Recommendation API |
