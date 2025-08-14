
export interface InvoiceDetail {
  codigoPrincipal: string;
  codigoAuxiliar: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  lote?: string;
  fechaFabricacion?: string;
  fechaVencimiento?: string;
}

export interface InvoiceHeader {
  razonSocial: string;
  ruc: string;
  numeroFactura: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  fechaEmision: string;
}

const VALID_RUC = "0993370104001";

interface DetailInfo {
  lote?: string;
  fechaFabricacion?: string;
  fechaVencimiento?: string;
}

const formatDateToYearMonth = (dateStr: string): string => {
  if (!dateStr) return "";
  
  // Si la fecha está en formato YYYYMMDD (QUIFATEX)
  if (dateStr.match(/^\d{8}$/)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    return `${year}-${month}`;
  }

  // Si la fecha está en formato MM/YY
  if (dateStr.match(/^\d{2}\/\d{2}$/)) {
    const [month, year] = dateStr.split('/');
    return `20${year}-${month}`; // Asumimos años 2000+
  }
  
  // Si la fecha está en formato dd/MM/yyyy
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}`;
  }
  
  // Si la fecha está en formato dd-MM-yyyy
  if (dateStr.includes('-')) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}`;
  }
  
  // Si la fecha está en formato MMM-YY (ej: feb-23)
  if (dateStr.match(/^[a-zA-Z]{3}-\d{2}$/)) {
    const months: { [key: string]: string } = {
      'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
      'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
    };
    const [month, year] = dateStr.toLowerCase().split('-');
    return `20${year}-${months[month] || '01'}`;
  }
  
  // Si la fecha está en formato yyyy-MM-dd, extraer solo yyyy-MM
  return dateStr.substring(0, 7);
};

const extractAdditionalDetails = (detalle: Element): DetailInfo => {
  const detallesAdicionalesNode = detalle.getElementsByTagName("detallesAdicionales")[0];
  if (!detallesAdicionalesNode) return {};

  const detAdicionales = detallesAdicionalesNode.getElementsByTagName("detAdicional");
  const result: DetailInfo = {};

  // Verificamos si es el patrón de Bohorquez (tres tags con nombre "-")
  const tipoBohorquez = Array.from(detAdicionales).every(det => 
    det.getAttribute("nombre") === "-"
  );

  if (tipoBohorquez && detAdicionales.length >= 3) {
    // Proveedor: Bohorquez
    // Patrón: Segundo detAdicional es lote, tercero es fecha vencimiento
    const lote = detAdicionales[1]?.getAttribute("valor") || "";
    const fechaVenc = detAdicionales[2]?.getAttribute("valor") || "";
    
    result.lote = lote;
    result.fechaVencimiento = formatDateToYearMonth(fechaVenc);
    return result;
  }

  let hasProcessedEcuaquimica = false;

  for (let i = 0; i < detAdicionales.length; i++) {
    const detAdicional = detAdicionales[i];
    const nombreOriginal = detAdicional.getAttribute("nombre") || "";
    const nombre = nombreOriginal.toLowerCase();
    const valor = detAdicional.getAttribute("valor") || "";

    if (!valor) continue;

    try {
      // Proveedor: PROVENCO C LTDA
      // Patrón: Lote_cod con formato "lote: fecha (número)"
      if (nombre === "lote_cod") {
        const matches = valor.match(/(\d+):\s*(\d{4}-\d{2}-\d{2})/);
        if (matches) {
          result.lote = matches[1];
          result.fechaVencimiento = formatDateToYearMonth(matches[2]);
        }
        continue;
      }

      // Proveedor: QUIFATEX S.A.
      // Patrón: FECHA_VENCIMIENTO en formato YYYYMMDD
      if (nombre === "fecha_vencimiento") {
        result.fechaVencimiento = formatDateToYearMonth(valor);
      }

      // Proveedor: ECUAQUIMICA
      if (nombre.startsWith('{') && nombre.includes('lotefechavence')) {
        try {
          const jsonData = JSON.parse(nombre);
          if (jsonData.lotefechavence) {
            result.fechaVencimiento = formatDateToYearMonth(jsonData.lotefechavence);
          }
          if (jsonData.lotefechaelabora) {
            result.fechaFabricacion = formatDateToYearMonth(jsonData.lotefechaelabora);
          }
        } catch (e) {
          console.error("Error parsing JSON in ECUAQUIMICA pattern:", e);
        }
        continue;
      }
      if (nombre === "0" && !hasProcessedEcuaquimica) {
        result.lote = valor;
        hasProcessedEcuaquimica = true;
        continue;
      }

      // Proveedor: LIRA LABORATORIOS
      if (nombre === "det 1") {
        const matches = valor.match(/([A-Z0-9]+)\s+(\d{2}\/\d{2}\/\d{4})/);
        if (matches) {
          result.lote = matches[1];
          result.fechaVencimiento = formatDateToYearMonth(matches[2]);
        }
        continue;
      }

      // Proveedor: Leterago
      if (nombre === "detadicionallote_vence") {
        const [lote, fecha] = valor.split('_');
        result.lote = lote;
        result.fechaVencimiento = formatDateToYearMonth(fecha);
        continue;
      }

      // Proveedor: DISTRIBUIDORA JOSE VERDEZOTO
      if (nombre === "lote/reg.san") {
        result.lote = valor.replace('/', '');
      }
      if (nombre === "caduca") {
        result.fechaVencimiento = formatDateToYearMonth(valor);
      }

      // Proveedor: MAXFELDER S.A.
      if (nombre === "exp.") {
        result.fechaVencimiento = formatDateToYearMonth(valor);
      }

      // Proveedor: MAXIDUCTS
      if (nombre === "fecha elab.") {
        result.fechaFabricacion = formatDateToYearMonth(valor);
      }
      if (nombre === "fecha cad.") {
        result.fechaVencimiento = formatDateToYearMonth(valor);
      }

      // Proveedor: PRODE-FARM S.A
      if (nombreOriginal === "Vigencia") {
        const matches = valor.match(/Elab.:(\d{4}-\d{2}-\d{2})\s*-\s*Exp.:(\d{4}-\d{2}-\d{2})/);
        if (matches) {
          result.fechaFabricacion = formatDateToYearMonth(matches[1]);
          result.fechaVencimiento = formatDateToYearMonth(matches[2]);
          console.log("PRODE-FARM Dates extracted:", {
            fabricacion: result.fechaFabricacion,
            vencimiento: result.fechaVencimiento
          });
        }
        continue;
      }

      // Patrones generales para otros proveedores
      if (nombre === "lote") {
        result.lote = valor;
      }
      if (nombre === "fecha de fabricación" || nombre === "fecha fabricación") {
        result.fechaFabricacion = formatDateToYearMonth(valor.split(" ")[0]);
      }
      if (nombre === "fecha de vencimiento" || nombre === "fecha vencimiento" || 
          nombre === "fecha caducidad" || nombre === "fechacaducidad") {
        result.fechaVencimiento = formatDateToYearMonth(valor.split(" ")[0]);
      }

    } catch (error) {
      console.error("Error processing detail:", error);
    }
  }

  return result;
};

