// Service worker pour l'extension Firefox
import { auth, get_all, create_pass, loadClientFromFile } from './lib/client';
import { type ClientEx, type Uuid, type Password } from './lib/decoder';

// Importer la bibliothèque pour générer des codes TOTP
import * as OTPAuth from "otpauth";
// Stockage sécurisé AES-GCM
import { setEncrypted, getDecrypted, remove as removeEncrypted, wipeKey, enforceKeyTTL, scheduleKeyExpiry } from './lib/secureStorage';
// Logger utilitaire
import { info as logInfo, warn as logWarn, error as logError, debug as logDebug } from './lib/logger';

// Interface pour les paramètres TOTP
interface TOTPParams {
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
}

// Interface pour la réponse des mots de passe
interface PasswordResponse {
  success: boolean;
  passwords?: Password[];
  message?: string;
}

// Constante pour la durée de validité du client (1 heure en millisecondes)
const CLIENT_EXPIRATION_TIME = 60 * 60 * 1000; // 1 heure

// Stocker le client en mémoire
let currentClient: ClientEx | null = null;
// Stocker les mots de passe en mémoire
let cachedPasswords: Password[] | null = null;

// Enforce and schedule secure storage key expiry at startup
(async function initSecurityTimers() {
  try {
    await enforceKeyTTL();
    await scheduleKeyExpiry();
  } catch (e) {
    logWarn('Failed to initialize key expiry scheduling', e);
  }
})();

// Also handle cases when the extension starts or is installed
browser.runtime.onStartup.addListener(async () => {
  try {
    await enforceKeyTTL();
    await scheduleKeyExpiry();
  } catch (e) {
    logWarn('onStartup key expiry scheduling failed', e);
  }
});

browser.runtime.onInstalled.addListener(async () => {
  try {
    await enforceKeyTTL();
    await scheduleKeyExpiry();
  } catch (e) {
    logWarn('onInstalled key expiry scheduling failed', e);
  }
});

// Fonction pour exporter le token de session depuis le module client
export async function setSessionToken(token: string) {
  // Stocker le token de manière sécurisée avec chiffrement AES-GCM
  await setEncrypted('sessionToken', { token, timestamp: Date.now() });
  logInfo('Token de session sauvegardé de manière sécurisée');
}

// Fonction pour restaurer le token de session
export async function getSessionToken(): Promise<string | null> {
  try {
    const data = await getDecrypted<{ token: string; timestamp: number }>('sessionToken');
    if (data) {
      // Vérifier si le token n'est pas expiré (24 heures)
      const TOKEN_EXPIRATION_TIME = 60 * 60 * 1000; // 24 heures
      if (Date.now() - data.timestamp < TOKEN_EXPIRATION_TIME) {
        return data.token;
      } else {
        // Token expiré, le supprimer
        await removeEncrypted('sessionToken');
        logWarn('Token de session expiré, suppression du stockage');
        return null;
      }
    }
    return null;
  } catch (error) {
    logError('Erreur lors de la récupération du token de session:', error);
    return null;
  }
}

// Fonction pour stocker le client de manière sécurisée avec une expiration d'une heure
async function storeClientSecurely(client: ClientEx): Promise<void> {
  await setEncrypted('secureClient', { client, ts: Date.now() });
}

// Fonction pour stocker les mots de passe de manière sécurisée avec une expiration d'une heure
async function storePasswordsSecurely(passwords: Password[]): Promise<void> {
  await setEncrypted('securePasswords', { passwords, ts: Date.now() });
  logInfo('Mots de passe stockés de manière sécurisée avec expiration dans 1 heure');
}

// Fonction pour récupérer le client stocké s'il est toujours valide
async function getSecureClient(): Promise<ClientEx | null> {
  const data = await getDecrypted<{ client: ClientEx; ts: number }>('secureClient');
  if (data && (Date.now() - data.ts) < CLIENT_EXPIRATION_TIME) {
    // Client retrieved from secure storage (removed sensitive data logging)
      logInfo('Client retrieved from secure storage');
    return data.client;
  } else {
    if (data) {
      // Client expired, removing from storage (removed sensitive data logging)
      logInfo('Client expired, removing from storage');
    }
    await removeEncrypted('secureClient');
    return null;
  }
}

