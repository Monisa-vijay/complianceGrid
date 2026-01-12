# How to Import Categories from CSV

## Step 1: Prepare Your CSV File

Your CSV file should have these columns (column names can vary):

**Required columns:**
- `Control Short` or `Control` or `Name` or `Category` - The category name
- `Duration` or `Review Period` or `Period` - The review frequency

**Optional columns:**
- `To Do` or `Description` or `Requirements` - Category description
- `Evidence` or `Evidence Requirements` - What evidence is needed
- `Assigned to` or `Assigned` - Who is responsible

### Example CSV Format:

```csv
Control Short,Duration,To Do,Evidence,Assigned to
Code of Conduct,Annually,Update all the policy into keka and get acknowledgement,Employee handbook and acknowledged employee handbook,Preeja
Signed NDA,Regular,Non-Disclosure Agreement management,Employee handbook and acknowledged employee handbook,HR
ISMS Policy,Annually,Information Security Management System policy,Policy documentation and acknowledgements,Monisa
```

### Duration Values Supported:
- `Regular` → Monthly
- `Annually` → Quarterly
- `Monthly` → Monthly
- `Weekly` → Weekly
- `Half Yearly/Quarterly` → Quarterly
- `Daily/Weekly` → Weekly
- `Quarterly` → Quarterly

## Step 2: Save Your CSV File

1. Export your control matrix from Excel/Google Sheets to CSV format
2. Save the file with a name like `all_categories.csv`
3. Place it in the `backend` folder of the project:
   ```
   evidence-collection/
   └── backend/
       └── all_categories.csv  ← Put your file here
   ```

## Step 3: Run the Import Command

Open a terminal/PowerShell in the `backend` folder and run:

```bash
# Activate virtual environment (if not already activated)
.\venv\Scripts\Activate.ps1

# Run the import command
python manage.py import_controls_csv all_categories.csv --create-users
```

Or if you're in the project root:

```bash
cd backend
.\venv\Scripts\Activate.ps1
python manage.py import_controls_csv all_categories.csv --create-users
```

## Step 4: Verify the Import

After importing, you can check how many categories were imported:

```bash
python manage.py shell -c "from evidence.models import EvidenceCategory; print(f'Total categories: {EvidenceCategory.objects.count()}')"
```

## Troubleshooting

### If you get "CSV file not found":
- Make sure the CSV file is in the `backend` folder
- Check the file name matches exactly (case-sensitive)
- Use the full path if needed: `python manage.py import_controls_csv "C:\full\path\to\file.csv" --create-users`

### If column names don't match:
The import command tries to detect these column name variations:
- Name: `Control Short`, `Control`, `Name`, `Category`
- Duration: `Duration`, `Review Period`, `Period`
- Description: `To Do`, `Description`, `Requirements`
- Evidence: `Evidence`, `Evidence Requirements`
- Assigned: `Assigned to`, `Assigned`

### If you see encoding errors:
- Make sure your CSV is saved as UTF-8 encoding
- In Excel: Save As → CSV UTF-8 (Comma delimited) (*.csv)

## Example: Full Import Process

1. **Export from Excel:**
   - Open your control matrix in Excel
   - File → Save As
   - Choose "CSV UTF-8 (Comma delimited) (*.csv)"
   - Save as `all_categories.csv` in the `backend` folder

2. **Import:**
   ```powershell
   cd C:\Users\monisa.DATATERRAINAD\evidence-collection\backend
   .\venv\Scripts\Activate.ps1
   python manage.py import_controls_csv all_categories.csv --create-users
   ```

3. **Generate submissions:**
   ```bash
   python manage.py generate_submissions
   ```

That's it! Your categories will be imported and ready to use.



