import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:5050";

// Ajoute le jeton JWT aux requêtes et déconnecte l'utilisateur si le serveur répond 401.

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.reload();
  }

  return response;
}

const formulaireVide = {
  prenom: "",
  nom: "",
  date_naissance: "",
  email: "",
  telephone: "",
  universite: "",
  specialite: "",
  date_debut: "",
  date_fin: "",
  statut: "En cours",
};

const sujetVide = {
  titre: "",
  description: "",
  entreprise: "",
  technologies: "",
  duree: "",
  statut: "Disponible",
};

const affectationVide = {
  stagiaire_id: "",
  sujet_id: "",
  date_affectation: "",
  statut: "Active",
};

const utilisateurVide = {
  nom: "",
  prenom: "",
  email: "",
  mot_de_passe: "",
  role: "stagiaire",
  actif: true,
};

// Mappe un statut d'affectation vers une classe CSS de badge
const classeBadgeAffectation = (statut) => {
  switch (statut) {
    case "Active":
      return "statut-en-cours";
    case "Terminée":
      return "statut-termine";
    case "Annulée":
      return "statut-annule";
    default:
      return "statut-en-cours";
  }
};

// Mappe un rôle utilisateur vers une classe CSS de badge
const classeBadgeRole = (role) => {
  switch (role) {
    case "admin":
      return "statut-termine";
    case "encadrant":
      return "statut-en-cours";
    default:
      return "statut-annule";
  }
};

// Mappe un statut de sujet vers une classe CSS de badge
const classeBadgeSujet = (statut) => {
  switch (statut) {
    case "Disponible":
      return "statut-en-cours";
    case "Attribué":
      return "statut-termine";
    case "Terminé":
      return "statut-annule";
    default:
      return "statut-en-cours";
  }
};

// Palette utilisée par les graphiques (reprend les couleurs de App.css)
const PALETTE_GRAPHIQUES = [
  "#4f46e5", // indigo
  "#7c3aed", // violet
  "#0d8a7e", // teal
  "#dc2626", // rouge
  "#f59e0b", // ambre
  "#0ea5e9", // bleu ciel
  "#a855f7", // violet clair
];

// Graphique en barres horizontales, en CSS pur (pas de librairie externe).

