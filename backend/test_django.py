import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eld_backend.settings')
django.setup()

from calculator.models import Trip
from calculator.services import calculate_route_and_logs

# Create a test trip
trip = Trip.objects.create(
    current_location="New York, NY",
    pickup_location="Chicago, IL", 
    dropoff_location="Los Angeles, CA",
    current_cycle_used=10.5
)

print(f"Trip created: {trip.id}")
calculate_route_and_logs(trip)
print(f"Result: Distance={trip.total_distance}, Duration={trip.total_duration}")