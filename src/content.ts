// Script de contenu injecté dans les pages web
console.log('SkapAuto content script chargé (Bitwarden-like mode)');

// Interface pour les champs d'autofill
interface AutofillField {
  element: HTMLInputElement | HTMLTextAreaElement;
  type: "name" | "email" | "password" | "otp";
}

// Interface pour les identifiants
interface Credential {
  username: string;
  password: string;
  url: string | null;
  description: string | null;
  otp?: string | null;
  favicon?: string | null;
  service?: string | null;
}

// Interface pour les paramètres TOTP
interface TOTPParams {
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
}

// Configuration pour l'identification des champs
const siteConfig = {
  blackList: {
    form: { names: ["search"], ids: ["search"] },
    fields: { names: ["search", "q", "query"], ids: ["search", "q"] }
  },
  whiteList: {
    form: { names: ["login"], ids: ["login"] },
    fields: {
      // Noms de champs de nom d'utilisateur
      usernameNames: [
        "username",
        "current-email",
        "j_username",
        "user_name",
        "user",
        "user-name",
        "login",
        "vb_login_username",
        "name",
        "user name",
        "user id",
        "user-id",
        "userid",
        "email",
        "e-mail",
        "id",
        "form_loginname",
        "wpname",
        "mail",
        "loginid",
        "login id",
        "login_name",
        "openid_identifier",
        "authentication_email",
        "openid",
        "auth_email",
        "auth_id",
        "authentication_identifier",
        "authentication_id",
        "customer_number",
        "customernumber",
        "onlineid",
        "identifier",
        "ww_x_util",
        "loginfmt",
        "user_name",
      ],
      // IDs de champs de nom d'utilisateur
      usernameIds: [
        "username",
        "j_username",
        "user_name",
        "user",
        "user-name",
        "login",
        "vb_login_username",
        "name",
        "user-id",
        "current-email",
        "userid",
        "email",
        "e-mail",
        "id",
        "form_loginname",
        "wpname",
        "mail",
        "loginid",
        "login_name",
        "login-username",
        "openid_identifier",
        "authentication_email",
        "openid",
        "auth_email",
        "auth_id",
        "authentication_identifier",
        "authentication_id",
        "customer_number",
        "customernumber",
        "onlineid",
        "identifierId",
        "ww_x_util"
      ],
      // Noms de champs de mot de passe
      passwordNames: [
        "password",
        "pass",
        "passwd",
        "pwd",
        "j_password",
        "user_password",
        "user-password",
        "login_password",
        "login-password",
        "passwort",
        "contraseña",
        "senha",
        "mot de passe",
        "current-password",
        "auth_pass",
        "authentication_password",
        "web_password",
        "wppassword",
        "userpassword",
        "user-pass",
        "form_pw",
        "login_password",
        "loginpassword",
        "session_password",
        "sessionpassword",
        "login_password",
        "pwd",
        "ap_password",
        "pass",
        "password1",
        "password-1",
        "passwd",
        "pass-word",
        "passw",
        "passwrd",
        "upassword",
        "user_pass"
      ],
      // IDs de champs de mot de passe
      passwordIds: [
        "password",
        "pass",
        "passwd",
        "pwd",
        "j_password",
        "user_password",
        "user-password",
        "login_password",
        "login-password",
        "passwort",
        "current-password",
        "auth_pass",
        "authentication_password",
        "web_password",
        "wppassword",
        "userpassword",
        "user-pass",
        "form_pw",
        "login_password",
        "loginpassword",
        "session_password",
        "sessionpassword",
        "login_password",
        "pwd",
        "ap_password",
        "pass",
        "password1",
        "password-1",
        "passwd",
        "pass-word",
        "passw",
        "passwrd",
        "upassword",
        "user_pass"
      ],
      // Noms de champs d'email
      emailNames: [
        "email",
        "e-mail",
        "mail",
        "courriel",
        "email_address",
        "email-address",
        "emailaddress",
        "user_email",
        "user-email",
        "login_email",
        "login-email",
        "authentication_email",
        "auth_email",
        "form_email",
        "wpmail",
        "mail_address",
        "mail-address",
        "mailaddress",
        "address",
        "e_mail",
        "e_mail_address",
        "emailid",
        "email_id",
        "email-id"
      ],
      // IDs de champs d'email
      emailIds: [
        "email",
        "e-mail",
        "mail",
        "courriel",
        "email_address",
        "email-address",
        "emailaddress",
        "user_email",
        "user-email",
        "login_email",
        "login-email",
        "authentication_email",
        "auth_email",
        "form_email",
        "wpmail",
        "mail_address",
        "mail-address",
        "mailaddress",
        "address",
        "e_mail",
        "e_mail_address",
        "emailid",
        "email_id",
        "email-id"
      ],
      // Noms de champs OTP
      otpNames: [
        "otp",
        "one-time-password",
        "one_time_password",
        "verification-code",
        "verification_code",
        "verificationcode",
        "security-code",
        "security_code",
        "securitycode",
        "auth-code",
        "auth_code",
        "authcode",
        "code",
        "code-input",
        "code_input",
        "codeinput",
        "pin",
        "pin-code",
        "pin_code",
        "pincode",
        "token",
        "token-code",
        "token_code",
        "tokencode",
        "mfa-code",
        "mfa_code",
        "mfacode",
        "2fa-code",
        "2fa_code",
        "2facode",
        "two-factor-code",
        "two_factor_code",
        "twofactorcode",
        "totp",
        "totp-code",
        "totp_code",
        "totpcode"
      ],
      // IDs de champs OTP
      otpIds: [
        "otp",
        "one-time-password",
        "one_time_password",
        "verification-code",
        "verification_code",
        "verificationcode",
        "security-code",
        "security_code",
        "securitycode",
        "auth-code",
        "auth_code",
        "authcode",
        "code",
        "code-input",
        "code_input",
        "codeinput",
        "pin",
        "pin-code",
        "pin_code",
        "pincode",
        "token",
        "token-code",
        "token_code",
        "tokencode",
        "mfa-code",
        "mfa_code",
        "mfacode",
        "2fa-code",
        "2fa_code",
        "2facode",
        "two-factor-code",
        "two_factor_code",
        "twofactorcode",
        "totp",
        "totp-code",
        "totp_code",
        "totpcode"
      ]
    }
  }
};

// État pour l'interface utilisateur inline (Bitwarden-like)
let inlineButtons: Set<HTMLElement> = new Set();
let activePopup: HTMLElement | null = null;
let lastFocusedField: HTMLInputElement | HTMLTextAreaElement | null = null;

// Variable pour suivre si l'autofill a déjà été tenté (kept for compatibility, not used to trigger auto actions)
let autofillAttempted = false;
let otpAutofillAttempted = false;

// Créer un élément input file invisible
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.style.opacity = '2';
fileInput.style.position = 'absolute';
fileInput.style.left = '-1000px';
fileInput.style.top = '-1000px';
document.body.appendChild(fileInput);

// Gérer la sélection de fichier
fileInput.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target && e.target.result) {
        // Extraire les données en base64
        const base64Data = e.target.result.toString().split(',')[1];

        // Envoyer les données directement au background script
        browser.runtime.sendMessage({
          action: 'fileSelected',
          fileName: file.name,
          fileData: base64Data,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size
        });
      }
    };

    reader.readAsDataURL(file);
  }

  document.body.removeChild(fileInput);
});

// Initialiser le script dès le chargement
(async () => {
  try {
    // Setup field adorners and events (Bitwarden-like)
    attachInlineIcons();

    // Observers to attach adorners for dynamic UIs
    setupMutationObserver();

    // Configurer la détection de soumission de formulaire pour sauvegarder les identifiants
    setupFormSubmissionDetection();

    console.log('Initialisation complète du script de contenu');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du script de contenu:', error);
  }
})();

/**
 * Attache des icônes inline aux champs de saisie (style Bitwarden)
 */
function attachInlineIcons(root: ParentNode = document): void {
  const inputs = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input[type="text"], input[type="email"], input[type="password"], input:not([type]), textarea'
  );

  inputs.forEach((el) => {
    if (!isVisibleElement(el as HTMLElement)) return;
    if (el.hasAttribute('data-skap-adorned')) return; // Éviter les doublons

    const typeAttr = (el.getAttribute('type') || '').toLowerCase();
    if (typeAttr === 'checkbox' || typeAttr === 'radio' || typeAttr === 'file' || typeAttr === 'submit' || typeAttr === 'button') return;

    const ac = (el.getAttribute('autocomplete') || '').toLowerCase();

    // Préférer seulement les champs candidats de connexion
    const isCandidate =
      typeAttr === 'password' ||
      ac === 'username' ||
      ac === 'email' ||
      ac === 'current-password' ||
      ac === 'new-password' ||
      isFieldCandidate(el);

    if (isCandidate) {
      attachFieldIcon(el);
      el.setAttribute('data-skap-adorned', 'true');

      // Ajouter les événements de focus
      el.addEventListener('focus', () => {
        lastFocusedField = el;
      });
    }
  });
}

/**
 * Détermine si un champ est candidat pour l'autofill basé sur ses attributs
 */
function isFieldCandidate(element: HTMLInputElement | HTMLTextAreaElement): boolean {
  const id = element.id.toLowerCase();
  const name = element.name.toLowerCase();
  const className = element.className.toLowerCase();

  // Utiliser la configuration existante pour identifier les champs
  const config = siteConfig.whiteList.fields;

  return (
    config.usernameNames.some(n => name.includes(n)) ||
    config.usernameIds.some(i => id.includes(i)) ||
    config.emailNames.some(n => name.includes(n)) ||
    config.emailIds.some(i => id.includes(i)) ||
    config.passwordNames.some(n => name.includes(n)) ||
    config.passwordIds.some(i => id.includes(i)) ||
    config.otpNames.some(n => name.includes(n)) ||
    config.otpIds.some(i => id.includes(i))
  );
}

