# test ของ T-03: จองคิวสำเร็จ
# AC-BKG-01 (FR-BKG-04)
from app.db.models import Booking, Slot
from tests.conftest import AUTH


def test_AC_BKG_01(client, make_slot):
    """AC-BKG-01: ยืนยันตัวตนแล้ว และช่วง 09.00 น. มีที่นั่งว่าง จองแล้วต้องสำเร็จ"""
    slot = make_slot(start="09:00", remaining=1)

    res = client.post("/bookings", json={"slot_id": slot.id}, headers=AUTH)

    assert res.status_code == 201


def test_TC_BKG_01_1_booking_success(client, db, make_slot):
    # Given ยืนยันตัวตนแล้ว และช่วง 09.00 น. มีที่นั่งว่าง 1 ที่
    slot = make_slot(start="09:00", remaining=1)

    # When ยืนยันการจอง
    res = client.post("/bookings", json={"slot_id": slot.id}, headers=AUTH)

    # Then บันทึกสำเร็จ แสดงหมายเลขคิว (รอ Q-02) และที่นั่งว่างของช่วงนั้นเป็น 0
    assert res.status_code == 201
    payload = res.json()
    assert payload["booking_id"] is not None
    assert payload["queue_no"]

    booking = db.query(Booking).filter_by(slot_id=slot.id).one()
    assert booking.hn == "0001234"

    refreshed_slot = db.get(Slot, slot.id)
    assert refreshed_slot.remaining == 0


def test_TC_BKG_01_2_last_seat_becomes_zero(client, db, make_slot):
    # Given ยืนยันตัวตนแล้ว และช่วง 09.00 น. มีที่นั่งว่าง 1 ที่ ก่อนกดยืนยันการจองไม่มีการจองอื่นในช่วงนั้น
    slot = make_slot(start="09:00", remaining=1)

    # When ยืนยันการจอง
    res = client.post("/bookings", json={"slot_id": slot.id}, headers=AUTH)

    # Then บันทึกสำเร็จ แสดงหมายเลขคิว (รอ Q-02) และที่นั่งว่างของช่วงนั้นเปลี่ยนจาก 1 เป็น 0
    assert res.status_code == 201
    payload = res.json()
    assert payload["queue_no"]

    stored_bookings = db.query(Booking).filter_by(slot_id=slot.id).all()
    assert len(stored_bookings) == 1

    refreshed_slot = db.get(Slot, slot.id)
    assert refreshed_slot.remaining == 0
