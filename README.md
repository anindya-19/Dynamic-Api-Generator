# 🚀 Dynamic API Generator (AI Backend Builder)

An AI-powered developer tool that dynamically transforms natural language requirements into fully functional, documented, and testable REST APIs in seconds.

Built to accelerate product prototyping, this tool eliminates the manual overhead of designing database schemas, writing field validation logic, setting up routes, and crafting API documentation.

---

## 🌟 Key Features

- **Natural Language Schema Synthesis:** Input plain-English prompts (e.g., _"Build an API for Employee Management..."_) to generate typed data models and validation rules automatically.
- **In-Memory CRUD Engine:** Perform live `GET`, `POST`, `PUT`, and `DELETE` requests directly in the browser with realistic HTTP response codes (`200`, `201`, `400`, `404`) and execution latency metrics.
- **Interactive API Playground:** Swagger/Postman-style interface featuring dynamic form inputs, live JSON payload editors, and instant schema re-hydration.
- **Strict Runtime Validation:** Evaluates missing required fields, type mismatches, numeric bounds, and regex formats before writing to memory.
- **Developer Export Suite:** Instant generation of copy-ready cURL commands, client code snippets (`JavaScript Fetch`, `Python Requests`), and a single-file production-ready Node.js/Express server boilerplate.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite
- **Styling:** Tailwind CSS v4, Lucide React Icons
- **AI Integration:** Google Gemini API (`@google/genai`)
- **State & Runtime:** In-Memory Javascript Data Engine

---

## 🏗️ Architecture & Data Flow
