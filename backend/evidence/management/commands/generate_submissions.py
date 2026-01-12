from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from evidence.models import EvidenceCategory, EvidenceSubmission, EvidenceStatus


class Command(BaseCommand):
    help = 'Auto-generate submission records for active categories'

    def handle(self, *args, **options):
        categories = EvidenceCategory.objects.filter(is_active=True)
        created_count = 0
        
        for category in categories:
            latest = EvidenceSubmission.objects.filter(
                category=category
            ).order_by('-period_end_date').first()
            
            today = timezone.now().date()
            
            if not latest:
                # First submission for this category
                start_date = today
                due_date_obj = category.calculate_next_due_date(start_date)
                due_date = due_date_obj.date() if hasattr(due_date_obj, 'date') else due_date_obj
                
                EvidenceSubmission.objects.create(
                    category=category,
                    period_start_date=start_date,
                    period_end_date=due_date - timedelta(days=1),
                    due_date=due_date,
                    status=EvidenceStatus.PENDING
                )
                created_count += 1
                self.stdout.write(f"Created first submission for {category.name}")
                
            elif latest.period_end_date <= today:
                # Create next submission period
                start_date = latest.period_end_date + timedelta(days=1)
                due_date_obj = category.calculate_next_due_date(start_date)
                due_date = due_date_obj.date() if hasattr(due_date_obj, 'date') else due_date_obj
                
                EvidenceSubmission.objects.create(
                    category=category,
                    period_start_date=start_date,
                    period_end_date=due_date - timedelta(days=1),
                    due_date=due_date,
                    status=EvidenceStatus.PENDING
                )
                created_count += 1
                self.stdout.write(f"Created new submission for {category.name}")
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Successfully generated {created_count} submission(s)'))
        else:
            self.stdout.write('No new submissions needed at this time')

