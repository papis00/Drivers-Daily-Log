from rest_framework import serializers
from .models import Trip, DailyLog

class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = '__all__'

class TripSerializer(serializers.ModelSerializer):
    daily_logs = DailyLogSerializer(many=True, read_only=True) 
    
    class Meta:
        model = Trip
        fields = ['id', 'current_location', 'pickup_location', 'dropoff_location', 
                 'current_cycle_used', 'total_distance', 'total_duration', 
                 'created_at', 'daily_logs']
    