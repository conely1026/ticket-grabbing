"use strict";

var DEFAULT_TIMESTAMP_URL = "https://mtop.damai.cn/gw/mtop.common.getTimestamp/";

function ensureArray(value) {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}

function buildQuery(selector) {
    if (!selector) {
        return null;
    }
    if (selector.queryFactory) {
        return selector.queryFactory();
    }

    var query = null;
    if (selector.id) {
        query = id(selector.id);
    }
    if (selector.className) {
        query = className(selector.className);
    }
    if (selector.classNameStartsWith) {
        query = classNameStartsWith(selector.classNameStartsWith);
    }

    if (!query) {
        if (selector.text != null) {
            return text(selector.text);
        }
        if (selector.textContains != null) {
            return textContains(selector.textContains);
        }
        if (selector.textMatches != null) {
            return textMatches(selector.textMatches);
        }
        if (selector.desc != null) {
            return desc(selector.desc);
        }
        if (selector.descContains != null) {
            return descContains(selector.descContains);
        }
        return null;
    }

    if (selector.text != null) {
        query = query.text(selector.text);
    }
    if (selector.textContains != null) {
        query = query.textContains(selector.textContains);
    }
    if (selector.textMatches != null) {
        query = query.textMatches(selector.textMatches);
    }
    if (selector.desc != null) {
        query = query.desc(selector.desc);
    }
    if (selector.descContains != null) {
        query = query.descContains(selector.descContains);
    }
    return query;
}

function selectorExists(selector) {
    if (!selector) {
        return false;
    }
    if (selector.existsFn) {
        return !!selector.existsFn();
    }
    var query = buildQuery(selector);
    return query ? query.exists() : false;
}

function selectorFindOne(selector, timeoutMs) {
    if (!selector) {
        return null;
    }
    if (selector.findOneFn) {
        return selector.findOneFn(timeoutMs);
    }
    var query = buildQuery(selector);
    if (!query) {
        return null;
    }
    return query.findOne(timeoutMs == null ? 2000 : timeoutMs);
}

function clickSelector(selector, timeoutMs) {
    if (!selector) {
        return false;
    }
    if (selector.clickFn) {
        return !!selector.clickFn(timeoutMs);
    }
    var node = selectorFindOne(selector, timeoutMs);
    return node ? !!node.click() : false;
}

function existsAny(selectors) {
    selectors = ensureArray(selectors);
    for (var i = 0; i < selectors.length; i++) {
        if (selectorExists(selectors[i])) {
            return true;
        }
    }
    return false;
}

function clickAnyAvailable(selectors, timeoutMs) {
    selectors = ensureArray(selectors);
    for (var i = 0; i < selectors.length; i++) {
        if (selectorExists(selectors[i]) && clickSelector(selectors[i], timeoutMs)) {
            return selectors[i];
        }
    }
    return null;
}

function waitForAndClickAny(selectors, options) {
    options = options || {};
    var intervalMs = options.intervalMs == null ? 20 : options.intervalMs;
    var logEvery = options.logEvery == null ? 0 : options.logEvery;
    var label = options.label || "waiting";
    for (var count = 0; ; count++) {
        var clicked = clickAnyAvailable(selectors, options.findTimeoutMs);
        if (clicked) {
            return clicked;
        }
        if (logEvery > 0 && count > 0 && count % logEvery === 0) {
            console.log(label + " retry: " + count);
        }
        if (intervalMs > 0) {
            sleep(intervalMs);
        }
    }
}

function clickUntilAny(actionFn, untilSelectors, options) {
    options = options || {};
    var intervalMs = options.intervalMs == null ? 20 : options.intervalMs;
    var logEvery = options.logEvery == null ? 20 : options.logEvery;
    var label = options.label || "loop";
    var maxAttempts = options.maxAttempts == null ? -1 : options.maxAttempts;

    for (var count = 0; maxAttempts < 0 || count <= maxAttempts; count++) {
        if (existsAny(untilSelectors)) {
            return true;
        }
        actionFn(count);
        if (logEvery > 0 && count > 0 && count % logEvery === 0) {
            console.log(label + " attempts: " + count);
        }
        if (intervalMs > 0) {
            sleep(intervalMs);
        }
    }
    return existsAny(untilSelectors);
}

function clickWhileAnyExists(selectors, options) {
    options = options || {};
    var intervalMs = options.intervalMs == null ? 50 : options.intervalMs;
    var logEvery = options.logEvery == null ? 20 : options.logEvery;
    var label = options.label || "click";

    for (var count = 0; existsAny(selectors); count++) {
        clickAnyAvailable(selectors, options.findTimeoutMs);
        if (logEvery > 0 && count > 0 && count % logEvery === 0) {
            console.log(label + " count: " + count);
        }
        if (intervalMs > 0) {
            sleep(intervalMs);
        }
    }
}

