from django.urls import path
from .views import pick_data_from_minio, render_xrts_viewer, build, pick_annotation_from_minio, complete_build, get_images
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('pick_data_from_minio/<str:resource>', pick_data_from_minio, name='pick_data_from_minio'),
    path('pick_annotation_from_minio/<str:annotation>', pick_annotation_from_minio, name='pick_annotation_from_minio'),
    path('render_xrts_viewer/', render_xrts_viewer, name='render_xrts_viewer'),
    path('build', build, name='build'),
    path('complete_build/', complete_build, name='complete_build'),
    path('get_images/<int:id>/', get_images, name='get_images'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]