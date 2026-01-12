from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from dateutil.relativedelta import relativedelta


class ReviewPeriod(models.TextChoices):
    DAILY = 'DAILY', 'Daily'
    DAILY_WEEKLY = 'DAILY_WEEKLY', 'Daily/Weekly'
    WEEKLY = 'WEEKLY', 'Weekly'
    WEEKLY_MONTHLY = 'WEEKLY_MONTHLY', 'Weekly/Monthly'
    MONTHLY = 'MONTHLY', 'Monthly'
    REGULAR = 'REGULAR', 'Regular'
    REGULAR_MONTHLY = 'REGULAR_MONTHLY', 'Regular - meeting monthly'
    MONTHLY_QUARTERLY = 'MONTHLY_QUARTERLY', 'Monthly/Quarterly'
    QUARTERLY = 'QUARTERLY', 'Quarterly'
    HALF_YEARLY_QUARTERLY = 'HALF_YEARLY_QUARTERLY', 'Half yearly/Quarterly'
    QUARTERLY_HALFYEARLY_ANNUALLY = 'QUARTERLY_HALFYEARLY_ANNUALLY', 'Quarterly/Halfyearly/Annually'
    ANNUALLY = 'ANNUALLY', 'Annually'


class EvidenceStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Submission'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'


class CategoryGroup(models.TextChoices):
    # Security (CC6)
    ACCESS_CONTROLS = 'ACCESS_CONTROLS', 'Access Controls'
    NETWORK_SECURITY = 'NETWORK_SECURITY', 'Network Security'
    PHYSICAL_SECURITY = 'PHYSICAL_SECURITY', 'Physical Security'
    DATA_PROTECTION = 'DATA_PROTECTION', 'Data Protection'
    ENDPOINT_SECURITY = 'ENDPOINT_SECURITY', 'Endpoint Security'
    MONITORING_INCIDENT = 'MONITORING_INCIDENT', 'Monitoring & Incident Response'
    # Availability (CC7)
    INFRASTRUCTURE_CAPACITY = 'INFRASTRUCTURE_CAPACITY', 'Infrastructure & Capacity'
    BACKUP_RECOVERY = 'BACKUP_RECOVERY', 'Backup & Recovery'
    BUSINESS_CONTINUITY = 'BUSINESS_CONTINUITY', 'Business Continuity'
    # Confidentiality (CC8)
    CONFIDENTIALITY = 'CONFIDENTIALITY', 'Confidentiality'
    # Common Criteria (CC1-CC5)
    CONTROL_ENVIRONMENT = 'CONTROL_ENVIRONMENT', 'Control Environment (CC1)'
    COMMUNICATION_INFO = 'COMMUNICATION_INFO', 'Communication & Information (CC2)'
    RISK_ASSESSMENT = 'RISK_ASSESSMENT', 'Risk Assessment (CC3)'
    MONITORING = 'MONITORING', 'Monitoring (CC4)'
    HR_TRAINING = 'HR_TRAINING', 'Control Activities - HR & Training (CC5)'
    CHANGE_MANAGEMENT = 'CHANGE_MANAGEMENT', 'Control Activities - Change Management (CC5)'
    VENDOR_MANAGEMENT = 'VENDOR_MANAGEMENT', 'Control Activities - Vendor Management (CC5)'
    # Uncategorized
    UNCATEGORIZED = 'UNCATEGORIZED', 'Uncategorized'