// Fonction pour récupérer les mots de passe stockés s'ils sont toujours valides
async function getSecurePasswords(): Promise<Password[] | null> {
  const data = await getDecrypted<{ passwords: Password[]; ts: number }>('securePasswords');
  if (data && (Date.now() - data.ts) < CLIENT_EXPIRATION_TIME) {
    logInfo('Mots de passe récupérés du stockage sécurisé');
    return data.passwords;
  } else {
    if (data) {
      logWarn('Mots de passe expirés, suppression du stockage');
    }
    await removeEncrypted('securePasswords');
    return null;
  }
}

// Security validation functions
function validateMessageStructure(message: any): boolean {
  if (!message || typeof message !== 'object') {
    return false;
  }
  
  // Check for required action field
  if (!message.action || typeof message.action !== 'string') {
    return false;
  }
  
  // Validate action against allowed actions
  const allowedActions = [
    'fileSelected', 'checkSecureClient', 'authenticate', 
    'getPasswords', 'refreshPasswords', 'saveSessionToken',
    'saveNewCredential', 'classifyFields', 'generateTOTP',
    'injectFile'
  ];
  
  if (!allowedActions.includes(message.action)) {
    return false;
  }
  
  return true;
}

function sanitizeMessageData(message: any): any {
  // Deep clone to avoid reference issues
  const sanitized = JSON.parse(JSON.stringify(message));
  
  // Remove any potentially dangerous properties
  delete sanitized.__proto__;
  delete sanitized.constructor;
  
  return sanitized;
}

