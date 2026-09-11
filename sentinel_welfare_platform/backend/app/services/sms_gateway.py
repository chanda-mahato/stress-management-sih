import os
import logging
import httpx
from typing import Dict, Any

logger = logging.getLogger("sentinel.sms_gateway")

class SMSGatewayInterface:
    def send_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        raise NotImplementedError

    def send_call_invite(self, phone_number: str, caller_name: str, call_url: str) -> Dict[str, Any]:
        raise NotImplementedError

class LocalMockSMSGateway(SMSGatewayInterface):
    """
    Local development mock gateway.
    Logs OTP to console securely without third-party network costs.
    """
    def send_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        clean_phone = "".join(c for c in phone_number if c.isdigit())[-10:]
        masked = clean_phone[:3] + "******" + clean_phone[-2:] if len(clean_phone) >= 8 else "****"
        print(f"\n=======================================================")
        print(f"[LOCAL MOCK SMS] Dispatched OTP '{otp_code}' to +91 {masked}")
        print(f"To receive real SMS on your mobile phone, define FAST2SMS_API_KEY in .env")
        print(f"=======================================================\n")
        return {
            "success": True,
            "real_sms_delivered": False,
            "provider": "mock",
            "message": f"OTP {otp_code} logged to server terminal (Mock Mode)."
        }

    def send_call_invite(self, phone_number: str, caller_name: str, call_url: str) -> Dict[str, Any]:
        clean_phone = "".join(c for c in phone_number if c.isdigit())[-10:]
        masked = clean_phone[:3] + "******" + clean_phone[-2:] if len(clean_phone) >= 8 else "****"
        print(f"\n=======================================================")
        print(f"[LOCAL MOCK SMS] [CALL ALERT] Incoming video call dispatched to +91 {masked}")
        print(f"Caller: {caller_name}")
        print(f"1-Click Secure Join: {call_url}")
        print(f"=======================================================\n")
        return {
            "success": True,
            "real_sms_delivered": False,
            "provider": "mock",
            "call_url": call_url,
            "message": f"Call alert logged to terminal for +91 {masked}."
        }

