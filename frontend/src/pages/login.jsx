import React from "react";

function Login({
  emailLogin,
  setEmailLogin,
  motDePasseLogin,
  setMotDePasseLogin,
  erreurLogin,
  chargementLogin,
  seConnecter,
}) {
  return (
    <div className="app">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="form-container" style={{ maxWidth: "400px", width: "90%" }}>
          <h2>🎓 Connexion</h2>

          <form onSubmit={seConnecter}>
            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={motDePasseLogin}
                onChange={(e) => setMotDePasseLogin(e.target.value)}
                required
              />
            </div>

            {erreurLogin && (
              <p style={{ color: "#dc2626", fontSize: "14px", marginBottom: "15px" }}>
                {erreurLogin}
              </p>
            )}

            <button
              type="submit"
              className="btn-enregistrer"
              style={{ width: "100%" }}
              disabled={chargementLogin}
            >
              {chargementLogin ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;