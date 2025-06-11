import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsData {
  appointments: number;
  consultations: number;
  patients: number;
  revenue: number;
  weeklyData: {
    day: string;
    appointments: number;
  }[];
  patientDistribution: {
    name: string;
    value: number;
  }[];
}

const COLORS = ['#00C389', '#0097A7', '#004953', '#81D4FA', '#4DB6AC'];

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    appointments: 0,
    consultations: 0,
    patients: 0,
    revenue: 0,
    weeklyData: [],
    patientDistribution: []
  });
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('week');
  
  useEffect(() => {
    if (!user) return;
    
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // This would be a real API call in a production environment
        // Simulating API response with mock data for demonstration
        const mockData = generateMockAnalytics(timeFrame);
        setAnalyticsData(mockData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [user, timeFrame]);
  
  // Generate mock analytics data
  const generateMockAnalytics = (timeFrame: 'week' | 'month' | 'year'): AnalyticsData => {
    // Helper to generate random number in range
    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Weekly data generation
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthDays = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
    const yearMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let days: string[];
    let appointmentMultiplier: number;
    
    switch (timeFrame) {
      case 'week':
        days = weekDays;
        appointmentMultiplier = 1;
        break;
      case 'month':
        days = monthDays;
        appointmentMultiplier = 3;
        break;
      case 'year':
        days = yearMonths;
        appointmentMultiplier = 20;
        break;
    }
    
    const weeklyData = days.map(day => ({
      day,
      appointments: random(1, 8) * appointmentMultiplier
    }));
    
    // Patient distribution
    const patientDistribution = [
      { name: 'Cardiology', value: random(10, 30) },
      { name: 'Checkup', value: random(20, 40) },
      { name: 'Chronic', value: random(5, 15) },
      { name: 'Emergency', value: random(3, 10) },
      { name: 'Follow-up', value: random(15, 25) }
    ];
    
    // Calculate totals based on mock data
    const appointments = weeklyData.reduce((sum, day) => sum + day.appointments, 0);
    const consultations = Math.floor(appointments * 0.85);
    const patients = Math.floor(appointments * 0.7);
    const revenue = patients * random(50, 200);
    
    return {
      appointments,
      consultations,
      patients,
      revenue,
      weeklyData,
      patientDistribution
    };
  };

  const formattedDate = format(new Date(), "EEEE, MMMM d");
  
  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C389]"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] pb-24">
      <div className="w-full max-w-[425px] mx-auto px-5">
        {/* Header */}
        <div className="flex justify-between items-center w-full py-2.5 mt-5">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-transparent border-0 text-white text-2xl cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">Analytics</h2>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Date Display */}
        <div className="w-full text-center mb-5">
          <p className="text-white/80 text-sm">{formattedDate}</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-[15px] shadow-lg text-center">
            <p className="text-gray-500 text-sm mb-1">Appointments</p>
            <h3 className="text-2xl font-bold text-[#004953]">{analyticsData.appointments}</h3>
          </div>
          
          <div className="bg-white p-4 rounded-[15px] shadow-lg text-center">
            <p className="text-gray-500 text-sm mb-1">Consultations</p>
            <h3 className="text-2xl font-bold text-[#004953]">{analyticsData.consultations}</h3>
          </div>
          
          <div className="bg-white p-4 rounded-[15px] shadow-lg text-center">
            <p className="text-gray-500 text-sm mb-1">Patients</p>
            <h3 className="text-2xl font-bold text-[#004953]">{analyticsData.patients}</h3>
          </div>
          
          <div className="bg-white p-4 rounded-[15px] shadow-lg text-center">
            <p className="text-gray-500 text-sm mb-1">Revenue</p>
            <h3 className="text-2xl font-bold text-[#004953]">₹{analyticsData.revenue}</h3>
          </div>
        </div>
        
        {/* Time Frame Selector */}
        <div className="bg-white p-4 rounded-[15px] shadow-lg mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-[#004953]">Activity</h3>
            <div className="flex bg-gray-100 rounded-full p-1">
              <button 
                className={`px-3 py-1 rounded-full text-sm ${timeFrame === 'week' ? 'bg-[#00C389] text-white' : 'text-gray-600'}`}
                onClick={() => setTimeFrame('week')}
              >
                Week
              </button>
              <button 
                className={`px-3 py-1 rounded-full text-sm ${timeFrame === 'month' ? 'bg-[#00C389] text-white' : 'text-gray-600'}`}
                onClick={() => setTimeFrame('month')}
              >
                Month
              </button>
              <button 
                className={`px-3 py-1 rounded-full text-sm ${timeFrame === 'year' ? 'bg-[#00C389] text-white' : 'text-gray-600'}`}
                onClick={() => setTimeFrame('year')}
              >
                Year
              </button>
            </div>
          </div>
          
          {/* Appointment Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analyticsData.weeklyData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }} 
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }} />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#00C389" 
                  strokeWidth={2}
                  dot={{ fill: '#00C389', r: 4 }}
                  activeDot={{ r: 6, fill: '#00C389' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Patient Distribution */}
        <div className="bg-white p-4 rounded-[15px] shadow-lg mb-6">
          <h3 className="text-lg font-medium mb-4 text-[#004953]">Patient Distribution</h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.patientDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analyticsData.patientDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap justify-center mt-4">
            {analyticsData.patientDistribution.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center mr-4 mb-2">
                <div 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Additional Stats - Top Visible Even Without Scrolling */}
        <div className="bg-white p-4 rounded-[15px] shadow-lg mb-6">
          <h3 className="text-lg font-medium mb-4 text-[#004953]">Performance Metrics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Consultation Rate</p>
              <p className="font-medium">{Math.floor((analyticsData.consultations / analyticsData.appointments) * 100)}%</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#00C389] h-2.5 rounded-full" 
                style={{ width: `${(analyticsData.consultations / analyticsData.appointments) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Patient Retention</p>
              <p className="font-medium">{Math.floor(random(70, 95))}%</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#00C389] h-2.5 rounded-full" 
                style={{ width: `${random(70, 95)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Patient Satisfaction</p>
              <p className="font-medium">{Math.floor(random(80, 98))}%</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#00C389] h-2.5 rounded-full" 
                style={{ width: `${random(80, 98)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
  
  function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
