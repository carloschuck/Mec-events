import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle, 
  Download,
  Mail,
  Search,
  ArrowLeft,
  FileText,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState([
    'attendeeName',
    'attendeeEmail',
    'numberOfTickets',
    'registrationDate',
    'checkedIn'
  ]);

  useEffect(() => {
    fetchEventDetails();
    fetchAnalytics();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      if (response.data.success) {
        setEvent(response.data.data.event);
        setRegistrations(response.data.data.event.registrations || []);
      }
    } catch (error) {
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/events/${id}/analytics`);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics');
    }
  };

  const handleExportPDF = async () => {
    try {
      const fields = selectedFields.join(',');
      const response = await api.get(`/events/${id}/export/pdf?fields=${fields}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-${id}-attendees.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF exported successfully');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/events/${id}/export/csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-${id}-attendees.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const filteredRegistrations = registrations.filter((reg) =>
    reg.attendeeName.toLowerCase().includes(search.toLowerCase()) ||
    reg.attendeeEmail.toLowerCase().includes(search.toLowerCase())
  );

  const PIE_COLORS = ['#10b981', '#6b7280', '#3b82f6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Event not found</p>
        <Link to="/events" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Events
        </Link>
      </div>
    );
  }

  const exportFields = [
    { id: 'attendeeName', label: 'Name' },
    { id: 'attendeeEmail', label: 'Email' },
    { id: 'attendeePhone', label: 'Phone' },
    { id: 'numberOfTickets', label: 'Tickets' },
    { id: 'registrationDate', label: 'Registration Date' },
    { id: 'checkedIn', label: 'Check-in Status' },
    { id: 'checkedInAt', label: 'Check-in Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/events" className="inline-flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Events
      </Link>

      {/* Event Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{format(new Date(event.startDate), 'EEEE, MMMM dd, yyyy h:mm a')}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {user?.role === 'admin' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Export PDF
              </button>
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Registered</p>
          <p className="text-3xl font-bold text-primary-600">{event.stats.totalRegistrations}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Checked In</p>
          <p className="text-3xl font-bold text-green-600">{event.stats.checkedInCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Remaining Seats</p>
          <p className="text-3xl font-bold text-gray-600">{event.stats.remainingSeats}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Capacity</p>
          <p className="text-3xl font-bold text-orange-600">{event.stats.capacityPercentage}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics?.dailyRegistrations || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
              <YAxis />
              <Tooltip labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Registrations" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Check-in Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics?.pieData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics?.pieData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendee List */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Attendee List</h2>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search attendees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tickets</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Registered</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{reg.attendeeName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{reg.attendeeEmail}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{reg.numberOfTickets}</td>
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

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No attendees found
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export PDF</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">Select fields to include in the export:</p>

            <div className="space-y-2 mb-6">
              {exportFields.map((field) => (
                <label key={field.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFields([...selectedFields, field.id]);
                      } else {
                        setSelectedFields(selectedFields.filter(f => f !== field.id));
                      }
                    }}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={selectedFields.length === 0}
                className="flex-1 btn btn-primary"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;

