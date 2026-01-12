from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    EvidenceCategory, EvidenceSubmission, EvidenceFile,
    SubmissionComment, ReminderLog, Notification
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class EvidenceFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='submission.category.name', read_only=True)
    submission_id = serializers.IntegerField(source='submission.id', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EvidenceFile
        fields = ['id', 'filename', 'file', 'file_url', 'google_drive_file_id', 'google_drive_file_url',
                  'file_size', 'mime_type', 'uploaded_by', 'uploaded_at', 'category_name', 'submission_id']
    
    def get_file_url(self, obj):
        """Return the file URL (local file if available, otherwise Google Drive URL)"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return obj.google_drive_file_url or ''


class SubmissionCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SubmissionComment
        fields = ['id', 'user', 'comment', 'created_at']


class EvidenceSubmissionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    files = EvidenceFileSerializer(many=True, read_only=True)
    comments = SubmissionCommentSerializer(many=True, read_only=True)
    submitted_by = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    
    class Meta:
        model = EvidenceSubmission
        fields = ['id', 'category', 'category_name', 'period_start_date', 'period_end_date',
                  'due_date', 'status', 'submitted_by', 'submitted_at', 'reviewed_by',
                  'reviewed_at', 'submission_notes', 'review_notes', 'files', 'comments',
                  'is_overdue', 'days_until_due', 'created_at', 'updated_at']


class EvidenceCategorySerializer(serializers.ModelSerializer):
    assigned_reviewers = UserSerializer(many=True, read_only=True)
    primary_assignee = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assignee',
        write_only=True,
        required=False,
        allow_null=True
    )
    approver = UserSerializer(read_only=True)
    approver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='approver',
        write_only=True,
        required=False,
        allow_null=True
    )
    created_by = UserSerializer(read_only=True)
    current_submission = serializers.SerializerMethodField()
    compliance_score = serializers.SerializerMethodField()
    
    class Meta:
        model = EvidenceCategory
        fields = ['id', 'name', 'description', 'evidence_requirements', 'review_period',
                  'category_group', 'google_drive_folder_id', 'assigned_reviewers', 'primary_assignee', 
                  'assignee', 'assignee_id', 'approver', 'approver_id', 'created_by', 'created_at', 'updated_at', 'is_active', 
                  'current_submission', 'compliance_score']
    
    def get_current_submission(self, obj):
        """Get the current/active submission for this category"""
        try:
            # Check if submissions are prefetched
            if hasattr(obj, '_prefetched_objects_cache') and 'submissions' in obj._prefetched_objects_cache:
                # Use prefetched submissions (they're already loaded)
                submissions = obj._prefetched_objects_cache['submissions']
                # Filter active submissions
                active_submissions = [
                    s for s in submissions 
                    if s.status in ['PENDING', 'SUBMITTED', 'UNDER_REVIEW']
                ]
                if active_submissions:
                    # Sort by due_date descending and get the first one
                    submission = sorted(active_submissions, key=lambda x: x.due_date, reverse=True)[0]
                    return EvidenceSubmissionSerializer(submission, context=self.context).data
            else:
                # Fallback: query directly
                submission = obj.submissions.filter(
                    status__in=['PENDING', 'SUBMITTED', 'UNDER_REVIEW']
                ).order_by('-due_date').first()
                if submission:
                    return EvidenceSubmissionSerializer(submission, context=self.context).data
        except Exception as e:
            # Log error but don't break the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting current submission for category {obj.id}: {e}")
        return None
    
    def get_compliance_score(self, obj):
        """Calculate and return compliance score for this category"""
        # Check if score should be reset
        if obj.should_reset_compliance_score():
            return 0
        
        return obj.calculate_compliance_score()


class EvidenceCategoryDetailSerializer(EvidenceCategorySerializer):
    """Extended serializer for category detail view with past submissions"""
    past_submissions = serializers.SerializerMethodField()
    
    class Meta(EvidenceCategorySerializer.Meta):
        fields = EvidenceCategorySerializer.Meta.fields + ['past_submissions']
    
    def get_past_submissions(self, obj):
        """Get past submissions (approved, rejected, or old)"""
        submissions = obj.submissions.filter(
            status__in=['APPROVED', 'REJECTED']
        ).order_by('-due_date')[:10]
        return EvidenceSubmissionSerializer(submissions, many=True).data


class DashboardStatsSerializer(serializers.Serializer):
    total_categories = serializers.IntegerField()
    pending_submissions = serializers.IntegerField()
    overdue_submissions = serializers.IntegerField()
    approved_this_month = serializers.IntegerField()
    # Gap Analysis
    controls_without_evidence = serializers.IntegerField()
    controls_without_assignee = serializers.IntegerField()
    controls_without_approver = serializers.IntegerField()
    controls_with_overdue = serializers.IntegerField()
    controls_with_low_compliance = serializers.IntegerField()
    controls_pending_approval = serializers.IntegerField()
    upcoming_deadlines = EvidenceSubmissionSerializer(many=True)


class NotificationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    submission_id = serializers.IntegerField(source='submission.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'category', 'category_name', 
                  'category_id', 'submission', 'submission_id', 'is_read', 'created_at']

