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

var slider = document.getElementById("depth_area");
var output = document.getElementById("value");
var cssMerge = $("#cssMerge");
var imgMerge = $("#imgMerge");
var cssOmit = $("#cssOmit");
var imgOmit = $("#imgOmit");
var vidOmit = $("#vidOmit");
var domainOnly = $("#imgMerge");
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
  let PARSEDHTML = null;
  let urlMap = new Map();
  let imgsMap = new Map();
  let cssMap = new Map();
  let cssCount = 1;
  let imgCount = 1;

  let hostname = null;

  let urls_file_content = [];
  //read from input file
  // console.log("read file");

  function download(html) {
    // Convert html into objectURL to use chrome.downloads
    let blob = new Blob([html], { type: "text/html" });
    objURL = URL.createObjectURL(blob);

    // Download the url object
    chrome.downloads.download({
      url: objURL,
      saveAs: true,
    });
  }

  function load() {
    return new Promise((resolve, reject) => {
      let selected = document.getElementById("file").files[0];
      if (selected != null) {
        // console.log(selected);
        let reader = new FileReader();
        reader.addEventListener("loadend", () => {
          urls_file_content = reader.result.split(/\r\n|\n/);
          resolve(urls_file_content);
          // console.log("in promise");
          // console.log(urls_file_content);
        });
        reader.readAsText(selected);
      } else if (document.getElementById("text_area").value != null) {
        let text_lines = document.getElementById("text_area").value.split("\n");
        // console.log(text_lines);
        resolve(text_lines);
      }
    });
  }

  let getData = (url) => {
    // console.log("getData:", "Getting data from URL");
    return $.get(url);
  };

  function urlToPromise(url) {
    return new Promise(function (resolve, reject) {
      JSZipUtils.getBinaryContent(url, function (err, data) {
        // console.log("JSZIPPER");
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  function escapeRegExp(s) {
    return s.replace(/[-/&\/\\^$*+?.()|[\]{}]/g, "\\$&");
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
      let imgLinks = [];

      const get_imgs = async (url) => {
        const imgElements = $(PARSEDHTML).find("img");
        imgElements.each(function () {
          let src = $(this).attr("src");

          let element = validURL(src);

          imgLinks.push(src);
          if (!imgsMap.has(src)) {
            let img_name = decodeURIComponent(
              src.substr(src.lastIndexOf("/") + 1)
            );
            img_name = img_name.replace(/[-/&\\^$*+?()"'|[\]{}]/gs, "");
            imgsMap.set(src, img_name);
            // imgCount++
          }
        });
      };

      let base64_array = [];
      let download_imgs = async () => {
        // const checker = $("#imgMerge").is(":checked");

        for (let i = 0; i < imgLinks.length; i++) {
          let img_name = imgsMap.get(imgLinks[i]);
          let imgURL = validURL(imgLinks[i]);
          let regexer = new RegExp(escapeRegExp(imgLinks[i]), "gs");

          if (imgMerge.is(":checked")) {
            const toBase64 = (url) =>
              fetch(imgURL)
                .then((res) => res.blob())
                .then(
                  (blob) =>
                    new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result);
                      reader.onerror = reject;
                      reader.readAsDataURL(
                        new Blob([blob], { type: blob.type })
                      );
                    })
                );
            await toBase64(imgURL).then((base64) => {
              console.log(base64);
              html = html.replace(regexer, base64);
              //base64_array.push(reader.result);
            });
            // let test = await img.blob();

            // const reader = new FileReader();
            // reader.readAsDataURL(new Blob([test], { type: test.type }));
            // reader.onloadend = function () {};
          } else {
            zip.file(imgfolderName + "/" + img_name, urlToPromise(imgURL), {
              binary: true,
            });

            console.log("REPLACING");
            html = html.replace(
              regexer,
              "../../" + imgfolderName + "/" + img_name
            );
          }
        }

        // imgLinks.forEach(async (each) => {});
      };

      let getCSSLinks = (html) => {
        const linkElements = $(PARSEDHTML).filter("link[rel=stylesheet]");
        linkElements.each(function () {
          let href = $(this).attr("href");
          href = href.replace(/&/gs, "&amp;");

          cssLinks.push(href);

          if (!cssMap.has(href)) {
            let css_name = "css" + cssCount + ".css";
            cssMap.set(href, css_name);
            cssCount++;
          }
        });
      };

      let getCSS = async () => {
        if (cssMerge.is(":checked")) {
          for (let index = 0; index < cssLinks.length; index++) {
            try {
              // Waits for the function to fulfil promise then set data to cssText
              let cssText = await getData(validURL(cssLinks[index]));
              // Wrap data into <sytle> tags to append to html
              cssElement = "<style>" + cssText + "</style> ";
              // css[index] = cssElement;
              html = html.replace(/<link.*?rel="stylesheet".*?>/, cssElement);
            } catch (err) {
              console.log(err);
              // css[index] = "";
            }
          }
        } else {
          cssLinks.forEach(async (each) => {
            const cssURL = validURL(each);
            const css_name = cssMap.get(each);

            zip.file("CSS/" + css_name, urlToPromise(cssURL), {
              binary: true,
            });
            let regexer = new RegExp(escapeRegExp(each), "gs");
            html = html.replace(regexer, "../../CSS/" + css_name);
          });
        }
      };

      let replaceCSS = () => {
        console.log(css);
        cssLinks.forEach((cssLink, index) => {
          //Replace previous <link> tag with new css <style> tag
          // console.log("replaceCSS:", "Replacing");
          html = html.replace(/<link.*?rel="stylesheet".*?>/, css[index]);
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

          if (
            domainOnly.is(":checked") &&
            checks < 1 &&
            url.search("https://" + hostname) >= 0
          ) {
            urlMap.set(url, false);
          }
        }
      };

      const scrape = async (url) => {
        try {
          // Wait for function to fulfill promise then set HTML data to
          // variable
          html = await getData(url);
          PARSEDHTML = $.parseHTML(html);

          // This allows the scraper to continue to gather links on the page
          // if depth is greater than 0
          if (depth > 0) {
            let aElements = $(PARSEDHTML).find("a[href]");
            aElements.each(function () {
              urlCheck(this);
            });
          }

          if (!imgOmit.is(":checked")) {
            // Grab image links and store them into "imgs" variable
            const imgs = await get_imgs(url);
            // Initiate function to download image links in "imgs"
            await download_imgs(imgs);
            // Remove srcset from all <img> tags
            html = html.replace(/(?<=\<img.*?srcset=")(.*?)(?=")/gs, "");
          }

          // Initiate function to get CSS links
          if (!cssOmit.is(":checked")) {
            getCSSLinks(html);
          }

          let html_name = $(PARSEDHTML).filter("title").text();
          // For every CSS link gets its CSS and append to HTML if any
          if (cssLinks.length > 0) {
            try {
              await getCSS();

              zip.file(htmlfolderName + "/" + html_name + ".html", html);
              resolve(html);
            } catch (err) {
              console.log(err);
            }
          } else {
            zip.file(htmlfolderName + "/" + html_name + ".html", html);
            resolve(html);
          }
        } catch (err) {
          console.log(err);
        }
      };

      await scrape(url);
    });
  }

  let crawler = async (url, depth, i) => {
    let depth_index = depth;
    let url_folder_name = "url_folder_" + i;
    //let url_image_folder = url_folder_name + "/"+"image_folder"
    //let url_html_folder = url_folder_name + "/"+"html_folder"
    zip.folder(url_folder_name);
    //zip.folder(url_image_folder)
    //zip.folder(url_html_folder)
    urlMap.set(url, false);
    while (depth >= 0) {
      const temp = new Map(urlMap);

      // console.log(temp);
      for (const [key, value] of temp) {
        if (value == false) {
          console.log("VALUE IS FALSE");
          //let depth_folder_name = "depth_folder_"+(depth_index-depth)
          let img_folder_name = "image_folder";
          let html_folder_name = "html_folder";
          let imgFolderPath = url_folder_name + "/" + img_folder_name;
          //url0/image/
          let htmlFolderPath = url_folder_name + "/" + html_folder_name;
          zip.folder(imgFolderPath);
          zip.folder(htmlFolderPath);
          await get_html(key, depth, imgFolderPath, htmlFolderPath);
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
        const i = res.indexOf(each);
        await crawler(each, depth, i);
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
