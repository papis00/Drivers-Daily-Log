Drivers Daily Log - Full Stack Application
📋 Project Overview

A full-stack web application built with Django and React that helps truck drivers manage their Electronic Logging Device (ELD) records. The app calculates driving routes, generates compliant daily logs, and visualizes trip information.
🎯 Features

    Trip Planning: Input current location, pickup, and dropoff locations

    Route Calculation: Automatic distance and duration calculations

    HOS Compliance: Automatically calculates Hours of Service compliance (70hrs/8days)

    Visual Mapping: Interactive map showing the complete route

    Daily Log Generation: Automatically generates FMCSA-compliant daily logs

    Multi-day Support: Handles trips spanning multiple days

🛠️ Technology Stack
Backend

    Django - Python web framework

    Django REST Framework - API construction

    SQLite - database

Frontend

    React - User interface library

    Leaflet/OpenStreetMap - Mapping functionality

    Axios - API communication

    Tailwind CSS - Styling and responsive design

    React Hook Form - Form management

📦 Installation & Setup

Backend Setup

    Clone the repository:

bash

git clone <repository-url>
cd backend

    Create a virtual environment:

bash

python -m venv env
source venv/bin/activate  # On Windows: venv\Scripts\activate

    Install dependencies:

bash

pip install -r requirements.txt

    Configure database settings in settings.py:

python

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

    Run migrations:

bash

python manage.py migrate

    Start the development server:

bash

python manage.py runserver

Frontend Setup

    Navigate to the frontend directory:

bash

cd frontend

    Install dependencies:

bash

npm install

    Start the development server:

bash

npm start

    Open your browser to http://localhost:5173

🚀 Usage

    Enter Trip Details:

        Current location

        Pickup location

        Dropoff location

        Current cycle hours used

    View Results:

        Interactive map showing the route

        Calculated distance and driving time

        Generated daily logs for each day of the trip

   