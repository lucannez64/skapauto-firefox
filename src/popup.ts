// Script pour le popup de l'extension
import { type Password } from './lib/decoder';

// Système de traduction
type Language = 'fr' | 'en';
type TranslationKey = 
  | 'appTitle'
  | 'clientFile'
  | 'selectClientFile'
  | 'authenticate'
  | 'getPasswords'
  | 'actions'
  | 'refreshPasswords'
  | 'classifyFields'
  | 'classificationResults'
  | 'usernameFields'
  | 'passwordFields'
  | 'emailFields'
  | 'unclassifiedFields'
  | 'checkingSecureClient'
  | 'activeSessionRecovered'
  | 'pleaseLoadClientFile'
  | 'clientLoadedSuccess'
  | 'fileType'
  | 'fileSize'
  | 'unknown'
  | 'copyPassword'
  | 'fillCredentials'
  | 'noPasswordsFound'
  | 'noPasswordsFoundDesc'
  | 'classificationComplete'
  | 'usernameFieldsFound'
  | 'passwordFieldsFound'
  | 'emailFieldsFound'
  | 'unclassifiedFieldsFound'
  | 'selectingClientFile'
  | 'errorInjecting'
  | 'unknownError'
  | 'bytes'
  | 'kb'
  | 'mb'
  | 'authenticating'
  | 'authSuccess'
  | 'authFailure'
  | 'retrievingPasswords'
  | 'passwordsRetrieved'
  | 'passwordsRetrievalFailed'
  | 'noPasswordsAvailable'
  | 'unknownSite'
  | 'unknownUser'
  | 'copied'
  | 'passwordCopied'
  | 'errorCopying'
  | 'fill';

// Traductions
const translations: Record<Language, Record<TranslationKey, string>> = {
  fr: {
    appTitle: 'Skap',
    clientFile: 'Fichier Client',
    selectClientFile: 'Sélectionner un fichier client',
    authenticate: 'S\'authentifier',
    getPasswords: 'Récupérer les Mots de Passe',
    actions: 'Actions',
    refreshPasswords: 'Rafraîchir les mots de passe',
    classifyFields: 'Classifier les champs sur cette page',
    classificationResults: 'Résultats de classification',
    usernameFields: 'Champs de nom d\'utilisateur',
    passwordFields: 'Champs de mot de passe',
    emailFields: 'Champs d\'email',
    unclassifiedFields: 'Champs non classifiés',
    checkingSecureClient: 'Vérification du client sécurisé...',
    activeSessionRecovered: 'Session active récupérée',
    pleaseLoadClientFile: 'Veuillez charger votre fichier client',
    clientLoadedSuccess: 'Client chargé avec succès',
    fileType: 'Type',
    fileSize: 'Taille',
    unknown: 'inconnu',
    copyPassword: 'Copier',
    fillCredentials: 'Remplir les champs',
    noPasswordsFound: 'Aucun mot de passe trouvé',
    noPasswordsFoundDesc: 'Aucun mot de passe n\'a été trouvé pour ce site.',
    classificationComplete: 'Classification terminée',
    usernameFieldsFound: 'champ(s) de nom d\'utilisateur trouvé(s)',
    passwordFieldsFound: 'champ(s) de mot de passe trouvé(s)',
    emailFieldsFound: 'champ(s) d\'email trouvé(s)',
    unclassifiedFieldsFound: 'champ(s) non classifié(s)',
    selectingClientFile: 'Sélection du fichier client...',
    errorInjecting: 'Erreur lors de l\'injection du sélecteur de fichier:',
    unknownError: 'Erreur inconnue',
    bytes: 'octets',
    kb: 'Ko',
    mb: 'Mo',
    authenticating: 'Authentification en cours...',
    authSuccess: 'Authentification réussie',
    authFailure: 'Échec de l\'authentification:',
    retrievingPasswords: 'Récupération des mots de passe...',
    passwordsRetrieved: 'Mots de passe récupérés avec succès',
    passwordsRetrievalFailed: 'Échec de la récupération des mots de passe:',
    noPasswordsAvailable: 'Aucun mot de passe disponible',
    unknownSite: 'Site inconnu',
    unknownUser: 'Utilisateur inconnu',
    copied: 'Copié!',
    passwordCopied: 'Mot de passe copié dans le presse-papiers',
    errorCopying: 'Erreur lors de la copie du mot de passe',
    fill: 'Remplir'
  },
  en: {
    appTitle: 'Skap',
    clientFile: 'Client File',
    selectClientFile: 'Select client file',
    authenticate: 'Authenticate',
    getPasswords: 'Get Passwords',
    actions: 'Actions',
    refreshPasswords: 'Refresh passwords',
    classifyFields: 'Classify fields on this page',
    classificationResults: 'Classification Results',
    usernameFields: 'Username fields',
    passwordFields: 'Password fields',
    emailFields: 'Email fields',
    unclassifiedFields: 'Unclassified fields',
    checkingSecureClient: 'Checking secure client...',
    activeSessionRecovered: 'Active session recovered',
    pleaseLoadClientFile: 'Please load your client file',
    clientLoadedSuccess: 'Client loaded successfully',
    fileType: 'Type',
    fileSize: 'Size',
    unknown: 'unknown',
    copyPassword: 'Copy',
    fillCredentials: 'Fill credentials',
    noPasswordsFound: 'No passwords found',
    noPasswordsFoundDesc: 'No passwords were found for this site.',
    classificationComplete: 'Classification complete',
    usernameFieldsFound: 'username field(s) found',
    passwordFieldsFound: 'password field(s) found',
    emailFieldsFound: 'email field(s) found',
    unclassifiedFieldsFound: 'unclassified field(s)',
    selectingClientFile: 'Selecting client file...',
    errorInjecting: 'Error injecting file selector:',
    unknownError: 'Unknown error',
    bytes: 'bytes',
    kb: 'KB',
    mb: 'MB',
    authenticating: 'Authenticating...',
    authSuccess: 'Authentication successful',
    authFailure: 'Authentication failed:',
    retrievingPasswords: 'Retrieving passwords...',
    passwordsRetrieved: 'Passwords retrieved successfully',
    passwordsRetrievalFailed: 'Failed to retrieve passwords:',
    noPasswordsAvailable: 'No passwords available',
    unknownSite: 'Unknown site',
    unknownUser: 'Unknown user',
    copied: 'Copied!',
    passwordCopied: 'Password copied to clipboard',
    errorCopying: 'Error copying password',
    fill: 'Fill'
  }
};

