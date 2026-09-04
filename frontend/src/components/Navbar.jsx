const PAGES = [
  { id: "dashboard", label: "🏠 Dashboard" },
  { id: "stagiaires", label: "👥 Stagiaires" },
  { id: "sujets", label: "📚 Sujets de stage" },
  { id: "affectations", label: "🔗 Affectations" },
];

function Navbar({ page, allerA, role, seDeconnecter }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">🎓 StageManager</div>

      <div className="navbar-menu">
        {PAGES.map(({ id, label }) => (
          <button
            key={id}
            className={`nav-link ${page === id ? "active" : ""}`}
            onClick={() => allerA(id)}
          >
            {label}
          </button>
        ))}

        {role === "admin" && (
          <button
            className={`nav-link ${page === "utilisateurs" ? "active" : ""}`}
            onClick={() => allerA("utilisateurs")}
          >
            👤 Utilisateurs
          </button>
        )}

        {role && (
          <span
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "0 8px",
              whiteSpace: "nowrap",
            }}
          >
            {role}
          </span>
        )}

        <button className="nav-link" onClick={seDeconnecter}>
          🚪 Déconnexion
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