class EvidenceCategory(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    evidence_requirements = models.TextField()
    review_period = models.CharField(max_length=50, choices=ReviewPeriod.choices)
    category_group = models.CharField(max_length=50, choices=CategoryGroup.choices, default=CategoryGroup.UNCATEGORIZED)
    google_drive_folder_id = models.CharField(max_length=255, blank=True)
    assigned_reviewers = models.ManyToManyField(User, related_name='assigned_categories', blank=True)
    primary_assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_categories')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_controls', help_text='Person responsible for this control')
    approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approver_controls', help_text='Person who approves submissions for this control')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def calculate_next_due_date(self, from_date=None):
        if from_date is None:
            base_date = timezone.now()
        else:
            # Convert date to datetime if needed
            if isinstance(from_date, timezone.datetime):
                base_date = from_date
            else:
                base_date = timezone.datetime.combine(from_date, timezone.datetime.min.time())
        
        if self.review_period == ReviewPeriod.DAILY:
            result = base_date + timezone.timedelta(days=1)
        elif self.review_period == ReviewPeriod.DAILY_WEEKLY:
            result = base_date + timezone.timedelta(days=1)  # Daily for daily/weekly
        elif self.review_period == ReviewPeriod.WEEKLY:
            result = base_date + timezone.timedelta(days=7)
        elif self.review_period == ReviewPeriod.WEEKLY_MONTHLY:
            result = base_date + relativedelta(months=1)  # Monthly for weekly/monthly
        elif self.review_period == ReviewPeriod.MONTHLY:
            result = base_date + relativedelta(months=1)
        elif self.review_period == ReviewPeriod.REGULAR:
            result = base_date + relativedelta(months=1)  # Default to monthly for regular
        elif self.review_period == ReviewPeriod.REGULAR_MONTHLY:
            result = base_date + relativedelta(months=1)
        elif self.review_period == ReviewPeriod.MONTHLY_QUARTERLY:
            result = base_date + relativedelta(months=3)  # Quarterly for monthly/quarterly
        elif self.review_period == ReviewPeriod.QUARTERLY:
            result = base_date + relativedelta(months=3)
        elif self.review_period == ReviewPeriod.HALF_YEARLY_QUARTERLY:
            result = base_date + relativedelta(months=6)  # Half yearly
        elif self.review_period == ReviewPeriod.QUARTERLY_HALFYEARLY_ANNUALLY:
            result = base_date + relativedelta(months=12)  # Annually
        elif self.review_period == ReviewPeriod.ANNUALLY:
            result = base_date + relativedelta(months=12)
        else:
            result = base_date + relativedelta(months=1)  # Default to monthly
        
        # Return date object
        if isinstance(result, timezone.datetime):
            return result.date()
        return result
    
    def calculate_compliance_score(self):
        """
        Calculate compliance score for this category (control).
        Score is 100% if current submission has approved evidence, 0% otherwise.
        """
        # Get current active submission
        current_submission = self.submissions.filter(
            status__in=['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
        ).order_by('-due_date').first()
        
        if not current_submission:
            return 0
        
        # Check if current submission is approved and has evidence files
        if current_submission.status == EvidenceStatus.APPROVED and current_submission.files.exists():
            return 100.0
        
        # If submission has files but not yet approved, give partial credit
        if current_submission.files.exists():
            if current_submission.status == EvidenceStatus.SUBMITTED or current_submission.status == EvidenceStatus.UNDER_REVIEW:
                return 50.0  # Partial credit for submitted evidence
        
        return 0.0
    
    def should_reset_compliance_score(self):
        """
        Check if compliance score should be reset based on review period and due date.
        Returns True if the due date has passed for the current submission.
        """
        current_submission = self.submissions.filter(
            status__in=['PENDING', 'SUBMITTED', 'UNDER_REVIEW']
        ).order_by('-due_date').first()
        
        if not current_submission:
            return False
        
        # Check if due date has passed
        today = timezone.now().date()
        return current_submission.due_date < today
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Evidence Categories"
        ordering = ['name']


class EvidenceSubmission(models.Model):
    category = models.ForeignKey(EvidenceCategory, on_delete=models.CASCADE, related_name='submissions')
    period_start_date = models.DateField()
    period_end_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=EvidenceStatus.choices, default=EvidenceStatus.PENDING)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    submission_notes = models.TextField(blank=True)
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_overdue(self):
        return self.status == EvidenceStatus.PENDING and self.due_date < timezone.now().date()
    
    @property
    def days_until_due(self):
        delta = self.due_date - timezone.now().date()
        return delta.days
    
    def __str__(self):
        return f"{self.category.name} - {self.period_start_date} to {self.period_end_date}"
    
    class Meta:
        ordering = ['-due_date']


def evidence_file_upload_path(instance, filename):
    """Generate upload path for evidence files"""
    # Format: evidence_files/{category_id}/{submission_id}/{filename}
    return f'evidence_files/{instance.submission.category.id}/{instance.submission.id}/{filename}'

class EvidenceFile(models.Model):
    submission = models.ForeignKey(EvidenceSubmission, on_delete=models.CASCADE, related_name='files')
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to=evidence_file_upload_path, blank=True, null=True)
    # Keep Google Drive fields for backward compatibility (can be removed later)
    google_drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    google_drive_file_url = models.URLField(blank=True, null=True)
    file_size = models.IntegerField()
    mime_type = models.CharField(max_length=100)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.filename
    
    @property
    def file_url(self):
        """Return the file URL (local file if available, otherwise Google Drive URL)"""
        if self.file:
            return self.file.url
        return self.google_drive_file_url or ''
    
    class Meta:
        ordering = ['-uploaded_at']


class SubmissionComment(models.Model):
    submission = models.ForeignKey(EvidenceSubmission, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.submission}"
    
    class Meta:
        ordering = ['created_at']


class ReminderLog(models.Model):
    submission = models.ForeignKey(EvidenceSubmission, on_delete=models.CASCADE, related_name='reminder_logs')
    reminder_type = models.CharField(max_length=50)
    sent_to = models.ForeignKey(User, on_delete=models.CASCADE)
    sent_at = models.DateTimeField(auto_now_add=True)
    email_sent = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.reminder_type} reminder for {self.submission} to {self.sent_to.username}"
    
    class Meta:
        ordering = ['-sent_at']


class Notification(models.Model):
    """Notifications for users about due dates and approvals"""
    NOTIFICATION_TYPES = [
        ('DUE_SOON', 'Due Soon'),
        ('OVERDUE', 'Overdue'),
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('CONTROL_ASSIGNED', 'Control Assigned'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.ForeignKey(EvidenceCategory, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    submission = models.ForeignKey(EvidenceSubmission, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"

