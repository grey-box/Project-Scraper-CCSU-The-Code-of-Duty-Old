
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
   // let allImagesList = [];
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


    // let getHtml = async (url) =>{
    //     $.get(url,function (response){
    //         try{
    //             var find = '"//';
    //             var re = new RegExp(find, 'g');
    //             let html = response.replaceAll(re, "https://");
    //             console.log()
    //             return html
    //         }catch (err){
    //             console.log(err)
    //             return response
    //         }
    //     })
    // };

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

    async function getContent(){
        try{
            var zip = new JSZip()
            //get page urls from the txt
            const res = await load()
            for (const each of res) {
                const index = res.indexOf(each);
                let folder_name = each.substr(each.lastIndexOf('/') + 1)
                console.log("folder_name:"+folder_name)
                //create folder
                zip.folder(folder_name)
                const imgs = await get_imgs(each)
                for(let i =0; i<imgs.length-2;i++){
                    console.log(imgs[i])
                    //create img file
                    zip.file(folder_name+"/"+imgs[i].toString().substr(imgs[i].lastIndexOf('/') + 1), urlToPromise(imgs[i]), {binary:true});
                }
                //html (not modified)
                zip.file(each.substr(each.lastIndexOf('/') + 1)+".html",getData(each))
            }
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



