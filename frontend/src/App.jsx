import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TripForm from './components/TripForm';
import RouteMap from './components/RouteMap';
import DailyLogs from './components/DailyLogs';
import Header from './components/Header';

function App() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(false);

  const handleTripSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setResetTrigger(prev => !prev); // Trigger reset in TripForm
    
    
    try {
      // Appel à votre API backend
      const response = await fetch('https://drivers-daily-log.onrender.com/api/trips/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const data = await response.json();
      setTripData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTrip = () => {
    setTripData(null);
    setError(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header onNewTrip={handleNewTrip} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Driver's Daily Log Generator
                  </h1>
                  
                  <TripForm 
                    onSubmit={handleTripSubmit} 
                    loading={loading}
                    error={error}
                    resetTrigger={resetTrigger}
                    
                  />
                </div>

                {tripData && (
                  <div id="results-section">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Route Information
                      </h2>
                      <RouteMap tripData={tripData} />
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Daily Log Sheets
                      </h2>
                      <DailyLogs tripData={tripData} />
                    </div>
                  </div>
                )}
              </div>
            } />
            
            <Route path="/logs/:day" element={<DailyLogs tripData={tripData} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

