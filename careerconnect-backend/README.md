# CareerConnect Backend

## Project Overview

CareerConnect is a REST API for a job and internship recruitment platform. It supports three roles:

- **Candidate** — manages a profile, searches jobs, applies, saves jobs, and views interviews.
- **Recruiter** — manages a profile/company, posts jobs or internships, reviews applications, and schedules interviews.
- **Admin** — manages user access, verifies companies, monitors jobs, reviews applications/interviews, and views dashboard statistics.

## Features

### Candidate

- Registration and JWT login
- Profile, education, experience, and skills management
- Public job search and job details
- Job applications and application history
- Saved jobs
- Interview list and details

### Recruiter

- Recruiter profile and company management
- Job and internship posting and closure
- Application review and status updates
- Interview scheduling, rescheduling, status updates, and ownership-protected views

### Admin

- User listing, filtering, and enable/disable management
- Company listing and verification management
- Job listing, monitoring, and closure
- Read-only application and interview overviews
- Dashboard counts for users, companies, jobs, applications, and interviews
- Optional environment-driven initial-admin seed account

## Technology Stack

- Java 21
- Spring Boot
- Spring MVC
- Spring Security
- Spring Data JPA
- MySQL
- JWT (JJWT)
- Maven
- Lombok
- JUnit 5 and Mockito

## Architecture

```text
Controller → Service → Repository → MySQL
```

Controllers expose DTO-based REST APIs. Services contain authorization and business rules. Repositories provide Spring Data JPA persistence. JWT authentication populates Spring Security's `SecurityContext`, while a global exception handler provides consistent error responses.

## Project Structure

```text
src/main/java/com/careerconnect/backend
├── common        # API wrappers, pagination, enums
├── config        # security, CORS, scheduling, admin seeding
├── controller    # auth, candidate, recruiter, public, and admin APIs
├── dto           # request and response DTOs
├── entity        # JPA entities
├── exception     # custom exceptions and global handler
├── repository    # Spring Data repositories
├── scheduler     # job-expiry scheduling
├── security      # JWT support and user details service
└── service       # application business logic
```

## Authentication

```text
Login → JWT generated → Authorization: Bearer <token> → JWT filter → SecurityContext
```

Protected operations derive the authenticated user from the security context; clients do not submit ownership IDs for protected resources.

## Roles and Access

| Role | Primary access |
|---|---|
| Candidate | `/api/v1/candidate/**` |
| Recruiter | `/api/v1/recruiter/**` |
| Admin | `/api/v1/admin/**` |

Public job browsing is available through `/api/v1/jobs/**`; only open jobs are exposed there.

## Major Database Entities

- `User` with Candidate or Recruiter profile associations
- `Company` owned through a recruiter profile
- `Job` belonging to a company, with required skills
- `Application` connecting a candidate and job, with status history
- `Interview` belonging to an application
- `SavedJob`, `Skill`, `Education`, and `Experience`

## API Overview

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Candidate

- `/api/v1/candidate/profile`
- `/api/v1/candidate/educations`
- `/api/v1/candidate/experiences`
- `/api/v1/candidate/skills`
- `/api/v1/candidate/jobs/{jobId}/apply`
- `/api/v1/candidate/applications`
- `/api/v1/candidate/saved-jobs`
- `/api/v1/candidate/interviews`

### Recruiter

- `/api/v1/recruiter/profile`
- `/api/v1/recruiter/company`
- `/api/v1/recruiter/jobs`
- `/api/v1/recruiter/applications`
- `/api/v1/recruiter/interviews`

### Public Jobs

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/{jobId}`

### Admin

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/{userId}/enabled`
- `GET /api/v1/admin/companies`
- `PATCH /api/v1/admin/companies/{companyId}/verification`
- `GET /api/v1/admin/jobs`
- `PATCH /api/v1/admin/jobs/{jobId}/close`
- `GET /api/v1/admin/applications`
- `GET /api/v1/admin/interviews`

## Environment Variables

| Variable | Purpose |
|---|---|
| `DB_URL` | MySQL JDBC URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Base64 JWT signing secret (required) |
| `JWT_EXPIRATION` | JWT lifetime in milliseconds |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins |
| `ADMIN_EMAIL` | Optional initial admin email |
| `ADMIN_PASSWORD` | Optional initial admin password |

The initial admin is created only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are supplied. The password is BCrypt-hashed and is never logged.

## Running the Project

1. Install and start MySQL.
2. Configure the environment variables above, including `JWT_SECRET`.
3. Run the application:

```powershell
.\mvnw.cmd spring-boot:run
```

## Running Tests

```powershell
.\mvnw.cmd test
```

## Future Improvements

- Resume file upload
- Email notifications
- Password reset flow
- AI job recommendations
- Redis caching
- Docker deployment
- Frontend integration

These are future enhancements and are not part of the current backend implementation.