// Gérer les messages de l'extension
browser.runtime.onMessage.addListener(async (message: any, sender: any, sendResponse: any) => {
  logDebug('Message reçu dans le background:', message);
  
  // Enhanced security validation
  if (!sender.id || sender.id !== browser.runtime.id) {
    logWarn('Message rejeté - origine non autorisée:', sender);
    return { success: false, message: 'Origine non autorisée' };
  }
  
  // Validate message structure and content
  if (!validateMessageStructure(message)) {
    logWarn('Message rejeté - structure invalide:', message);
    return { success: false, message: 'Structure de message invalide' };
  }
  
  // Sanitize message data
  const sanitizedMessage = sanitizeMessageData(message);
  
  // Traiter les différents types de messages
  switch (sanitizedMessage.action) {
    case 'fileSelected':
      // Traiter directement le fichier sélectionné
      handleFileSelected(sanitizedMessage).then(sendResponse);
      return true; // Indique que sendResponse sera appelé de manière asynchrone
      
    case 'checkSecureClient':
      // Vérifier si un client sécurisé est disponible
      return getSecureClient()
        .then((client) => {
          if (client) {
            currentClient = client;
            return { success: true };
          } else {
            return { success: false };
          }
        })
        .catch((error) => {
          logError('Erreur lors de la vérification du client sécurisé:', error);
          return { success: false, message: 'Erreur lors de la vérification du client sécurisé' };
        });
      
    case 'authenticate':
      // Authentifier le client
      if (currentClient && currentClient.id.id) {
        logDebug(currentClient);
        logDebug('Starting authentication process in background script');
        // Retourner une promesse de réponse au lieu d'utiliser sendResponse
        return auth(currentClient.id.id!, currentClient.c)
          .then(result => {
            logDebug(`Authentication result received: ${JSON.stringify({
              hasError: !!result.error,
              hasClient: !!result.client,
              hasResult: !!result.result,
              error: result.error
            })}`);

            if (result.error) {
              logError(`Authentication error: ${result.error}`);
              const errorResponse = { success: false, message: result.error };
              logDebug(`Returning error response: ${JSON.stringify(errorResponse)}`);
              return errorResponse;
            } else {
              logDebug('Authentication successful, updating client');
              // Mettre à jour le client avec la clé secrète
              if (currentClient && result.client) {
                currentClient.c = result.client;
                // Stocker le client de manière sécurisée (chiffrement AES-GCM)
                storeClientSecurely(currentClient)
                  .then(() => {
                    logInfo('Client authentifié stocké de manière sécurisée');
                  });
              }
              const successResponse = { success: true, message: 'Authentification réussie' };
              logDebug(`Returning success response: ${JSON.stringify(successResponse)}`);
              return successResponse;
            }
          })
          .catch(error => {
            logError(`Authentication catch error: ${error}`);
            const catchResponse = { success: false, message: error.toString() };
            logDebug(`Returning catch response: ${JSON.stringify(catchResponse)}`);
            return catchResponse;
          });
      } else {
        const missingClientResponse = { success: false, message: 'Client ou UUID manquant' };
        logDebug(`Returning missing client response: ${JSON.stringify(missingClientResponse)}`);
        return missingClientResponse;
      }
      break;
      
    case 'getPasswords':
      // D'abord vérifier si nous avons des mots de passe en cache
      return getSecurePasswords().then(passwords => {
        if (passwords) {
          // Utiliser les mots de passe en cache
          cachedPasswords = passwords;
          logInfo('Utilisation des mots de passe en cache');
          return { success: true, passwords };
        }

        if (currentClient && currentClient.id.id) {
          // Récupérer tous les mots de passe depuis le serveur
          return get_all(currentClient.id.id!, currentClient.c)
            .then(result => {
              if (result.error) {
                return { success: false, message: result.error, passwords: undefined };
              }

              const passwords = result.passwords;
              // Mettre à jour le cache et tenter le stockage sécurisé
              if (passwords && passwords.length > 0) {
                cachedPasswords = passwords;
                return storePasswordsSecurely(passwords)
                  .then(() => {
                    logInfo('Mots de passe stockés de manière sécurisée');
                    return { success: true, passwords };
                  })
                  .catch(() => {
                    // En cas d'échec de stockage, renvoyer tout de même les mots de passe
                    return { success: true, passwords };
                  });
              }

              logInfo('Mots de passe récupérés:', passwords);
              return { success: true, passwords };
            })
            .catch(error => {
              return { success: false, message: error.toString(), passwords: undefined };
            });
        }

        return { success: false, message: 'Client ou UUID manquant', passwords: undefined };
      });
      
    case 'refreshPasswords':
      // Récupérer tous les mots de passe depuis le serveur
      if (currentClient && currentClient.id.id) {
        return get_all(currentClient.id.id!, currentClient.c)
          .then(result => {
            if (result.error) {
              return { success: false, message: result.error, passwords: undefined };
            }

            const passwords = result.passwords;
            if (passwords && passwords.length > 0) {
              cachedPasswords = passwords;
              return storePasswordsSecurely(passwords)
                .then(() => {
                  logInfo('Mots de passe récupérés et stockés de manière sécurisée');
                  return { success: true, passwords };
                })
                .catch(() => {
                  return { success: true, passwords };
                });
            }

            return { success: true, passwords };
          })
          .catch(error => {
            return { success: false, message: error.toString() };
          });
      } else {
        return { success: false, message: 'Client ou UUID manquant' };
      }
    
    case 'saveSessionToken':
      // Sauvegarder le token de session de manière sécurisée
      if (message.token) {
        try {
          await setSessionToken(message.token);
          return { success: true, message: 'Token de session sauvegardé de manière sécurisée' };
        } catch (error) {
          logError('Erreur lors de la sauvegarde du token de session:', error);
          return { success: false, message: 'Erreur lors de la sauvegarde du token' };
        }
      } else {
        return { success: false, message: 'Token de session manquant' };
      }

    case 'getSessionToken':
      // Récupérer le token de session de manière sécurisée
      try {
        const token = await getSessionToken();
        if (token) {
          return { success: true, token: token };
        } else {
          return { success: false, message: 'Token de session manquant ou expiré' };
        }
      } catch (error) {
        logError('Erreur lors de la récupération du token de session:', error);
        return { success: false, message: 'Erreur lors de la récupération du token' };
      }

    case 'checkSecurePasswords':
      // Vérifier si des mots de passe sécurisés sont disponibles
      return getSecurePasswords()
        .then(passwords => {
          if (passwords && passwords.length > 0) {
            cachedPasswords = passwords;
            return { success: true, passwords };
          } else {
            return { success: false, message: 'Aucun mot de passe sécurisé disponible' };
          }
        });

    case 'classifyFields':
      logInfo('Demande de classification des champs');
      classifyFormFields()
        .then(fields => {
          return { success: true, fields };
        })
        .catch(error => {
          logError('Erreur lors de la classification des champs:', error);
          return { success: false, message: error.message };
        })
        .then(sendResponse);
      return true; // Indique que la réponse sera envoyée de manière asynchrone

    case 'generateTOTP':
      // Générer un code TOTP
      if (message.params) {
        try {
          const code = generateTOTPCode(message.params);
          return { success: true, code: code };
        } catch (error: any) {
          logError('Erreur lors de la génération du code TOTP:', error);
          return { success: false, message: error.toString() };
        }
      } else {
        return { success: false, message: 'Paramètres TOTP manquants' };
      }

    case 'saveNewCredential':
      // Gère la sauvegarde d'un nouvel identifiant
      handleSaveNewCredential(message)
        .then(sendResponse);
      return true; // Indique que sendResponse sera appelé de manière asynchrone

    default:
      return { success: false, message: 'Action non reconnue' };
  }

  return true; // Indique que la réponse sera envoyée de manière asynchrone
});

