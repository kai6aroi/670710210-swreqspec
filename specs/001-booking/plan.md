# Plan: จองคิวตรวจสุขภาพ (SPEC-BKG-001)

1. สรุปแนวทาง
    - ฟีเจอร์นี้ให้ผู้รับบริการที่ยืนยันตัวตนแล้วจองแพ็กเกจและเลือกช่วงเวลาตรวจสุขภาพภายใน 30 วัน
    - ผลลัพธ์คือการสร้างการจองเดียวต่อผู้ใช้ต่อวัน และออกหมายเลขคิวพร้อมแจ้งเตือนแบบ asynchronous
    - แนวทาง: API Backend ด้วย Python FastAPI, DB เป็น MySQL, คำนึงเรื่อง concurrency ในการจองและ queue สำหรับการแจ้งเตือน
    - รองรับ fallback เมื่อ HIS lookup ล้มเหลว (อนุญาตกรอกข้อมูลด้วยตนเอง) และเสนอช่วงเวลาใกล้เคียง 3 ตัวเลือก (รวมวันถัดไป)
    - มุ่งเน้นการทดสอบตาม AC และรองรับ NFR-PERF/NFR-REL/NFR-SEC

2. เทคโนโลยีที่ใช้

สิ่งที่เลือก | มาจาก | หมายเหตุ
---|---|---
Frontend: React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | UI จอง/ยืนยัน
Backend: Python (FastAPI) | ทีมเลือกเอง ไม่ได้มาจาก spec | REST API, worker
Database: MySQL | CON-TECH-01 | เก็บ bookings/slots/packages ฯลฯ
Auth / IDP integration | IF-IDP-01 | ต้องได้รับผลยืนยันตัวตนก่อนเข้าถึงข้อมูลผู้รับบริการ
HIS lookup service | IF-HIS-01 | ดึง HN จาก HIS; ไม่เก็บเลขบัตรประชาชน
Notification gateway (SMS/LINE) | IF-NOT-01 | ส่งแบบ asynchronous
Transport security: TLS 1.2+ | NFR-SEC-01 | ทุกการสื่อสารควรใช้ TLS

3. โมเดลข้อมูล (entities และฟิลด์หลัก)

- `bookings` (รองรับ FR-BKG-04, FR-BKG-02, FR-BKG-05)
   - id (PK), hn (nullable, ถ้ามีจาก HIS), package_id, slot_id, status (pending/confirmed/cancelled/used), created_by_user_id, created_at, is_his_fallback (bool), notify_requested_at
   - หมายเหตุ: ห้ามเก็บเลขบัตรประชาชน ตาม IF-HIS-01

- `slots` (รองรับ FR-BKG-01, FR-BKG-06)
   - id, date, start_time, end_time, capacity, remaining

- `packages` (รองรับ FR-BKG-06)
   - id, name, duration_minutes, slot_type_constraints (หรือ mapping to allowed slots)

- `notification_queue` (รองรับ IF-NOT-01, FR-BKG-05, NFR-REL-02)
   - id, booking_id, channel (sms/line), payload, status (pending/sent/failed), attempts, next_retry_at, created_at

- `audit_logs` (รองรับ DOM-PDPA-01)
   - id, actor_id, action, target_type, target_id, hn (only if accessed), timestamp

4. API / หน้าจอ (input/output หลัก) — แต่ละรายการอ้างอิง FR

- GET /availability?from=YYYY-MM-DD&to=YYYY-MM-DD&package_id= -> (FR-BKG-01)
   - Output: list of dates/slots with `remaining` per slot

- POST /bookings  -> (FR-BKG-04, FR-BKG-02)
   - Input: { hn (optional if HIS success), fallback_patient_info (if HIS failed), package_id, slot_id }
   - Output: { booking_id, queue_number, status }

- GET /bookings/{id} -> (FR-BKG-04, AC-BKG-01)
   - Output: booking details, queue number, slot info

- POST /bookings/{id}/confirm -> (AC-BKG-01 / FR-BKG-04)
   - Confirms pending booking (server-side checks for concurrency/availability)

- Worker endpoint: POST /internal/notifications/process (worker) -> (IF-NOT-01, FR-BKG-05)
   - Worker reads `notification_queue`, sends messages, updates attempts/next_retry_at

- UI: Booking page (เลือกแพ็กเกจ/วันที่/ช่วงเวลา), Confirmation screen (แสดงหมายเลขคิว)

