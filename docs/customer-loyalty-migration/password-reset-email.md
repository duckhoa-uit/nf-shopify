# Password Reset Email — Migration Communication

## Purpose

After importing ~6,200 customers from Prestashop into Shopify, migrated customers have no Shopify password. This email notifies them that their account has been transferred and guides them to set a new password.

## When to Send

Send **only after** all of the following are confirmed:
- [x] Customers imported into Shopify
- [x] BON loyalty sync complete (points and tiers visible)
- [ ] Login page migration notice is live on the storefront
- [ ] Email content reviewed and approved

## Sending Options

### Option A: Shopify Bulk Account Invite (Recommended)

Use the Shopify Admin bulk action to send account invites:

1. Go to **Shopify Admin > Customers**
2. Filter to show imported customers (e.g., by tag or date created)
3. Select all > **More actions > Send account invite**

This uses the **"Customer account invite"** notification template. Customize it at:
**Shopify Admin > Settings > Notifications > Customer account invite**

### Option B: Klaviyo Campaign

Create a one-time campaign in Klaviyo targeting the migrated customer segment. This gives full control over branding and design. Use the content below.

---

## Email Content

### Subject Line

```
Welcome to the new Northfinder store — set your password
```

### Preview Text

```
Your account and loyalty points have been transferred. Set your password to continue.
```

### Email Body

---

**Welcome to the new Northfinder online store!**

Hi {{ customer.first_name | default: "there" }},

We've upgraded our online store to give you a better shopping experience. Great news — **your account has been transferred**, along with your loyalty points and tier status.

To access your account, you'll need to set a new password. This is a one-time step required because of the platform change — your account information and loyalty benefits are fully preserved.

**[Set Your Password]({{ shop.url }}/account/login#recover)**

After clicking the link above:
1. Enter the email address you used on our previous store
2. Check your inbox for the password reset email
3. Create your new password

**Your loyalty benefits are waiting:**
- Your loyalty tier has been preserved
- Your points balance has been transferred
- All your account details are ready

If you have any questions, contact us at eshop@northfinder.com or call +421 233 418 364.

See you on the trail,
The Northfinder Team

---

### If Using Shopify Account Invite Template

Customize the **Customer account invite** notification at Shopify Admin > Settings > Notifications with this content:

```liquid
{% capture email_title %}Welcome to the new Northfinder store!{% endcapture %}
{% capture email_body %}
Hi {{ customer.first_name | default: "there" }},

We've upgraded our online store. Your account has been transferred, along with your loyalty points and tier status.

To get started, please activate your account and set a new password by clicking the button below.
{% endcapture %}

{% capture email_action %}
  Activate Your Account
{% endcapture %}
```

The `{{ invite_url }}` variable is automatically included by Shopify in the account invite notification.

---

## Localization Notes

The email should be sent in the customer's preferred language where possible:
- **Klaviyo**: Use Klaviyo's localization features or send separate campaigns per language segment
- **Shopify invite**: The Shopify account invite notification supports localization via the theme language settings

### Key markets to cover
- English (default)
- Slovak / Czech (primary domestic markets)
- German
- Other EU languages as needed

## Rollback

If issues arise after sending:
- The login page migration notice remains visible to guide customers
- Customer support can manually trigger individual account invites from Shopify Admin
- The "Forgotten password" flow on the login page works as a self-service fallback
