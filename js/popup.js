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
    // html = response

    html = response.replace(/<div id="siteSub" class="noprint">[\s|\S]*?<\/div>/, " ");

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
  });

  event.preventDefault();
});
