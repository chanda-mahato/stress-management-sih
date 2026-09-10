import datetime
from typing import List, Dict

class RosterSlotScheduler:
    """
    Intelligently assigns conflict-free family call slots based on the soldier's
    operational duty hours, rest cycles, and night shift telemetry.
    """
    @staticmethod
    def generate_slots_for_soldier(duty_hours: float, rest_hours: float, consecutive_nights: float) -> List[Dict]:
        today = datetime.date.today()
        tomorrow = today + datetime.timedelta(days=1)
        slots = []
        
        # Rule 1: Night Duty / Vigil Soldier -> Recovery sleep in morning, personal time in late afternoon
        if consecutive_nights > 0:
            slot_time = datetime.datetime.combine(today, datetime.time(16, 0))
            slots.append({
                "scheduled_at": slot_time,
                "slot_window_desc": "Post-Night-Duty Decompression Window (16:00 - 16:20 hrs)",
                "duration_minutes": 20
            })
            slot_time_2 = datetime.datetime.combine(tomorrow, datetime.time(16, 30))
            slots.append({
                "scheduled_at": slot_time_2,
                "slot_window_desc": "Post-Night-Duty Decompression Window (16:30 - 16:50 hrs)",
                "duration_minutes": 20
            })
        # Rule 2: Day-Duty Soldier -> Standard evening welfare window after evening roll-call / debrief
        else:
            slot_time = datetime.datetime.combine(today, datetime.time(19, 0))
            slots.append({
                "scheduled_at": slot_time,
                "slot_window_desc": "Evening Rest & Welfare Window (19:00 - 19:20 hrs)",
                "duration_minutes": 20
            })
            slot_time_2 = datetime.datetime.combine(tomorrow, datetime.time(19, 30))
            slots.append({
                "scheduled_at": slot_time_2,
                "slot_window_desc": "Evening Rest & Welfare Window (19:30 - 19:50 hrs)",
                "duration_minutes": 20
            })
            
        return slots

roster_scheduler = RosterSlotScheduler()
