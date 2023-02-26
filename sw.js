/**
 * 自动引入模板，在原有 sw-precache 插件默认模板基础上做的二次开发
 *
 * 因为是自定导入的模板，项目一旦生成，不支持随 sw-precache 的版本自动升级。
 * 可以到 Lavas 官网下载 basic 模板内获取最新模板进行替换
 *
 */

/* eslint-disable */

'use strict';

var precacheConfig = [["/about/index.html","76ef156f0434de6264324c6592fb0fe0"],["/archives/2023/01/index.html","d8956f9fed47dc816d1cf15645371372"],["/archives/2023/02/index.html","8b31b415d73f0a0ea2dfa7bee4cc749c"],["/archives/2023/index.html","1b96d1041e85aa9e54e7ae77b92c4cbc"],["/archives/2023/page/2/index.html","2c4d4526d9cb901f65eb22f56ffbc526"],["/archives/index.html","7d50c7e9e8466ccca0967e0cb8450683"],["/archives/page/2/index.html","b4c7dbe35150d0ab726ab44e4e05a757"],["/assets/css/APlayer.min.css","fbe994054426fadb2dff69d824c5c67a"],["/assets/js/APlayer.min.js","8f1017e7a73737e631ff95fa51e4e7d7"],["/assets/js/Meting.min.js","bfac0368480fd344282ec018d28f173d"],["/categories/index.html","4cdcd9284c9d33c095b33f5d1b77af0b"],["/css/Aloevera-OVoWO.ttf","014b325fa476de379679f0097c5450ea"],["/css/bounce.css","6811cc672b3a8d6f15b034b50e3aabc1"],["/css/custom.css","1aaaaf0ca16d2cc7c7e056c45fff75ef"],["/css/index.css","251a522b4d46bcfeef6a621ee2ac4551"],["/css/transpancy.css","dbe5a812f034f0dcd1984c81ac466eb9"],["/css/universe.css","de1f9a205d2ebe339b018bbb63087c26"],["/css/var.css","d41d8cd98f00b204e9800998ecf8427e"],["/css/vs.css","c58abc313cdab1dac7bc66951fe95f59"],["/css/ziti.css","d389152968ae491a863c8730f1b7d7df"],["/font/font.css","290c515b1a606571726717dc51a93417"],["/font/font23464/说明.html","725d24a5ac6753ceded1a326dba642db"],["/font/font23464/龚帆免费体2.0.jpg","5bdb26e736eb5b25b619ed3648beed9c"],["/font/font23504/说明.html","725d24a5ac6753ceded1a326dba642db"],["/font/font23504/龚帆和风体.jpg","70766ba2f47a02f6b330ba11f75d0e03"],["/img/1.jpg","3807342830e2b179d928ffd842963f3c"],["/img/404.jpg","4ef3cfb882b6dd4128da4c8745e9a507"],["/img/favicon.png","7a8c47cb5a2149c1a1af21e90ecd9ca7"],["/img/friend_404.gif","68af0be9d22722e74665ef44dd532ba8"],["/img/touxiang.png","1b81a0f10ebb863808068fc52407f703"],["/index.html","8b61dcc72db06638d445a008b10508be"],["/js/main.js","b28662bf81abe2838d20faf2980f0034"],["/js/markmap.js","82b562bd1714bfed6f6569c56bb047fe"],["/js/search/algolia.js","308de383b932f321e04751fd1f79cffb"],["/js/search/local-search.js","149fcc60c1de0a818e111978d01cbd87"],["/js/tw_cn.js","58cb9443474ea5d84a1c4ac806c8b4b7"],["/js/universe.js","f7c885843b78012c3066320c6088b7b1"],["/js/utils.js","24971090b8b1bd5d3f538d414e270fd3"],["/link/index.html","5132553e4a656602a4b1d33775c0b47d"],["/music/index.html","94ad308919ae62b395eb2580f963e84b"],["/page/2/index.html","b20554a73a1873f87080a6c9440550a7"],["/post/16107.html","e95198beb86151fe2cf920d27e4d9bc2"],["/post/16503b92.html","1466673862d9f4d7f3b8077a2a9db17d"],["/post/20df48db.html","fff66aa685ebd00084062b4adec2d407"],["/post/2758ad3f.html","9217851d6f0b9f5f83a55d4ff2ea1517"],["/post/29c39da7.html","032fc32398419820562f6e2f5ccefc52"],["/post/2f7bcbe3.html","faac3031801f67d7109b123d90c603df"],["/post/33a40e2e.html","c324d3773ec57630d2932b1187052294"],["/post/65434e6a.html","009fb645eec8da998652df02fb8efc49"],["/post/9116f588.html","5041e343b59be857664cd6515d119433"],["/post/934fc5e6.html","63ea6246f1f10c05f76f04dbde13dab2"],["/post/9970.html","61f726dcaccc4f4e330aa8786543abd5"],["/post/a659eac3.html","18547cab2337508fdf575a1ef0a3e117"],["/post/a6733633.html","72ee3a202482b21c2be629a17420858a"],["/post/b470e876.html","d84b7d2c374bfac8abf617a7d822d968"],["/post/c00b24b1.html","f395083bfb13172ebc52f218983b5cb6"],["/post/c67c93fa.html","e5e78739bfebd8a5353a0fa5c8fd6a3a"],["/post/dc769c6c.html","b5c0432e3c923f314109186f3323ad81"],["/post/f51178f7.html","fc685d95726fb3971708e547ac5c65b6"],["/self/Kimbiedark.css","d667ef1673f18a8db20f6732f800e493"],["/sw-register.js","10dd22a66c0c0bd3f52d4bb2c10f6982"],["/tags/index.html","3f55312e9cbfd4773746b432f401f002"],["/tuxiang/2.png","793fdfda299c20555353168a7290953f"],["/tuxiang/4.png","d3832e710fb41f253df897a2d0e1c53a"],["/tuxiang/5.png","dd415fc1da21f25d580d58cb6d0d3fb5"]];
var cacheName = 'sw-precache-v3--' + (self.registration ? self.registration.scope : '');
var firstRegister = 1; // 默认1是首次安装SW， 0是SW更新


