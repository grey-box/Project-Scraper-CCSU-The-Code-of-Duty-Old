## Web Scraper
### Images Grabbing

### Instructions

#### version 1.0:
using set time out: After clicking download button, wait for about 15 seconds to save the page
##### outcomes: 
some images are shown, some images are in the wrong locations 

#### version 2.0 (updated):
async await<br>  (based on merging branch)
##### something new:

```javascript
const match1 = html.match(reg1) //save the match results as array
const match2 = html.match(reg2)
```

```javascript
let replace = async (each,i)=>{
          html = html.replace(match1[i], '"' + each + '"');
          html = html.replace(match2[i], '"' + each + '"');
        }

for(let k=0;k<base64_array.length;k++){
    await replace(base64_array[k],k) //wait for the replacing process
}
```
##### outcomes: 
most of images are shown, and they are in the right locations. Some images are not shown, part of reason is that the base64 issue is too large so the request cannot be processed. Some imgaes are shown twice.
