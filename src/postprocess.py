#!/usr/bin/env python3

# This code may be bad, but it works!
import sys
from PIL import Image, ImageOps
import numpy as np

if __name__ == '__main__':
    assert len(sys.argv) >= 2, "Image path must be passed!"
    path = (sys.argv[1])

    # load image, discard alpha (if present)
    img = Image.open(path).convert("RGB")

    # remove menu and indicators
    data = np.array(img)
    # check if there is a menu indicator circle in the top left corner
    menu_is_open = (data[:102, :102, :] == [0, 0, 0]).all(axis=2).any()
    if menu_is_open:
        # preserve the full image while processing the open menu
        pass
    else:
        # preserve the menu indicator and the left side of the image
        pass

    # crop to the bounding box
    img = Image.fromarray(data).convert("RGB")
    bbox = ImageOps.invert(img).getbbox()
    img = img.crop((0, 0, bbox[2], bbox[3]))

    img = ImageOps.invert(img)

    # set alpha channel
    data = np.array(img.convert("RGBA"))
    # filter out all black pixels
    black = (data[:, :, :3] == 0).all(axis=2)
    data[black, 3] = 0

    img = Image.fromarray(data)

    img.save(path)