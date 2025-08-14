
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, FileSearch, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/formatDate";
import { toast } from "sonner";

// Types for our data
interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
}

interface Factura {
  id: string;
  fecha: string;
  ruc: string;
  proveedor: string;
  factura: string;
  autorizacion: string;
  xmlPath: string;
}

interface CompraItem {
  id: string;
  code: string;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precio: number;
}

interface XmlItem {
  codigoPrincipal: string;
  codigoAuxiliar: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  numeroLote: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
}

// Mock data for demonstration
const mockProveedores: Proveedor[] = [
  { id: "1", codigo: "1001", nombre: "QUIFATEX S.A." },
  { id: "2", codigo: "1002", nombre: "LETERAGO S.A." },
  { id: "3", codigo: "1003", nombre: "DIFARE S.A." },
  { id: "4", codigo: "1004", nombre: "CORPORACIÓN GPF" },
  { id: "5", codigo: "1005", nombre: "GRUPO FARMA DEL ECUADOR" }
];

const mockFacturas: Factura[] = [
  {
    id: "1",
    fecha: "2025-02-10",
    ruc: "1790371506001",
    proveedor: "QUIFATEX S.A.",
    factura: "008-020-001326151",
    autorizacion: "1234567890",
    xmlPath: "/facturas/quifatex_001326151.xml"
  },
  {
    id: "2",
    fecha: "2025-01-15",
    ruc: "1890371506002",
    proveedor: "QUIFATEX S.A.",
    factura: "008-020-001326152",
    autorizacion: "1234567891",
    xmlPath: "/facturas/quifatex_001326152.xml"
  },
  {
    id: "3",
    fecha: "2025-01-22",
    ruc: "1990371506003",
    proveedor: "LETERAGO S.A.",
    factura: "001-001-000123456",
    autorizacion: "9876543210",
    xmlPath: "/facturas/leterago_000123456.xml"
  },
  {
    id: "4",
    fecha: "2025-03-05",
    ruc: "0990371506004",
    proveedor: "DIFARE S.A.",
    factura: "002-001-000789456",
    autorizacion: "1122334455",
    xmlPath: "/facturas/difare_000789456.xml"
  },
  {
    id: "5",
    fecha: "2025-02-28",
    ruc: "1790371506005",
    proveedor: "CORPORACIÓN GPF",
    factura: "001-002-000567890",
    autorizacion: "5544332211",
    xmlPath: "/facturas/gpf_000567890.xml"
  }
];

const mockCompras: CompraItem[] = [
  { id: "1", code: "285261", nombre: "DAFLON 1000MG X 30 COMP", presentacion: "30 COMP", cantidad: 12, precio: 50 },
  { id: "2", code: "239723", nombre: "DAFLON 1000MG X30 SACHETS", presentacion: "30 SACHETS", cantidad: 12, precio: 53.72 },
  { id: "3", code: "103173", nombre: "DAFLON 500 X 30 COMP", presentacion: "30 COMP", cantidad: 20, precio: 35 },
  { id: "4", code: "204719", nombre: "DICYNONE 500MG CAPS X20", presentacion: "20 CAPS", cantidad: 30, precio: 26 },
  { id: "5", code: "204718", nombre: "DICYNONE 500 MG X 10 CAP", presentacion: "10 CAP", cantidad: 30, precio: 13 }
];

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
  },
  { 
    codigoPrincipal: "204719", 
    codigoAuxiliar: "204719", 
    descripcion: "DICYNONE 500MG CAPS X20", 
    cantidad: 30, 
    precioUnitario: 26, 
    numeroLote: "231336", 
    fechaFabricacion: "", 
    fechaVencimiento: "2026-12-01" 
  },
  { 
    codigoPrincipal: "204718", 
    codigoAuxiliar: "204718", 
    descripcion: "DICYNONE 500 MG X 10 CAP", 
    cantidad: 30, 
    precioUnitario: 13, 
    numeroLote: "230927", 
    fechaFabricacion: "", 
    fechaVencimiento: "2026-08-01" 
  },
  { 
    codigoPrincipal: "103179", 
    codigoAuxiliar: "103179", 
    descripcion: "DAFLON 500 MG X 60 COMP", 
    cantidad: 15, 
    precioUnitario: 65.50, 
    numeroLote: "6094530", 
    fechaFabricacion: "2024-01-15", 
    fechaVencimiento: "2027-01-15" 
  },
  { 
    codigoPrincipal: "204720", 
    codigoAuxiliar: "204720", 
    descripcion: "DICYNONE 250MG AMX3", 
    cantidad: 25, 
    precioUnitario: 19.80, 
    numeroLote: "231340", 
    fechaFabricacion: "2024-02-10", 
    fechaVencimiento: "2026-02-10" 
  }
];

