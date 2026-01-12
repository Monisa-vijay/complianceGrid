from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from evidence.models import EvidenceCategory, ReviewPeriod


class Command(BaseCommand):
    help = 'Import control categories from the control matrix'

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
            'Annually': ReviewPeriod.QUARTERLY,  # Closest match
            'Monthly': ReviewPeriod.MONTHLY,
            'Weekly': ReviewPeriod.WEEKLY,
            'Half Yearly/Quarterly': ReviewPeriod.QUARTERLY,
            'Daily/Weekly': ReviewPeriod.WEEKLY,
        }

        # Control categories data from the table
        controls = [
            # General Controls (Rows 1-24)
            {"name": "Code of Conduct", "duration": "Annually", "description": "Code of Conduct policy and compliance", "requirements": "Update all the policy into keka and get acknowledgement"},
            {"name": "Signed NDA", "duration": "Regular", "description": "Non-Disclosure Agreement management", "requirements": "Employee handbook and acknowledged employee handbook"},
            {"name": "ISMS Policy", "duration": "Annually", "description": "Information Security Management System policy", "requirements": "Policy documentation and acknowledgements"},
            {"name": "HR Policies", "duration": "Annually", "description": "Human Resources policies and procedures", "requirements": "Policy documentation"},
            {"name": "Training Calendar", "duration": "Monthly", "description": "Training schedule and compliance tracking", "requirements": "Training records and attendance"},
            {"name": "System Access Review", "duration": "Monthly", "description": "Review of system access permissions", "requirements": "Access review reports"},
            
            # Client Escalation Matrix (Rows 25-39)
            {"name": "Client Contacts with Confidentiality Clause", "duration": "Regular", "description": "Client contact management with confidentiality agreements", "requirements": "Client contact list with signed confidentiality clauses"},
            {"name": "Risk Assessment", "duration": "Annually", "description": "Risk assessment and management process", "requirements": "Risk assessment reports and documentation"},
            {"name": "Patch Management", "duration": "Monthly", "description": "System patch management and updates", "requirements": "Patch management reports and logs"},
            {"name": "Segregation of duties", "duration": "Regular", "description": "Separation of duties and access controls", "requirements": "Access control matrix and reviews"},
            
            # Cloud Infrastructure (Rows 40-49)
            {"name": "Access Management policy", "duration": "Monthly", "description": "Cloud access management policies", "requirements": "AWS cloud dashboard screenshot, Access policy documentation"},
            {"name": "Active Directory", "duration": "Monthly", "description": "Active Directory configuration and management", "requirements": "AD configuration screenshots"},
            {"name": "IAM, IAM cloud", "duration": "Monthly", "description": "Identity and Access Management for cloud", "requirements": "IAM configuration screenshots"},
            {"name": "Cloud Infra MFA", "duration": "Monthly", "description": "Multi-Factor Authentication for cloud infrastructure", "requirements": "MFA configuration screenshots, Implement MFA for all the cloud users"},
            
            # Remote Working Policy (Rows 50-101)
            {"name": "Software list", "duration": "Monthly", "description": "Approved software inventory", "requirements": "Software inventory list"},
            {"name": "Asset Register", "duration": "Monthly", "description": "IT asset inventory and tracking", "requirements": "Asset register documentation"},
            {"name": "VPN, RLS & other transit encryption", "duration": "Monthly", "description": "VPN and encryption for remote access", "requirements": "VPN configuration screenshots, Screenshot of employee accessing VPN"},
            {"name": "Password policy in AD", "duration": "Monthly", "description": "Active Directory password policy enforcement", "requirements": "AD password policy configuration"},
            {"name": "Privileged access Reviews", "duration": "Monthly", "description": "Review of privileged user access", "requirements": "Privileged access review reports"},
            {"name": "Exit Formalities", "duration": "Regular", "description": "Employee exit process and access revocation", "requirements": "Exit process documentation"},
            {"name": "CCTV", "duration": "Monthly", "description": "CCTV system monitoring and access", "requirements": "CCTV access logs and reports"},
            {"name": "Physical Access Reconciliation", "duration": "Monthly", "description": "Physical access control reconciliation", "requirements": "Physical access logs"},
            {"name": "Media release / Disposal", "duration": "Regular", "description": "Media disposal and release policies", "requirements": "Policy in place"},
            {"name": "Encrypted VPN connections", "duration": "Monthly", "description": "Encrypted VPN connection management", "requirements": "Screenshot of employee accessing VPN, New account creation request"},
            {"name": "SSL connection for cloud hosted applications", "duration": "Monthly", "description": "SSL/TLS for cloud applications", "requirements": "VPN access screenshot, userlist with VPN access, VPN account creation approvals"},
            
            # Firewall Mitigation (Rows 102-115)
            {"name": "Backup Media Encryption", "duration": "Monthly", "description": "Encryption of backup media", "requirements": "Backup encryption configuration"},
            {"name": "Antivirus installed", "duration": "Monthly", "description": "Antivirus software installation and updates", "requirements": "Antivirus installation reports"},
            {"name": "Internal Vulnerability Scans", "duration": "Monthly", "description": "Internal vulnerability scanning process", "requirements": "Vulnerability scan reports"},
            {"name": "Configuration Changes are approved", "duration": "Monthly", "description": "Configuration change approval process", "requirements": "Change approval documentation"},
            {"name": "Incident ticket details captured", "duration": "Regular", "description": "Incident management and ticket tracking", "requirements": "Incident ticket logs"},
            {"name": "Change Management for repeated incidents", "duration": "Regular", "description": "Change management for recurring incidents", "requirements": "Sample of incident reports with Root Cause Analysis on Critical/ Major incidents, Email screenshot for alerting sensitive security issue"},
            
            # RCA for incidents (Rows 116-136)
            {"name": "Change management policy", "duration": "Annually", "description": "Change management policy and procedures", "requirements": "Change management policy documentation"},
            {"name": "SDLC policy", "duration": "Annually", "description": "Software Development Life Cycle policy", "requirements": "SDLC policy documentation"},
            {"name": "QA Testing / UAT Testing", "duration": "Regular", "description": "Quality Assurance and User Acceptance Testing", "requirements": "Testing reports and documentation"},
            {"name": "Rollback plans", "duration": "Regular", "description": "Rollback procedures for changes", "requirements": "Rollback plan documentation"},
            {"name": "BCP Plan and documentation", "duration": "Annually", "description": "Business Continuity Plan documentation", "requirements": "BCP documentation"},
            {"name": "Segregation of Roles in change management", "duration": "Regular", "description": "Role separation in change management", "requirements": "Change management role matrix"},
            {"name": "Risk Assessment considers changes", "duration": "Regular", "description": "Risk assessment for changes", "requirements": "Risk assessment documentation"},
            {"name": "High Severity incidents require changes", "duration": "Regular", "description": "Change requirements for high severity incidents", "requirements": "Incident and change documentation"},
            {"name": "Emergency Changes or Emergency Access Procedures", "duration": "Regular", "description": "Emergency change and access procedures", "requirements": "Emergency procedure documentation"},
            {"name": "Testing gate is missed", "duration": "Regular", "description": "Testing gate compliance", "requirements": "Dummy data in test environment - screenshot (anyone-user profile)"},
            
            # Vendor Selection Process (Rows 137-150)
            {"name": "Audit reports, SOC reports for Vendors", "duration": "Annually", "description": "Vendor audit and SOC reports", "requirements": "Audit reports, SOC reports for Vendors"},
            {"name": "Cloud infra processing capacity - CloudWatch", "duration": "Monthly", "description": "Cloud infrastructure monitoring via CloudWatch", "requirements": "CloudWatch monitoring screenshots"},
            {"name": "Environmental Controls", "duration": "Monthly", "description": "Environmental monitoring and controls", "requirements": "Environmental monitoring reports"},
            {"name": "Backup policy", "duration": "Annually", "description": "Backup and recovery policy", "requirements": "Backup policy documentation"},
            {"name": "BCP Testing", "duration": "Annually", "description": "Business Continuity Plan testing", "requirements": "Audit conducted annually on SCP"},
            {"name": "Alerts for failed backup", "duration": "Regular", "description": "Backup failure alerting system", "requirements": "Backup alert logs"},
            {"name": "No backup on external drives", "duration": "Regular", "description": "Policy enforcement for external drive backups", "requirements": "Policy documentation"},
            {"name": "Retention policy", "duration": "Annually", "description": "Data retention policy and compliance", "requirements": "Retention policy documentation"},
        ]

        created_count = 0
        updated_count = 0

        # Create or get users for assigned personnel
        user_map = {}
        if options['create_users']:
            user_names = ['Preeja', 'Karthi', 'Monisa', 'Manoj', 'Ajith', 'Vinoth', 'Murugesh', 'Mary']
            for name in user_names:
                user, created = User.objects.get_or_create(
                    username=name.lower(),
                    defaults={'email': f'{name.lower()}@company.com', 'first_name': name}
                )
                user_map[name] = user
                if created:
                    self.stdout.write(f"Created user: {name}")

        for control in controls:
            duration = control.get('duration', 'Monthly')
            review_period = duration_map.get(duration, ReviewPeriod.MONTHLY)
            
            evidence_requirements = control.get('requirements', 'No specific requirements')
            description = control.get('description', control['name'])
            
            category, created = EvidenceCategory.objects.get_or_create(
                name=control['name'],
                defaults={
                    'description': description,
                    'evidence_requirements': evidence_requirements,
                    'review_period': review_period,
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {category.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'Already exists: {category.name}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nImport complete: {created_count} created, {updated_count} already existed'
        ))



