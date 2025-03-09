// Fonctions d'encodage binaire pour les clients
import * as pkg from "uuid-tool";
const { Uuid } = pkg;

export interface Client {
  ky_p: { data: Uint8Array };
  ky_q: { data: Uint8Array };
  di_p: { data: Uint8Array };
  di_q: { data: Uint8Array };
  secret: Uint8Array;
}

export interface ClientEx {
  c: Client;
  id: {
    email: string;
    id: { bytes: Uint8Array } | null;
    ky_p: { data: Uint8Array };
    di_p: { data: Uint8Array };
  };
}

export class BincodeEncoder {
  private buffer: Uint8Array;
  private position: number;

  constructor(initialSize = 1024) {
    this.buffer = new Uint8Array(initialSize);
    this.position = 0;
  }

  private ensureCapacity(additionalBytes: number) {
    if (this.position + additionalBytes > this.buffer.length) {
      const newBuffer = new Uint8Array(this.buffer.length * 2);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
  }

  private writeUint8(value: number) {
    this.ensureCapacity(1);
    this.buffer[this.position++] = value;
  }

  private writeUint32(value: number) {
    this.ensureCapacity(4);
    this.buffer[this.position++] = value & 0xFF;
    this.buffer[this.position++] = (value >> 8) & 0xFF;
    this.buffer[this.position++] = (value >> 16) & 0xFF;
    this.buffer[this.position++] = (value >> 24) & 0xFF;
  }

  private writeBytes(bytes: Uint8Array) {
    this.ensureCapacity(bytes.length);
    this.buffer.set(bytes, this.position);
    this.position += bytes.length;
  }

  private writeString(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.writeUint32(bytes.length);
    this.writeBytes(bytes);
  }

  private writeOption<T>(value: T | null, writer: (val: T) => void) {
    if (value === null) {
      this.writeUint8(0);
    } else {
      this.writeUint8(1);
      writer(value);
    }
  }

  public encodeClientEx(clientEx: ClientEx): Uint8Array {
    // Encoder le client
    this.encodeClient(clientEx.c);
    
    // Encoder l'ID
    this.writeString(clientEx.id.email);
    
    // Encoder l'UUID (option)
    this.writeOption(clientEx.id.id, (id) => {
      this.writeBytes(id.bytes);
    });
    
    // Encoder les clés publiques
    this.writeBytes(clientEx.id.ky_p.data);
    this.writeBytes(clientEx.id.di_p.data);
    
    // Retourner le buffer tronqué à la taille utilisée
    return this.buffer.slice(0, this.position);
  }

  private encodeClient(client: Client) {
    // Encoder les clés
    this.writeBytes(client.ky_p.data);
    this.writeBytes(client.ky_q.data);
    this.writeBytes(client.di_p.data);
    this.writeBytes(client.di_q.data);
    this.writeBytes(client.secret);
  }

  // Fonction utilitaire pour créer un UUID à partir d'une chaîne
  public static createUuid(uuidStr: string): { bytes: Uint8Array } {
    const uuid = new Uuid(uuidStr);
    return {
      bytes: new Uint8Array(uuid.toBytes())
    };
  }
}

// Fonction d'exemple pour encoder un ClientEx
export function encodeExampleClientEx(clientEx: ClientEx): Uint8Array {
  const encoder = new BincodeEncoder();
  return encoder.encodeClientEx(clientEx);
} 