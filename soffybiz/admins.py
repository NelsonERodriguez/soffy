from soffybiz.emails import EMAILS
ADMINS_MAILS = []

int_admin = 1

for mail in EMAILS:
    ADMINS_MAILS.append(("Admin " + str(int_admin), mail))
    int_admin += 1
