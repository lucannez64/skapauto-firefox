// Types et fonctions pour le décodage des mots de passe
import * as pkg from "uuid-tool";
const { Uuid } = pkg;

export interface Password {
  password: string;
  app_id: string | null;
  username: string;
  description: string | null;
  url: string | null;
  otp: string | null;
}

export interface EP {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  nonce2: Uint8Array | null;
}

export interface Uuid {
  bytes: Uint8Array;
}

export interface Client {
  ky_p: Uint8Array;
  ky_q: Uint8Array;
  di_p: Uint8Array;
  di_q: Uint8Array;
  secret: Uint8Array | null;
}

export interface CK {
  email: string;
  id: Uuid | null;
  ky_p: KyPublicKey;
  di_p: DiPublicKey;
}

export interface KyPublicKey {
  bytes: Uint8Array;
}

export interface DiPublicKey {
  bytes: Uint8Array;
}

export interface ClientEx {
  c: Client;
  id: CK;
}

// Constantes pour les tailles des clés
const KyPublicKeySize = 1568;
const KySecretKeySize = 3168;
const DiPublicKeySize = 2592;
const DiSecretKeySize = 4896;

/**
 * Encodes Password struct to Uint8Array
 * @param {Password} passwordObject
 * @returns {Uint8Array | null}
 */
export function encodePassword(passwordObject: Password) {
  // Check that required fields are provided
  if (
    !passwordObject ||
    typeof passwordObject.password !== "string" ||
    typeof passwordObject.username !== "string"
  ) {
    console.error(
      "encodePassword: Missing required fields 'password' and/or 'username'.",
    );
    return null;
  }

  /**
   * Encodes a string into a Uint8Array following the format expected by readString.
   *
   * Format:
   * - 1 byte: length of the encoded string (as given by TextEncoder)
   * - 7 bytes: reserved (set to 0)
   * - n bytes: the UTF-8 encoded string bytes
   */
  function encodeString(str: string) {
    const encoder = new TextEncoder();
    const encodedStr = encoder.encode(str);
    const len = encodedStr.length;

    // Create a new Uint8Array to hold the header (8 bytes) + encoded string data.
    const result = new ArrayBuffer(8 + len);
    const view = new DataView(result);
    let offset = 0;
    const bigNum = BigInt(len);
    view.setBigUint64(offset, bigNum, true);
    offset += 8;
    // The next 7 bytes are reserved (they are already 0 by default)
    // Copy the encoded string starting at offset 8.
    if (len > 0) {
      for (let i = 0; i < len; ++i) {
        view.setUint8(offset++, encodedStr[i]);
      }
    }
    const result2 = new Uint8Array(result);
    return result2;
  }

  /**
   * Helper to encode an optional string field.
   *
   * Returns an object with a flag Uint8Array and, if present, the encoded string.
   */
  function encodeOptional(str: any | null | undefined) {
    if (str !== undefined && str !== null) {
      const flag = new Uint8Array([1]);
      const encodedString = encodeString(str);
      return { flag, encodedString };
    } else {
      const flag = new Uint8Array([0]);
      return { flag, encodedString: null };
    }
  }

  // Parts will hold each Uint8Array fragment of the overall byte stream.
  const parts = [];

  // 1. Encode the password (required)
  parts.push(encodeString(passwordObject.password));

  // 2. Encode the app_id (optional)
  const appIdObj = encodeOptional(passwordObject.app_id);
  parts.push(appIdObj.flag);
  if (appIdObj.encodedString) {
    parts.push(appIdObj.encodedString);
  }

  // 3. Encode the username (required)
  parts.push(encodeString(passwordObject.username));

  // 4. Encode the description (optional)
  const descriptionObj = encodeOptional(passwordObject.description);
  parts.push(descriptionObj.flag);
  if (descriptionObj.encodedString) {
    parts.push(descriptionObj.encodedString);
  }

  // 5. Encode the url (optional)
  const urlObj = encodeOptional(passwordObject.url);
  parts.push(urlObj.flag);
  if (urlObj.encodedString) {
    parts.push(urlObj.encodedString);
  }

  // 6. Encode the otp (optional)
  const otpObj = encodeOptional(passwordObject.otp);
  parts.push(otpObj.flag);
  if (otpObj.encodedString) {
    parts.push(otpObj.encodedString);
  }

  // Calculate total length of the output buffer.
  const totalLength = parts.reduce((acc, part) => acc + part.length, 0);
  const combined = new Uint8Array(totalLength);

  // Copy each part into the combined output.
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return combined;
}

