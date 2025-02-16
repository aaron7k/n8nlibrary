export interface Workflow {
  nombre: string;
  json: string;
  url: string;
  imagen: string;
  loom: string;
  descripcion: string;
  fecha: string;
  precio?: number;
}

export interface ApiResponse {
  data: Workflow[];
}
