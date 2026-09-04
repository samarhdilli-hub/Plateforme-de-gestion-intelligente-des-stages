import { useState } from "react";
import { apiFetch } from "../services/api";

// Import intelligent de sujets (PDF / Word / Excel / CSV / JSON / URL).
// setSujets vient de useSujets : une fois l'import confirmé, les nouveaux
// sujets rejoignent directement la liste déjà chargée.
export function useImportSujets(setSujets) {
  const [afficherImportSujets, setAfficherImportSujets] = useState(false);
  const [fichierImport, setFichierImport] = useState(null);
  const [urlImport, setUrlImport] = useState("");
  const [modeImport, setModeImport] = useState("fichier");
  const [chargementImport, setChargementImport] = useState(false);
  const [erreurImport, setErreurImport] = useState("");
  const [sujetsExtraits, setSujetsExtraits] = useState([]);

  const basculerPanneauImport = () => {
    setAfficherImportSujets((valeur) => !valeur);
    setFichierImport(null);
    setUrlImport("");
    setModeImport("fichier");
    setSujetsExtraits([]);
    setErreurImport("");
  };

  const analyserFichierImport = async (e) => {
    e.preventDefault();

    setChargementImport(true);
    setErreurImport("");

    try {
      let response;

      if (modeImport === "url") {
        if (!urlImport.trim()) {
          setErreurImport("Veuillez indiquer une URL (export CSV, Excel ou JSON d'un système externe).");
          setChargementImport(false);
          return;
        }

        response = await apiFetch("/sujets/importer-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlImport.trim() }),
        });
      } else {
        if (!fichierImport) {
          setErreurImport("Veuillez sélectionner un fichier (PDF, Word, Excel, CSV ou JSON).");
          setChargementImport(false);
          return;
        }

        const formData = new FormData();
        formData.append("fichier", fichierImport);

        response = await apiFetch("/sujets/importer", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erreur lors de l'analyse");
      }

      setSujetsExtraits(
        data.sujets_extraits.map((sujet) => ({
          ...sujet,
          selectionne: !sujet.doublon_probable,
        }))
      );
    } catch (error) {
      console.error(error);
      setErreurImport(error.message || "Erreur lors de l'analyse");
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
      .map(({ titre, description, entreprise, technologies, duree, localisation, niveau_requis, statut, categorie }) => ({
        titre,
        description,
        entreprise,
        technologies,
        duree,
        localisation,
        niveau_requis,
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

  return {
    afficherImportSujets,
    basculerPanneauImport,
    fichierImport,
    setFichierImport,
    urlImport,
    setUrlImport,
    modeImport,
    setModeImport,
    chargementImport,
    erreurImport,
    sujetsExtraits,
    analyserFichierImport,
    basculerSelectionSujetExtrait,
    confirmerImportSujets,
  };
}
