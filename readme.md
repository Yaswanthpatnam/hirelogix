# Hirelogix - Job Application Tracking System

HireLogix is a production-ready full-stack web application that helps users efficiently track, manage, and analyze their job applications across multiple hiring stages.

It replaces manual spreadsheets with a centralized, secure, and scalable tracking system.

The platform is built with a modern React frontend, a Django REST backend, and a cloud-native deployment architecture.

## 🚀 Features

Secure user authentication with JWT (access & refresh tokens)

Track job applications across multiple stages (Applied, Shortlisted, Interview, Offer, etc.)

Update stages and verdicts dynamically (Accepted, Rejected, Ghosted)

Advanced filtering, pagination, and search for large datasets

Dashboard analytics showing pipeline and final outcomes

Resume upload and storage using Cloudinary

Password reset via email (SMTP integration)

Rate limiting and throttling for API protection

Redis caching for improved performance

Fully responsive UI optimized for mobile, tablet, and desktop

## 🛠 Tech Stack
Frontend

React.js

Tailwind CSS

JavaScript

Deployed on Vercel

Backend

Django

Django Rest Framework (DRF)

JWT Authentication (SimpleJWT)

PostgreSQL (Neon)

Redis (Caching & Sessions)

Docker (Containerization)

Deployed on Render

Infrastructure & Tools

Cloudinary (PDF resume storage)

Neon PostgreSQL (Managed database)

Redis Cloud

Docker & Docker Compose

Git & GitHub

## 🏗 Architecture Overview

Frontend communicates with backend via REST APIs

Backend exposes versioned DRF endpoints secured with JWT

Redis handles caching, session storage, and repeated query optimization

PostgreSQL stores normalized application and user data

Cloudinary stores uploaded resumes securely

Fully containerized backend using Docker

Environment-based configuration for local and production setups

## 📂 Project Structure (Backend)
hirelogix-backend/
│
├── core/                # Project settings & URLs
├── user/                # Custom user model & auth logic
├── jobs/                # Job application domain logic
├── media/               # Local media (dev only)
├── Dockerfile
├── entrypoint.sh
├── Procfile
├── requirements.txt
└── manage.py

## 🔐 Environment Variables

Create a .env file in the backend root:

SECRET_KEY=your_secret_key
DEBUG=False

DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://hostname:port/1

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

FRONTEND_RESET_URL=https://your-frontend-domain/user/reset-password

## 🧪 Running Locally
Backend
git clone https://github.com/Yaswanthpatnam/hirelogix/tree/main/backend
cd hirelogix/backend

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver

Frontend
git clone https://github.com/Yaswanthpatnam/hirelogix/tree/main/frontend
cd hirelogix/frontend

npm install
npm run dev

## 🐳 Docker Setup (Backend)
docker build -t hirelogix-backend .
docker run -p 8000:8000 hirelogix-backend

## 📊 Performance & Optimization

Redis caching reduces repeated DB queries and improves response time

Pagination prevents over-fetching large datasets

Database indexing improves filtering and search performance

API throttling protects against abuse and traffic spikes

Dockerized deployment ensures consistent builds across environments

## 🌍 Deployment

Frontend: Vercel

Backend: Render (Docker runtime)

Database: Neon PostgreSQL

Cache: Redis Cloud

Media: Cloudinary

## Live
https://hirelogix.vercel.app/

## 👤 Author

Yaswanth Babu Patnam
Full-Stack Developer | Django | React | REST APIs

## GitHub: https://github.com/Yaswanthpatnam/