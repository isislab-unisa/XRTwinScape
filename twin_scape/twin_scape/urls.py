from django.contrib import admin
from django.urls import path, include
from .views import home, health_check

urlpatterns = [
    path('', home, name="home"),
    path('health_check/', health_check, name="health_check"),
    path('admin/', admin.site.urls),
    path('', include('twin_scape_core.urls')),
]