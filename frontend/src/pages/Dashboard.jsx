import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats?.summary.totalEvents || 0,
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Total Registrations',
      value: stats?.summary.totalRegistrations || 0,
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Checked In',
      value: stats?.summary.totalCheckedIn || 0,
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Check-in Rate',
      value: `${stats?.summary.checkInRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your event overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Registration Trend (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats?.registrationsTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Registrations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Events */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Events by Registration
          </h2>
          <div className="space-y-3">
            {stats?.topEvents?.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(event.startDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary-600 font-semibold">
                    {event.registrationCount}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <Link to="/events" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            View All
          </Link>
        </div>

        {stats?.upcomingEvents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(event.startDate), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {event.stats.totalRegistrations} registered
                  </span>
                  <span className="text-primary-600 font-medium">
                    {event.stats.checkedInCount} checked in
                  </span>
                </div>

                {event.location && (
                  <p className="text-sm text-gray-500 mt-2 truncate">
                    📍 {event.location}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No upcoming events</p>
          </div>
        )}
      </div>

      {/* Recent Registrations */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Event</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats?.recentRegistrations?.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{reg.attendeeName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{reg.event?.title}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(new Date(reg.registrationDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {reg.checkedIn ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Checked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

