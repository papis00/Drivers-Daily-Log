import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ onNewTrip }) => {
  const handleNewTripClick = (e) => {
    e.preventDefault();
    if (onNewTrip) {
      onNewTrip();
    }
  };

  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center space-x-3" onClick={handleNewTripClick}>
            <div className="bg-blue-700 p-2 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Driver's Daily Log</h1>
              <p className="text-blue-200 text-sm">ELD Compliance Generator</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={handleNewTripClick}
              className="flex items-center cursor-pointer space-x-2 hover:text-blue-200 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">New Trip</span>
            </button>
            
            <div className="text-blue-200 text-sm">
              Property Carrying • 70hrs/8days
            </div>
          </nav>

          {/* Menu mobile */}
          <div className="md:hidden">
            <button 
              onClick={handleNewTripClick}
              className="flex items-center space-x-1 hover:text-blue-200 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">New Trip</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


