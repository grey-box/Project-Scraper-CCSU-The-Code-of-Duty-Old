let urlform = document.getElementById("url-form");
let optform = document.getElementById("option-form");

let allImagesList = [];
let downloadId= [];

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
      let hostname=null;

      // Function to download the html retrieved from jquery
      async function download() {

        var find = '"//';
        var re = new RegExp(find, 'g');
        html = html.replaceAll(re, "https://");

        /*
        for(let row in allImagesList)
        {
          try {
            const src = allImagesList[row].name;
            const fetchResponse = await fetch(src);
            const blob = await fetchResponse.blob();
            await chrome.downloads.download({
              url: URL.createObjectURL(blob),
              conflictAction: 'uniquify',
              saveAs: false
            },
            (data) => {
              //downloadId.push(allImagesList[row].name);
              allImagesList[row].ID = data;
            });

          } catch (e) {
          }
        }

        for(let row in allImagesList)
        {
          await chrome.downloads.search({
              id: allImagesList[row].ID
            }, function (downloadedItem) {
              if(downloadedItem && downloadedItem.length == 1 )
              {
                if(downloadedItem[0].filename)
                {
                  allImagesList[row].path = downloadedItem[0].filename;


                  console.log(allImagesList[row].path ,allImagesList[row].name,allImagesList[row].Id);

                  let _obj = $(html).find("img[srcset*='"+ allImagesList[row].name +"']");

                  console.log(_obj[0]);
                 // $(_obj).attr("src",allImagesList[row].path);
                  if(_obj.length >= 1 )
                  {
                    $(_obj[0]).attr("srcset",allImagesList[row].path);
                    $(_obj[0]).attr("src",allImagesList[row].path);
                  }

                }
                //console.log(downloadedItem);
                //console.log(downloadedItem[0].filename);
                //downloadedItem[0].filename
              }
            });
        }

        console.log(allImagesList);
      
        */


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
        hostname = url.match(/(?<=(http|https):\/\/)(\S+?)(?=\/)/)[0];

        let css = [];
        let cssLinks = [];
        html = response;


        imagesElements = $(html).find("img");
        imagesElements.each(function(){
        
       
           let name = $(this).attr("src");

          let find = '//';
          let re = new RegExp(find, 'g');
          name = name.replaceAll(re, "https://");

           // console.log(name);
          if(name && name.length >= 3 )
          {
            allImagesList.push({name:name});
          }

        });



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
        //  download();
        }
      });

      event.preventDefault();
    });
  
});
