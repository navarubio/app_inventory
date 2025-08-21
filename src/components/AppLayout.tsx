import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Menu, ShoppingCart, Package, Upload, ChevronRight, ChevronLeft, LogOut, BarChart2, Store, Home, Database, Truck, FileText, Box, Package2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

  const handleLogout = () => {
    sessionStorage.removeItem('userData');
    navigate('/login');
    toast.success("Sesión cerrada exitosamente");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigateToDashboard = () => {
    navigate('/');
  };

  const { pathname } = location;

  const navigation = [
    {
      name: 'Analizar Carga',
      href: '/analizar-carga',
      icon: Database,
      current: pathname === '/analizar-carga'
    },
    {
      name: 'Completar Compras',
      href: '/completar-compras',
      icon: ShoppingCart,
      current: pathname === '/completar-compras'
    },
    {
      name: 'Analizar Lotes',
      href: '/analizar-lotes',
      icon: Package,
      current: pathname === '/analizar-lotes'
    },
    {
      name: 'Conciliar Cargar',
      href: '/conciliar-cargar',
      icon: Upload,
      current: pathname === '/conciliar-cargar'
    },
    {
      name: 'Cargas por Operador',
      href: '/cargas-by-operador',
      icon: BarChart2,
      current: pathname === '/cargas-by-operador'
    },
    {
      name: 'Cargas por Local',
      href: '/cargas-by-local',
      icon: Store,
      current: pathname === '/cargas-by-local'
    },
    {
      name: 'Analizar Despachos',
      href: '/analizar-despachos',
      icon: Truck,
      current: pathname === '/analizar-despachos'
    },
    {
      name: 'Kardex General',
      href: '/kardex-general',
      icon: FileText,
      current: pathname === '/kardex-general'
    },
    {
      name: 'Categorización',
      href: '/categoria-productos',
      icon: Package2,
      current: pathname === '/categoria-productos'
    },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div 
        className={cn(
          "bg-[#1B365D] text-white transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-4 flex justify-between items-center border-b border-blue-800">
          <div 
            className={cn("flex items-center cursor-pointer", !sidebarOpen && "justify-center w-full")}
            onClick={navigateToDashboard}
          >
            <img 
              src="/lovable-uploads/9a955991-9ef9-4d84-9d32-82883af21172.png" 
              alt="VegFarm Logo" 
              className="h-10 object-contain"
            />
            {sidebarOpen && <span className="ml-3 font-bold text-lg">VegFarm</span>}
          </div>
          <button 
            onClick={toggleSidebar} 
            className={cn("text-white p-1 rounded-full hover:bg-blue-800", !sidebarOpen && "hidden")}
          >
            <ChevronLeft size={20} />
          </button>
          {!sidebarOpen && (
            <button 
              onClick={toggleSidebar} 
              className="absolute -right-4 top-10 bg-[#1B365D] text-white p-1 rounded-full shadow-md hover:bg-blue-800"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 py-4">
          <nav className="space-y-2 px-3">
            {navigation.map((item) => (
              <button 
                key={item.name}
                onClick={() => navigate(item.href)}
                className="flex items-center w-full py-2 px-3 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-blue-800">
          {sidebarOpen ? (
            <div className="flex flex-col space-y-3">
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-white">{userData.nomapellidos}</p>
                <p className="text-xs">Operador</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm"
              >
                <LogOut size={16} />
                <span className="ml-2">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-[#1B365D]">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={navigateToDashboard} 
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="text-[#1B365D]" size={20} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
