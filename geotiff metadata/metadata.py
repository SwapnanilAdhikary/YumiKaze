from PIL import Image
from PIL.TiffTags import TAGS

img = Image.open('3RIMG_01NOV2024_1215_L1B_STD_V01R00_IMG_VIS.tif')
meta_dict = {TAGS[key] : img.tag[key] for key in img.tag_v2}

print(meta_dict)