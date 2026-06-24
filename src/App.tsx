import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import ProjectsPage from "./pages/ProjectsPage";
import BacklogPage from "./pages/BacklogPage";
import SprintPlanningPage from "./pages/SprintPlanningPage";
import KanbanPage from "./pages/KanbanPage";
import MetricsPage from "./pages/MetricsPage";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />

          <Route path="/backlog" element={<BacklogPage />} />

          <Route
            path="/planning"
            element={<SprintPlanningPage />}
          />

          <Route path="/kanban" element={<KanbanPage />} />

          <Route path="/metrics" element={<MetricsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;