var ignoreUrlParametersMatching = [/^utm_/];


var addDirectoryIndex = function (originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
        url.pathname += index;
    }
    return url.toString();
};

var cleanResponse = function (originalResponse) {
    // 如果没有重定向响应，不需干啥
    if (!originalResponse.redirected) {
        return Promise.resolve(originalResponse);
    }

    // Firefox 50 及以下不知处 Response.body 流, 所以我们需要读取整个body以blob形式返回。
    var bodyPromise = 'body' in originalResponse ?
        Promise.resolve(originalResponse.body) :
        originalResponse.blob();

    return bodyPromise.then(function (body) {
        // new Response() 可同时支持 stream or Blob.
        return new Response(body, {
            headers: originalResponse.headers,
            status: originalResponse.status,
            statusText: originalResponse.statusText
        });
    });
};

var createCacheKey = function (originalUrl, paramName, paramValue,
    dontCacheBustUrlsMatching) {

    // 创建一个新的URL对象，避免影响原始URL
    var url = new URL(originalUrl);

    // 如果 dontCacheBustUrlsMatching 值没有设置，或是没有匹配到，将值拼接到url.serach后
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
        url.search += (url.search ? '&' : '') +
            encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
};

var isPathWhitelisted = function (whitelist, absoluteUrlString) {
    // 如果 whitelist 是空数组，则认为全部都在白名单内
    if (whitelist.length === 0) {
        return true;
    }

    // 否则逐个匹配正则匹配并返回
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function (whitelistedPathRegex) {
        return path.match(whitelistedPathRegex);
    });
};

var stripIgnoredUrlParameters = function (originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // 移除 hash; 查看 https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // 是否包含 '?'
        .split('&') // 分割成数组 'key=value' 的形式
        .map(function (kv) {
            return kv.split('='); // 分割每个 'key=value' 字符串成 [key, value] 形式
        })
        .filter(function (kv) {
            return ignoreUrlParametersMatching.every(function (ignoredRegex) {
                return !ignoredRegex.test(kv[0]); // 如果 key 没有匹配到任何忽略参数正则，就 Return true
            });
        })
        .map(function (kv) {
            return kv.join('='); // 重新把 [key, value] 格式转换为 'key=value' 字符串
        })
        .join('&'); // 将所有参数 'key=value' 以 '&' 拼接

    return url.toString();
};


var addDirectoryIndex = function (originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
        url.pathname += index;
    }
    return url.toString();
};

