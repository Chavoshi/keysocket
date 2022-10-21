/*
 * Copyright 2015 Boris Smus. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var registeredTabs = [];
var registerTab = function (tabId) {
    if (registeredTabs.indexOf(tabId) == -1) {
        registeredTabs.push(tabId);

        chrome.action.setIcon({
            tabId: tabId,
            path: {
                '19': 'icons/icon19.png',
                '38': 'icons/icon38.png'
            }
        });
        chrome.action.setTitle({
            tabId: tabId,
            title: 'Click to disable media keys for this tab'
        });

        updateContextMenu(tabId);
    }
};

var unregisterTab = function (tabId) {
    var index = registeredTabs.indexOf(tabId);
    if (index > -1) {
        registeredTabs.splice(index, 1);

		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				if (tabs[i].id === tabId) {
					chrome.action.setIcon({
						tabId: tabId,
						path: {
							'19': 'icons/icon19-inactive.png',
							'38': 'icons/icon38-inactive.png'
						}
					});
					chrome.action.setTitle({
						tabId: tabId,
						title: 'Click to enable media keys for this tab'
					});
				}
			}
		});
		
		updateContextMenu(tabId);
    }
};

var updateContextMenu = function(tabId){
    chrome.tabs.query({}, function(tabs){
		for (var i = 0; i < tabs.length; i++) {
			tab = tabs[i];
			if(tab.id == tabId) {
				var index = registeredTabs.indexOf(tabId);
				if (index > -1) {
					chrome.contextMenus.update("keySocketMediaKeys-disableThisTab", {enabled: true});
					chrome.contextMenus.update("keySocketMediaKeys-enableThisTab", {enabled: false});
				}
				else {
					chrome.contextMenus.update("keySocketMediaKeys-disableThisTab", {enabled: false});
					chrome.contextMenus.update("keySocketMediaKeys-enableThisTab", {enabled: true});
				}
			}
		}
        
    });
};

chrome.commands.onCommand.addListener(function (command) {
    console.log('Command:', command);

    for (var i = 0; i < registeredTabs.length; i++) {
        chrome.tabs.sendMessage(registeredTabs[i], {command: command});
    }
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log('Received tab message: ', request);

        if (request.command == 'registerTab' && sender.tab) {
            registerTab(sender.tab.id);
        } else if (request.command == 'unregisterTab' && sender.tab) {
            unregisterTab(sender.tab.id);
        }
    }
);

chrome.tabs.onRemoved.addListener(unregisterTab);

chrome.action.onClicked.addListener(function (tab) {
    var index = registeredTabs.indexOf(tab.id);
    if (index < 0) {
        registerTab(tab.id);
    } else {
        unregisterTab(tab.id);
    }
});

chrome.tabs.onActivated.addListener(function (evt) {
    updateContextMenu(evt.tabId);
});

chrome.contextMenus.create({id: "keySocketMediaKeys-group", title: "Key Socket Media Keys"});

chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-disableThisTab",
    title: "Disable this tab"
});
chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-enableThisTab",
    title: "Enable this tab"
});

chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-separator1",
    type: "separator"
});

chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-disableAllTabs",
    title: "Disable all tabs"
});
chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-enableAllTabs",
    title: "Enable all tabs"
});

chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-separator2",
    type: "separator"
});

chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-disableAllBut",
    title: "Disable all but this tab"
});

chrome.contextMenus.create({
    parentId: "keySocketMediaKeys-group",
    id: "keySocketMediaKeys-enableAllBut",
    title: "Enable all but this tab"
});

var disableAllTabs = function ()
{
	chrome.tabs.query({}, function (tabs) {
		for (var i = 0; i < tabs.length; i++) {
			unregisterTab(tabs[i].id);
		}
	});
};

var enableAllTabs = function ()
{
	chrome.tabs.query({}, function (tabs) {
		for (var i = 0; i < tabs.length; i++) {
			registerTab(tabs[i].id);
		}
	});
};

var disableAllBut = function (tabId)
{
	chrome.tabs.query({}, function (tabs) {
		for (var i = 0; i < tabs.length; i++) {
			if (tab.id !== tabs[i].id) {
				unregisterTab(tabs[i].id);
			}
		}
		
		registerTab(tabId);
	});
};

var enableAllBut = function (tabId)
{
	chrome.tabs.query({}, function (tabs) {
		unregisterTab(tabId);
		
		for (var i = 0; i < tabs.length; i++) {
			if (tab.id !== tabs[i].id) {
				registerTab(tabs[i].id);
			}
		}
	});
};

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if (info.menuItemId === "keySocketMediaKeys-disableThisTab") {
        unregisterTab(tab.id);
    }
	else if (info.menuItemId === "keySocketMediaKeys-enableThisTab") {
        registerTab(tab.id);
    }
	else if (info.menuItemId === "keySocketMediaKeys-disableAllTabs") {
        disableAllTabs();
    }
	else if (info.menuItemId === "keySocketMediaKeys-enableAllTabs") {
        enableAllTabs();
    }
	else if (info.menuItemId === "keySocketMediaKeys-disableAllBut") {
		disableAllBut(tab.id);
    }
	else if (info.menuItemId === "keySocketMediaKeys-enableAllBut") {
        enableAllBut(tab.id);
    }
});