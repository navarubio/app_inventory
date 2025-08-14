
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

import StatsCard from '@/components/dashboard/StatsCard';
import LoadingIndicator from '@/components/dashboard/LoadingIndicator';
import ErrorDisplay from '@/components/dashboard/ErrorDisplay';
import OperatorRankingTable from '@/components/dashboard/OperatorRankingTable';
import { useOperatorData } from '@/hooks/useOperatorData';

const CargasByOperador = () => {
  const {
    operadores,
    isLoading,
    isRefetching,
    errorDetails,
    loadingProgress,
    refetch,
    setLoadingProgress,
    totalCargas,
    promedioCargas,
    totalOperadores
  } = useOperatorData();

  return (
    <AppLayout title="Cargas por Operador">
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total de Cargas"
            description="Todas las cargas registradas"
            value={totalCargas}
            isLoading={isLoading || isRefetching}
            color="bg-orange-50"
          />
          
          <StatsCard
            title="Promedio por Operador"
            description="Cargas promedio"
            value={promedioCargas.toFixed(2)}
            isLoading={isLoading || isRefetching}
            color="bg-pink-50"
          />
          
          <StatsCard
            title="Total Operadores"
            description="Número de operadores activos"
            value={totalOperadores}
            isLoading={isLoading || isRefetching}
            color="bg-cyan-50"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de Operadores</CardTitle>
            <CardDescription>
              Clasificación por número de cargas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || isRefetching ? (
              <LoadingIndicator loadingProgress={loadingProgress} />
            ) : errorDetails ? (
              <ErrorDisplay 
                errorDetails={errorDetails} 
                onRetry={() => {
                  setLoadingProgress(10);
                  refetch();
                }} 
                isRetrying={isRefetching}
              />
            ) : (
              <OperatorRankingTable operadores={operadores || []} />
            )}
          </CardContent>
          {!isLoading && !errorDetails && (
            <CardFooter className="text-xs text-gray-500 justify-end">
              Última actualización: {new Date().toLocaleString()}
            </CardFooter>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default CargasByOperador;
