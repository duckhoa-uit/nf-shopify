# Website Performance Audit Workflow

## Current Tasks
- Thực hiện audit toàn diện về hiệu suất website theo Shopify best practices
- Tối ưu hóa để website đạt tốc độ lightning-fast
- Cải thiện SEO best practices
- Đảm bảo tuân thủ accessibility standards
- Theo hướng dẫn từ: https://shopify.dev/docs/storefronts/themes/best-practices/performance

## Plan (Simple)
1. Đọc và phân tích tài liệu Shopify performance best practices
2. Audit codebase hiện tại để xác định các vấn đề về hiệu suất
3. Kiểm tra và tối ưu hóa:
   - Loading performance (CSS, JS, images)
   - SEO optimization
   - Accessibility compliance
   - Core Web Vitals
4. Đưa ra recommendations và implement improvements

## Steps
1. **Information Gathering**
   - Đọc Shopify performance documentation
   - Phân tích cấu trúc theme hiện tại
   - Kiểm tra các file CSS, JS chính
   - Xem xét cách load resources

2. **Performance Analysis**
   - Audit CSS loading và optimization
   - Audit JavaScript loading và performance
   - Kiểm tra image optimization
   - Phân tích critical rendering path
   - Đánh giá font loading strategy

3. **SEO Audit**
   - Kiểm tra meta tags implementation
   - Audit structured data
   - Đánh giá page speed factors
   - Kiểm tra mobile optimization

4. **Accessibility Audit**
   - Kiểm tra semantic HTML
   - Audit keyboard navigation
   - Đánh giá color contrast
   - Kiểm tra screen reader compatibility

5. **Implementation**
   - Implement performance improvements
   - Fix SEO issues
   - Resolve accessibility problems
   - Optimize resource loading

## Things Done
- Created workflow file
- Read Shopify performance documentation
- Analyzed current codebase structure
- Identified major performance issues:

### **Critical Performance Issues Found:**

#### **1. JavaScript Bundle Size Issues**
- **intl-tel-input-utils.js**: 254KB (quá lớn!)
- **swiper-bundle.min.js**: 153KB (có thể tối ưu)
- **account-page.js**: 52KB (cần review)
- **global.js**: 42KB (cần tối ưu)
- **Total JS in head**: ~8 files loaded synchronously

#### **2. CSS Loading Issues**
- **base.css**: 84KB (rất lớn)
- **application.css**: 72KB (lớn)
- **account.css**: 40KB (chỉ cần cho account pages)
- **section-main-product.css**: 33KB (chỉ cần cho product pages)
- Nhiều CSS files được load blocking render

#### **3. Resource Loading Problems**
- Quá nhiều CSS files được load đồng thời
- Không có critical CSS inlining
- Một số CSS được load với media="print" trick nhưng không consistent
- Font preloading tốt nhưng có thể cải thiện

#### **4. Third-party Dependencies**
- intl-tel-input library quá nặng (285KB total)
- Swiper.js có thể thay thế bằng native solutions
- hyperhtml.min.js có thể không cần thiết

#### **5. SEO Issues**
- Meta tags implementation cơ bản nhưng thiếu structured data
- Image URLs sử dụng http:// thay vì https:// trong og:image
- Thiếu JSON-LD structured data

## Things Not Done Yet
- Test improvements and measure performance gains
- Create documentation for optimizations
- Set up monitoring alerts

## **OPTIMIZATIONS IMPLEMENTED:**

### **✅ Phase 1: CSS & JavaScript Optimizations**

#### **CSS Loading Strategy**
- ✅ Created `assets/critical.css` with above-the-fold styles
- ✅ Implemented critical CSS inlining using `asset_content`
- ✅ Converted blocking CSS to async loading with `media="print" onload="this.media='all'"`
- ✅ Added preload for critical stylesheets
- ✅ Conditional loading for phone input CSS (only on customer pages)
- ✅ Added noscript fallback for browsers without JS

#### **JavaScript Bundle Optimization**
- ✅ Moved non-critical JS from head to end of body
- ✅ Conditional loading for intl-tel-input (285KB) - only on customer pages
- ✅ Conditional loading for hyperhtml.min.js
- ✅ Kept only essential scripts in head (constants, pubsub, global)

### **✅ Phase 2: SEO Improvements**

#### **Meta Tags Optimization**
- ✅ Fixed og:image URLs to use https:// instead of http://
- ✅ Added og:image:alt for better accessibility
- ✅ Added robots meta tag
- ✅ Added product-specific meta tags for e-commerce

#### **Structured Data (JSON-LD)**
- ✅ Created comprehensive structured data snippet
- ✅ Added Organization, WebSite, Product, Article, Collection schemas
- ✅ Added breadcrumb structured data
- ✅ Integrated with existing meta-tags snippet

### **✅ Phase 3: Performance & Accessibility**

#### **Resource Hints**
- ✅ Added preconnect for cdn.shopify.com
- ✅ Added dns-prefetch for analytics domains
- ✅ Added conditional image preloading for critical images
- ✅ Improved font preconnect strategy

#### **Accessibility Improvements**
- ✅ Added color-scheme meta tag
- ✅ Added format-detection meta tag
- ✅ Dynamic theme-color from settings
- ✅ Enhanced focus states in critical CSS

#### **Performance Monitoring**
- ✅ Created comprehensive performance monitoring script
- ✅ Tracks Core Web Vitals (FCP, LCP, FID, CLS)
- ✅ Monitors resource loading performance
- ✅ Integrates with Google Analytics and Shopify Analytics
- ✅ Debug mode for development

### **📊 Expected Performance Improvements:**

#### **JavaScript Bundle Size Reduction**
- **Before**: ~500KB+ loaded on every page
- **After**: ~200KB on most pages, 500KB only on customer pages
- **Savings**: ~60% reduction for most visitors

#### **CSS Loading Optimization**
- **Before**: 5+ blocking CSS files (~200KB)
- **After**: Critical CSS inlined, rest loaded async
- **Improvement**: Faster First Contentful Paint

#### **SEO Enhancements**
- **Structured Data**: Better search engine understanding
- **Meta Tags**: Improved social sharing and indexing
- **Image SEO**: Proper HTTPS URLs and alt attributes

#### **Core Web Vitals Expected Improvements**
- **FCP**: 20-30% improvement from critical CSS
- **LCP**: 15-25% improvement from image preloading
- **CLS**: Better stability from proper resource loading
- **FID**: Reduced from smaller JS bundles
