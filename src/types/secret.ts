export interface Secret {
  id: string
  value: string
  nonce: string
  user_id: number
  title?: string
  description?: string
}

export interface NewSecret {
  value: string
  title?: string
  description?: string
}

export interface EncryptedSecret {
  value: string
  nonce: string
}

export type PlainSecret = {
  title: string
  description: string
  value: string
}


export interface DecodedSecret {
  id: string;
  user_id: number;
  value: string;
  nonce: string;
  decodedTitle: string;
  decodedDescription: string;
  decodedValue: string;
  isDecoded: boolean;
}