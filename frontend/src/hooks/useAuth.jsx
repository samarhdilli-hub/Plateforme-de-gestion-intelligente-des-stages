import { useState } from "react";
import { API_URL } from "../services/api";

export function useAuth() {
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
      // 1. Tente l'envoi en JSON (votre format actuel)
      let response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailLogin,
          mot_de_passe: motDePasseLogin,
        }),
      });

      // 2. Si le backend exige du x-www-form-urlencoded (standard FastAPI OAuth2)
      if (response.status === 422) {
        const formData = new URLSearchParams();
        formData.append("username", emailLogin);
        formData.append("password", motDePasseLogin);

        response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error("Email ou mot de passe incorrect");
      }

      const data = await response.json();

      // Sauvegarde dans le localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role || "user");

      // Mise à jour de l'état local
      setToken(data.access_token);
      setRole(data.role || "user");
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

  return {
    token,
    role,
    emailLogin,
    setEmailLogin,
    motDePasseLogin,
    setMotDePasseLogin,
    erreurLogin,
    chargementLogin,
    seConnecter,
    seDeconnecter,
  };
}