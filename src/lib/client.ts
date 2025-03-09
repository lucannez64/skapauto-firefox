// Client simplifié pour l'extension web
import {
  type Client,
  type Password,
  type Uuid,
  uuidToStr,
  type ClientEx,
  decodeClientEx,
  decodePassword,
  EP,
  encodePassword
} from "./decoder";
import { blake3 } from "@noble/hashes/blake3";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import * as pkg from "uuid-tool";
import { ml_kem1024 } from "@noble/post-quantum/ml-kem";
import { randomBytes } from "@noble/post-quantum/utils.js";
const { Uuid: UuidTool } = pkg;

// Utiliser une URL relative pour que le proxy Vite fonctionne correctement
const API_URL = "https://skap.klyt.eu/";
const API_DOMAIN = "skap.klyt.eu";

// Variable pour stocker le token de session
let sessionToken: string | null = null;

// Options par défaut pour les requêtes fetch
const fetchOptions: RequestInit = {
  credentials: "include", // Inclure les cookies dans toutes les requêtes
  mode: "cors", // Activer CORS pour les requêtes cross-origin
  cache: "no-cache", // Désactiver le cache pour éviter les problèmes de cookies
  redirect: "follow", // Suivre les redirections
};

// Écouter les messages du background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "restoreSessionToken" && message.token) {
    sessionToken = message.token;
    console.log("Token de session restauré:", sessionToken);
    sendResponse({ success: true });
  }
  return true;
});

interface SharedPass {
  kem_ct: Uint8Array;
  ep: EP;
  status: ShareStatus;
}

export enum ShareStatus {
  Pending,
  Accepted,
  Rejected
}

/**
 * Définit le token de session et le sauvegarde dans le background script
 * @param token Token de session à définir
 */
function setSessionToken(token: string) {
  sessionToken = token;
  // Informer le background script du nouveau token
  browser.runtime.sendMessage(
    {
      action: "saveSessionToken",
      token: token,
    }
  ).then((response) => {
    console.log("Réponse du background script:", response);
  });
}

/**
 * Récupère le token de session
 * @returns Token de session
 */
function getSessionToken() {
  if (!sessionToken) {
    browser.runtime.sendMessage({ action: "getSessionToken" }).then((response) => {
      sessionToken = response.token;
    });
  } else {
    return sessionToken;
  }
}

/**
 * Récupère les cookies pour un domaine spécifique
 * @param domain Domaine pour lequel récupérer les cookies
 * @returns Promise avec les cookies
 */
async function getCookiesForDomain(
  domain: string
): Promise<browser.cookies.Cookie[]> {
  return new Promise((resolve) => {
    browser.cookies.getAll({ domain }).then((cookies) => {
      resolve(cookies);
    });
  });
}

/**
 * Définit un cookie pour un domaine spécifique
 * @param details Détails du cookie à définir
 * @returns Promise avec le cookie défini
 */
async function setCookie(
  details: browser.cookies._SetDetails
): Promise<browser.cookies.Cookie | null> {
  return new Promise((resolve) => {
    browser.cookies.set(details).then((cookie) => {
      resolve(cookie || null);
    });
  });
}

/**
 * Crée les options de requête avec le token de session si disponible
 * @returns Options de requête avec le token de session
 */
function getRequestOptions(method: string = "GET", body?: any): RequestInit {
  const options: RequestInit = {
    ...fetchOptions,
    method,
    headers: {
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
      Connection: "keep-alive",
    },
  };

  // Ajouter le token de session s'il est disponible
  if (sessionToken) {
    options.headers = {
      ...options.headers,
      Authorization: sessionToken, // Utiliser Authorization header plutôt que les cookies manuels
    };
  }

  // Ajouter le corps de la requête si nécessaire
  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

function encrypt(pass: Password, client: Client) {
  const passb = encodePassword(pass);
  if (!passb) {
    return { result: null, error: "Échec de l'encodage du mot de passe" };
  }
  if (!client.ky_q) {
    return { result: null, error: "Missing client.ky_q" };
  }
  const ky_q = new Uint8Array(client.ky_q);
  const hash = blake3(ky_q).slice(0, 32);
  const nonce = randomBytes(24);
  const key = new Uint8Array(hash);
  const cipher = xchacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(passb);
  const ep: EP = {
    ciphertext: ciphertext,
    nonce: nonce,
    nonce2: null
  };
  return { result: ep, error: null };
}


function send(ep: EP, client: Client) {
  if (!client.secret) {
    return { result: null, error: "Missing client.secret" };
  }
  const secret = new Uint8Array(client.secret);
  const hash = blake3(secret).slice(0, 32);
  const nonce2 = randomBytes(24);
  const key = new Uint8Array(hash);
  const cipher = xchacha20poly1305(key, nonce2);
  const ciphertext = cipher.encrypt(ep.ciphertext);
  const ep2: EP = {
    ciphertext: ciphertext,
    nonce: ep.nonce,
    nonce2: nonce2
  };
  return { result: ep2, error: null };
}

export async function create_pass(uuid: Uuid, pass: Password, client: Client) {
  if (!sessionToken) {
    sessionToken = getSessionToken() ?? null;
    if (!sessionToken) {
      return { result: null, error: "Token de session manquant" };
    }
  }
  const encrypted = encrypt(pass, client);
  if (!encrypted.result) {
    return { result: null, error: encrypted.error };
  }
  const eq = send(encrypted.result, client);
  if (!eq.result) {
    return { result: null, error: eq.error };
  }
  const truer = {
    ciphertext: Array.from(eq.result.ciphertext),
    nonce: Array.from(eq.result.nonce),
    nonce2: Array.from(eq.result.nonce2!),
  };
  const res = await fetch(
    API_URL + "create_pass_json/" + uuidToStr(uuid),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": sessionToken ?? "",
      },
      body: JSON.stringify(truer),
    },
  );
  if (!res.ok) {
    return { result: null, error: res.statusText };
  }
  const result = await res.json();
  return { result: result, error: null };
}


