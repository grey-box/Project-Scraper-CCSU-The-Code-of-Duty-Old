let urlform = document.getElementById("url-form");
// let optform = document.getElementById("option-form");
//
//
// document.addEventListener("DOMContentLoaded", () => {
//     chrome.storage.local.get(
//         {
//             aszip: false,
//             corsbypass: false,
//         },
//         (data) => {
//             optform.corsbypass.checked = data.corsbypass;
//             optform.aszip.checked = data.aszip;
//         }
//     );
// });
//
// optform.corsbypass.addEventListener("change", (event) => {
//     chrome.storage.local.set({corsbypass: Boolean(event.target.checked)});
// });
//
// optform.aszip.addEventListener("change", (event) => {
//     chrome.storage.local.set({aszip: Boolean(event.target.checked)});
// });

//Execute after submitting form (clicking the save button)

let saveBtn = document.querySelectorAll(".btn-secondary");

document.getElementById("btn").addEventListener("click", async (event) => {
  let zip = new JSZip();
  let html = null;
  let urlMap = new Map();
  const DEPTH = 1;

  let urls_file_content = [];
  let allImagesList = [];
  //read from input file
  console.log("read file");

  function load() {
    return new Promise((resolve, reject) => {
      let selected = document.getElementById("file").files[0];
      if (selected != null) {
        console.log(selected);
        let reader = new FileReader();
        reader.addEventListener("loadend", () => {
          urls_file_content = reader.result.split(/\r\n|\n/);
          resolve(urls_file_content);
          console.log("in promise");
          console.log(urls_file_content);
        });
        reader.readAsText(selected);
      } else if (document.getElementById("text_area").value != null) {
        let text_lines = document.getElementById("text_area").value.split("\n");
        console.log(text_lines);
        resolve(text_lines);
      }
    });
  }

  let getData = async (url) => {
    console.log("getData:", "Getting data from URL");
    return $.get(url);
  };

  const get_imgs = async (url) => {
    try {
      // Wait for function to fulfill promise then set HTML data to
      // variable
      let imgLinks = [];
      let hostname = url.match(/(?<=(http|https):\/\/)(\S+?)(?=\/)/)[0];

      //   console.log("GETTING IMAGES:", html);
      testParse = $.parseHTML(html);
      let testImageElements = $(testParse).find("img");
      // console.log(testImageElements);

      testImageElements.each(function () {
        let src = $(this).attr("src");

        let element = document.createElement("a");
        $(element).attr("href", src);

        if (element.protocol === "chrome-extension:") {
          element = element.toString().replace("chrome-extension:", "https:");
        }
        if (element.toString().search(chrome.runtime.id) >= 1) {
          element = element.toString().replace(chrome.runtime.id, hostname);
        }

        //console.log(src)
        // if (src.toString().search("https") == -1) {
        //   // console.log(src.toString().search("https"));
        //   //console.log(src);
        //   src = "https:" + src;
        //   //console.log(src);
        // }
        
        imgLinks.push(element.toString());
      });
      return imgLinks;
    } catch (e) {
      console.error(e);
    }
  };

  function urlToPromise(url) {
    return new Promise(function (resolve, reject) {
      JSZipUtils.getBinaryContent(url, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async function get_html(url, depth, folderName) {
    urlMap.set(url, true);

    return new Promise(async (resolve, reject) => {
      console.log("get html");
      console.log(folderName);

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

      let urlCheck = (URL) => {
        let wikiOmits = [
          "popup.html",
          "wiki/Main_Page",
          "index.php",
          "Portal:Current_events",
          "Special:",
          "File:",
          "Category:",
          "Help:",
          "Wikipedia:",
          "Template:",
          "Template_talk:",
          "Talk:",
        ];

        let checks = 0;

        if (URL.protocol === "chrome-extension:") {
          URL = URL.toString().replace("chrome-extension:", "https:");
        }
        if (URL.toString().search(chrome.runtime.id) >= 1) {
          URL = URL.toString().replace(chrome.runtime.id, hostname);
        }

        if (!(typeof URL === "string")) {
          URL = $(URL).attr("href");
        }

        if (!urlMap.has(URL)) {
          wikiOmits.every((omit) => {
            if (checks > 0) {
              return false;
            }

            if (URL.toString().search(omit) >= 0) {
              checks++;
            }

            return true;
          });

          // console.log("https://" + hostname)
          if (checks < 1 && URL.toString().search("https://" + hostname) >= 0) {
            urlMap.set(URL, false);
            // index++
          }
        }
      };

      const scrape = async (url) => {
        try {
          // Wait for function to fulfill promise then set HTML data to
          // variable
          html = await getData(url);

          if (depth >= 0) {
            console.log("DEPTH IS EQUAL");
            let PARSEDHTML = $.parseHTML(html);
            let aElements = $(PARSEDHTML).find("a[href]");
            aElements.each(function () {
              urlCheck(this);
            });
          }

          const imgs = await get_imgs(url);
          for (let i = 0; i < imgs.length - 2; i++) {
            console.log(imgs[i]);
            let image_name = imgs[i]
              .toString()
              .substr(imgs[i].lastIndexOf("/") + 1);
            zip.file(folderName + "/" + image_name, urlToPromise(imgs[i]), {
              binary: true,
            });
          }

          console.log("await get data from url: before replacing");
          // console.log(html)
          const reg1 = /(?<=img.*?src=)(".*?")/gm;
          const reg2 = /(?<=img.*?srcset=)(".*?2x")/gm;
          const reg3 = /(?<=img.*?srcset)(=".*?2x")/gm;
          //replace
          const length_reg1 = html.match(reg1).length; //20
          const length_reg2 = html.match(reg2).length; //20: including /static/images
          const length_reg3 = html.match(reg3).length;

          //remove srcset
          for (let j = 0; j < length_reg3 - 2; j++) {
            html = html.replace(html.match(reg3)[j], "");
          }

          for (let j = 0; j < html.match(reg3).length - 2; j++) {
            html = html.replace(html.match(reg3)[j], "");
          }

          for (let j = 0; j < html.match(reg3).length; j++) {
            html = html.replace(html.match(reg3)[0], "");
          }

          //replace src
          for (let i = 0; i < imgs.length - 2; i++) {
            html = html.replace(
              html.match(reg1)[i],
              '"./' +
                folderName +
                "/" +
                imgs[i].toString().substr(imgs[i].lastIndexOf("/") + 1) +
                '"'
            );
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

              console.log("return html");
              // console.log(html)
              zip.file(url.substr(url.lastIndexOf("/") + 1) + ".html", html);
              resolve(html);
              //console.log("DOWNLOADING");
            } catch (err) {
              console.log(err);
            }
          } else {
            console.log("return html");
            console.log(html);
            zip.file(url.substr(url.lastIndexOf("/") + 1) + ".html", html);
            resolve(html);
          }
        } catch (err) {
          console.log(err);
        }
      };

      await scrape(url);
    });
  }

  let crawler = async (url, depth) => {
    urlMap.set(url, false);
    while (depth >= 0) {
      const temp = new Map(urlMap);

      console.log(temp);
      for (const [key, value] of temp) {
        if (value == false) {
          console.log("VALUE IS FALSE");
          await get_html(key, depth, "images_folder");
        }
      }
      depth = depth - 1;
    }
  };

  async function getContent() {
    try {
      const res = await load();
      console.log("res");
      console.log(res);
      let folder_name = "images_folder";
      zip.folder(folder_name);
      for (const each of res) {
        await crawler(each, 1);
        // let html_new = await get_html(each, folder_name)
        // console.log(html_new)
      }

      zip.generateAsync({ type: "blob" }).then(function (content) {
        console.log(content);
        saveAs(content, "pages.zip");
      });
    } catch (err) {
      console.error(err);
    }
  }

  getContent();
  event.preventDefault();
});
