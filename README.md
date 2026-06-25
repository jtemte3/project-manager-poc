# 🏇 Jockey

A lightweight project management tool built with React, TypeScript, and Vite. Jockey provides an intuitive interface for managing projects, sprints, and tasks using Agile methodologies.

## Features

- **Projects** — Create and manage multiple projects from a centralized dashboard
- **Backlog** — Organize and prioritize tickets before they enter a sprint
- **Sprint Planning** — Assign tickets to sprints with complexity tracking
- **Kanban Board** — Visualize workflow with drag-and-drop columns (Backlog, Todo, In Progress, Done)
- **Metrics** — Track progress with charts and analytics
- **Epics & Tickets** — Group related work into epics with detailed ticket descriptions and checklists

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd project-manager-poc

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will start on **http://localhost:5173**.

> **Tip:** Press `q` in the terminal to stop the development server.

### Building for Production

```bash
npm run build
```

The optimized build will be output to the `dist/` directory.

## Tech Stack

- **React 19** — UI library
- **TypeScript** — Type-safe development
- **Vite** — Fast build tooling and dev server
- **MUI (Material UI)** — Component library
- **Recharts** — Data visualization
- **React Router** — Client-side routing

## Project Structure

```
src/
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── models/       # TypeScript interfaces
├── pages/        # Route components
├── services/     # Data services
├── state/        # State management
└── utils/        # Helper functions
```