/**
 * Authentifie un client avec le serveur
 * @param uuid UUID de l'utilisateur
 * @param client Objet client contenant les clés
 * @returns Résultat de l'authentification
 */
export async function auth(uuid: Uuid, client: Client) {
  try {
    // Étape 1: Obtenir le challenge
    console.log("uuid:", uuid);
    console.log("client:", client);
    console.log(uuidToStr(uuid));
    const response = await fetch(
      API_URL + "challenge_json/" + uuidToStr(uuid),
      getRequestOptions()
    );
    if (!response.ok) {
      return { result: null, client: null, error: response.statusText };
    }

    // Récupérer le challenge et le signer
    const challenge = await response.json();
    const challengeBytes = arraytoUint8Array(challenge);

    const di_q = new Uint8Array(client.di_q);

    console.log("di_q:", di_q);
    console.log("challengeBytes:", challengeBytes);

    // Importer dynamiquement ml-dsa87 pour la signature
    const { ml_dsa87 } = await import("@noble/post-quantum/ml-dsa");
    const signature = ml_dsa87.sign(di_q, challengeBytes);
    
    const signArray = arrayfrom(signature);

    // Étape 2: Vérifier la signature
    const response2 = await fetch(
      API_URL + "verify_json/" + uuidToStr(uuid),
      getRequestOptions("POST", signArray)
    );

    if (!response2.ok) {
      return { result: null, client: null, error: response2.statusText };
    }

    // Récupérer le token de session
    try {
      const tokenResponse = await response2.json();
      console.log("Token de session récupéré:", tokenResponse);
      if (typeof tokenResponse === "string") {
        // Définir et sauvegarder le token de session
        setSessionToken(tokenResponse);
        console.log("Token de session récupéré:", tokenResponse);
      } else {
        console.warn(
          "La réponse n'est pas un token de session valide:",
          tokenResponse
        );
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du token de session:", error);
    }

    // Étape 3: Synchroniser avec le serveur
    const response3 = await fetch(
      API_URL + "sync_json/" + uuidToStr(uuid),
      getRequestOptions()
    );

    // Afficher les en-têtes de la requête pour le débogage
    console.log("En-têtes de la requête sync_json:", getRequestOptions().headers);

    if (!response3.ok) {
      return { result: null, shared: null, error: response3.statusText };
    }

    // Décapsuler la clé partagée
    const result2 = Uint8Array.from(await response3.json());
    const { ml_kem1024 } = await import("@noble/post-quantum/ml-kem");
    const ky_q = new Uint8Array(client.ky_q);
    const shared = ml_kem1024.decapsulate(result2, ky_q);
    client.secret = shared;

    return { result: response2, client: client, error: null };
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return { result: null, client: null, error: String(error) };
  }
}

/**
 * Récupère tous les mots de passe d'un utilisateur
 * @param uuid UUID de l'utilisateur
 * @param client Objet client contenant les clés
 * @returns Liste des mots de passe
 */
export async function get_all(
  uuid: Uuid,
  client: Client
): Promise<{ passwords: Password[]; error: string | null }> {
  try {
    // Vérifier que le token de session est disponible
    if (!sessionToken) {
      console.warn("Token de session non disponible, l'authentification pourrait échouer");
    } else {
      console.log("Token de session utilisé pour get_all:", sessionToken);
    }

    // Récupérer tous les mots de passe
    const options = getRequestOptions();
    console.log("En-têtes de la requête send_all_json:", options.headers);

    const response = await fetch(
      API_URL + "send_all_json/" + uuidToStr(uuid),
      options
    );
    if (!response.ok) {
      return { passwords: [], error: response.statusText };
    }

    const result = await response.json();
    const secretKey = new Uint8Array(client.secret!);
    const hash = blake3(secretKey).slice(0, 32);
    const key = new Uint8Array(hash);
    const ky_q = new Uint8Array(client.ky_q);
    const hash2 = blake3(ky_q).slice(0, 32);
    const key2 = new Uint8Array(hash2);

    if (!secretKey) {
      return { passwords: [], error: "Clé secrète manquante" };
    }

    // Décrypter les mots de passe
    const passwordsResult = result.passwords || [];
    const passwordsList: Password[] = [];
    const sharedRecipients = result.shared || [];

    for (const [ep, uuidStr] of passwordsResult) {
      try {
        // Décrypter le mot de passe

        if (!ep.nonce2) {
          console.error("nonce2 manquant");
          continue;
        }

        const nonce2 =
          ep.nonce2 instanceof Uint8Array
            ? ep.nonce2.slice(0, 24)
            : Uint8Array.from(ep.nonce2).slice(0, 24);

        const chacha = xchacha20poly1305(key, nonce2);
        const ciphertext1 =
          ep.ciphertext instanceof Uint8Array
            ? ep.ciphertext
            : Uint8Array.from(ep.ciphertext);

        const decryptedIntermediate = chacha.decrypt(ciphertext1);

        const nonce =
          ep.nonce instanceof Uint8Array
            ? ep.nonce
            : Uint8Array.from(ep.nonce);

        if (!client.ky_q) {
          console.error("ky_q manquant");
          continue;
        }

        const cipher = xchacha20poly1305(key2, nonce);
        const finalDecrypted = cipher.decrypt(decryptedIntermediate);
        console.log("finalDecrypted:", finalDecrypted);
        // Décoder le mot de passe
        const password = decodePassword(finalDecrypted);
        if (!password) {
          console.error("Mot de passe non valide");
          continue;
        }


        passwordsList.push(password);
        console.log("Mot de passe déchiffré:", password);
      } catch (error) {
        console.error("Erreur lors du déchiffrement d'un mot de passe:", error);
      }
    }
    for (const [sharedPass, ownerUuid, passUuid] of sharedRecipients) {
      const sharedPassObj: SharedPass = { 
        kem_ct: Uint8Array.from(sharedPass.kem_ct),
        ep: {
          ciphertext: Uint8Array.from(sharedPass.ep.ciphertext),
          nonce: Uint8Array.from(sharedPass.ep.nonce),
          nonce2: sharedPass.ep.nonce2 ? Uint8Array.from(sharedPass.ep.nonce2) : null
        },
        status: sharedPass.status
      };
      const sharedSecret = ml_kem1024.decapsulate(sharedPassObj.kem_ct, ky_q);
      const secretKey = blake3(sharedSecret).slice(0, 32);
      const key = new Uint8Array(secretKey);
      const nonce = sharedPassObj.ep.nonce instanceof Uint8Array 
        ? sharedPassObj.ep.nonce 
        : Uint8Array.from(sharedPassObj.ep.nonce);
      const cipher = xchacha20poly1305(key, nonce);
      const ciphertext = sharedPassObj.ep.ciphertext instanceof Uint8Array 
        ? sharedPassObj.ep.ciphertext 
        : Uint8Array.from(sharedPassObj.ep.ciphertext);
      const decryptedBytes = cipher.decrypt(ciphertext);
      const password = decodePassword(decryptedBytes);
      if (!password) {
        console.error("Mot de passe non valide");
        continue;
      }
      if (sharedPassObj.status === ShareStatus.Accepted) {
        passwordsList.push(password);
      }
    }
    return { passwords: passwordsList, error: null };
  } catch (error) {
    console.error("Erreur lors de la récupération des mots de passe:", error);
    return { passwords: [], error: String(error) };
  }
}

/**
 * Charge un client à partir d'un fichier
 * @param fileData Données du fichier client
 * @returns Client chargé
 */
export function loadClientFromFile(fileData: ArrayBuffer): ClientEx | null {
  try {
    // Utiliser la fonction decodeClientEx pour décoder le client
    const client = decodeClientEx(fileData);
    console.log("Chargement du client à partir du fichier...");
    console.log(client);
    return client;
  } catch (error) {
    console.error("Erreur lors du chargement du client:", error);
    return null;
  }
}


function arrayfrom(array: Uint8Array) {
  let array2 = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    array2[i] = array[i];
  }
  return array2;
}

function arraytoUint8Array(array: Array<number>) {
  let array2 = new Uint8Array(array.length);
  for (let i = 0; i < array.length; i++) {
    array2[i] = array[i];
  }
  return array2;
}