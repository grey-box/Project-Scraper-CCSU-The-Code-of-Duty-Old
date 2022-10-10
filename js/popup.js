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

    // Asynchronous function to retrieve CSS from links in the cssLinks array
    let getCSS = async (html) => {
      for (let index = 0; index < cssLinks.length; index++) {
        try {
          // Waits for the function to fulfil promise then set data to cssText
          let cssText = await getData(cssLinks[index]);

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
    let replaceCSS = (html) => {
      cssLinks.forEach((cssLink, index) => {
        //Replace previous <link> tag with new css <style> tag
        console.log("replaceCSS:", "Replacing");
        html = html.replace(
          /(\<link) ?(\S*) ?(\S*) ?(rel\="stylesheet") ?(\S*) ?(\S*)>/,
          css[index]
        );
      });
    };

    // Main Asynchronous function that initiates the scraping process
    const scrape = async (url) => {
      try {
        // Wait for function to fulfill promise then set HTML data to
        // variable
        html = await getData(url);

        // Initiate function to get CSS links
        getCSSLinks(html);

        // For every CSS link gets its CSS and append to HTML if any
        if (cssLinks.length > 0) {
          try {
            await getCSS(html);

            replaceCSS(html);

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
