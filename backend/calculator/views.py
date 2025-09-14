# calculator/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from django.db import transaction
from .models import Trip
from .serializers import TripSerializer
from .services import calculate_route_and_logs
from django.http import JsonResponse
import requests
import os
from dotenv import load_dotenv
from rest_framework.decorators import api_view

@api_view(['GET'])
def test_endpoint(request):
    print("✅ Test endpoint called")
    return Response({"message": "Test successful", "status": "ok"})

def test_api_view(request):
    load_dotenv()
    
    api_key = os.getenv('OPENROUTE_SERVICE_API_KEY')
    url = "https://api.openrouteservice.org/v2/directions/driving-car"

    headers = {
        'Authorization': api_key,
        'Content-Type': 'application/json'
    }

    body = {
        "coordinates": [[8.681495,49.41461],[8.686507,49.41943]],
        "instructions": "false"
    }

    response = requests.post(url, json=body, headers=headers)
    
    return JsonResponse({
        'status_code': response.status_code,
        'response': response.json()
    })

class TripListCreateView(generics.ListCreateAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        print("🟢 POST request received on /api/trips/")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Save the basic trip
            trip = serializer.save()
            print(f"✅ Trip created with ID: {trip.id}")
            
            # Calculate route and logs
            print("🔄 Calling calculate_route_and_logs...")
            calculate_route_and_logs(trip)
            print("✅ calculate_route_and_logs completed successfully")
            
            # Reload object with updated data
            trip.refresh_from_db()
            print(f"📊 Data after calculation - Distance: {trip.total_distance}, Duration: {trip.total_duration}")
            
            headers = self.get_success_headers(serializer.data)
            
            return Response(
                TripSerializer(trip).data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
            
        except Exception as e:
            print(f"❌ ERROR in view: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Error while calculating route: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class TripDetailView(generics.RetrieveAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer