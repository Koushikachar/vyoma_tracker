# Email setup (Gmail SMTP)

Vyoma Route sends verification, password-reset and invitation emails through Gmail SMTP (`smtp.gmail.com`, port 465, SSL).

## 1. Create a Google App Password
1. Open your Google Account -> **Security** and turn on **2-Step Verification** (required).
2. Go to https://myaccount.google.com/apppasswords, create an app password named "Vyoma Route".
3. Copy the 16-character password (spaces are fine, they are ignored).

Never use your normal Gmail password, and never commit the app password to Git.

## 2. Set the variables (in `.env` locally and in Vercel -> Settings -> Environment Variables)
```
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM="Vyoma Route <you@gmail.com>"   # optional; only the display name is used
```
Restart the server after changing them.

## 3. Check it works
Admin panel -> Sellers -> **Send test email** (enter your password). It emails you and shows a short, safe reason if it fails.

## Good to know
- Gmail always sends from the authenticated account, so recipients see `GMAIL_USER` as the sender.
- Limits: about 500 emails/day for a free Gmail account (about 2,000 for Google Workspace). Fine for verification/reset mail; move to a bulk provider if you outgrow it.
- If a 535 / "login refused" error appears: the app password was copied wrong, 2-Step Verification is off, or the password was revoked. Create a new one.
- If you leak the app password, revoke it at the same App Passwords page and create a new one.
- For better inbox placement at scale, use a Google Workspace address on your own domain instead of @gmail.com.
