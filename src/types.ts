export interface Archivo {
  title: string;
  path: string;
}

export interface Workflow {
  nombre: string;
  json: string;
  url: string;
  imagen: string;
  loom: string | null;
  descripcion: string;
  fecha: string;
  precio: number | null;
  archivo?: Archivo[];
}

export interface VoiceAgent {
  nombre: string;
  imagen: string;
  loom: string | null;
  descripcion: string | null;
  fecha: string;
  precio: number | null;
  url: string;
}

export type LibraryType = 'n8n' | 'flowise' | 'retell';
