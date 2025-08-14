import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Proveedor, Factura, CompraItem, XmlItem } from "@/types/completar-compras";
import { parseXMLFile } from "@/utils/xmlParser";

// Fetch proveedores data
const fetchProveedores = async (): Promise<Proveedor[]> => {
  try {
    const response = await fetch('http://10.10.10.251:8890/api/proveedor/proveedores');
    if (!response.ok) {
      throw new Error('Error al obtener proveedores');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching proveedores:', error);
    throw error;
  }
};

// Fetch facturas by proveedor
const fetchFacturasByProveedor = async (proveedorId: string): Promise<Factura[]> => {
  try {
    const response = await fetch(`http://10.10.10.251:8890/api/factura/proveedor/${proveedorId}`);
    if (!response.ok) {
      throw new Error('Error al obtener facturas');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching facturas:', error);
    throw error;
  }
};

// Fetch compra items by factura
const fetchCompraItems = async (facturaId: string): Promise<CompraItem[]> => {
  try {
    const response = await fetch(`http://10.10.10.251:8890/api/compra/factura/${facturaId}`);
    if (!response.ok) {
      throw new Error('Error al obtener detalles de compra');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching compra items:', error);
    throw error;
  }
};

export function useCompletarComprasData() {
  const [selectedProveedor, setSelectedProveedor] = useState<string>("");
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [xmlItems, setXmlItems] = useState<XmlItem[]>([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [facturaCargada, setFacturaCargada] = useState(false);

  // Fetch proveedores
  const proveedoresQuery = useQuery({
    queryKey: ['proveedores'],
    queryFn: fetchProveedores,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Handle error for proveedores
  if (proveedoresQuery.error) {
    toast.error('Error al cargar proveedores', {
      description: proveedoresQuery.error instanceof Error 
        ? proveedoresQuery.error.message 
        : 'Error desconocido'
    });
  }

  // Fetch facturas (only when a proveedor is selected and search is triggered)
  const facturasQuery = useQuery({
    queryKey: ['facturas', selectedProveedor],
    queryFn: () => fetchFacturasByProveedor(selectedProveedor),
    enabled: busquedaRealizada && !!selectedProveedor,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  // Handle error for facturas
  if (facturasQuery.error) {
    toast.error('Error al cargar facturas', {
      description: facturasQuery.error instanceof Error 
        ? facturasQuery.error.message 
        : 'Error desconocido'
    });
  }

  // Fetch compra items (only when a factura is selected)
  const compraItemsQuery = useQuery({
    queryKey: ['compraItems', selectedFactura?.id],
    queryFn: () => selectedFactura ? fetchCompraItems(selectedFactura.id) : Promise.resolve([]),
    enabled: !!selectedFactura,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  // Handle error for compra items
  if (compraItemsQuery.error) {
    toast.error('Error al cargar detalles de compra', {
      description: compraItemsQuery.error instanceof Error 
        ? compraItemsQuery.error.message 
        : 'Error desconocido'
    });
  }

  // Function to trigger factura search
  const buscarFacturas = () => {
    if (!selectedProveedor) {
      toast.error('Seleccione un proveedor para continuar');
      return;
    }
    
    setBusquedaRealizada(true);
    setSelectedFactura(null);
    setXmlItems([]);
    setFacturaCargada(false);
  };

  // Function to load XML data
  const cargarXml = async (factura: Factura) => {
    try {
      setSelectedFactura(factura);
      setXmlItems([]);
      setFacturaCargada(false);
      
      // In a real implementation, we would fetch the XML file and parse it
      // For now, we'll simulate a delay and use mock data
      
      // In a real implementation, this would be something like:
      // const xmlData = await fetch(`/api/xml/${factura.xmlPath}`);
      // const xmlText = await xmlData.text();
      // const parsedItems = parseXMLFile(xmlText);
      // setXmlItems(parsedItems);
      
      // For demo purposes, we'll just simulate this
      setTimeout(() => {
        const mockXmlItems: XmlItem[] = [
          { 
            codigoPrincipal: "285261", 
            codigoAuxiliar: "285261", 
            descripcion: "DAFLON 1000MG X 30 COMP", 
            cantidad: 12, 
            precioUnitario: 50, 
            numeroLote: "6105102", 
            fechaFabricacion: "", 
            fechaVencimiento: "2028-07-01" 
          },
          { 
            codigoPrincipal: "239723", 
            codigoAuxiliar: "239723", 
            descripcion: "DAFLON 1000MG X30 SACHETS", 
            cantidad: 12, 
            precioUnitario: 53.72, 
            numeroLote: "5700180", 
            fechaFabricacion: "", 
            fechaVencimiento: "2026-10-01" 
          },
          { 
            codigoPrincipal: "103173", 
            codigoAuxiliar: "103173", 
            descripcion: "DAFLON 500 X 30 COMP", 
            cantidad: 20, 
            precioUnitario: 35, 
            numeroLote: "6094524", 
            fechaFabricacion: "", 
            fechaVencimiento: "2027-11-01" 
          }
        ];
        
        setXmlItems(mockXmlItems);
        setFacturaCargada(true);
        
        toast.success('Factura cargada correctamente', {
          description: `Factura: ${factura.factura}`
        });
      }, 1000);
      
    } catch (error) {
      toast.error('Error al cargar el archivo XML', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  return {
    // Data
    proveedores: proveedoresQuery.data || [],
    facturas: facturasQuery.data || [],
    compraItems: compraItemsQuery.data || [],
    xmlItems,
    
    // State
    selectedProveedor,
    selectedFactura,
    busquedaRealizada,
    facturaCargada,
    
    // Loading states
    isLoadingProveedores: proveedoresQuery.isLoading,
    isLoadingFacturas: facturasQuery.isLoading || facturasQuery.isFetching,
    isLoadingCompraItems: compraItemsQuery.isLoading || compraItemsQuery.isFetching,
    
    // Error states
    proveedoresError: proveedoresQuery.error,
    facturasError: facturasQuery.error,
    compraItemsError: compraItemsQuery.error,
    
    // Actions
    setSelectedProveedor,
    buscarFacturas,
    cargarXml,
    
    // Reset
    clearFactura: () => {
      setSelectedFactura(null);
      setXmlItems([]);
      setFacturaCargada(false);
    }
  };
}
