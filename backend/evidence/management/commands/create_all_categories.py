from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from evidence.models import EvidenceCategory, ReviewPeriod


class Command(BaseCommand):
    help = 'Create all 148 categories - placeholder categories for missing ones'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-users',
            action='store_true',
            help='Create user accounts for assigned personnel if they do not exist',
        )

    def handle(self, *args, **options):
        # Duration mapping
        duration_map = {
            'Regular': ReviewPeriod.MONTHLY,
            'Annually': ReviewPeriod.QUARTERLY,
            'Monthly': ReviewPeriod.MONTHLY,
            'Weekly': ReviewPeriod.WEEKLY,
            'Half Yearly/Quarterly': ReviewPeriod.QUARTERLY,
            'Daily/Weekly': ReviewPeriod.WEEKLY,
        }

        # Extended list of common control categories (expanding to get closer to 148)
        # This is a template - you should provide the complete list
        additional_controls = [
            # Add more categories here to reach 148 total
            # Format: {"name": "...", "duration": "...", "description": "...", "requirements": "..."}
        ]

        created_count = 0
        updated_count = 0

        # Create or get users
        if options['create_users']:
            user_names = ['Preeja', 'Karthi', 'Monisa', 'Manoj', 'Ajith', 'Vinoth', 'Murugesh', 'Mary', 'IT and Infra']
            for name in user_names:
                username = name.lower().replace(' ', '_')
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={'email': f'{username}@company.com', 'first_name': name}
                )
                if created:
                    self.stdout.write(f"Created user: {name}")

        self.stdout.write(self.style.WARNING(
            'This command is a placeholder. Please provide the complete list of 148 categories, '
            'or use import_controls_csv.py with a CSV file containing all categories.'
        ))

        self.stdout.write(self.style.SUCCESS(
            f'\nCurrent categories in database: {EvidenceCategory.objects.count()}'
        ))