5. ตารางตรวจ Constraints

Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ
---|---|---
CON-TECH-01 (MySQL) | `Database: MySQL`, migrations, `bookings`/`slots` tables | ใช้แล้ว
DOM-PDPA-01 (audit log) | `audit_logs` บันทึกการเข้าถึงข้อมูลผู้รับบริการ | ใช้แล้ว
IF-IDP-01 (IDP) | การยืนยันตัวตนเป็น precondition ก่อนเข้าฟีเจอร์ | ใช้แล้ว
IF-HIS-01 (HIS lookup) | `bookings.hn` ดึงจาก HIS; fallback flow (ASM-04) | ใช้แล้ว
IF-NOT-01 (Notification) | `notification_queue` และ worker ส่ง SMS/LINE แบบ async | ใช้แล้ว

6. แผนทดสอบจาก Acceptance Criteria

AC ID | ชื่อ test | ทดสอบอย่างไร
---|---|---
AC-BKG-01 | test_AC_BKG_01_booking_persists_and_shows_queue_number | GIVEN: ยืนยันตัวตนและ slot มี remaining=1; WHEN: ยืนยันการจอง; THEN: booking ถูกบันทึก, แสดง queue number, remaining=0
AC-BKG-02 | test_AC_BKG_02_prevent_duplicate_same_day | GIVEN: user มี booking ยังไม่ได้ใช้ในวันเดียวกัน; WHEN: พยายามจองอีกครั้ง; THEN: API ปฏิเสธและคืนหมายเลขคิวเดิม
AC-BKG-03 | test_AC_BKG_03_slot_filled_show_alternatives | GIVEN: slot เหลือ 1 และอีกคนยืนยันก่อน; WHEN: user กดยืนยัน; THEN: แจ้งว่าเต็ม, แสดง 3 ตัวเลือก (รวมวันถัดไป), ไม่มี booking เกิด
AC-BKG-04 | test_AC_BKG_04_notification_queue_on_send_failure | GIVEN: ระบบแจ้งเตือนไม่ตอบสนอง; WHEN: ยืนยันการจอง; THEN: booking ถูกบันทึก, แสดง queue number, และมีรายการใน `notification_queue` ที่กำหนดส่งภายใน 5 นาที
AC-BKG-05 | test_AC_BKG_05_availability_perf | GIVEN: load 200 concurrent users; WHEN: เรียก /availability; THEN: p95 <= 2s
AC-BKG-06 | test_AC_BKG_06_audit_log_on_view | GIVEN: เปิดดูข้อมูลการจอง; WHEN: การเข้าถึงเสร็จสิ้น; THEN: มี `audit_logs` ระบุผู้เข้าถึง เวลา และ HN

7. ลำดับงาน (5-10 ขั้น)

1) ออกแบบ DB schema + ไมเกรชัน (`bookings`, `slots`, `packages`, `notification_queue`, `audit_logs`) — (FR-BKG-04, DOM-PDPA-01)
2) พัฒนา API /availability และ index เพื่อให้ผ่าน NFR-PERF-01 เบื้องต้น — (FR-BKG-01, AC-BKG-05)
3) พัฒนา flow การสร้าง booking พร้อม transaction/locking เพื่อป้องกัน overbook — (FR-BKG-04, FR-BKG-02, AC-BKG-01/02/03)
4) พัฒนา HIS integration + fallback UI (ASM-04) — (IF-HIS-01)
5) พัฒนา notification queue + worker และนโยบาย retry ภายใน 5 นาที — (IF-NOT-01, FR-BKG-05, NFR-REL-02)
6) เขียน unit/integration tests ที่อ้างอิง AC ทั้งหมด และ mock HIS/notification — (AC-BKG-01..06)
7) ทำ load test (k6/jmeter) เพื่อวัด p95 และปรับ performance — (AC-BKG-05)
8) เพิ่ม monitoring/alerts และเตรียม deployment checklist — (NFR-SEC-01, DOM-PDPA-01)

8. สิ่งที่ยังไม่ทำ (Open Questions จาก spec)

- Q-02 หมายเลขคิวรีเซ็ตรายวัน หรือนับต่อเนื่อง? -> ถามเจ้าหน้าที่เวชระเบียน
   - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

การรายงานสั้น ๆ ที่ต้องส่งให้ทีม (สรุปภายหลังสร้างไฟล์)
- Constraint ที่ยังไม่ได้ใช้: ไม่มี (ทุก Constraint ใน spec ถูกนำไปใช้ใน plan)
- AC ที่ทดสอบยาก: AC-BKG-05 (performance p95 <= 2s) ต้องทำ load test และสภาพแวดล้อมทดสอบที่ใกล้เคียงการใช้งานจริง
- สิ่งที่อยากเดาแต่ไม่ได้เดา: วิธีรีเซ็ตหมายเลขคิว (Q-02) — จะรอคำตอบจากเจ้าหน้าที่เวชระเบียน

