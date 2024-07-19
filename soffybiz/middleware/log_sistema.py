from django.db import connection
from django.utils.deprecation import MiddlewareMixin
from api_bridge.models import Log_consultas
from soffybiz.debug import DEBUG


class QueryLoggingMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if not DEBUG:
            user = request.user.email if request.user.is_authenticated else 'Anónimo'
            for query in connection.queries:
                try:
                    if query['sql'].find("SELECT SYSDATETIME()' - PARAMS = ()") == -1 and query['sql'].find(
                            "QUERY = 'SELECT @@IDENTITY AS ID' - PARAMS = ()") == -1:
                        Log_consultas.objects.create(
                            usuario=user,
                            query=query['sql'],
                        )
                except ValueError:
                    pass

        return response
