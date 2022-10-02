urlToBase64()


function urlToBase64(){

    const getBase64StringFromDataURL = (dataURL) =>
        dataURL.replace('data:', '').replace(/^.+,/, '');

    // console.log(document.images)
    const img_url= []
    //list all images url
    for(let i = 0; i<document.images.length;i++){
        console.log(document.images.item(i).src)
        img_url[i] = document.images.item(i).src
        fetch(img_url[i])
            .then((res) => res.blob())
            .then((blob) => {
                // Read the Blob as DataURL using the FileReader API
                const reader = new FileReader();
                reader.onloadend = () => {
                    // console.log(reader.result);
                    // Logs data:image/jpeg;base64,wL2dvYWwgbW9yZ...
                    // Convert to Base64 string
                    const base64 = getBase64StringFromDataURL(reader.result);
                    //set src
                    document.images.item(i).src = "data:image/jpeg;base64,"+base64;
                    //change srcset, give it another name, because srcset will affect src
                    document.images.item(i).setAttribute("data-savepage-srcset", document.images.item(i).srcset)
                    //delete srcset
                    document.images.item(i).removeAttribute("srcset")
                };
                reader.readAsDataURL(blob);
            });
    }
    //when view it on live edit, the images urls are converted to base64
    // console.log(document.body.outerHTML)// no change
    // console.log(document.body.innerText) //text
    // console.log(document.body.innerHTML) // no change
}