# Setting Up Windows Task Scheduler for Email Reminders

This guide will help you set up automatic daily email reminders using Windows Task Scheduler.

## Quick Setup (PowerShell - Recommended)

**Run PowerShell as Administrator:**
1. Press `Windows Key + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Run the following command:

```powershell
cd C:\Users\monisa.DATATERRAINAD\complianceGrid\backend
.\setup_reminder_scheduler.ps1
```

The script will:
- Ask you what time to run the reminders (default: 9:00 AM)
- Create the scheduled task automatically
- Show you how to verify and test it

## Manual Setup (GUI Method)

If you prefer to set it up manually:

1. **Open Task Scheduler**
   - Press `Windows Key` and search for "Task Scheduler"
   - Or press `Windows Key + R`, type `taskschd.msc`, and press Enter

2. **Create Basic Task**
   - Click "Create Basic Task" in the right panel
   - Name: `ComplianceGrid Daily Reminders`
   - Description: `Sends email reminders to assignees 1 day before and 1 day after due dates`
   - Click **Next**

3. **Set Trigger**
   - Select **Daily**
   - Click **Next**
   - Set the time (e.g., 9:00:00 AM)
   - Set "Recur every: 1 days"
   - Click **Next**

4. **Set Action**
   - Select **Start a program**
   - Click **Next**
   - Program/script: `python`
   - Add arguments: `manage.py send_reminders`
   - Start in: `C:\Users\monisa.DATATERRAINAD\complianceGrid\backend`
   - Click **Next**

5. **Finish**
   - Review the summary
   - Check **"Open the Properties dialog for this task when I click Finish"**
   - Click **Finish**

6. **Configure Properties**
   - In the Properties dialog:
     - Go to **General** tab
     - Check **"Run whether user is logged on or not"**
     - Check **"Run with highest privileges"**
     - Go to **Conditions** tab
     - Check **"Start the task only if the computer is on AC power"** (optional)
     - Check **"Start the task only if the following network connection is available"** (optional)
     - Click **OK**
     - **If prompted for credentials:**
       - **Username**: Your Windows username (e.g., `monisa.DATATERRAINAD` or `DATATERRAINAD\monisa.DATATERRAINAD`)
       - **Password**: Your Windows account password
       - This is required for tasks that run when you're not logged in

## Verify the Task

1. In Task Scheduler, look for "ComplianceGrid Daily Reminders" in the task list
2. Right-click the task → **Run** to test it immediately
3. Check the **Last Run Result** column - it should show "0x0" (success)

## Test the Reminders

To test if reminders work:

```powershell
cd C:\Users\monisa.DATATERRAINAD\complianceGrid\backend
python manage.py send_reminders
```

This will send reminders for:
- Submissions due tomorrow (1 day before)
- Submissions that were due yesterday (1 day overdue)

## Troubleshooting

### Task doesn't run
- Check Task Scheduler → Task Scheduler Library → ComplianceGrid Daily Reminders
- Look at the "Last Run Result" - if it's not "0x0", there's an error
- Check the "History" tab for error details

### Python not found
- Make sure Python is in your system PATH
- Or use the full path to Python in the task (e.g., `C:\Python313\python.exe`)

### Emails not sending
- Verify email configuration in `backend/.env`
- Test manually: `python manage.py send_reminders`
- Check that assignees have email addresses set

### Task runs but no emails sent
- Check if there are any submissions due tomorrow or overdue
- Verify assignees are set for the controls
- Check the reminder logs in the database

## View Task History

1. In Task Scheduler, select "ComplianceGrid Daily Reminders"
2. Click the **History** tab at the bottom
3. Look for entries with your task name
4. Double-click entries to see details

## Modify Schedule

1. Right-click "ComplianceGrid Daily Reminders"
2. Select **Properties**
3. Go to **Triggers** tab
4. Select the trigger and click **Edit**
5. Change the time or frequency
6. Click **OK**

## Delete Task

If you need to remove the scheduled task:

```powershell
Unregister-ScheduledTask -TaskName "ComplianceGrid Daily Reminders" -Confirm:$false
```

Or in Task Scheduler:
1. Right-click "ComplianceGrid Daily Reminders"
2. Select **Delete**
