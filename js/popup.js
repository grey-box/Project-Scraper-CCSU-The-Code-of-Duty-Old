
let urlform = document.getElementById("url-form");
let optform = document.getElementById("option-form");


document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(
    {
      aszip: false,
      corsbypass: false,
    },
    (data) => {
      optform.corsbypass.checked = data.corsbypass;
      optform.aszip.checked = data.aszip;
    }
  );
});

optform.corsbypass.addEventListener("change", (event) => {
  chrome.storage.local.set({ corsbypass: Boolean(event.target.checked) });
});

optform.aszip.addEventListener("change", (event) => {
  chrome.storage.local.set({ aszip: Boolean(event.target.checked) });
});

//Execute after submitting form (clicking the save button)


urlform.addEventListener("submit", async (event) => {
    let urls_file_content = []
    let allImagesList = [];
    //read from input file
    console.log('read file')

    function load(){
        return new Promise(((resolve, reject) => {
            let selected = document.getElementById("file").files[0];
                    console.log(selected)
                    let reader = new FileReader();
                    reader.addEventListener("loadend", () => {
                        urls_file_content = reader.result.split(/\r\n|\n/)
                        resolve(urls_file_content)
                        console.log("in promise")
                        console.log(urls_file_content)
                    });
                    reader.readAsText(selected);
        }))
    }

    let getData = async (url) => {
        console.log("getData:", "Getting data from URL");
        return $.get(url);
    };


    const get_imgs = async (url) => {
        let html;
        try {
            // Wait for function to fulfill promise then set HTML data to
            // variable
            let imgLinks = [];
            html = await getData(url);
            console.log("parsing HTML");
            testParse = $.parseHTML(html);
            let testImageElements = $(testParse).find("img");
            // console.log(testImageElements);
            testImageElements.each(function () {
                let src = $(this).attr("src");
                let srcset = $(this).attr("srcset");
                //console.log(src)
                if (src.toString().search("https") == -1) {
                    // console.log(src.toString().search("https"));
                    //console.log(src);
                    src = "https:" + src;
                    //console.log(src);
                }
                imgLinks.push(src);
            });
            return imgLinks;
        } catch (e) {
            console.error(e)
        }}

    function urlToPromise(url) {
        return new Promise(function(resolve, reject) {
            JSZipUtils.getBinaryContent(url, function (err, data) {
                if(err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }


    async function get_html(url, folderName, imgUrlArray) {
        return new Promise((async (resolve, reject) => {

            console.log("get html")
            console.log(folderName)
            console.log(imgUrlArray)

            let html = null;
            let hostname = url.match(/(?<=(http|https):\/\/)(\S+?)(?=\/)/)[0];
            let css = [];
            let cssLinks = [];

            let get_data = async (url) => {
                console.log("getData:", "Getting data from URL");
                return $.get(url);
            };

            let getCSSLinks = (html) => {
                PARSEDHTML = $.parseHTML(html);
                linkElements = $(PARSEDHTML).filter("link[rel=stylesheet]");
                linkElements.each(function () {
                    // Create a dummy element to transfer <link> tag href to an <a> tag
                    // so that JQuery can identify its protocol, hostname, and pathname etc.
                    let element = document.createElement("a");
                    $(element).attr("href", $(this).attr("href"));

                    if (element.protocol === "chrome-extension:") {
                        element = element.toString().replace("chrome-extension:", "https:");
                    }
                    if (element.toString().search(chrome.runtime.id) >= 1) {
                        element = element.toString().replace(chrome.runtime.id, hostname);
                    }

                    console.log("getCSSLinks:", "Pushing");
                    cssLinks.push(element.toString());
                });
            };

            let getCSS = async (html) => {
                for (let index = 0; index < cssLinks.length; index++) {
                    try {
                        // Waits for the function to fulfil promise then set data to cssText
                        let cssText = await getData(cssLinks[index]);
                        //console.log(cssText)
                        // Wrap data into <sytle> tags to append to html
                        cssElement = "<style>" + cssText + "</style> ";
                        console.log("getCSS (try):", "Assigning");
                        css[index] = cssElement;
                    } catch (err) {
                        console.log(err);
                        css[index] = "";
                    }
                }
            };


            let replaceCSS = () => {
                //console.log(css)
                cssLinks.forEach((cssLink, index) => {
                    //Replace previous <link> tag with new css <style> tag
                    console.log("replaceCSS:", "Replacing");
                    html = html.replace(
                        /(\<link) ?(\S*) ?(\S*) ?(rel\="stylesheet") ?(\S*) ?(\S*)>/,
                        css[index]
                    );
                });
            };

            const scrape = async (url) => {
                try {
                    // Wait for function to fulfill promise then set HTML data to
                    // variable
                    html = await getData(url);
                    console.log("await get data from url: before replacing")
                    console.log(html)

                    // console.log("parsing HTML");
                    // testParse = $.parseHTML(html);
                    // let testImageElements = $(testParse).find("img");
                    //
                    // console.log(testImageElements);
                    //
                    // testImageElements.each(function () {
                    //     let src = $(this).attr("src");
                    //     let srcset = $(this).attr("srcset");
                    //
                    //     //console.log(src)
                    //
                    //     if (src.toString().search("https") == -1) {
                    //         console.log(src.toString().search("https"));
                    //         console.log(src);
                    //         src = "https:" + src;
                    //         console.log(src);
                    //     }
                    //
                    //     imgLinks.push(src);
                    // });

                    //reg ex: get src and srcset
                    const reg1 = /(?<=img.*?src=)(".*?[jpg|png]")/gm;
                    const reg2 = /(?<=img.*?srcset=)(".*?[jpg|png|JPG] 2x")/gm;
                    const reg3 = /(?<=img.*?srcset)(=".*?[jpg|png|JPG] 2x")/gm
                    //replace
                    const length_reg1 = html.match(reg1).length; //20
                    const length_reg2 = html.match(reg2).length; //20: including /static/images
                    const length_reg3 = html.match(reg3).length

                    for(let j=0;j<length_reg3;j++){
                        html = html.replace(html.match(reg3)[j],"")
                    }

                    //console.log(imgLinks);

                    //await converToBase64();

                    //console.log(base64_array);

                    for (let i = 0; i < imgUrlArray.length - 2; i++) {

                        html = html.replace(html.match(reg1)[i], '"./' + folderName + "/"+imgUrlArray[i].toString().substr(imgUrlArray[i].lastIndexOf('/') + 1) + '"');
                       //html = html.replace(html.match(reg2)[i], '"./' + folderName + "/"+imgUrlArray[i].toString().substr(imgUrlArray[i].lastIndexOf('/') + 1) + '"');
                    }
                    // imgUrlArray.forEach((each, index) => {
                    //     console.log("For Each:", "Replacing image");
                    //     html = html.replace(html.match(reg1)[index], '"./' +folderName+ each.toString().substr(each.lastIndexOf('/') + 1) + '"');
                    // });

                    // Initiate function to get CSS links
                    getCSSLinks(html);

                    // For every CSS link gets its CSS and append to HTML if any
                    if (cssLinks.length > 0) {
                        try {
                            await getCSS(html);

                            replaceCSS();

                            console.log("return html")
                            console.log(html)
                            resolve(html)
                            //console.log("DOWNLOADING");
                            //download(html);
                        } catch (err) {
                            console.log(err);
                        }
                    } else {
                        console.log("return html")
                        console.log(html)
                        resolve(html)
                        //download(html);
                    }
                } catch (err) {
                    console.log(err);
                }
            };

            await scrape(url);
        }))}


    async function getContent(){
        try{
            var zip = new JSZip()
            const res = await load() //get pages urls from txt file
            //for each page
            for (const each of res) {
                const index = res.indexOf(each);
                let folder_name = each.substr(each.lastIndexOf('/') + 1)
                console.log("folder_name:"+folder_name)
                zip.folder(folder_name)
                const imgs = await get_imgs(each)
                //for each image
                for(let i =0; i<imgs.length-2;i++){
                    console.log(imgs[i])
                    let image_name = imgs[i].toString().substr(imgs[i].lastIndexOf('/') + 1)
                    zip.file(folder_name+"/"+image_name, urlToPromise(imgs[i]), {binary:true});
                }
                
                const html_new = await get_html(each, folder_name, imgs)
                console.log(html_new)
                //save all into a folder
                //create a folder to save images
                zip.file(each.substr(each.lastIndexOf('/') + 1)+".html",html_new)
            }

            //save all
            zip.generateAsync({type:"blob"}).then((function (content){
                console.log(content)
                saveAs(content, "pages.zip");
            }))
        }catch (err){
            console.error(err)
        }
    }

    getContent()
// - Wikipedia_files
/*    function loadPages(res){
        let pagesContent = []
        return new Promise(((resolve, reject) => {
            if(res.length >0 ){
                res.forEach((each)=>{
                    fetch(each).then(function (data){
                        pagesContent.push(data.text())
                    })
                })
                resolve(pagesContent)
            }
            else{
                reject("No urls")
            }
        }))
    }*/

   /* let getData = async (url) => {
        console.log("getData:", "Getting data from URL");
        return $.get(url);
    };

    async function writeIntoFile(pages) {
        console.log(pages)
        await fetch(pages)


        /!*console.log("line 1")
        var zip = new JSZip()
        console.log("line 2")
        return new Promise(((resolve, reject)=>{
            console.log("line 3")
            pages.forEach((each,index)=>{
                console.log("line 4")
                each.then(()=>{
                    zip.file(index+".html",each)
                }).catch((e)=>{
                    console.error(e)
                })
            })
            zip.generateAsync({type:"blob"}).then((function (content){
                saveAs(content, "pages.zip");
                resolve(content)
            }))
        }))*!/
    }

    async function getContent(){
        try{
            var zip = new JSZip()
            const res = await load()
            //console.log(res[0])
            res.forEach((each, index)=>{
                zip.file("file"+index+".html",getData(each))
            })
            zip.generateAsync({type:"blob"}).then((function (content){
                console.log(content)
                saveAs(content, "pages.zip");
            }))

            // console.log("get html")
            // console.log(res)
            // const pages = await loadPages(res)
            // console.log("try to get pages")
            // console.log(pages)
            // const files = await writeIntoFile(pages)
            // console.log("try to get zip")
            // console.log(files)
        }catch (err){
            console.error(err)
        }
    }

    getContent()*/
    //
    // load().then((message)=>{
    //     console.log("after load")
    //     console.log(message[0])
    // })
    //load file content
 //   const loadFile = async () => {
    //     try {
    //         let selected = document.getElementById("file").files[0];
    //         console.log(selected)
    //         let reader = new FileReader();
    //         reader.addEventListener("loadend", () => {
    //             urls_file_content = reader.result.split(/\r\n|\n/)
    //             console.log("before await")
    //             console.log(urls_file_content)
    //         });
    //         reader.readAsText(selected);
    //     } catch (err) {
    //         console.error(err)
    //     }
    // }
//get urls
//     let getUrls = async ()=>{
//         await loadFile()
//         console.log("after await")
//         console.log(urls_file_content.length)
//         for(let i=0;i<urls_file_content.length-1;i++){
//             let url_txt = await fetch(urls_file_content[i])
//             console.log(url_txt)
//         }
//     }
//
//     await getUrls()
})

    // var reader = new FileReader();
    // reader.onload = function(progressEvent){
    //     urls_file_content = reader.result.split(/\r\n|\n/);
    //     for(var line = 0; line < urls_file_content.length-1; line++){
    //         console.log(urls_file_content[line]);
    //     }
    // };
    // reader.readAsText(selected);



    //downloading mutiple pages into a zip file
    //read urls from a txt file
// var fileContentArray = []
//
//     document.getElementById('file').onchange = function(){
//         var file = this.files[0];
//         var reader = new FileReader();
//         reader.onload = function(progressEvent){
//             var fileContentArray = this.result.split(/\r\n|\n/);
//             for(var line = 0; line < fileContentArray.length-1; line++){
//                 console.log(fileContentArray[line]);
//             }
//         };
//         reader.readAsText(file);
//     };





    //search for each one


    //save them into zip file




   // event.preventDefault();
//});



