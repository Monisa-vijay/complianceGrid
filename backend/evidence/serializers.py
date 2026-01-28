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
    reviewed_by = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='submission.category.name', read_only=True)
    submission_id = serializers.IntegerField(source='submission.id', read_only=True)
    file_url = serializers.SerializerMethodField()
    submission_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = EvidenceFile
        fields = ['id', 'filename', 'file', 'file_url', 'google_drive_file_id', 'google_drive_file_url',
                  'file_size', 'mime_type', 'uploaded_by', 'uploaded_at', 'category_name', 'submission_id',
                  'status', 'reviewed_by', 'reviewed_at', 'review_notes', 'submission_notes']
    
    def get_file_url(self, obj):
        """Return the file URL (local file if available, otherwise Google Drive URL)"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return obj.google_drive_file_url or ''
    
    def get_submission_notes(self, obj):
        """Return file-level submission_notes, or fall back to submission's submission_notes if file doesn't have it"""
        # If file has its own submission_notes, use that
        if obj.submission_notes:
            return obj.submission_notes
        # Otherwise, fall back to submission's submission_notes
        return obj.submission.submission_notes or ''


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
    past_submissions = serializers.SerializerMethodField()
    compliance_score = serializers.SerializerMethodField()
    
    class Meta:
        model = EvidenceCategory
        fields = ['id', 'name', 'description', 'evidence_requirements', 'review_period',
                  'category_group', 'google_drive_folder_id', 'assigned_reviewers', 'primary_assignee', 
                  'assignee', 'assignee_id', 'approver', 'approver_id', 'created_by', 'created_at', 'updated_at', 'is_active', 
                  'current_submission', 'past_submissions', 'compliance_score']
    
    def get_current_submission(self, obj):
        """Get the current/active submission with files filtered to include status 'PENDING', 'SUBMITTED', or 'UNDER_REVIEW'.
        try:
            from .models import EvidenceStatus, EvidenceSubmission
            from django.utils import timezone
            from datetime import timedelta
            
            # Get the active submission (PENDING, SUBMITTED, or UNDER_REVIEW)
            submission = obj.submissions.filter(
                status__in=[EvidenceStatus.PENDING, EvidenceStatus.SUBMITTED, EvidenceStatus.UNDER_REVIEW]
            ).order_by('-due_date').first()
            
            # If no active submission exists, create one
            if not submission:
                today = timezone.now().date()
                
                # Check if there's a latest submission to determine the next period
                latest = obj.submissions.order_by('-period_end_date').first()
                
                if not latest or latest.period_end_date < today:
                    # No submissions exist, or latest period has ended - create new submission
                    if not latest:
                        # First submission for this category
                        start_date = today
                    else:
                        # Latest period ended, start new period
                        start_date = latest.period_end_date + timedelta(days=1)
                    
                    due_date_obj = obj.calculate_next_due_date(start_date)
                    due_date = due_date_obj.date() if hasattr(due_date_obj, 'date') else due_date_obj
                    
                    submission = EvidenceSubmission.objects.create(
                        category=obj,
                        period_start_date=start_date,
                        period_end_date=due_date - timedelta(days=1),
                        due_date=due_date,
                        status=EvidenceStatus.PENDING
                    )
                else:
                    # Latest submission period hasn't ended, but it's APPROVED/REJECTED
                    # Create a new PENDING submission for the current period starting today
                    start_date = today
                    # Use the latest submission's due_date if it's in the future, otherwise calculate new one
                    if latest.due_date > today:
                        due_date = latest.due_date
                        period_end_date = latest.period_end_date
                    else:
                        due_date_obj = obj.calculate_next_due_date(start_date)
                        due_date = due_date_obj.date() if hasattr(due_date_obj, 'date') else due_date_obj
                        period_end_date = due_date - timedelta(days=1)
                    
                    submission = EvidenceSubmission.objects.create(
                        category=obj,
                        period_start_date=start_date,
                        period_end_date=period_end_date,
                        due_date=due_date,
                        status=EvidenceStatus.PENDING
                    )
       
            if not submission:
                return None
            
            # Serialize the submission
            submission_data = EvidenceSubmissionSerializer(submission, context=self.context).data
            
            # Filter files to include those with status PENDING, SUBMITTED, or UNDER_REVIEW
            # Ensure files is always a list (never None or missing)
            files = submission_data.get('files')
            if files is None:
                files = []
            elif not isinstance(files, list):
                files = []
            
            submission_data['files'] = [
                file for file in files
                if file.get('status') in [EvidenceStatus.PENDING, EvidenceStatus.SUBMITTED, EvidenceStatus.UNDER_REVIEW]
            ]
            
            return submission_data
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
    
    def get_past_submissions(self, obj):
        """Get submissions with files filtered to only include status 'APPROVED' or 'REJECTED'"""
        try:
            from django.db.models import Q
            from .models import EvidenceStatus
            
            # Get submissions that have files with status APPROVED or REJECTED
            submissions = obj.submissions.filter(
                Q(status__in=[EvidenceStatus.APPROVED, EvidenceStatus.REJECTED]) |
                Q(files__status__in=[EvidenceStatus.APPROVED, EvidenceStatus.REJECTED])
            ).distinct().order_by('-due_date')[:10]
            
            # Serialize each submission and filter files
            result = []
            for submission in submissions:
                submission_data = EvidenceSubmissionSerializer(submission, context=self.context).data
                
                # Filter files to only include those with status APPROVED or REJECTED
                # Ensure files is always a list (never None or missing)
                files = submission_data.get('files')
                if files is None:
                    files = []
                elif not isinstance(files, list):
                    files = []
                
                submission_data['files'] = [
                    file for file in files
                    if file.get('status') in [EvidenceStatus.APPROVED, EvidenceStatus.REJECTED]
                ]
                # Only include submissions that have at least one approved/rejected file
                if submission_data['files']:
                    result.append(submission_data)
            
            return result
        except Exception as e:
            # Log error but don't break the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting past submissions for category {obj.id}: {e}")
        return []


