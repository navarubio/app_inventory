import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import LoginBackground from "@/components/LoginBackground";

const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Intentando login con:', { usuario, clave });

      // Autenticación con el endpoint API
      const endpoint = `http://10.10.10.251:8890/api/people/authenticate?usuario=${encodeURIComponent(usuario.trim())}&clave=${encodeURIComponent(clave.trim())}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('Estado de respuesta:', response.status);
      const responseText = await response.text();
      console.log('Respuesta del servidor:', responseText);
      
      if (response.ok && responseText === "AUTORIZADO") {
        // Login exitoso
        const userData = {
          usuario: usuario.trim(),
          nomapellidos: usuario.trim() // Por ahora usamos el usuario como nombre completo
        };
        
        sessionStorage.setItem('userData', JSON.stringify(userData));
        toast.success("Inicio de sesión exitoso");
        navigate('/');
        return;
      } else if (response.status === 404) {
        toast.error("USUARIO NO EXISTE");
      } else if (response.status === 401) {
        toast.error("CLAVE INCORRECTA");
      } else {
        toast.error("Error de autenticación");
      }

    } catch (error) {
      console.error('Error en el proceso de login:', error);
      toast.error("Error al conectar con el servidor de autenticación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <LoginBackground />
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="animate-float absolute top-[10%] left-[10%] w-20 h-10 rounded-full bg-orange-300/40 blur-sm"></div>
        <div className="animate-float-delay absolute top-[20%] right-[15%] w-32 h-16 rounded-full bg-orange-400/30 blur-sm"></div>
        <div className="animate-float-slow absolute bottom-[15%] left-[20%] w-24 h-12 rounded-full bg-amber-300/40 blur-sm"></div>
        <div className="animate-float-slower absolute bottom-[25%] right-[20%] w-16 h-8 rounded-full bg-orange-200/50 blur-sm"></div>
        <div className="animate-float absolute top-[40%] left-[30%] w-28 h-14 rounded-full bg-amber-400/30 blur-sm"></div>
        <div className="animate-float-delay absolute bottom-[40%] right-[25%] w-36 h-12 rounded-full bg-orange-300/40 blur-sm"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-xl border border-orange-100">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/9a955991-9ef9-4d84-9d32-82883af21172.png" 
              alt="VegFarm Logo" 
              className="h-20 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-center text-[#1B365D] mb-6">
            Inicio de Sesión
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <Input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full bg-orange-50/50 border-orange-200 focus:border-orange-300 focus:ring-orange-200"
                required
              />
            </div>
            <div>
              <label htmlFor="clave" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <Input
                id="clave"
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="w-full bg-orange-50/50 border-orange-200 focus:border-orange-300 focus:ring-orange-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
