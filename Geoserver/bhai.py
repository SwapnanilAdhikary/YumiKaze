import os

# Path to the folder containing the files
folder_path = "test"

# Get a list of all TIFF files in the folder
files = [f for f in os.listdir(folder_path) if f.endswith(".tif")]

# Sort the files to ensure consistent renaming order
files.sort()

# Rename the files
for i, file_name in enumerate(files, start=1):
    # Construct the new file name
    new_name = f"img{i}.tif"
    
    # Full paths
    old_path = os.path.join(folder_path, file_name)
    new_path = os.path.join(folder_path, new_name)
    
    # Rename the file
    os.rename(old_path, new_path)
    print(f"Renamed: {file_name} -> {new_name}")

print("All files have been renamed!")
