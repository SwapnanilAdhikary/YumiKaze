import os
from datetime import datetime

# Define the directory containing your albedo GeoTIFF files
path_to_files = r"C:\Users\SOUMITA\Projects\SIH_VISIBLE_all\MOSDAC_india_albedo"
csv_output = os.path.join(path_to_files, "time.csv")

# Open the CSV file to write
with open(csv_output, "w") as f:
    f.write("time,location\n")  # Write the header row
    for filename in os.listdir(path_to_files):
        if filename.endswith(".tif"):  # Only process GeoTIFF files
            # Extract date and time parts from the filename
            date_str = filename[6:15]  # Extract '01NOV2024'
            time_str = filename[16:20]  # Extract '2345'
            # Convert the date and time into ISO format
            timestamp = datetime.strptime(date_str + time_str, "%d%b%Y%H%M").isoformat()
            # Write the time and file path to the CSV
            filepath = os.path.join(path_to_files, filename)
            f.write(f"{timestamp},{filepath}\n")
print(f"Metadata file 'time.csv' created in {path_to_files}")
