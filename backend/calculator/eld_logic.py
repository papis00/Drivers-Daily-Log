from datetime import timedelta
import math
from .models import DailyLog

class ELDCalculator:
    """
    Class to calculate ELD logs according to HOS regulations
    """
    MAX_DRIVING_HOURS = 11
    MAX_DUTY_HOURS = 14
    MIN_REST_BREAK = 0.5
    DAILY_REST_HOURS = 10
    CYCLE_HOURS = 70
    FUEL_STOP_INTERVAL = 1000
    FUEL_STOP_DURATION = 1
    
    def __init__(self, trip):
        self.trip = trip
        self.total_distance = trip.total_distance or 0
        self.total_driving_time = trip.total_duration or 0
        self.current_cycle_used = trip.current_cycle_used
        self.daily_logs = []
        
    def calculate_daily_logs(self):
        """
        Calculate daily logs based on distance, duration and ELD rules
        """
        print(f"Calculating logs for distance={self.total_distance}, duration={self.total_driving_time}, cycle used={self.current_cycle_used}")
        
        # Check if required data is available
        if self.total_distance <= 0 or self.total_driving_time <= 0:
            print("Error: total_distance or total_driving_time is invalid")
            return []
        
        # Calculate number of days needed
        total_days = self.estimate_total_days()
        print(f"Estimated number of days: {total_days}")
        
        # Avoid division by zero
        if total_days <= 0:
            total_days = 1
            
        # Calculate distance and duration per day
        daily_distance = self.total_distance / total_days
        daily_driving_time = self.total_driving_time / total_days
        print(f"Daily distance: {daily_distance}, Daily duration: {daily_driving_time}")
        
        # Create logs for each day
        for day in range(1, total_days + 1):
            self.create_daily_log(day, daily_distance, daily_driving_time)
            
        print(f"Logs created: {len(self.daily_logs)}")
        return self.daily_logs

    def estimate_total_days(self):
        """
        Estimate total number of days needed for the trip
        """
        effective_daily_driving_hours = min(self.MAX_DRIVING_HOURS, 
                                           self.get_available_driving_hours())
        
        # Avoid division by zero
        if effective_daily_driving_hours <= 0:
            return 1
            
        days_by_driving = math.ceil(self.total_driving_time / effective_daily_driving_hours)
        fuel_stops = math.floor(self.total_distance / self.FUEL_STOP_INTERVAL)
        days_by_fuel = max(1, fuel_stops)
        
        return max(days_by_driving, days_by_fuel)
    
    def get_available_driving_hours(self):
        """
        Calculate available driving hours in current cycle
        """
        return max(0, self.CYCLE_HOURS - self.current_cycle_used)
    
    def create_daily_log(self, day_number, daily_distance, daily_driving_time):
        """
        Create a daily log with calculated activities
        """
        driving_hours = min(daily_driving_time, self.MAX_DRIVING_HOURS, 
                        self.get_available_driving_hours())
        
        on_duty_hours = driving_hours
        
        if day_number == 1:
            on_duty_hours += 1
        if day_number == self.estimate_total_days():
            on_duty_hours += 1
        
        fuel_stops = math.floor(daily_distance / self.FUEL_STOP_INTERVAL)
        on_duty_hours += fuel_stops * self.FUEL_STOP_DURATION
        
        rest_break = self.MIN_REST_BREAK if driving_hours >= 8 else 0
        off_duty_hours = self.DAILY_REST_HOURS + rest_break
        
        total_hours = driving_hours + on_duty_hours + off_duty_hours
        if total_hours > 24:
            off_duty_hours -= (total_hours - 24)
        
        # Generate notes
        notes = self.generate_daily_notes(day_number, fuel_stops)
        
        # Calculate actual date (trip creation date + day number - 1)
        trip_creation_date = self.trip.created_at.date()
        log_date = trip_creation_date + timedelta(days=day_number - 1)
        
        # Create DailyLog without using reverse relationship
        daily_log = DailyLog.objects.create(
            trip=self.trip,
            day_number=day_number,
            date=log_date,
            driving_hours=round(driving_hours, 2),
            on_duty_hours=round(on_duty_hours, 2),
            off_duty_hours=round(off_duty_hours, 2),
            notes=notes
        )
        
        self.daily_logs.append(daily_log)
        self.current_cycle_used += driving_hours
    
    def generate_daily_notes(self, day_number, fuel_stops):
        """
        Generate descriptive notes for daily log
        """
        notes = []
        
        if day_number == 1:
            notes.append("Pickup location loading time (1h)")
        if day_number == self.estimate_total_days():
            notes.append("Dropoff location unloading time (1h)")
        
        if fuel_stops > 0:
            notes.append(f"Fuel stop(s): {fuel_stops} x {self.FUEL_STOP_DURATION}h")
        
        if any([day_number == 1, day_number == self.estimate_total_days(), fuel_stops > 0]):
            return "; ".join(notes)
        
        return "Regular driving day"