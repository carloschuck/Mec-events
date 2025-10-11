import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search,
  Filter,
  Download,
  SortAsc,
  SortDesc,
  X,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';

const Attendees = () => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filterOptions, setFilterOptions] = useState({ events: [], checkInStats: {} });
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [checkedInFilter, setCheckedInFilter] = useState('');
  const [sortBy, setSortBy] = useState('attendeeName');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAttendees();
    fetchStats();
    fetchFilterOptions();
  }, [search, eventFilter, checkedInFilter, sortBy, sortOrder, currentPage]);

  const fetchAttendees = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 50,
        sortBy,
        sortOrder
      };

      if (search) params.search = search;
      if (eventFilter) params.eventId = eventFilter;
      if (checkedInFilter !== '') params.checkedIn = checkedInFilter;

      const response = await api.get('/attendees', { params });
      if (response.data.success) {
        setAttendees(response.data.data.attendees);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      toast.error('Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/attendees/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/attendees/filters');
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setEventFilter('');
    setCheckedInFilter('');
    setSortBy('attendeeName');
    setSortOrder('ASC');
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (eventFilter) count++;
    if (checkedInFilter !== '') count++;
    if (sortBy !== 'attendeeName' || sortOrder !== 'ASC') count++;
    return count;
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (eventFilter) params.eventId = eventFilter;
      if (checkedInFilter !== '') params.checkedIn = checkedInFilter;

      const response = await api.get(`/attendees/export/${format}`, { 
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendees-list.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} exported successfully!`);
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'ASC' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendees</h1>
          <p className="text-gray-600 mt-1">Manage and view all event attendees</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn btn-outline flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Attendees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAttendees || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-gray-900">{stats.checkedInCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Not Checked In</p>
              <p className="text-2xl font-bold text-gray-900">{stats.notCheckedInCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Check-in Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.checkInRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col gap-4">
          {/* Main Filter Row */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>

              {/* Event Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="input pl-10 appearance-none min-w-[200px]"
                >
                  <option value="">All Events</option>
                  {filterOptions.events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({event.attendeeCount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                More Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Check-in Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Status</label>
                  <select
                    value={checkedInFilter}
                    onChange={(e) => setCheckedInFilter(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">All Status</option>
                    <option value="true">Checked In ({filterOptions.checkInStats.checkedIn})</option>
                    <option value="false">Not Checked In ({filterOptions.checkInStats.notCheckedIn})</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <div className="flex gap-1">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="input flex-1"
                    >
                      <option value="attendeeName">Name</option>
                      <option value="attendeeEmail">Email</option>
                      <option value="registrationDate">Registration Date</option>
                      <option value="eventTitle">Event</option>
                    </select>
                    <button
                      onClick={() => toggleSort(sortBy)}
                      className="btn btn-outline px-3"
                      title={`Sort ${sortOrder === 'ASC' ? 'Descending' : 'Ascending'}`}
                    >
                      {sortOrder === 'ASC' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendees Table */}
      {attendees.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => toggleSort('attendeeName')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Attendee {getSortIcon('attendeeName')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => toggleSort('attendeeEmail')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Contact {getSortIcon('attendeeEmail')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => toggleSort('registrationDate')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Registration Date {getSortIcon('registrationDate')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {attendee.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {attendee.email}
                        </div>
                        {attendee.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {attendee.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendee.event ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {attendee.event.title}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(attendee.event.startDate), 'MMM dd, yyyy')}
                          </div>
                          {attendee.event.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-1" />
                              {attendee.event.location}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendee.numberOfTickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(attendee.registrationDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        attendee.checkedIn 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {attendee.checkedIn ? 'Checked In' : 'Not Checked In'}
                      </span>
                      {attendee.checkedInAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(attendee.checkedInAt), 'MMM dd, h:mm a')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendees found</h3>
          <p className="text-gray-600">
            {search || eventFilter || checkedInFilter !== ''
              ? 'Try adjusting your filters'
              : 'No attendees have registered for events yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Attendees;
