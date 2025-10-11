import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle, 
  Search,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('upcoming'); // Default to upcoming
  const [dateFilter, setDateFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [filterOptions, setFilterOptions] = useState({ locations: [], dateStats: {} });
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter, dateFilter, capacityFilter, locationFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/events/filters');
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.dateFilter = dateFilter;
      if (capacityFilter) params.capacityFilter = capacityFilter;
      if (locationFilter) params.location = locationFilter;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const response = await api.get('/events', { params });
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/mec-api/sync/events', {
        sourceUrl: 'https://housesoflight.org'
      });
      if (response.data.success) {
        toast.success('Events synced successfully!');
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync events');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'ongoing':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('upcoming');
    setDateFilter('');
    setCapacityFilter('');
    setLocationFilter('');
    setSortBy('startDate');
    setSortOrder('ASC');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (statusFilter && statusFilter !== 'upcoming') count++;
    if (dateFilter) count++;
    if (capacityFilter) count++;
    if (locationFilter) count++;
    if (sortBy !== 'startDate' || sortOrder !== 'ASC') count++;
    return count;
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your events</p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
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
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input pl-10 appearance-none min-w-[140px]"
                >
                  <option value="">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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
                Filters
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">All Dates</option>
                    <option value="today">Today ({filterOptions.dateStats.today})</option>
                    <option value="thisWeek">This Week ({filterOptions.dateStats.thisWeek})</option>
                    <option value="thisMonth">This Month ({filterOptions.dateStats.thisMonth})</option>
                    <option value="next30Days">Next 30 Days ({filterOptions.dateStats.next30Days})</option>
                    <option value="upcoming">All Upcoming ({filterOptions.dateStats.upcoming})</option>
                    <option value="past">Past Events ({filterOptions.dateStats.past})</option>
                  </select>
                </div>

                {/* Capacity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <select
                    value={capacityFilter}
                    onChange={(e) => setCapacityFilter(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">All Capacity</option>
                    <option value="available">Available Seats</option>
                    <option value="full">Full Events</option>
                    <option value="lowCapacity">Low Capacity (80%+)</option>
                    <option value="popular">Popular (10+ registrations)</option>
                    <option value="new">New (≤2 registrations)</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">All Locations</option>
                    {filterOptions.locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
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
                      <option value="startDate">Date</option>
                      <option value="title">Title</option>
                      <option value="registrations">Registrations</option>
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

      {/* Events Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="card hover:shadow-lg transition-shadow group"
            >
              {/* Event Image or Placeholder */}
              <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Calendar className="w-16 h-16 text-primary-400" />
                )}
              </div>

              {/* Event Details */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{format(new Date(event.startDate), 'MMM dd, yyyy h:mm a')}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">
                        {event.stats.totalRegistrations}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Registered</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {event.stats.checkedInCount}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Checked In</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600">
                        {event.stats.remainingSeats}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Remaining</p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Capacity</span>
                      <span>{event.stats.capacityPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(event.stats.capacityPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            {search || statusFilter
              ? 'Try adjusting your filters'
              : 'Sync with MEC to import events'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Events;

