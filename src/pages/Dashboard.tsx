
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Pie, PieChart, Cell } from 'recharts';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';

const Dashboard = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

  // Datos de ejemplo para los gráficos
  const monthlyData = [
    { name: 'Ene', facturas: 65, productos: 120 },
    { name: 'Feb', facturas: 59, productos: 110 },
    { name: 'Mar', facturas: 80, productos: 150 },
    { name: 'Abr', facturas: 81, productos: 160 },
    { name: 'May', facturas: 56, productos: 100 },
    { name: 'Jun', facturas: 55, productos: 90 },
    { name: 'Jul', facturas: 40, productos: 85 },
  ];

  const loteStatus = [
    { name: 'Completos', value: 70, color: '#8CC63F' },
    { name: 'Pendientes', value: 15, color: '#FFB74D' },
    { name: 'Con errores', value: 15, color: '#FF5252' },
  ];

  const COLORS = ['#8CC63F', '#FFB74D', '#FF5252'];

  const stats = [
    { 
      title: 'Facturas Procesadas', 
      value: '358', 
      description: 'En los últimos 30 días',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      title: 'Lotes Completos', 
      value: '256', 
      description: '71% del total',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    { 
      title: 'Lotes Pendientes', 
      value: '54', 
      description: '15% del total',
      icon: Clock,
      color: 'bg-amber-100 text-amber-600'
    },
    { 
      title: 'Lotes con Errores', 
      value: '48', 
      description: '14% del total',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600'
    }
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-700">
          Bienvenido, {userData.nomapellidos}
        </h2>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Mensual</CardTitle>
              <CardDescription>Facturas procesadas y productos registrados</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="facturas" fill="#1B365D" name="Facturas" />
                  <Bar dataKey="productos" fill="#8CC63F" name="Productos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Lotes</CardTitle>
              <CardDescription>Porcentaje por estado</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loteStatus}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {loteStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