// Langue par défaut
let currentLanguage: Language = 'fr';

// Fonction pour traduire une clé
function t(key: TranslationKey): string {
  return translations[currentLanguage][key];
}

// Fonction pour mettre à jour toutes les traductions dans le DOM
function updateTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  const statusMessageKey = statusMessage.getAttribute('data-i18n') as TranslationKey;
  if (statusMessageKey && translations[currentLanguage][statusMessageKey]) {
    statusMessage.textContent = translations[currentLanguage][statusMessageKey];
  }
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n') as TranslationKey;
    if (key && translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });
}

// Fonction pour changer de langue
function setLanguage(lang: Language) {
  currentLanguage = lang;
  
  // Mettre à jour les boutons de langue
  const frBtn = document.getElementById('fr-btn') as HTMLButtonElement;
  const enBtn = document.getElementById('en-btn') as HTMLButtonElement;
  
  if (lang === 'fr') {
    frBtn.classList.add('active');
    enBtn.classList.remove('active');
  } else {
    frBtn.classList.remove('active');
    enBtn.classList.add('active');
  }
  
  // Mettre à jour les traductions
  updateTranslations();
  
  // Sauvegarder la préférence de langue
  browser.storage.local.set({ language: lang });
}

// Éléments du DOM
const authBtn = document.getElementById('auth-btn') as HTMLButtonElement;
const getPasswordsBtn = document.getElementById('get-passwords-btn') as HTMLButtonElement;
const statusMessage = document.getElementById('status-message') as HTMLDivElement;
const passwordList = document.getElementById('password-list') as HTMLDivElement;
const selectFileBtn = document.getElementById('select-file-btn') as HTMLButtonElement;
const fileName = document.getElementById('file-name') as HTMLDivElement;
const frBtn = document.getElementById('fr-btn') as HTMLButtonElement;
const enBtn = document.getElementById('en-btn') as HTMLButtonElement;

// Variables d'état
let clientLoaded = false;
let authenticated = false;

// Désactiver les boutons au démarrage
authBtn.disabled = true;
getPasswordsBtn.disabled = true;

// Gestionnaires d'événements pour les boutons de langue
frBtn.addEventListener('click', () => setLanguage('fr'));
enBtn.addEventListener('click', () => setLanguage('en'));