var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
    precacheConfig.map(function (item) {
        var relativeUrl = item[0];
        var hash = item[1];
        var absoluteUrl = new URL(relativeUrl, self.location);
        var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
        return [absoluteUrl.toString(), cacheKey];
    })
);

function setOfCachedUrls(cache) {
    return cache.keys().then(function (requests) {
        // 如果原cacheName中没有缓存任何收，就默认是首次安装，否则认为是SW更新
        if (requests && requests.length > 0) {
            firstRegister = 0; // SW更新
        }
        return requests.map(function (request) {
            return request.url;
        });
    }).then(function (urls) {
        return new Set(urls);
    });
}

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return setOfCachedUrls(cache).then(function (cachedUrls) {
                return Promise.all(
                    Array.from(urlsToCacheKeys.values()).map(function (cacheKey) {
                        // 如果缓存中没有匹配到cacheKey，添加进去
                        if (!cachedUrls.has(cacheKey)) {
                            var request = new Request(cacheKey, { credentials: 'same-origin' });
                            return fetch(request).then(function (response) {
                                // 只要返回200才能继续，否则直接抛错
                                if (!response.ok) {
                                    throw new Error('Request for ' + cacheKey + ' returned a ' +
                                        'response with status ' + response.status);
                                }

                                return cleanResponse(response).then(function (responseToCache) {
                                    return cache.put(cacheKey, responseToCache);
                                });
                            });
                        }
                    })
                );
            });
        })
            .then(function () {
            
            // 强制 SW 状态 installing -> activate
            return self.skipWaiting();
            
        })
    );
});

self.addEventListener('activate', function (event) {
    var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.keys().then(function (existingRequests) {
                return Promise.all(
                    existingRequests.map(function (existingRequest) {
                        // 删除原缓存中相同键值内容
                        if (!setOfExpectedUrls.has(existingRequest.url)) {
                            return cache.delete(existingRequest);
                        }
                    })
                );
            });
        }).then(function () {
            
            return self.clients.claim();
            
        }).then(function () {
                // 如果是首次安装 SW 时, 不发送更新消息（是否是首次安装，通过指定cacheName 中是否有缓存信息判断）
                // 如果不是首次安装，则是内容有更新，需要通知页面重载更新
                if (!firstRegister) {
                    return self.clients.matchAll()
                        .then(function (clients) {
                            if (clients && clients.length) {
                                clients.forEach(function (client) {
                                    client.postMessage('sw.update');
                                })
                            }
                        })
                }
            })
    );
});



    self.addEventListener('fetch', function (event) {
        if (event.request.method === 'GET') {

            // 是否应该 event.respondWith()，需要我们逐步的判断
            // 而且也方便了后期做特殊的特殊
            var shouldRespond;


            // 首先去除已配置的忽略参数及hash
            // 查看缓存简直中是否包含该请求，包含就将shouldRespond 设为true
            var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
            shouldRespond = urlsToCacheKeys.has(url);

            // 如果 shouldRespond 是 false, 我们在url后默认增加 'index.html'
            // (或者是你在配置文件中自行配置的 directoryIndex 参数值)，继续查找缓存列表
            var directoryIndex = 'index.html';
            if (!shouldRespond && directoryIndex) {
                url = addDirectoryIndex(url, directoryIndex);
                shouldRespond = urlsToCacheKeys.has(url);
            }

            // 如果 shouldRespond 仍是 false，检查是否是navigation
            // request， 如果是的话，判断是否能与 navigateFallbackWhitelist 正则列表匹配
            var navigateFallback = '';
            if (!shouldRespond &&
                navigateFallback &&
                (event.request.mode === 'navigate') &&
                isPathWhitelisted([], event.request.url)
            ) {
                url = new URL(navigateFallback, self.location).toString();
                shouldRespond = urlsToCacheKeys.has(url);
            }

            // 如果 shouldRespond 被置为 true
            // 则 event.respondWith()匹配缓存返回结果，匹配不成就直接请求.
            if (shouldRespond) {
                event.respondWith(
                    caches.open(cacheName).then(function (cache) {
                        return cache.match(urlsToCacheKeys.get(url)).then(function (response) {
                            if (response) {
                                return response;
                            }
                            throw Error('The cached response that was expected is missing.');
                        });
                    }).catch(function (e) {
                        // 如果捕获到异常错误，直接返回 fetch() 请求资源
                        console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
                        return fetch(event.request);
                    })
                );
            }
        }
    });









/* eslint-enable */
