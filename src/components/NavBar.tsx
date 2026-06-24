import { Link, useLocation } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();

  // Helper to check if a link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Project Manager POC</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/" className={isActive("/") ? "active" : ""}>Projects</Link></li>
        <li><Link to="/backlog" className={isActive("/backlog") ? "active" : ""}>Backlog</Link></li>
        <li><Link to="/planning" className={isActive("/planning") ? "active" : ""}>Sprint Planning</Link></li>
        <li><Link to="/kanban" className={isActive("/kanban") ? "active" : ""}>Kanban Board</Link></li>
        <li><Link to="/metrics" className={isActive("/metrics") ? "active" : ""}>Metrics</Link></li>
      </ul>
    </nav>
  );
}
