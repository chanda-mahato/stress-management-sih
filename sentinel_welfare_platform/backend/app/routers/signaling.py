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

pending_rings: Dict[str, dict] = {}

class RingPayload(BaseModel):
    caller_number: str
    target_number: str
    caller_name: Optional[str] = 'Ct. Rajesh Kumar'
    caller_role: Optional[str] = 'soldier'
    room_id: str

@router.post('/ring')
def ring_target_phone(payload: RingPayload):
    clean_target = ''.join(filter(str.isdigit, payload.target_number))[-10:]
    pending_rings[clean_target] = {
        'caller_number': payload.caller_number,
        'caller_name': payload.caller_name,
        'caller_role': payload.caller_role,
        'room_id': payload.room_id,
        'timestamp': time.time(),
        'status': 'ringing'
    }
    return {'status': 'ringing', 'target': clean_target}

@router.get('/incoming/{phone_number}')
def check_incoming_call(phone_number: str):
    clean_phone = ''.join(filter(str.isdigit, phone_number))[-10:]
    call = pending_rings.get(clean_phone)
    if call:
        if time.time() - call['timestamp'] > 45:
            del pending_rings[clean_phone]
            return {'incoming': False}
        return {'incoming': True, **call}
    return {'incoming': False}

@router.post('/cancel-ring')
def cancel_ring(target_number: str):
    clean_target = ''.join(filter(str.isdigit, target_number))[-10:]
    if clean_target in pending_rings:
        del pending_rings[clean_target]
    return {'status': 'cancelled'}