/**
 * Attache une icône à un champ spécifique
 */
function attachFieldIcon(field: HTMLInputElement | HTMLTextAreaElement): void {
  // Créer l'icône
  const icon = document.createElement('div');
  icon.className = 'skap-field-icon';
  icon.innerHTML = '🔑'; // Icône simple, peut être remplacée par SVG

  // Styles pour l'icône
  Object.assign(icon.style, {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    zIndex: '10000',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px',
    border: '1px solid #ccc',
    userSelect: 'none'
  });

  // Positionner le champ parent en relatif si nécessaire
  const fieldStyle = window.getComputedStyle(field);
  if (fieldStyle.position === 'static') {
    field.style.position = 'relative';
  }

  // Créer un conteneur si nécessaire
  let container = field.parentElement;
  if (!container || container.style.position !== 'relative') {
    container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.width = '100%';

    field.parentNode?.insertBefore(container, field);
    container.appendChild(field);
  }

  // Ajouter l'icône au conteneur
  container.appendChild(icon);
  inlineButtons.add(icon);

  // Rendre l'icône focusable pour éviter qu'elle disparaisse lors du clic
  icon.setAttribute('tabindex', '0');

  // Variable pour suivre l'état d'interaction
  let isInteracting = false;

  // Événement de clic sur l'icône
  icon.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isInteracting = true;
  });

  icon.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Fermer le popup actuel s'il existe
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }

    // Récupérer les identifiants correspondants
    const credentials = await getMatchingCredentialsByETld();

    // Afficher le popup de sélection
    showCredentialPopup(icon, credentials, field);

    // Réinitialiser l'état d'interaction après un délai
    setTimeout(() => {
      isInteracting = false;
    }, 200);
  });

  // Masquer l'icône quand le champ perd le focus (avec délai et vérifications)
  field.addEventListener('blur', () => {
    setTimeout(() => {
      // Ne pas masquer si on est en train d'interagir avec l'icône ou s'il y a un popup actif
      if (!isInteracting && !activePopup && document.activeElement !== icon) {
        icon.style.display = 'none';
      }
    }, 150);
  });

  // Afficher l'icône quand le champ gagne le focus
  field.addEventListener('focus', () => {
    icon.style.display = 'flex';
    lastFocusedField = field;
  });

  // Initialement masquer l'icône
  icon.style.display = 'none';
}

/**
 * Récupère les identifiants correspondants basés sur l'eTLD (domaine effectif)
 */
async function getMatchingCredentialsByETld(): Promise<Credential[]> {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getPasswords' });
    console.log(response);
    if (response.success && response.passwords) {
      const currentHostname = window.location.hostname;
      // Filtrer les identifiants qui correspondent au domaine actuel
      console.log(currentHostname);
      const t = response.passwords.filter((cred: Credential) => {
        console.log(cred.url);
        if (!cred.url) return false;
        try {
          const credDomain = cred.url;
          console.log(cred.url);
          return credDomain === currentHostname || currentHostname.endsWith('.' + credDomain);
        } catch {
          return false;
        }
      });
      console.log(t);
      return t;
    }
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des identifiants:', error);
    return [];
  }
}

/**
 * Affiche le popup de sélection des identifiants (style Bitwarden)
 */