// Fonction utilitaire pour convertir une chaîne base64 en ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Restaurer le client depuis le stockage local ou sécurisé au démarrage
async function initializeClient() {
  // D'abord, essayer de récupérer le client sécurisé (qui a une durée de vie d'une heure)
  const secureClient = await getSecureClient();
  
  if (secureClient) {
    currentClient = secureClient;
    logInfo('Client restauré depuis le stockage sécurisé');

    // Récupérer également les mots de passe sécurisés
    const securePasswords = await getSecurePasswords();
    if (securePasswords) {
      cachedPasswords = securePasswords;
      logInfo('Mots de passe restaurés depuis le stockage sécurisé');
    }
  } else {
    // Si pas de client sécurisé, essayer le stockage local
    browser.storage.local.get(['currentClient']).then((result: any) => {
      if (result.currentClient) {
        currentClient = result.currentClient;
        logInfo('Client restauré depuis le stockage local');
      }
    });
  }
  
  // Restaurer le token de session
  browser.storage.local.get(['sessionToken']).then((result: any) => {
    if (result.sessionToken) {
      logInfo('Token de session restauré depuis le stockage local');
      // Informer le module client du token de session
      browser.runtime.sendMessage({ 
        action: 'restoreSessionToken', 
        token: result.sessionToken 
      });
    }
  });
}

// Initialiser le client au démarrage
initializeClient();

// Afficher un message lorsque le service worker est installé
logInfo('Service worker SkapAuto installé pour Firefox');

// Nettoyage des données sensibles en cas d'inactivité ou verrouillage
function wipeSensitiveData() {
  cachedPasswords = null;
  currentClient = null;
  removeEncrypted('secureClient');
  removeEncrypted('securePasswords');
  wipeKey();
  
  // Nettoyer aussi les données de client chargé
  browser.storage.local.remove(['clientLoaded', 'clientFileMetadata']);
  
  logInfo('Données sensibles nettoyées (idle/lock)');
}

browser.idle.onStateChanged.addListener((state) => {
  // Ne nettoie que lors du verrouillage de la session pour préserver la durée de vie de 1h
  if (state === 'locked') {
    wipeSensitiveData();
  }
});

// Exporter une fonction vide pour que le bundler ne se plaigne pas
export {};

// Fonction pour classifier les champs de formulaire sur la page active
async function classifyFormFields(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Obtenir l'onglet actif
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs: any) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('Aucun onglet actif trouvé'));
        return;
      }
      
      const activeTab = tabs[0];
      if (!activeTab.id) {
        reject(new Error('L\'onglet actif n\'a pas d\'ID'));
        return;
      }
      
      // Envoyer un message au script de contenu pour classifier les champs
      browser.tabs.sendMessage(
        activeTab.id,
        { action: 'classifyFields' }
      ).then((response: any) => {
        if (!response || !response.success) {
          reject(new Error(response?.message || 'Échec de la classification des champs'));
          return;
        }
        
        resolve(response.fields);
      }).catch((error: Error) => {
        reject(new Error(`Erreur lors de l'envoi du message: ${error.message}`));
      });
    });
  });
}

/**
 * Génère un code TOTP à partir des paramètres fournis
 * @param params Paramètres TOTP (secret, algorithme, etc.)
 * @returns Code TOTP généré
 */
function generateTOTPCode(params: TOTPParams): string {
  try {
    logInfo('Génération du code TOTP avec les paramètres:', params);
    
    // Configurer l'authenticator
    const totp = new OTPAuth.TOTP({    
      secret: params.secret,
      algorithm: params.algorithm,
      digits: params.digits,
      period: params.period,
      issuer: undefined,
    });
    
    // Générer le code
    const code = totp.generate();
    logInfo('Code TOTP généré:', code);
    
    return code;
  } catch (error) {
    logError('Erreur lors de la génération du code TOTP:', error);
    throw error;
  }
}

/**
 * Traite le fichier sélectionné et charge le client
 */
