# RTM: จองคิวตรวจสุขภาพ (Booking)
อ้างอิง: spec.md Draft v2 | tasks.md | test-cases.md
สร้างด้วย /verify เมื่อ 2569-10-07 08:31 | test: 6 ผ่าน 0 ไม่ผ่าน (backend) / 1 ผ่าน 0 ไม่ผ่าน (frontend)

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)
| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-BKG-01 | AC-BKG-05 | T-02 | backend/app/slots/service.py: list_available_slots | backend/tests/test_AC_BKG_05.py: ผ่าน | ช่องโหว่ |
| FR-BKG-02 | AC-BKG-02 | T-04 | backend/app/booking/service.py: create_booking | ไม่มี test ใน repo | ยังไม่ถึง |
| FR-BKG-03 | AC-BKG-03 | T-05, T-11, T-12 | ไม่มี implementation ที่แท้จริง | ไม่มี test ใน repo | ยังไม่ถึง |
| FR-BKG-04 | AC-BKG-01 | T-03, T-06 | backend/app/booking/router.py: create_booking; backend/app/booking/service.py: create_booking | backend/tests/test_AC_BKG_01.py: 3 ผ่าน | รอ Q-02 |
| FR-BKG-05 | AC-BKG-04 | T-07 | ไม่มี implementation ที่แท้จริง | ไม่มี test ใน repo | ยังไม่ถึง |
| FR-BKG-06 | ไม่มี AC | T-10 | ไม่มี implementation ที่แท้จริง | ไม่มี test ใน repo | ช่องโหว่ |
| NFR-PERF-01 | AC-BKG-05 | T-02 | backend/app/slots/service.py: list_available_slots | backend/tests/test_AC_BKG_05.py: ผ่าน | ครบ |
| NFR-SEC-01 | ไม่มี AC | ไม่มี task | ไม่มี implementation ที่แท้จริง | ไม่มี test ใน repo | ยังไม่ถึง |
| NFR-REL-02 | AC-BKG-04 | T-07 | ไม่มี implementation ที่แท้จริง | ไม่มี test ใน repo | ยังไม่ถึง |
| NFR-USE-01 | ไม่มี AC | ไม่มี task | ไม่มี implementation ที่แท้จริง | ไม่มี test ใน repo | ยังไม่ถึง |
| CON-TECH-01 | ไม่มี AC | T-01 | backend/app/config.py: DATABASE_URL; backend/app/db/session.py: engine | backend/tests/test_T01_schema.py: ผ่าน | ยังไม่ถึง |
| DOM-PDPA-01 | AC-BKG-06 | T-08 | backend/app/db/models.py: AuditLog; ไม่มี middleware จริง | ไม่มี test ใน repo | ช่องโหว่ |
| IF-IDP-01 | ไม่มี AC | T-03 | backend/app/auth/idp.py: get_verified_hn | backend/tests/test_AC_BKG_01.py: ผ่าน | ครบ |
| IF-HIS-01 | ไม่มี AC | T-01, T-09 | backend/app/db/models.py: Booking; backend/app/db/migrations/001_init.py | backend/tests/test_T01_schema.py: ผ่าน | ครบ |
| IF-NOT-01 | ไม่มี AC | T-07 | ไม่มี implementation ที่แท้จริง | ไม่มี test ใน repo | ยังไม่ถึง |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)
| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| backend/app/slots/service.py: list_available_slots | FR-BKG-01, NFR-PERF-01 | ไม่ครบ | กำหนด `DAYS_AHEAD = 14` ซึ่งตรงกับ 2 สัปดาห์ ไม่ใช่ 30 วันที่ spec ระบุ; test ตรวจเฉพาะความเร็ว แต่ไม่ตรวจช่วงวันที่ 30 วัน |
| backend/app/booking/service.py: create_booking | FR-BKG-04, FR-BKG-02 | ไม่ครบ | ตรวจแค่ `slot.remaining < 0` ไม่ได้ป้องกันกรณี remaining == 0 จึงสามารถจองเกินจำนวนที่นั่งได้; ยังไม่มีการปฏิเสธแบบ 1 รายการต่อผู้รับบริการต่อวัน |
| backend/app/booking/router.py: create_booking | FR-BKG-04, IF-IDP-01 | ครบบางส่วน | ยืนยันตัวตนผ่าน `Authorization` ถูกต้อง แต่ยังไม่มีการตรวจพฤติกรรมแสดงหมายเลขคิวตามรูปแบบ Q-02 เพราะเรื่องนี้ยังไม่ได้ข้อสรุป |
| backend/app/db/models.py: Booking | IF-HIS-01 | ครบ | เก็บเฉพาะ `hn` และไม่มีคอลัมน์ `national_id` ตาม spec |
| backend/app/config.py: DATABASE_URL | CON-TECH-01 | ไม่ครบ/ไม่ชัด | default เป็น `sqlite:///./dev.db` แทน PostgreSQL ตาม requirement แม้จะเป็นค่า dev ใช้ทดลอง แต่ไม่ได้บังคับใช้ PostgreSQL เหมือนที่ spec ระบุ |
| backend/app/db/models.py: AuditLog | DOM-PDPA-01 | ไม่ครบ | มีตาราง audit log แต่ไม่มี middleware หรือการบันทึกทุกการเข้าถึงข้อมูลการจองจริง จึงยังไม่เป็นการบังคับตาม constraint |

## 3. ข้อค้นพบ
ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง
ทีมตัดสิน: แก้โค้ด / แก้ spec / เพิ่ม Q-xx / ไม่ใช่ปัญหา (พร้อมเหตุผล 1 บรรทัด)

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-001 | ตัวเลขไม่ตรง spec | backend/app/slots/service.py: `DAYS_AHEAD = 14` | FR-BKG-01, AC-BKG-05 | Spec ระบุ "ภายใน 30 วันข้างหน้า" แต่โค้ดให้แสดงแค่ 14 วัน และ test AC-BKG-05 ยังไม่ตรวจวัน 30 วัน จึงเป็นความคลาดเคลื่อนโดยตรง | แก้โค้ด |
| F-002 | FR ไม่มี AC | spec.md, tasks.md | FR-BKG-06 | FR-BKG-06 มี requirement แต่ไม่มี Acceptance Criteria ใน spec และไม่มี test ใน repo จึงเป็นความไม่ครบของ requirement | แก้ spec |
| F-003 | ละเมิด Constraint | backend/app/db/models.py: `AuditLog`; backend/app/main.py | DOM-PDPA-01 | มีตาราง audit_logs แล้ว แต่ไม่มีการบันทึก audit log จริงทุกครั้งที่เข้าถึงข้อมูลการจอง จึงไม่ได้สนับสนุน constraint ที่ต้องมี log อย่างน้อย 1 ปี | แก้โค้ด |
| F-004 | test อ่อน / โค้ดไม่มี FR | backend/app/booking/service.py: `if slot.remaining < 0` | FR-BKG-02, FR-BKG-04 | โค้ดอนุญาตให้จองเมื่อ `remaining == 0` ได้ เนื่องจากเงื่อนไขเช็คแค่ `< 0` และไม่มี test สำหรับคิวที่ยังไม่ได้ใช้ในวันเดียวกัน จึงไม่ป้องกันการจองเกินที่นั่งหรือจองซ้ำวันเดียวกัน | แก้โค้ด |

## 4. แก้แล้ว
| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| - | - | ไม่มีข้อค้นพบที่เคยแก้แล้วใน commit/สาขานี้ | 
