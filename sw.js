/**
 * 自动引入模板，在原有 sw-precache 插件默认模板基础上做的二次开发
 *
 * 因为是自定导入的模板，项目一旦生成，不支持随 sw-precache 的版本自动升级。
 * 可以到 Lavas 官网下载 basic 模板内获取最新模板进行替换
 *
 */

/* eslint-disable */

'use strict';

var precacheConfig = [["/about/index.html","c4db9d907c9cafb00082c3d30a6c9432"],["/archives/2023/01/index.html","7e7f56c2f60873bcddb98b617e185cd9"],["/archives/2023/02/index.html","747687ee8b86a0de25db5971d39ce91d"],["/archives/2023/index.html","e1f47cf2750e3afd4d4f6b5fb9ce3510"],["/archives/2023/page/2/index.html","08d0de027bbc4e6a294b91f951e74c6b"],["/archives/index.html","a5507f8b00e79734a5c1684ca65eefd4"],["/archives/page/2/index.html","6f53c6050602397f216e27692725bdfa"],["/assets/css/APlayer.min.css","fbe994054426fadb2dff69d824c5c67a"],["/assets/js/APlayer.min.js","8f1017e7a73737e631ff95fa51e4e7d7"],["/assets/js/Meting.min.js","bfac0368480fd344282ec018d28f173d"],["/categories/index.html","6b0b89ed255f6dbdf90c54a4e75456c3"],["/css/Aloevera-OVoWO.ttf","014b325fa476de379679f0097c5450ea"],["/css/bounce.css","6811cc672b3a8d6f15b034b50e3aabc1"],["/css/custom.css","1aaaaf0ca16d2cc7c7e056c45fff75ef"],["/css/index.css","251a522b4d46bcfeef6a621ee2ac4551"],["/css/transpancy.css","dbe5a812f034f0dcd1984c81ac466eb9"],["/css/universe.css","de1f9a205d2ebe339b018bbb63087c26"],["/css/var.css","d41d8cd98f00b204e9800998ecf8427e"],["/css/vs.css","c58abc313cdab1dac7bc66951fe95f59"],["/css/ziti.css","d389152968ae491a863c8730f1b7d7df"],["/font/font.css","290c515b1a606571726717dc51a93417"],["/font/font23464/说明.html","ecde7ea4b8945e7502beb9c85c0c17d1"],["/font/font23464/龚帆免费体2.0.jpg","5bdb26e736eb5b25b619ed3648beed9c"],["/font/font23504/说明.html","ecde7ea4b8945e7502beb9c85c0c17d1"],["/font/font23504/龚帆和风体.jpg","70766ba2f47a02f6b330ba11f75d0e03"],["/img/1.jpg","3807342830e2b179d928ffd842963f3c"],["/img/404.jpg","4ef3cfb882b6dd4128da4c8745e9a507"],["/img/favicon.png","7a8c47cb5a2149c1a1af21e90ecd9ca7"],["/img/friend_404.gif","68af0be9d22722e74665ef44dd532ba8"],["/img/touxiang.png","1b81a0f10ebb863808068fc52407f703"],["/index.html","cbe96a683f7486c1be50732d11f7f5ae"],["/js/main.js","b28662bf81abe2838d20faf2980f0034"],["/js/markmap.js","82b562bd1714bfed6f6569c56bb047fe"],["/js/search/algolia.js","308de383b932f321e04751fd1f79cffb"],["/js/search/local-search.js","149fcc60c1de0a818e111978d01cbd87"],["/js/tw_cn.js","58cb9443474ea5d84a1c4ac806c8b4b7"],["/js/universe.js","f7c885843b78012c3066320c6088b7b1"],["/js/utils.js","24971090b8b1bd5d3f538d414e270fd3"],["/link/index.html","1fbfcbc442a5ade0c712b4f599b472fc"],["/music/index.html","1b4e14d6be2121b6e99d859fee59997c"],["/page/2/index.html","1bce81cd280ed46f416356b132acfed3"],["/post/16107.html","97f2ea9cc5718592ef367711dfa923ad"],["/post/16503b92.html","39212b18b9f25140713721f3375eac21"],["/post/20df48db.html","f06b853e02b424758b69895d39a26442"],["/post/29c39da7.html","cc52371be9602912ab5d723915cdfedd"],["/post/2f7bcbe3.html","52d8979120dbf68c2a6ca826681a62c3"],["/post/33a40e2e.html","0b1429c8e261fd8489c3c3e0dfb8ffc3"],["/post/65434e6a.html","4aa44579e78377618778d13b8d0b1722"],["/post/934fc5e6.html","3fc18a101784956772e48785c6a0e731"],["/post/9970.html","610d97685ea1b0fc8cedf2747b216a22"],["/post/a659eac3.html","3cc5a6e7d5541d0f619c7325471f1140"],["/post/a6733633.html","105730e040f0ae6154a0c071046877b2"],["/post/b470e876.html","d9dbdb4abd3113395b56e79b20324a13"],["/post/c00b24b1.html","3240375530cba1ab464f102526471199"],["/post/c67c93fa.html","ad1fd10fff28a6641ae9fa9ce86a1ff8"],["/post/dc769c6c.html","5142b06ee922a08c7812ed5366bae511"],["/self/Kimbiedark.css","d667ef1673f18a8db20f6732f800e493"],["/sw-register.js","21297be02e7c7cfa8e3db0530e5870e5"],["/tags/index.html","9bcfad4a0387237013193ce21b29fe04"],["/tuxiang/2.png","793fdfda299c20555353168a7290953f"],["/tuxiang/4.png","d3832e710fb41f253df897a2d0e1c53a"],["/tuxiang/5.png","dd415fc1da21f25d580d58cb6d0d3fb5"]];
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