function showCredentialPopup(anchor: HTMLElement, credentials: Credential[], targetField: HTMLInputElement | HTMLTextAreaElement): void {
  // Fermer le popup existant
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }

  // Créer le popup
  const popup = document.createElement('div');
  popup.className = 'skap-credential-popup';

  // Styles du popup
  Object.assign(popup.style, {
    position: 'absolute',
    backgroundColor: '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: '10001',
    minWidth: '250px',
    maxWidth: '350px',
    maxHeight: '300px',
    overflowY: 'auto',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  });

  // Positionner le popup près de l'ancre
  const anchorRect = anchor.getBoundingClientRect();
  popup.style.top = (anchorRect.bottom + window.scrollY + 5) + 'px';
  popup.style.left = (anchorRect.left + window.scrollX) + 'px';

  // Contenu du popup
  if (credentials.length === 0) {
    const noCredsDiv = document.createElement('div');
    noCredsDiv.textContent = 'Aucun identifiant trouvé pour ce site';
    noCredsDiv.style.padding = '12px';
    noCredsDiv.style.color = '#666';
    noCredsDiv.style.textAlign = 'center';
    popup.appendChild(noCredsDiv);
  } else {
    // En-tête
    const header = document.createElement('div');
    header.textContent = 'Identifiants disponibles';
    header.style.padding = '8px 12px';
    header.style.borderBottom = '1px solid #eee';
    header.style.fontWeight = 'bold';
    header.style.backgroundColor = '#f8f9fa';
    popup.appendChild(header);

    // Liste des identifiants
    credentials.forEach((cred, index) => {
      const item = document.createElement('div');
      item.className = 'skap-credential-item';

      Object.assign(item.style, {
        padding: '10px 12px',
        cursor: 'pointer',
        borderBottom: index < credentials.length - 1 ? '1px solid #eee' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      });

      // Favicon
      const favicon = document.createElement('img');
      favicon.src = cred.favicon || getFaviconUrl(cred.url || '');
      favicon.style.width = '16px';
      favicon.style.height = '16px';
      favicon.style.flexShrink = '0';
      favicon.onerror = () => {
        favicon.style.display = 'none';
      };

      // Informations de l'identifiant
      const info = document.createElement('div');
      info.style.flex = '1';
      info.style.overflow = 'hidden';

      const username = document.createElement('div');
      username.textContent = cred.username;
      username.style.fontWeight = '500';
      username.style.whiteSpace = 'nowrap';
      username.style.overflow = 'hidden';
      username.style.textOverflow = 'ellipsis';

      const description = document.createElement('div');
      description.textContent = cred.description || cred.url;
      description.style.fontSize = '12px';
      description.style.color = '#666';
      description.style.whiteSpace = 'nowrap';
      description.style.overflow = 'hidden';
      description.style.textOverflow = 'ellipsis';

      info.appendChild(username);
      info.appendChild(description);

      item.appendChild(favicon);
      item.appendChild(info);

      // Événements de survol
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f0f0';
      });

      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
      });

      // Événement de clic
      item.addEventListener('click', () => {
        fillCredentialIntoForm(cred, targetField);
        popup.remove();
        activePopup = null;
      });

      popup.appendChild(item);
    });
  }

  // Ajouter le popup au document
  document.body.appendChild(popup);
  activePopup = popup;

  // Fermer le popup en cliquant à l'extérieur
  setTimeout(() => {
    const closeHandler = (e: Event) => {
      if (!popup.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
        popup.remove();
        activePopup = null;
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

/**
 * Remplit les champs du formulaire avec les identifiants sélectionnés
 */
function fillCredentialIntoForm(credential: Credential, targetField: HTMLInputElement | HTMLTextAreaElement): void {
  const fields = detectAutofillFields();

  // Remplir le champ de nom d'utilisateur
  let usernameField: HTMLInputElement | null = null;
  if (targetField.type === "password") {
    targetField.value = credential.password;
    targetField.dispatchEvent(new Event('input', { bubbles: true }));
    targetField.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (targetField.type === "name" || targetField.type === "email") {
    targetField.value = credential.username;
    targetField.dispatchEvent(new Event('input', { bubbles: true }));
    targetField.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (fields.some(f => f.type === "name")) {
    usernameField = fields.find(f => f.type === "name")?.element as HTMLInputElement;
  } else if (fields.some(f => f.type === "email")) {
    usernameField = fields.find(f => f.type === "email")?.element as HTMLInputElement;
  }

  if (usernameField) {
    usernameField.value = credential.username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Remplir le champ de mot de passe
  const passwordField = fields.find(f => f.type === "password")?.element as HTMLInputElement;
  if (passwordField) {
    passwordField.value = credential.password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Si le champ cible est un champ OTP et que l'identifiant a un OTP
  if (targetField.type === 'text' && credential.otp && isOTPField(targetField)) {
    generateTOTPCode(credential.otp).then(otpCode => {
      if (otpCode) {
        targetField.value = otpCode;
        targetField.dispatchEvent(new Event('input', { bubbles: true }));
        targetField.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  console.log('Identifiants remplis automatiquement');
}

/**
 * Affiche une mini-barre OTP près du champ focalisé (style Bitwarden)
 */
function showOTPMiniBar(targetField: HTMLInputElement | HTMLTextAreaElement, credentials: Credential[]): void {
  // Fermer toute mini-barre existante
  const existingMiniBar = document.querySelector('.skap-otp-minibar');
  if (existingMiniBar) {
    existingMiniBar.remove();
  }

  // Créer la mini-barre
  const miniBar = document.createElement('div');
  miniBar.className = 'skap-otp-minibar';

  // Styles de la mini-barre
  Object.assign(miniBar.style, {
    position: 'absolute',
    backgroundColor: '#2d3748',
    color: 'white',
    border: '1px solid #4a5568',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    fontFamily: 'Arial, sans-serif',
    zIndex: '10002',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '200px'
  });

  // Positionner la mini-barre près du champ
  const fieldRect = targetField.getBoundingClientRect();
  miniBar.style.top = (fieldRect.bottom + window.scrollY + 5) + 'px';
  miniBar.style.left = (fieldRect.left + window.scrollX) + 'px';

  // Icône OTP
  const otpIcon = document.createElement('span');
  otpIcon.textContent = '🔐';
  otpIcon.style.fontSize = '14px';

  // Texte informatif
  const infoText = document.createElement('span');
  infoText.textContent = 'Codes OTP disponibles:';
  infoText.style.flex = '1';

  miniBar.appendChild(otpIcon);
  miniBar.appendChild(infoText);

  // Boutons pour chaque identifiant avec OTP
  credentials.forEach((cred, index) => {
    if (cred.otp) {
      const otpButton = document.createElement('button');
      otpButton.textContent = cred.username.substring(0, 8) + (cred.username.length > 8 ? '...' : '');

      Object.assign(otpButton.style, {
        backgroundColor: '#4299e1',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        cursor: 'pointer',
        marginLeft: '4px'
      });

      // Événements de survol
      otpButton.addEventListener('mouseenter', () => {
        otpButton.style.backgroundColor = '#3182ce';
      });

      otpButton.addEventListener('mouseleave', () => {
        otpButton.style.backgroundColor = '#4299e1';
      });

      // Événement de clic pour générer et remplir l'OTP
      otpButton.addEventListener('click', async () => {
        try {
          const otpCode = await generateTOTPCode(cred.otp!);
          if (otpCode) {
            targetField.value = otpCode;
            targetField.dispatchEvent(new Event('input', { bubbles: true }));
            targetField.dispatchEvent(new Event('change', { bubbles: true }));

            // Afficher une notification de succès
            showNotification(`Code OTP généré pour ${cred.username}`, 'success');

            // Fermer la mini-barre après utilisation
            miniBar.remove();
          } else {
            showNotification('Erreur lors de la génération du code OTP', 'error');
          }
        } catch (error) {
          console.error('Erreur OTP:', error);
          showNotification('Erreur lors de la génération du code OTP', 'error');
        }
      });

      miniBar.appendChild(otpButton);
    }
  });

  // Bouton de fermeture
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';

  Object.assign(closeButton.style, {
    backgroundColor: 'transparent',
    color: '#a0aec0',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0 4px',
    marginLeft: '8px'
  });

  closeButton.addEventListener('click', () => {
    miniBar.remove();
  });

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.color = 'white';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.color = '#a0aec0';
  });

  miniBar.appendChild(closeButton);

  // Ajouter la mini-barre au document
  document.body.appendChild(miniBar);

  // Fermer automatiquement après 10 secondes
  setTimeout(() => {
    if (miniBar.parentNode) {
      miniBar.remove();
    }
  }, 10000);

  // Fermer en cliquant à l'extérieur
  setTimeout(() => {
    const closeHandler = (e: Event) => {
      if (!miniBar.contains(e.target as Node) && !targetField.contains(e.target as Node)) {
        miniBar.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

/**
 * Détermine si un champ est un champ OTP
 */
function isOTPField(field: HTMLInputElement | HTMLTextAreaElement): boolean {
  const id = field.id.toLowerCase();
  const name = field.name.toLowerCase();
  const config = siteConfig.whiteList.fields;

  return (
    config.otpNames.some(n => name.includes(n)) ||
    config.otpIds.some(i => id.includes(i))
  );
}

function detectAutofillFields(): AutofillField[] {
  // Store detected fields
  const autofillFields: AutofillField[] = [];

  // Regular expressions for field detection based on attributes and ID/name patterns
  const patterns = {
    name: /^(?:name|full[_-]?name|first[_-]?name|last[_-]?name|fname|lname|given[_-]?name|family[_-]?name|current-email|j_username|user_name|user|user-name|login|vb_login_username|user name|user id|user-id|userid|id|form_loginname|wpname|mail|loginid|login id|login_name|openid_identifier|authentication_email|openid|auth_email|auth_id|authentication_identifier|authentication_id|customer_number|customernumber|onlineid|identifier|ww_x_util|loginfmt|username|log(in)?id|account|account[-_]?name|email[-_]?address)$/i,
    email: /^(?:e[_-]?mail|email[_-]?address|mail|e.?mail|courriel|correo.*electr(o|ó)nico|メールアドレス|Электронной.?Почты|邮件|邮箱|電郵地址|ഇ-മെയില്‍|ഇലക്ട്രോണിക്.?മെയിൽ|ایمیل|پست.*الکترونیک|ईमेल|इलॅक्ट्रॉनिक.?मेल|(\\b|_)eposta(\\b|_)|(?:いめーる|電子.?郵便|[Ee]-?mail)(.?住所)?|email_address|email-address|emailaddress|user_email|user-email|login_email|login-email|authentication_email|auth_email|form_email|wpmail|mail_address|mail-address|mailaddress|address|e_mail|e_mail_address|emailid|email_id|email-id)$/i,
    password: /^(?:password|pass|pwd|current[_-]?password|new[_-]?password|j_password|user_password|user-password|login_password|login-password|passwort|contraseña|senha|mot de passe|auth_pass|authentication_password|web_password|wppassword|userpassword|user-pass|form_pw|loginpassword|session_password|sessionpassword|ap_password|password1|password-1|pass-word|passw|passwrd|upassword|user_pass)$/i,
    otp: /^(?:otp|one[_-]?time[_-]?code|verification[_-]?code|auth[_-]?code|security[_-]?code|2fa|one-time-password|one_time_password|verification-code|verification_code|verificationcode|security-code|security_code|securitycode|auth-code|auth_code|authcode|code|code-input|code_input|codeinput|pin|pin-code|pin_code|pincode|token|token-code|token_code|tokencode|mfa-code|mfa_code|mfacode|2fa-code|2fa_code|2facode|two-factor-code|two_factor_code|twofactorcode|totp|totp-code|totp_code|totpcode)$/i
  };

  // Find all input elements
  const inputElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="image"]):not([type="range"]):not([type="color"]):not([type="date"]):not([type="datetime-local"]):not([type="month"]):not([type="time"]):not([type="week"]), textarea'
  );

  // Process each input element
  inputElements.forEach(element => {
    // Skip invisible elements
    if (!isVisibleElement(element as HTMLElement)) {
      return;
    }

    // Get element attributes
    const type = element.getAttribute("type")?.toLowerCase() || "";
    const id = element.id.toLowerCase();
    const name = element.name.toLowerCase();
    const autocomplete = element.getAttribute("autocomplete")?.toLowerCase() || "";
    const ariaLabel = element.getAttribute("aria-label")?.toLowerCase() || "";
    const className = element.className.toLowerCase();

    // Determine field type based on attributes
    let fieldType: AutofillField["type"] | null = null;

    if (autocomplete === "off") {
      return;
    }

    // Check by input type
    if (type === "email") {
      fieldType = "email";
    } else if (type === "password") {
      fieldType = "password";
    }

    // Check by autocomplete attribute
    if (!fieldType) {
      if (autocomplete.includes("name") || autocomplete === "name" || autocomplete === "username") {
        fieldType = "name";
      } else if (autocomplete === "email") {
        fieldType = "email";
      } else if (autocomplete === "current-password" || autocomplete === "new-password") {
        fieldType = "password";
      } else if (autocomplete === "one-time-code") {
        fieldType = "otp";
      }
    }

    // Check by id or name patterns
    if (!fieldType) {
      if (patterns.name.test(id) || patterns.name.test(name)) {
        fieldType = "name";
      } else if (patterns.email.test(id) || patterns.email.test(name)) {
        fieldType = "email";
      } else if (patterns.password.test(id) || patterns.password.test(name)) {
        fieldType = "password";
      } else if (patterns.otp.test(id) || patterns.otp.test(name)) {
        fieldType = "otp";
      }
    }

    // Check by aria-label
    if (!fieldType && ariaLabel) {
      if (patterns.name.test(ariaLabel) || /username|user name|identifier|login|account/i.test(ariaLabel)) {
        fieldType = "name";
      } else if (patterns.email.test(ariaLabel)) {
        fieldType = "email";
      } else if (patterns.password.test(ariaLabel)) {
        fieldType = "password";
      } else if (patterns.otp.test(ariaLabel)) {
        fieldType = "otp";
      }
    }

    // Check by class name for common patterns
    if (!fieldType && className) {
      if (/username|user-name|userid|login|account/i.test(className)) {
        fieldType = "name";
      } else if (/email/i.test(className)) {
        fieldType = "email";
      } else if (/password|pwd|pass/i.test(className)) {
        fieldType = "password";
      } else if (/otp|code|token|2fa|mfa/i.test(className)) {
        fieldType = "otp";
      }
    }

    // Check by placeholder or label text
    if (!fieldType) {
      const placeholder = element.placeholder.toLowerCase();
      const labelElement = document.querySelector(`label[for="${element.id}"]`);
      const labelText = labelElement ? labelElement.textContent?.toLowerCase() || "" : "";

      if (patterns.name.test(placeholder) || patterns.name.test(labelText) ||
        /username|user name|identifier|login|account/i.test(placeholder) ||
        /username|user name|identifier|login|account/i.test(labelText)) {
        fieldType = "name";
      } else if (patterns.email.test(placeholder) || patterns.email.test(labelText)) {
        fieldType = "email";
      } else if (patterns.password.test(placeholder) || patterns.password.test(labelText)) {
        fieldType = "password";
      } else if (patterns.otp.test(placeholder) || patterns.otp.test(labelText)) {
        fieldType = "otp";
      }
    }

    // Special case for OTP: inputs with maxlength of 1-8 and numeric pattern or inputmode
    if (!fieldType &&
      element instanceof HTMLInputElement &&
      ((element.maxLength >= 1 && element.maxLength <= 8) ||
        element.getAttribute("inputmode") === "numeric") &&
      (element.pattern === "[0-9]*" || element.getAttribute("inputmode") === "numeric")) {
      fieldType = "otp";
    }

    // Check for nearby labels that might not be linked by id
    if (!fieldType) {
      // Get all labels that are nearby (same parent or grandparent)
      const parent = element.parentElement;
      const grandparent = parent?.parentElement;
      const nearbyLabels: HTMLLabelElement[] = [];

      if (parent) {
        nearbyLabels.push(...Array.from(parent.querySelectorAll('label')));
      }

      if (grandparent) {
        nearbyLabels.push(...Array.from(grandparent.querySelectorAll('label')));
      }

      // Check if any labels match our patterns
      for (const label of nearbyLabels) {
        const labelText = label.textContent?.toLowerCase() || "";

        if (patterns.name.test(labelText) || /username|user name|identifier|login|account/i.test(labelText)) {
          fieldType = "name";
          break;
        } else if (patterns.email.test(labelText)) {
          fieldType = "email";
          break;
        } else if (patterns.password.test(labelText)) {
          fieldType = "password";
          break;
        } else if (patterns.otp.test(labelText)) {
          fieldType = "otp";
          break;
        }
      }
    }

    // Add the field if a type was determined
    if (fieldType) {
      autofillFields.push({
        element,
        type: fieldType
      });
    }
  });

  return autofillFields;
}

/**
 * Configure un observateur de mutations pour détecter les nouveaux champs de formulaire
 */
function setupMutationObserver(): void {
  // Créer un observateur de mutations pour le système Bitwarden-like
  const observer = new MutationObserver((mutations) => {
    // Vérifier si de nouveaux éléments ont été ajoutés
    let newInputsDetected = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Parcourir les nœuds ajoutés
        for (const node of Array.from(mutation.addedNodes)) {
          // Vérifier si le nœud est un élément HTML
          if (node instanceof HTMLElement) {
            // Vérifier si l'élément contient des champs de formulaire
            const inputs = node.querySelectorAll('input, textarea');
            if (inputs.length > 0) {
              newInputsDetected = true;
              break;
            }
          }
        }
      }
      // Vérifier également les modifications d'attributs qui pourraient transformer un champ
      else if (mutation.type === 'attributes' &&
        mutation.target instanceof HTMLElement &&
        (mutation.target.tagName === 'INPUT' || mutation.target.tagName === 'TEXTAREA')) {
        newInputsDetected = true;
        break;
      }

      if (newInputsDetected) break;
    }

    // Si de nouveaux champs ont été détectés, attacher les icônes inline (style Bitwarden)
    if (newInputsDetected) {
      console.log('Nouveaux champs détectés, ajout des icônes inline...');
      setTimeout(() => {
        attachInlineIcons(); // Attacher les icônes aux nouveaux champs
      }, 500); // Attendre que le DOM soit stable
    }
  });

  // Observer les modifications du document
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['type', 'id', 'name', 'autocomplete', 'placeholder', 'class']
  });

  console.log('Observateur de mutations configuré (mode Bitwarden-like)');
}

/**
 * Vérifie si de nouveaux formulaires de connexion sont apparus
 */
async function checkForNewLoginForms(): Promise<void> {
  // Identifier les champs de formulaire
  const fields = detectAutofillFields();
  console.log('Champs de formulaire détectés:', fields);

  // Vérifier si les champs sont vides (non remplis)
  const passwordEmpty = fields.some(f => f.type === "password" && (!f.element.value || f.element.value === ''));
  const hasNameField = fields.some(f => f.type === "name");
  const hasEmailField = fields.some(f => f.type === "email");
  const nameFieldEmpty = fields.some(f => f.type === "name" && (!f.element.value || f.element.value === ''));
  const emailFieldEmpty = fields.some(f => f.type === "email" && (!f.element.value || f.element.value === ''));
  const usernameEmpty = nameFieldEmpty || emailFieldEmpty;
  console.log(usernameEmpty);

  if (passwordEmpty && usernameEmpty) {
    console.log('Nouveau formulaire de connexion détecté, tentative d\'autofill');
    await autoFillCredentials();
    autofillAttempted = true;
  } else if (passwordEmpty) {
    console.log('Nouveau formulaire de connexion détecté, tentative d\'autofill');
    await autoFillCredentials();
    autofillAttempted = true;
  } else if (usernameEmpty) {
    console.log('Nouveau formulaire de connexion détecté, tentative d\'autofill');
    await autoFillCredentials();
    autofillAttempted = true;
  }

  // Si des champs OTP sont détectés et que l'autofill OTP n'a pas encore été tenté
  if (fields.some(f => f.type === "otp") && !otpAutofillAttempted) {
    // Vérifier si les champs sont vides (non remplis)
    const otpEmpty = fields.some(f => f.type === "otp" && !f.element.value);

    if (otpEmpty) {
      console.log('Nouveau champ OTP détecté, tentative d\'autofill');
      await autoFillOTP();
      otpAutofillAttempted = true;
    }
  }
}

// Écouter les messages du background
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message reçu dans le content script:', message);
  // Traiter les différents types de messages
  switch (message.action) {
    case 'fillPassword':
      // Remplir un formulaire avec un mot de passe
      if (message.site && message.username && message.password) {
        fillPasswordForm(message.username, message.password);
        sendResponse({ success: true, message: 'Formulaire rempli' });
      } else {
        sendResponse({ success: false, message: 'Informations de connexion incomplètes' });
      }
      break;

    case 'fillOTP':
      // Remplir un champ OTP avec un code
      if (message.otp) {
        fillOTPField(message.otp);
        sendResponse({ success: true, message: 'Champ OTP rempli' });
      } else {
        sendResponse({ success: false, message: 'Code OTP manquant' });
      }
      break;

    case 'identifyFields':
      console.log('Identifier les champs de formulaire sur la page');
      // Identifier les champs de formulaire sur la page
      const result = detectAutofillFields();
      sendResponse({ success: true, fields: result });
      break;

    case 'injectFile':
      console.log('Injecting file selector');
      // Informer l'utilisateur qu'il doit interagir avec l'élément
      showNotification('Veuillez cliquer sur la page pour activer le sélecteur de fichier', 'info');

      // Créer un gestionnaire d'événement temporaire pour le clic utilisateur
      const handleUserClick = () => {
        // Une fois que l'utilisateur a cliqué, nous pouvons activer le sélecteur de fichier
        fileInput.click();
        // Nettoyer l'écouteur d'événement après utilisation
        document.removeEventListener('click', handleUserClick);
      };

      // Ajouter l'écouteur d'événement pour attendre le clic de l'utilisateur
      document.addEventListener('click', handleUserClick, { once: true });

      sendResponse({ success: true, message: 'En attente du clic utilisateur pour le sélecteur de fichier' });
      break;
    case 'forceAutofill':
      // Dans le mode Bitwarden-like, afficher le popup au lieu d'autofill direct
      if (lastFocusedField) {
        getMatchingCredentialsByETld().then(credentials => {
          if (credentials.length > 0) {
            // Trouver l'icône associée au champ focalisé
            const icon = document.querySelector(`[data-skap-field-id="${lastFocusedField?.id || 'unknown'}"]`) as HTMLElement;
            if (icon) {
              showCredentialPopup(icon, credentials, lastFocusedField);
              sendResponse({ success: true, message: 'Popup d\'identifiants affiché' });
            } else {
              sendResponse({ success: false, message: 'Aucune icône trouvée pour le champ' });
            }
          } else {
            sendResponse({ success: false, message: 'Aucun identifiant trouvé pour ce site' });
          }
        }).catch(error => {
          sendResponse({ success: false, message: error.message });
        });
      } else {
        sendResponse({ success: false, message: 'Aucun champ focalisé' });
      }
      return true; // Indique que la réponse sera envoyée de manière asynchrone

    case 'forceOTPAutofill':
      // Dans le mode Bitwarden-like, afficher une mini-barre OTP au lieu d'autofill direct
      if (lastFocusedField && isOTPField(lastFocusedField)) {
        getMatchingCredentialsByETld().then(credentials => {
          const otpCredentials = credentials.filter(cred => cred.otp);
          if (otpCredentials.length > 0) {
            showOTPMiniBar(lastFocusedField, otpCredentials);
            sendResponse({ success: true, message: 'Mini-barre OTP affichée' });
          } else {
            sendResponse({ success: false, message: 'Aucun identifiant avec OTP trouvé' });
          }
        }).catch(error => {
          sendResponse({ success: false, message: error.message });
        });
      } else {
        sendResponse({ success: false, message: 'Aucun champ OTP focalisé' });
      }
      return true; // Indique que la réponse sera envoyée de manière asynchrone

    default:
      sendResponse({ success: false, message: 'Action non reconnue' });
  }

  return true; // Indique que la réponse sera envoyée de manière asynchrone
});

/**
 * Récupère les identifiants correspondant à l'URL actuelle
 * @returns Promise avec les identifiants correspondants
 */
async function getMatchingCredentials(): Promise<Credential[]> {
  return new Promise((resolve) => {
    // Récupérer tous les mots de passe depuis le background
    browser.runtime.sendMessage({ action: 'getPasswords' }).then((response) => {
      if (response && response.success && response.passwords) {
        const currentUrl = window.location.href;
        const currentHostname = window.location.hostname;

        // Filtrer les mots de passe qui correspondent à l'URL actuelle
        const matchingPasswords = response.passwords.filter((password: any) => {
          if (!password.url) return false;

          // Essayer de créer un objet URL à partir de l'URL stockée
          const storedUrl = password.url;
          // Vérifier si le hostname correspond
          return storedUrl.hostname === currentHostname || currentHostname.endsWith('.' + storedUrl);
        });

        // Convertir les mots de passe en identifiants
        const credentials: Credential[] = matchingPasswords.map((password: any) => ({
          username: password.username,
          password: password.password,
          url: password.url,
          description: password.description,
          otp: password.otp
        }));

        resolve(credentials);
      } else {
        resolve([]);
      }
    });
  });
}

/**
 * Affiche un menu de confirmation pour l'autofill
 * @param credential Identifiant à utiliser
 */
function showConfirmationMenu(credential: Credential): void {
  // Supprimer tout menu existant
  const existingMenu = document.getElementById('skapauto-confirmation-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Créer le menu
  const menu = document.createElement('div');
  menu.id = 'skapauto-confirmation-menu';
  menu.style.position = 'fixed';
  menu.style.top = '10px';
  menu.style.right = '10px';
  menu.style.backgroundColor = '#ced7e1';
  menu.style.borderRadius = '0.5rem';
  menu.style.padding = '16px';
  menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  menu.style.zIndex = '9999';
  menu.style.maxWidth = '300px';
  menu.style.fontFamily = "'Work Sans', sans-serif";
  menu.style.transition = 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out';

  // Ajouter un titre
  const title = document.createElement('div');
  title.textContent = 'Confirmer l\'autofill';
  title.style.fontFamily = "'Raleway', sans-serif";
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.borderBottom = '1px solid #1d1b21';
  title.style.paddingBottom = '5px';
  title.style.color = '#1d1b21';
  menu.appendChild(title);

  // Ajouter les informations du compte
  const info = document.createElement('div');
  info.style.marginBottom = '10px';
  info.style.padding = '5px';

  const usernameSpan = document.createElement('div');
  usernameSpan.textContent = `Nom d'utilisateur: ${credential.username}`;
  usernameSpan.style.fontWeight = 'bold';
  usernameSpan.style.color = '#1d1b21';
  info.appendChild(usernameSpan);

  const serviceSpan = document.createElement('div');
  serviceSpan.textContent = `Service: ${credential.url}`;
  serviceSpan.style.color = '#474b4f';
  serviceSpan.style.fontSize = '0.9em';
  info.appendChild(serviceSpan);

  menu.appendChild(info);

  // Conteneur pour les boutons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginTop = '16px';

  // Bouton Accepter
  const acceptButton = document.createElement('div');
  acceptButton.textContent = 'Accepter';
  acceptButton.style.flex = '1';
  acceptButton.style.textAlign = 'center';
  acceptButton.style.padding = '8px';
  acceptButton.style.backgroundColor = '#a7f3ae';
  acceptButton.style.color = '#1d1b21';
  acceptButton.style.borderRadius = '0.375rem';
  acceptButton.style.cursor = 'pointer';
  acceptButton.style.transition = 'all 0.2s ease-in-out';
  acceptButton.addEventListener('mouseover', () => {
    acceptButton.style.opacity = '0.9';
    acceptButton.style.transform = 'translateY(-1px)';
  });
  acceptButton.addEventListener('mouseout', () => {
    acceptButton.style.opacity = '1';
    acceptButton.style.transform = 'translateY(0)';
  });
  acceptButton.addEventListener('click', () => {
    fillPasswordForm(credential.username, credential.password);
    menu.remove();
  });

  // Bouton Annuler
  const cancelButton = document.createElement('div');
  cancelButton.textContent = 'Annuler';
  cancelButton.style.flex = '1';
  cancelButton.style.textAlign = 'center';
  cancelButton.style.padding = '8px';
  cancelButton.style.backgroundColor = '#f2c3c2';
  cancelButton.style.color = '#1d1b21';
  cancelButton.style.borderRadius = '0.375rem';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.transition = 'all 0.2s ease-in-out';
  cancelButton.addEventListener('mouseover', () => {
    cancelButton.style.opacity = '0.9';
    cancelButton.style.transform = 'translateY(-1px)';
  });
  cancelButton.addEventListener('mouseout', () => {
    cancelButton.style.opacity = '1';
    cancelButton.style.transform = 'translateY(0)';
  });
  cancelButton.addEventListener('click', () => {
    menu.remove();
  });

  buttonContainer.appendChild(acceptButton);
  buttonContainer.appendChild(cancelButton);
  menu.appendChild(buttonContainer);

  // Ajouter le menu à la page
  document.body.appendChild(menu);

  // Ajouter l'effet de survol sur le menu
  menu.addEventListener('mouseover', () => {
    menu.style.transform = 'translateY(-2px)';
    menu.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
  });
  menu.addEventListener('mouseout', () => {
    menu.style.transform = 'translateY(0)';
    menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  });

  // Fermer le menu après 30 secondes s'il n'a pas été fermé
  setTimeout(() => {
    if (document.getElementById('skapauto-confirmation-menu')) {
      document.getElementById('skapauto-confirmation-menu')!.remove();
    }
  }, 30000);
}

// Modifier la fonction autoFillCredentials pour utiliser le menu de confirmation
async function autoFillCredentials(): Promise<void> {
  // Récupérer les identifiants correspondants
  const credentials = await getMatchingCredentials();

  // Si aucun identifiant ne correspond, ne rien faire
  if (credentials.length === 0) {
    console.log('Aucun identifiant correspondant trouvé');
    return;
  }

  // Si un seul identifiant correspond, afficher le menu de confirmation
  if (credentials.length === 1) {
    console.log('Un seul identifiant correspondant trouvé, affichage du menu de confirmation');
    showConfirmationMenu(credentials[0]);
    return;
  }

  // Si plusieurs identifiants correspondent, afficher le menu de sélection
  console.log('Plusieurs identifiants correspondants trouvés, affichage du menu de sélection');
  showCredentialSelectionMenu(credentials);
}

/**
 * Affiche un menu de sélection pour choisir parmi plusieurs identifiants
 * @param credentials Liste des identifiants disponibles
 */
function showCredentialSelectionMenu(credentials: Credential[]): void {
  // Supprimer tout menu existant
  const existingMenu = document.getElementById('skapauto-credential-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Créer le menu
  const menu = document.createElement('div');
  menu.id = 'skapauto-credential-menu';
  menu.style.position = 'fixed';
  menu.style.top = '10px';
  menu.style.right = '10px';
  menu.style.backgroundColor = '#ced7e1';
  menu.style.borderRadius = '0.5rem';
  menu.style.padding = '16px';
  menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  menu.style.zIndex = '9999';
  menu.style.maxWidth = '300px';
  menu.style.fontFamily = "'Work Sans', sans-serif";
  menu.style.transition = 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out';

  // Ajouter un titre
  const title = document.createElement('div');
  title.textContent = 'Choisir un identifiant';
  title.style.fontFamily = "'Raleway', sans-serif";
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.borderBottom = '1px solid #1d1b21';
  title.style.paddingBottom = '5px';
  title.style.color = '#1d1b21';
  menu.appendChild(title);

  // Ajouter les options
  credentials.forEach((credential, index) => {
    const option = document.createElement('div');
    option.style.padding = '8px';
    option.style.cursor = 'pointer';
    option.style.borderBottom = index < credentials.length - 1 ? '1px solid #1d1b21' : 'none';
    option.style.transition = 'all 0.2s ease-in-out';

    // Conteneur pour les informations
    const infoContainer = document.createElement('div');

    // Service et favicon
    const serviceContainer = document.createElement('div');
    serviceContainer.style.display = 'flex';
    serviceContainer.style.alignItems = 'center';
    serviceContainer.style.marginBottom = '4px';

    if (credential.favicon) {
      const favicon = document.createElement('img');
      favicon.src = getFaviconUrl(credential.url || '');
      favicon.style.width = '16px';
      favicon.style.height = '16px';
      favicon.style.marginRight = '8px';
      serviceContainer.appendChild(favicon);
    }

    const serviceName = document.createElement('span');
    serviceName.textContent = credential.url || 'Identifiant';
    serviceName.style.fontWeight = 'bold';
    serviceName.style.color = '#1d1b21';
    serviceContainer.appendChild(serviceName);

    infoContainer.appendChild(serviceContainer);

    // Nom d'utilisateur
    const username = document.createElement('div');
    username.textContent = credential.username;
    username.style.fontSize = '0.9em';
    username.style.color = '#474b4f';
    infoContainer.appendChild(username);

    option.appendChild(infoContainer);

    // Effets de survol
    option.addEventListener('mouseover', () => {
      option.style.backgroundColor = '#f0f0f0';
      option.style.transform = 'translateX(5px)';
    });
    option.addEventListener('mouseout', () => {
      option.style.backgroundColor = 'transparent';
      option.style.transform = 'translateX(0)';
    });

    // Événement de clic
    option.addEventListener('click', () => {
      fillPasswordForm(credential.username, credential.password);
      menu.remove();
    });

    menu.appendChild(option);
  });

  // Ajouter un bouton de fermeture
  const closeButton = document.createElement('div');
  closeButton.textContent = 'Fermer';
  closeButton.style.textAlign = 'center';
  closeButton.style.marginTop = '16px';
  closeButton.style.padding = '8px';
  closeButton.style.backgroundColor = '#f2c3c2';
  closeButton.style.color = '#1d1b21';
  closeButton.style.borderRadius = '0.375rem';
  closeButton.style.cursor = 'pointer';
  closeButton.style.transition = 'all 0.2s ease-in-out';

  closeButton.addEventListener('mouseover', () => {
    closeButton.style.opacity = '0.9';
    closeButton.style.transform = 'translateY(-1px)';
  });
  closeButton.addEventListener('mouseout', () => {
    closeButton.style.opacity = '1';
    closeButton.style.transform = 'translateY(0)';
  });
  closeButton.addEventListener('click', () => {
    menu.remove();
  });
  menu.appendChild(closeButton);

  // Ajouter le menu à la page
  document.body.appendChild(menu);

  // Ajouter l'effet de survol sur le menu
  menu.addEventListener('mouseover', () => {
    menu.style.transform = 'translateY(-2px)';
    menu.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
  });
  menu.addEventListener('mouseout', () => {
    menu.style.transform = 'translateY(0)';
    menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  });

  // Fermer le menu après 30 secondes s'il n'a pas été fermé
  setTimeout(() => {
    if (document.getElementById('skapauto-credential-menu')) {
      document.getElementById('skapauto-credential-menu')!.remove();
    }
  }, 30000);
}

/**
 * Vérifie si un élément est visible sur la page
 * @param element Élément à vérifier
 * @returns true si l'élément est visible
 */
function isVisibleElement(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0;
}

/**
 * Identifie tous les champs de formulaire sur la page
 * @returns Liste des champs d'autofill détectés
 */
function identifyFormFields(): AutofillField[] {
  return detectAutofillFields();
}

/**
 * Remplit un formulaire de connexion avec les identifiants fournis
 * @param username Nom d'utilisateur
 * @param password Mot de passe
 */
function fillPasswordForm(username: string, password: string): void {
  // Identifier les champs
  const fields = detectAutofillFields();
  console.log(fields);

  // Remplir le champ de nom d'utilisateur
  let usernameField: HTMLInputElement | null = null;

  if (fields.some(f => f.type === "name")) {
    usernameField = fields.find(f => f.type === "name")?.element as HTMLInputElement;
  } else if (fields.some(f => f.type === "email")) {
    // Si pas de champ username mais un champ email, utiliser celui-ci
    usernameField = fields.find(f => f.type === "email")?.element as HTMLInputElement;
  } else {
    // Méthode de secours: rechercher par type et attributs
    const potentialUsernameFields = Array.from(document.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input[type="email"], input:not([type]), input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"], input[class*="user"], input[class*="email"]'
    ));

    // Filtrer les champs visibles
    const visibleFields = potentialUsernameFields.filter(field => isVisibleElement(field));

    if (visibleFields.length > 0) {
      // Préférer les champs qui sont directement dans un formulaire
      const formFields = visibleFields.filter(field => field.closest('form'));
      usernameField = formFields.length > 0 ? formFields[0] : visibleFields[0];
    }
  }

  // Remplir le champ de nom d'utilisateur
  if (usernameField) {
    // Essayer de simuler une saisie utilisateur plus authentique
    usernameField.focus();
    usernameField.value = username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    usernameField.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    usernameField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    usernameField.blur();
  }

  // Remplir le champ de mot de passe
  let passwordField: HTMLInputElement | null = null;

  if (fields.some(f => f.type === "password")) {
    passwordField = fields.find(f => f.type === "password")?.element as HTMLInputElement;
  } else {
    // Méthode de secours: rechercher par type
    const passwordFields = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]'));

    // Filtrer les champs visibles
    const visibleFields = passwordFields.filter(field => isVisibleElement(field));

    if (visibleFields.length > 0) {
      passwordField = visibleFields[0];
    }
  }

  // Remplir le champ de mot de passe
  if (passwordField) {
    // Essayer de simuler une saisie utilisateur plus authentique
    passwordField.focus();
    passwordField.value = password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    passwordField.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    passwordField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    passwordField.blur();
  }

  // Tenter de soumettre le formulaire automatiquement si un bouton de soumission est présent
  setTimeout(() => {
    // Chercher le formulaire parent
    let form: HTMLFormElement | null = null;

    if (passwordField && passwordField.closest('form')) {
      form = passwordField.closest('form');
    } else if (usernameField && usernameField.closest('form')) {
      form = usernameField.closest('form');
    }

    // Si un formulaire est trouvé, tenter de le soumettre
    if (form) {
      // Chercher un bouton de soumission dans le formulaire
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"], button:not([type]), button[class*="login"], button[class*="submit"], input[class*="login"], input[class*="submit"]');

      if (submitButton) {
        (submitButton as HTMLElement).click();
      } else {
        // Si aucun bouton n'est trouvé, essayer de soumettre le formulaire directement
        try {
          form.requestSubmit();
        } catch (e) {
          try {
            form.submit();
          } catch (e2) {
            console.error('Impossible de soumettre le formulaire:', e2);
          }
        }
      }
    } else {
      // Si aucun formulaire n'est trouvé, chercher un bouton de connexion sur la page
      const loginButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type]), button[class*="login"], button[class*="submit"], input[class*="login"], input[class*="submit"]');

      if (loginButtons.length > 0) {
        // Filtrer les boutons visibles
        const visibleButtons = Array.from(loginButtons).filter(button => isVisibleElement(button as HTMLElement));

        if (visibleButtons.length > 0) {
          (visibleButtons[0] as HTMLElement).click();
        }
      }
    }
  }, 1000); // Augmenter le délai pour laisser plus de temps aux sites de traiter les entrées
}

/**
 * Affiche un menu de confirmation pour l'autofill OTP
 * @param credential Identifiant avec OTP à utiliser
 */
function showOTPConfirmationMenu(credential: Credential): void {
  // Supprimer tout menu existant
  const existingMenu = document.getElementById('skapauto-otp-confirmation-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Créer le menu
  const menu = document.createElement('div');
  menu.id = 'skapauto-otp-confirmation-menu';
  menu.style.position = 'fixed';
  menu.style.top = '10px';
  menu.style.right = '10px';
  menu.style.backgroundColor = '#ced7e1';
  menu.style.borderRadius = '0.5rem';
  menu.style.padding = '16px';
  menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  menu.style.zIndex = '9999';
  menu.style.maxWidth = '300px';
  menu.style.fontFamily = "'Work Sans', sans-serif";
  menu.style.transition = 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out';

  // Ajouter un titre
  const title = document.createElement('div');
  title.textContent = 'Confirmer l\'autofill OTP';
  title.style.fontFamily = "'Raleway', sans-serif";
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.borderBottom = '1px solid #1d1b21';
  title.style.paddingBottom = '5px';
  title.style.color = '#1d1b21';
  menu.appendChild(title);

  // Ajouter les informations du compte
  const info = document.createElement('div');
  info.style.marginBottom = '10px';
  info.style.padding = '5px';

  const usernameSpan = document.createElement('div');
  usernameSpan.textContent = `Nom d'utilisateur: ${credential.username}`;
  usernameSpan.style.fontWeight = 'bold';
  usernameSpan.style.color = '#1d1b21';
  info.appendChild(usernameSpan);

  const serviceSpan = document.createElement('div');
  serviceSpan.textContent = `Service: ${credential.url}`;
  serviceSpan.style.color = '#474b4f';
  serviceSpan.style.fontSize = '0.9em';
  info.appendChild(serviceSpan);

  menu.appendChild(info);

  // Conteneur pour les boutons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginTop = '16px';

  // Bouton Accepter
  const acceptButton = document.createElement('div');
  acceptButton.textContent = 'Accepter';
  acceptButton.style.flex = '1';
  acceptButton.style.textAlign = 'center';
  acceptButton.style.padding = '8px';
  acceptButton.style.backgroundColor = '#a7f3ae';
  acceptButton.style.color = '#1d1b21';
  acceptButton.style.borderRadius = '0.375rem';
  acceptButton.style.cursor = 'pointer';
  acceptButton.style.transition = 'all 0.2s ease-in-out';
  acceptButton.addEventListener('mouseover', () => {
    acceptButton.style.opacity = '0.9';
    acceptButton.style.transform = 'translateY(-1px)';
  });
  acceptButton.addEventListener('mouseout', () => {
    acceptButton.style.opacity = '1';
    acceptButton.style.transform = 'translateY(0)';
  });
  acceptButton.addEventListener('click', async () => {
    const otpCode = await generateTOTPCode(credential.otp!);
    if (otpCode) {
      fillOTPField(otpCode);
    } else {
      console.error('Impossible de générer le code OTP');
    }
    menu.remove();
  });

  // Bouton Annuler
  const cancelButton = document.createElement('div');
  cancelButton.textContent = 'Annuler';
  cancelButton.style.flex = '1';
  cancelButton.style.textAlign = 'center';
  cancelButton.style.padding = '8px';
  cancelButton.style.backgroundColor = '#f2c3c2';
  cancelButton.style.color = '#1d1b21';
  cancelButton.style.borderRadius = '0.375rem';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.transition = 'all 0.2s ease-in-out';
  cancelButton.addEventListener('mouseover', () => {
    cancelButton.style.opacity = '0.9';
    cancelButton.style.transform = 'translateY(-1px)';
  });
  cancelButton.addEventListener('mouseout', () => {
    cancelButton.style.opacity = '1';
    cancelButton.style.transform = 'translateY(0)';
  });
  cancelButton.addEventListener('click', () => {
    menu.remove();
  });

  buttonContainer.appendChild(acceptButton);
  buttonContainer.appendChild(cancelButton);
  menu.appendChild(buttonContainer);

  // Ajouter le menu à la page
  document.body.appendChild(menu);

  // Ajouter l'effet de survol sur le menu
  menu.addEventListener('mouseover', () => {
    menu.style.transform = 'translateY(-2px)';
    menu.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
  });
  menu.addEventListener('mouseout', () => {
    menu.style.transform = 'translateY(0)';
    menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  });

  // Fermer le menu après 30 secondes s'il n'a pas été fermé
  setTimeout(() => {
    if (document.getElementById('skapauto-otp-confirmation-menu')) {
      document.getElementById('skapauto-otp-confirmation-menu')!.remove();
    }
  }, 30000);
}

async function autoFillOTP(): Promise<void> {
  // Récupérer les identifiants correspondants
  const credentials = await getMatchingCredentials();

  // Si aucun identifiant ne correspond, ne rien faire
  if (credentials.length === 0) {
    console.log('Aucun identifiant correspondant trouvé pour OTP');
    return;
  }

  // Filtrer les identifiants qui ont un code OTP
  const credentialsWithOTP = credentials.filter(cred => cred.otp);

  if (credentialsWithOTP.length === 0) {
    console.log('Aucun identifiant avec OTP trouvé');
    return;
  }

  // Si un seul identifiant avec OTP correspond, afficher le menu de confirmation
  if (credentialsWithOTP.length === 1) {
    console.log('Un seul identifiant avec OTP trouvé, affichage du menu de confirmation');
    showOTPConfirmationMenu(credentialsWithOTP[0]);
    return;
  }

  // Si plusieurs identifiants avec OTP correspondent, afficher un menu de sélection
  console.log('Plusieurs identifiants avec OTP trouvés, affichage du menu de sélection');
  showOTPSelectionMenu(credentialsWithOTP);
}

/**
 * Affiche un menu de sélection pour choisir parmi plusieurs codes OTP
 * @param credentials Liste des identifiants disponibles avec OTP
 */
function showOTPSelectionMenu(credentials: Credential[]): void {
  // Supprimer tout menu existant
  const existingMenu = document.getElementById('skapauto-otp-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Créer le menu
  const menu = document.createElement('div');
  menu.id = 'skapauto-otp-menu';
  menu.style.position = 'fixed';
  menu.style.top = '10px';
  menu.style.right = '10px';
  menu.style.backgroundColor = '#ced7e1';
  menu.style.borderRadius = '0.5rem';
  menu.style.padding = '16px';
  menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  menu.style.zIndex = '9999';
  menu.style.maxWidth = '300px';
  menu.style.fontFamily = "'Work Sans', sans-serif";
  menu.style.transition = 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out';

  // Ajouter un titre
  const title = document.createElement('div');
  title.textContent = 'Choisir un compte pour OTP';
  title.style.fontFamily = "'Raleway', sans-serif";
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.borderBottom = '1px solid #1d1b21';
  title.style.paddingBottom = '5px';
  title.style.color = '#1d1b21';
  menu.appendChild(title);

  // Ajouter les options
  credentials.forEach((credential, index) => {
    const option = document.createElement('div');
    option.style.padding = '8px';
    option.style.cursor = 'pointer';
    option.style.borderBottom = index < credentials.length - 1 ? '1px solid #1d1b21' : 'none';
    option.style.transition = 'all 0.2s ease-in-out';

    // Conteneur pour les informations
    const infoContainer = document.createElement('div');

    // Service et favicon
    const serviceContainer = document.createElement('div');
    serviceContainer.style.display = 'flex';
    serviceContainer.style.alignItems = 'center';
    serviceContainer.style.marginBottom = '4px';

    if (credential.favicon) {
      const favicon = document.createElement('img');
      favicon.src = getFaviconUrl(credential.url || '');
      favicon.style.width = '16px';
      favicon.style.height = '16px';
      favicon.style.marginRight = '8px';
      serviceContainer.appendChild(favicon);
    }

    const serviceName = document.createElement('span');
    serviceName.textContent = credential.url || 'Identifiant';
    serviceName.style.fontWeight = 'bold';
    serviceName.style.color = '#1d1b21';
    serviceContainer.appendChild(serviceName);

    infoContainer.appendChild(serviceContainer);

    // Nom d'utilisateur
    const username = document.createElement('div');
    username.textContent = credential.username;
    username.style.fontSize = '0.9em';
    username.style.color = '#474b4f';
    infoContainer.appendChild(username);

    option.appendChild(infoContainer);

    // Effets de survol
    option.addEventListener('mouseover', () => {
      option.style.backgroundColor = '#f0f0f0';
      option.style.transform = 'translateX(5px)';
    });
    option.addEventListener('mouseout', () => {
      option.style.backgroundColor = 'transparent';
      option.style.transform = 'translateX(0)';
    });

    // Événement de clic
    option.addEventListener('click', () => {
      showOTPConfirmationMenu(credential);
      menu.remove();
    });

    menu.appendChild(option);
  });

  // Ajouter un bouton de fermeture
  const closeButton = document.createElement('div');
  closeButton.textContent = 'Fermer';
  closeButton.style.textAlign = 'center';
  closeButton.style.marginTop = '16px';
  closeButton.style.padding = '8px';
  closeButton.style.backgroundColor = '#f2c3c2';
  closeButton.style.color = '#1d1b21';
  closeButton.style.borderRadius = '0.375rem';
  closeButton.style.cursor = 'pointer';
  closeButton.style.transition = 'all 0.2s ease-in-out';

  closeButton.addEventListener('mouseover', () => {
    closeButton.style.opacity = '0.9';
    closeButton.style.transform = 'translateY(-1px)';
  });
  closeButton.addEventListener('mouseout', () => {
    closeButton.style.opacity = '1';
    closeButton.style.transform = 'translateY(0)';
  });
  closeButton.addEventListener('click', () => {
    menu.remove();
  });
  menu.appendChild(closeButton);

  // Ajouter le menu à la page
  document.body.appendChild(menu);

  // Ajouter l'effet de survol sur le menu
  menu.addEventListener('mouseover', () => {
    menu.style.transform = 'translateY(-2px)';
    menu.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
  });
  menu.addEventListener('mouseout', () => {
    menu.style.transform = 'translateY(0)';
    menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  });

  // Fermer le menu après 30 secondes s'il n'a pas été fermé
  setTimeout(() => {
    if (document.getElementById('skapauto-otp-menu')) {
      document.getElementById('skapauto-otp-menu')!.remove();
    }
  }, 30000);
}

/**
 * Remplit un champ OTP avec le code fourni
 * @param otp Code OTP à remplir
 */
function fillOTPField(otp: string): void {
  // Identifier les champs
  const fields = detectAutofillFields();
  console.log('Champs OTP identifiés:', fields.filter(f => f.type === "otp"));

  // Si des champs OTP sont trouvés, les remplir
  const otpFields = fields.filter(f => f.type === "otp");

  if (otpFields.length > 0) {
    // Vérifier s'il y a plusieurs champs pour les codes segmentés
    if (otpFields.length > 1 && otpFields.length <= otp.length) {
      // Remplir chaque champ avec un chiffre du code OTP
      otpFields.forEach((field, index) => {
        if (index < otp.length) {
          const inputField = field.element as HTMLInputElement;
          inputField.focus();
          inputField.value = otp[index];
          inputField.dispatchEvent(new Event('input', { bubbles: true }));
          inputField.dispatchEvent(new Event('change', { bubbles: true }));
          inputField.blur();
        }
      });
      console.log('Champs OTP multiples remplis avec:', otp);
    } else {
      // Remplir un seul champ avec le code OTP complet
      const otpField = otpFields[0].element as HTMLInputElement;
      otpField.focus();
      otpField.value = otp;
      otpField.dispatchEvent(new Event('input', { bubbles: true }));
      otpField.dispatchEvent(new Event('change', { bubbles: true }));
      otpField.blur();
      console.log('Champ OTP rempli avec:', otp);
    }

    // Tenter de soumettre le formulaire automatiquement
    setTimeout(() => {
      // Trouver le formulaire parent du premier champ OTP
      const form = otpFields[0].element.closest('form');

      // Si un formulaire est trouvé, tenter de le soumettre
      if (form) {
        // Chercher un bouton de soumission dans le formulaire
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"], button:not([type]), button[class*="verify"], button[class*="confirm"], button[class*="submit"]');

        if (submitButton) {
          (submitButton as HTMLElement).click();
        } else {
          // Si aucun bouton n'est trouvé, essayer de soumettre le formulaire directement
          try {
            form.requestSubmit();
          } catch (e) {
            try {
              form.submit();
            } catch (e2) {
              console.error('Impossible de soumettre le formulaire OTP:', e2);
            }
          }
        }
      } else {
        // Si aucun formulaire n'est trouvé, chercher un bouton de validation sur la page
        const verifyButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type]), button[class*="verify"], button[class*="confirm"], button[class*="submit"]');

        if (verifyButtons.length > 0) {
          // Filtrer les boutons visibles
          const visibleButtons = Array.from(verifyButtons).filter(button => isVisibleElement(button as HTMLElement));

          if (visibleButtons.length > 0) {
            (visibleButtons[0] as HTMLElement).click();
          }
        }
      }
    }, 1000); // Augmenter le délai pour laisser plus de temps aux sites de traiter les entrées
  } else {
    console.log('Aucun champ OTP trouvé');

    // Essai de détection alternative pour les champs OTP qui seraient masqués par des frameworks
    const potentialOtpFields = Array.from(document.querySelectorAll<HTMLInputElement>(
      'input[type="text"][maxlength="6"], input[type="number"][maxlength="6"], input[maxlength="6"], input[inputmode="numeric"], input[pattern="[0-9]*"]'
    )).filter(field => isVisibleElement(field));

    if (potentialOtpFields.length > 0) {
      potentialOtpFields[0].focus();
      potentialOtpFields[0].value = otp;
      potentialOtpFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      potentialOtpFields[0].dispatchEvent(new Event('change', { bubbles: true }));
      potentialOtpFields[0].blur();
      console.log('Champ OTP alternatif rempli avec:', otp);
    }
  }
}

/**
 * Génère un code TOTP à partir d'un URI OTP
 * @param otpUri URI OTP (otpauth://...)
 * @returns Code TOTP généré ou null en cas d'erreur
 */
async function generateTOTPCode(otpUri: string): Promise<string | null> {
  try {
    console.log('Génération du code TOTP à partir de l\'URI:', otpUri);

    // Vérifier si l'URI est valide
    if (!otpUri.startsWith('otpauth://')) {
      console.error('URI OTP invalide:', otpUri);
      return null;
    }

    // Extraire les paramètres de l'URI
    const params = parseTOTPUri(otpUri);
    if (!params) {
      console.error('Impossible de parser l\'URI OTP');
      return null;
    }

    // Générer le code TOTP
    const code = await calculateTOTP(params);
    console.log('Code TOTP généré:', code);
    return code;
  } catch (error) {
    console.error('Erreur lors de la génération du code TOTP:', error);
    return null;
  }
}


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

/**
 * Parse un URI OTP pour extraire les paramètres
 * @param uri URI OTP (otpauth://...)
 * @returns Paramètres TOTP ou null en cas d'erreur
 */
function parseTOTPUri(uri: string): TOTPParams | null {
  try {
    // Format: otpauth://totp/Label?secret=SECRET&issuer=ISSUER&algorithm=ALGORITHM&digits=DIGITS&period=PERIOD
    const url = new URL(uri);

    // Vérifier si c'est un URI TOTP
    if (url.protocol !== 'otpauth:' || url.host !== 'totp') {
      console.error('URI non TOTP:', uri);
      return null;
    }

    // Extraire les paramètres
    const params = new URLSearchParams(url.search);
    const secret = params.get('secret');

    if (!secret) {
      console.error('Secret manquant dans l\'URI OTP');
      return null;
    }

    // Extraire les autres paramètres avec des valeurs par défaut
    const algorithm = params.get('algorithm') || 'SHA1';
    const digits = parseInt(params.get('digits') || '6');
    const period = parseInt(params.get('period') || '30');

    return {
      secret,
      algorithm,
      digits,
      period
    };
  } catch (error) {
    console.error('Erreur lors du parsing de l\'URI OTP:', error);
    return null;
  }
}

/**
 * Calcule un code TOTP à partir des paramètres
 * @param params Paramètres TOTP
 * @returns Code TOTP généré
 */
async function calculateTOTP(params: TOTPParams): Promise<string> {
  // Demander au background script de générer le code TOTP
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage({
      action: 'generateTOTP',
      params: params
    }).then((response) => {
      if (response && response.success && response.code) {
        resolve(response.code);
      } else {
        reject(new Error(response?.message || 'Erreur lors de la génération du code TOTP'));
      }
    });
  });
}

/**
 * Détecte la soumission d'un formulaire de connexion
 */
function setupFormSubmissionDetection(): void {
  // Observer les événements de soumission de formulaire
  document.addEventListener('submit', async (event) => {
    // Identifier les champs de formulaire
    const fields = detectAutofillFields();

    // Vérifier si c'est un formulaire de connexion
    if (fields.some(f => f.type === "password") && (fields.some(f => f.type === "name") || fields.some(f => f.type === "email"))) {
      // Récupérer les valeurs des champs
      const passwordValue = fields.find(f => f.type === "password")?.element.value;
      const usernameValue = fields.some(f => f.type === "name")
        ? fields.find(f => f.type === "name")?.element.value
        : fields.some(f => f.type === "email") ? fields.find(f => f.type === "email")?.element.value : '';

      if (passwordValue && usernameValue) {
        // Vérifier si ces identifiants existent déjà
        const existingCredentials = await getMatchingCredentials();
        const credentialExists = existingCredentials.some(cred =>
          cred.username === usernameValue && cred.password === passwordValue
        );

        // Si les identifiants n'existent pas encore, proposer de les enregistrer
        if (!credentialExists) {
          // Attendre un peu pour laisser le formulaire se soumettre
          setTimeout(() => {
            showSaveCredentialsModal(usernameValue, passwordValue);
          }, 500);
        }
      }
    }
  });

  // Observer les clics sur les boutons de connexion
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    console.log(target.tagName);
    if (target.tagName === 'BUTTON' ||
      (target.tagName === 'INPUT' && (target.getAttribute('type') === 'submit' || target.getAttribute('type') === 'button')) || (target.tagName === 'BUTTON' && target.getAttribute('type') === 'submit')) {

      // Vérifier si le bouton est dans un formulaire de connexion
      const fields = detectAutofillFields();
      if (fields.some(f => f.type === "password") && (fields.some(f => f.type === "name") || fields.some(f => f.type === "email"))) {
        // Récupérer les valeurs des champs
        const passwordValue = fields.find(f => f.type === "password")?.element.value;
        const usernameValue = fields.some(f => f.type === "name")
          ? fields.find(f => f.type === "name")?.element.value
          : fields.some(f => f.type === "email") ? fields.find(f => f.type === "email")?.element.value : '';

        if (passwordValue && usernameValue) {
          // Vérifier si ces identifiants existent déjà
          const existingCredentials = await getMatchingCredentials();
          const credentialExists = existingCredentials.some(cred =>
            cred.username === usernameValue && cred.password === passwordValue
          );

          // Si les identifiants n'existent pas encore, proposer de les enregistrer
          if (!credentialExists) {
            // Attendre un peu pour laisser le formulaire se soumettre
            setTimeout(() => {
              showSaveCredentialsModal(usernameValue, passwordValue);
            }, 500);
          }
        }
      }
    }
  });
}

