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
import { info as logInfo, error as logError, debug as logDebug } from "./logger";
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
    // Session token restored (removed sensitive data logging)
    logInfo('Session token restored successfully');
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
    // Background script response received (removed sensitive data logging)
    logDebug('Background script response received');
  });
}

/**
 * Récupère le token de session de manière asynchrone
 * @returns Token de session
 */
async function getSessionToken(): Promise<string | null> {
  if (!sessionToken) {
    try {
      const response = await browser.runtime.sendMessage({ action: "getSessionToken" });
      if (response.success && response.token) {
        sessionToken = response.token;
        return sessionToken;
      }
      return null;
    } catch (error) {
      logError('Erreur lors de la récupération du token de session:', error);
      return null;
    }
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
    sessionToken = await getSessionToken();
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
    // UUID and client data (removed sensitive data logging)
    logDebug('UUID and client data processed');
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

    // Debug: Vérifier client.di_q avant conversion
    logDebug(`client.di_q type: ${typeof client.di_q}, length: ${client.di_q ? client.di_q.length : 'null'}`);
    logDebug(`client.di_q instanceof Uint8Array: ${client.di_q instanceof Uint8Array}`);
    logDebug(`client.di_q instanceof Array: ${Array.isArray(client.di_q)}`);

    const di_q = new Uint8Array(client.di_q);

    // Debug: Vérifier la taille de di_q
    logDebug(`di_q length: ${di_q.length}, expected: 4896`);
    
    if (di_q.length !== 4896) {
      logError(`Erreur: di_q a une taille incorrecte: ${di_q.length} octets, attendu: 4896 octets`);
      return { result: null, client: null, error: `Clé secrète di_q invalide: taille ${di_q.length} au lieu de 4896` };
    }

    // Challenge data processed (removed sensitive data logging)
    logDebug('Challenge data processed successfully');

    // Importer dynamiquement ml-dsa87 pour la signature
    const { ml_dsa87 } = await import("@noble/post-quantum/ml-dsa");
    const signature = ml_dsa87.sign(challengeBytes, di_q);
    
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
      // Session token retrieved (removed sensitive data logging)
    logInfo('Session token retrieved successfully');
      if (typeof tokenResponse === "string") {
        // Définir et sauvegarder le token de session
        setSessionToken(tokenResponse);
        // Session token retrieved (removed sensitive data logging)
        logInfo('Session token retrieved and stored successfully');
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
    logDebug('Starting sync_json API call');
    const response3 = await fetch(
      API_URL + "sync_json/" + uuidToStr(uuid),
      getRequestOptions()
    );

    // Afficher les en-têtes de la requête pour le débogage
    // Request headers prepared (removed sensitive data logging)
    logDebug('Request headers prepared for sync_json');
    logDebug(`sync_json response status: ${response3.status}, ok: ${response3.ok}`);

    if (!response3.ok) {
      logError(`sync_json failed with status: ${response3.status}, statusText: ${response3.statusText}`);
      return { result: null, client: null, error: response3.statusText };
    }

    // Décapsuler la clé partagée
    logDebug('Parsing sync_json response');
    const result2 = Uint8Array.from(await response3.json());
    logDebug(`sync_json result2 length: ${result2.length}`);
    
    logDebug('Importing ml_kem1024');
    const { ml_kem1024 } = await import("@noble/post-quantum/ml-kem");
    
    logDebug('Preparing ky_q for decapsulation');
    const ky_q = new Uint8Array(client.ky_q);
    logDebug(`ky_q length: ${ky_q.length}`);
    
    logDebug('Starting decapsulation');
    const shared = ml_kem1024.decapsulate(result2, ky_q);
    logDebug('Decapsulation successful');
    
    client.secret = shared;
    logDebug('Authentication completed successfully');

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
      sessionToken = await getSessionToken();
      if (!sessionToken) {
        return { passwords: [], error: "Token de session manquant" };
      }
    }
    
    // Session token used for request (removed sensitive data logging)
    logDebug('Session token used for get_all request');

    // Récupérer tous les mots de passe
    const options = getRequestOptions();
    // Request headers prepared (removed sensitive data logging)
    logDebug('Request headers prepared for send_all_json');

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
        // Decrypted data processed (removed sensitive data logging)
    logDebug('Final decrypted data processed successfully');
        // Décoder le mot de passe
        const password = decodePassword(finalDecrypted);
        if (!password) {
          console.error("Mot de passe non valide");
          continue;
        }


        passwordsList.push(password);
        // Password decrypted (removed sensitive data logging)
        logDebug('Password decrypted successfully');
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
 * Charge un client à partir d'un fichier avec validation de sécurité
 * @param fileData Données du fichier client
 * @returns Client chargé ou null si invalide
 */
export function loadClientFromFile(fileData: ArrayBuffer): ClientEx | null {
  try {
    // Validation de la taille du fichier
    if (fileData.byteLength === 0) {
      logError('Fichier vide détecté');
      return null;
    }
    
    if (fileData.byteLength > 1024 * 1024) { // 1MB max pour un fichier client
      logError('Fichier client trop volumineux');
      return null;
    }
    
    // Validation basique du format (vérifier les premiers octets)
    const view = new Uint8Array(fileData);
    if (view.length < 4) {
      logError('Fichier client trop petit');
      return null;
    }
    
    // Utiliser la fonction decodeClientEx pour décoder le client
    const client = decodeClientEx(fileData);    
    if (!client) {
      logError('Échec du décodage du client');
      return null;
    }
    
    // Validation supplémentaire de la structure du client
    if (!client.id || !client.c) {
      logError('Structure de client invalide - champs requis manquants (id ou c)');
      return null;
    }
    
    // Vérifier la structure de l'ID (CK)
    if (!client.id.email || !client.id.ky_p || !client.id.di_p) {
      logError('Structure de client invalide - champs ID manquants');
      return null;
    }
    
    // Vérifier la structure du client (Client)
    if (!client.c.ky_p || !client.c.ky_q || !client.c.di_p || !client.c.di_q) {
      logError('Structure de client invalide - champs Client manquants');
      return null;
    }
    
    // Client loading from file (removed sensitive data logging)
    logInfo('Client loaded and validated successfully from file');
    return client;
  } catch (error) {
    logError("Erreur lors du chargement du client:", error);
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