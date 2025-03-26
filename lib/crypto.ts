export async function generateKeyPair(): Promise<CryptoKeyPair> {
  try {
    console.log('Generating key pair...');
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
    console.log('Key pair generated successfully');
    return keyPair;
  } catch (error) {
    console.error('Key pair generation failed:', error);
    throw error;
  }
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  try {
    console.log('Exporting public key...');
    const exported = await window.crypto.subtle.exportKey("spki", key);
    const base64Key = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(exported))));
    console.log('Public key exported:', base64Key.slice(0, 50) + '...');
    return base64Key;
  } catch (error) {
    console.error('Public key export failed:', error);
    throw error;
  }
}

export async function importPublicKey(keyStr: string): Promise<CryptoKey> {
  try {
    console.log('Importing public key...');
    console.log('Input key string:', keyStr);
    const binaryKey = Uint8Array.from(atob(keyStr), c => c.charCodeAt(0));
    const importedKey = await window.crypto.subtle.importKey(
      "spki",
      binaryKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
    return importedKey;
  } catch (error) {
    console.error('Public key import failed:', error);
    console.error('Input key string:', keyStr);
    throw error;
  }
}

export async function encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      data
    );
    const base64Encrypted = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encrypted))));
    console.log('Encrypted message:', base64Encrypted.slice(0, 50) + '...');
    return base64Encrypted;
  } catch (error) {
    console.error('Message encryption failed:', error);
    throw error;
  }
}

export async function decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
  try {
        try {
      atob(encryptedMessage);
    } catch (base64Error) {
      console.error('Invalid Base64 string:', base64Error);
      throw new Error('Invalid Base64 encoded message');
    }

    const binaryMessage = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    
    const keyUsages = await window.crypto.subtle.exportKey('jwk', privateKey);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      binaryMessage
    );
    
    const decoder = new TextDecoder();
    const decryptedMessage = decoder.decode(decrypted);
    return decryptedMessage;
  } catch (error:any) {
    console.error('Detailed Decryption Error:', {
      message: error.message,
      stack: error.stack,
      encryptedMessage: encryptedMessage
    });
    throw error;
  }
}