async function handleFileSelected(message: any): Promise<any> {
  try {
    // Validation de sécurité du fichier
    if (!message.fileName || !message.fileData || !message.fileSize) {
      return { success: false, message: 'Données de fichier incomplètes' };
    }
    
    // Validation du nom de fichier
    const fileName = message.fileName.toString();
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName) || fileName.length > 255) {
      return { success: false, message: 'Nom de fichier invalide' };
    }
    
    // Validation de la taille du fichier (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (message.fileSize > maxFileSize) {
      return { success: false, message: 'Fichier trop volumineux (max 10MB)' };
    }
    
    // Validation du type de fichier
    const allowedTypes = ['application/octet-stream', 'application/x-binary', ''];
    if (message.fileType && !allowedTypes.includes(message.fileType)) {
      logWarn(`Type de fichier non autorisé: ${message.fileType}`);
    }
    
    // File processing started (removed sensitive data logging)
    logInfo('Processing selected file with security validation');
    
    // Validation des données base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(message.fileData)) {
      return { success: false, message: 'Format de données invalide' };
    }
    
    // Convertir les données base64 en ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(message.fileData);
    
    // Validation de la taille après décodage
    if (arrayBuffer.byteLength !== message.fileSize) {
      return { success: false, message: 'Taille de fichier incohérente' };
    }
    
    // Charger le client avec validation
    const client = loadClientFromFile(arrayBuffer);
    
    if (client) {
      currentClient = client;
      
      // Stocker le client de manière sécurisée
      await storeClientSecurely(client);
      // Client stored securely (removed sensitive data logging)
      logInfo('Client stored securely after validation');
      
      // Enregistrer les métadonnées du fichier pour référence (sanitized)
      const fileMetadata = {
        name: fileName,
        type: message.fileType || 'application/octet-stream',
        size: message.fileSize,
        timestamp: Date.now()
      };
      
      // Sauvegarder les métadonnées du fichier et l'état du client chargé
      await browser.storage.local.set({ 
        'clientFileMetadata': fileMetadata,
        'clientLoaded': true
      });
      
      // Notifier le popup que le client a été chargé (si ouvert)
      try {
        await browser.runtime.sendMessage({
          action: 'clientLoaded',
          success: true,
          fileMetadata: fileMetadata
        });
      } catch (err) {
        // Le popup n'est probablement pas ouvert; ignorer et continuer
        logWarn(`Notification clientLoaded non délivrée: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      return { success: true };
    } else {
      logError('Format de fichier client invalide');
      return { success: false, message: 'Format de fichier client invalide' };
    }
  } catch (error: unknown) {
    logError('Erreur lors du chargement du client:', error);
    return { 
      success: false, 
      message: `Erreur lors du chargement du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Gère la sauvegarde d'un nouvel identifiant
 * @param message Message contenant les informations d'identifiant
 */
async function handleSaveNewCredential(message: any): Promise<any> {
  try {
    // Vérifier si le client est disponible
    if (!currentClient) {
      console.error('Client non disponible pour enregistrer les identifiants');
      return { success: false, message: 'Client non disponible' };
    }
    
    // Récupérer l'identifiant à enregistrer
    const credential = message.credential;
    if (!credential || !credential.username || !credential.password) {
      console.error('Identifiants incomplets');
      return { success: false, message: 'Identifiants incomplets' };
    }
    
    // Créer un objet Password
    const newPassword: Password = {
      username: credential.username,
      password: credential.password,
      url: credential.url || null,
      description: credential.description || null,
      otp: credential.otp || null,
      app_id: null
    };
    
    // Récupérer l'UUID du client
    if (!currentClient.id.id) {
      console.error('UUID du client manquant');
      return { success: false, message: 'UUID du client manquant' };
    }
    
    // Appeler l'API pour créer le mot de passe
    const result = await create_pass(currentClient.id.id, newPassword, currentClient.c);
    
    if (result.error) {
      console.error('Erreur lors de la création du mot de passe:', result.error);
      return { success: false, message: result.error };
    }
    
    // Mettre à jour la liste des mots de passe en cache
    const passwordsResult = await getSecurePasswords();
    if (passwordsResult) {
      const updatedPasswords = [...passwordsResult, newPassword];
      await storePasswordsSecurely(updatedPasswords);
    }
    
    logInfo('Identifiants enregistrés avec succès');
    return { success: true };
  } catch (error) {
    logError('Erreur lors de l\'enregistrement des identifiants:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}