// Charger la préférence de langue
browser.storage.local.get('language').then((result) => {
  if (result.language) {
    setLanguage(result.language as Language);
  } else {
    // Détecter la langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'fr') {
      setLanguage('fr');
    } else {
      setLanguage('en');
    }
  }
});

// Fonction pour vérifier si un client sécurisé est disponible
function checkSecureClient() {
  showStatus(t('checkingSecureClient'), 'info');
  
  browser.runtime.sendMessage(
    { action: 'checkSecureClient' }).then(
    (response) => {
      if (response && response.success) {
        // Un client sécurisé est disponible, on peut activer les fonctionnalités
        clientLoaded = true;
        authenticated = true;
        authBtn.disabled = false;
        getPasswordsBtn.disabled = false;
        showStatus(t('activeSessionRecovered'), 'success');
        
        // Vérifier si des mots de passe sécurisés sont disponibles
        checkSecurePasswords();
      } else {
        // Pas de client sécurisé, l'utilisateur doit charger son fichier client
        showStatus(t('pleaseLoadClientFile'), 'info');
      }
    }
  );
}

// Fonction pour vérifier si des mots de passe sécurisés sont disponibles
function checkSecurePasswords() {
  browser.runtime.sendMessage(
    { action: 'checkSecurePasswords' })
    .then(
    (response) => {
      if (response && response.success && response.passwords) {
        // Des mots de passe sécurisés sont disponibles, les afficher
        displayPasswords(response.passwords);
      }
    }
  );
}

// Vérifier si un client sécurisé est disponible au démarrage
document.addEventListener('DOMContentLoaded', () => {
  checkSecureClient();
  updateTranslations();
});

// Écouter les messages du background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'clientLoaded') {
    // Mettre à jour l'interface utilisateur
    clientLoaded = true;
    authBtn.disabled = false;
    
    // Afficher les informations du fichier
    if (message.fileMetadata) {
      fileName.textContent = message.fileMetadata.name;
      fileName.style.display = 'block';
      
      // Afficher des informations sur le fichier
      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      fileInfo.textContent = `${t('fileType')}: ${message.fileMetadata.type || t('unknown')}, ${t('fileSize')}: ${formatFileSize(message.fileMetadata.size)}`;
      
      // Supprimer l'info précédente si elle existe
      const existingInfo = fileName.querySelector('.file-info');
      if (existingInfo) {
        fileName.removeChild(existingInfo);
      }
      
      fileName.appendChild(fileInfo);
    }
    
    showStatus(t('clientLoadedSuccess'), 'success');
  }
});

// Gestionnaire pour le bouton de sélection de fichier
selectFileBtn.addEventListener('click', async () => {
  try {
    // Obtenir l'onglet actif
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0].id) {
      throw new Error("Aucun onglet actif trouvé");
    }
    
    await browser.tabs.sendMessage(tabs[0].id, {action: 'injectFile'})
    // Afficher un message de chargement
    showStatus(t('selectingClientFile'), 'info');
  } catch (error) {
    console.error(t('errorInjecting'), error);
    showStatus(`${t('errorInjecting')} ${error instanceof Error ? error.message : t('unknownError')}`, 'error');
  }
});