/**
 * Decodes a Password object from a Uint8Array of bytes.
 *
 * @param {Uint8Array} bytes - The byte array to decode.
 * @returns {Password|null} - An object containing the decoded Password and remaining bytes, or null if decoding fails.
 */
export function decodePassword(bytes: Uint8Array) {
  let offset = 0;

  if (!bytes || !(bytes instanceof Uint8Array)) {
    console.error("decodePassword: Input is not a valid Uint8Array.");
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  function readString(bytes: Uint8Array, offset: number) {
    if (!bytes || !(bytes instanceof Uint8Array)) {
      console.error("decodeString: Input is not a valid Uint8Array.");
      return null;
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const len = Number(view.getBigUint64(offset, true));
    offset += 8;
    if (offset + len > bytes.byteLength) return null; // MalformedData or EndOfStream

    const strBytes = bytes.slice(offset, offset + len);
    const decoder = new TextDecoder();
    const str = decoder.decode(strBytes);
    return { str: str, bytesRead: 8 + len };
  }

  // Decode password
  let passwordResult = readString(bytes, offset);
  if (!passwordResult) return null;
  let password = passwordResult.str;
  offset += passwordResult.bytesRead;

  // Decode app_id
  const appIdPresent = view.getUint8(offset);

  let app_id = null;
  if (appIdPresent === 1) {
    offset++;
    let appResult = readString(bytes, offset);
    if (!appResult) return null;
    app_id = appResult.str;
    offset += appResult.bytesRead;
  } else if (appIdPresent !== 0) {
    return null; // MalformedData
  } else {
    offset++;
  }

  // Decode username
  let usernameResult = readString(bytes, offset);

  if (!usernameResult) return null;
  let username = usernameResult.str;
  offset += usernameResult.bytesRead;
  // Decode description
  const descriptionPresent = view.getUint8(offset);
  let description = null;
  if (descriptionPresent === 1) {
    offset++;
    let descriptionResult = readString(bytes, offset);
    if (!descriptionResult) return null;
    description = descriptionResult.str;
    offset += descriptionResult.bytesRead;
  } else if (descriptionPresent !== 0) {
    return null; // MalformedData
  } else {
    offset++;
  }

  // Decode url
  const urlPresent = view.getUint8(offset);

  let url = null;
  if (urlPresent === 1) {
    offset++;
    let urlResult = readString(bytes, offset);
    if (!urlResult) return null;
    url = urlResult.str;
    offset += urlResult.bytesRead;
  } else if (urlPresent !== 0) {
    return null; // MalformedData
  } else {
    offset++;
  }

  // Decode otp
  const otpPresent = view.getUint8(offset);
  let otp = null;
  if (otpPresent === 1) {
    offset++;
    let otpResult = readString(bytes, offset);
    if (!otpResult) return null;
    otp = otpResult.str;
    offset += otpResult.bytesRead;
  } else if (otpPresent !== 0) {
    return null; // MalformedData
  } else {
    offset++;
  }

  const passwordObject = {
    password: password,
    app_id: app_id,
    username: username,
    description: description,
    url: url,
    otp: otp,
  };

  return passwordObject;
}

// Fonction pour convertir un UUID en chaîne de caractères
export function uuidToStr(uuid: Uuid): string {
  try {
    const uuidBytes = new Uint8Array(uuid.bytes);
    let uuidBytes2 = new Array(uuidBytes.length);
    for (let i = 0; i < uuidBytes.length; i++) {
      uuidBytes2[i] = uuidBytes[i];
    }
    const uuidObj = new Uuid(uuidBytes2);
    return uuidObj.toString();
  } catch (e) {
    console.error("Erreur lors de la conversion de l'UUID en chaîne:", e);
    return "";
  }
}

/**
 * Décode une chaîne de caractères à partir d'un tableau d'octets
 * @param bytes Tableau d'octets à décoder
 * @returns Objet contenant la chaîne décodée et le nombre d'octets lus
 */
function decodeString(bytes: Uint8Array): { str: string | null, bytesRead: number } | null {
  if (!bytes || !(bytes instanceof Uint8Array)) {
    console.error("decodeString: L'entrée n'est pas un Uint8Array valide.");
    return null;
  }
  
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  const len = Number(view.getBigUint64(offset, true));
  offset += 8;
  
  if (offset + len > bytes.byteLength) {
    return null; // Données malformées ou fin du flux
  }

  const strBytes = bytes.slice(offset, offset + len);
  const decoder = new TextDecoder();
  const str = decoder.decode(strBytes);
  
  return { str: str, bytesRead: 8 + len };
}

/**
 * Décode une clé publique KyPublicKey à partir d'un tableau d'octets
 * @param bytes Tableau d'octets à décoder
 * @returns Objet contenant la clé décodée
 */
function decodeKyPublicKey(bytes: Uint8Array): { key: Uint8Array | null } | null {
  if (bytes.length < KyPublicKeySize) {
    return null; // Données malformées ou fin du flux
  }
  
  const key = bytes.slice(0, KyPublicKeySize);
  return { key: key };
}

/**
 * Décode une clé secrète KySecretKey à partir d'un tableau d'octets
 * @param bytes Tableau d'octets à décoder
 * @returns Objet contenant la clé décodée
 */
function decodeKySecretKey(bytes: Uint8Array): { key: Uint8Array | null } | null {
  if (bytes.length < KySecretKeySize) {
    return null; // Données malformées ou fin du flux
  }
  
  const key = bytes.slice(0, KySecretKeySize);
  return { key: key };
}

/**
 * Décode une clé publique DiPublicKey à partir d'un tableau d'octets
 * @param bytes Tableau d'octets à décoder
 * @returns Objet contenant la clé décodée
 */
function decodeDiPublicKey(bytes: Uint8Array): { key: Uint8Array | null } | null {
  if (bytes.length < DiPublicKeySize) {
    return null; // Données malformées ou fin du flux
  }
  
  const key = bytes.slice(0, DiPublicKeySize);
  return { key: key };
}

/**
 * Décode une clé secrète DiSecretKey à partir d'un tableau d'octets
 * @param bytes Tableau d'octets à décoder
 * @returns Objet contenant la clé décodée
 */
function decodeDiSecretKey(bytes: Uint8Array): { key: Uint8Array | null } | null {
  if (bytes.length < DiSecretKeySize) {
    return null; // Données malformées ou fin du flux
  }
  
  const key = bytes.slice(0, DiSecretKeySize);
  return { key: key };
}

/**
 * Décode un objet Client à partir d'un tableau d'octets
 * @param bytes Tableau d'octets à décoder
 * @returns Objet contenant le client décodé et les octets restants
 */
function decodeClient(bytes: Uint8Array): { client: Client | null, remainingBytes: Uint8Array | null } | null {
  let offset = 0;

  // Sauter les 8 octets de longueur pour les tableaux de taille fixe
  offset += 8; // Sauter la longueur de ky_p
  const ky_p_result = decodeKyPublicKey(bytes.slice(offset));
  if (!ky_p_result) return null;
  const ky_p = ky_p_result.key;
  offset += KyPublicKeySize;

  offset += 8; // Sauter la longueur de ky_q
  const ky_q_result = decodeKySecretKey(bytes.slice(offset));
  if (!ky_q_result) return null;
  const ky_q = ky_q_result.key;
  offset += KySecretKeySize;

  offset += 8; // Sauter la longueur de di_p
  const di_p_result = decodeDiPublicKey(bytes.slice(offset));
  if (!di_p_result) return null;
  const di_p = di_p_result.key;
  offset += DiPublicKeySize;

  offset += 8; // Sauter la longueur de di_q
  const di_q_result = decodeDiSecretKey(bytes.slice(offset));
  if (!di_q_result) return null;
  const di_q = di_q_result.key;
  offset += DiSecretKeySize;

  if (!bytes || !(bytes instanceof Uint8Array)) {
    console.error("decodeClient: L'entrée n'est pas un Uint8Array valide.");
    return null;
  }
  
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset + offset,
    bytes.byteLength - offset
  );
  
  offset = 0; // Réinitialiser l'offset pour la DataView relative aux octets restants

  const secretPresent = view.getUint8(offset++);
  let secret = null;
  
  if (secretPresent === 1) {
    if (offset + 32 > view.byteLength) return null; // Données malformées
    secret = bytes.slice(
      view.byteOffset + offset,
      view.byteOffset + offset + 32
    );
    offset += 32;
  } else if (secretPresent !== 0) {
    return null; // Données malformées
  }

  const client: Client = {
    ky_p: ky_p!,
    ky_q: ky_q!,
    di_p: di_p!,
    di_q: di_q!,
    secret: secret
  };
  
  return {
    client: client,
    remainingBytes: bytes.slice(view.byteOffset + offset)
  };
}

/**
 * Décode un objet CK à partir d'un tableau d'octets
 * @param bytes Tableau d'octets à décoder
 * @returns Objet contenant le CK décodé et les octets restants
 */
function decodeCK(bytes: Uint8Array): { ck: CK | null, remainingBytes: Uint8Array | null } | null {
  let offset = 0;

  const emailResult = decodeString(bytes);
  if (!emailResult) return null;
  const email = emailResult.str;
  offset += emailResult.bytesRead;

  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset + offset,
    bytes.byteLength - offset
  );
  
  offset = 0; // Réinitialiser l'offset pour la DataView relative aux octets restants

  const uuidPresent = view.getUint8(offset++);
  let uuid = null;
  
  if (uuidPresent === 1) {
    offset += 8; // Sauter la longueur de l'UUID
    const uuidBytes = bytes.slice(
      view.byteOffset + offset,
      view.byteOffset + offset + 16
    );
    
    if (uuidBytes.length !== 16) return null; // Données malformées
    uuid = { bytes: uuidBytes };
    offset += 16;
  } else if (uuidPresent !== 0) {
    return null; // Données malformées
  }

  offset += 8; // Sauter la longueur de ky_p
  const ky_p_result = decodeKyPublicKey(bytes.slice(view.byteOffset + offset));
  if (!ky_p_result) return null;
  const ky_p = ky_p_result.key;
  offset += KyPublicKeySize;

  offset += 8; // Sauter la longueur de di_p
  const di_p_result = decodeDiPublicKey(bytes.slice(view.byteOffset + offset));
  if (!di_p_result) return null;
  const di_p = di_p_result.key;
  offset += DiPublicKeySize;

  const ck: CK = { 
    email: email!, 
    id: uuid, 
    ky_p: { bytes: ky_p! }, 
    di_p: { bytes: di_p! } 
  };
  
  return { 
    ck: ck, 
    remainingBytes: bytes.slice(view.byteOffset + offset) 
  };
}

/**
 * Décode un objet ClientEx à partir d'un tableau d'octets ou d'un ArrayBuffer
 * @param bytes Tableau d'octets ou ArrayBuffer à décoder
 * @returns Objet ClientEx décodé ou null en cas d'erreur
 */
export function decodeClientEx(bytes: Uint8Array | ArrayBuffer): ClientEx | null {
  // Convertir ArrayBuffer en Uint8Array si nécessaire
  const uint8Array = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  
  const clientResult = decodeClient(uint8Array);
  if (!clientResult) return null;
  
  const client = clientResult.client;
  const remainingBytesAfterClient = clientResult.remainingBytes;

  const ckResult = decodeCK(remainingBytesAfterClient!);
  if (!ckResult) return null;
  
  const ck = ckResult.ck;

  return { c: client!, id: ck! };
} 