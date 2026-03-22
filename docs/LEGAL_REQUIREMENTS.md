# Aevon - Legal Requirements (Enzonic LLC, KY)

*Disclaimer: This document is an architectural outline for necessary legal documentation. It does not constitute legal advice. Enzonic LLC should consult with a qualified attorney in Kentucky to draft the final documents.*

## 1. Company Information Requirements
All legal documents must clearly state the operating entity:
- **Entity Name:** Enzonic LLC
- **Jurisdiction:** Kentucky, USA
- **Contact Email:** admin@enzonic.com
- **Mailing Address:** [To be inserted: Registered Agent or Business Address in KY]

## 2. Terms of Service (TOS)
The TOS must govern the use of the Aevon platform. Key clauses needed:
- **User Accounts:** Age requirements (e.g., 13+ or 18+ depending on paid tier), account security responsibilities.
- **Intellectual Property (Crucial for Writers):** Explicitly state that **the user retains 100% ownership** of their manuscripts, characters, worlds, and uploaded files. Enzonic LLC claims no rights to user-generated creative content.
- **Acceptable Use:** Prohibit illegal content, malware distribution via the file manager, and abuse of the 32GB storage quota.
- **Payment & Subscriptions:** Terms regarding refunds, cancellation policies, and subscription renewals.
- **Limitation of Liability:** Protect Enzonic LLC from lawsuits if user data is lost (though the app should have robust backups) or if the service experiences downtime.
- **Governing Law:** Specify that any legal disputes will be handled in the state courts of Kentucky.

## 3. Privacy Policy
Must detail how user data is handled, complying with general US laws and best practices for global users (GDPR/CCPA):
- **Data Collection:** What is collected (email, name, payment info, manuscript data, uploaded files).
- **Data Usage:** How it's used (to provide the service, analytics, billing). Explicitly state that user manuscripts are **not** read by staff or sold to third-party AI trainers without explicit opt-in.
- **Data Storage & Security:** Mention the use of secure third-party processors (e.g., Supabase, Stripe) and encryption practices.
- **User Rights:** How users can request data deletion (account termination), data export, or data correction.
- **Cookies:** Information on session cookies and tracking (if any) used on the marketing site and app.

## 4. Digital Millennium Copyright Act (DMCA) Policy
Since users can upload files and text, Aevon needs a safe harbor provision:
- Provide instructions for copyright holders to issue a takedown notice.
- Designate a Copyright Agent (can be admin@enzonic.com).
- Outline the process for users to submit a counter-notice.

## 5. UI/UX Implementation of Legal Pages
- **Sign Up:** A required checkbox or explicit disclaimer: "By signing up, you agree to our Terms of Service and Privacy Policy."
- **Footer Navigation:** Links to TOS, Privacy Policy, and Contact Info must be accessible from the marketing site footer and the in-app settings menu.
- **Cookie Consent:** If deploying to EU users, a non-intrusive cookie consent banner is required on the marketing/landing page.
