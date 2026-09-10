import logging

logger = logging.getLogger("sms_gateway")

class SMSGatewayInterface:
    def send_otp(self, phone_number: str, otp_code: str) -> bool:
        raise NotImplementedError

class LocalMockSMSGateway(SMSGatewayInterface):
    """
    Local development mock gateway.
    Logs OTP to console securely without third-party network costs.
    """
    def send_otp(self, phone_number: str, otp_code: str) -> bool:
        masked = phone_number[:3] + "******" + phone_number[-2:] if len(phone_number) >= 8 else "****"
        print(f"\n[MOCK SMS GATEWAY] Sent OTP '{otp_code}' to {masked} (Valid for 5 minutes)\n")
        return True

class NICSMSGateway(SMSGatewayInterface):
    """
    Production interface for Government of India NIC SMS Gateway.
    Plug credentials here when deploying to secure NIC infrastructure.
    """
    def __init__(self, api_url: str = "", auth_token: str = ""):
        self.api_url = api_url
        self.auth_token = auth_token

    def send_otp(self, phone_number: str, otp_code: str) -> bool:
        # In production: make encrypted HTTPS POST to NIC endpoint
        return True

sms_gateway = LocalMockSMSGateway()
