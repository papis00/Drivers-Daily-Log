import React, { useState } from 'react';

const DailyLogs = ({ tripData }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'

  if (!tripData || !tripData.daily_logs) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">No daily logs available</p>
      </div>
    );
  }

  const { daily_logs } = tripData;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatHours = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getTotalHours = (log) => {
    return log.driving_hours + log.off_duty_hours + log.on_duty_hours;
  };

  const getStatusColor = (hours, maxHours) => {
    const percentage = (hours / maxHours) * 100;
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 75) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const SummaryView = () => (
    <div className="space-y-4">
      {/* Trip Overview */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <h3 className="font-bold text-blue-900 mb-3">Trip Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-semibold text-blue-800">Trip ID</p>
            <p className="text-blue-600">#{tripData.id}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800">Total Distance</p>
            <p className="text-blue-600">{tripData.total_distance?.toFixed(1) || 'N/A'} miles</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800">Total Duration</p>
            <p className="text-blue-600">{formatHours(tripData.total_duration || 0)}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800">Trip Days</p>
            <p className="text-blue-600">{daily_logs.length} days</p>
          </div>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {daily_logs.map((log, index) => (
          <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-gray-900">Day {log.day_number}</h4>
                <p className="text-sm text-gray-600">{formatDate(log.date)}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedDay(index);
                  setViewMode('detailed');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details →
              </button>
            </div>
            
            {/* Hours Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm font-medium text-green-800">Driving</span>
                <span className={`text-sm font-bold px-2 py-1 rounded ${getStatusColor(log.driving_hours, 11)}`}>
                  {formatHours(log.driving_hours)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm font-medium text-blue-800">On-Duty</span>
                <span className={`text-sm font-bold px-2 py-1 rounded ${getStatusColor(log.on_duty_hours, 14)}`}>
                  {formatHours(log.on_duty_hours)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-800">Off-Duty</span>
                <span className="text-sm font-bold text-gray-600 px-2 py-1 rounded bg-gray-100">
                  {formatHours(log.off_duty_hours)}
                </span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="mt-3 space-y-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((log.driving_hours / 11) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 text-center">
                Driving: {log.driving_hours.toFixed(1)}/11.0 hours
              </div>
            </div>

            {log.notes && (
              <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <p className="text-sm text-yellow-800">{log.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const DetailedView = () => {
    const log = daily_logs[selectedDay];
    if (!log) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Daily Log - Day {log.day_number}
            </h3>
            <p className="text-gray-600">{formatDate(log.date)}</p>
          </div>
          <button
            onClick={() => setViewMode('summary')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back to Summary
          </button>
        </div>

        {/* Official ELD Log Format */}
        <div className="bg-white border-2 border-gray-800 rounded-lg p-6" style={{ fontFamily: 'monospace' }}>
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">DRIVER'S DAILY LOG</h2>
              <div className="text-right">
                <p className="font-bold">Date: {new Date(log.date).toLocaleDateString()}</p>
                <p>Driver: [Driver Name]</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Vehicle:</strong> [Vehicle ID]</p>
                <p><strong>Co-driver:</strong> [Co-driver Name]</p>
              </div>
              <div>
                <p><strong>Carrier:</strong> [Carrier Name]</p>
                <p><strong>Main Office Address:</strong> [Address]</p>
              </div>
            </div>
          </div>

          {/* Time Grid */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">24-HOUR PERIOD (MIDNIGHT TO MIDNIGHT)</h3>
            
            {/* Time Scale */}
            <div className="grid grid-cols-24 gap-0 mb-2 text-xs">
              {Array.from({length: 24}, (_, i) => (
                <div key={i} className="text-center border-r border-gray-300 py-1">
                  {i.toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Status Rows */}
            <div className="space-y-2">
              {/* Off Duty Row */}
              <div className="grid grid-cols-25 gap-0 items-center">
                <div className="text-sm font-semibold pr-2">OFF DUTY</div>
                {Array.from({length: 24}, (_, hour) => {
                  const isOffDuty = hour >= 14 || hour < 6; // Example: off duty 2PM to 6AM
                  return (
                    <div key={hour} className={`h-6 border border-gray-300 ${isOffDuty ? 'bg-gray-400' : ''}`}></div>
                  );
                })}
              </div>

              {/* Sleeper Row */}
              <div className="grid grid-cols-25 gap-0 items-center">
                <div className="text-sm font-semibold pr-2">SLEEPER</div>
                {Array.from({length: 24}, (_, hour) => (
                  <div key={hour} className="h-6 border border-gray-300"></div>
                ))}
              </div>

              {/* Driving Row */}
              <div className="grid grid-cols-25 gap-0 items-center">
                <div className="text-sm font-semibold pr-2">DRIVING</div>
                {Array.from({length: 24}, (_, hour) => {
                  const isDriving = hour >= 6 && hour < 15; // Example: driving 6AM to 3PM
                  return (
                    <div key={hour} className={`h-6 border border-gray-300 ${isDriving ? 'bg-green-400' : ''}`}></div>
                  );
                })}
              </div>

              {/* On Duty Row */}
              <div className="grid grid-cols-25 gap-0 items-center">
                <div className="text-sm font-semibold pr-2">ON DUTY</div>
                {Array.from({length: 24}, (_, hour) => {
                  const isOnDuty = (hour >= 5 && hour < 6) || (hour >= 15 && hour < 16); // Loading/unloading
                  return (
                    <div key={hour} className={`h-6 border border-gray-300 ${isOnDuty ? 'bg-blue-400' : ''}`}></div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="border-t-2 border-gray-800 pt-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-3">TOTAL HOURS</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Off Duty:</span>
                    <span className="font-mono">{formatHours(log.off_duty_hours)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sleeper Berth:</span>
                    <span className="font-mono">00:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driving:</span>
                    <span className="font-mono">{formatHours(log.driving_hours)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On Duty (Not Driving):</span>
                    <span className="font-mono">{formatHours(log.on_duty_hours)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>TOTAL:</span>
                    <span className="font-mono">24:00</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-3">LOCATION & REMARKS</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p><strong>Starting Location:</strong></p>
                    <p className="text-gray-700">{tripData.current_location}</p>
                  </div>
                  <div>
                    <p><strong>Ending Location:</strong></p>
                    <p className="text-gray-700">
                      {selectedDay === 0 ? tripData.pickup_location : 
                       selectedDay === daily_logs.length - 1 ? tripData.dropoff_location : 
                       'En Route'}
                    </p>
                  </div>
                  {log.notes && (
                    <div>
                      <p><strong>Remarks:</strong></p>
                      <p className="text-gray-700">{log.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-6 pt-4 border-t border-gray-400">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm mb-2">Driver's Signature:</p>
                  <div className="border-b border-gray-400 h-8"></div>
                </div>
                <div>
                  <p className="text-sm mb-2">Date:</p>
                  <div className="border-b border-gray-400 h-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
            disabled={selectedDay === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous Day
          </button>
          
          <span className="text-gray-600">
            Day {selectedDay + 1} of {daily_logs.length}
          </span>
          
          <button
            onClick={() => setSelectedDay(Math.min(daily_logs.length - 1, selectedDay + 1))}
            disabled={selectedDay === daily_logs.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Day →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {viewMode === 'summary' ? <SummaryView /> : <DetailedView />}
    </div>
  );
};

export default DailyLogs;