# Alias for backward compatibility - both serializers now have the same functionality
EvidenceCategoryDetailSerializer = EvidenceCategorySerializer


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


class CategoryGroupAnalyticsSerializer(serializers.Serializer):
    group_code = serializers.CharField()
    group_label = serializers.CharField()
    total_controls = serializers.IntegerField()
    compliance_score = serializers.FloatField()
    overdue_count = serializers.IntegerField()
    at_risk_count = serializers.IntegerField()
    compliant_count = serializers.IntegerField()
    no_data_count = serializers.IntegerField()


class PriorityIssueSerializer(serializers.Serializer):
    priority = serializers.IntegerField()
    control_id = serializers.IntegerField()
    control_name = serializers.CharField()
    status = serializers.CharField()
    days_overdue = serializers.IntegerField(allow_null=True)
    assignee_name = serializers.CharField(allow_null=True)
    assignee_id = serializers.IntegerField(allow_null=True)
    issue_type = serializers.CharField()
    compliance_score = serializers.FloatField(allow_null=True)


class UpcomingDeadlineSerializer(serializers.Serializer):
    control_id = serializers.IntegerField()
    control_name = serializers.CharField()
    due_date = serializers.DateField()
    days_until_due = serializers.IntegerField()
    review_period = serializers.CharField()
    assignee_name = serializers.CharField(allow_null=True)
    status = serializers.CharField()


class AnalyticsSerializer(serializers.Serializer):
    # Action Required
    overdue_count = serializers.IntegerField()
    overdue_aging = serializers.DictField()
    my_assignments_count = serializers.IntegerField()
    pending_approvals_count = serializers.IntegerField()
    no_evidence_count = serializers.IntegerField()
    missing_assignees_count = serializers.IntegerField()
    missing_approvers_count = serializers.IntegerField()
    
    # Compliance Health
    overall_compliance_score = serializers.FloatField()
    compliance_trend = serializers.CharField()
    category_groups = CategoryGroupAnalyticsSerializer(many=True)
    at_risk_controls_count = serializers.IntegerField()
    
    # What's Due Next
    due_next_7_days = serializers.IntegerField()
    due_next_14_days = serializers.IntegerField()
    due_next_30_days = serializers.IntegerField()
    upcoming_deadlines_by_period = serializers.DictField()
    upcoming_deadlines = UpcomingDeadlineSerializer(many=True)
    
    # Workflow Efficiency
    average_approval_time_hours = serializers.FloatField(allow_null=True)
    rejection_rate = serializers.FloatField()
    submission_trends = serializers.ListField()
    bottleneck_approvers = serializers.ListField()
    
    # Risk & Gap Analysis
    priority_issues = PriorityIssueSerializer(many=True)