function GraphiqueBarres({ titre, donnees, couleur = "var(--indigo)" }) {
  const maxValeur = Math.max(1, ...donnees.map((d) => d.valeur));

  return (
    <div className="graphique-carte">
      <h3>{titre}</h3>

      {donnees.length === 0 ? (
        <p className="graphique-vide">Aucune donnée pour le moment.</p>
      ) : (
        <div className="graphique-barres">
          {donnees.map((d) => (
            <div className="barre-ligne" key={d.label}>
              <span className="barre-label" title={d.label}>{d.label}</span>

              <div className="barre-piste">
                <div
                  className="barre-remplissage"
                  style={{
                    width: `${(d.valeur / maxValeur) * 100}%`,
                    background: couleur,
                  }}
                />
              </div>

              <span className="barre-valeur">{d.valeur}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function GraphiqueDonut({ titre, donnees }) {
  const total = donnees.reduce((somme, d) => somme + d.valeur, 0);

  let cumulPourcent = 0;
  const segments = donnees.map((d, i) => {
    const pourcent = total > 0 ? (d.valeur / total) * 100 : 0;
    const debut = cumulPourcent;
    cumulPourcent += pourcent;
    return `${PALETTE_GRAPHIQUES[i % PALETTE_GRAPHIQUES.length]} ${debut}% ${cumulPourcent}%`;
  });

  const gradient = segments.length > 0
    ? `conic-gradient(${segments.join(", ")})`
    : "var(--line)";

  return (
    <div className="graphique-carte">
      <h3>{titre}</h3>

      {donnees.length === 0 ? (
        <p className="graphique-vide">Aucune donnée pour le moment.</p>
      ) : (
        <div className="graphique-donut-conteneur">
          <div className="graphique-donut" style={{ background: gradient }}>
            <div className="graphique-donut-centre">{total}</div>
          </div>

          <ul className="graphique-legende">
            {donnees.map((d, i) => (
              <li key={d.label}>
                <span
                  className="legende-puce"
                  style={{ background: PALETTE_GRAPHIQUES[i % PALETTE_GRAPHIQUES.length] }}
                />
                <span className="legende-texte">
                  {d.label} — {d.valeur} ({total > 0 ? Math.round((d.valeur / total) * 100) : 0}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function App() {
  // AUTHENTIFICATION

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  const [emailLogin, setEmailLogin] = useState("");
  const [motDePasseLogin, setMotDePasseLogin] = useState("");
  const [erreurLogin, setErreurLogin] = useState("");
  const [chargementLogin, setChargementLogin] = useState(false);

  const seConnecter = async (e) => {
    e.preventDefault();
    setErreurLogin("");
    setChargementLogin(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailLogin,
          mot_de_passe: motDePasseLogin,
        }),
      });

      if (!response.ok) {
        throw new Error("Email ou mot de passe incorrect");
      }

      const data = await response.json();

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);

      setToken(data.access_token);
      setRole(data.role);
      setMotDePasseLogin("");
    } catch (error) {
      setErreurLogin(error.message || "Erreur de connexion au serveur");
    } finally {
      setChargementLogin(false);
    }
  };

  const seDeconnecter = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  const [stagiaires, setStagiaires] = useState([]);
  const [sujets, setSujets] = useState([]);
  const [sujetEnModification, setSujetEnModification] = useState(null);

  const [page, setPage] = useState("dashboard");
  const [recherche, setRecherche] = useState("");

  // --- Recherche intelligente des sujets ---
  const [rechercheSujets, setRechercheSujets] = useState("");
  const [filtreCategorieSujet, setFiltreCategorieSujet] = useState("");
  const [filtreStatutSujet, setFiltreStatutSujet] = useState("");
  const [filtreDureeSujet, setFiltreDureeSujet] = useState("");

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [stagiaireEnModification, setStagiaireEnModification] = useState(null);
  const [formulaire, setFormulaire] = useState(formulaireVide);

  const [afficherFormulaireSujet, setAfficherFormulaireSujet] = useState(false);
  const [sujetFormulaire, setSujetFormulaire] = useState(sujetVide);

  // --- Import intelligent de sujets (PDF / Word / Excel) ---
  const [afficherImportSujets, setAfficherImportSujets] = useState(false);
  const [fichierImport, setFichierImport] = useState(null);
  const [chargementImport, setChargementImport] = useState(false);
  const [erreurImport, setErreurImport] = useState("");
  const [sujetsExtraits, setSujetsExtraits] = useState([]);

  // --- Affectations ---
  const [affectations, setAffectations] = useState([]);
  const [afficherFormulaireAffectation, setAfficherFormulaireAffectation] = useState(false);
  const [affectationEnModification, setAffectationEnModification] = useState(null);
  const [affectationFormulaire, setAffectationFormulaire] = useState(affectationVide);

  // --- Utilisateurs ---
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [afficherFormulaireUtilisateur, setAfficherFormulaireUtilisateur] = useState(false);
  const [utilisateurEnModification, setUtilisateurEnModification] = useState(null);
  const [utilisateurFormulaire, setUtilisateurFormulaire] = useState(utilisateurVide);

  useEffect(() => {
    if (token) {
      chargerStagiaires();
      chargerSujets();
      chargerAffectations();
      chargerUtilisateurs();
    }
  }, [token]);

  // STAGIAIRES

  const chargerStagiaires = async () => {
    try {
      const response = await apiFetch("/stagiaires");
      if (!response.ok) throw new Error("Erreur chargement stagiaires");
      const data = await response.json();
      setStagiaires(data);
    } catch (error) {
      console.error(error);
    }
  };

  const ajouterStagiaire = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/stagiaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulaire),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout");

      const nouveauStagiaire = await response.json();
      setStagiaires((anciens) => [...anciens, nouveauStagiaire]);
      setFormulaire(formulaireVide);
      setAfficherFormulaire(false);

      alert("Stagiaire ajouté avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion avec le serveur");
    }
  };

  const modifierStagiaire = (stagiaire) => {
    setStagiaireEnModification({ ...stagiaire });
    setAfficherFormulaire(false);
  };

  const enregistrerModification = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/stagiaires/${stagiaireEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stagiaireEnModification),
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la modification");

      const stagiaireModifie = await response.json();

      setStagiaires((anciens) =>
        anciens.map((stagiaire) =>
          stagiaire.id === stagiaireModifie.id ? stagiaireModifie : stagiaire
        )
      );

      setStagiaireEnModification(null);
      alert("Stagiaire modifié avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification");
    }
  };

  const supprimerStagiaire = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce stagiaire ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/stagiaires/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setStagiaires((anciens) =>
        anciens.filter((stagiaire) => stagiaire.id !== id)
      );

      alert("Stagiaire supprimé avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleChange = (e) => {
    setFormulaire({
      ...formulaire,
      [e.target.name]: e.target.value,
    });
  };

  const handleModificationChange = (e) => {
    setStagiaireEnModification({
      ...stagiaireEnModification,
      [e.target.name]: e.target.value,
    });
  };

  // SUJETS DE STAGE

  const chargerSujets = async () => {
    try {
      const response = await apiFetch("/sujets");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des sujets");
      }

      const data = await response.json();
      setSujets(data);
    } catch (error) {
      console.error(error);
    }
  };

  // IMPORT INTELLIGENT DE SUJETS (PDF / Word / Excel)

  const basculerPanneauImport = () => {
    setAfficherImportSujets((valeur) => !valeur);
    setFichierImport(null);
    setSujetsExtraits([]);
    setErreurImport("");
  };

  const analyserFichierImport = async (e) => {
    e.preventDefault();

    if (!fichierImport) {
      setErreurImport("Veuillez sélectionner un fichier (PDF, Word ou Excel).");
      return;
    }

    setChargementImport(true);
    setErreurImport("");

    try {
      const formData = new FormData();
      formData.append("fichier", fichierImport);

      const response = await apiFetch("/sujets/importer", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erreur lors de l'analyse du fichier");
      }

      setSujetsExtraits(
        data.sujets_extraits.map((sujet) => ({
          ...sujet,
          selectionne: !sujet.doublon_probable,
        }))
      );
    } catch (error) {
      console.error(error);
      setErreurImport(error.message || "Erreur lors de l'analyse du fichier");
    } finally {
      setChargementImport(false);
    }
  };

  const basculerSelectionSujetExtrait = (index) => {
    setSujetsExtraits((anciens) =>
      anciens.map((sujet, i) =>
        i === index ? { ...sujet, selectionne: !sujet.selectionne } : sujet
      )
    );
  };

  const confirmerImportSujets = async () => {
    const sujetsSelectionnes = sujetsExtraits
      .filter((sujet) => sujet.selectionne)
      .map(({ titre, description, entreprise, technologies, duree, statut, categorie }) => ({
        titre,
        description,
        entreprise,
        technologies,
        duree,
        statut,
        categorie,
      }));

    if (sujetsSelectionnes.length === 0) {
      setErreurImport("Sélectionnez au moins un sujet à importer.");
      return;
    }

    setChargementImport(true);
    setErreurImport("");

    try {
      const response = await apiFetch("/sujets/importer/confirmer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sujetsSelectionnes),
      });

      const nouveauxSujets = await response.json();

      if (!response.ok) {
        throw new Error(nouveauxSujets.detail || "Erreur lors de l'import");
      }

      setSujets((anciens) => [...anciens, ...nouveauxSujets]);
      alert(`${nouveauxSujets.length} sujet(s) importé(s) avec succès !`);
      basculerPanneauImport();
    } catch (error) {
      console.error(error);
      setErreurImport(error.message || "Erreur lors de l'import");
    } finally {
      setChargementImport(false);
    }
  };

  // AFFECTATIONS

  const chargerAffectations = async () => {
    try {
      const response = await apiFetch("/affectations");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des affectations");
      }

      const data = await response.json();
      setAffectations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const annulerFormulaireAffectation = () => {
    setAfficherFormulaireAffectation(false);
    setAffectationEnModification(null);
    setAffectationFormulaire(affectationVide);
  };

  const ajouterAffectation = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...affectationFormulaire,
          stagiaire_id: Number(affectationFormulaire.stagiaire_id),
          sujet_id: Number(affectationFormulaire.sujet_id),
        }),
      });

      const nouvelleAffectation = await response.json();

      if (!response.ok) {
        throw new Error(nouvelleAffectation.detail || "Erreur lors de l'ajout");
      }

      setAffectations((anciennes) => [...anciennes, nouvelleAffectation]);
      annulerFormulaireAffectation();
      chargerSujets(); // le statut du sujet a pu changer côté backend
      alert("Affectation ajoutée avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de l'ajout de l'affectation");
    }
  };

  const modifierAffectation = (affectation) => {
    setAffectationEnModification({
      ...affectation,
      stagiaire_id: String(affectation.stagiaire_id),
      sujet_id: String(affectation.sujet_id),
    });
    setAfficherFormulaireAffectation(true);
  };

  const handleModificationAffectationChange = (e) => {
    setAffectationEnModification({
      ...affectationEnModification,
      [e.target.name]: e.target.value,
    });
  };

  const enregistrerModificationAffectation = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/affectations/${affectationEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...affectationEnModification,
            stagiaire_id: Number(affectationEnModification.stagiaire_id),
            sujet_id: Number(affectationEnModification.sujet_id),
          }),
        }
      );

      const affectationModifiee = await response.json();

      if (!response.ok) {
        throw new Error(affectationModifiee.detail || "Erreur lors de la modification");
      }

      setAffectations((anciennes) =>
        anciennes.map((affectation) =>
          affectation.id === affectationModifiee.id ? affectationModifiee : affectation
        )
      );

      annulerFormulaireAffectation();
      alert("Affectation modifiée avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de la modification de l'affectation");
    }
  };

  const supprimerAffectation = async (id) => {
    if (!window.confirm("Confirmer la suppression de cette affectation ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/affectations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setAffectations((anciennes) =>
        anciennes.filter((affectation) => affectation.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression de l'affectation");
    }
  };

  const nomStagiaire = (stagiaireId) => {
    const stagiaire = stagiaires.find((s) => s.id === stagiaireId);
    return stagiaire ? `${stagiaire.prenom} ${stagiaire.nom}` : `#${stagiaireId}`;
  };

  const titreSujet = (sujetId) => {
    const sujet = sujets.find((s) => s.id === sujetId);
    return sujet ? sujet.titre : `#${sujetId}`;
  };

  // UTILISATEURS

  const chargerUtilisateurs = async () => {
    try {
      const response = await apiFetch("/utilisateurs");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs");
      }

      const data = await response.json();
      setUtilisateurs(data);
    } catch (error) {
      console.error(error);
    }
  };

  const annulerFormulaireUtilisateur = () => {
    setAfficherFormulaireUtilisateur(false);
    setUtilisateurEnModification(null);
    setUtilisateurFormulaire(utilisateurVide);
  };

  const ajouterUtilisateur = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(utilisateurFormulaire),
      });

      const nouvelUtilisateur = await response.json();

      if (!response.ok) {
        throw new Error(nouvelUtilisateur.detail || "Erreur lors de l'ajout");
      }

      setUtilisateurs((anciens) => [...anciens, nouvelUtilisateur]);
      annulerFormulaireUtilisateur();
      alert("Utilisateur ajouté avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de l'ajout de l'utilisateur");
    }
  };

  const modifierUtilisateur = (utilisateur) => {
    setUtilisateurEnModification({ ...utilisateur, mot_de_passe: "" });
    setAfficherFormulaireUtilisateur(true);
  };

  const handleModificationUtilisateurChange = (e) => {
    const { name, value, type, checked } = e.target;

    setUtilisateurEnModification({
      ...utilisateurEnModification,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const enregistrerModificationUtilisateur = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/utilisateurs/${utilisateurEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(utilisateurEnModification),
        }
      );

      const utilisateurModifie = await response.json();

      if (!response.ok) {
        throw new Error(utilisateurModifie.detail || "Erreur lors de la modification");
      }

      setUtilisateurs((anciens) =>
        anciens.map((utilisateur) =>
          utilisateur.id === utilisateurModifie.id ? utilisateurModifie : utilisateur
        )
      );

      annulerFormulaireUtilisateur();
      alert("Utilisateur modifié avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de la modification de l'utilisateur");
    }
  };

  const supprimerUtilisateur = async (id) => {
    if (!window.confirm("Confirmer la suppression de cet utilisateur ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/utilisateurs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setUtilisateurs((anciens) =>
        anciens.filter((utilisateur) => utilisateur.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const ajouterSujet = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/sujets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sujetFormulaire),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du sujet");
      }

      const nouveauSujet = await response.json();

      setSujets((anciens) => [...anciens, nouveauSujet]);
      setSujetFormulaire(sujetVide);
      setAfficherFormulaireSujet(false);

      alert("Sujet ajouté avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout du sujet");
    }
  };

  const modifierSujet = (sujet) => {
    setSujetEnModification({ ...sujet });
    setAfficherFormulaireSujet(true);
  };

  const handleModificationSujetChange = (e) => {
    setSujetEnModification({
      ...sujetEnModification,
      [e.target.name]: e.target.value,
    });
  };

  const enregistrerModificationSujet = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/sujets/${sujetEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sujetEnModification),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du sujet");
      }

      const sujetModifie = await response.json();

      setSujets((anciens) =>
        anciens.map((sujet) =>
          sujet.id === sujetModifie.id ? sujetModifie : sujet
        )
      );

      setSujetEnModification(null);
      setAfficherFormulaireSujet(false);

      alert("Sujet modifié avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification du sujet");
    }
  };

  const supprimerSujet = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce sujet ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/sujets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression du sujet");

      setSujets((anciens) => anciens.filter((sujet) => sujet.id !== id));
      alert("Sujet supprimé avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression du sujet");
    }
  };

  const annulerFormulaireSujet = () => {
    setAfficherFormulaireSujet(false);
    setSujetEnModification(null);
    setSujetFormulaire(sujetVide);
  };

  // RECHERCHE

  const stagiairesFiltres = stagiaires.filter((stagiaire) => {
    const texte = recherche.toLowerCase();

    return (
      (stagiaire.nom || "").toLowerCase().includes(texte) ||
      (stagiaire.prenom || "").toLowerCase().includes(texte) ||
      (stagiaire.email || "").toLowerCase().includes(texte) ||
      (stagiaire.telephone || "").toLowerCase().includes(texte) ||
      (stagiaire.universite || "").toLowerCase().includes(texte) ||
      (stagiaire.specialite || "").toLowerCase().includes(texte)
    );
  });

  // Filtre par mots-clés/catégorie/statut, puis trie par pertinence (le titre compte plus que la description).

  const categoriesDisponibles = [...new Set(
    sujets.map((sujet) => sujet.categorie).filter(Boolean)
  )].sort();

  const dureesDisponibles = [...new Set(
    sujets.map((sujet) => sujet.duree).filter(Boolean)
  )].sort();

  const scorePertinenceSujet = (sujet, texte) => {
    const t = texte.trim().toLowerCase();
    if (!t) return 0;

    let score = 0;
    if ((sujet.titre || "").toLowerCase().includes(t)) score += 4;
    if ((sujet.technologies || "").toLowerCase().includes(t)) score += 2;
    if ((sujet.entreprise || "").toLowerCase().includes(t)) score += 2;
    if ((sujet.categorie || "").toLowerCase().includes(t)) score += 2;
    if ((sujet.description || "").toLowerCase().includes(t)) score += 1;
    return score;
  };

  const sujetsFiltres = sujets
    .filter((sujet) => {
      const texte = rechercheSujets.trim().toLowerCase();

      const correspondTexte =
        !texte ||
        [sujet.titre, sujet.description, sujet.entreprise, sujet.technologies, sujet.categorie]
          .some((champ) => (champ || "").toLowerCase().includes(texte));

      const correspondCategorie =
        !filtreCategorieSujet || sujet.categorie === filtreCategorieSujet;

      const correspondStatut =
        !filtreStatutSujet || sujet.statut === filtreStatutSujet;

      const correspondDuree =
        !filtreDureeSujet || sujet.duree === filtreDureeSujet;

      return correspondTexte && correspondCategorie && correspondStatut && correspondDuree;
    })
    .sort(
      (a, b) =>
        scorePertinenceSujet(b, rechercheSujets) - scorePertinenceSujet(a, rechercheSujets)
    );

  const reinitialiserFiltresSujets = () => {
    setRechercheSujets("");
    setFiltreCategorieSujet("");
    setFiltreStatutSujet("");
    setFiltreDureeSujet("");
  };

  // STATISTIQUES DU DASHBOARD

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

  const totalAffectations = affectations.length;

  const affectationsActives = affectations.filter(
    (affectation) => affectation.statut === "Active"
  ).length;

  const totalUtilisateurs = utilisateurs.length;

  // --- Données pour les graphiques ---

  // Regroupe un tableau d'objets par la valeur d'un champ -> [{ label, valeur }] trié décroissant.
  const regrouperPar = (liste, champ, libelleParDefaut = "Non renseigné") => {
    const compteur = {};

    liste.forEach((item) => {
      const cle = item[champ] || libelleParDefaut;
      compteur[cle] = (compteur[cle] || 0) + 1;
    });

    return Object.entries(compteur)
      .map(([label, valeur]) => ({ label, valeur }))
      .sort((a, b) => b.valeur - a.valeur);
  };

  const sujetsParCategorie = regrouperPar(sujets, "categorie", "Non catégorisé");
  const sujetsParStatutDonnees = regrouperPar(sujets, "statut", "Non défini");
  const stagiairesParStatutDonnees = regrouperPar(stagiaires, "statut", "Non défini");
  const sujetsParEntreprise = regrouperPar(sujets, "entreprise", "Non renseignée").slice(0, 6);

  // 5 affectations les plus récentes (triées par ID, la date étant parfois absente).
  const affectationsRecentes = [...affectations]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // NAVIGATION

  const allerDashboard = () => {
    setPage("dashboard");
    setAfficherFormulaire(false);
    setStagiaireEnModification(null);
    setAfficherFormulaireSujet(false);
    setSujetEnModification(null);
  };

  const allerStagiaires = () => {
    setPage("stagiaires");
    setAfficherFormulaireSujet(false);
    setSujetEnModification(null);
    setStagiaireEnModification(null);
  };

  const allerSujets = () => {
    setPage("sujets");
    setAfficherFormulaire(false);
    setStagiaireEnModification(null);
  };

  const allerAffectations = () => {
    setPage("affectations");
    setAfficherFormulaire(false);
    setStagiaireEnModification(null);
    setAfficherFormulaireSujet(false);
    setSujetEnModification(null);
  };

  const allerUtilisateurs = () => {
    setPage("utilisateurs");
    setAfficherFormulaire(false);
    setStagiaireEnModification(null);
    setAfficherFormulaireSujet(false);
    setSujetEnModification(null);
  };

  // ÉCRAN DE CONNEXION (affiché tant qu'aucun jeton n'existe)

  if (!token) {
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
                <label>Email</label>
                <input
                  type="email"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label>Mot de passe</label>
                <input
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

  return (
    <div className="app">

      {/* =================================================
          NAVIGATION
      ================================================= */}
      <nav className="navbar">
        <div className="navbar-logo">🎓 StageManager</div>

        <div className="navbar-menu">
          <button
            className={`nav-link ${page === "dashboard" ? "active" : ""}`}
            onClick={allerDashboard}
          >
            🏠 Dashboard
          </button>

          <button
            className={`nav-link ${page === "stagiaires" ? "active" : ""}`}
            onClick={allerStagiaires}
          >
            👥 Stagiaires
          </button>

          <button
            className={`nav-link ${page === "sujets" ? "active" : ""}`}
            onClick={allerSujets}
          >
            📚 Sujets de stage
          </button>

          <button
            className={`nav-link ${page === "affectations" ? "active" : ""}`}
            onClick={allerAffectations}
          >
            🔗 Affectations
          </button>

          {role === "admin" && (
            <button
              className={`nav-link ${page === "utilisateurs" ? "active" : ""}`}
              onClick={allerUtilisateurs}
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

      {/* =================================================
          HEADER
      ================================================= */}
      <header className="header">
        <div>
          <h1>🎓 Gestion des stages</h1>
          <p>Plateforme de gestion des stagiaires</p>
        </div>

        {page === "stagiaires" && (
          <button
            className="btn-ajouter"
            onClick={() => {
              setFormulaire(formulaireVide);
              setAfficherFormulaire(true);
              setStagiaireEnModification(null);
            }}
          >
            + Ajouter un stagiaire
          </button>
        )}
      </header>

      {/* =================================================
          CONTENU PRINCIPAL
      ================================================= */}
      <main className="container">

        {/* =================================================
            DASHBOARD
        ================================================= */}
        {page === "dashboard" && (
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
        )}

        {/* =================================================
            PAGE STAGIAIRES
        ================================================= */}
        {page === "stagiaires" && (
          <>
            {afficherFormulaire && (
              <div className="form-container">
                <h2>Ajouter un stagiaire</h2>

                <form onSubmit={ajouterStagiaire}>
                  <div className="form-grid">

                    <div className="form-group">
                      <label>Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={formulaire.prenom}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formulaire.nom}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date de naissance</label>
                      <input
                        type="date"
                        name="date_naissance"
                        value={formulaire.date_naissance}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formulaire.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="text"
                        name="telephone"
                        value={formulaire.telephone}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Université</label>
                      <input
                        type="text"
                        name="universite"
                        value={formulaire.universite}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Spécialité</label>
                      <input
                        type="text"
                        name="specialite"
                        value={formulaire.specialite}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date de début</label>
                      <input
                        type="date"
                        name="date_debut"
                        value={formulaire.date_debut}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date de fin</label>
                      <input
                        type="date"
                        name="date_fin"
                        value={formulaire.date_fin}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Statut</label>
                      <select
                        name="statut"
                        value={formulaire.statut}
                        onChange={handleChange}
                      >
                        <option value="En cours">En cours</option>
                        <option value="Terminé">Terminé</option>
                        <option value="Annulé">Annulé</option>
                      </select>
                    </div>

                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-enregistrer">
                      Enregistrer le stagiaire
                    </button>

                    <button
                      type="button"
                      className="btn-annuler"
                      onClick={() => setAfficherFormulaire(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {stagiaireEnModification && (
              <div className="form-container">
                <h2>Modifier le stagiaire</h2>

                <form onSubmit={enregistrerModification}>
                  <div className="form-grid">

                    <div className="form-group">
                      <label>Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={stagiaireEnModification.prenom || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={stagiaireEnModification.nom || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date de naissance</label>
                      <input
                        type="date"
                        name="date_naissance"
                        value={stagiaireEnModification.date_naissance || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={stagiaireEnModification.email || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="text"
                        name="telephone"
                        value={stagiaireEnModification.telephone || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Université</label>
                      <input
                        type="text"
                        name="universite"
                        value={stagiaireEnModification.universite || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Spécialité</label>
                      <input
                        type="text"
                        name="specialite"
                        value={stagiaireEnModification.specialite || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date de début</label>
                      <input
                        type="date"
                        name="date_debut"
                        value={stagiaireEnModification.date_debut || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date de fin</label>
                      <input
                        type="date"
                        name="date_fin"
                        value={stagiaireEnModification.date_fin || ""}
                        onChange={handleModificationChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Statut</label>
                      <select
                        name="statut"
                        value={stagiaireEnModification.statut || "En cours"}
                        onChange={handleModificationChange}
                      >
                        <option value="En cours">En cours</option>
                        <option value="Terminé">Terminé</option>
                        <option value="Annulé">Annulé</option>
                      </select>
                    </div>

                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-enregistrer">
                      Enregistrer les modifications
                    </button>

                    <button
                      type="button"
                      className="btn-annuler"
                      onClick={() => setStagiaireEnModification(null)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

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
            </div>

            <div className="search-container">
              <input
                className="search-input"
                type="text"
                placeholder="🔎 Rechercher un stagiaire..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>

            <h2>Liste des stagiaires</h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Université</th>
                    <th>Spécialité</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {stagiairesFiltres.length === 0 ? (
                    <tr>
                      <td colSpan="9">Aucun stagiaire trouvé.</td>
                    </tr>
                  ) : (
                    stagiairesFiltres.map((stagiaire) => (
                      <tr key={stagiaire.id}>
                        <td>{stagiaire.id}</td>
                        <td>{stagiaire.prenom}</td>
                        <td>{stagiaire.nom}</td>
                        <td>{stagiaire.email}</td>
                        <td>{stagiaire.telephone}</td>
                        <td>{stagiaire.universite}</td>
                        <td>{stagiaire.specialite}</td>
                        <td>
                          <span
                            className={`badge-statut ${
                              stagiaire.statut === "En cours"
                                ? "statut-en-cours"
                                : stagiaire.statut === "Terminé"
                                ? "statut-termine"
                                : "statut-annule"
                            }`}
                          >
                            {stagiaire.statut}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-modifier"
                            onClick={() => modifierStagiaire(stagiaire)}
                          >
                            Modifier
                          </button>

                          <button
                            className="btn-supprimer"
                            onClick={() => supprimerStagiaire(stagiaire.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* =================================================
            PAGE SUJETS DE STAGE
        ================================================= */}
        {page === "sujets" && (
          <>
            <div className="form-container">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ marginBottom: 0 }}>📚 Sujets de stage</h2>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn-annuler"
                    type="button"
                    onClick={basculerPanneauImport}
                  >
                    {afficherImportSujets ? "✕ Fermer l'import" : "🤖 Importer via IA"}
                  </button>

                  <button
                    className="btn-enregistrer"
                    type="button"
                    onClick={() => {
                      if (afficherFormulaireSujet) {
                        annulerFormulaireSujet();
                      } else {
                        setSujetEnModification(null);
                        setSujetFormulaire(sujetVide);
                        setAfficherFormulaireSujet(true);
                      }
                    }}
                  >
                    {afficherFormulaireSujet ? "✕ Fermer" : "+ Ajouter un sujet"}
                  </button>
                </div>
              </div>

              {/* =========================
                  IMPORT INTELLIGENT (PDF / Word / Excel)
                  ========================= */}

              {afficherImportSujets && (
                <div style={{ marginTop: "25px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    Sélectionnez un fichier PDF, Word (.docx) ou Excel (.xlsx)
                    contenant un ou plusieurs sujets de stage. Le système
                    extraira automatiquement les informations, proposera une
                    catégorie et signalera les doublons probables avant tout
                    enregistrement.
                  </p>

                  <form
                    onSubmit={analyserFichierImport}
                    style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx,.xlsx,.xls"
                      onChange={(e) => setFichierImport(e.target.files[0] || null)}
                    />

                    <button
                      type="submit"
                      className="btn-enregistrer"
                      disabled={chargementImport}
                    >
                      {chargementImport ? "Analyse en cours..." : "Analyser le fichier"}
                    </button>
                  </form>

                  {erreurImport && (
                    <p style={{ color: "var(--red)", fontSize: "13px", marginTop: "10px" }}>
                      {erreurImport}
                    </p>
                  )}

                  {sujetsExtraits.length > 0 && (
                    <>
                      <p style={{ marginTop: "20px", fontWeight: 600, fontSize: "14px" }}>
                        {sujetsExtraits.length} sujet(s) détecté(s) — décochez ceux
                        que vous ne souhaitez pas importer :
                      </p>

                      <div className="table-container" style={{ marginTop: "10px" }}>
                        <table>
                          <thead>
                            <tr>
                              <th></th>
                              <th>Titre</th>
                              <th>Entreprise</th>
                              <th>Technologies</th>
                              <th>Catégorie (IA)</th>
                              <th>Doublon probable</th>
                            </tr>
                          </thead>

                          <tbody>
                            {sujetsExtraits.map((sujet, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={sujet.selectionne}
                                    onChange={() => basculerSelectionSujetExtrait(index)}
                                  />
                                </td>
                                <td>{sujet.titre}</td>
                                <td>{sujet.entreprise || "-"}</td>
                                <td>{sujet.technologies || "-"}</td>
                                <td>{sujet.categorie || "-"}</td>
                                <td>
                                  {sujet.doublon_probable ? (
                                    <span
                                      className="badge-statut statut-annule"
                                      title={`Similaire à "${sujet.doublon_probable.titre}"`}
                                    >
                                      {sujet.doublon_probable.similarite}% — "
                                      {sujet.doublon_probable.titre}"
                                    </span>
                                  ) : (
                                    <span className="badge-statut statut-en-cours">
                                      Nouveau
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn-enregistrer"
                          onClick={confirmerImportSujets}
                          disabled={chargementImport}
                        >
                          {chargementImport
                            ? "Import en cours..."
                            : `✅ Confirmer l'import (${sujetsExtraits.filter((s) => s.selectionne).length} sélectionné(s))`}
                        </button>

                        <button
                          type="button"
                          className="btn-annuler"
                          onClick={basculerPanneauImport}
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* =========================
                  FORMULAIRE AJOUT / MODIFICATION
                  ========================= */}

              {afficherFormulaireSujet && (
                <form
                  onSubmit={
                    sujetEnModification
                      ? enregistrerModificationSujet
                      : ajouterSujet
                  }
                  style={{ marginTop: "25px" }}
                >
                  <div className="form-grid">

                    <div className="form-group">
                      <label>Titre du sujet</label>

                      <input
                        type="text"
                        name="titre"
                        value={
                          sujetEnModification
                            ? sujetEnModification.titre
                            : sujetFormulaire.titre
                        }
                        onChange={
                          sujetEnModification
                            ? handleModificationSujetChange
                            : (e) =>
                                setSujetFormulaire({
                                  ...sujetFormulaire,
                                  titre: e.target.value,
                                })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Entreprise</label>

                      <input
                        type="text"
                        name="entreprise"
                        value={
                          sujetEnModification
                            ? sujetEnModification.entreprise || ""
                            : sujetFormulaire.entreprise
                        }
                        onChange={
                          sujetEnModification
                            ? handleModificationSujetChange
                            : (e) =>
                                setSujetFormulaire({
                                  ...sujetFormulaire,
                                  entreprise: e.target.value,
                                })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Technologies</label>

                      <input
                        type="text"
                        name="technologies"
                        placeholder="React, FastAPI, PostgreSQL..."
                        value={
                          sujetEnModification
                            ? sujetEnModification.technologies || ""
                            : sujetFormulaire.technologies
                        }
                        onChange={
                          sujetEnModification
                            ? handleModificationSujetChange
                            : (e) =>
                                setSujetFormulaire({
                                  ...sujetFormulaire,
                                  technologies: e.target.value,
                                })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Durée</label>

                      <input
                        type="text"
                        name="duree"
                        placeholder="3 mois"
                        value={
                          sujetEnModification
                            ? sujetEnModification.duree || ""
                            : sujetFormulaire.duree
                        }
                        onChange={
                          sujetEnModification
                            ? handleModificationSujetChange
                            : (e) =>
                                setSujetFormulaire({
                                  ...sujetFormulaire,
                                  duree: e.target.value,
                                })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Statut</label>

                      <select
                        name="statut"
                        value={
                          sujetEnModification
                            ? sujetEnModification.statut
                            : sujetFormulaire.statut
                        }
                        onChange={
                          sujetEnModification
                            ? handleModificationSujetChange
                            : (e) =>
                                setSujetFormulaire({
                                  ...sujetFormulaire,
                                  statut: e.target.value,
                                })
                        }
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="Attribué">Attribué</option>
                        <option value="Terminé">Terminé</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Description</label>

                      <textarea
                        name="description"
                        rows="4"
                        value={
                          sujetEnModification
                            ? sujetEnModification.description || ""
                            : sujetFormulaire.description
                        }
                        onChange={
                          sujetEnModification
                            ? handleModificationSujetChange
                            : (e) =>
                                setSujetFormulaire({
                                  ...sujetFormulaire,
                                  description: e.target.value,
                                })
                        }
                      />
                    </div>

                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-enregistrer">
                      {sujetEnModification
                        ? "💾 Enregistrer la modification"
                        : "Enregistrer le sujet"}
                    </button>

                    <button
                      type="button"
                      className="btn-annuler"
                      onClick={annulerFormulaireSujet}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div style={{ marginTop: "25px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ flex: "2 1 260px" }}>
                  <div className="search-container" style={{ marginBottom: 0 }}>
                    <input
                      className="search-input"
                      type="text"
                      placeholder="🔎 Rechercher un sujet (titre, entreprise, technologies...)"
                      value={rechercheSujets}
                      onChange={(e) => setRechercheSujets(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: "1 1 160px" }}>
                  <label>Catégorie</label>
                  <select
                    value={filtreCategorieSujet}
                    onChange={(e) => setFiltreCategorieSujet(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {categoriesDisponibles.map((categorie) => (
                      <option key={categorie} value={categorie}>
                        {categorie}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: "1 1 160px" }}>
                  <label>Statut</label>
                  <select
                    value={filtreStatutSujet}
                    onChange={(e) => setFiltreStatutSujet(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="Disponible">Disponible</option>
                    <option value="Attribué">Attribué</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: "1 1 140px" }}>
                  <label>Durée</label>
                  <select
                    value={filtreDureeSujet}
                    onChange={(e) => setFiltreDureeSujet(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {dureesDisponibles.map((duree) => (
                      <option key={duree} value={duree}>
                        {duree}
                      </option>
                    ))}
                  </select>
                </div>

                {(rechercheSujets || filtreCategorieSujet || filtreStatutSujet || filtreDureeSujet) && (
                  <button
                    type="button"
                    className="btn-annuler"
                    onClick={reinitialiserFiltresSujets}
                  >
                    ✕ Réinitialiser
                  </button>
                )}
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "10px" }}>
                {sujetsFiltres.length} sujet(s) sur {sujets.length}
              </p>
            </div>

            <h2>Liste des sujets de stage</h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Description</th>
                    <th>Entreprise</th>
                    <th>Technologies</th>
                    <th>Catégorie</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sujetsFiltres.length === 0 ? (
                    <tr>
                      <td colSpan="9">
                        {sujets.length === 0
                          ? "Aucun sujet de stage disponible."
                          : "Aucun sujet ne correspond à ces critères."}
                      </td>
                    </tr>
                  ) : (
                    sujetsFiltres.map((sujet) => (
                      <tr key={sujet.id}>
                        <td>{sujet.id}</td>
                        <td>{sujet.titre}</td>
                        <td>{sujet.description || "-"}</td>
                        <td>{sujet.entreprise || "-"}</td>
                        <td>{sujet.technologies || "-"}</td>
                        <td>{sujet.categorie || "-"}</td>
                        <td>{sujet.duree || "-"}</td>
                        <td>
                          <span
                            className={`badge-statut ${classeBadgeSujet(
                              sujet.statut
                            )}`}
                          >
                            {sujet.statut}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-modifier"
                            onClick={() => modifierSujet(sujet)}
                          >
                            ✏️ Modifier
                          </button>

                          <button
                            type="button"
                            className="btn-supprimer"
                            onClick={() => supprimerSujet(sujet.id)}
                          >
                            🗑️ Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* =================================================
            PAGE AFFECTATIONS
        ================================================= */}
        {page === "affectations" && (
          <>
            <div className="form-container">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ marginBottom: 0 }}>🔗 Affectations</h2>

                <button
                  className="btn-enregistrer"
                  type="button"
                  onClick={() => {
                    if (afficherFormulaireAffectation) {
                      annulerFormulaireAffectation();
                    } else {
                      setAffectationEnModification(null);
                      setAffectationFormulaire(affectationVide);
                      setAfficherFormulaireAffectation(true);
                    }
                  }}
                >
                  {afficherFormulaireAffectation ? "✕ Fermer" : "+ Nouvelle affectation"}
                </button>
              </div>

              {afficherFormulaireAffectation && (
                <form
                  onSubmit={
                    affectationEnModification
                      ? enregistrerModificationAffectation
                      : ajouterAffectation
                  }
                  style={{ marginTop: "25px" }}
                >
                  <div className="form-grid">

                    <div className="form-group">
                      <label>Stagiaire</label>

                      <select
                        name="stagiaire_id"
                        value={
                          affectationEnModification
                            ? affectationEnModification.stagiaire_id
                            : affectationFormulaire.stagiaire_id
                        }
                        onChange={
                          affectationEnModification
                            ? handleModificationAffectationChange
                            : (e) =>
                                setAffectationFormulaire({
                                  ...affectationFormulaire,
                                  stagiaire_id: e.target.value,
                                })
                        }
                        required
                      >
                        <option value="">-- Sélectionner un stagiaire --</option>
                        {stagiaires.map((stagiaire) => (
                          <option key={stagiaire.id} value={stagiaire.id}>
                            {stagiaire.prenom} {stagiaire.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Sujet de stage</label>

                      <select
                        name="sujet_id"
                        value={
                          affectationEnModification
                            ? affectationEnModification.sujet_id
                            : affectationFormulaire.sujet_id
                        }
                        onChange={
                          affectationEnModification
                            ? handleModificationAffectationChange
                            : (e) =>
                                setAffectationFormulaire({
                                  ...affectationFormulaire,
                                  sujet_id: e.target.value,
                                })
                        }
                        required
                      >
                        <option value="">-- Sélectionner un sujet --</option>
                        {sujets.map((sujet) => (
                          <option key={sujet.id} value={sujet.id}>
                            {sujet.titre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Date d'affectation</label>

                      <input
                        type="date"
                        name="date_affectation"
                        value={
                          affectationEnModification
                            ? affectationEnModification.date_affectation || ""
                            : affectationFormulaire.date_affectation
                        }
                        onChange={
                          affectationEnModification
                            ? handleModificationAffectationChange
                            : (e) =>
                                setAffectationFormulaire({
                                  ...affectationFormulaire,
                                  date_affectation: e.target.value,
                                })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Statut</label>

                      <select
                        name="statut"
                        value={
                          affectationEnModification
                            ? affectationEnModification.statut
                            : affectationFormulaire.statut
                        }
                        onChange={
                          affectationEnModification
                            ? handleModificationAffectationChange
                            : (e) =>
                                setAffectationFormulaire({
                                  ...affectationFormulaire,
                                  statut: e.target.value,
                                })
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="Terminée">Terminée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </div>

                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-enregistrer">
                      {affectationEnModification
                        ? "💾 Enregistrer la modification"
                        : "Enregistrer l'affectation"}
                    </button>

                    <button
                      type="button"
                      className="btn-annuler"
                      onClick={annulerFormulaireAffectation}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>

            <h2>Liste des affectations</h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Stagiaire</th>
                    <th>Sujet</th>
                    <th>Date d'affectation</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {affectations.length === 0 ? (
                    <tr>
                      <td colSpan="6">Aucune affectation pour le moment.</td>
                    </tr>
                  ) : (
                    affectations.map((affectation) => (
                      <tr key={affectation.id}>
                        <td>{affectation.id}</td>
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
                        <td>
                          <button
                            type="button"
                            className="btn-modifier"
                            onClick={() => modifierAffectation(affectation)}
                          >
                            ✏️ Modifier
                          </button>

                          <button
                            type="button"
                            className="btn-supprimer"
                            onClick={() => supprimerAffectation(affectation.id)}
                          >
                            🗑️ Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* =================================================
            PAGE UTILISATEURS
        ================================================= */}
        {page === "utilisateurs" && (
          <>
            <div className="form-container">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ marginBottom: 0 }}>👤 Utilisateurs</h2>

                <button
                  className="btn-enregistrer"
                  type="button"
                  onClick={() => {
                    if (afficherFormulaireUtilisateur) {
                      annulerFormulaireUtilisateur();
                    } else {
                      setUtilisateurEnModification(null);
                      setUtilisateurFormulaire(utilisateurVide);
                      setAfficherFormulaireUtilisateur(true);
                    }
                  }}
                >
                  {afficherFormulaireUtilisateur ? "✕ Fermer" : "+ Nouvel utilisateur"}
                </button>
              </div>

              {afficherFormulaireUtilisateur && (
                <form
                  onSubmit={
                    utilisateurEnModification
                      ? enregistrerModificationUtilisateur
                      : ajouterUtilisateur
                  }
                  style={{ marginTop: "25px" }}
                >
                  <div className="form-grid">

                    <div className="form-group">
                      <label>Prénom</label>

                      <input
                        type="text"
                        name="prenom"
                        value={
                          utilisateurEnModification
                            ? utilisateurEnModification.prenom
                            : utilisateurFormulaire.prenom
                        }
                        onChange={
                          utilisateurEnModification
                            ? handleModificationUtilisateurChange
                            : (e) =>
                                setUtilisateurFormulaire({
                                  ...utilisateurFormulaire,
                                  prenom: e.target.value,
                                })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Nom</label>

                      <input
                        type="text"
                        name="nom"
                        value={
                          utilisateurEnModification
                            ? utilisateurEnModification.nom
                            : utilisateurFormulaire.nom
                        }
                        onChange={
                          utilisateurEnModification
                            ? handleModificationUtilisateurChange
                            : (e) =>
                                setUtilisateurFormulaire({
                                  ...utilisateurFormulaire,
                                  nom: e.target.value,
                                })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>

                      <input
                        type="email"
                        name="email"
                        value={
                          utilisateurEnModification
                            ? utilisateurEnModification.email
                            : utilisateurFormulaire.email
                        }
                        onChange={
                          utilisateurEnModification
                            ? handleModificationUtilisateurChange
                            : (e) =>
                                setUtilisateurFormulaire({
                                  ...utilisateurFormulaire,
                                  email: e.target.value,
                                })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Mot de passe
                        {utilisateurEnModification && " (à ressaisir pour le conserver)"}
                      </label>

                      <input
                        type="password"
                        name="mot_de_passe"
                        placeholder={
                          utilisateurEnModification
                            ? "Nouveau mot de passe"
                            : ""
                        }
                        value={
                          utilisateurEnModification
                            ? utilisateurEnModification.mot_de_passe
                            : utilisateurFormulaire.mot_de_passe
                        }
                        onChange={
                          utilisateurEnModification
                            ? handleModificationUtilisateurChange
                            : (e) =>
                                setUtilisateurFormulaire({
                                  ...utilisateurFormulaire,
                                  mot_de_passe: e.target.value,
                                })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Rôle</label>

                      <select
                        name="role"
                        value={
                          utilisateurEnModification
                            ? utilisateurEnModification.role
                            : utilisateurFormulaire.role
                        }
                        onChange={
                          utilisateurEnModification
                            ? handleModificationUtilisateurChange
                            : (e) =>
                                setUtilisateurFormulaire({
                                  ...utilisateurFormulaire,
                                  role: e.target.value,
                                })
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="encadrant">Encadrant</option>
                        <option value="stagiaire">Stagiaire</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Compte actif</label>

                      <select
                        name="actif"
                        value={
                          (utilisateurEnModification
                            ? utilisateurEnModification.actif
                            : utilisateurFormulaire.actif) ? "oui" : "non"
                        }
                        onChange={(e) => {
                          const valeur = e.target.value === "oui";
                          if (utilisateurEnModification) {
                            setUtilisateurEnModification({
                              ...utilisateurEnModification,
                              actif: valeur,
                            });
                          } else {
                            setUtilisateurFormulaire({
                              ...utilisateurFormulaire,
                              actif: valeur,
                            });
                          }
                        }}
                      >
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                      </select>
                    </div>

                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-enregistrer">
                      {utilisateurEnModification
                        ? "💾 Enregistrer la modification"
                        : "Enregistrer l'utilisateur"}
                    </button>

                    <button
                      type="button"
                      className="btn-annuler"
                      onClick={annulerFormulaireUtilisateur}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>

            <h2>Liste des utilisateurs</h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actif</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {utilisateurs.length === 0 ? (
                    <tr>
                      <td colSpan="6">Aucun utilisateur pour le moment.</td>
                    </tr>
                  ) : (
                    utilisateurs.map((utilisateur) => (
                      <tr key={utilisateur.id}>
                        <td>{utilisateur.id}</td>
                        <td>{utilisateur.prenom} {utilisateur.nom}</td>
                        <td>{utilisateur.email}</td>
                        <td>
                          <span
                            className={`badge-statut ${classeBadgeRole(
                              utilisateur.role
                            )}`}
                          >
                            {utilisateur.role}
                          </span>
                        </td>
                        <td>{utilisateur.actif ? "✅ Oui" : "⛔ Non"}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-modifier"
                            onClick={() => modifierUtilisateur(utilisateur)}
                          >
                            ✏️ Modifier
                          </button>

                          <button
                            type="button"
                            className="btn-supprimer"
                            onClick={() => supprimerUtilisateur(utilisateur.id)}
                          >
                            🗑️ Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;