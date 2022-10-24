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

// Allows the extension to read the tabs that are open
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  // Retrieves the current tab URL
  let url = tabs[0].url;

  // Execute after submitting form (clicking the save button)
  urlform.addEventListener("submit", (event) => {
    // Store url recieved from the form
    // let url = urlform.url.value;

    let html = null;
    let hostname = url.match(/(?<=(http|https):\/\/)(\S+?)(?=\/)/)[0];
    let css = [];
    let cssLinks = [];
    let imgLinks = [];
    let base64_array = [];

    // Function to download the html retrieved from jquery
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

    // Asynchronous function to get data from a URL
    let getData = async (url) => {
      console.log("getData:", "Getting data from URL");
      return $.get(url);
    };

    // Function to grab the <link> tags with the attribute = stylesheet from
    // html and push them into cssLinks array
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

        //console.log("getCSSLinks:", "Pushing");
        cssLinks.push(element.toString());
      });
    };

    // Asynchronous function to retrieve CSS from links in the cssLinks array
    let getCSS = async (html) => {
      for (let index = 0; index < cssLinks.length; index++) {
        try {
          // Waits for the function to fulfil promise then set data to cssText
          let cssText = await getData(cssLinks[index]);

          // Wrap data into <sytle> tags to append to html
          cssElement = "<style>" + cssText + "</style> ";

          //console.log("getCSS (try):", "Assigning");
          css[index] = cssElement;
        } catch (err) {
          console.log(err);
          css[index] = "";
        }
      }
    };

    // Function to replace components within HTML with CSS retrieved
    let replaceCSS = () => {
      cssLinks.forEach((cssLink, index) => {
        //Replace previous <link> tag with new css <style> tag
        //console.log("replaceCSS:", "Replacing");
        html = html.replace(
          /(\<link) ?(\S*) ?(\S*) ?(rel\="stylesheet") ?(\S*) ?(\S*)>/,
          css[index]
        );
      });
    };

    // Function to retrieve img elements within HTML and extract src links
    let getImgLinks = () => {
      // Parse html to retrieve images
      const PARSEDHTML = $.parseHTML(html);
      let imgElements = $(PARSEDHTML).find("img");

      // Extract src for each image found and push into an array
      imgElements.each((_, img) => {
        let src = $(img).attr("src").toString();

        if (src.search("https") == -1) {
          src = "https:" + src;
        }

        imgLinks.push(src);
      });
    };

    // Function to convert images to Base 64
    let converToBase64 = async () => {
      for (let i = 0; i < imgLinks.length - 2; i++) {
        // Wait to get image
        let img = await fetch(imgLinks[i]);

        // Wait until image is converted into a blob
        let imgBlob = await img.blob();

        const reader = new FileReader();
        reader.onloadend = function () {
          base64_array.push(reader.result);
        };
        reader.readAsDataURL(new Blob([imgBlob], { type: imgBlob.type }));
      }
    };

    // Function to replace <img> src attributes with Base 64
    let replaceImgs = () => {
      //reg ex: get src and srcset
      const reg1 = /(?<=img.*?src=)(".*?")/gm;
      // const reg2 = /(?<=img.*?srcset=)(".*?[jpg|png|JPG] 2x")/gm;
      // //replace
      // const length_reg1 = html.match(reg1).length; //20
      // const length_reg2 = html.match(reg2).length; //20: including /static/images

      const imgElements = html.match(reg1);

      base64_array.forEach((each, index) => {
        console.log("For Each:", "Replacing image");
        html = html.replace(imgElements[index], '"' + each + '"');
      });
    };

    let urlMap = new Map();
    urlMap.set(url, false);

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
    ];

    let linker = async (url) => {
      urlMap.set(url, true);

      try {
        let data = await getData(url);
        PARSEDTEST = $.parseHTML(data);
        let testAElements = $(PARSEDTEST).find("a[href]");

        // console.log(url, testAElements);

        testAElements.each(function (index) {
          let URL = this;
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
            if (
              checks < 1 &&
              URL.toString().search("https://" + hostname) >= 0
            ) {
              urlMap.set(URL, false);
              // index++
            }
          }
        });
      } catch (error) {
        console.log(error);
      }
    };

    let recursion = async (url, depth) => {
      while (depth >= 0) {
        
        const temp = new Map(urlMap)

        for (const [key, value] of temp) {
          // console.log(temp.size, count);
          // if (count >= temp) {
          //   break;
          // }
          if (value == false) {
            await linker(key);
          }
          
        }
        depth = depth - 1
      }

      // if (depth <= 0) {
      //   await linker(url);
      //   // console.log("Depth " + depth + ":", URLARRAY);
      // } else {
      //   await linker(url);

      //   // console.log("Depth " + depth + ":", URLARRAY);
      //   const temp = new Map(urlMap)
      //   let count = 0;
      //   for (const [key, value] of temp) {
      //     console.log(temp.size, count);
      //     // if (count >= temp) {
      //     //   break;
      //     // }
      //     if (urlMap.get(key) == false) {
      //       await recursion(key, depth - 1);
      //     }
      //     count++;
      //   }
      // }
    };

    // Main Asynchronous function that initiates the scraping process
    const scrape = async (url) => {
      try {
        // Wait for function to fulfill promise then set HTML data to
        // variable
        html = await getData(url);

        // $(function () {
        //   var progressbar = $("#progressbar-1");
        //   $("#progressbar-1").progressbar({
        //     value: 30,
        //     max: 300,
        //   });
        //   function progress() {
        //     var val = progressbar.progressbar("value") || 0;
        //     progressbar.progressbar("value", val + 1);
        //     if (val < 300) {
        //       setTimeout(progress, 1);
        //     }
        //   }
        //   setTimeout(progress, 1000);
        // });

        await recursion(url, 2);

        console.log([...urlMap.entries()]);

        // Initiate the retrivial of img src links
        getImgLinks();

        // Convert images to base 64
        await converToBase64();

        // replace the <img> src attributes with base 64
        replaceImgs();

        // Initiate function to get CSS links
        getCSSLinks(html);

        // For every CSS link gets its CSS and append to HTML if any
        if (cssLinks.length > 0) {
          try {
            await getCSS(html);
            replaceCSS();

            console.log("DOWNLOADING");
            // download(html);
          } catch (err) {
            console.log(err);
          }
        } else {
          //download(html);
        }
      } catch (err) {
        console.log(err);
      }
    };

    scrape(url);

    event.preventDefault();
  });
});
