import { useCallback, useEffect, useState } from "react";
import { estLangue, traduire, type CleTraduction, type Langue } from "./i18n";

const CLE_STOCKAGE = "claimdesk.langue";

/**
 * Langue du parcours public. Initialisée en français côté SSR, puis restaurée
 * depuis le stockage local après hydratation (évite tout écart d'hydratation).
 */
export function useLangue(defaut: Langue = "fr") {
  const [langue, setLangueState] = useState<Langue>(defaut);

  useEffect(() => {
    const stockee = window.localStorage.getItem(CLE_STOCKAGE);
    if (estLangue(stockee)) setLangueState(stockee);
  }, []);

  useEffect(() => {
    document.documentElement.lang = langue;
  }, [langue]);

  const setLangue = useCallback((valeur: Langue) => {
    setLangueState(valeur);
    window.localStorage.setItem(CLE_STOCKAGE, valeur);
  }, []);

  const t = useCallback((cle: CleTraduction) => traduire(langue, cle), [langue]);

  return { langue, setLangue, t };
}