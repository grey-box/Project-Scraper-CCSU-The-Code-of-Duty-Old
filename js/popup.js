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

    // Function to download the html retrieved from jquery
    function download() {
      // Convert html into objectURL to use chrome.downloads
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
