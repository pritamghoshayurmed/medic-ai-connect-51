import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, TrendingUp, Users, Calendar, Clock } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// Mock data
const patientDemographics = [
  { name: "18-24", value: 15 },
  { name: "25-34", value: 30 },
  { name: "35-44", value: 25 },
  { name: "45-54", value: 18 },
  { name: "55+", value: 12 },
];

const appointmentsByMonth = [
  { month: "Jan", appointments: 45 },
  { month: "Feb", appointments: 52 },
  { month: "Mar", appointments: 48 },
  { month: "Apr", appointments: 61 },
  { month: "May", appointments: 55 },
  { month: "Jun", appointments: 67 },
  { month: "Jul", appointments: 62 },
  { month: "Aug", appointments: 58 },
  { month: "Sep", appointments: 63 },
  { month: "Oct", appointments: 72 },
  { month: "Nov", appointments: 68 },
  { month: "Dec", appointments: 49 },
];

const patientConditions = [
  { name: "Hypertension", value: 25 },
  { name: "Diabetes", value: 18 },
  { name: "Asthma", value: 15 },
  { name: "Arthritis", value: 12 },
  { name: "Other", value: 30 },
];

const COLORS = ["#2563EB", "#4F86F7", "#76A9FA", "#93C5FD", "#BFDBFE"];

export default function DoctorAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="pb-24 min-h-screen" style={{background: 'linear-gradient(135deg, #005A7A, #002838)'}}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-white text-opacity-90">Track your performance</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardContent className="p-4 flex flex-col items-center">
            <Users className="h-8 w-8 text-teal-400 mb-2" />
            <p className="text-2xl font-bold text-white">124</p>
            <p className="text-sm text-white text-opacity-70">Total Patients</p>
          </CardContent>
        </Card>
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardContent className="p-4 flex flex-col items-center">
            <Calendar className="h-8 w-8 text-teal-400 mb-2" />
            <p className="text-2xl font-bold text-white">687</p>
            <p className="text-sm text-white text-opacity-70">Appointments</p>
          </CardContent>
        </Card>
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardContent className="p-4 flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-teal-400 mb-2" />
            <p className="text-2xl font-bold text-white">93%</p>
            <p className="text-sm text-white text-opacity-70">Completion Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardContent className="p-4 flex flex-col items-center">
            <Clock className="h-8 w-8 text-teal-400 mb-2" />
            <p className="text-2xl font-bold text-white">28min</p>
            <p className="text-sm text-white text-opacity-70">Avg. Consultation</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="appointments" className="w-full mt-2">
        <TabsList className="grid grid-cols-3 w-full mb-4 mx-4 bg-white bg-opacity-10 backdrop-blur-sm">
          <TabsTrigger 
            value="appointments"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
          >
            Appointments
          </TabsTrigger>
          <TabsTrigger 
            value="patients"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
          >
            Patients
          </TabsTrigger>
          <TabsTrigger 
            value="conditions"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
          >
            Conditions
          </TabsTrigger>
        </TabsList>
        
        {/* Appointments Tab */}
        <TabsContent value="appointments" className="px-4">
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Appointments by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#0f766e'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <h3 className="font-bold text-white mb-2">Top Insights</h3>
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
              <CardContent className="p-4">
                <div className="space-y-3 text-white">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-emerald-400 mr-2" />
                    <p>Appointments increased by 12% in October</p>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-teal-400 mr-2" />
                    <p>Average of 58 appointments per month</p>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-yellow-400 mr-2" />
                    <p>Tuesdays are your busiest days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Patients Tab */}
        <TabsContent value="patients" className="px-4">
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Patient Age Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={patientDemographics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#0f766e'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <h3 className="font-bold text-white mb-2">Patient Statistics</h3>
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-white text-opacity-70">New Patients (This Month)</p>
                    <p className="font-bold text-white">12</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white text-opacity-70">Return Rate</p>
                    <p className="font-bold text-white">78%</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white text-opacity-70">Gender Ratio (M:F)</p>
                    <p className="font-bold text-white">45:55</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white text-opacity-70">Average Patient Age</p>
                    <p className="font-bold text-white">37</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Conditions Tab */}
        <TabsContent value="conditions" className="px-4">
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Common Conditions</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={patientConditions}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                    >
                      {patientConditions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#0f766e'
                      }}
                    />
                    <Legend formatter={(value) => <span style={{ color: 'white' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <h3 className="font-bold text-white mb-2">Treatment Effectiveness</h3>
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-white">Hypertension</p>
                      <p className="text-sm font-bold text-white">85%</p>
                    </div>
                    <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
                      <div className="bg-teal-500 rounded-full h-2" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-white">Diabetes</p>
                      <p className="text-sm font-bold text-white">78%</p>
                    </div>
                    <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
                      <div className="bg-teal-500 rounded-full h-2" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-white">Asthma</p>
                      <p className="text-sm font-bold text-white">92%</p>
                    </div>
                    <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
                      <div className="bg-teal-500 rounded-full h-2" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-white">Arthritis</p>
                      <p className="text-sm font-bold text-white">75%</p>
                    </div>
                    <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
                      <div className="bg-teal-500 rounded-full h-2" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}
