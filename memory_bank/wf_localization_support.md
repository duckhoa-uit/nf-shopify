# Workflow: Localization Support

## Current tasks from user prompt
- Support localization cho hardcode text trong `/sections/featured-blog.liquid`
- Support localization cho hardcode text trong `/sections/contact-form.liquid`

## Plan (simple)
1. Kiểm tra nội dung của hai file để xác định các hardcode text
2. Tìm hiểu cấu trúc localization hiện tại của theme (translation files)
3. Thay thế hardcode text bằng Liquid translation filters
4. Cập nhật translation files với các key mới

## Steps
1. Đọc và phân tích nội dung file `sections/featured-blog.liquid`
2. Đọc và phân tích nội dung file `sections/contact-form.liquid`
3. Kiểm tra cấu trúc translation files hiện tại (locales/)
4. Xác định các hardcode text cần localize
5. Thay thế hardcode text bằng translation filters
6. Cập nhật translation files với các key mới

## Things done
- Tạo workflow file
- Đọc và phân tích nội dung file `sections/featured-blog.liquid`
- Đọc và phân tích nội dung file `sections/contact-form.liquid`
- Kiểm tra cấu trúc localization hiện tại

## Hardcode text cần localize:
### featured-blog.liquid:
- Line 31: "Blog Northfinder" - cần thay bằng translation key

### contact-form.liquid:
- Line 21: "Contact" - cần thay bằng translation key
- Line 105: "Radi vám poradime" - text tiếng Slovak cần thay bằng translation key

## Things done
- Thay thế hardcode text "Blog Northfinder" bằng `{{ 'sections.featured_blog.heading' | t }}`
- Thay thế hardcode text "Contact" bằng `{{ 'sections.contact_form.heading' | t }}`
- Thay thế hardcode text "Radi vám poradime" bằng `{{ 'templates.contact.info.subtitle' | t }}`
- Cập nhật translation files:
  - en.default.json: thêm `sections.featured_blog.heading` và `sections.contact_form.heading`
  - de.json: thêm `sections.featured_blog.heading` và `sections.contact_form.heading`
  - sk.json: thêm `sections.featured_blog.heading`, `sections.contact_form.heading` và `templates.contact.info.subtitle`

## Things not done yet
- Hoàn thành
