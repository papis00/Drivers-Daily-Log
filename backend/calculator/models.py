from django.db import models

class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(default=0)  
    total_distance = models.FloatField(null=True, blank=True)  
    total_duration = models.FloatField(null=True, blank=True)  
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip from {self.current_location} to {self.dropoff_location}"

class DailyLog(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='daily_logs')
    day_number = models.IntegerField()
    date = models.DateField(null=True, blank=True)  
    driving_hours = models.FloatField(default=0)
    off_duty_hours = models.FloatField(default=0)
    on_duty_hours = models.FloatField(default=0)  
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Day {self.day_number} - Trip {self.trip.id}"