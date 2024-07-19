from django.template.loader import get_template
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.db import connection
from django.conf import settings
import django.db as db
import datetime
from ventas.functions import clean_tax

def build_to_signed(request, uuid, data, date_emission):
    tax_emission = data['NitEmisor']
    tax_emission = clean_tax(tax_emission)
