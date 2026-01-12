import csv

# Read the data and create properly formatted CSV
rows = [
    ["No", "Control Short", "Duration", "To Do", "Evidence"],
    ["1", "Update all the policy into keka and get acknowledgement from the employees.", "Annually", "Update all the policy into keka and get acknowledgement from the employees.", "All policy in keka"],
    ["2", "Code of Conduct", "", "It will be verified, whether it is in place or not.", "Employee handbook and acknowledged employee handbook"],
    ["3", "Signed NDA", "Regular", "New employees are expected to sign NDA before joining. It will be verified based on the new employees list, ask any one of the employee's NDA agreement.", "appointment letter, new joiners list from keka, consultant agreement"],
    # ... (continuing with all rows)
]

# For now, let's create a simpler approach - write directly with proper CSV formatting
data = """No,Control Short,Duration,To Do,Evidence
1,"Update all the policy into keka and get acknowledgement from the employees.",Annually,"Update all the policy into keka and get acknowledgement from the employees.","All policy in keka"
2,Code of Conduct,,"It will be verified, whether it is in place or not.","Employee handbook and acknowledged employee handbook"
3,"Signed NDA",Regular,"New employees are expected to sign NDA before joining. It will be verified based on the new employees list, ask any one of the employee's NDA agreement.","appointment letter, new joiners list from keka, consultant agreement"
"""

# Actually, let me create a Python script that will properly format this


