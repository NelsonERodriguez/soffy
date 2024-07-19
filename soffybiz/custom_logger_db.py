import logging
from .middleware.get_user import user_local


class CustomDBLogger(logging.Handler):

    def emit(self, record):
        try:
            from django.utils import timezone
            from django.http import HttpRequest
            from django.conf import settings
            from api_bridge.models import Log_consultas
            from django.db import connection, transaction
            from soffybiz.debug import DEBUG

            record.email = getattr(user_local, 'email', 'Anónimo')

            obj_current_user = record.email

            str_message = record.getMessage()

            if (str_message.find('api_bridge_log_consultas') == -1 and
                    str_message.find('nova_logs') == -1 and
                    str_message.find('nova_query_logs') == -1) and not DEBUG:

                cursor = connection.cursor()

                try:
                    str_query = """
                        INSERT INTO NOVA..api_bridge_log_consultas values(%s, %s, GETDATE(), GETDATE());
                        """
                    cursor.execute(str_query, (obj_current_user, str_message))

                except Exception as e:
                    str_error_text = str(e)
                finally:
                    cursor.close()

        except Exception as e:
            print(f"Error logging database queries: {e}")
