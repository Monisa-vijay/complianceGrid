from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvidenceCategoryViewSet, EvidenceSubmissionViewSet, GoogleAuthView, AuthView, EvidenceFileViewSet, NotificationViewSet, LoginView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),  # CSRF-exempt login endpoint - must come before router
]

router = DefaultRouter()
router.register(r'categories', EvidenceCategoryViewSet, basename='category')
router.register(r'controls', EvidenceCategoryViewSet, basename='control')  # Alias for categories
router.register(r'submissions', EvidenceSubmissionViewSet, basename='submission')
router.register(r'files', EvidenceFileViewSet, basename='file')
router.register(r'documents', EvidenceFileViewSet, basename='document')  # Alias for files
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'auth', AuthView, basename='auth')
router.register(r'auth/google', GoogleAuthView, basename='google-auth')  # Keep for backward compatibility

urlpatterns += [
    path('', include(router.urls)),
]

