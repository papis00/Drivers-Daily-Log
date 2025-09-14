from django.test import TestCase
from .models import Trip
from .eld_logic import ELDCalculator

class ELDLogicTestCase(TestCase):
    def setUp(self):
        self.trip = Trip.objects.create(
            current_location="New York, NY",
            pickup_location="Chicago, IL", 
            dropoff_location="Los Angeles, CA",
            current_cycle_used=0,
            total_distance=2800,  # miles
            total_duration=45     # hours
        )
    
    def test_eld_calculator_initialization(self):
        """
        Test ELD Calculator initialization with trip data
        """
        calculator = ELDCalculator(self.trip)
        self.assertEqual(calculator.total_distance, 2800)
        self.assertEqual(calculator.total_driving_time, 45)
    
    def test_estimate_total_days(self):
        """
        Test the estimation of total days needed for the trip
        """
        calculator = ELDCalculator(self.trip)
        total_days = calculator.estimate_total_days()
        
        # Check if number of days is realistic
        self.assertGreaterEqual(total_days, 4)  # At least 4 days
        self.assertLessEqual(total_days, 7)     # Maximum 7 days
    
    def test_daily_logs_creation(self):
        """
        Test the creation and accuracy of daily logs
        """
        calculator = ELDCalculator(self.trip)
        daily_logs = calculator.calculate_daily_logs()
        
        # Check if logs were created
        self.assertGreater(len(daily_logs), 0)
        
        # Verify total driving hours are correct
        total_driving = sum(log.driving_hours for log in daily_logs)
        self.assertAlmostEqual(total_driving, 45, delta=5)  # Approximately 45 hours
