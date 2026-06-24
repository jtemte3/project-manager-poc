import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ProjectProvider from "./state/ProjectProvider";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </StrictMode>,
)
