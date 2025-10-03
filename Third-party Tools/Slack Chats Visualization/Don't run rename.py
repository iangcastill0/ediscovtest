import os

directory_path = '.'

for filename in os.listdir(directory_path):
    if "__" in filename:
        name_part, extension_part = os.path.splitext(filename)
        split_index = extension_part.find("__")
        new_name = f"{name_part + extension_part[split_index:] + extension_part[:split_index]}"
        print(new_name)
        os.rename(os.path.join(directory_path, filename), os.path.join(directory_path, new_name))
