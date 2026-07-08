# HireFlow

**AI-Powered Recruitment Pipeline System**

HireFlow is a modern, full-stack recruitment management platform that leverages artificial intelligence to streamline the hiring process. The system consists of a React frontend and a .NET 8.0 backend API.

## 🏗️ Project Structure

This repository contains two main projects:

- **[hireflow/](./hireflow/)** - React + TypeScript frontend application
- **[HireFlow.Api/](./HireFlow.Api/)** - .NET 8.0 Web API backend

---

## 🚀 HireFlow Frontend (React)

### Overview
A modern, responsive single-page application built with React 19, TypeScript, and Vite. The frontend provides an intuitive interface for managing the entire recruitment pipeline.

### Tech Stack
- **Framework**: React 19.2.7 with TypeScript
- **Build Tool**: Vite 8.1.1
- **Styling**: Tailwind CSS 3.4.19
- **Icons**: Lucide React 1.23.0
- **Linting**: Oxlint 1.71.0
- **Module System**: ES Modules

### Features
The application is organized into 5 main pipeline stages:

1. **Job Setup** - Configure job postings and requirements
2. **CV Screening** - AI-powered candidate screening and evaluation
3. **Interview Round 1** - First round interview management
4. **Interview Round 2** - Second round interview management
5. **Offer Letters** - Generate and manage offer letters

### Project Structure
```
hireflow/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers (Pipeline, Modal)
│   ├── pages/            # Main application pages
│   ├── types/            # TypeScript type definitions
│   ├── lib/              # Utility functions and helpers
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

### Getting Started

#### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

#### Installation
```bash
cd hireflow
npm install
```

#### Development
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

#### Build
```bash
npm run build
```

#### Lint
```bash
npm run lint
```

---

## 🔧 HireFlow.Api (.NET Backend)

### Overview
A robust RESTful API built with .NET 8.0 that powers the HireFlow platform. It provides endpoints for managing jobs, candidates, and AI-powered recruitment features.

### Tech Stack
- **Framework**: .NET 8.0 (ASP.NET Core Web API)
- **Database**: PostgreSQL with Entity Framework Core 8.0.10
- **AI Integration**: 
  - Anthropic Claude SDK (5.10.0)
  - Google Gemini AI (Google.Cloud.AIPlatform.V1 3.72.0)
  - Microsoft.Extensions.AI (10.7.0)
- **Documentation**: Swashbuckle.AspNetCore (Swagger/OpenAPI)
- **ORM**: Entity Framework Core with Npgsql provider

### Key Features
- **AI-Powered Recruitment**: Integration with multiple AI providers for intelligent candidate screening
- **Job Management**: Complete CRUD operations for job postings
- **Candidate Tracking**: Manage candidates through the recruitment pipeline
- **PostgreSQL Database**: Reliable data persistence with EF Core
- **Swagger Documentation**: Interactive API documentation
- **User Secrets**: Secure configuration management for API keys

### Project Structure
```
HireFlow.Api/
├── HireFlow.Api/
│   ├── Program.cs                    # Application entry point
│   ├── HireFlow.Api.csproj           # Project configuration
│   ├── appsettings.json              # Application settings
│   ├── appsettings.Development.json  # Development settings
│   ├── docker-compose.yml            # Docker configuration
│   ├── HireFlow.Api.http             # HTTP test file
│   ├── Data/                         # Database context and migrations
│   ├── DTOs/                         # Data Transfer Objects
│   ├── Endpoints/                    # API endpoint definitions
│   ├── Models/                       # Domain models
│   ├── Services/                     # Business logic services
│   ├── Common/                       # Shared utilities
│   └── Migrations/                   # EF Core database migrations
└── HireFlow.Api.slnx                 # Solution file
```

### API Endpoints
- **Job Endpoints** - Manage job postings and requirements
- **Candidate Endpoints** - Handle candidate data and screening

### Getting Started

#### Prerequisites
- .NET 8.0 SDK
- PostgreSQL database (running on port 5433 by default)
- AI API keys (Anthropic Claude and/or Google Gemini)

#### Configuration
1. Set up the database connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "**********************************" 🤣😂😎
  }
}
```

2. Configure AI API keys using User Secrets:
```bash
dotnet user-secrets set "Gemini:ApiKey" "your-api-key"
```

#### Installation
```bash
cd HireFlow.Api/HireFlow.Api
dotnet restore
```

#### Database Setup
```bash
# Apply migrations
dotnet ef database update
```

#### Development
```bash
dotnet run
```
The API will be available at `https://localhost:5001` (or configured port)

#### Swagger Documentation
When running in development mode, access Swagger UI at:
```
https://localhost:5001/swagger
```

---

## 🔗 Integration

The frontend and backend work together to provide a seamless recruitment experience:

1. **Frontend** (React) runs on `http://localhost:5173`
2. **Backend** (.NET API) runs on `https://localhost:5001`
3. **Database** (PostgreSQL) runs on `localhost:5433`

### API Communication
The React frontend communicates with the .NET backend through RESTful API calls. Configure the API base URL in the frontend to point to the backend server.

---

## 🛠️ Development Workflow

### Running Both Projects

1. **Start PostgreSQL database** (if using Docker):
```bash
cd HireFlow.Api
docker-compose up -d
```

2. **Start the Backend API**:
```bash
cd HireFlow.Api/HireFlow.Api
dotnet run
```

3. **Start the Frontend** (in a new terminal):
```bash
cd hireflow
npm run dev
```

4. **Access the Application**:
   - Frontend: `http://localhost:5173`
   - API: `https://localhost:5001`
   - Swagger: `https://localhost:5001/swagger`

---

## 📦 Dependencies

### Frontend Key Dependencies
- React 19.2.7
- TypeScript ~6.0.2
- Vite 8.1.1
- Tailwind CSS 3.4.19
- Lucide React 1.23.0

### Backend Key Dependencies
- .NET 8.0
- Entity Framework Core 8.0.10
- PostgreSQL (Npgsql.EntityFrameworkCore.PostgreSQL 8.0.10)
- Anthropic.SDK 5.10.0
- Google.Cloud.AIPlatform.V1 3.72.0
- Swashbuckle.AspNetCore 8.0.10

---

## 📝 License

This project is private and proprietary.

---

## 👤 Author

**Navinda Hewawickrama**
- Email: hewawickraman@gmail.com

---

## 🚧 Status

Active development - AI-powered recruitment pipeline system