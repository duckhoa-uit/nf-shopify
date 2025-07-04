# Shopify Theme Import Guide

## 🚨 CRITICAL FIXES APPLIED

### 1. Meta Tags Blocking Issue (FIXED)
**Problem**: Theme was blocking search engine indexing with `noindex, nofollow` meta tags
**Solution**: Updated `snippets/meta-tags.liquid` to allow indexing unless password protection is enabled

### 2. Hardcoded URLs Removed (FIXED)
**Problem**: Social media URLs were hardcoded in settings
**Solution**: Cleared hardcoded URLs in `config/settings_data.json`

### 3. Image URL Protocol Fixed (FIXED)
**Problem**: OG image URLs using incorrect protocol
**Solution**: Updated meta-tags to use proper HTTPS URLs

## 📋 PRE-IMPORT CHECKLIST

### Required Files Verification
✅ All required template files present:
- `templates/404.json` ✓
- `templates/index.json` ✓
- `templates/product.json` ✓
- `templates/collection.json` ✓
- `templates/cart.json` ✓
- `templates/blog.json` ✓
- `templates/article.json` ✓
- `templates/page.json` ✓
- `templates/search.json` ✓
- `templates/password.json` ✓

✅ Customer templates present:
- `templates/customers/account.json` ✓
- `templates/customers/login.json` ✓
- `templates/customers/register.json` ✓
- `templates/customers/addresses.json` ✓
- `templates/customers/order.json` ✓

### Asset Files Verification
✅ Critical assets present:
- `assets/application.css` ✓
- `assets/base.css` ✓
- `assets/global.js` ✓
- `assets/constants.js` ✓
- `assets/pubsub.js` ✓

## 🔧 POST-IMPORT CONFIGURATION

### 1. Theme Settings to Configure
After importing, configure these in Shopify Admin:

**Logo & Branding**:
- Upload your logo
- Set favicon
- Configure brand colors

**Social Media Links**:
- Add your Facebook URL
- Add your Instagram URL
- Add your YouTube URL

**Contact Information**:
- Store address
- Phone number
- Email address

### 2. Language Configuration
If using multi-language:
- Configure German as default language
- Set up English with `/en` prefix
- Upload flag images for language selector

### 3. App Dependencies
This theme integrates with:
- **Swish App** (wishlist functionality)
- **PDF-vify App** (invoice downloads)
- **Search & Discovery App** (product filters)

## ⚠️ KNOWN ISSUES & SOLUTIONS

### Issue 1: Large JavaScript Bundles
**Symptoms**: Slow loading, timeout errors
**Solution**: 
- Monitor Core Web Vitals
- Consider lazy loading for non-critical features
- Use browser caching

### Issue 2: Missing Flag Images
**Symptoms**: Broken images in language selector
**Solution**: Upload flag images to assets folder:
- `flag-de.png`
- `flag-en.png`
- `flag-cs.png` (etc.)

### Issue 3: Third-party App Integration
**Symptoms**: Features not working after import
**Solution**:
- Reinstall required apps
- Reconfigure app settings
- Test all integrations

## 🧪 TESTING CHECKLIST

After import, test these areas:

### Core Functionality
- [ ] Homepage loads correctly
- [ ] Product pages display properly
- [ ] Cart functionality works
- [ ] Checkout process completes
- [ ] Search functionality works

### Customer Features
- [ ] Account registration
- [ ] Login/logout
- [ ] Address management
- [ ] Order history
- [ ] Wishlist (if Swish app installed)

### Multi-language (if applicable)
- [ ] Language switcher works
- [ ] Content displays in correct language
- [ ] URLs have correct language prefixes

### SEO & Performance
- [ ] Meta tags display correctly
- [ ] Social media previews work
- [ ] Page speed is acceptable
- [ ] No 404 errors on critical pages

## 🚀 OPTIMIZATION RECOMMENDATIONS

### Performance
1. **Enable browser caching** in Shopify settings
2. **Optimize images** using Shopify's image transformation
3. **Monitor Core Web Vitals** with Google PageSpeed Insights
4. **Use CDN** for static assets

### SEO
1. **Configure structured data** for products
2. **Set up Google Analytics** and Search Console
3. **Create XML sitemap** (Shopify auto-generates)
4. **Optimize meta descriptions** for key pages

### Security
1. **Enable SSL** (Shopify provides free SSL)
2. **Configure GDPR compliance** if targeting EU customers
3. **Set up backup strategy** for theme files
4. **Monitor for security updates**

## 📞 SUPPORT

If you encounter issues after import:
1. Check Shopify's theme documentation
2. Review browser console for JavaScript errors
3. Test in incognito mode to rule out caching issues
4. Contact theme developer for custom modifications

---
**Last Updated**: 2025-01-02
**Theme Version**: Dawn-based custom theme
**Shopify Compatibility**: 2.0+
