from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.request import Request
from .views import EvidenceCategoryViewSet, EvidenceSubmissionViewSet, GoogleAuthView, GoogleOAuthCallbackView, AuthView, EvidenceFileViewSet, NotificationViewSet, LoginView

def export_no_slash_view(request):
    """Handle /categories/export (without trailing slash) by calling the ViewSet action"""
    viewset = EvidenceCategoryViewSet()
    # Wrap Django request in DRF Request object
    drf_request = Request(request)
    # Initialize the viewset properly
    viewset.request = drf_request
    viewset.format_kwarg = None
    viewset.action = 'export_groups'
    # Call the action method with the DRF request object
    return viewset.export_groups(drf_request)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),  # CSRF-exempt login endpoint - must come before router
    path('auth/google/callback/', GoogleOAuthCallbackView.as_view(), name='google-oauth-callback'),  # CSRF-exempt OAuth callback
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
    # Handle export endpoint without trailing slash for Postman/compatibility
    path('categories/export', export_no_slash_view, name='category-export-no-slash'),
]

