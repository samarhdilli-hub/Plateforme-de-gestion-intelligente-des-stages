import GraphiqueBarres from "../components/GraphiqueBarres";
import GraphiqueDonut from "../components/GraphiqueDonut";
import { classeBadgeAffectation, regrouperPar } from "../utils/badges";

function Dashboard({ stagiaires, sujets, affectations, utilisateurs, role, nomStagiaire, titreSujet }) {
  const totalStagiaires = stagiaires.length;

  const stagiairesEnCours = stagiaires.filter(
    (stagiaire) => stagiaire.statut === "En cours"
  ).length;

  const stagiairesTermines = stagiaires.filter(
    (stagiaire) => stagiaire.statut === "Terminé"
  ).length;

  const totalSujets = sujets.length;

  const sujetsDisponibles = sujets.filter(
    (sujet) => sujet.statut === "Disponible"
  ).length;

  const sujetsAttribues = sujets.filter(
    (sujet) => sujet.statut === "Attribué"
  ).length;

  const sujetsObsoletes = sujets.filter((sujet) => sujet.obsolete).length;

  const affectationsActives = affectations.filter(
    (affectation) => affectation.statut === "Active"
  ).length;

  const totalUtilisateurs = utilisateurs.length;

  const sujetsParCategorie = regrouperPar(sujets, "categorie", "Non catégorisé");
  const sujetsParStatutDonnees = regrouperPar(sujets, "statut", "Non défini");
  const stagiairesParStatutDonnees = regrouperPar(stagiaires, "statut", "Non défini");
  const sujetsParEntreprise = regrouperPar(sujets, "entreprise", "Non renseignée").slice(0, 6);

  // 5 affectations les plus récentes (triées par ID, la date étant parfois absente).
  const affectationsRecentes = [...affectations]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  return (
    <div className="dashboard-message">
      <h2>🏠 Bienvenue sur le Dashboard</h2>

      <p>
        Vue d'ensemble de votre plateforme de gestion des stages.
      </p>

      <div className="stats">
        <div className="stat-card">
          <h3>Total des stagiaires</h3>
          <p>{totalStagiaires}</p>
        </div>

        <div className="stat-card">
          <h3>Stages en cours</h3>
          <p>{stagiairesEnCours}</p>
        </div>

        <div className="stat-card">
          <h3>Stages terminés</h3>
          <p>{stagiairesTermines}</p>
        </div>

        <div className="stat-card">
          <h3>Total des sujets</h3>
          <p>{totalSujets}</p>
        </div>

        <div className="stat-card">
          <h3>Sujets disponibles</h3>
          <p>{sujetsDisponibles}</p>
        </div>

        <div className="stat-card">
          <h3>Sujets attribués</h3>
          <p>{sujetsAttribues}</p>
        </div>

        <div className="stat-card">
          <h3>Sujets à revoir (obsolètes)</h3>
          <p>{sujetsObsoletes}</p>
        </div>

        <div className="stat-card">
          <h3>Affectations actives</h3>
          <p>{affectationsActives}</p>
        </div>

        {role === "admin" && (
          <div className="stat-card">
            <h3>Utilisateurs</h3>
            <p>{totalUtilisateurs}</p>
          </div>
        )}
      </div>

      <div className="graphiques-grille">
        <GraphiqueDonut
          titre="📊 Sujets par statut"
          donnees={sujetsParStatutDonnees}
        />

        <GraphiqueBarres
          titre="🏷️ Sujets par catégorie"
          donnees={sujetsParCategorie}
          couleur="var(--violet)"
        />

        <GraphiqueBarres
          titre="🎓 Stagiaires par statut"
          donnees={stagiairesParStatutDonnees}
          couleur="var(--teal)"
        />

        <GraphiqueBarres
          titre="🏢 Sujets par entreprise (top 6)"
          donnees={sujetsParEntreprise}
          couleur="var(--indigo)"
        />
      </div>

      {affectationsRecentes.length > 0 && (
        <>
          <h2 style={{ marginTop: "32px" }}>🕒 Dernières affectations</h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Stagiaire</th>
                  <th>Sujet</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {affectationsRecentes.map((affectation) => (
                  <tr key={affectation.id}>
                    <td>{nomStagiaire(affectation.stagiaire_id)}</td>
                    <td>{titreSujet(affectation.sujet_id)}</td>
                    <td>{affectation.date_affectation || "-"}</td>
                    <td>
                      <span
                        className={`badge-statut ${classeBadgeAffectation(
                          affectation.statut
                        )}`}
                      >
                        {affectation.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
