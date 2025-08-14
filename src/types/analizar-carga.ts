
export interface Laboratory {
  id: string;
  name: string;
  description?: string;
  isactive?: boolean;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  isactive?: boolean;
}

export interface SateliteView {
  idsatelite: string;
  local: string;
  locationName: string;
  laboratorio: string;
  product: string;
  productName: string;
  presentacion: number;
  idlote: string;
  numerolote: string;
  cantidadCajas: number;
  unidades: number;
  fechafabricacion?: string;
  fechavencimiento?: string;
  fechainsert?: string;
  operador: string;
}

export interface FilterParams {
  productId?: string;
  productName?: string;
  laboratory?: string;
  location?: string;
  lotNumber?: string;
  expirationFilter?: string;
  filteredData?: SateliteView[];
}
