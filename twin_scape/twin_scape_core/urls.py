from django.urls import path
from .views import pick_data_from_minio, render_xrts_viewer, build, complete_build, get_images, get_data_from_minio, delete_data_on_minio, upload_data_on_minio, get_lessons
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.decorators.cache import never_cache


urlpatterns = [
    path('pick_data_from_minio/<str:resource>', pick_data_from_minio, name='pick_data_from_minio'),
    path('render_xrts_viewer/', never_cache(render_xrts_viewer), name='render_xrts_viewer'),
    path('build', build, name='build'),
    path('complete_build/', complete_build, name='complete_build'),
    path('get_images/<int:id>/', get_images, name='get_images'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('get_data_from_minio/', get_data_from_minio, name='get_data_from_minio'),
    path('delete_data_on_minio/', delete_data_on_minio, name='delete_data_on_minio'),
    path('upload_data_on_minio/', upload_data_on_minio, name='upload_data_on_minio'),
    path('get_lessons/', get_lessons, name='get_lessons')
]