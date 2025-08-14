
export interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
}

export interface Factura {
  id: string;
  fecha: string;
  ruc: string;
  proveedor: string;
  factura: string;
  autorizacion: string;
  xmlPath: string;
}

export interface CompraItem {
  id: string;
  code: string;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precio: number;
}

export interface XmlItem {
  codigoPrincipal: string;
  codigoAuxiliar: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  numeroLote: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
}
