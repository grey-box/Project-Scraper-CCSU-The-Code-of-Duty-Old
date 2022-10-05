chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		"id": "bliss-web-scraper",
		"title": "Greybox Web Scraper",
		"contexts": ["page", "link"]
	})
})

// const cors_rule = {
// 	id: 1,
// 	priority: 1,
// 	action: {
// 		type: "modifyHeaders",
// 		responseHeaders: [
// 			{ header: "Content-Security-Policy", operation: "remove" },
// 			{ header: "X-Requested-With", operation: "set", value: "" }
// 		]
// 	},
// 	condition: {
// 		resourceTypes: ["main_frame", "xmlhttprequest"]
// 	}
// }

// chrome.storage.onChanged.addListener((changes) => {
// 	if ('corsbypass' in changes) {
// 		if (!changes.corsbypass.newValue) {
// 			chrome.declarativeNetRequest.updateDynamicRules({ addRules: [cors_rule] })
// 		} else {
// 			chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] })
// 		}
// 	}
// })
