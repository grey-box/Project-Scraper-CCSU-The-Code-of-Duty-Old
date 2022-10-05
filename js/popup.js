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

    // JQuery used to grab html from the url => response
    $.get(url, function (response) {
      // RegEx to grab the domain of the URL
      let domain = url.match(/(http|https):\/\/(\S+?)(?=\/)/)[0];
      let css = [];

      html = response;
      // RegEx to retrieve the link address from webpage for css into an array
      cssLinks = html.match(/(?<=\<link rel\="stylesheet" href\=")(\S*)(?=")/g);
      // For every CSS address gets its CSS for and append to URL's HTML if any
      if (cssLinks != null) {
        cssLinks.forEach((link) => {
          // Clean up CSS link address
          cssLink = link.replace(/amp; *?/g, "");

          $.get({
            url: domain + cssLink,
            dataType: "text",
            success: function (cssText) {
              // Create css element for <head></head> and push into array
              cssElement = "<style>" + cssText + "</style> ";
              css.push(cssElement);

              if (css.length === cssLinks.length) {
                css.forEach((element) => {
                  // Replace previous link element with new css element
                  html = html.replace(
                    /<link rel="stylesheet" href="[\s\S]*?">/,
                    element
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
