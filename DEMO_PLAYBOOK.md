# Demo Playbook

Use this guide with the Demo Control Center at `/demo`.

## 1. Student flow smoke test

1. Open `/demo`
2. Quick login as any student
3. Open a lab
4. Verify:
   - Start Here section renders
   - step list renders
   - progress form saves
5. Open AI Help and submit:
   - issue summary
   - troubleshooting attempted
6. Verify:
   - AI guidance card appears
   - My Progress shows stuck/waiting changes

## 2. Teacher intervention flow smoke test

1. Return to `/demo`
2. Quick login as teacher/admin
3. Open Teacher Dashboard
4. Verify:
   - Needs Teacher Now queue has rows
   - Active alerts are visible
   - step distribution widget renders
5. Mark one help request resolved
6. Verify:
   - request disappears from active queue
   - monitoring status updates for that student

## 3. Branding/settings smoke test

1. Open Teacher Settings
2. Change school name and one color
3. Save settings
4. Verify branding appears across:
   - top nav/header
   - dashboard accents/buttons
   - login and demo surfaces

## 4. Regression quick checks

1. `/login` still loads and allows role selection
2. `/student` routes remain role-protected
3. `/teacher` routes remain role-protected
4. `/demo` loads without role restriction for testing
