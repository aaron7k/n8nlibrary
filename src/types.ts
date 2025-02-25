export interface Workflow {
  nombre: string;
  json: string;
  url: string;
  imagen: string;
  loom: string | null;
  descripcion: string;
  fecha: string;
  precio: number;
}

export interface VoiceAgent {
  nombre: string;
  imagen: string;
  loom: string | null;
  descripcion: string | null;
  fecha: string;
  precio: number;
  url: string;
}

export type LibraryType = 'n8n' | 'flowise' | 'retell';
