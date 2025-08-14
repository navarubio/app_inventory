import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OperadorData {
  operador: string;
  recordsByUser: number;
  porcentajeCarga: number;
  puntuacion: number;
}

export const useOperatorData = () => {
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(10);

  // Fetch data from API with retry functionality
  const { 
    data: operadores, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['cargasByOperador'],
    queryFn: async () => {
      try {
        const apiUrl = 'http://10.10.10.251:8890/api/inventory/satelites/cargabyempleado';
        console.log('Fetching data from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Error fetching data');
        return response.json();
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Efecto para animar la barra de progreso durante la carga
  useEffect(() => {
    if (isLoading || isRefetching) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      return () => {
        clearInterval(interval);
        setLoadingProgress(10);
      };
    } else {
      setLoadingProgress(100);
    }
  }, [isLoading, isRefetching]);

  // Mostrar error con toast si ocurre
  useEffect(() => {
    if (error) {
      console.error('Error fetching data:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Mensajes más específicos basados en el tipo de error
      if (errorMessage.includes('Failed to fetch')) {
        toast.error('Error de conexión. Verifica tu red o el servidor API', {
          description: 'No se pudo conectar con el servidor de datos',
          duration: 5000,
        });
      } else if (errorMessage.includes('CORS')) {
        toast.error('Error de seguridad CORS', {
          description: 'El servidor no permite acceso desde esta aplicación',
          duration: 5000,
        });
      } else {
        toast.error('Error al cargar los datos de operadores', {
          description: errorMessage.substring(0, 60) + '...',
          duration: 5000,
        });
      }
      
      setErrorDetails(errorMessage);
    }
  }, [error]);

  // Cálculo de totales para estadísticas
  const totalCargas = operadores?.reduce((sum, op) => sum + op.recordsByUser, 0) || 0;
  const promedioCargas = operadores?.length ? totalCargas / operadores.length : 0;
  const totalOperadores = operadores?.length || 0;

  return {
    operadores,
    isLoading,
    isRefetching,
    error,
    errorDetails,
    loadingProgress,
    refetch,
    setLoadingProgress,
    totalCargas,
    promedioCargas,
    totalOperadores
  };
};
