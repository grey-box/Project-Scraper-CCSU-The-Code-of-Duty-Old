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

              if (css.length == cssLinks.length) {
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
