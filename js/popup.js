// const context = require("node/ts4.8/util");

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

    chrome.scripting.executeScript(
        {
          target:{tabId: tabs[0].id, allFrames: true},
          func:grabImages
        },
        onResult
    )

    function grabImages() {
      const images = document.querySelectorAll("img");
      return Array.from(images).map(image=>image.src);
    }

    function onResult(frames) {
      // If script execution failed on remote end
      // and could not return results
      if (!frames || !frames.length) {
        alert("Could not retrieve images from specified page");
        return;
      }
      // Combine arrays of image URLs from
      // each frame to a single array
      const imageUrls = frames.map(frame => frame.result)
          .reduce((r1, r2) => r1.concat(r2));
      const base64 = convert_to_base64(imageUrls)
      // console.log(base64) //Array(19)
      openImages(base64)
      // insert_base64(base64)
    }

    function insert_base64(urls){

    }

    function openImages(urls) {
      // TODO:
      // * Open a new tab with a HTML page to display an UI

      chrome.tabs.create(
          {"url": "../page.html",selected:false},(tab) => {
            // * Send `urls` array to this page
            setTimeout(()=>{
              chrome.tabs.sendMessage(tab.id,urls,(response) => {
                chrome.tabs.update(tab.id,{active: true});
              });
            },100);
          }
      );
    }

    function convert_to_base64(urls){
      let base64_url= new Array(urls.length);
      for(let i = 0; i<urls.length;i++){
        fetch(urls[i])
            .then((res) => res.blob())
            .then((blob) => {
              // Read the Blob as DataURL using the FileReader API
              const reader = new FileReader();
              reader.onloadend = () => {
                base64_url[i] = reader.result
              };
              reader.readAsDataURL(blob);//return none
            });
      }
      return base64_url
    }

    function download() {
      let blob = new Blob([html], { type: "text/html" });
      objURL = URL.createObjectURL(blob);

      // Download the url object
      chrome.downloads.download({
        url: objURL,
        saveAs: true,
      });
    }

    // JQuery used to grab HTML from the url => response
    $.get(url, function (response) {
      // RegEx to grab the hostname of the URL
      let hostname = url.match(/(?<=(http|https):\/\/)(\S+?)(?=\/)/)[0];
      let css = [];
      let cssLinks = [];
      html = response;

      // Using JQuery to make an array of link tags with rel = stylesheet
      linkElements = $(html).filter("link[rel=stylesheet]");
      linkElements.each(function () {
        //console.log($(this).prop("outerHTML"));

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
        cssLinks.push(element.toString());
      });

      // For every CSS address gets its CSS and append to HTML if any
      if (cssLinks.length > 0) {
        cssLinks.forEach(function (cssLink, i) {
          // Clean up CSS link address
          //cssLink = link.replace(/amp; *?/g, "");

          $.get({
            url: cssLink,
            dataType: "text",
            error: function () {
              // If the link to retrieve CSS returns error then assign nothing
              // to its index value in css array
              css[i] = "";
            },
            success: function (cssText) {
              // Create css element for <head> tag and push into array
              cssElement = "<style>" + cssText + "</style> ";
              css[i] = cssElement;

              if (css.length == cssLinks.length) {
                linkElements.each(function (index) {
                  //Replace previous <link> tag with new css <style> tag
                  html = html.replace(
                    /(\<link) ?(\S*) ?(\S*) ?(rel\="stylesheet") ?(\S*) ?(\S*)>/,
                    css[index]
                  );
                });
                download();
              }
            },
          });
        });
      } else {
        download();
      }
    });
    event.preventDefault();
  });
});
