import { useState } from "react";

// Components & Pages (extensions .jsx explicites)
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Stagiaires from "./pages/Stagiaires.jsx";
import Sujets from "./pages/Sujets.jsx";
import Affectations from "./pages/Affectations.jsx";
import Utilisateurs from "./pages/Utilisateurs.jsx";

// Custom Hooks
import { useAuth } from "./hooks/useAuth";
import { useStagiaires } from "./hooks/useStagiaires";
import { useSujets } from "./hooks/useSujets";
import { useImportSujets } from "./hooks/useImportSujets";
import { useAffectations } from "./hooks/useAffectations";
import { useEvaluations } from "./hooks/useEvaluations";
import { useUtilisateurs } from "./hooks/useUtilisateurs";

// Utilities & Styles
import { formulaireVide } from "./utils/formDefaults";
import "./App.css";

function App() {
  const auth = useAuth();
  const { token, role, seDeconnecter } = auth;

  const [page, setPage] = useState("dashboard");
  const [recherche, setRecherche] = useState("");

  const stagiairesHook = useStagiaires(token);
  const sujetsHook = useSujets(token);
  const importIA = useImportSujets(sujetsHook.setSujets);
  const affectationsHook = useAffectations(token, sujetsHook.chargerSujets);
  const evaluationsHook = useEvaluations(token);
  const utilisateursHook = useUtilisateurs(token);

  const nomStagiaire = (stagiaireId) => {
    const stagiaire = stagiairesHook.stagiaires.find((s) => s.id === stagiaireId);
    return stagiaire ? `${stagiaire.prenom} ${stagiaire.nom}` : `#${stagiaireId}`;
  };

  const titreSujet = (sujetId) => {
    const sujet = sujetsHook.sujets.find((s) => s.id === sujetId);
    return sujet ? sujet.titre : `#${sujetId}`;
  };

  const allerA = (nouvellePage) => setPage(nouvellePage);

  if (!token) {
    return <Login {...auth} />;
  }

  return (
    <div className="app">
      <Navbar page={page} allerA={allerA} role={role} seDeconnecter={seDeconnecter} />

      <header className="header">
        <div>
          <h1>🎓 Gestion des stages</h1>
          <p>Plateforme de gestion des stagiaires</p>
        </div>

        {page === "stagiaires" && (
          <button
            className="btn-ajouter"
            onClick={() => {
              stagiairesHook.setFormulaire(formulaireVide);
              stagiairesHook.setAfficherFormulaire(true);
              stagiairesHook.setStagiaireEnModification(null);
            }}
          >
            + Ajouter un stagiaire
          </button>
        )}
      </header>

      <main className="container">
        {page === "dashboard" && (
          <Dashboard
            stagiaires={stagiairesHook.stagiaires}
            sujets={sujetsHook.sujets}
            affectations={affectationsHook.affectations}
            utilisateurs={utilisateursHook.utilisateurs}
            role={role}
            nomStagiaire={nomStagiaire}
            titreSujet={titreSujet}
          />
        )}

        {page === "stagiaires" && (
          <Stagiaires
            {...stagiairesHook}
            recherche={recherche}
            setRecherche={setRecherche}
          />
        )}

        {page === "sujets" && (
          <Sujets {...sujetsHook} importIA={importIA} />
        )}

        {page === "affectations" && (
          <Affectations
            stagiaires={stagiairesHook.stagiaires}
            sujets={sujetsHook.sujets}
            nomStagiaire={nomStagiaire}
            titreSujet={titreSujet}
            {...affectationsHook}
            {...evaluationsHook}
          />
        )}

        {page === "utilisateurs" && role === "admin" && (
          <Utilisateurs {...utilisateursHook} />
        )}
      </main>
    </div>
  );
}

export default App;