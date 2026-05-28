# Product Script Automation

Google Apps Script สำหรับอ่านคอลัมน์ `product_name` จาก Google Sheet แล้วสร้าง JSON สำหรับคอนเทนต์วิดีโอสินค้า จากนั้นบันทึกผลกลับลงชีท

## วิธีติดตั้ง

1. เปิด Google Sheet ที่ใช้ ID นี้:
   `yu5EvxDlFBNMV6jHRA7Wm_5oEBywDzWnSo6E3Y0`
2. ไปที่ `Extensions` > `Apps Script`
3. ลบโค้ดเดิมใน `Code.gs`
4. วางโค้ดจากไฟล์ `product-script-automation.gs`
5. ไปที่ `Project Settings` > `Script Properties`
6. เพิ่ม property:
   - Name: `OPENAI_API_KEY`
   - Value: API key ของ OpenAI
7. กด Save
8. กลับไปที่ Apps Script แล้วรันฟังก์ชัน `runProductScriptAutomation`
9. อนุญาต permission ตามที่ Google ขอ

## การใช้งาน

หลังติดตั้งแล้ว reload หน้า Google Sheet จะมีเมนู `Product Script`

- `Run now`: รันทันที
- `Install hourly trigger`: ตั้งให้รันอัตโนมัติทุก 1 ชั่วโมง

## คอลัมน์ที่ต้องมี

ชีทต้องมีหัวคอลัมน์:

```text
product_name
```

สคริปต์จะเพิ่มคอลัมน์เหล่านี้ให้อัตโนมัติถ้ายังไม่มี:

```text
Environment
Keyword
Product_Detail
script
title
raw_json
automation_status
automation_updated_at
```

แถวที่มี `automation_status` เป็น `DONE` แล้วจะไม่ถูกสร้างซ้ำ

## ปรับจำนวนแถวต่อรอบ

ค่าเริ่มต้นคือรันครั้งละ 10 แถว เพื่อกัน quota และค่าใช้จ่าย API สูงเกินไป

แก้ได้ที่:

```js
maxRowsPerRun: 10
```
