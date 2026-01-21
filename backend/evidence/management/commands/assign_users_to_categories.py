from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from evidence.models import EvidenceCategory
import csv
import os
from django.conf import settings


class Command(BaseCommand):
    help = 'Assign users to categories from CSV file with "Assigned to" column'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the CSV file with "Assigned to" column',
        )
        parser.add_argument(
            '--create-users',
            action='store_true',
            help='Create user accounts if they do not exist',
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_file}'))
            return

        assigned_count = 0
        not_found_count = 0
        category_not_found_count = 0

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                # Try to detect delimiter
                sample = f.read(1024)
                f.seek(0)
                try:
                    sniffer = csv.Sniffer()
                    delimiter = sniffer.sniff(sample).delimiter
                except:
                    delimiter = ','
                
                reader = csv.DictReader(f, delimiter=delimiter)
                
                for row_num, row in enumerate(reader, start=2):
                    try:
                        # Get category name
                        category_name = row.get('Control Short') or row.get('Control') or row.get('Name') or row.get('Category') or ''
                        assigned_str = row.get('Assigned to') or row.get('Assigned') or ''
                        
                        if not category_name or not category_name.strip():
                            continue
                        
                        if not assigned_str or not assigned_str.strip():
                            continue
                        
                        # Find category
                        try:
                            category = EvidenceCategory.objects.get(name__iexact=category_name.strip())
                        except EvidenceCategory.DoesNotExist:
                            category_not_found_count += 1
                            self.stdout.write(self.style.WARNING(f'Row {row_num}: Category not found - {category_name}'))
                            continue
                        except EvidenceCategory.MultipleObjectsReturned:
                            category = EvidenceCategory.objects.filter(name__iexact=category_name.strip()).first()
                        
                        # Find or create user
                        assigned_name = assigned_str.strip()
                        assigned_user = None
                        
                        # Try exact username match first
                        try:
                            assigned_user = User.objects.get(username__iexact=assigned_name.lower().replace(' ', '_'))
                        except User.DoesNotExist:
                            # Try first name match
                            try:
                                assigned_user = User.objects.get(first_name__iexact=assigned_name)
                            except (User.DoesNotExist, User.MultipleObjectsReturned):
                                # Try partial match on first name
                                users = User.objects.filter(first_name__icontains=assigned_name.split()[0] if assigned_name.split() else assigned_name)
                                if users.count() == 1:
                                    assigned_user = users.first()
                        
                        # Create user if not found and --create-users flag is set
                        if not assigned_user and options['create_users']:
                            username = assigned_name.lower().replace(' ', '_')
                            assigned_user = User.objects.create_user(
                                username=username,
                                email=f'{username}@company.com',
                                first_name=assigned_name,
                                password='Data@123'  # Default password
                            )
                            self.stdout.write(self.style.SUCCESS(f'Created user: {assigned_user.username}'))
                        
                        if assigned_user:
                            category.assignee = assigned_user
                            category.save()
                            assigned_count += 1
                            self.stdout.write(self.style.SUCCESS(
                                f'Row {row_num}: Assigned {category.name} to {assigned_user.username}'
                            ))
                        else:
                            not_found_count += 1
                            self.stdout.write(self.style.WARNING(
                                f'Row {row_num}: User not found - "{assigned_name}" for category "{category_name}"'
                            ))
                            
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Row {row_num}: Error - {str(e)}'))
                        continue

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading CSV file: {str(e)}'))
            return

        self.stdout.write(self.style.SUCCESS(
            f'\nAssignment complete: {assigned_count} assigned, {not_found_count} users not found, {category_not_found_count} categories not found'
        ))