/**
 * Formate la taille du fichier en unités lisibles
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' ' + t('bytes');
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' ' + t('kb');
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + ' ' + t('mb');
  }
}

// Gestionnaire d'événement pour le bouton d'authentification
authBtn.addEventListener('click', () => {
  // Afficher un message de chargement
  showStatus(t('authenticating'), 'info');

  // Envoyer la demande d'authentification au background script
  browser.runtime.sendMessage(
    { action: 'authenticate' }).then(
    (response) => {
      if (response && response.success) {
        authenticated = true;
        getPasswordsBtn.disabled = false;
        showStatus(t('authSuccess'), 'success');
      } else {
        showStatus(`${t('authFailure')} ${response ? response.message : t('unknownError')}`, 'error');
      }
    }
  );
});

// Gestionnaire d'événement pour le bouton de récupération des mots de passe
getPasswordsBtn.addEventListener('click', () => {
  
  // Afficher un message de chargement
  showStatus(t('retrievingPasswords'), 'info');
  
  // Envoyer la demande de récupération des mots de passe au background script
  browser.runtime.sendMessage(
    { action: 'getPasswords' }).then(
    (response) => {
      if (response && response.success) {
        showStatus(t('passwordsRetrieved'), 'success');
        displayPasswords(response.passwords);
      } else {
        showStatus(`${t('passwordsRetrievalFailed')} ${response ? response.message : t('unknownError')}`, 'error');
      }
    }
  );
});

// Fonction pour afficher un message de statut
function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  // Définir l'icône en fonction du type de message
  let iconClass = '';
  switch (type) {
    case 'success':
      iconClass = 'fas fa-check-circle';
      break;
    case 'error':
      iconClass = 'fas fa-exclamation-circle';
      break;
    case 'info':
    default:
      iconClass = 'fas fa-info-circle';
      break;
  }
  
  // Créer les éléments DOM de manière sécurisée
  const createStatusContent = () => {
    // Vider d'abord le contenu existant
    while (statusMessage.firstChild) {
      statusMessage.removeChild(statusMessage.firstChild);
    }
    
    // Créer l'icône
    const iconElement = document.createElement('i');
    iconElement.className = iconClass;
    
    // Ajouter l'icône et le texte
    statusMessage.appendChild(iconElement);
    statusMessage.appendChild(document.createTextNode(' ' + message));
    
    // Mettre à jour la classe du message
    statusMessage.className = `status ${type}`;
  };
  
  // Si un message est déjà affiché, le faire disparaître d'abord
  if (statusMessage.style.display === 'flex') {
    statusMessage.style.opacity = '0';
    statusMessage.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      // Mettre à jour le contenu et la classe du message
      createStatusContent();
      
      // Afficher le message avec une animation
      statusMessage.style.display = 'flex';
      statusMessage.style.opacity = '0';
      statusMessage.style.transform = 'translateY(10px)';
      
      // Animation d'apparition
      setTimeout(() => {
        statusMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        statusMessage.style.opacity = '1';
        statusMessage.style.transform = 'translateY(0)';
      }, 10);
    }, 300);
  } else {
    // Mettre à jour le contenu et la classe du message
    createStatusContent();
    
    // Afficher le message avec une animation
    statusMessage.style.display = 'flex';
    statusMessage.style.opacity = '0';
    statusMessage.style.transform = 'translateY(10px)';
    
    // Animation d'apparition
    setTimeout(() => {
      statusMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      statusMessage.style.opacity = '1';
      statusMessage.style.transform = 'translateY(0)';
    }, 10);
  }
  
  // Masquer automatiquement les messages de succès après 5 secondes
  if (type === 'success') {
    setTimeout(() => {
      // Animation de disparition
      statusMessage.style.opacity = '0';
      statusMessage.style.transform = 'translateY(-10px)';
      
      // Masquer complètement après la fin de l'animation
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 300);
    }, 5000);
  }
}

/**
 * Affiche la liste des mots de passe
 * @param passwords Liste des mots de passe à afficher
 */
function displayPasswords(passwords: Password[]): void {
  // Vider la liste des mots de passe avec une animation de sortie
  if (passwordList.style.display === 'block') {
    passwordList.style.opacity = '0';
    passwordList.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      // Vider le contenu de manière sécurisée
      while (passwordList.firstChild) {
        passwordList.removeChild(passwordList.firstChild);
      }
      renderPasswordList(passwords);
    }, 300);
  } else {
    // Vider le contenu de manière sécurisée
    while (passwordList.firstChild) {
      passwordList.removeChild(passwordList.firstChild);
    }
    renderPasswordList(passwords);
  }
}

