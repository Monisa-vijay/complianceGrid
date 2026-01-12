from django.core.management.base import BaseCommand
from evidence.models import EvidenceCategory
from django.db.models import Count


class Command(BaseCommand):
    help = 'Remove duplicate categories, keeping the oldest one'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find duplicates by name (case-insensitive)
        from collections import defaultdict
        all_categories = EvidenceCategory.objects.all()
        name_map = defaultdict(list)
        
        for cat in all_categories:
            normalized_name = cat.name.lower().strip()
            name_map[normalized_name].append(cat)
        
        duplicates = {k: v for k, v in name_map.items() if len(v) > 1}
        
        total_duplicates = 0
        deleted_count = 0
        
        for normalized_name, categories in duplicates.items():
            count = len(categories)
            total_duplicates += (count - 1)  # All but one are duplicates
            
            # Sort by creation date, then ID
            categories_sorted = sorted(categories, key=lambda c: (c.created_at, c.id))
            
            # Keep the first (oldest) one, delete the rest
            to_keep = categories_sorted[0]
            to_delete = categories_sorted[1:]
            
            self.stdout.write(
                self.style.WARNING(
                    f'\nFound {count} categories with name "{to_keep.name}" (normalized: "{normalized_name}"):'
                )
            )
            self.stdout.write(f'  Keeping: ID {to_keep.id} (created: {to_keep.created_at})')
            
            for cat in to_delete:
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  Would delete: ID {cat.id} - "{cat.name}" (created: {cat.created_at})'
                        )
                    )
                else:
                    # Check if this category has submissions
                    submission_count = cat.submissions.count()
                    if submission_count > 0:
                        # Move submissions to the kept category before deleting
                        self.stdout.write(
                            self.style.WARNING(
                                f'  Moving {submission_count} submission(s) from ID {cat.id} to ID {to_keep.id}'
                            )
                        )
                        for submission in cat.submissions.all():
                            submission.category = to_keep
                            submission.save()
                        cat.delete()
                        deleted_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'  Deleted: ID {cat.id} - "{cat.name}" (submissions moved)')
                        )
                    else:
                        cat.delete()
                        deleted_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'  Deleted: ID {cat.id} - "{cat.name}"')
                        )
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDRY RUN: Would delete {total_duplicates} duplicate categories'
                )
            )
            self.stdout.write(f'Current total: {EvidenceCategory.objects.count()}')
            self.stdout.write(f'After cleanup: {EvidenceCategory.objects.count() - total_duplicates}')
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDeleted {deleted_count} duplicate categories'
                )
            )
            remaining = EvidenceCategory.objects.count()
            self.stdout.write(f'Remaining categories: {remaining}')

