from django import forms

class FileUploadForm(forms.Form):
    file = forms.FileField(required=False)  # Make it optional if not always uploading
    user_input = forms.CharField(
        max_length=500,
        widget=forms.Textarea(attrs={'placeholder': 'Enter your message here...'})
    )
    chat_id = forms.IntegerField(required=True)  # Add chat_id as a required field
