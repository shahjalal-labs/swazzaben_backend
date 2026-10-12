# Swazzaben Backend - Commercial Lending & Loan Modification API

<p align="center">
  <img src="assets/banner.svg" alt="swazzaben_backend Banner" width="100%">
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js" alt="Node.js"></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-4.21-black?style=for-the-badge&logo=express" alt="Express"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma" alt="Prisma"></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB"></a>
  <a href="https://socket.io"><img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io" alt="Socket.io"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License"></a>
</p>

---

## 📖 Overview

**swazzaben_backend** is Swazzaben Backend (`swazzaben_backend`) is a financial technology API built with Express.js, TypeScript, and Prisma ORM with MongoDB. The system streamlines commercial business loan applications, multi-tier loan modification requests, document verification, and live broker-to-applicant advisory chat via Socket.io.

---

## ⚡ Key Features

- 💼 **Commercial Loan Origination:** Comprehensive business loan submission pipeline capturing entity revenue, credit, and funding requested.
- 📑 **Loan Modification Engine:** Structured workflows for existing borrowers requesting rate adjustments, term extensions, or restructuring.
- 💬 **Live Broker Advisory Chat:** Instant WebSocket messaging connecting financial advisors directly with enterprise borrowers.
- 🛡️ **Role-Based Financial Security:** Granular access controls segregating Borrowers, Loan Officers, and Super Administrators.
- ☁️ **DigitalOcean Spaces Document Storage:** Secure S3-compatible document uploads for bank statements and tax filings.
- 📊 **Application Status Auditing:** Complete history log of underwriting reviews, approval milestones, and disbursements.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Borrower[Enterprise Borrowers] -->|HTTPS REST| Router[Express Application Gateway]
    Officer[Loan Officers & Admins] -->|HTTPS REST| Router
    Borrower <-->|WSS Socket.io| Chat[Live Financial Consultation Gateway]
    Officer <-->|WSS Socket.io| Chat

    subgraph Security ["Security & Verification"]
        Router --> Auth[JWT Role Guard]
        Router --> Val[Zod Schema Validator]
    end

    subgraph Underwriting ["Fintech Application Modules"]
        Auth --> LoanMod[Business Loan Origination]
        Auth --> ModifyMod[Loan Modification Processing]
        Auth --> UserMod[Borrower & Officer Profiles]
    end

    subgraph Storage ["Document Storage & Data"]
        Underwriting --> Prisma[Prisma ORM Client]
        Prisma --> MongoDB[(MongoDB Cluster)]
        Underwriting --> S3[DigitalOcean Spaces S3 CDN]
    end
```

---

## 📂 Directory Structure

```text
.
├── src/
│   ├── app/
│   ├── components/
│   └── ...
├── assets/
│   └── banner.svg
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── LICENSE
```

---

## 🛠️ Tech Stack & Dependencies

| Layer / Library | Version | Description |
|---|---|---|
| **Express.js** | `v4.21` | HTTP routing and middleware framework |
| **TypeScript** | `v5.x` | Type safety and interface contracts |
| **Prisma ORM** | `v6.x` | MongoDB modeling and query engine |
| **Socket.io** | `v4.8` | Real-time client-to-officer consultation chat |
| **AWS SDK (S3 Client)** | `v3.x` | DigitalOcean Spaces file and document uploads |
| **Bcrypt.js** | `v2.4` | Cryptographic password hashing |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on the provided sample:

```bash
cp .env.example .env
```

Configurable variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/swazzaben_db?retryWrites=true&w=majority

JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=super_secret_refresh_token
REFRESH_TOKEN_EXPIRES_IN=30d

# DigitalOcean Spaces S3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_KEY=your_do_spaces_key
DO_SPACES_SECRET=your_do_spaces_secret
DO_SPACES_BUCKET=swazzaben-docs

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.x or higher recommended)
- Package Manager (`npm`, `yarn`, or `pnpm`)

### Installation

```bash
# Clone repository
git clone https://github.com/shahjalal-labs/swazzaben_backend.git
cd swazzaben_backend

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev
# or for backend services
npm run start:dev
```

### Building for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