// Fonction pour rendre la liste des mots de passe
function renderPasswordList(passwords: Password[]): void {
  // Si aucun mot de passe n'est disponible, afficher un message
  if (!passwords || passwords.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-key';
    emptyState.appendChild(icon);
    
    const message = document.createElement('p');
    message.textContent = t('noPasswordsAvailable');
    emptyState.appendChild(message);
    
    passwordList.appendChild(emptyState);
    
    // Afficher avec animation
    passwordList.style.display = 'block';
    passwordList.style.opacity = '0';
    passwordList.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      passwordList.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      passwordList.style.opacity = '1';
      passwordList.style.transform = 'translateY(0)';
    }, 10);
    
    return;
  }
  
  // Trier les mots de passe par nom de service
  passwords.sort((a, b) => {
    const urlA = a.url?.toLowerCase() || '';
    const urlB = b.url?.toLowerCase() || '';
    return urlA.localeCompare(urlB);
  });
  
  // Créer un élément pour chaque mot de passe
  passwords.forEach((password, index) => {
    const passwordItem = document.createElement('div');
    passwordItem.className = 'password-item';
    passwordItem.style.opacity = '0';
    passwordItem.style.transform = 'translateY(10px)';
    
    // Obtenir l'URL du favicon
    const faviconUrl = getFaviconUrl(password.url || '');
    
    // Créer l'élément pour le nom du service
    const site = document.createElement('div');
    site.className = 'site';
    
    // Ajouter le favicon
    const favicon = document.createElement('img');
    favicon.src = faviconUrl;
    favicon.width = 16;
    favicon.height = 16;
    favicon.style.marginRight = '10px';
    favicon.onerror = handleImageError;
    site.appendChild(favicon);
    
    // Ajouter le nom du service
    const siteName = document.createTextNode(password.url || t('unknownSite'));
    site.appendChild(siteName);
    passwordItem.appendChild(site);
    
    // Créer l'élément pour le nom d'utilisateur
    const username = document.createElement('div');
    username.className = 'username';
    
    const userIcon = document.createElement('i');
    userIcon.className = 'fas fa-user';
    username.appendChild(userIcon);
    
    const usernameText = document.createTextNode(password.username || t('unknownUser'));
    username.appendChild(usernameText);
    passwordItem.appendChild(username);
    
    // Créer les boutons d'action
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    // Bouton pour copier le mot de passe
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    
    // Créer l'icône et le texte de manière sécurisée
    const copyIcon = document.createElement('i');
    copyIcon.className = 'fas fa-copy';
    copyBtn.appendChild(copyIcon);
    copyBtn.appendChild(document.createTextNode(' ' + t('copyPassword')));
    
    copyBtn.addEventListener('click', () => {
      // Copier le mot de passe dans le presse-papiers
      navigator.clipboard.writeText(password.password || '')
        .then(() => {
          // Effet de pulsation pour indiquer le succès
          copyBtn.style.animation = 'pulse 0.3s ease';
          
          // Sauvegarder le contenu original
          const originalContent = copyBtn.cloneNode(true);
          
          // Vider le contenu du bouton
          while (copyBtn.firstChild) {
            copyBtn.removeChild(copyBtn.firstChild);
          }
          
          // Créer la nouvelle icône et le texte
          const checkIcon = document.createElement('i');
          checkIcon.className = 'fas fa-check';
          copyBtn.appendChild(checkIcon);
          copyBtn.appendChild(document.createTextNode(' ' + t('copied')));
          
          setTimeout(() => {
            copyBtn.style.animation = '';
            
            // Vider le contenu du bouton
            while (copyBtn.firstChild) {
              copyBtn.removeChild(copyBtn.firstChild);
            }
            
            // Restaurer le contenu original
            Array.from(originalContent.childNodes).forEach(node => {
              copyBtn.appendChild(node.cloneNode(true));
            });
          }, 2000);
          
          showStatus(t('passwordCopied'), 'success');
        })
        .catch(err => {
          console.error(t('errorCopying'), err);
          showStatus(t('errorCopying'), 'error');
        });
    });
    actions.appendChild(copyBtn);
    
    passwordItem.appendChild(actions);
    passwordList.appendChild(passwordItem);
    
    // Ajouter une animation d'apparition progressive
    setTimeout(() => {
      passwordItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      passwordItem.style.opacity = '1';
      passwordItem.style.transform = 'translateY(0)';
    }, 50 + index * 50); // Délai progressif pour chaque élément
  });
  
  // Afficher la liste avec animation
  passwordList.style.display = 'block';
  passwordList.style.opacity = '0';
  passwordList.style.transform = 'translateY(10px)';
  
  setTimeout(() => {
    passwordList.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    passwordList.style.opacity = '1';
    passwordList.style.transform = 'translateY(0)';
  }, 10);
}