export const parseXMLFile = async (file: File): Promise<{ header: InvoiceHeader; details: InvoiceDetail[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target?.result as string, "text/xml");
        
        const comprobanteNode = xmlDoc.getElementsByTagName("comprobante")[0];
        if (!comprobanteNode) {
          throw new Error("No se encontró el nodo comprobante");
        }
        
        const contenidoComprobante = comprobanteNode.textContent || "";
        const facturaDoc = parser.parseFromString(contenidoComprobante, "text/xml");
        
        const infoTributaria = facturaDoc.getElementsByTagName("infoTributaria")[0];
        const infoFactura = facturaDoc.getElementsByTagName("infoFactura")[0];
        
        const identificacionComprador = infoFactura.getElementsByTagName("identificacionComprador")[0]?.textContent;
        
        if (identificacionComprador !== VALID_RUC) {
          throw new Error("Este documento no pertenece a la empresa VEGFARM S.A.S.");
        }
        
        const header: InvoiceHeader = {
          razonSocial: infoTributaria.getElementsByTagName("razonSocial")[0]?.textContent || "",
          ruc: infoTributaria.getElementsByTagName("ruc")[0]?.textContent || "",
          numeroFactura: `${infoTributaria.getElementsByTagName("estab")[0]?.textContent || ""}-${
            infoTributaria.getElementsByTagName("ptoEmi")[0]?.textContent || ""}-${
            infoTributaria.getElementsByTagName("secuencial")[0]?.textContent || ""}`,
          razonSocialComprador: infoFactura.getElementsByTagName("razonSocialComprador")[0]?.textContent || "",
          identificacionComprador: identificacionComprador || "",
          fechaEmision: infoFactura.getElementsByTagName("fechaEmision")[0]?.textContent || "",
        };
        
        const detalleNodes = facturaDoc.getElementsByTagName("detalle");
        const details: InvoiceDetail[] = [];
        
        console.log("Número de detalles encontrados:", detalleNodes.length);
        
        for (let i = 0; i < detalleNodes.length; i++) {
          const detalle = detalleNodes[i];
          const additionalDetails = extractAdditionalDetails(detalle);
          
          const detail: InvoiceDetail = {
            codigoPrincipal: detalle.getElementsByTagName("codigoPrincipal")[0]?.textContent || "",
            codigoAuxiliar: detalle.getElementsByTagName("codigoAuxiliar")[0]?.textContent || "",
            descripcion: detalle.getElementsByTagName("descripcion")[0]?.textContent || "",
            cantidad: parseFloat(detalle.getElementsByTagName("cantidad")[0]?.textContent || "0"),
            precioUnitario: parseFloat(detalle.getElementsByTagName("precioUnitario")[0]?.textContent || "0"),
            ...additionalDetails
          };
          
          console.log("Detalle encontrado con información adicional:", detail);
          details.push(detail);
        }
        
        if (details.length === 0) {
          throw new Error("No se encontraron detalles en el XML");
        }
        
        resolve({ header, details });
      } catch (error) {
        console.error("Error al parsear XML:", error);
        reject(error instanceof Error ? error : new Error("Error al procesar el archivo XML"));
      }
    };
    
    reader.onerror = () => {
      console.error("Error al leer el archivo");
      reject(new Error("Error al leer el archivo"));
    };
    reader.readAsText(file);
  });
};