const CompletarCompras = () => {
  const [selectedProveedor, setSelectedProveedor] = useState<string>("");
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [compraItems, setCompraItems] = useState<CompraItem[]>([]);
  const [xmlItems, setXmlItems] = useState<XmlItem[]>([]);
  const [isLoadingFacturas, setIsLoadingFacturas] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [facturaCargada, setFacturaCargada] = useState(false);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(true);

  // Simulate loading proveedores on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingProveedores(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Simulating API call when searching for facturas
  const buscarFacturas = () => {
    if (!selectedProveedor) {
      toast.error('Seleccione un proveedor para continuar');
      return;
    }

    setIsLoadingFacturas(true);
    setFacturas([]);
    setBusquedaRealizada(false);
    setCompraItems([]);
    setXmlItems([]);
    setFacturaCargada(false);

    // Simulate API delay
    setTimeout(() => {
      // Filter facturas by proveedor
      const filteredFacturas = mockFacturas.filter(
        factura => factura.proveedor.toLowerCase().includes(selectedProveedor.toLowerCase())
      );
      
      setFacturas(filteredFacturas);
      setBusquedaRealizada(true);
      setIsLoadingFacturas(false);
      
      if (filteredFacturas.length === 0) {
        toast.info('No se encontraron facturas para el proveedor seleccionado');
      } else {
        toast.success(`Se encontraron ${filteredFacturas.length} facturas`);
      }
    }, 800);
  };

  // Simulate loading XML details
  const cargarXml = (factura: Factura) => {
    setIsLoadingDetails(true);
    setCompraItems([]);
    setXmlItems([]);
    setFacturaCargada(false);
    
    // Simulate API delay
    setTimeout(() => {
      setCompraItems(mockCompras);
      setXmlItems(mockXmlItems);
      setFacturaCargada(true);
      setIsLoadingDetails(false);
      
      toast.success('Factura cargada correctamente', {
        description: `Factura: ${factura.factura}`
      });
    }, 1000);
  };

  return (
    <AppLayout title="Completar Compras">
      <div className="space-y-6 animate-fadeIn">
        {/* Search Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Búsqueda de Facturas</h2>
            <div className="flex items-end gap-4">
              <div className="w-full max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <Select 
                  value={selectedProveedor} 
                  onValueChange={setSelectedProveedor}
                  disabled={isLoadingProveedores}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProveedores ? (
                      <SelectItem value="loading">Cargando proveedores...</SelectItem>
                    ) : (
                      mockProveedores.map((proveedor) => (
                        <SelectItem key={proveedor.id} value={proveedor.nombre}>
                          {proveedor.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={buscarFacturas} 
                disabled={isLoadingFacturas || !selectedProveedor}
                className="min-w-32"
              >
                {isLoadingFacturas ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar
              </Button>
            </div>
          </div>

          {/* Facturas Table */}
          {isLoadingFacturas ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="mt-2 text-gray-600">Cargando facturas...</p>
            </div>
          ) : busquedaRealizada && (
            <div className="rounded-md border">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="py-3">Fecha</TableHead>
                    <TableHead>RUC</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Autorización</TableHead>
                    <TableHead className="text-center">Cargar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                        No se encontraron facturas para el proveedor seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-gray-50">
                        <TableCell>{formatDate(factura.fecha)}</TableCell>
                        <TableCell>{factura.ruc}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{factura.proveedor}</TableCell>
                        <TableCell>{factura.factura}</TableCell>
                        <TableCell className="max-w-[100px] truncate">{factura.autorizacion}</TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white hover:bg-blue-50"
                            onClick={() => cargarXml(factura)}
                            disabled={isLoadingDetails}
                          >
                            <FileSearch size={18} className="text-blue-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Details Section - Split View */}
        {busquedaRealizada && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Table: OpenBravo Compras */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">OpenBravo Compras</h2>
              
              {isLoadingDetails ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                  <p className="mt-2 text-gray-600">Cargando detalles de compra...</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>ID</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Presentación</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!facturaCargada ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                            Seleccione una factura para ver detalles
                          </TableCell>
                        </TableRow>
                      ) : compraItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                            No hay datos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        compraItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.code}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={item.nombre}>{item.nombre}</TableCell>
                            <TableCell>{item.presentacion}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>${item.precio.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Right Table: Información XML */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Información XML</h2>
              
              {isLoadingDetails ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                  <p className="mt-2 text-gray-600">Cargando información XML...</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="whitespace-nowrap">Código Principal</TableHead>
                        <TableHead className="whitespace-nowrap">Código Auxiliar</TableHead>
                        <TableHead className="whitespace-nowrap">Descripción</TableHead>
                        <TableHead className="whitespace-nowrap">Cantidad</TableHead>
                        <TableHead className="whitespace-nowrap">Precio Unitario</TableHead>
                        <TableHead className="whitespace-nowrap">Número de Lote</TableHead>
                        <TableHead className="whitespace-nowrap">Fecha Fabricación</TableHead>
                        <TableHead className="whitespace-nowrap">Fecha Vencimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!facturaCargada ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                            Seleccione una factura para ver detalles
                          </TableCell>
                        </TableRow>
                      ) : xmlItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                            No hay datos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        xmlItems.map((item, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell>{item.codigoPrincipal}</TableCell>
                            <TableCell>{item.codigoAuxiliar}</TableCell>
                            <TableCell className="max-w-[150px] truncate" title={item.descripcion}>{item.descripcion}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>${item.precioUnitario.toFixed(2)}</TableCell>
                            <TableCell>{item.numeroLote}</TableCell>
                            <TableCell>{item.fechaFabricacion || "---------- ----"}</TableCell>
                            <TableCell>{item.fechaVencimiento || ""}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CompletarCompras;
