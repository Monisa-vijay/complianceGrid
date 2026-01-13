from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from evidence.models import EvidenceSubmission, EvidenceStatus, ReminderLog, Notification


class Command(BaseCommand):
    help = 'Send reminder emails for evidence submissions'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # 7-day reminders
        self.send_reminders(today + timedelta(days=7), '7_days')
        
        # 3-day reminders
        self.send_reminders(today + timedelta(days=3), '3_days')
        
        # 1-day reminders
        self.send_reminders(today + timedelta(days=1), '1_day')
        
        # Overdue reminders
        self.send_overdue_reminders(today)
        
        # Due date notifications (in-app notifications for assignees on due date)
        self.send_due_date_notifications(today)
        
        self.stdout.write(self.style.SUCCESS('Successfully sent reminders'))

    def send_reminders(self, due_date, reminder_type):
        submissions = EvidenceSubmission.objects.filter(
            due_date=due_date,
            status=EvidenceStatus.PENDING
        ).select_related('category', 'submitted_by')
        
        for submission in submissions:
            # Check if reminder already sent today
            if ReminderLog.objects.filter(
                submission=submission,
                reminder_type=reminder_type,
                sent_at__date=timezone.now().date()
            ).exists():
                continue
            
            # If no submitted_by, skip (shouldn't happen but safety check)
            if not submission.submitted_by:
                # Try to get from category assigned reviewers
                reviewers = submission.category.assigned_reviewers.all()
                if reviewers.exists():
                    submission.submitted_by = reviewers.first()
                else:
                    continue
            
            self.send_email(submission, reminder_type)

    def send_overdue_reminders(self, today):
        submissions = EvidenceSubmission.objects.filter(
            due_date__lt=today,
            status=EvidenceStatus.PENDING
        ).select_related('category', 'submitted_by')
        
        for submission in submissions:
            # Send overdue reminder once per day
            if ReminderLog.objects.filter(
                submission=submission,
                reminder_type='overdue',
                sent_at__date=timezone.now().date()
            ).exists():
                continue
            
            # If no submitted_by, try to get from category assigned reviewers
            if not submission.submitted_by:
                reviewers = submission.category.assigned_reviewers.all()
                if reviewers.exists():
                    submission.submitted_by = reviewers.first()
                else:
                    continue
            
            self.send_email(submission, 'overdue')

    def send_email(self, submission, reminder_type):
        days_map = {
            '7_days': '7 days',
            '3_days': '3 days',
            '1_day': '1 day',
            'overdue': 'OVERDUE'
        }
        
        subject = f"Evidence Submission Reminder: {submission.category.name}"
        message = f"""Hello,

This is a reminder that your evidence submission for "{submission.category.name}" is due in {days_map[reminder_type]}.

Due Date: {submission.due_date}
Period: {submission.period_start_date} to {submission.period_end_date}

Evidence Requirements:
{submission.category.evidence_requirements}

Please submit your evidence as soon as possible.

Best regards,
ComplianceGrid System
"""
        
        try:
            if submission.submitted_by and submission.submitted_by.email:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [submission.submitted_by.email],
                    fail_silently=False,
                )
                
                ReminderLog.objects.create(
                    submission=submission,
                    reminder_type=reminder_type,
                    sent_to=submission.submitted_by,
                    email_sent=True
                )
                
                self.stdout.write(f"Sent {reminder_type} reminder for {submission.category.name} to {submission.submitted_by.email}")
            else:
                self.stdout.write(self.style.WARNING(f"No email address for submission {submission.id}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to send email: {str(e)}"))
    
    def send_due_date_notifications(self, today):
        """Send in-app notifications to assignees on due date"""
        submissions = EvidenceSubmission.objects.filter(
            due_date=today,
            status=EvidenceStatus.PENDING
        ).select_related('category', 'category__assignee')
        
        notifications_created = 0
        for submission in submissions:
            category = submission.category
            # Send notification to assignee if exists
            if category.assignee:
                # Check if notification already exists for this submission today
                existing_notification = Notification.objects.filter(
                    user=category.assignee,
                    submission=submission,
                    notification_type='OVERDUE',
                    created_at__date=today
                ).first()
                
                if not existing_notification:
                    # Create notification with link to control-file page
                    Notification.objects.create(
                        user=category.assignee,
                        notification_type='OVERDUE',
                        title=f'Due Today: {category.name}',
                        message=f'Evidence submission for "{category.name}" is due today. Please submit your evidence files.',
                        category=category,
                        submission=submission,
                        is_read=False
                    )
                    notifications_created += 1
                    self.stdout.write(f"Created due date notification for {category.name} to {category.assignee.username}")
        
        if notifications_created > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {notifications_created} due date notification(s)'))

