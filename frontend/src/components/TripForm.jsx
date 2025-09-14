import React, { useEffect, useState } from 'react';

const TripForm = ({ onSubmit, loading, error, resetTrigger }) => {
  const initialFormData = {
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setFormData(initialFormData);
      setValidationErrors({});
  }, [resetTrigger]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.current_location.trim()) {
      errors.current_location = 'Current location is required';
    }
    
    if (!formData.pickup_location.trim()) {
      errors.pickup_location = 'Pickup location is required';
    }
    
    if (!formData.dropoff_location.trim()) {
      errors.dropoff_location = 'Dropoff location is required';
    }
    
    if (!formData.current_cycle_used) {
      errors.current_cycle_used = 'Current cycle hours is required';
    } else {
      const cycleHours = parseFloat(formData.current_cycle_used);
      if (isNaN(cycleHours) || cycleHours < 0 || cycleHours > 70) {
        errors.current_cycle_used = 'Current cycle must be between 0 and 70 hours';
      }
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const submitData = {
      ...formData,
      current_cycle_used: parseFloat(formData.current_cycle_used)
    };

    onSubmit(submitData);
  };

  const inputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border";
  const errorClasses = "border-red-300 focus:border-red-500 focus:ring-red-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="current_location" className="block text-sm font-medium text-gray-700">
            Current Location *
          </label>
          <input
            type="text"
            id="current_location"
            name="current_location"
            value={formData.current_location}
            onChange={handleChange}
            placeholder="e.g., Los Angeles, CA"
            className={`${inputClasses} ${validationErrors.current_location ? errorClasses : ''}`}
            disabled={loading}
          />
          {validationErrors.current_location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.current_location}</p>
          )}
        </div>

        <div>
          <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700">
            Pickup Location *
          </label>
          <input
            type="text"
            id="pickup_location"
            name="pickup_location"
            value={formData.pickup_location}
            onChange={handleChange}
            placeholder="e.g., Chicago, IL"
            className={`${inputClasses} ${validationErrors.pickup_location ? errorClasses : ''}`}
            disabled={loading}
          />
          {validationErrors.pickup_location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.pickup_location}</p>
          )}
        </div>

        <div>
          <label htmlFor="dropoff_location" className="block text-sm font-medium text-gray-700">
            Dropoff Location *
          </label>
          <input
            type="text"
            id="dropoff_location"
            name="dropoff_location"
            value={formData.dropoff_location}
            onChange={handleChange}
            placeholder="e.g., New York, NY"
            className={`${inputClasses} ${validationErrors.dropoff_location ? errorClasses : ''}`}
            disabled={loading}
          />
          {validationErrors.dropoff_location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.dropoff_location}</p>
          )}
        </div>

        <div>
          <label htmlFor="current_cycle_used" className="block text-sm font-medium text-gray-700">
            Current Cycle Used (Hours) *
          </label>
          <input
            type="number"
            id="current_cycle_used"
            name="current_cycle_used"
            value={formData.current_cycle_used}
            onChange={handleChange}
            placeholder="0.0"
            min="0"
            max="70"
            step="0.1"
            className={`${inputClasses} ${validationErrors.current_cycle_used ? errorClasses : ''}`}
            disabled={loading}
          />
          {validationErrors.current_cycle_used && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.current_cycle_used}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Enter hours already used in current 70-hour cycle (0-70)
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={loading}
          className={`px-8 py-3 bg-blue-600 cursor-pointer text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Route & Logs...
            </span>
          ) : (
            'Generate Route & Daily Logs'
          )}
        </button>
      </div>
    </form>
  );
};

export default TripForm;