from django.core.management.base import BaseCommand
from evidence.models import EvidenceCategory
import csv
import os


class Command(BaseCommand):
    help = 'Remove categories that are not in the CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the CSV file',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']
        
        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_file}'))
            return
        
        # Read CSV names
        csv_names = set()
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('Control Short', '').strip()
                    if name:
                        csv_names.add(name)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading CSV: {e}'))
            return
        
        self.stdout.write(f'Found {len(csv_names)} unique names in CSV')
        
        # Get all categories from database
        db_categories = EvidenceCategory.objects.all()
        db_names = {cat.name: cat for cat in db_categories}
        
        # Find categories not in CSV
        to_delete = []
        for name, category in db_names.items():
            # Check case-insensitive match
            name_lower = name.lower().strip()
            csv_names_lower = {n.lower().strip() for n in csv_names}
            
            if name_lower not in csv_names_lower:
                to_delete.append(category)
        
        self.stdout.write(f'\nFound {len(to_delete)} categories not in CSV:')
        
        deleted_count = 0
        for cat in to_delete:
            submission_count = cat.submissions.count()
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'  Would delete: ID {cat.id} - "{cat.name}" (submissions: {submission_count})'
                    )
                )
            else:
                if submission_count > 0:
                    # Delete anyway - submissions will be orphaned or we can delete them
                    # For now, just delete the category (submissions will have null category)
                    self.stdout.write(
                        self.style.WARNING(
                            f'  Deleting ID {cat.id} - "{cat.name}" (has {submission_count} submission(s) - will be orphaned)'
                        )
                    )
                    cat.delete()
                    deleted_count += 1
                else:
                    cat.delete()
                    deleted_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'  Deleted: ID {cat.id} - "{cat.name}"')
                    )
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDRY RUN: Would delete {len(to_delete)} categories'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDeleted {deleted_count} categories'
                )
            )
            remaining = EvidenceCategory.objects.count()
            self.stdout.write(f'Remaining categories: {remaining}')

