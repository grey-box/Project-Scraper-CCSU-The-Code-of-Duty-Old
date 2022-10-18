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
    let imgLinks = []; //length:20
    let base64_array = []; //18

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

        console.log("getCSSLinks:", "Pushing");
        cssLinks.push(element.toString());
      });
    };

      // Find all hyperlink
      var links = html.querySelectorAll("a");
      // create an empty array
      var urls = []
      for (var i=0; i<links.length; i++){
      // given name to different item
      var nametext = links[i].textContent;
      var cleantext = nametext.replace(/\s+/g, ' ').trim();
      var cleanlink = links[i].href;
      // put name and link to the array
      urls.push([cleantext,cleanlink]);
      };
      // print the name and link to the console
      console.log(urls);
    

    // Asynchronous function to retrieve CSS from links in the cssLinks array
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

    // Function to replace components within HTML with CSS retrieved
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

    let converToBase64 = async () => {
      for (let i = 0; i < imgLinks.length - 2; i++) {
        let img = await fetch(imgLinks[i]);

        console.log(img);

        let test = await img.blob();

        console.log(test);

        const reader = new FileReader();
        reader.onloadend = function () {
          base64_array.push(reader.result);
        };
        reader.readAsDataURL(new Blob([test], { type: test.type }));
      }
    };

    // Main Asynchronous function that initiates the scraping process
    const scrape = async (url) => {
      try {
        // Wait for function to fulfill promise then set HTML data to
        // variable
        html = await getData(url);

        console.log("parsing HTML");
        testParse = $.parseHTML(html);
        let testImageElements = $(testParse).find("img");

        console.log(testImageElements);

        testImageElements.each(function () {
          let src = $(this).attr("src");
          let srcset = $(this).attr("srcset");

          //console.log(src)

          if (src.toString().search("https") == -1) {
            console.log(src.toString().search("https"));
            console.log(src);
            src = "https:" + src;
            console.log(src);
          }

          imgLinks.push(src);
        });

        //reg ex: get src and srcset
        const reg1 = /(?<=img.*?src=)(".*?[jpg|png]")/gm;
        const reg2 = /(?<=img.*?srcset=)(".*?[jpg|png|JPG] 2x")/gm;
        //replace
        const length_reg1 = html.match(reg1).length; //20
        const length_reg2 = html.match(reg2).length; //20: including /static/images

        console.log(imgLinks);

        await converToBase64();

        console.log(base64_array);

        base64_array.forEach((each, index) => {
          console.log("For Each:", "Replacing image");
          html = html.replace(html.match(reg1)[index], '"' + each + '"');
        });

        // Initiate function to get CSS links
        getCSSLinks(html);

        // For every CSS link gets its CSS and append to HTML if any
        if (cssLinks.length > 0) {
          try {
            await getCSS(html);

            replaceCSS();

            console.log("DOWNLOADING");
            download(html);
          } catch (err) {
            console.log(err);
          }
        } else {
          download(html);
        }
      } catch (err) {
        console.log(err);
      }
    };

    scrape(url);

    event.preventDefault();
  });
});