function clickPoint(point) {
    if (!point) {
        return false;
    }
    return !!click(point.x, point.y);
}

function promptRequired(promptText, defaultValue, emptyMessage) {
    var value = rawInput(promptText, defaultValue);
    if (value == null || String(value).trim() === "") {
        alert(emptyMessage || "请输入内容");
        return promptRequired(promptText, defaultValue, emptyMessage);
    }
    return String(value).trim();
}

function parseSellTime(input, advanceMs) {
    var match = /^(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/.exec(String(input).trim());
    if (!match) {
        throw new Error("invalid sell time: " + input);
    }
    var year = new Date().getFullYear();
    var timestamp = new Date(
        year,
        Number(match[1]) - 1,
        Number(match[2]),
        Number(match[3]),
        Number(match[4]),
        0,
        0
    ).getTime();
    return timestamp - (advanceMs || 0);
}

function fetchRemoteTimestamp(url) {
    var response = http.get(url || DEFAULT_TIMESTAMP_URL, {
        headers: {
            "Host": "mtop.damai.cn",
            "Content-Type": "application/json;charset=utf-8",
            "Accept": "*/*",
            "User-Agent": "floattime/1.1.1 (iPhone; iOS 15.6; Scale/3.00)",
            "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        }
    });
    return Number(JSON.parse(response.body.string()).data.t);
}

function formatTimestamp(timestamp) {
    var date = new Date(Number(timestamp));
    var year = date.getUTCFullYear();
    var month = String(date.getUTCMonth() + 1).padStart(2, "0");
    var day = String(date.getUTCDate()).padStart(2, "0");
    var hours = String(date.getUTCHours() + 8).padStart(2, "0");
    var minutes = String(date.getUTCMinutes()).padStart(2, "0");
    var seconds = String(date.getUTCSeconds()).padStart(2, "0");
    var milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function waitForSaleTime(defaultSellTime, options) {
    options = options || {};
    var input = promptRequired(
        options.promptText || "请输入开抢时间(格式 MM-DD HH:mm)",
        defaultSellTime,
        options.emptyMessage || "请输入开抢时间"
    );
    var startTimestamp = parseSellTime(input, options.advanceMs == null ? 45 : options.advanceMs);
    console.log("开抢时间: " + formatTimestamp(startTimestamp));
    console.log("等待开抢...");

    for (;;) {
        var now = fetchRemoteTimestamp(options.timestampUrl);
        if (now >= startTimestamp) {
            return {
                sellTimeInput: input,
                startTimestamp: startTimestamp,
                realStartTimestamp: now
            };
        }

        var remain = startTimestamp - now;
        if (remain > 3000) {
            sleep(500);
        } else if (remain > 1000) {
            sleep(50);
        } else if (remain > 100) {
            sleep(5);
        }
    }
}

function initScript(options) {
    options = options || {};
    auto.waitFor();
    if (options.appName) {
        app.launchApp(options.appName);
    }
    if (options.consoleTitle) {
        openConsole();
        console.setTitle(options.consoleTitle, options.consoleColor || "#ff11ee00", options.consoleTextSize || 30);
    }
}

function startRefreshThread(refreshSelectors, options) {
    options = options || {};
    return threads.start(function () {
        console.log(options.label || "refresh thread started");
        for (;;) {
            waitForAndClickAny(refreshSelectors, {
                intervalMs: options.intervalMs == null ? 100 : options.intervalMs,
                label: options.waitLabel || "refresh wait",
                logEvery: options.logEvery == null ? 0 : options.logEvery
            });
            console.log(options.clickLog || "click refresh");
            sleep(options.afterClickSleepMs == null ? 100 : options.afterClickSleepMs);
        }
    });
}

module.exports = {
    buildQuery: buildQuery,
    clickAnyAvailable: clickAnyAvailable,
    clickPoint: clickPoint,
    clickSelector: clickSelector,
    clickUntilAny: clickUntilAny,
    clickWhileAnyExists: clickWhileAnyExists,
    ensureArray: ensureArray,
    existsAny: existsAny,
    fetchRemoteTimestamp: fetchRemoteTimestamp,
    formatTimestamp: formatTimestamp,
    initScript: initScript,
    parseSellTime: parseSellTime,
    promptRequired: promptRequired,
    selectorExists: selectorExists,
    selectorFindOne: selectorFindOne,
    startRefreshThread: startRefreshThread,
    waitForAndClickAny: waitForAndClickAny,
    waitForSaleTime: waitForSaleTime
};
