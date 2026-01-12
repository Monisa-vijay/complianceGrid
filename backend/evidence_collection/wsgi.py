"""
WSGI config for evidence_collection project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'evidence_collection.settings')

application = get_wsgi_application()



