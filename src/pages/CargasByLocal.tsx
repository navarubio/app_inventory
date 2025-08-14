
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
import LocalRankingTable from '@/components/dashboard/LocalRankingTable';
import { useLocalData } from '@/hooks/useLocalData';

const CargasByLocal = () => {
  const {
    locales,
    isLoading,
    isRefetching,
    errorDetails,
    loadingProgress,
    refetch,
    setLoadingProgress,
    totalCargas,
    promedioCargas,
    totalLocales
  } = useLocalData();

  return (
    <AppLayout title="Cargas por Local">
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total de Cargas"
            description="Todas las cargas registradas"
            value={totalCargas}
            isLoading={isLoading || isRefetching}
            color="bg-blue-50"
          />
          
          <StatsCard
            title="Promedio por Local"
            description="Cargas promedio"
            value={promedioCargas.toFixed(2)}
            isLoading={isLoading || isRefetching}
            color="bg-green-50"
          />
          
          <StatsCard
            title="Total Locales"
            description="Número de locales activos"
            value={totalLocales}
            isLoading={isLoading || isRefetching}
            color="bg-purple-50"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de Locales</CardTitle>
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
              <LocalRankingTable locales={locales || []} />
            )}
          </CardContent>
          {(!isLoading && !isRefetching && !errorDetails) && (
            <CardFooter className="text-xs text-gray-500 justify-end">
              Última actualización: {new Date().toLocaleString()}
            </CardFooter>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default CargasByLocal;
