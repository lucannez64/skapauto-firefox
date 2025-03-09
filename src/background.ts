// Service worker pour l'extension Firefox
import { auth, get_all, create_pass, loadClientFromFile } from './lib/client';
import { type ClientEx, type Uuid, type Password } from './lib/decoder';

// Importer la bibliothèque pour générer des codes TOTP
import * as OTPAuth from "otpauth";

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

// Fonction pour exporter le token de session depuis le module client
export function setSessionToken(token: string) {
  // Stocker le token dans le stockage local
  browser.storage.local.set({ 'sessionToken': token }).then(() => {
    console.log('Token de session sauvegardé dans le stockage local');
  });
}

// Fonction pour restaurer le token de session
export function getSessionToken(): Promise<string | null> {
  return new Promise((resolve) => {
    browser.storage.local.get(['sessionToken']).then((result: any) => {
      resolve(result.sessionToken || null);
    });
  });
}

// Fonction pour stocker le client de manière sécurisée avec une expiration d'une heure
function storeClientSecurely(client: ClientEx): Promise<void> {
  const expirationTime = Date.now() + CLIENT_EXPIRATION_TIME;
  
  return new Promise((resolve) => {
    // Utiliser browser.storage.local pour Firefox (pas de storage.session dans Firefox)
    browser.storage.local.set({
      'secureClient': {
        client: client,
        expirationTime: expirationTime
      }
    }).then(resolve);
  });
}

// Fonction pour stocker les mots de passe de manière sécurisée avec une expiration d'une heure
function storePasswordsSecurely(passwords: Password[]): Promise<void> {
  const expirationTime = Date.now() + CLIENT_EXPIRATION_TIME;
  
  return new Promise((resolve) => {
    // Utiliser browser.storage.local pour Firefox
    browser.storage.local.set({
      'securePasswords': {
        passwords: passwords,
        expirationTime: expirationTime
      }
    }).then(() => {
      console.log('Mots de passe stockés de manière sécurisée avec expiration dans 1 heure');
      resolve();
    });
  });
}

// Fonction pour récupérer le client stocké s'il est toujours valide
async function getSecureClient(): Promise<ClientEx | null> {
  return new Promise((resolve) => {
    browser.storage.local.get(['secureClient']).then((result: any) => {
      if (result.secureClient && result.secureClient.expirationTime > Date.now()) {
        console.log('Client récupéré du stockage sécurisé');
        resolve(result.secureClient.client);
      } else {
        if (result.secureClient) {
          console.log('Client expiré, suppression du stockage');
          browser.storage.local.remove(['secureClient']);
        }
        resolve(null);
      }
    });
  });
}

// Fonction pour récupérer les mots de passe stockés s'ils sont toujours valides
async function getSecurePasswords(): Promise<Password[] | null> {
  return new Promise((resolve) => {
    browser.storage.local.get(['securePasswords']).then((result: any) => {
      if (result.securePasswords && result.securePasswords.expirationTime > Date.now()) {
        console.log('Mots de passe récupérés du stockage sécurisé');
        resolve(result.securePasswords.passwords);
      } else {
        if (result.securePasswords) {
          console.log('Mots de passe expirés, suppression du stockage');
          browser.storage.local.remove(['securePasswords']);
        }
        resolve(null);
      }
    });
  });
}

