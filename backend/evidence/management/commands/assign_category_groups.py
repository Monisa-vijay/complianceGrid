from django.core.management.base import BaseCommand
from evidence.models import EvidenceCategory, CategoryGroup
import csv
import os
from django.conf import settings


class Command(BaseCommand):
    help = 'Assign category groups to controls based on control IDs from CSV'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-file',
            type=str,
            help='Path to the CSV file (default: all_categories.csv in backend directory)',
            default=None,
        )

    def handle(self, *args, **options):
        # Get CSV file path
        csv_file = options.get('csv_file')
        if not csv_file:
            # Default to all_categories.csv in backend directory
            csv_file = os.path.join(settings.BASE_DIR, 'all_categories.csv')
        
        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_file}'))
            return

        # Read CSV to create a mapping of control number to category name
        control_to_name = {}
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                # Try to detect delimiter
                sample = f.read(1024)
                f.seek(0)
                sniffer = csv.Sniffer()
                delimiter = sniffer.sniff(sample).delimiter
                
                reader = csv.DictReader(f, delimiter=delimiter)
                for row in reader:
                    control_no = row.get('No', '').strip()
                    control_name = row.get('Control Short', '').strip()
                    if control_no and control_name:
                        try:
                            control_no_int = int(control_no)
                            control_to_name[control_no_int] = control_name
                        except ValueError:
                            continue
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading CSV: {e}'))
            return

        # Define the mapping of control IDs to category groups
        # Control IDs refer to the "No" column in the CSV
        group_mapping = {
            # Security (CC6) - Access Controls
            'ACCESS_CONTROLS': [3, 41, 42, 43, 44, 45, 46, 47, 48, 49, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
            # Security (CC6) - Network Security
            'NETWORK_SECURITY': [24, 34, 36, 86, 87, 88, 89, 90, 91, 92],
            # Security (CC6) - Physical Security
            'PHYSICAL_SECURITY': [71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83],
            # Data Protection
            'DATA_PROTECTION': [59, 84, 85, 95, 96, 97, 98, 99, 100, 101, 102, 103],
            # Endpoint Security
            'ENDPOINT_SECURITY': [40, 51, 96, 101, 104, 105, 106, 107],
            # Monitoring & Incident Response
            'MONITORING_INCIDENT': [29, 35, 88, 111, 112, 113, 114, 115, 116],
            # Availability (CC7) - Infrastructure & Capacity
            'INFRASTRUCTURE_CAPACITY': [39, 138, 139, 140, 141, 142],
            # Availability (CC7) - Backup & Recovery
            'BACKUP_RECOVERY': [92, 102, 143, 144, 145, 146, 147],
            # Availability (CC7) - Business Continuity
            'BUSINESS_CONTINUITY': [135, 147],
            # Confidentiality (CC8)
            'CONFIDENTIALITY': [26, 27, 28, 59, 84, 85, 93, 95, 96, 97, 98, 99, 100, 101, 102, 103],
            # Common Criteria (CC1) - Control Environment
            'CONTROL_ENVIRONMENT': [1, 2, 6, 10, 12],
            # Common Criteria (CC2) - Communication & Information
            'COMMUNICATION_INFO': [5, 7, 8, 25, 27, 28],
            # Common Criteria (CC3) - Risk Assessment
            'RISK_ASSESSMENT': [30, 31, 32, 33, 130],
            # Common Criteria (CC4) - Monitoring
            'MONITORING': [19, 20, 22, 23, 35, 36, 37, 66, 79, 82, 109],
            # Common Criteria (CC5) - HR & Training
            'HR_TRAINING': [13, 14, 15, 16, 17, 18, 21, 62, 70, 78, 80, 81],
            # Common Criteria (CC5) - Change Management
            'CHANGE_MANAGEMENT': [110, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 131, 132],
            # Common Criteria (CC5) - Vendor Management
            'VENDOR_MANAGEMENT': [136, 137],
        }

        # Create reverse mapping: category name -> control number
        name_to_control = {v: k for k, v in control_to_name.items()}
        
        # Get all categories
        all_categories = EvidenceCategory.objects.all()
        
        updated_count = 0
        for category in all_categories:
            # Find the control number for this category by matching name
            control_no = name_to_control.get(category.name.strip())
            
            if not control_no:
                # Try fuzzy matching - check if category name contains CSV name or vice versa
                for csv_name, csv_control_no in control_to_name.items():
                    if category.name.strip().lower() == csv_control_no.lower() or \
                       category.name.strip().lower() in csv_control_no.lower() or \
                       csv_control_no.lower() in category.name.strip().lower():
                        control_no = csv_name
                        break
            
            assigned_group = None
            if control_no:
                # Find which group this control belongs to
                for group_name, control_ids in group_mapping.items():
                    if control_no in control_ids:
                        assigned_group = group_name
                        break
            
            if assigned_group:
                category.category_group = assigned_group
                category.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Assigned {category.name} (ID: {category.id}, Control No: {control_no}) to {assigned_group}'
                    )
                )
            else:
                category.category_group = CategoryGroup.UNCATEGORIZED
                category.save()
                self.stdout.write(
                    self.style.WARNING(
                        f'Category {category.name} (ID: {category.id}, Control No: {control_no or "N/A"}) not assigned to any group'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nUpdated {updated_count} categories with group assignments'
            )
        )

