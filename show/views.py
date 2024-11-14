from django.shortcuts import render, HttpResponse
from django.conf import settings
import os
import random
import torch
from PIL import Image
from torchvision import transforms
import h5py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# Create your views here.

transform = transforms.Compose([
     transforms.Resize((settings.IMAGE_WIDTH, settings.IMAGE_HEIGHT)),
     transforms.ToTensor(),  # Convert images to PyTorch tensors
    #transforms.Normalize((0.5,0.5,0.5), (0.5,0.5,0.5))  # Normalize the images
])

def append_tensor_to_hdf5(file_name, image_tensor, detected_objects_tensor) -> None:
    with h5py.File(file_name, 'a') as f:
        if 'images' not in f:
            f.create_dataset('images', 
                             shape=(0, 3, settings.IMAGE_WIDTH, settings.IMAGE_HEIGHT),
                             maxshape=(None, 3, settings.IMAGE_WIDTH, settings.IMAGE_HEIGHT),  # Allow for dynamic resizing
                             dtype='float32')
        f['images'].resize((f['images'].shape[0] + 1, 3, settings.IMAGE_WIDTH, settings.IMAGE_HEIGHT))
        f['images'][-1] = image_tensor.numpy()

        if 'detected_objects' not in f:
            f.create_dataset('detected_objects', 
                             shape=(0, settings.MAX_OBJECTS, 4),
                             maxshape=(None, settings.MAX_OBJECTS, 4),  # Allow for dynamic resizing
                             dtype='float32') 
        f['detected_objects'].resize((f['detected_objects'].shape[0] + 1, settings.MAX_OBJECTS, 4))
        f['detected_objects'][-1] = detected_objects_tensor.numpy()

def mkdir_recursive(path) -> None: 
    if not(os.path.exists(path)):
        os.system(command=f"mkdir -p {path}")

def ensure_linking(data_in_static) -> bool:
    data_dir = os.path.abspath(settings.DATA_PATH)
    mkdir_recursive(data_dir)
    seen_data_dir = os.path.join(data_dir, 'seen_data_ODDS/')
    mkdir_recursive(seen_data_dir)
    if not(os.path.exists(data_in_static)):
        os.system(f"ln -s '{data_dir}' '{data_in_static}'")
    hdf5 = settings.HDF5_PATH
    hdf5_dir = os.path.dirname(hdf5)
    hdf5_file = os.path.basename(hdf5)
    mkdir_recursive(hdf5_dir)
    hdf5_data_path = os.path.join(data_in_static, 'hdf5/', hdf5_file)
    mkdir_recursive(os.path.join(data_in_static, 'hdf5/'))
    if not(os.path.isfile(hdf5_data_path)):
        os.system(f"touch {hdf5}")
        os.system(f"ln -s '{hdf5}' '{hdf5_data_path}'")
        return False
    return True

@csrf_exempt 
def home(request):
    data_in_static = os.path.join(os.getcwd()+settings.STATIC_URL, 'data')
    ensure_linking(data_in_static)
    images = [img for img in os.listdir(data_in_static) if os.path.splitext(img)[1] in settings.IMAGES_EXTENSIONS]
    if request.method == "GET":
        if images:
            image_name = random.choice(images)
            curr_path = os.path.join(data_in_static, image_name)
            image_path = os.path.join(data_in_static, 'seen_data_ODDS', image_name)
            image_path = os.path.relpath(image_path)
            image = Image.open(curr_path)
            image = image.resize((settings.IMAGE_WIDTH, settings.IMAGE_HEIGHT))
            image.save(curr_path)
            os.system(f"mv '{os.path.join(data_in_static, curr_path)}' '{image_path}'")
            
            return render(request, 'show.html', {'image': image_path})
        else:
            return HttpResponse("No images in the data directory.")
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            coordinates = [[int(value) for value in row] for row in data['coords']]
            while len(coordinates) != settings.MAX_OBJECTS:
                coordinates.append([-1, -1, -1, -1])
            while len(coordinates) > settings.MAX_OBJECTS:
                coordinates.pop()
            image_path = os.path.join(data_in_static, 'seen_data_ODDS/', os.path.basename(data['src']))
            image_tensor = transform(Image.open(image_path))
            coordinates = torch.tensor(coordinates)
            append_tensor_to_hdf5(os.path.join(data_in_static, 'hdf5/', os.path.basename(settings.HDF5_PATH)), image_tensor, coordinates)
            return JsonResponse({'status': 'success', 'data': data})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)