// Gérer les messages de l'extension
browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  console.log('Message reçu dans le background:', message);
  
  // Traiter les différents types de messages
  switch (message.action) {
    case 'fileSelected':
      // Traiter directement le fichier sélectionné
      handleFileSelected(message).then(sendResponse);
      return true; // Indique que sendResponse sera appelé de manière asynchrone
      
    case 'checkSecureClient':
      // Vérifier si un client sécurisé est disponible
      getSecureClient()
        .then((client) => {
          if (client) {
            currentClient = client;
            return { success: true };
          } else {
            return { success: false };
          }
        })
        .catch((error) => {
          console.error('Erreur lors de la vérification du client sécurisé:', error);
          return { success: false, message: 'Erreur lors de la vérification du client sécurisé' };
        })
        .then(sendResponse);
      return true; // Indique que sendResponse sera appelé de manière asynchrone
      
    case 'authenticate':
      // Authentifier le client
      if (currentClient && currentClient.id.id) {
        console.log(currentClient);
        auth(currentClient.id.id!, currentClient.c)
          .then(result => {
            if (result.error) {
              return { success: false, message: result.error };
            } else {
              // Mettre à jour le client avec la clé secrète
              if (currentClient && result.client) {
                currentClient.c = result.client;
                // Stocker le client mis à jour dans le stockage local
                browser.storage.local.set({ 'currentClient': currentClient }).then(() => {
                  console.log('Client authentifié sauvegardé dans le stockage local');
                });
                
                // Stocker le client de manière sécurisée avec expiration
                storeClientSecurely(currentClient)
                  .then(() => {
                    console.log('Client authentifié stocké de manière sécurisée');
                  });
              }
              return { success: true, message: 'Authentification réussie' };
            }
          })
          .catch(error => {
            return { success: false, message: error.toString() };
          })
          .then(sendResponse);
        return true; // Indique que la réponse sera envoyée de manière asynchrone
      } else {
        sendResponse({ success: false, message: 'Client ou UUID manquant' });
      }
      break;
      
    case 'getPasswords':
      // D'abord vérifier si nous avons des mots de passe en cache
      getSecurePasswords().then(passwords => {
        let response: PasswordResponse;
        
        if (passwords) {
          // Utiliser les mots de passe en cache
          cachedPasswords = passwords;
          console.log('Utilisation des mots de passe en cache');
          response = { success: true, passwords: passwords };
          sendResponse(response);
        } else if (currentClient && currentClient.id.id) {
          // Récupérer tous les mots de passe depuis le serveur
          get_all(currentClient.id.id!, currentClient.c)
            .then(result => {
              if (result.error) {
                response = { success: false, message: result.error, passwords: undefined };
              } else {
                // Stocker les mots de passe en cache
                const passwords = result.passwords;
                if (passwords && passwords.length > 0) {
                  cachedPasswords = passwords;
                  // Stocker les mots de passe de manière sécurisée
                  storePasswordsSecurely(passwords)
                    .then(() => {
                      console.log('Mots de passe stockés de manière sécurisée');
                    });
                }
                console.log('Mots de passe récupérés:', passwords);
                response = { 
                  success: true, 
                  passwords: passwords
                };
              }
              sendResponse(response);
            })
            .catch(error => {
              response = { success: false, message: error.toString(), passwords: undefined };
              sendResponse(response);
            });
        } else {
          response = { success: false, message: 'Client ou UUID manquant', passwords: undefined };
          sendResponse(response);
        }
      });
      return true; // Indique que la réponse sera envoyée de manière asynchrone
      
    case 'refreshPasswords':
    let response: PasswordResponse;
      // Récupérer tous les mots de passe depuis le serveur
      if (currentClient && currentClient.id.id) {
        get_all(currentClient.id.id!, currentClient.c)
          .then(result => {
            if (result.error) {
              response = { success: false, message: result.error, passwords: undefined };
              sendResponse(response);
            } else {
              // Stocker les mots de passe en cache
              const passwords = result.passwords;
              if (passwords && passwords.length > 0) {
                cachedPasswords = passwords;
                // Stocker les mots de passe de manière sécurisée
                return storePasswordsSecurely(passwords)
                  .then(() => {
                    console.log('Mots de passe récupérés et stockés de manière sécurisée');
                    response = { success: true, passwords: passwords };
                    sendResponse(response);
                  });
              }
              response = { success: true, passwords: passwords };
              sendResponse(response);
            }
          })
          .catch(error => {
            response = { success: false, message: error.toString() };
            sendResponse(response);
          })
          .then(sendResponse);
      } else {
        response = { success: false, message: 'Client ou UUID manquant' };
        sendResponse(response);
      }
      return true; // Indique que la réponse sera envoyée de manière asynchrone
    
    case 'saveSessionToken':
      // Sauvegarder le token de session
      if (message.token) {
        setSessionToken(message.token);
        sendResponse({ success: true, message: 'Token de session sauvegardé' });
      } else {
        sendResponse({ success: false, message: 'Token de session manquant' });
      }
      break;

    case 'getSessionToken':
      // Récupérer le token de session
      getSessionToken().then((token) => {
        if (token) {
          return { success: true, token: token };
        } else {
          return { success: false, message: 'Token de session manquant' };
        }
      })
      .then(sendResponse);
      return true; // Indique que la réponse sera envoyée de manière asynchrone

    case 'checkSecurePasswords':
      // Vérifier si des mots de passe sécurisés sont disponibles
      getSecurePasswords()
        .then(passwords => {
          if (passwords && passwords.length > 0) {
            cachedPasswords = passwords;
            return { success: true, passwords: passwords };
          } else {
            return { success: false, message: 'Aucun mot de passe sécurisé disponible' };
          }
        })
        .then(sendResponse);
      return true; // Indique que la réponse sera envoyée de manière asynchrone

    case 'classifyFields':
      console.log('Demande de classification des champs');
      classifyFormFields()
        .then(fields => {
          return { success: true, fields };
        })
        .catch(error => {
          console.error('Erreur lors de la classification des champs:', error);
          return { success: false, message: error.message };
        })
        .then(sendResponse);
      return true; // Indique que la réponse sera envoyée de manière asynchrone

    case 'generateTOTP':
      // Générer un code TOTP
      if (message.params) {
        try {
          const code = generateTOTPCode(message.params);
          sendResponse({ success: true, code: code });
        } catch (error: any) {
          console.error('Erreur lors de la génération du code TOTP:', error);
          sendResponse({ success: false, message: error.toString() });
        }
      } else {
        sendResponse({ success: false, message: 'Paramètres TOTP manquants' });
      }
      break;

    case 'saveNewCredential':
      // Gère la sauvegarde d'un nouvel identifiant
      handleSaveNewCredential(message)
        .then(sendResponse);
      return true; // Indique que sendResponse sera appelé de manière asynchrone

    default:
      sendResponse({ success: false, message: 'Action non reconnue' });
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
    console.log('Client restauré depuis le stockage sécurisé');
    
    // Récupérer également les mots de passe sécurisés
    const securePasswords = await getSecurePasswords();
    if (securePasswords) {
      cachedPasswords = securePasswords;
      console.log('Mots de passe restaurés depuis le stockage sécurisé');
    }
  } else {
    // Si pas de client sécurisé, essayer le stockage local
    browser.storage.local.get(['currentClient']).then((result: any) => {
      if (result.currentClient) {
        currentClient = result.currentClient;
        console.log('Client restauré depuis le stockage local');
      }
    });
  }
  
  // Restaurer le token de session
  browser.storage.local.get(['sessionToken']).then((result: any) => {
    if (result.sessionToken) {
      console.log('Token de session restauré depuis le stockage local');
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
console.log('Service worker SkapAuto installé pour Firefox');

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
    console.log('Génération du code TOTP avec les paramètres:', params);
    
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
    console.log('Code TOTP généré:', code);
    
    return code;
  } catch (error) {
    console.error('Erreur lors de la génération du code TOTP:', error);
    throw error;
  }
}

/**
 * Traite le fichier sélectionné et charge le client
 */
async function handleFileSelected(message: any): Promise<any> {
  try {
    console.log('Traitement du fichier sélectionné:', message.fileName);
    
    // Convertir les données base64 en ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(message.fileData);
    
    // Charger le client
    const client = loadClientFromFile(arrayBuffer);
    
    if (client) {
      currentClient = client;
      
      // Stocker le client de manière sécurisée
      await storeClientSecurely(client);
      console.log('Client stocké de manière sécurisée');
      
      // Enregistrer les métadonnées du fichier pour référence
      const fileMetadata = {
        name: message.fileName || 'client.dat',
        type: message.fileType || 'application/octet-stream',
        size: message.fileSize || arrayBuffer.byteLength,
        timestamp: Date.now()
      };
      
      await browser.storage.local.set({ 'clientFileMetadata': fileMetadata });
      
      // Notifier le popup que le client a été chargé
      browser.runtime.sendMessage({
        action: 'clientLoaded',
        success: true,
        fileMetadata: fileMetadata
      });
      
      return { success: true };
    } else {
      console.error('Format de fichier client invalide');
      return { success: false, message: 'Format de fichier client invalide' };
    }
  } catch (error: unknown) {
    console.error('Erreur lors du chargement du client:', error);
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
    
    console.log('Identifiants enregistrés avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des identifiants:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
} 