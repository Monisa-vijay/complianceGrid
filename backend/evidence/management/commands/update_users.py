from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from evidence.models import EvidenceCategory


class Command(BaseCommand):
    help = 'Update user profiles and remove other users from assignee/approver fields'

    def handle(self, *args, **options):
        # Define the users to keep/update
        users_to_keep = [
            {
                'username': 'monisa',
                'email': 'monisa@dataterrain.com',
                'first_name': 'Monisa',
                'last_name': 'V'
            },
            {
                'username': 'manoj',
                'email': 'manoj@dataterrain.com',
                'first_name': 'Manoj',
                'last_name': 'M'
            },
            {
                'username': 'preeja',
                'email': 'preeja@dataterrain.com',
                'first_name': 'Preeja',
                'last_name': 'P'
            },
            {
                'username': 'murugesh',
                'email': 'murugesh@dataterrain.com',
                'first_name': 'Murugesh',
                'last_name': 'C'
            },
            {
                'username': 'vinothkumar',
                'email': 'vinothkumar@dataterrain.com',
                'first_name': 'Vinoth Kumar',
                'last_name': 'R'
            },
            {
                'username': 'ajithkumar',
                'email': 'ajithkumar@dataterrain.com',
                'first_name': 'Ajith Kumar',
                'last_name': 'H'
            },
            {
                'username': 'karthikeyan',
                'email': 'karthikeyanchandrakumar@dataterrain.com',
                'first_name': 'Karthikeyan',
                'last_name': 'C'
            }
        ]

        # Get emails of users to keep
        keep_emails = {user['email'] for user in users_to_keep}
        keep_usernames = {user['username'] for user in users_to_keep}

        self.stdout.write('Updating user profiles...')
        
        # Update or create users
        updated_users = []
        for user_data in users_to_keep:
            # Try to find user by email first
            user = None
            try:
                user = User.objects.get(email=user_data['email'])
                # Update existing user
                user.username = user_data['username']
                user.first_name = user_data['first_name']
                user.last_name = user_data['last_name']
                user.email = user_data['email']
                user.set_password('Data@123')  # Reset password to default
                user.save()
                created = False
            except User.DoesNotExist:
                # Try to find by username
                try:
                    user = User.objects.get(username=user_data['username'])
                    # Update existing user with new email
                    user.first_name = user_data['first_name']
                    user.last_name = user_data['last_name']
                    user.email = user_data['email']
                    user.set_password('Data@123')  # Reset password to default
                    user.save()
                    created = False
                except User.DoesNotExist:
                    # Create new user
                    user = User.objects.create_user(
                        username=user_data['username'],
                        email=user_data['email'],
                        first_name=user_data['first_name'],
                        last_name=user_data['last_name'],
                        password='Data@123'  # Default password
                    )
                    created = True
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {user.username} ({user.email})')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Updated user: {user.username} ({user.email})')
                )
            updated_users.append(user)

        self.stdout.write('\nRemoving other users from assignee and approver fields...')
        
        # Get all users not in the keep list
        other_users = User.objects.exclude(
            email__in=keep_emails
        ).exclude(
            username__in=keep_usernames
        )
        
        other_user_ids = list(other_users.values_list('id', flat=True))
        
        if other_user_ids:
            # Remove from assignee
            categories_updated_assignee = EvidenceCategory.objects.filter(
                assignee_id__in=other_user_ids
            ).update(assignee=None)
            
            # Remove from approver
            categories_updated_approver = EvidenceCategory.objects.filter(
                approver_id__in=other_user_ids
            ).update(approver=None)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Removed {categories_updated_assignee} assignee references'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Removed {categories_updated_approver} approver references'
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS('No other users found in assignee/approver fields'))

        # Count other users
        other_users_count = other_users.count()
        
        # Count and list other users
        other_users_list = list(other_users)
        other_users_count = len(other_users_list)
        
        self.stdout.write('\nSummary:')
        self.stdout.write(f'  - Updated/Created {len(updated_users)} users')
        self.stdout.write(f'  - Users to keep: {", ".join([u.username for u in updated_users])}')
        
        if other_users_count > 0:
            self.stdout.write(f'\nFound {other_users_count} other user(s) in the system:')
            for other_user in other_users_list:
                self.stdout.write(f'    - {other_user.username} ({other_user.email})')
            
            # Delete other user accounts
            deleted_count = other_users.delete()[0]
            self.stdout.write(
                self.style.SUCCESS(f'\nDeleted {deleted_count} other user account(s)')
            )
        else:
            self.stdout.write(self.style.SUCCESS('\nNo other users found in the system'))

