# NidhiSaarthi – Government Loan Advisor 🇮🇳

**Multilingual, Explainable AI for Financial Inclusion**

NidhiSaarthi is a government-grade AI loan guidance platform designed to help citizens understand loan eligibility, receive transparent explanations for approval/rejection, and get a personalized roadmap to improve their chances — with multilingual and voice-first access for inclusivity.

## 📋 Table of Contents

- [Problem Statement](#-problem)
- [Solution Overview](#-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🚩 Problem

Accessing loan information is complex for many citizens due to:
- **Low financial literacy** – citizens lack understanding of loan eligibility criteria
- **Language barriers** – information primarily available in English
- **Opaque bank decisions** – applications rejected without clear reasons
- **Repeated rejections** – hurt credit scores and reduce future opportunities

This leads to frustration, misinformation, and exclusion from formal credit systems.

---

## 💡 Solution

NidhiSaarthi provides an **AI-powered, privacy-first public service platform** that:
- Predicts loan approval probability with transparent logic
- Explains decisions using Explainable AI techniques
- Guides users with actionable next steps
- Supports **English, Hindi, and Tamil**
- Offers **voice + text interaction** for accessibility
- Helps users prepare with personalized document checklists
- Protects credit scores through readiness assessment

---

## ✨ Key Features

- **🗣️ Multilingual + Voice-First Chatbot** (English, हिंदी, தமிழ்)
- **📊 Explainable AI Dashboard** – transparent reasons behind decisions
- **🔮 What-If Simulator** – see how changes affect eligibility
- **📋 Smart Document Checklist** – personalized document requirements
- **🎯 Eligibility Gap Breakdown** – identify blocking factors
- **📈 Application Readiness Indicator** – optimal timing for applications
- **🔐 Admin Dashboard** – anonymized analytics for deployment
- **🛡️ Privacy & Ethics by Design** – consent-based, no biometric storage

---

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** – blazing fast build tool
- **shadcn/ui** – beautiful UI components
- **Tailwind CSS** – utility-first styling
- **Radix UI** – accessible component primitives

### Backend & AI
- **Supabase** – PostgreSQL + Auth + Real-time
- **Hugging Face** – LLM-based guidance engine
- **RAG (Retrieval-Augmented Generation)** – knowledge base integration
- **Custom ML Model** – loan risk scoring

### Languages & Tools
- **TypeScript** – type-safe development
- **React Query** – server state management
- **Vite** – lightning-fast dev experience

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** or **yarn** or **bun** package manager
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/nidhisaarthi.git
cd nidhisaarthi
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
bun install
```

### Step 3: Configure Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your API keys (see Configuration section below).

### Step 4: Start Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
# Get these from: https://supabase.com/
VITE_SUPABASE_PROJECT_ID="your_supabase_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"

# Hugging Face API Token
# Get your token from: https://huggingface.co/settings/tokens
HUGGING_FACE_TOKEN="your_hugging_face_api_token"
```

### Getting Your API Keys

#### Supabase Setup
1. Create an account at [supabase.com](https://supabase.com/)
2. Create a new project
3. Navigate to Project Settings → API
4. Copy `Project ID`, `Anon Key`, and `Project URL`

#### Hugging Face Setup
1. Create an account at [huggingface.co](https://huggingface.co/)
2. Go to Settings → Access Tokens
3. Create a new access token with read permissions

---

## 🚀 Usage

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Production Build

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

---

## 📁 Project Structure

```
nidhisaarthi/
├── src/
│   ├── components/          # React components
│   │   ├── chat/           # ChatBot components
│   │   ├── eligibility/    # Loan eligibility features
│   │   ├── landing/        # Landing page components
│   │   ├── ui/             # Reusable UI components
│   │   └── layout/         # Layout components
│   ├── pages/              # Page components
│   ├── lib/                # Utility libraries
│   │   ├── api/            # API integration
│   │   ├── agents/         # AI agents
│   │   ├── rag/            # RAG implementation
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # Context providers
│   ├── types/              # TypeScript type definitions
│   ├── i18n/               # Internationalization
│   ├── utils/              # Utility functions
│   └── main.tsx            # App entry point
├── backend/                # Backend services
├── supabase/               # Supabase configuration
├── public/                 # Static assets
├── tests/                  # Test files
├── .env.example            # Example environment variables
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── README.md               # This file
```

---

## 🔌 API Documentation

### Core Endpoints

#### Loan Eligibility Check
```
POST /api/eligibility/check
```
Predicts loan approval probability and provides explanations.

#### Get Document Checklist
```
POST /api/documents/checklist
```
Returns personalized document requirements based on loan type and profile.

#### Chat with AI Assistant
```
POST /api/chat/message
```
Sends messages to the AI loan advisor with multilingual support.

---

## 🧪 Testing

Run the test suite:

```bash
npm run test
npm run test:watch    # Watch mode
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** your changes: `git commit -m 'Add your feature'`
4. **Push** to the branch: `git push origin feature/your-feature`
5. **Submit** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Update documentation as needed
- Follow existing code style

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

### Getting Help

- 📖 **Documentation** – Check project docs
- 🐛 **Bug Reports** – [Create an issue](https://github.com/your-username/nidhisaarthi/issues)
- 💬 **Discussions** – [Join discussions](https://github.com/your-username/nidhisaarthi/discussions)

### Common Issues

**Issue: Port 5173 already in use**
```bash
npm run dev -- --port 3000
```

**Issue: Dependencies not installing**
```bash
rm node_modules package-lock.json
npm install
```

---

## 🙏 Acknowledgments

- Built for the INCEPTO Hackathon 2026
- Inspired by financial inclusion initiatives
- Thanks to the open-source community

---

**Made with ❤️ for financial inclusion in India**
