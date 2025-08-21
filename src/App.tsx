import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CompletarCompras from "./pages/CompletarCompras";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AnalizarLotes from "./pages/AnalizarLotes";
import AnalizarCarga from "./pages/AnalizarCarga";
import ConciliarCargar from "./pages/ConciliarCargar";
import CargasByOperador from "./pages/CargasByOperador";
import CargasByLocal from "./pages/CargasByLocal";
import AnalizarDespachos from "./pages/AnalizarDespachos";
import KardexGeneral from "./pages/KardexGeneral";
import AppLayout from './components/AppLayout';
import CategoriaProductos from './pages/CategoriaProductos';

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const userData = sessionStorage.getItem('userData');
  
  if (!userData) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/completar-compras"
            element={
              <PrivateRoute>
                <CompletarCompras />
              </PrivateRoute>
            }
          />
          <Route
            path="/analizar-carga"
            element={
              <PrivateRoute>
                <AnalizarCarga />
              </PrivateRoute>
            }
          />
          <Route
            path="/analizar-lotes"
            element={
              <PrivateRoute>
                <AnalizarLotes />
              </PrivateRoute>
            }
          />
          <Route
            path="/conciliar-cargar"
            element={
              <PrivateRoute>
                <ConciliarCargar />
              </PrivateRoute>
            }
          />
          <Route
            path="/cargas-by-operador"
            element={
              <PrivateRoute>
                <CargasByOperador />
              </PrivateRoute>
            }
          />
          <Route
            path="/cargas-by-local"
            element={
              <PrivateRoute>
                <CargasByLocal />
              </PrivateRoute>
            }
          />
          <Route
            path="/analizar-despachos"
            element={
              <PrivateRoute>
                <AnalizarDespachos />
              </PrivateRoute>
            }
          />
          <Route
            path="/kardex-general"
            element={
              <PrivateRoute>
                <AppLayout title="Analizar Despachos">
                  <KardexGeneral />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/categoria-productos"
            element={
              <PrivateRoute>
                <CategoriaProductos />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
