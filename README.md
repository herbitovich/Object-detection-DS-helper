# Object-detection-DS-helper
A Django web application to simplify the process of creating a dataset for an object detection model.
Go to `settings.py` -> scroll to the end of the file -> define the variables `DATA_PATH` (to point to the folder of your preprocessed dataset), `HDF5_PATH` (to point to the `.h5` file that the app will store the process images in), other variables of the section (optional). Start the application using
```
python manage.py runserver
```
Now visit the localhost address to start selecting the desired objects in your dataset's images.
