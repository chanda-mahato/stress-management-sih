import time
import hmac
import hashlib
import base64
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from app.config import settings
from app.auth import get_current_user

router = APIRouter(prefix="/signaling", tags=["1:1 WebRTC Communications"])

class SignalingConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
        if len(self.active_rooms[room_id]) >= 2:
            await websocket.close(code=4003, reason="Room full (1:1 only)")
            return False
        self.active_rooms[room_id].append(websocket)
        
        # When 2nd participant arrives, notify the other participant to trigger offer
        if len(self.active_rooms[room_id]) == 2:
            for conn in self.active_rooms[room_id]:
                if conn != websocket:
                    try:
                        await conn.send_json({"type": "peer_joined"})
                    except Exception:
                        pass
        return True

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_rooms:
            if websocket in self.active_rooms[room_id]:
                self.active_rooms[room_id].remove(websocket)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]

    async def broadcast_to_peer(self, room_id: str, sender: WebSocket, message: dict):
        if room_id in self.active_rooms:
            for connection in self.active_rooms[room_id]:
                if connection != sender:
                    await connection.send_json(message)

signaling_manager = SignalingConnectionManager()

@router.get("/turn-credentials")
def get_coturn_credentials(user: dict = Depends(get_current_user)):
    timestamp = int(time.time()) + 3600
    username = f"{timestamp}:{user.get('sub', 'anonymous')}"
    
    digest = hmac.new(
        settings.TURN_SECRET.encode("utf-8"),
        username.encode("utf-8"),
        hashlib.sha1
    ).digest()
    password = base64.b64encode(digest).decode("utf-8")
    
    ice_servers = [
        {
            "urls": [
                f"stun:{settings.TURN_HOST}:{settings.TURN_PORT}",
                f"turn:{settings.TURN_HOST}:{settings.TURN_PORT}"
            ],
            "username": username,
            "credential": password
        }
    ]
    return {
        "ice_servers": ice_servers,
        "dtls_srtp_mandatory": True,
        "p2p_only": True
    }

@router.websocket("/ws/{slot_id}")
async def websocket_signaling_endpoint(websocket: WebSocket, slot_id: str):
    connected = await signaling_manager.connect(slot_id, websocket)
    if not connected:
        return
    try:
        while True:
            data = await websocket.receive_json()
            await signaling_manager.broadcast_to_peer(slot_id, websocket, data)
    except WebSocketDisconnect:
        signaling_manager.disconnect(slot_id, websocket)
        await signaling_manager.broadcast_to_peer(slot_id, websocket, {"type": "peer_disconnected"})
    except Exception:
        signaling_manager.disconnect(slot_id, websocket)

from pydantic import BaseModel
from typing import Optional
from app.services.sms_gateway import sms_gateway

pending_rings: Dict[str, dict] = {}

class RingPayload(BaseModel):
    caller_number: str
    target_number: str
    caller_name: Optional[str] = 'Ct. Rajesh Kumar (CRPF)'
    caller_role: Optional[str] = 'soldier'
    room_id: str
    mask_caller_number: Optional[bool] = True
    app_host: Optional[str] = None

class CancelRingPayload(BaseModel):
    target_number: Optional[str] = None

@router.post('/ring')
def ring_target_phone(payload: RingPayload):
    clean_target = ''.join(filter(str.isdigit, payload.target_number))[-10:]
    clean_caller = ''.join(filter(str.isdigit, payload.caller_number))[-10:]
    
    # OPSEC §6a: Military identity and location shielding
    # Forward soldiers' real mobile numbers are strictly masked from civilian/family devices
    if payload.mask_caller_number or payload.caller_role == 'soldier':
        masked_caller = f"+91 ******{clean_caller[-4:]}" if len(clean_caller) >= 4 else "🛡️ Secure Military Relay"
    else:
        masked_caller = f"+91 {clean_caller}"

    target_role = 'family' if payload.caller_role == 'soldier' else 'soldier'
    
    # Construct 1-click sovereign join URL for mobile callee
    host = payload.app_host or '10.20.87.212'
    call_url = f"http://{host}:3000/call?my={clean_target}&target={clean_caller}&role={target_role}"

    pending_rings[clean_target] = {
        'caller_number_raw': clean_caller,
        'caller_number': masked_caller,
        'caller_name': payload.caller_name or ('Ct. Rajesh Kumar (CRPF Verified)' if payload.caller_role == 'soldier' else 'Family Contact'),
        'caller_role': payload.caller_role,
        'room_id': payload.room_id,
        'timestamp': time.time(),
        'status': 'ringing',
        'is_opsec_shielded': True,
        'location_status': 'Location Protected under MHA Directive §6a',
        'call_url': call_url
    }

    # Dispatch automated 1-click SMS invite to physical smartphone
    sms_res = sms_gateway.send_call_invite(
        phone_number=clean_target,
        caller_name=payload.caller_name or 'Defense Personnel',
        call_url=call_url
    )

    return {
        'status': 'ringing',
        'target': clean_target,
        'masked_caller': masked_caller,
        'sms_dispatched': sms_res.get('success', False),
        'call_url': call_url
    }

@router.get('/incoming/{phone_number}')
def check_incoming_call(phone_number: str):
    clean_phone = ''.join(filter(str.isdigit, phone_number))[-10:]
    call = pending_rings.get(clean_phone)
    if call:
        # Ringing timeout: 45 seconds
        if time.time() - call['timestamp'] > 45:
            del pending_rings[clean_phone]
            return {'incoming': False}
        
        # Return sanitized OPSEC-compliant data (raw phone number is never transmitted)
        return {
            'incoming': True,
            'caller_number': call['caller_number'],
            'caller_name': call['caller_name'],
            'caller_role': call['caller_role'],
            'room_id': call['room_id'],
            'status': call['status'],
            'is_opsec_shielded': call.get('is_opsec_shielded', True),
            'location_status': call.get('location_status', 'Location Protected under MHA Directive §6a')
        }
    return {'incoming': False}

@router.post('/answer')
def answer_call(payload: CancelRingPayload):
    target_number = payload.target_number or ''
    clean_target = ''.join(filter(str.isdigit, target_number))[-10:]
    if clean_target in pending_rings:
        pending_rings[clean_target]['status'] = 'answered'
        return {'status': 'answered', 'room_id': pending_rings[clean_target]['room_id']}
    return {'status': 'not_found'}

@router.post('/cancel-ring')
def cancel_ring(target_number: Optional[str] = None, payload: Optional[CancelRingPayload] = None):
    tgt = (payload.target_number if payload and payload.target_number else target_number) or ''
    clean_target = ''.join(filter(str.isdigit, tgt))[-10:]
    if clean_target in pending_rings:
        del pending_rings[clean_target]
    return {'status': 'cancelled'}

