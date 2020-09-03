from django.shortcuts import render, redirect
from .forms import FileFieldForm

def handle_uploaded_file(f):  
    with open('frontend/static/upload/'+f.name, 'wb+') as destination:  
        for chunk in f.chunks():  
            destination.write(chunk)

# Create your views here.
def index(request):
    if request.method == 'POST':  
        form = FileFieldForm(request.POST, request.FILES)  
        if form.is_valid():  
            handle_uploaded_file(request.FILES['file']) 
            form = FileFieldForm()  
            return render(request,"frontend/index.html", {'form':form})
        else:
            return render(request,"frontend/error.html")

    else:
        form = FileFieldForm()  
        return render(request,"frontend/index.html", {'form':form})
         
