let urlform = document.getElementById("url-form");


var slider = document.getElementById("depth_area");
var output = document.getElementById("value");
output.innerHTML = slider.value;

slider.oninput = function () {
  if (slider.value > 2) {
    window.confirm("Crawling may take longer if depth value is greater than 2");
  }
  output.innerHTML = this.value;
};

let saveBtn = document.querySelectorAll(".btn-secondary");

document.getElementById("btn").addEventListener("click", async (event) => {
  let zip = new JSZip();
  let html = null;
  let urlMap = new Map();
  let imgsMap = new Map();
  let cssMap = new Map();
  let cssCount = 1;

  let hostname = null;

  let urls_file_content = [];
  //read from input file
  // console.log("read file");

  function load() {
    return new Promise((resolve, reject) => {
      let selected = document.getElementById("file").files[0];
      if (selected != null) {
        let reader = new FileReader();
        reader.addEventListener("loadend", () => {
          urls_file_content = reader.result.split(/\r\n|\n/);
          resolve(urls_file_content);
        });
        reader.readAsText(selected);
      } else if (document.getElementById("text_area").value != null) {
        let text_lines = document.getElementById("text_area").value.split("\n");
        resolve(text_lines);
      }
    });
  }

  let getData = (url) => {
    return $.get(url);
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

  function escapeRegExp(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  let validURL = (url) => {
    let element = document.createElement("a");

    $(element).attr("href", url);

    if (element.protocol === "chrome-extension:") {
      element = element.toString().replace("chrome-extension:", "https:");
    } else {
      element = element.toString();
    }

    if (element.search(chrome.runtime.id) >= 1) {
      element = element.replace(chrome.runtime.id, hostname);
    }

    element = element.replace(/amp;/gs, "");

    return element;
  };

  async function get_html(url, depth, imgfolderName, htmlfolderName) {
    urlMap.set(url, true);
    console.log(url);
    hostname = url.match(/(?<=(http|https):\/\/)(\S+?)(?=\/)/)[0];

    return new Promise(async (resolve, reject) => {
      let css = [];
      let cssLinks = [];

      const get_imgs = async (url) => {
        try {
          // Wait for function to fulfill promise then set HTML data to
          // variable
          let imgLinks = [];

          const PARSEDHTML = $.parseHTML(html);
          let imgElements = $(PARSEDHTML).find("img");

          imgElements.each(function () {
            let src = $(this).attr("src");

            let element = validURL(src);

            imgLinks.push(element);
            if (!imgsMap.has(element)) {
              imgsMap.set(element, "");
            }
          });
          return imgLinks;
        } catch (e) {
          console.error(e);
        }
      };

      let download_imgs = (imgs) => {
        imgs.forEach((each) => {
          if (imgsMap.get(each) == "") {
            let image_name = decodeURIComponent(
              each.toString().substr(each.lastIndexOf("/") + 1)
            );

            image_name = image_name.replace(/[-/\\^$*+?()"'|[\]{}]/gs, "");

            zip.file(imgfolderName + "/" + image_name, urlToPromise(each), {
              binary: true,
            });
            imgsMap.set(each, image_name);
          }
        });
      };

      let replaceHTML = (reg1, map, folder) => {
        // console.log("Before", html);
        const content = html.match(reg1);

        if (content != null && content.length > 0) {
          content.forEach((each) => {
            const reg2 = new RegExp(escapeRegExp(each), "gs");

            let temp = validURL(each);

            if (map.has(temp)) {
              html = html.replace(reg2, "../" + folder + "/" + map.get(temp));
            }
          });
        }
      };

      // let replace_imgs = () => {
      //   const reg1 = /(?<=\<img.*?src=)(".*?")/gs;
      //   const reg3 = /(?<=\<img.*?srcset=")(.*?)(?=")/gs;

      //   const imgSRC = html.match(reg1);

      //   html = html.replace(reg3, "");

      //   if (imgSRC != null && imgSRC.length > 1) {
      //     console.log(imgSRC);
      //     imgSRC.forEach((each, i) => {
      //       try {
      //         let temp = each.toString().substr(each.lastIndexOf("/") + 1);

      //         const regex = new RegExp(each, "gs");

      //         html = html.replace(regex, '"./images_folder/' + temp + '"');
      //       } catch (error) {
      //         console.log(error);
      //       }
      //     });
      //   }
      // };

      let getCSSLinks = (html) => {
        PARSEDHTML = $.parseHTML(html);
        linkElements = $(PARSEDHTML).filter("link[rel=stylesheet]");
        linkElements.each(function () {
          let href = $(this).attr("href");
          let element = validURL(href);

          cssLinks.push(element);
          if (!cssMap.has(element)) {
            cssMap.set(element, "");
          }
        });
      };

      let getCSS = async () => {
        cssLinks.forEach(async (each) => {
          if (cssMap.get(each) == "") {
            // let cssText = await getData(each);
            let css_name = "css" + cssCount + ".css";
            cssCount++;

            zip.file("CSS/" + css_name, urlToPromise(each), {
              binary: true,
            });
            cssMap.set(each, css_name);
          }
        });

        // for (let index = 0; index < cssLinks.length; index++) {
        //   try {
        //     // Waits for the function to fulfil promise then set data to cssText
        //     let cssText = await getData(cssLinks[index]);
        //     //console.log(cssText)
        //     // Wrap data into <sytle> tags to append to html
        //     cssElement = "<style>" + cssText + "</style> ";
        //     console.log("getCSS (try):", "Assigning");
        //     css[index] = cssElement;
        //   } catch (err) {
        //     console.log(err);
        //     css[index] = "";
        //   }
        // }
      };

      let replaceCSS = () => {
        //console.log(css)
        cssLinks.forEach((cssLink, index) => {
          //Replace previous <link> tag with new css <style> tag
          // console.log("replaceCSS:", "Replacing");
          html = html.replace(
            /(\<link) ?(\S*) ?(\S*) ?(rel\="stylesheet") ?(\S*) ?(\S*)>/,
            css[index]
          );
        });
      };

      let urlCheck = (url) => {
        let wikiOmits = [
          "popup.html",
          "wiki/Main_Page",
          "index.php",
          "Portal:",
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

        url = validURL(url);

        if (!(typeof url === "string")) {
          url = $(url).attr("href");
        }

        if (!urlMap.has(url)) {
          wikiOmits.every((omit) => {
            if (checks > 0) {
              return false;
            }

            if (url.toString().search(omit) >= 0) {
              checks++;
            }

            return true;
          });

          if (checks < 1 && url.search("https://" + hostname) >= 0) {
            urlMap.set(url, false);
          }
        }
      };

      const scrape = async (url) => {
        try {
          // Wait for function to fulfill promise then set HTML data to
          // variable
          html = await getData(url);

          // This allows the scraper to continue to gather links on the page
          // if depth is greater than 0
          if (depth > 0) {
            let PARSEDHTML = $.parseHTML(html);
            let aElements = $(PARSEDHTML).find("a[href]");
            aElements.each(function () {
              urlCheck(this);
            });
          }

          // Grab image links and store them into "imgs" variable
          const imgs = await get_imgs(url);
          // Initiate function to download image links in "imgs"
          download_imgs(imgs);
          // Remove srcset from all <img> tags
          html = html.replace(/(?<=\<img.*?srcset=")(.*?)(?=")/gs, "");
          // replace the src attribute of <img> tags to a the downloaded
          // image directory
          replaceHTML(
            /(?<=\<img.*?src=")(.*?)(?=")/gs,
            imgsMap,
            imgfolderName
          );

          // Initiate function to get CSS links
          getCSSLinks(html);

          // For every CSS link gets its CSS and append to HTML if any
          if (cssLinks.length > 0) {
            try {
              await getCSS();

              //replaceCSS();

              replaceHTML(
                /(?<=\<link.*?href=("|'))(.*?)(?=("|'))/gs,
                cssMap,
                "CSS"
              );

              zip.file(htmlfolderName+"/"+url.substr(url.lastIndexOf("/") + 1) + ".html", html);
              resolve(html);
            } catch (err) {
              console.log(err);
            }
          } else {
            // console.log("return html");
            // console.log(html);
            zip.file(htmlfolderName+"/"+url.substr(url.lastIndexOf("/") + 1) + ".html", html);
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
    let index = depth
    urlMap.set(url, false);
    while (depth >= 0) {
      const temp = new Map(urlMap);
      // console.log(temp);
      for (const [key, value] of temp) {
        if (value == false) {
          console.log("VALUE IS FALSE");
          let img_folder_name = "image_folder_"+(index-depth)
          let html_folder_name = "html_folder_"+(index-depth)
          zip.folder(img_folder_name)
          zip.folder(html_folder_name)
          await get_html(key, depth, img_folder_name,html_folder_name);
        }
      }
      depth = depth - 1;
    }
  };

  async function getContent() {
    try {
      let depth = document.getElementById("depth_area").value;
      const res = await load();
      console.log("res");
      console.log(res);
      //let folder_name = "images_folder";
      //zip.folder(folder_name);
      for (const each of res) {
        await crawler(each, depth);
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
