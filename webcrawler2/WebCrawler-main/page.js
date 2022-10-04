function addImagesToContainer(urls) {
    const container = document.querySelector(".container");
    urls.forEach(url => addImageNode(container, url))
}

chrome.runtime.onMessage
    .addListener((message,sender,sendResponse) => {
        addImagesToContainer(message)
        sendResponse("OK");
    });


function addImageNode(container, url) {
    const div = document.createElement("div");
    div.className = "imageDiv";
    const img = document.createElement("img");
    img.src = url;
    div.appendChild(img);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("url",url);
    div.appendChild(checkbox);
    container.appendChild(div)
}

