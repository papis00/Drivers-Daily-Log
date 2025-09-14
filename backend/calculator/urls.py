from django.urls import path
from . import views

urlpatterns = [
    path('trips/', views.TripListCreateView.as_view(), name='trip-list-create'),
    path('trips/<int:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('test-api/', views.test_api_view, name='test-api'),
    path('test-endpoint/', views.test_endpoint, name='test-endpoint'),  
]