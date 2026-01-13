from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from django.conf import settings
import io
import json


class GoogleDriveService:
    def __init__(self, credentials_dict=None, access_token=None):
        """
        Initialize Google Drive service.
        credentials_dict: Dictionary containing OAuth2 credentials
        access_token: String access token (alternative to credentials_dict)
        """
        if credentials_dict:
            # If it's just a token, create credentials from it
            if 'token' in credentials_dict and len(credentials_dict) == 1:
                from google.oauth2.credentials import Credentials
                credentials = Credentials(token=credentials_dict['token'])
            else:
                credentials = Credentials.from_authorized_user_info(credentials_dict)
            self.service = build('drive', 'v3', credentials=credentials)
        elif access_token:
            # Create credentials from access token string
            from google.oauth2.credentials import Credentials
            from django.conf import settings
            credentials = Credentials(
                token=access_token,
                client_id=settings.GOOGLE_DRIVE_CLIENT_ID,
                client_secret=settings.GOOGLE_DRIVE_CLIENT_SECRET,
                token_uri='https://oauth2.googleapis.com/token'
            )
            self.service = build('drive', 'v3', credentials=credentials)
        else:
            self.service = None
    
    @staticmethod
    def get_oauth_flow():
        """Get OAuth2 flow for authentication"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_DRIVE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_DRIVE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_DRIVE_REDIRECT_URI]
                }
            },
            scopes=settings.GOOGLE_DRIVE_SCOPES
        )
        flow.redirect_uri = settings.GOOGLE_DRIVE_REDIRECT_URI
        return flow
    
    def upload_file(self, file_content, filename, folder_id, mime_type='application/octet-stream'):
        """
        Upload file to specific Google Drive folder
        
        Args:
            file_content: Bytes content of the file
            filename: Name of the file
            folder_id: Google Drive folder ID
            mime_type: MIME type of the file
        
        Returns:
            Dictionary with file_id and web_url
        """
        if not self.service:
            raise ValueError("Google Drive service not initialized. Please authenticate first.")
        
        file_metadata = {
            'name': filename,
            'parents': [folder_id] if folder_id else []
        }
        
        media = MediaIoBaseUpload(
            io.BytesIO(file_content),
            mimetype=mime_type,
            resumable=True
        )
        
        file = self.service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        
        return {
            'file_id': file.get('id'),
            'web_url': file.get('webViewLink')
        }
    
    def create_folder(self, folder_name, parent_folder_id=None):
        """
        Create a folder in Google Drive
        
        Args:
            folder_name: Name of the folder
            parent_folder_id: Optional parent folder ID
        
        Returns:
            Folder ID
        """
        if not self.service:
            raise ValueError("Google Drive service not initialized. Please authenticate first.")
        
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_folder_id:
            file_metadata['parents'] = [parent_folder_id]
        
        folder = self.service.files().create(
            body=file_metadata,
            fields='id'
        ).execute()
        return folder.get('id')
    
    def list_files(self, folder_id):
        """
        List files in a folder
        
        Args:
            folder_id: Google Drive folder ID
        
        Returns:
            List of file dictionaries
        """
        if not self.service:
            raise ValueError("Google Drive service not initialized. Please authenticate first.")
        
        results = self.service.files().list(
            q=f"'{folder_id}' in parents",
            fields="files(id, name, webViewLink)"
        ).execute()
        return results.get('files', [])

