from django import forms
from user_auth.models import User
from django.contrib.auth.forms import PasswordChangeForm


class PasswordChangingForm(PasswordChangeForm):
    old_password = forms.CharField(label="Contraseña actual",
                                   widget=forms.PasswordInput(attrs={"class": "form-control", "type": "password"}))
    new_password1 = forms.CharField(label="Contraseña nueva", max_length=100,
                                    widget=forms.PasswordInput(attrs={"class": "form-control", "type": "password"}))
    new_password2 = forms.CharField(label="Contraseña nueva", max_length=100,
                                    widget=forms.PasswordInput(attrs={"class": "form-control", "type": "password"}))

    class Meta:
        model = User
        fields = ('old_password', 'new_password1', 'new_password2')


class UserForms(forms.Form):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=150, required=True)
    name = forms.CharField(max_length=255, required=True)
    email_alternativo = forms.CharField(max_length=255, required=False)


class GroupsForm(forms.Form):
    name = forms.CharField(max_length=150, required=True)


class PermissionsForm(forms.Form):
    name = forms.CharField(max_length=255, required=True)
    content_type_id = forms.IntegerField(required=True)
    codename = forms.CharField(max_length=100, required=True)
