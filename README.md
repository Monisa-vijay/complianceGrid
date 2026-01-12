# ComplianceGrid

A full-stack compliance tracking application with periodic review requirements, automated reminders, and evidence management.

## Features

- **Evidence Categories Management**: Create and manage evidence categories with review periods (weekly, monthly, quarterly)
- **Periodic Review System**: Automatic calculation of due dates and submission period generation
- **Google Drive Integration**: Direct file uploads to Google Drive with organized folder structure
- **Automated Reminders**: Email notifications for upcoming deadlines and overdue submissions
- **Dashboard**: Overview of all categories, upcoming deadlines, and submission status
- **File Upload**: Drag-and-drop interface for evidence file submissions
- **Review Workflow**: Approve/reject submissions with comments and feedback

## Tech Stack

- **Backend**: Python 3.11+, Django 5.0+, Django REST Framework
- **Frontend**: React 18+, TypeScript, Tailwind CSS
- **Database**: PostgreSQL
- **Storage**: Google Drive API

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Google Cloud Project with Drive API enabled

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up PostgreSQL database:
```bash
# Create database
createdb evidence_collection
```

5. Configure environment variables (create a `.env` file or set them):
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=evidence_collection
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@evidencecollection.com

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=your-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8000/api/upload/auth/callback
```

6. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

7. Create a superuser:
```bash
python manage.py createsuperuser
```

8. Run the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.

## Google Drive Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:8000/api/upload/auth/callback` to authorized redirect URIs
6. Copy the Client ID and Client Secret to your environment variables

## Management Commands

### Generate Submissions
Automatically generate submission records for active categories:
```bash
python manage.py generate_submissions
```

### Send Reminders
Send email reminders for upcoming deadlines:
```bash
python manage.py send_reminders
```

### Cron Job Setup

Add to your crontab to run daily:
```bash
# Send reminders daily at 9 AM
0 9 * * * cd /path/to/project/backend && python manage.py send_reminders

# Generate new submissions daily at midnight
0 0 * * * cd /path/to/project/backend && python manage.py generate_submissions
```

## API Endpoints

- `GET /api/categories/` - List all categories
- `POST /api/categories/` - Create category
- `GET /api/categories/{id}/` - Get category detail
- `PUT /api/categories/{id}/` - Update category
- `DELETE /api/categories/{id}/` - Delete category
- `GET /api/categories/{id}/submissions/` - Get category submissions
- `GET /api/submissions/` - List all submissions
- `GET /api/submissions/{id}/` - Get submission detail
- `POST /api/submissions/{id}/submit/` - Submit evidence with files
- `POST /api/submissions/{id}/approve/` - Approve submission
- `POST /api/submissions/{id}/reject/` - Reject submission
- `GET /api/submissions/dashboard/` - Dashboard statistics
- `GET /api/upload/auth/` - Initiate Google Drive OAuth
- `GET /api/upload/auth/callback/` - Handle OAuth callback

## Project Structure

```
evidence-collection/
├── backend/
│   ├── evidence/              # Main Django app
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API viewsets
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py            # URL routing
│   │   ├── services/          # Service layer
│   │   │   └── google_drive.py
│   │   └── management/
│   │       └── commands/      # Management commands
│   ├── evidence_collection/   # Django project settings
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   └── package.json
└── README.md
```

## Development

The application uses:
- Django REST Framework for API endpoints
- React Router for frontend routing
- Tailwind CSS for styling
- Axios for HTTP requests
- React Hot Toast for notifications

## License

This project is private and proprietary.

