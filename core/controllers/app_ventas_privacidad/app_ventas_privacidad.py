from django.shortcuts import render


def index(request):
    return render(request, 'privacidad/privacidad.html')