// Fonction pour obtenir l'URL de l'icône d'un site web
function getFaviconUrl(domain: string): string {
  // Nettoyer l'URL pour extraire le domaine
  let cleanDomain = domain;
  
  // Supprimer le protocole s'il existe
  if (cleanDomain.includes('://')) {
    cleanDomain = cleanDomain.split('://')[1];
  }
  
  // Supprimer le chemin s'il existe
  if (cleanDomain.includes('/')) {
    cleanDomain = cleanDomain.split('/')[0];
  }
  
  // Utiliser Google Favicon service pour récupérer l'icône
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=32`;
}

// Fonction pour gérer les erreurs de chargement d'image
function handleImageError(this: HTMLImageElement, ev: Event | string): void {
  // En cas d'erreur de chargement, utiliser une icône par défaut
  this.style.display = 'none';
  const site = this.parentElement;
  if (site) {
    const defaultIcon = document.createElement('i');
    defaultIcon.className = 'fas fa-globe';
    defaultIcon.style.marginRight = '10px';
    defaultIcon.style.color = 'var(--primary-color)';
    site.insertBefore(defaultIcon, site.firstChild);
  }
}

// Fonction pour classifier les champs sur la page active
async function classifyFields() {
  try {
    // Afficher un indicateur de chargement
    const classifyBtn = document.getElementById('classifyFieldsBtn') as HTMLButtonElement;
    
    // Sauvegarder le contenu original du bouton
    const originalContent = classifyBtn.cloneNode(true);
    
    // Vider le contenu du bouton de manière sécurisée
    while (classifyBtn.firstChild) {
      classifyBtn.removeChild(classifyBtn.firstChild);
    }
    
    // Créer l'icône de chargement
    const spinnerIcon = document.createElement('i');
    spinnerIcon.className = 'fas fa-spinner fa-spin';
    classifyBtn.appendChild(spinnerIcon);
    classifyBtn.appendChild(document.createTextNode(' Classification en cours...'));
    classifyBtn.disabled = true;
    
    // Ajouter un effet de pulsation au bouton
    classifyBtn.style.animation = 'pulse 1s infinite';
    
    // Masquer les résultats précédents avec une animation
    const resultsElement = document.getElementById('classificationResults')!;
    if (!resultsElement.classList.contains('hidden')) {
      resultsElement.style.opacity = '0';
      resultsElement.style.transform = 'translateY(-10px)';
      
      // Attendre la fin de l'animation avant de masquer
      await new Promise(resolve => setTimeout(resolve, 300));
      resultsElement.classList.add('hidden');
    }
    
    // Envoyer un message au background script pour classifier les champs
    const response = await new Promise<any>((resolve, reject) => {
      browser.runtime.sendMessage({ action: 'classifyFields' }).then((response) => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (!response || !response.success) {
      throw new Error(response?.message || 'Échec de la classification des champs');
    }
    
    // Arrêter l'animation de pulsation
    classifyBtn.style.animation = '';
    
    // Afficher les résultats
    const fields = response.fields;
    document.getElementById('usernameCount')!.textContent = fields.username.length.toString();
    document.getElementById('passwordCount')!.textContent = fields.password.length.toString();
    document.getElementById('emailCount')!.textContent = fields.email.length.toString();
    document.getElementById('unknownCount')!.textContent = fields.unknown.length.toString();
    
    // Afficher la section des résultats avec une animation
    resultsElement.classList.remove('hidden');
    resultsElement.style.opacity = '0';
    resultsElement.style.transform = 'translateY(10px)';
    
    // Déclencher l'animation
    setTimeout(() => {
      resultsElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      resultsElement.style.opacity = '1';
      resultsElement.style.transform = 'translateY(0)';
    }, 10);
    
    // Afficher un message de succès
    showStatus(`Classification terminée: ${fields.username.length + fields.password.length + fields.email.length} champs identifiés`, 'success');
    
    // Restaurer le bouton avec une animation
    // Vider le contenu du bouton
    while (classifyBtn.firstChild) {
      classifyBtn.removeChild(classifyBtn.firstChild);
    }
    
    // Restaurer le contenu original
    Array.from(originalContent.childNodes).forEach(node => {
      classifyBtn.appendChild(node.cloneNode(true));
    });
    
    classifyBtn.disabled = false;
    classifyBtn.style.animation = 'pulse 0.3s ease';
    setTimeout(() => {
      classifyBtn.style.animation = '';
    }, 300);
  } catch (error) {
    console.error('Erreur lors de la classification des champs:', error);
    showStatus(`Erreur: ${error instanceof Error ? error.message : String(error)}`, 'error');
    
    // Restaurer le bouton en cas d'erreur
    const classifyBtn = document.getElementById('classifyFieldsBtn') as HTMLButtonElement;
    
    // Vider le contenu du bouton
    while (classifyBtn.firstChild) {
      classifyBtn.removeChild(classifyBtn.firstChild);
    }
    
    // Créer l'icône
    const icon = document.createElement('i');
    icon.className = 'fas fa-tags';
    classifyBtn.appendChild(icon);
    classifyBtn.appendChild(document.createTextNode(' Classifier les champs sur cette page'));
    
    classifyBtn.disabled = false;
    classifyBtn.style.animation = '';
  }
}

// Fonction pour rafraîchir les mots de passe
async function refreshPasswords() {
  try {
    // Afficher un indicateur de chargement
    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    
    // Sauvegarder le contenu original du bouton
    const originalContent = refreshBtn.cloneNode(true);
    
    // Vider le contenu du bouton
    while (refreshBtn.firstChild) {
      refreshBtn.removeChild(refreshBtn.firstChild);
    }
    
    // Créer l'icône de chargement et le texte
    const spinnerIcon = document.createElement('i');
    spinnerIcon.className = 'fas fa-spinner fa-spin';
    refreshBtn.appendChild(spinnerIcon);
    refreshBtn.appendChild(document.createTextNode(' Rafraîchissement...'));
    
    refreshBtn.disabled = true;
    
    // Ajouter un effet de pulsation au bouton
    refreshBtn.style.animation = 'pulse 1s infinite';
    
    // Envoyer un message au background script pour récupérer les mots de passe
    const response = await new Promise<any>((resolve, reject) => {
      browser.runtime.sendMessage({ action: 'refreshPasswords' }).then((response) => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    // Arrêter l'animation de pulsation
    refreshBtn.style.animation = '';
    
    if (!response || !response.success) {
      throw new Error(response?.message || 'Échec du rafraîchissement des mots de passe');
    }
    
    // Afficher les mots de passe
    if (response.passwords) {
      displayPasswords(response.passwords);
      showStatus(`${response.passwords.length} mot(s) de passe récupéré(s)`, 'success');
    } else {
      showStatus('Aucun mot de passe disponible', 'info');
    }
    
    // Restaurer le bouton avec une animation
    // Vider le contenu du bouton
    while (refreshBtn.firstChild) {
      refreshBtn.removeChild(refreshBtn.firstChild);
    }
    
    // Restaurer le contenu original
    Array.from(originalContent.childNodes).forEach(node => {
      refreshBtn.appendChild(node.cloneNode(true));
    });
    
    refreshBtn.disabled = false;
    refreshBtn.style.animation = 'pulse 0.3s ease';
    setTimeout(() => {
      refreshBtn.style.animation = '';
    }, 300);
  } catch (error) {
    console.error('Erreur lors du rafraîchissement des mots de passe:', error);
    showStatus(`Erreur: ${error instanceof Error ? error.message : String(error)}`, 'error');
    
    // Restaurer le bouton en cas d'erreur
    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    
    // Vider le contenu du bouton
    while (refreshBtn.firstChild) {
      refreshBtn.removeChild(refreshBtn.firstChild);
    }
    
    // Créer l'icône et le texte
    const syncIcon = document.createElement('i');
    syncIcon.className = 'fas fa-sync-alt';
    refreshBtn.appendChild(syncIcon);
    refreshBtn.appendChild(document.createTextNode(' Rafraîchir les mots de passe'));
    
    refreshBtn.disabled = false;
    refreshBtn.style.animation = '';
  }
}

// Ajouter des écouteurs d'événements pour les boutons
document.addEventListener('DOMContentLoaded', () => {
  // Écouteur pour le bouton d'authentification
  authBtn.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'authenticate' }).then((response) => {
      if (response && response.success) {
        authenticated = true;
        getPasswordsBtn.disabled = false;
        showStatus('Authentification réussie', 'success');
      } else {
        showStatus('Échec de l\'authentification', 'error');
      }
    });
  });
  
  // Écouteur pour le bouton de récupération des mots de passe
  getPasswordsBtn.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'getPasswords' }).then((response) => {
      if (response && response.success && response.passwords) {
        displayPasswords(response.passwords);
        showStatus(`${response.passwords.length} mot(s) de passe récupéré(s)`, 'success');
      } else {
        showStatus('Échec de la récupération des mots de passe', 'error');
      }
    });
  });
  
  // Écouteur pour le bouton de classification
  const classifyBtn = document.getElementById('classifyFieldsBtn');
  if (classifyBtn) {
    classifyBtn.addEventListener('click', classifyFields);
  }
  
  // Écouteur pour le bouton de rafraîchissement
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshPasswords);
  }
});

// Exporter une fonction vide pour que le bundler ne se plaigne pas
export {}; 