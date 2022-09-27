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

urlform.addEventListener("submit", (event) => {
  // Store url recieved from the form
  let url = urlform.url.value;

  // JQuery used to grab html from the url into response
  $.get(url, function (response) {

    // Retrieve the link address from webpage for css
    cssLink = response
      .match(/"\/w((?:\\.|[^"\\])*)"/)[0]
      .replace(/^"(.*)"$/, "$1")
      .replace(/amp; *?/g, "");

    // Use css link address to retrieve css as text
    $.ajax({
      url: "https://en.wikipedia.org" + cssLink,
      dataType: "text",
      success: function (cssText) {

        // Create css element for <head></head>
        cssElement = "<style>" + cssText + "</style>"
        
        // Replace previous link element with new css element
        html = response.replace(
          /<link rel="stylesheet" href="[\s|\S]*?">/,
          cssElement
        );
        
        // the response is converted into a blob to be converted into
        // an object url
        var blob = new Blob([html], { type: "text/html" });
        objURL = URL.createObjectURL(blob);

        // Download the url object
        chrome.downloads.download({
          url: objURL,
          filename: "file1.html",
          saveAs: true,
        });
        // console.log(cssText);
      },
    });
    // console.log("https://en.wikipedia.org" + cssLink)
  });

  event.preventDefault();
});
