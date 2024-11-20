from PIL import Image
import rasterio

def geotiff_to_jpg(input_file, output_file):

    with rasterio.open(input_file) as src:
        image_data = src.read(1)  # Assuming a single-band image
        image_min, image_max = image_data.min(), image_data.max()
        normalized_image = ((image_data - image_min) / (image_max - image_min) * 255).astype('uint8')
        
        image = Image.fromarray(normalized_image)
        image.save(output_file, "JPEG")
        print(f"Converted {input_file} to {output_file}")

input_geotiff = "output_image_20241120_142120.tif"
output_jpg = "output_file7.jpg"
geotiff_to_jpg(input_geotiff, output_jpg)