/**
 * Affiche une modal pour proposer d'enregistrer les identifiants
 * @param username Nom d'utilisateur
 * @param password Mot de passe
 */
function showSaveCredentialsModal(username: string, password: string): void {
  // Supprimer toute modal existante
  const existingModal = document.getElementById('skapauto-save-credentials-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Créer la modal
  const modal = document.createElement('div');
  modal.id = 'skapauto-save-credentials-modal';
  modal.style.position = 'fixed';
  modal.style.top = '10px';
  modal.style.right = '10px';
  modal.style.backgroundColor = '#ced7e1';
  modal.style.borderRadius = '0.5rem';
  modal.style.padding = '16px';
  modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  modal.style.zIndex = '9999';
  modal.style.maxWidth = '300px';
  modal.style.fontFamily = "'Work Sans', sans-serif";
  modal.style.transition = 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, opacity 0.3s ease-in-out';

  // Ajouter un titre
  const title = document.createElement('div');
  title.textContent = 'Enregistrer les identifiants';
  title.style.fontFamily = "'Raleway', sans-serif";
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.borderBottom = '1px solid #1d1b21';
  title.style.paddingBottom = '5px';
  title.style.color = '#1d1b21';
  modal.appendChild(title);

  // Informations sur les identifiants
  const info = document.createElement('div');
  info.style.marginBottom = '10px';
  info.style.padding = '5px';

  const usernameSpan = document.createElement('div');
  usernameSpan.textContent = `Utilisateur: ${username}`;
  usernameSpan.style.fontWeight = 'bold';
  usernameSpan.style.color = '#1d1b21';
  info.appendChild(usernameSpan);

  const passwordSpan = document.createElement('div');
  passwordSpan.textContent = `Mot de passe: ${'•'.repeat(password.length)}`;
  passwordSpan.style.color = '#474b4f';
  passwordSpan.style.fontSize = '0.9em';
  info.appendChild(passwordSpan);

  const serviceSpan = document.createElement('div');
  serviceSpan.textContent = `Service: ${window.location.hostname}`;
  serviceSpan.style.color = '#474b4f';
  serviceSpan.style.fontSize = '0.9em';
  info.appendChild(serviceSpan);

  modal.appendChild(info);

  // Conteneur pour les boutons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';

  // Bouton Enregistrer
  const saveButton = document.createElement('div');
  saveButton.textContent = 'Enregistrer';
  saveButton.style.flex = '1';
  saveButton.style.textAlign = 'center';
  saveButton.style.padding = '8px';
  saveButton.style.backgroundColor = '#a7f3ae';
  saveButton.style.color = '#1d1b21';
  saveButton.style.borderRadius = '0.375rem';
  saveButton.style.cursor = 'pointer';
  saveButton.style.transition = 'all 0.2s ease-in-out';

  saveButton.addEventListener('mouseover', () => {
    saveButton.style.opacity = '0.9';
    saveButton.style.transform = 'translateY(-1px)';
  });

  saveButton.addEventListener('mouseout', () => {
    saveButton.style.opacity = '1';
    saveButton.style.transform = 'translateY(0)';
  });

  saveButton.addEventListener('click', () => {
    // Créer un nouvel identifiant
    const newCredential: Credential = {
      username: username,
      password: password,
      url: window.location.hostname,
      description: document.title || window.location.hostname,
      favicon: getFaviconUrl(window.location.hostname)
    };

    // Envoyer au background script pour enregistrement
    browser.runtime.sendMessage({
      action: 'saveNewCredential',
      credential: newCredential
    }).then((response) => {
      if (response && response.success) {
        // Animation de disparition
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.remove();
          showNotification('Identifiants enregistrés avec succès!', 'success');
        }, 300);
      } else {
        showNotification('Erreur lors de l\'enregistrement des identifiants.', 'error');
      }
    });
  });

  // Bouton Annuler
  const cancelButton = document.createElement('div');
  cancelButton.textContent = 'Annuler';
  cancelButton.style.flex = '1';
  cancelButton.style.textAlign = 'center';
  cancelButton.style.padding = '8px';
  cancelButton.style.backgroundColor = '#f2c3c2';
  cancelButton.style.color = '#1d1b21';
  cancelButton.style.borderRadius = '0.375rem';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.transition = 'all 0.2s ease-in-out';

  cancelButton.addEventListener('mouseover', () => {
    cancelButton.style.opacity = '0.9';
    cancelButton.style.transform = 'translateY(-1px)';
  });

  cancelButton.addEventListener('mouseout', () => {
    cancelButton.style.opacity = '1';
    cancelButton.style.transform = 'translateY(0)';
  });

  cancelButton.addEventListener('click', () => {
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.remove();
    }, 300);
  });

  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);
  modal.appendChild(buttonContainer);

  // Ajouter la modal au document
  document.body.appendChild(modal);

  // Ajouter l'effet de survol sur le menu
  modal.addEventListener('mouseover', () => {
    modal.style.transform = 'translateY(-2px)';
    modal.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
  });

  modal.addEventListener('mouseout', () => {
    modal.style.transform = 'translateY(0)';
    modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  });

  // Fermer le menu après 30 secondes s'il n'a pas été fermé
  setTimeout(() => {
    if (document.getElementById('skapauto-save-credentials-modal')) {
      const modalElement = document.getElementById('skapauto-save-credentials-modal')!;
      modalElement.style.opacity = '0';
      setTimeout(() => {
        modalElement.remove();
      }, 300);
    }
  }, 30000);
}

/**
 * Affiche une notification temporaire
 * @param message Message à afficher
 * @param type Type de notification (success, error, info)
 */
function showNotification(message: string, type: 'success' | 'error' | 'info'): void {
  // Créer la notification
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '10000';
  notification.style.padding = '12px 16px';
  notification.style.borderRadius = '4px';
  notification.style.fontFamily = 'Arial, sans-serif';
  notification.style.fontSize = '14px';
  notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  notification.style.transition = 'all 0.3s ease-in-out';
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(20px)';

  // Définir le style en fonction du type
  if (type === 'success') {
    notification.style.backgroundColor = '#4caf50';
    notification.style.color = 'white';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#2196f3';
    notification.style.color = 'white';
  }

  notification.textContent = message;

  // Ajouter au document
  document.body.appendChild(notification);

  // Animation d'entrée
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';

    // Auto-fermeture après 3 secondes
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(20px)';

      // Supprimer après la fin de l'animation
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }, 10);
}

// Fonction à injecter dans la page pour sélectionner un fichier
function injectFileSelector() {

}

// Exporter une fonction vide pour que le bundler ne se plaigne pas
export { };
