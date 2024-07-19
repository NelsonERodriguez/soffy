import threading

user_local = threading.local()


class UserEmailLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user_local.email = request.user.email if request.user.is_authenticated else 'Anónimo'
        response = self.get_response(request)
        return response
