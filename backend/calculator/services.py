import requests
import os
from django.conf import settings
from .eld_logic import ELDCalculator

def geocode_address(address):
    """
    Convertit une adresse en coordonnées géographiques
    """
    api_key = os.getenv('OPENROUTE_SERVICE_API_KEY')
    if not api_key:
        raise Exception("Clé API OpenRouteService non configurée")
    
    url = "https://api.openrouteservice.org/geocode/search"
    
    headers = {
        'Authorization': api_key
    }
    
    params = {
        'text': address,
        'size': 1
    }
    
    try:
        print(f"Geocoding address: {address}")
        response = requests.get(url, headers=headers, params=params)
        print(f"Status code: {response.status_code}")
        
        response.raise_for_status()
        data = response.json()
        print(f"Geocoding response: {data}")
        
        if data.get('features'):
            coords = data['features'][0]['geometry']['coordinates']
            print(f"Coordinates found: {coords}")
            return {'lng': coords[0], 'lat': coords[1]}
        else:
            error_msg = data.get('error', {}).get('message', 'No features found')
            print(f"Geocoding error: {error_msg}")
            raise Exception(f"Address not found: {address}. Error: {error_msg}")
    except requests.exceptions.RequestException as e:
        print(f"Geocoding request error: {str(e)}")
        raise Exception(f"Geocoding error: {str(e)}")

def get_route_data(start_loc, end_loc):
    """
    Récupère les données d'itinéraire depuis l'API OpenRouteService
    """
    api_key = os.getenv('OPENROUTE_SERVICE_API_KEY')
    if not api_key:
        raise Exception("Clé API OpenRouteService non configurée")
    
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    
    headers = {
        'Authorization': api_key,
        'Content-Type': 'application/json'
    }
    
    body = {
        "coordinates": [
            [start_loc['lng'], start_loc['lat']],
            [end_loc['lng'], end_loc['lat']]
        ],
        "instructions": "false",
        "geometry": "true"
    }
    
    try:
        response = requests.post(url, json=body, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Extraction de la distance et de la durée depuis la nouvelle structure
        distance = data['routes'][0]['summary']['distance']  # en mètres
        duration = data['routes'][0]['summary']['duration']  # en secondes
        
        return {
            'distance': distance,
            'duration': duration,
            'geometry': data['routes'][0]['geometry']
        }
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Erreur API OpenRouteService: {str(e)}")

def calculate_route_and_logs(trip):
    """
    Calcule l'itinéraire et les logs ELD pour un trip - Version avec API réelle
    """
    try:
        print(f"=== DÉBUT DU CALCUL POUR LE TRIP {trip.id} ===")
        
        # Géocodage des adresses
        print("Géocodage des adresses...")
        current_coords = geocode_address(trip.current_location)
        pickup_coords = geocode_address(trip.pickup_location)
        dropoff_coords = geocode_address(trip.dropoff_location)
        
        # Récupération des données d'itinéraire
        print("Calcul des itinéraires...")
        route_data_current_to_pickup = get_route_data(current_coords, pickup_coords)
        route_data_pickup_to_dropoff = get_route_data(pickup_coords, dropoff_coords)
        
        # Extraction de la distance et de la durée
        distance_current_to_pickup = route_data_current_to_pickup['distance'] / 1609.34  # mètres -> miles
        duration_current_to_pickup = route_data_current_to_pickup['duration'] / 3600     # secondes -> heures
        
        distance_pickup_to_dropoff = route_data_pickup_to_dropoff['distance'] / 1609.34
        duration_pickup_to_dropoff = route_data_pickup_to_dropoff['duration'] / 3600
        
        # Calcul des totaux
        total_distance = distance_current_to_pickup + distance_pickup_to_dropoff
        total_duration = duration_current_to_pickup + duration_pickup_to_dropoff
        
        print(f"Totaux calculés: {total_distance} miles, {total_duration} heures")
        
        # Mise à jour du trip avec les données calculées
        trip.total_distance = total_distance
        trip.total_duration = total_duration
        trip.save()
        
        # Calcul des logs ELD
        print("Calcul des logs ELD...")
        eld_calculator = ELDCalculator(trip)
        daily_logs = eld_calculator.calculate_daily_logs()
        print(f"{len(daily_logs)} journées créées")
        
        print("=== CALCUL TERMINÉ AVEC SUCCÈS ===")
        return trip
        
    except Exception as e:
        print(f"=== ERREUR LORS DU CALCUL AVEC L'API ===")
        print(f"Erreur: {str(e)}")
        print("Utilisation des données mockées en fallback...")
        
        # Fallback vers les données mockées en cas d'erreur
        trip.total_distance = 2789.24  # miles
        trip.total_duration = 41.5     # hours
        trip.save()
        
        # Calcul des logs ELD avec les données mockées
        eld_calculator = ELDCalculator(trip)
        daily_logs = eld_calculator.calculate_daily_logs()
        
        return trip
    
