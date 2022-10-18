### Instructions

click "choose file" button: 
Upload a file containing the pages urls you want to save

For example:
read_urls.txt

Result: save all the images to a folder for each page in one zip file (in the same path as the file you uploaded)

If the download button does not work, upload the file again (it works at the second time) -- for some reason


### What is next to do?
In this code: 
``` javascript
zip.file(each.substr(each.lastIndexOf('/') + 1)+".html",getData(each))     //getData(url): return $.get(url)
```
Before using zip.file() the html, replace the html src to "./folder_name/image_name", and delete srcset
