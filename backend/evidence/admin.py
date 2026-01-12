from django.contrib import admin
from .models import (
    EvidenceCategory, EvidenceSubmission, EvidenceFile,
    SubmissionComment, ReminderLog
)


@admin.register(EvidenceCategory)
class EvidenceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'review_period', 'is_active', 'created_at']
    list_filter = ['review_period', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['assigned_reviewers']


@admin.register(EvidenceSubmission)
class EvidenceSubmissionAdmin(admin.ModelAdmin):
    list_display = ['category', 'period_start_date', 'period_end_date', 'due_date', 'status', 'is_overdue']
    list_filter = ['status', 'due_date', 'category']
    search_fields = ['category__name']
    readonly_fields = ['is_overdue', 'days_until_due']


@admin.register(EvidenceFile)
class EvidenceFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'submission', 'file_size', 'uploaded_at']
    list_filter = ['uploaded_at', 'mime_type']
    search_fields = ['filename']


@admin.register(SubmissionComment)
class SubmissionCommentAdmin(admin.ModelAdmin):
    list_display = ['submission', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['comment']


@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ['submission', 'reminder_type', 'sent_to', 'sent_at', 'email_sent']
    list_filter = ['reminder_type', 'email_sent', 'sent_at']
    search_fields = ['submission__category__name']