class Fast2SMSGateway(SMSGatewayInterface):
    """
    Live carrier delivery for Indian mobile numbers via Fast2SMS Quick OTP API.
    Docs: https://www.fast2sms.com/
    """
    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.endpoint = "https://www.fast2sms.com/dev/bulkV2"

    def send_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        clean_phone = "".join(c for c in phone_number if c.isdigit())[-10:]
        if len(clean_phone) != 10:
            return {"success": False, "real_sms_delivered": False, "error": "Invalid 10-digit Indian mobile number."}

        headers = {
            "authorization": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "variables_values": otp_code,
            "route": "otp",
            "numbers": clean_phone
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(self.endpoint, headers=headers, data=data)
                res_data = resp.json()
                if res_data.get("return") is True:
                    logger.info("Fast2SMS OTP successfully dispatched to +91 %s", clean_phone)
                    return {
                        "success": True,
                        "real_sms_delivered": True,
                        "provider": "fast2sms",
                        "request_id": res_data.get("request_id")
                    }
                else:
                    logger.error("Fast2SMS rejection: %s", res_data.get("message"))
                    return {
                        "success": False,
                        "real_sms_delivered": False,
                        "provider": "fast2sms",
                        "error": str(res_data.get("message"))
                    }
        except Exception as exc:
            logger.error("Fast2SMS connection error: %s", exc)
            return {"success": False, "real_sms_delivered": False, "error": str(exc)}

    def send_call_invite(self, phone_number: str, caller_name: str, call_url: str) -> Dict[str, Any]:
        clean_phone = "".join(c for c in phone_number if c.isdigit())[-10:]
        if len(clean_phone) != 10:
            return {"success": False, "real_sms_delivered": False, "error": "Invalid 10-digit number."}

        headers = {
            "authorization": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "message": f"Sentinel Alert: Incoming 1:1 Video Call from {caller_name}. Tap to answer: {call_url}",
            "language": "english",
            "route": "q",
            "numbers": clean_phone
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(self.endpoint, headers=headers, data=data)
                res_data = resp.json()
                if res_data.get("return") is True:
                    logger.info("Fast2SMS call invite sent to +91 %s", clean_phone)
                    return {"success": True, "real_sms_delivered": True, "provider": "fast2sms"}
                else:
                    logger.warning("Fast2SMS call invite rejected: %s", res_data.get("message"))
                    return {"success": False, "real_sms_delivered": False, "error": str(res_data.get("message"))}
        except Exception as exc:
            logger.error("Fast2SMS connection error: %s", exc)
            return {"success": False, "real_sms_delivered": False, "error": str(exc)}

class TwilioSMSGateway(SMSGatewayInterface):
    """
    Global carrier delivery via Twilio REST API.
    """
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.account_sid = account_sid.strip()
        self.auth_token = auth_token.strip()
        self.from_number = from_number.strip()
        self.endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"

    def send_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        clean_phone = "".join(c for c in phone_number if c.isdigit())[-10:]
        formatted_phone = f"+91{clean_phone}" if not phone_number.startswith("+") else phone_number
        data = {
            "From": self.from_number,
            "To": formatted_phone,
            "Body": f"Sentinel Personnel Welfare: Your 6-digit login verification code is {otp_code}. Valid for 5 minutes."
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    self.endpoint,
                    auth=(self.account_sid, self.auth_token),
                    data=data
                )
                if resp.status_code in (200, 201):
                    logger.info("Twilio OTP successfully dispatched to %s", formatted_phone)
                    return {"success": True, "real_sms_delivered": True, "provider": "twilio"}
                else:
                    logger.error("Twilio error HTTP %d: %s", resp.status_code, resp.text)
                    return {"success": False, "real_sms_delivered": False, "error": resp.text}
        except Exception as exc:
            logger.error("Twilio connection error: %s", exc)
            return {"success": False, "real_sms_delivered": False, "error": str(exc)}

    def send_call_invite(self, phone_number: str, caller_name: str, call_url: str) -> Dict[str, Any]:
        clean_phone = "".join(c for c in phone_number if c.isdigit())[-10:]
        formatted_phone = f"+91{clean_phone}" if not phone_number.startswith("+") else phone_number
        data = {
            "From": self.from_number,
            "To": formatted_phone,
            "Body": f"🚨 Sentinel Alert: Incoming secure video call from {caller_name}. Tap to connect: {call_url}"
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    self.endpoint,
                    auth=(self.account_sid, self.auth_token),
                    data=data
                )
                if resp.status_code in (200, 201):
                    logger.info("Twilio call invite dispatched to %s", formatted_phone)
                    return {"success": True, "real_sms_delivered": True, "provider": "twilio"}
                else:
                    return {"success": False, "real_sms_delivered": False, "error": resp.text}
        except Exception as exc:
            return {"success": False, "real_sms_delivered": False, "error": str(exc)}

class SmartSMSDispatcher(SMSGatewayInterface):
    """
    Auto-detects configured credentials in environment and dispatches through the live carrier.
    Falls back cleanly to LocalMockSMSGateway if no live carrier keys are supplied.
    """
    def send_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        fast2sms_key = os.getenv("FAST2SMS_API_KEY", "").strip() or os.getenv("SMS_API_KEY", "").strip()
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        twilio_from = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

        # 1. Check Fast2SMS (Indian carrier)
        if fast2sms_key and not fast2sms_key.startswith("changeme"):
            gateway = Fast2SMSGateway(fast2sms_key)
            result = gateway.send_otp(phone_number, otp_code)
            if result.get("success"):
                return result
            logger.warning("Fast2SMS failed, logging to console fallback: %s", result.get("error"))

        # 2. Check Twilio
        if twilio_sid and twilio_token and twilio_from:
            gateway = TwilioSMSGateway(twilio_sid, twilio_token, twilio_from)
            result = gateway.send_otp(phone_number, otp_code)
            if result.get("success"):
                return result
            logger.warning("Twilio failed, logging to console fallback: %s", result.get("error"))

        # 3. Fallback to Local Mock Logger
        return LocalMockSMSGateway().send_otp(phone_number, otp_code)

    def send_call_invite(self, phone_number: str, caller_name: str, call_url: str) -> Dict[str, Any]:
        fast2sms_key = os.getenv("FAST2SMS_API_KEY", "").strip() or os.getenv("SMS_API_KEY", "").strip()
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        twilio_from = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

        # 1. Check Fast2SMS
        if fast2sms_key and not fast2sms_key.startswith("changeme"):
            gateway = Fast2SMSGateway(fast2sms_key)
            result = gateway.send_call_invite(phone_number, caller_name, call_url)
            if result.get("success"):
                return result
            logger.warning("Fast2SMS call invite failed, falling back to mock logger: %s", result.get("error"))

        # 2. Check Twilio
        if twilio_sid and twilio_token and twilio_from:
            gateway = TwilioSMSGateway(twilio_sid, twilio_token, twilio_from)
            result = gateway.send_call_invite(phone_number, caller_name, call_url)
            if result.get("success"):
                return result
            logger.warning("Twilio call invite failed, falling back to mock logger: %s", result.get("error"))

        # 3. Fallback to Local Mock Logger
        return LocalMockSMSGateway().send_call_invite(phone_number, caller_name, call_url)

sms_gateway = SmartSMSDispatcher()

