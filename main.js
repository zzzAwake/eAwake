// === 常量定义 ===
const CONSTANTS = {
  // API
  API: {
    GEMINI_BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models",
  },
  // UI
  UI: {
    MESSAGE_RENDER_WINDOW: 50,
    NOTIFICATION_DURATION: 4000,
    DEBOUNCE_DELAY: 300,
    SCROLL_DURATION: 300,
  },
  // 状态
  STATUS: {
    ONLINE: "在线",
    BUSY: "忙碌/离开",
  },
  // 消息类型
  MSG_TYPES: {
    TEXT: "text",
    VOICE: "voice_message",
    IMAGE: "ai_image",
    TRANSFER: "transfer",
    SHARE_LINK: "share_link",
    STICKER: "sticker",
    RECALLED: "recalled_message",
  },
  // 角色
  ROLES: {
    USER: "user",
    ASSISTANT: "assistant",
    SYSTEM: "system",
  },
};

const DEFAULT_URLS = {
  AVATAR: "https://i.postimg.cc/PxZrFFFL/o-o-1.jpg",
  MY_AVATAR: "https://i.postimg.cc/cLPP10Vm/4.jpg",
  MEMBER_AVATAR: "https://i.postimg.cc/VkQfgzGJ/1.jpg",
  GROUP_AVATAR: "https://i.postimg.cc/gc3QYCDy/1-NINE7-Five.jpg",
};
      // gemini如果是多个密钥, 那么随机获取一个
      function getRandomValue(str) {
        // 检查字符串是否包含逗号
        if (str.includes(",")) {
          // 用逗号分隔字符串并移除多余空格
          const arr = str.split(",").map((item) => item.trim());
          // 生成随机索引 (0 到 arr.length-1)
          const randomIndex = Math.floor(Math.random() * arr.length);
          // 返回随机元素
          return arr[randomIndex];
        }
        // 没有逗号则直接返回原字符串
        return str;
      }
      function isImage(text, content) {
        let currentImageData = content.image_url.url;
        // 提取Base64数据（去掉前缀）
        const base64Data = currentImageData.split(",")[1];
        // 根据图片类型获取MIME类型
        const mimeType = currentImageData.match(/^data:(.*);base64/)[1];
        return [
          { text: `${text.text}用户向你发送了一张图片` },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ];
      }

      function extractArray(text) {
        // 正则表达式模式：匹配开头的时间戳部分和后续的JSON数组
        const pattern = /^\(Timestamp: (\d+)\)(.*)$/s;
        const match = text.match(pattern);

        if (match) {
          const timestampPart = `(Timestamp: ${match[1]}) `;
          const jsonPart = match[2].trim();

          try {
            // 尝试解析JSON部分
            const parsedJson = JSON.parse(jsonPart);
            // 验证解析结果是否为数组
            if (Array.isArray(parsedJson)) {
              return [timestampPart, parsedJson[0]];
            }
          } catch (error) {
            // 解析失败，返回原始文本
          }
        }

        // 不匹配格式或解析失败时返回原值
        return text;
      }
      // === 消息类型标签映射（全局静态配置）===
      const MESSAGE_TYPE_LABELS = {
        send_and_recall: "撤回了消息",
        update_status: "更新了状态",
        change_music: "切换了歌曲",
        create_memory: "记录了回忆",
        create_countdown: "创建了约定/倒计时",
        text: "发送了文本",
        sticker: "发送了表情",
        ai_image: "发送了图片",
        voice_message: "发送了语音",
        transfer: "发起了转账",
        waimai_request: "发起了外卖请求",
        waimai_response: {
          paid: "回应了外卖-同意",
          rejected: "回应了外卖-拒绝",
        },
        video_call_request: "发起了视频通话",
        video_call_response: {
          accept: "回应了视频通话-接受",
          reject: "回应了视频通话-拒绝",
        },
        qzone_post: {
          shuoshuo: "发布了说说",
          text_image: "发布了文字图",
        },
        qzone_comment: "评论了动态",
        qzone_like: "点赞了动态",
        pat_user: "拍一拍了用户",
        block_user: "拉黑了用户",
        friend_request_response: "回应了好友申请",
        change_avatar: "更换了头像",
        share_link: "分享了链接",
        accept_transfer: "回应了转账-接受",
        decline_transfer: "回应了转账-拒绝/退款",
        quote_reply: "引用了回复",
      };

      // === 格式化函数映射表 ===
      const FORMATTERS = {
        sticker: (obj, time, label) => [
          { text: `${time}[${label}] 含义是:${obj.meaning}` },
        ],
        send_and_recall: (obj, time, label) => [
          { text: `${time}[${label}] ${obj.content}` },
        ],
        update_status: (obj, time, label) => [
          { text: `${time}[${label}] ${obj.status_text}(${obj.is_busy ? CONSTANTS.STATUS.BUSY : "空闲"})` },
        ],
        change_music: (obj, time, label) => [
          { text: `${time}[${label}] ${obj.change_music}, 歌名是:${obj.song_name}` },
        ],
        create_memory: (obj, time, label) => [
          { text: `${time}[${label}] ${obj.description}` },
        ],
        create_countdown: (obj, time, label) => [
          { text: `${time}[${label}] ${obj.title}(${obj.date})` },
        ],
        ai_image: (obj, time, label) => [
          { text: `${time}[${label}] 图片描述是:${obj.description}` },
        ],
        voice_message: (obj, time, label) => [
          { text: `${time}[${label}] ${obj.content}` },
        ],
        transfer: (obj, time, label) => [
          { text: `${time}[${label}] 金额是:${obj.amount} 备注是:${obj.note}` },
        ],
        waimai_request: (obj, time, label) => [
          { text: `${time}[${label}] 金额是:${obj.amount} 商品是:${obj.productInfo}` },
        ],
        waimai_response: (obj, time, label) => {
          const subLabel = label[obj.status];
          return [{ text: `${time}[${subLabel}] ${obj.status === "paid" ? "同意" : "拒绝"}` }];
        },
        video_call_request: (obj, time, label) => [
          { text: `${time}[${label}]` },
        ],
        video_call_response: (obj, time, label) => {
          const subLabel = label[obj.decision];
          return [{ text: `${time}[${subLabel}] ${obj.decision === "accept" ? "同意" : "拒绝"}` }];
        },
        qzone_post: (obj, time, label) => {
          const subLabel = label[obj.postType];
          const content = obj.postType === "shuoshuo"
            ? `${obj.content}`
            : `图片描述是:${obj.hiddenContent} ${obj.publicText ? `文案是: ${obj.publicText}` : ""}`;
          return [{ text: `${time}[${subLabel}] ${content}` }];
        },
        qzone_comment: (obj, time, label) => [
          { text: `${time}[${label}] 评论的id是: ${obj.postId} 评论的内容是: ${obj.commentText}` },
        ],
        qzone_like: (obj, time, label) => [
          { text: `${time}[${label}] 点赞的id是: ${obj.postId}` },
        ],
        pat_user: (obj, time, label) => [
          { text: `${time}[${label}] ${obj.suffix || ""}` },
        ],
        block_user: (obj, time, label) => [
          { text: `${time}[${label}]` },
        ],
        friend_request_response: (obj, time, label) => [
          { text: `${time}[${label}] 结果是:${obj.decision === "accept" ? "同意" : "拒绝"}` },
        ],
        change_avatar: (obj, time, label) => [
          { text: `${time}[${label}] 头像名是:${obj.name}` },
        ],
        share_link: (obj, time, label) => [
          { text: `${time}[${label}] 文章标题是:${obj.title}  文章摘要是:${obj.description} 来源网站名是:${obj.source_name} 文章正文是:${obj.content}` },
        ],
        accept_transfer: (obj, time, label) => [
          { text: `${time}[${label}]` },
        ],
        quote_reply: (obj, time, label) => [
          { text: `${time}[${label}] 引用的内容是:${obj.reply_content}` },
        ],
        text: (obj, time, label) => [
          { text: `${time}${obj.content}` },
        ],
      };

      // === 简化后的 transformChatData ===
      function transformChatData(item) {
        const res = extractArray(item.content);

        if (!Array.isArray(res)) {
          return [{ text: res }];
        }

        const obj = res[1];
        const itemType = obj.type;
        const time = res[0];

        // 获取标签（可能是字符串或对象）
        let label = MESSAGE_TYPE_LABELS[itemType];

        // 如果是嵌套对象类型（如 waimai_response），需要特殊处理
        if (label && typeof label === "object") {
          // 嵌套对象类型直接返回格式化结果
          const formatter = FORMATTERS[itemType];
          if (formatter) {
            return formatter(obj, time, label);
          }
        }

        // 普通类型处理
        if (label && typeof label === "string") {
          const formatter = FORMATTERS[itemType];
          if (formatter) {
            return formatter(obj, time, label);
          }
        }

        // 未匹配类型，返回原始内容
        if (res.length > 1) {
          return [{ text: `${res[0]}${res[1].content}` }];
        }

        return [{ text: res }];
      }

      function toGeminiRequestData(
        model,
        apiKey,
        systemInstruction,
        messagesForDecision,
        isGemini,
        temperature,
        topP,
        topK,
      ) {
        if (!isGemini) {
          return undefined;
        }

        // 【核心修正】在这里，我们将 'system' 角色也映射为 'user'

        let roleType = {
          user: CONSTANTS.ROLES.USER,
          assistant: "model",
          system: CONSTANTS.ROLES.USER, // <--- 新增这一行
        };

        // 构建 generationConfig
        const generationConfig = {};
        if (temperature !== undefined)
          generationConfig.temperature = temperature;
        if (topP !== undefined) generationConfig.topP = topP;
        if (topK !== undefined) generationConfig.topK = topK;

        return {
          url: `${CONSTANTS.API.GEMINI_BASE_URL}/${model}:generateContent?key=${getRandomValue(
            apiKey,
          )}`,
          data: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: messagesForDecision.map((item) => {
                let includesImages = false;
                if (Array.isArray(item.content) && item.content.length === 2) {
                  includesImages = item.content.some((sub) => {
                    return sub.type === "image_url" && sub.image_url.url;
                  });
                }
                return {
                  role: roleType[item.role], // 现在 'system' 会被正确转换为 'user'
                  parts: includesImages
                    ? isImage(item.content[0], item.content[1])
                    : transformChatData(item),
                };
              }),
              generationConfig: generationConfig,
              systemInstruction: {
                parts: [
                  {
                    text: systemInstruction,
                  },
                ],
              },
            }),
          },
        };
      }
      document.addEventListener("DOMContentLoaded", () => {
        // === Lightweight performance helpers ===
        /* visibility safeguard for streaming (patched) */
        document.addEventListener(
          "visibilitychange",
          async () => {
            if (document.hidden) {
              try {
                // flush any in-flight streaming content
                await db?.chats?.put?.(state.chats[state.activeChatId]);
              } catch (e) {
                console.error("[SilentError] Error caught in [visibilitychange]:", e);
              }
            }
          },
          { passive: true },
        );

        // 2) Default all images to lazy & async decoding (static + dynamically added)
        function setImagePerfAttrs(img) {
          try {
            if (!img.hasAttribute("loading"))
              img.setAttribute("loading", "lazy");
            if (!img.hasAttribute("decoding"))
              img.setAttribute("decoding", "async");
          } catch (e) {
            console.error("[SilentError] Error caught in [setImagePerfAttrs]:", e);
          }
        }
        document.querySelectorAll("img").forEach(setImagePerfAttrs);
        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            m.addedNodes &&
              m.addedNodes.forEach((node) => {
                if (node && node.tagName === "IMG") setImagePerfAttrs(node);
                else if (node && node.querySelectorAll)
                  node.querySelectorAll("img").forEach(setImagePerfAttrs);
              });
          }
        });
        mo.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });

        // 3) Encourage passive listeners for scroll/touch to prevent jank
        (function () {
          const orig = EventTarget.prototype.addEventListener;
          const defaultPassive = {
            touchstart: true,
            touchmove: true,
            wheel: true,
          };
          EventTarget.prototype.addEventListener = function (
            type,
            listener,
            options,
          ) {
            let opts = options;
            if (typeof options === "object" && options !== null) {
              if (defaultPassive[type] && options.passive == null) {
                opts = Object.assign({}, options, { passive: true });
              }
            } else if (options === undefined && defaultPassive[type]) {
              opts = { passive: true };
            }
            return orig.call(this, type, listener, opts);
          };
        })();
        // ===================================================================
        // 1. 所有变量和常量定义
        // ===================================================================
        // ==================== iOS PWA 后台活动模块 ====================
        const SILENT_MP3_BASE64 = 'data:audio/mp3;base64,SUQzBAAAAAABBlRTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v/////////////////////////////////////////////////////////////////AAAA5kxhdmM1OC41NAAAAAAAAAAAAAAAACQAAAAAAAAAAAGGpN7WLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAA8AAAGkAAAAIAAANIAAAAQAAAKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq=';

        class BackgroundKeepAlive {
          constructor() {
            this.audio = new Audio(SILENT_MP3_BASE64);
            this.audio.loop = true;
            this.audio.playsInline = true;
            this.isActive = false;
          }

          async start() {
            if (this.isActive) return;
            try {
              await this.audio.play();
              this.isActive = true;
              this.setupMediaSession();
              console.log("[BackgroundKeepAlive] Started");
            } catch (error) {
              console.error("[BackgroundKeepAlive] Failed:", error);
            }
          }

          stop() {
            this.audio.pause();
            this.isActive = false;
          }

          setupMediaSession() {
            if ("mediaSession" in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: 'EPhone Running',
                artist: 'Background Active',
                artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
              });
            }
          }
        }

        const keepAliveSystem = new BackgroundKeepAlive();

        async function requestNotificationPermission() {
          if (!("Notification" in window)) return 'unsupported';
          if (Notification.permission === 'granted') return 'granted';
          return await Notification.requestPermission();
        }

        async function sendLocalNotification(title, body, chatId, avatarUrl) {
          if (Notification.permission === 'granted') {
            try {
              const reg = await navigator.serviceWorker.ready;
              await reg.showNotification(title, {
                body: body,
                icon: avatarUrl || 'icons/icon-192.png',
                badge: 'icons/icon-maskable-192.png',
                tag: 'ephone-msg-' + Date.now(),
                data: { url: window.location.href, chatId: chatId }
              });
            } catch (e) {
              console.error("[Notification] Failed:", e);
            }
          }
        }
        // ==================== 后台活动模块结束 ====================

        const db = new Dexie("GeminiChatDB");
        // --- 已修正 ---
        const offlinePresets = {
          custom: { name: "自定义 (Custom)", prompt: "", style: "" },
          classroom: {
            name: "教室 (Classroom)",
            prompt: "我们在教室里，下课时间。窗外阳光正好，同学们在打闹。",
            style: "青春校园",
          },
          bedroom: {
            name: "卧室 (Bedroom)",
            prompt: "深夜，我们在卧室里。房间里很安静，只有床头灯亮着。",
            style: "温馨私密",
          },
          park: {
            name: "公园 (Park)",
            prompt: "午后的公园，阳光明媚。我们在长椅上坐着，微风吹过。",
            style: "轻松日常",
          },
          cafe: {
            name: "咖啡馆 (Cafe)",
            prompt: "热闹的咖啡馆，空气中弥漫着咖啡香。我们面对面坐着。",
            style: "都市休闲",
          },
          street: {
            name: "街道 (Street)",
            prompt: "夜晚的街道，霓虹灯闪烁。我们并肩走着。",
            style: "赛博朋克",
          },
        };

        let state = {
          chats: {},
          activeChatId: null,
          globalSettings: {},
          apiConfigs: [],
          userStickers: [],
          worldBooks: [],
          personaPresets: [],
          qzoneSettings: {},
          activeAlbumId: null,
        };

        // === DOM 缓存工具 ===
        const DOM = {
          _cache: new Map(),
          get(id) {
            if (!this._cache.has(id)) {
              const el = document.getElementById(id);
              if (el) {
                this._cache.set(id, el);
              }
              return el;
            }
            return this._cache.get(id);
          },
          clear() {
            this._cache.clear();
          },
        };

        function getMemberInfo(chat, senderName) {
          if (!chat || !chat.isGroup) return null;
          const member = chat.members?.find((m) => m.originalName === senderName);
          return member
            ? {
                nickname: member.groupNickname || member.originalName,
                avatar: member.avatar || DEFAULT_URLS.MEMBER_AVATAR,
              }
            : {
                nickname: senderName || "未知成员",
                avatar: DEFAULT_URLS.MEMBER_AVATAR,
              };
        }

        // 搜索状态
        let chatSearchState = {
          query: "",
          results: [], // 匹配的消息索引数组
          currentIndex: -1, // 当前高亮的结果索引
          isOpen: false,
        };

        let notificationTimeout;

        function showNotification(chatId, messageContent) {
          playNotificationSound();
          clearTimeout(notificationTimeout);
          const chat = state.chats[chatId];
          if (!chat) return;
          const bar = DOM.get('notification-bar');
          document.getElementById('notification-avatar').src =
            chat.settings.aiAvatar || chat.settings.groupAvatar || defaultAvatar;
          document.getElementById('notification-content').querySelector('.name').textContent = chat.name;
          document.getElementById('notification-content').querySelector('.message').textContent = messageContent;
          const newBar = bar.cloneNode(true);
          bar.parentNode.replaceChild(newBar, bar);
          newBar.addEventListener('click', () => {
            openChat(chatId);
            newBar.classList.remove('visible');
          });
          newBar.classList.add('visible');
          notificationTimeout = setTimeout(() => {
            newBar.classList.remove('visible');
          }, 4000);
        }

        function playNotificationSound() {
          const soundUrl =
            state.globalSettings.notificationSoundUrl || 'https://laddy-lulu.github.io/Ephone-stuffs/message.mp3';
          if (!soundUrl || !soundUrl.trim()) return;
          try {
            const audio = new Audio(soundUrl);
            audio.volume = 0.7;
            audio.play().catch(error => {
              if (error.name === 'NotAllowedError') {
                console.warn('播放消息提示音失败：用户需要先与页面进行一次交互才能自动播放音频。');
              } else {
                console.error(`播放消息提示音失败 (${error.name}): ${error.message}`);
              }
            });
          } catch (error) {
            console.error('创建提示音Audio对象时出错:', error);
          }
        }

        // Debounce 函数
        function debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        }

        // 执行搜索
        function performChatSearch(query) {
          const chat = state.chats[state.activeChatId];
          if (!chat || !query.trim()) {
            chatSearchState.results = [];
            chatSearchState.currentIndex = -1;
            chatSearchState.query = "";
            updateSearchUI();
            if (typeof clearSearchHighlights === "function") {
              clearSearchHighlights();
            }
            return;
          }

          const lowerQuery = query.toLowerCase().trim();
          chatSearchState.query = lowerQuery;
          chatSearchState.results = [];

          // 遍历消息找匹配项
          chat.history.forEach((msg, index) => {
            if (msg.isHidden || msg.type === "summary") return;
            const content = msg.content || "";
            if (typeof content === "string" && content.toLowerCase().includes(lowerQuery)) {
              chatSearchState.results.push(index);
            }
          });

          // 设置到第一个结果
          if (chatSearchState.results.length > 0) {
            chatSearchState.currentIndex = 0;
            if (typeof navigateToResult === "function") {
              navigateToResult(0);
            }
          } else {
            chatSearchState.currentIndex = -1;
          }

          updateSearchUI();
        }

        // 更新搜索UI
        function updateSearchUI() {
          const countEl = document.getElementById("search-result-count");
          const prevBtn = document.getElementById("search-prev-btn");
          const nextBtn = document.getElementById("search-next-btn");

          const total = chatSearchState.results.length;
          const current = chatSearchState.currentIndex + 1;

          if (countEl) {
            countEl.textContent = total > 0 ? `${current}/${total}` : "0/0";
          }
          if (prevBtn) {
            prevBtn.disabled = total === 0 || chatSearchState.currentIndex <= 0;
          }
          if (nextBtn) {
            nextBtn.disabled =
              total === 0 || chatSearchState.currentIndex >= total - 1;
          }
         }

        // Debounced 搜索
        const debouncedSearch = debounce((query) => {
          performChatSearch(query);
        }, 300);

        // 导航到结果
        function navigateToResult(index) {
          if (index < 0 || index >= chatSearchState.results.length) return;

          chatSearchState.currentIndex = index;
          const msgIndex = chatSearchState.results[index];
          const messagesContainer = DOM.get("chat-messages");
          if (!messagesContainer) return;

          messagesContainer.querySelectorAll(".search-highlight").forEach((el) => {
            el.classList.remove("search-highlight");
          });

          const targetMsg = messagesContainer.querySelector(
            `.message-wrapper[data-msg-index="${msgIndex}"]`,
          );

          if (targetMsg) {
            // iOS-safe scrolling: manually calculate and set scrollTop
            // This works reliably on iOS Safari where scrollIntoView() fails in scrollable containers
            const targetRect = targetMsg.getBoundingClientRect();
            const containerRect = messagesContainer.getBoundingClientRect();
            
            // Calculate offset from container top
            const offset = targetRect.top - containerRect.top;
            
            // Scroll to center the message in viewport (with smooth behavior)
            const targetScrollTop = messagesContainer.scrollTop + offset - (containerRect.height / 2) + (targetRect.height / 2);
            
            // Smooth scroll using requestAnimationFrame for better iOS compatibility
            const startScrollTop = messagesContainer.scrollTop;
            const distance = targetScrollTop - startScrollTop;
            const duration = 300; // ms
            const startTime = performance.now();
            
            function smoothScrollStep(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Ease-out cubic for smooth deceleration
              const easeProgress = 1 - Math.pow(1 - progress, 3);
              
              messagesContainer.scrollTop = startScrollTop + (distance * easeProgress);
              
              if (progress < 1) {
                requestAnimationFrame(smoothScrollStep);
              }
            }
            
            requestAnimationFrame(smoothScrollStep);
            
            targetMsg.classList.add("search-highlight");

            setTimeout(() => {
              targetMsg.classList.remove("search-highlight");
            }, 1500);
          }

          updateSearchUI();
          highlightSearchMatches();
        }

        // 高亮搜索匹配文本
        function highlightSearchMatches() {
          clearSearchHighlights();
          if (!chatSearchState.query) return;

          const messagesContainer = DOM.get("chat-messages");
          if (!messagesContainer) return;

          const regex = new RegExp(`(${escapeRegex(chatSearchState.query)})`, "gi");

          chatSearchState.results.forEach((msgIndex, resultIndex) => {
            const msgEl = messagesContainer.querySelector(
              `.message-wrapper[data-msg-index="${msgIndex}"] .content`,
            );
            if (!msgEl) return;

            if (!msgEl.dataset.originalHtml) {
              msgEl.dataset.originalHtml = msgEl.innerHTML;
            }

            const isCurrent = resultIndex === chatSearchState.currentIndex;
            msgEl.innerHTML = msgEl.dataset.originalHtml.replace(
              regex,
              `<span class="search-match${isCurrent ? " current" : ""}">$1</span>`,
            );
          });
        }

        // 清除搜索高亮
        function clearSearchHighlights() {
          const messagesContainer = DOM.get("chat-messages");
          if (!messagesContainer) return;

          messagesContainer
            .querySelectorAll(".content[data-original-html]")
            .forEach((el) => {
              el.innerHTML = el.dataset.originalHtml;
              delete el.dataset.originalHtml;
            });

          messagesContainer.querySelectorAll(".search-highlight").forEach((el) => {
            el.classList.remove("search-highlight");
          });
        }

        // 转义正则特殊字符
        function escapeRegex(string) {
          return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }

        // 打开搜索面板
        function openChatSearch() {
          chatSearchState.isOpen = true;
          document.getElementById("chat-search-panel")?.classList.add("visible");
          const input = document.getElementById("chat-search-input");
          if (input) input.focus();
        }

        // 关闭搜索面板
        function closeChatSearch() {
          chatSearchState.isOpen = false;
          chatSearchState.query = "";
          chatSearchState.results = [];
          chatSearchState.currentIndex = -1;
          document.getElementById("chat-search-panel")?.classList.remove("visible");
          const input = document.getElementById("chat-search-input");
          if (input) input.value = "";
          clearSearchHighlights();
          updateSearchUI();
        }

        // 搜索事件绑定
        const chatSearchBtn = document.getElementById("chat-search-btn");
        const closeSearchBtn = document.getElementById("close-search-btn");
        const searchInput = document.getElementById("chat-search-input");
        const prevSearchBtn = document.getElementById("search-prev-btn");
        const nextSearchBtn = document.getElementById("search-next-btn");

        chatSearchBtn?.addEventListener("click", openChatSearch);
        closeSearchBtn?.addEventListener("click", closeChatSearch);
        searchInput?.addEventListener("input", (event) => {
          const target = event.target;
          if (target instanceof HTMLInputElement) {
            debouncedSearch(target.value);
          }
        });

        prevSearchBtn?.addEventListener("click", () => {
          if (chatSearchState.currentIndex > 0) {
            navigateToResult(chatSearchState.currentIndex - 1);
          }
        });

        nextSearchBtn?.addEventListener("click", () => {
          if (chatSearchState.currentIndex < chatSearchState.results.length - 1) {
            navigateToResult(chatSearchState.currentIndex + 1);
          }
        });

        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && chatSearchState.isOpen) {
            closeChatSearch();
          }
        });

        function getActiveApiConfig() {
          const activeConfigId = state.globalSettings.activeApiConfigId;
          const activeConfig = state.apiConfigs.find(
            (c) => c.id === activeConfigId,
          );
          if (!activeConfig) return null;
          return {
            proxyUrl: activeConfig.url,
            apiKey: activeConfig.apiKey,
            model: activeConfig.model,
            temperature: activeConfig.temperature ?? 0.8, // 传递新参数
            topP: activeConfig.topP ?? 1.0,
            topK: activeConfig.topK ?? 40,
            enableTemp:
              activeConfig.enableTemp ??
              activeConfig.enableAdvancedParams ??
              false,
            enableTopP:
              activeConfig.enableTopP ??
              activeConfig.enableAdvancedParams ??
              false,
            enableTopK:
              activeConfig.enableTopK ??
              activeConfig.enableAdvancedParams ??
              false,
            enableStreaming: activeConfig.enableStream, // Map to old property name for compatibility
          };
        }
        function getSummaryApiConfig(chatId) {
          const chat = state.chats[chatId];
          if (
            chat &&
            chat.settings &&
            chat.settings.summary &&
            chat.settings.summary.useCustomApi
          ) {
            return {
              proxyUrl: chat.settings.summary.customApiUrl,
              apiKey: chat.settings.summary.customApiKey,
              model: chat.settings.summary.customModel,
              enableStreaming: chat.settings.summary.enableStream,
              // Summary specific configs don't support advanced params yet, use defaults or globals?
              // For now, let's stick to defaults for stability
              temperature: 0.3,
              topP: 1.0,
              topK: 40,
              enableTemp: false,
              enableTopP: false,
              enableTopK: false,
            };
          }
          return getActiveApiConfig();
        }
        // --- 修正结束 ---
        let musicState = {
          isActive: false,
          activeChatId: null,
          isPlaying: false,
          playlist: [],
          currentIndex: -1,
          playMode: "order",
          totalElapsedTime: 0,
          timerId: null,
          // 【新增】歌词相关状态
          parsedLyrics: [], // 当前歌曲解析后的歌词数组
          currentLyricIndex: -1, // 当前高亮的歌词行索引
        };
        const audioPlayer = document.getElementById("audio-player");
        let newWallpaperBase64 = null;
        let isSelectionMode = false;
        let selectedMessages = new Set();
        let editingMemberId = null;
        let editingWorldBookId = null;
        let editingPersonaPresetId = null;

        let waimaiTimers = {}; // 用于存储外卖倒计时

        let activeMessageTimestamp = null;
        let currentReplyContext = null; // <--- 新增这行，用来存储当前正在引用的消息信息
        let activePostId = null; // <-- 新增：用于存储当前操作的动态ID

        let photoViewerState = {
          isOpen: false,
          photos: [], // 存储当前相册的所有照片URL
          currentIndex: -1, // 当前正在查看的照片索引
        };

        let unreadPostsCount = 0;

        let isFavoritesSelectionMode = false;
        let selectedFavorites = new Set();

        let simulationIntervalId = null;

        const defaultAvatar = DEFAULT_URLS.AVATAR;
        const defaultMyGroupAvatar = DEFAULT_URLS.MY_AVATAR;
        const defaultGroupMemberAvatar = DEFAULT_URLS.MEMBER_AVATAR;
        const defaultGroupAvatar =
          DEFAULT_URLS.GROUP_AVATAR;

        const DEFAULT_APP_ICONS = {
          "world-book": "https://i.postimg.cc/HWf1JKzn/IMG-6435.jpg",
          qq: "https://i.postimg.cc/MTC3Tkw8/IMG-6436.jpg",
          "api-settings": "https://i.postimg.cc/MK8rJ8t7/IMG-6438.jpg",
          wallpaper: "https://i.postimg.cc/T1j03pQr/IMG-6440.jpg",
          font: "https://i.postimg.cc/pXxk1JXk/IMG-6442.jpg",
        };

        const BUBBLE_SETTINGS_DEFAULTS = {
          text: {
            user: {
              gradient: {
                enabled: false,
                type: "linear",
                angle: 180,
                stops: [
                  { color: "#ffffff", position: 0 },
                  { color: "#ffffff", position: 100 },
                ],
              },
              solidColor: "rgba(255, 255, 255, 0.75)",
              opacity: 1,
              border: {
                color: "transparent",
                width: 0,
                style: "solid",
                radius: 8,
              },
              shadow: {
                enabled: false,
                value: "0 2px 8px rgba(0,0,0,0.1)",
              },
            },
            ai: {
              gradient: {
                enabled: false,
                type: "linear",
                angle: 180,
                stops: [
                  { color: "#ffffff", position: 0 },
                  { color: "#ffffff", position: 100 },
                ],
              },
              solidColor: "rgba(255, 255, 255, 0.7)",
              opacity: 1,
              border: {
                color: "transparent",
                width: 0,
                style: "solid",
                radius: 8,
              },
              shadow: {
                enabled: false,
                value: "0 2px 8px rgba(0,0,0,0.1)",
              },
            },
          },
          voice: {
            user: {
              backgroundColor: "#2ba245",
              waveformColor: "#1a3d00",
              durationColor: "#3e6224",
            },
            ai: {
              backgroundColor: "#ffffff",
              waveformColor: "#666666",
              durationColor: "#666666",
            },
          },
        };

        const cloneStops = (stops = []) => stops.map((stop) => ({ ...stop }));

        const mergeGradient = (defaultGradient, overrideGradient = {}) => {
          const baseStops = cloneStops(defaultGradient.stops);
          const overrideStops = Array.isArray(overrideGradient.stops)
            ? cloneStops(overrideGradient.stops)
            : baseStops;
          return {
            ...defaultGradient,
            ...overrideGradient,
            stops: overrideStops,
          };
        };

        const mergeTextVariant = (defaultVariant, override = {}) => {
          return {
            ...defaultVariant,
            ...override,
            gradient: mergeGradient(defaultVariant.gradient, override.gradient),
            border: {
              ...defaultVariant.border,
              ...(override.border || {}),
            },
            shadow: {
              ...defaultVariant.shadow,
              ...(override.shadow || {}),
            },
          };
        };

        function getBubbleSettings(chatId) {
          const chat = state?.chats?.[chatId];
          const overrides = chat?.settings?.bubbleSettings || {};
          return {
            text: {
              user: mergeTextVariant(
                BUBBLE_SETTINGS_DEFAULTS.text.user,
                overrides.text?.user,
              ),
              ai: mergeTextVariant(
                BUBBLE_SETTINGS_DEFAULTS.text.ai,
                overrides.text?.ai,
              ),
            },
            voice: {
              user: {
                ...BUBBLE_SETTINGS_DEFAULTS.voice.user,
                ...(overrides.voice?.user || {}),
              },
              ai: {
                ...BUBBLE_SETTINGS_DEFAULTS.voice.ai,
                ...(overrides.voice?.ai || {}),
              },
            },
          };
        }

        // Storage layer for bubble settings
        async function saveBubbleSettings(chatId, settings) {
          try {
            const chat = await db.chats.get(chatId);
            if (!chat) {
              console.error(`Chat not found: ${chatId}`);
              return;
            }
            
            // Merge new settings with existing bubbleSettings
            if (!chat.settings) {
              chat.settings = {};
            }
            
            chat.settings.bubbleSettings = {
              ...chat.settings.bubbleSettings,
              ...settings,
            };
            
            // Persist to IndexedDB
            await db.chats.put(chat);
            
            // Update in-memory state
            if (state.chats[chatId]) {
              if (!state.chats[chatId].settings) {
                state.chats[chatId].settings = {};
              }
              state.chats[chatId].settings.bubbleSettings = chat.settings.bubbleSettings;
            }
            
            console.log(`Bubble settings saved for chat ${chatId}`);
          } catch (error) {
            console.error("Failed to save bubble settings:", error);
            await showCustomAlert("错误", "气泡设置保存失败");
            throw error;
          }
        }

        async function loadBubbleSettings(chatId) {
          try {
            const chat = await db.chats.get(chatId);
            if (!chat) {
              console.warn(`Chat not found: ${chatId}, returning defaults`);
              return getBubbleSettings(chatId);
            }
            
            // Return merged settings (defaults + overrides)
            return getBubbleSettings(chatId);
          } catch (error) {
            console.error("Failed to load bubble settings:", error);
            await showCustomAlert("错误", "气泡设置加载失败");
            return getBubbleSettings(chatId);
          }
        }

        // Debounced version to reduce IndexedDB writes
        let debouncedSaveTimeout = null;
        function debouncedSaveBubbleSettings(chatId, settings) {
          if (debouncedSaveTimeout) {
            clearTimeout(debouncedSaveTimeout);
          }
          debouncedSaveTimeout = setTimeout(async () => {
            try {
              await saveBubbleSettings(chatId, settings);
              console.log('Bubble settings auto-saved');
              // Auto-apply to current chat if it's open
              if (state.activeChatId === chatId && DOM.get('chat-interface-screen').classList.contains('active')) {
                applyBubbleStyles(chatId);
              }
            } catch (error) {
              console.error('Failed to save bubble settings:', error);
            }
            debouncedSaveTimeout = null;
          }, 500);
        }

        // Cancel pending debounced saves (useful when switching chats)
        function cancelPendingSave() {
          if (debouncedSaveTimeout) {
            clearTimeout(debouncedSaveTimeout);
            debouncedSaveTimeout = null;
          }
        }


        // --- Bubble Settings UI Logic ---
        let currentBubbleChatId = null;
        let currentBubbleTarget = 'user'; // 'user' or 'ai'
        let currentBubbleState = null; // Copy of settings being edited

        function initBubbleSettingsUI(chatId) {
          currentBubbleChatId = chatId;
          currentBubbleTarget = 'user';
          
          // Initialize state with deep copy of defaults to ensure structure exists
          const chat = state.chats[chatId];
          const savedSettings = getBubbleSettings(chatId); // Gets merged defaults
          
          // Deep clone to avoid mutating state directly until save
          currentBubbleState = JSON.parse(JSON.stringify(savedSettings));
          
          // Initial UI Render
          switchBubbleTab('text');
          renderBubbleUI();
          updateSettingsPreview();
          
          // Bind Events (only once per modal open ideally, but for now we re-bind safely)
          bindBubbleEvents();
        }

        function switchBubbleTab(tab) {
          document.querySelectorAll('.bubble-tab').forEach(el => {
            el.classList.remove('active');
            el.style.borderBottom = 'none';
            el.style.color = '#999';
            el.style.fontWeight = 'normal';
          });
          document.querySelectorAll('[id^="panel-"]').forEach(el => el.style.display = 'none');
          
          const activeTab = document.getElementById(`tab-${tab}-bubble`);
          const activePanel = document.getElementById(`panel-${tab}-bubble`);
          
          if (activeTab && activePanel) {
            activeTab.classList.add('active');
            activeTab.style.borderBottom = '2px solid var(--primary-color)';
            activeTab.style.color = 'var(--text-primary)';
            activeTab.style.fontWeight = 'bold';
            activePanel.style.display = 'block';
          }
        }

        function switchBubbleTarget(target) {
          currentBubbleTarget = target;
          
          // Update Buttons
          document.getElementById('btn-target-user').classList.toggle('active', target === 'user');
          document.getElementById('btn-target-user').style.background = target === 'user' ? '#fff' : 'transparent';
          document.getElementById('btn-target-user').style.boxShadow = target === 'user' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none';
          document.getElementById('btn-target-user').style.color = target === 'user' ? '#000' : '#666';
          
          document.getElementById('btn-target-ai').classList.toggle('active', target === 'ai');
          document.getElementById('btn-target-ai').style.background = target === 'ai' ? '#fff' : 'transparent';
          document.getElementById('btn-target-ai').style.boxShadow = target === 'ai' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none';
          document.getElementById('btn-target-ai').style.color = target === 'ai' ? '#000' : '#666';

          renderBubbleUI();
        }

      // Expose functions globally for inline onclick handlers
      window.switchBubbleTab = switchBubbleTab;
      window.switchBubbleTarget = switchBubbleTarget;
      window.resetBubbleSettings = resetBubbleSettings;
      window.resetVoiceSettings = resetVoiceSettings;

        function getActiveBubbleConfig() {
          return currentBubbleState.text[currentBubbleTarget];
        }

        function getActiveVoiceConfig() {
          return currentBubbleState.voice[currentBubbleTarget];
        }

        function renderVoiceUI() {
          const config = getActiveVoiceConfig();
          
          document.getElementById('voice-bubble-bg-color').value = config.backgroundColor;
          document.getElementById('voice-waveform-color').value = config.waveformColor;
          document.getElementById('voice-duration-color').value = config.durationColor;
        }

        function resetVoiceSettings() {
          const defaults = BUBBLE_SETTINGS_DEFAULTS.voice[currentBubbleTarget];
          // Deep clone default to reset
          currentBubbleState.voice[currentBubbleTarget] = JSON.parse(JSON.stringify(defaults));
          
          saveCurrentBubbleState();
          renderVoiceUI();
          updateSettingsPreview();
        }

        function renderBubbleUI() {
          const config = getActiveBubbleConfig();
          
          // Render Voice UI if voice panel is active (or just always update input values)
          renderVoiceUI();
          
          // Gradient Toggle
          const gradientToggle = document.getElementById('bubble-gradient-toggle');
          gradientToggle.checked = config.gradient.enabled;
          
          // Toggle Visibility
          document.getElementById('bubble-solid-options').style.display = config.gradient.enabled ? 'none' : 'flex';
          document.getElementById('bubble-gradient-options').style.display = config.gradient.enabled ? 'block' : 'none';
          
          // Solid Color
          document.getElementById('bubble-solid-color').value = config.solidColor.substring(0, 7); // Handle rgba if needed, but input color takes hex
          
          // Gradient Props
          document.getElementById('bubble-gradient-type').value = config.gradient.type;
          document.getElementById('bubble-angle').value = config.gradient.angle;
          document.getElementById('bubble-angle-val').textContent = config.gradient.angle + '°';
          document.getElementById('bubble-angle-row').style.display = config.gradient.type === 'linear' ? 'flex' : 'none';
          
          // Stops
          renderGradientStops(config.gradient.stops);
          
          // Opacity
          document.getElementById('bubble-opacity').value = config.opacity * 100;
          document.getElementById('bubble-opacity-val').textContent = Math.round(config.opacity * 100) + '%';
          
          // Border
          document.getElementById('bubble-border-color').value = config.border.color === 'transparent' ? '#ffffff' : config.border.color;
          document.getElementById('bubble-border-width').value = config.border.width;
          document.getElementById('bubble-border-width-val').textContent = config.border.width + 'px';
          document.getElementById('bubble-border-style').value = config.border.style;
          document.getElementById('bubble-border-radius').value = config.border.radius;
          document.getElementById('bubble-border-radius-val').textContent = config.border.radius + 'px';
          
          // Shadow
          document.getElementById('bubble-shadow-toggle').checked = config.shadow.enabled;
        }

        function renderGradientStops(stops) {
          const container = document.getElementById('bubble-gradient-stops');
          container.innerHTML = '';
          
          stops.forEach((stop, index) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '8px';
            row.style.marginBottom = '5px';
            
            row.innerHTML = `
              <input type="color" value="${stop.color}" onchange="updateGradientStop(${index}, 'color', this.value)" style="width: 30px; height: 30px; padding: 0; border: none; background: none;">
              <input type="range" min="0" max="100" value="${stop.position}" oninput="updateGradientStop(${index}, 'position', this.value)" style="flex: 1;">
              <span style="font-size: 11px; width: 30px;">${stop.position}%</span>
              ${stops.length > 2 ? `<button onclick="removeGradientStop(${index})" style="background: none; border: none; color: #999; cursor: pointer;">×</button>` : ''}
            `;
            container.appendChild(row);
          });
        }

        function bindBubbleEvents() {
          // Unbind existing to prevent dupes (naive approach, better to use named handlers if strict, but inline onchange used for stops)
          // Solid Color
          document.getElementById('bubble-solid-color').oninput = (e) => updateBubbleSetting('solidColor', e.target.value);
          
          // Gradient Toggle
          document.getElementById('bubble-gradient-toggle').onchange = (e) => updateBubbleSetting('gradient.enabled', e.target.checked);
          
          // Gradient Type
          document.getElementById('bubble-gradient-type').onchange = (e) => updateBubbleSetting('gradient.type', e.target.value);
          
          // Gradient Angle
          document.getElementById('bubble-angle').oninput = (e) => updateBubbleSetting('gradient.angle', parseInt(e.target.value));
          
          // Opacity
          document.getElementById('bubble-opacity').oninput = (e) => updateBubbleSetting('opacity', parseInt(e.target.value) / 100);
          
          // Border
          document.getElementById('bubble-border-color').oninput = (e) => updateBubbleSetting('border.color', e.target.value);
          document.getElementById('bubble-border-width').oninput = (e) => updateBubbleSetting('border.width', parseFloat(e.target.value));
          document.getElementById('bubble-border-style').onchange = (e) => updateBubbleSetting('border.style', e.target.value);
          document.getElementById('bubble-border-radius').oninput = (e) => updateBubbleSetting('border.radius', parseInt(e.target.value));
          
          // Shadow
          document.getElementById('bubble-shadow-toggle').onchange = (e) => updateBubbleSetting('shadow.enabled', e.target.checked);

          // --- Voice Settings Events ---
          document.getElementById('voice-bubble-bg-color').oninput = (e) => updateVoiceSetting('backgroundColor', e.target.value);
          document.getElementById('voice-waveform-color').oninput = (e) => updateVoiceSetting('waveformColor', e.target.value);
          document.getElementById('voice-duration-color').oninput = (e) => updateVoiceSetting('durationColor', e.target.value);
        }

        function updateVoiceSetting(key, value) {
          const config = getActiveVoiceConfig();
          config[key] = value;
          
          saveCurrentBubbleState();
          // renderVoiceUI(); // input already shows new value, no need to re-render self
          updateSettingsPreview();
        }

        function updateBubbleSetting(path, value) {
          const config = getActiveBubbleConfig();
          
          if (path.includes('.')) {
            const [parent, child] = path.split('.');
            config[parent][child] = value;
          } else {
            config[path] = value;
          }
          
          // Auto-save logic
          saveCurrentBubbleState();
          
          // Re-render to update dependent UI (like linear/radial visibility)
          renderBubbleUI();
          updateSettingsPreview();
        }

        function updateGradientStop(index, field, value) {
          const config = getActiveBubbleConfig();
          if (field === 'position') value = parseInt(value);
          config.gradient.stops[index][field] = value;
          saveCurrentBubbleState();
          renderBubbleUI(); // Re-render to show updated % value text
          updateSettingsPreview();
        }

        function addGradientStop() {
          const config = getActiveBubbleConfig();
          if (config.gradient.stops.length >= 5) return showCustomAlert("提示", '最多支持5个颜色节点');
          
          // Insert in middle or at end
          const lastStop = config.gradient.stops[config.gradient.stops.length - 1];
          config.gradient.stops.push({ color: lastStop.color, position: 100 });
          
          // Redistribute positions linearly? No, just let user drag.
          
          saveCurrentBubbleState();
          renderBubbleUI();
          updateSettingsPreview();
        }

        function removeGradientStop(index) {
          const config = getActiveBubbleConfig();
          if (config.gradient.stops.length <= 2) return;
          
          config.gradient.stops.splice(index, 1);
          saveCurrentBubbleState();
          renderBubbleUI();
          updateSettingsPreview();
        }

        function resetBubbleSettings() {
          const defaults = BUBBLE_SETTINGS_DEFAULTS.text[currentBubbleTarget];
          // Deep clone default to reset
          currentBubbleState.text[currentBubbleTarget] = JSON.parse(JSON.stringify(defaults));
          
          saveCurrentBubbleState();
          renderBubbleUI();
          updateSettingsPreview();
        }

        function saveCurrentBubbleState() {
           // Persist to DB via debounced saver
           debouncedSaveBubbleSettings(currentBubbleChatId, currentBubbleState);
        }

        // --- End Bubble Settings UI Logic ---

        const STICKER_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
        const MESSAGE_RENDER_WINDOW = 50;
        let currentRenderedCount = 0;
        let lastKnownBatteryLevel = 1;
        let alertFlags = {
          hasShown40: false,
          hasShown20: false,
          hasShown10: false,
        };
        let batteryAlertTimeout;
        const dynamicFontStyle = document.createElement("style");
        dynamicFontStyle.id = "dynamic-font-style";
        document.head.appendChild(dynamicFontStyle);

        const modalOverlay = document.getElementById("custom-modal-overlay");
        const modalTitle = document.getElementById("custom-modal-title");
        const modalBody = document.getElementById("custom-modal-body");
        const modalConfirmBtn = document.getElementById("custom-modal-confirm");
        const modalCancelBtn = document.getElementById("custom-modal-cancel");
        let modalResolve;

        function showCustomModal() {
          modalOverlay.classList.add("visible");
        }

        function hideCustomModal() {
          modalOverlay.classList.remove("visible");
          modalConfirmBtn.classList.remove("btn-danger");
          if (modalResolve) modalResolve(null);
        }

        function showCustomConfirm(title, message, options = {}) {
          return new Promise((resolve) => {
            modalResolve = resolve;
            modalTitle.textContent = title;
            modalBody.innerHTML = `<p>${message}</p>`;
            modalCancelBtn.style.display = "block";
            modalConfirmBtn.textContent = "确定";
            if (options.confirmButtonClass)
              modalConfirmBtn.classList.add(options.confirmButtonClass);
            modalConfirmBtn.onclick = () => {
              resolve(true);
              hideCustomModal();
            };
            modalCancelBtn.onclick = () => {
              resolve(false);
              hideCustomModal();
            };
            showCustomModal();
          });
        }

        function showCustomAlert(title, message) {
          return new Promise((resolve) => {
            modalResolve = resolve;
            modalTitle.textContent = title;
            modalBody.innerHTML = `<div style="text-align: center; white-space: pre-wrap; display: flex; align-items: center; justify-content: center; min-height: 30px; width: 100%;">${message}</div>`;
            modalCancelBtn.style.display = "none";
            modalConfirmBtn.textContent = "好的";
            modalConfirmBtn.onclick = () => {
              modalCancelBtn.style.display = "block";
              modalConfirmBtn.textContent = "确定";
              resolve(true);
              hideCustomModal();
            };
            showCustomModal();
          });
        }

        function showCustomPrompt(
          title,
          placeholder,
          initialValue = "",
          type = CONSTANTS.MSG_TYPES.TEXT,
          extraHtml = "",
        ) {
          return new Promise((resolve) => {
            modalResolve = resolve;
            modalTitle.textContent = title;
            const inputId = "custom-prompt-input";

            const inputHtml =
              type === "textarea"
                ? `<textarea id="${inputId}" placeholder="${placeholder}" rows="4" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px; box-sizing: border-box; resize: vertical;">${initialValue}</textarea>`
                : `<input type="${type}" id="${inputId}" placeholder="${placeholder}" value="${initialValue}">`;

            // 将额外的HTML和输入框组合在一起
            modalBody.innerHTML = extraHtml + inputHtml;
            const input = document.getElementById(inputId);

            // 为格式助手按钮绑定事件
            modalBody.querySelectorAll(".format-btn").forEach((btn) => {
              btn.addEventListener("click", () => {
                const templateStr = btn.dataset.template;
                if (templateStr) {
                  try {
                    const templateObj = JSON.parse(templateStr);
                    // 使用 null, 2 参数让JSON字符串格式化，带缩进，更易读
                    input.value = JSON.stringify(templateObj, null, 2);
                    input.focus();
                  } catch (e) {
                    console.error("解析格式模板失败:", e);
                  }
                }
              });
            });

            modalConfirmBtn.onclick = () => {
              resolve(input.value);
              hideCustomModal();
            };
            modalCancelBtn.onclick = () => {
              resolve(null);
              hideCustomModal();
            };

            // 1. 显示模态框 (修改 DOM/CSS 状态)
            showCustomModal();

            // 2. 核心优化：多重聚焦策略

            // 策略A：立即聚焦
            // 针对高性能设备，尝试在当前同步执行栈中直接聚焦，这是 iOS 最喜欢的“直接交互”。
            // 虽然此时元素可能还没完全渲染可见，但在 DOM 树中 display 属性已变更为非 none。
            input.focus();

            // 策略B：下一帧聚焦
            // 如果策略A失败（因为浏览器还没重排），请求在下一帧渲染前聚焦。
            // requestAnimationFrame 通常会被浏览器视为用户交互的一部分。
            requestAnimationFrame(() => {
              input.focus();
            });

            // 策略C：保底延时
            // 针对老旧安卓设备或渲染极慢的情况，稍微延长等待时间。
            // 即使 iOS 在这里拦截了键盘，上面的 A 或 B 应该已经成功了。
            setTimeout(() => {
              if (document.activeElement !== input) {
                input.focus();
              }
            }, 150);
          });
        }

        // ===================================================================
        // 2. 数据库结构定义
        // ===================================================================

        db.version(24)
          .stores({
            chats: "&id, isGroup, groupId",
            // apiConfig: "&id", // <- 移除旧表
            apiConfigs: "++id, name", // <- 新增，用于存储多个API配置
            globalSettings: "&id",
            userStickers: "&id, url, name",
            worldBooks: "&id, name, categoryId",
            worldBookCategories: "++id, name",
            musicLibrary: "&id",
            personaPresets: "&id",
            qzoneSettings: "&id",
            qzonePosts: "++id, timestamp",
            qzoneAlbums: "++id, name, createdAt",
            qzonePhotos: "++id, albumId",
            favorites: "++id, type, timestamp, originalTimestamp",
            qzoneGroups: "++id, name",
            memories: "++id, chatId, timestamp, type, targetDate",
            callRecords: "++id, chatId, timestamp, customName",
          })
          .upgrade(async (tx) => {
            // 数据迁移脚本：从旧的单个 apiConfig 迁移到新的 apiConfigs 列表
            const oldConfig = await tx.table("apiConfig").get("main");
            if (oldConfig) {
              console.log("检测到旧版API配置，正在执行自动迁移...");
              const newConfigsTable = tx.table("apiConfigs");
              const existingConfigs = await newConfigsTable.toArray();
              if (existingConfigs.length === 0) {
                const newId = await newConfigsTable.add({
                  name: "默认配置",
                  url: oldConfig.proxyUrl || "",
                  apiKey: oldConfig.apiKey || "",
                  model: oldConfig.model || "",
                  enableStream: oldConfig.enableStream || false,
                  hideStreamResponse: oldConfig.hideStreamResponse || false,
                });

                const globalSettings = (await tx
                  .table("globalSettings")
                  .get("main")) || { id: "main" };
                globalSettings.activeApiConfigId = newId;
                await tx.table("globalSettings").put(globalSettings);

                await tx.table("apiConfig").clear();
                console.log("API配置迁移成功！");
              }
            }
          });

        // ===================================================================
        // 3. 所有功能函数定义
        // ===================================================================

        function showScreen(screenId) {
          if (screenId === "chat-list-screen") {
            window.renderChatListProxy();
            switchToChatListView("messages-view");
          }
          if (screenId === "api-settings-screen")
            window.renderApiSettingsProxy();
          if (screenId === "wallpaper-screen")
            window.renderWallpaperScreenProxy();
          if (screenId === "world-book-screen")
            window.renderWorldBookScreenProxy();
          document
            .querySelectorAll(".screen")
            .forEach((s) => s.classList.remove("active"));
          const screenToShow = document.getElementById(screenId);
          if (screenToShow) screenToShow.classList.add("active");
          if (screenId === "chat-interface-screen") {
            document
              .getElementById("chat-interface-screen")
              .classList.remove("settings-open");
            window.updateListenTogetherIconProxy(state.activeChatId);
          }
          if (screenId === "font-settings-screen") {
            document.getElementById("font-url-input").value =
              state.globalSettings.fontUrl || "";
            applyCustomFont(state.globalSettings.fontUrl || "", true);
          }
        }
        window.updateListenTogetherIconProxy = () => {};

        function switchToChatListView(viewId) {
          const chatListScreen = DOM.get("chat-list-screen");
          const views = {
            "messages-view": document.getElementById("messages-view"),
            "qzone-screen": document.getElementById("qzone-screen"),
            "favorites-view": document.getElementById("favorites-view"),
            "memories-view": document.getElementById("memories-view"), // <-- 新增这一行
          };
          const mainHeader = document.getElementById("main-chat-list-header");
          const mainBottomNav = document.getElementById("chat-list-bottom-nav"); // 获取主导航栏

          if (isFavoritesSelectionMode) {
            document.getElementById("favorites-edit-btn").click();
          }

          // 隐藏所有视图
          Object.values(views).forEach((v) => v.classList.remove("active"));
          // 显示目标视图
          if (views[viewId]) {
            views[viewId].classList.add("active");
          }

          // 更新底部导航栏高亮
          document
            .querySelectorAll("#chat-list-bottom-nav .nav-item")
            .forEach((item) => {
              item.classList.toggle("active", item.dataset.view === viewId);
            });

          if (viewId === "messages-view") {
            mainHeader.style.display = "flex";
            mainBottomNav.style.display = "flex";
          } else {
            mainHeader.style.display = "none";
            mainBottomNav.style.display = "none";
          }

          if (viewId !== "memories-view") {
            activeCountdownTimers.forEach((timerId) => clearInterval(timerId));
            activeCountdownTimers = [];
          }

          // 根据视图ID执行特定的渲染/更新逻辑
          switch (viewId) {
            case "qzone-screen":
              views["qzone-screen"].style.backgroundColor = "#f0f2f5";
              updateUnreadIndicator(0);
              renderQzoneScreen();
              renderQzonePosts();
              break;
            case "favorites-view":
              views["favorites-view"].style.backgroundColor = "#f9f9f9";
              renderFavoritesScreen();
              break;
            case "messages-view":
              // 如果需要，可以在这里添加返回消息列表时要执行的逻辑
              break;
          }
        }

        function renderQzoneScreen() {
          if (state && state.qzoneSettings) {
            const settings = state.qzoneSettings;
            document.getElementById("qzone-nickname").textContent =
              settings.nickname;
            document.getElementById("qzone-avatar-img").src = settings.avatar;
            document.getElementById("qzone-banner-img").src = settings.banner;
          }
        }
        window.renderQzoneScreenProxy = renderQzoneScreen;

        async function saveQzoneSettings() {
          if (db && state.qzoneSettings) {
            await db.qzoneSettings.put(state.qzoneSettings);
          }
        }

        function formatPostTimestamp(timestamp) {
          if (!timestamp) return "";
          const now = new Date();
          const date = new Date(timestamp);
          const diffSeconds = Math.floor((now - date) / 1000);
          const diffMinutes = Math.floor(diffSeconds / 60);
          const diffHours = Math.floor(diffMinutes / 60);
          if (diffMinutes < 1) return "刚刚";
          if (diffMinutes < 60) return `${diffMinutes}分钟前`;
          if (diffHours < 24) return `${diffHours}小时前`;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          if (now.getFullYear() === year) {
            return `${month}-${day} ${hours}:${minutes}`;
          } else {
            return `${year}-${month}-${day} ${hours}:${minutes}`;
          }
        }

        async function renderQzonePosts() {
          const postsListEl = document.getElementById("qzone-posts-list");
          if (!postsListEl) return;

          const [posts, favorites] = await Promise.all([
            db.qzonePosts.orderBy("timestamp").reverse().toArray(),
            db.favorites.where("type").equals("qzone_post").toArray(),
          ]);

          const favoritedPostIds = new Set(
            favorites.map((fav) => fav.content.id),
          );

          postsListEl.innerHTML = "";

          if (posts.length === 0) {
            postsListEl.innerHTML =
              '<p style="text-align:center; color: var(--text-secondary); padding: 30px 0;">这里空空如也，快来发布第一条说说吧！</p>';
            return;
          }

          const userSettings = state.qzoneSettings;
          
          const fragment = document.createDocumentFragment();

          posts.forEach((post) => {
            const postContainer = document.createElement("div");
            postContainer.className = "qzone-post-container";
            postContainer.dataset.postId = post.id;

            const postEl = document.createElement("div");
            postEl.className = "qzone-post-item";

            let authorAvatar = "",
              authorNickname = "",
              commentAvatar = userSettings.avatar;

            if (post.authorId === CONSTANTS.ROLES.USER) {
              authorAvatar = userSettings.avatar;
              authorNickname = userSettings.nickname;
            } else if (state.chats[post.authorId]) {
              const authorChat = state.chats[post.authorId];
              authorAvatar = authorChat.settings.aiAvatar || defaultAvatar;
              authorNickname = authorChat.name;
            } else {
              authorAvatar = defaultAvatar;
              authorNickname = "{{char}}";
            }

            let contentHtml = "";
            const publicTextHtml = post.publicText
              ? `<div class="post-content">${post.publicText.replace(
                  /\n/g,
                  "<br>",
                )}</div>`
              : "";

            if (post.type === "shuoshuo") {
              contentHtml = `<div class="post-content" style="margin-bottom: 10px;">${post.content.replace(
                /\n/g,
                "<br>",
              )}</div>`;
            } else if (post.type === "image_post" && post.imageUrl) {
              contentHtml = publicTextHtml
                ? `${publicTextHtml}<div style="margin-top:10px;"><img src="${post.imageUrl}" class="chat-image"></div>`
                : `<img src="${post.imageUrl}" class="chat-image">`;
            } else if (post.type === "text_image") {
              contentHtml = publicTextHtml
                ? `${publicTextHtml}<div style="margin-top:10px;"><img src="https://i.postimg.cc/KYr2qRCK/1.jpg" class="chat-image" style="cursor: pointer;" data-hidden-text="${post.hiddenContent}"></div>`
                : `<img src="https://i.postimg.cc/KYr2qRCK/1.jpg" class="chat-image" style="cursor: pointer;" data-hidden-text="${post.hiddenContent}">`;
            }

            let likesHtml = "";
            if (post.likes && post.likes.length > 0) {
              likesHtml = `<div class="post-likes-section"><svg class="like-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span>${post.likes.join(
                "、",
              )} 觉得很赞</span></div>`;
            }

            let commentsHtml = "";
            if (post.comments && post.comments.length > 0) {
              commentsHtml = '<div class="post-comments-container">';
              // ★★★★★【核心修改就在这里】★★★★★
              // 遍历评论时，我们传入 comment 对象本身和它的索引 index
              post.comments.forEach((comment, index) => {
                // 在评论项的末尾，添加一个带有 data-comment-index 属性的删除按钮
                commentsHtml += `
                          <div class="comment-item">
                              <span class="commenter-name">${comment.commenterName}:</span>
                              <span class="comment-text">${comment.text}</span>
                              <span class="comment-delete-btn" data-comment-index="${index}">×</span>
                          </div>`;
              });
              // ★★★★★【修改结束】★★★★★
              commentsHtml += "</div>";
            }

            const userNickname = state.qzoneSettings.nickname;
            const isLikedByUser =
              post.likes && post.likes.includes(userNickname);
            const isFavoritedByUser = favoritedPostIds.has(post.id);

            postEl.innerHTML = `
                  <div class="post-header"><img src="${authorAvatar}" class="post-avatar"><div class="post-info"><span class="post-nickname">${authorNickname}</span><span class="post-timestamp">${formatPostTimestamp(
                    post.timestamp,
                  )}</span></div>
                      <div class="post-actions-btn">…</div>
                  </div>
                  <div class="post-main-content">${contentHtml}</div>
                  <div class="post-feedback-icons">
                      <span class="action-icon like ${
                        isLikedByUser ? "active" : ""
                      }"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></span>
                      <span class="action-icon favorite ${
                        isFavoritedByUser ? "active" : ""
                      }"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></span>
                  </div>
                  ${likesHtml}
                  ${commentsHtml}
                  <div class="post-footer"><div class="comment-section"><img src="${commentAvatar}" class="comment-avatar"><input type=CONSTANTS.MSG_TYPES.TEXT class="comment-input" placeholder="友善的评论是交流的起点"><div class="at-mention-popup"></div></div><button class="comment-send-btn">发送</button></div>
              `;

            const deleteAction = document.createElement("div");
            deleteAction.className = "qzone-post-delete-action";
            deleteAction.innerHTML = "<span>删除</span>";
            postContainer.appendChild(postEl);
            postContainer.appendChild(deleteAction);
            const commentSection =
              postContainer.querySelector(".comment-section");
            if (commentSection) {
              commentSection.addEventListener("touchstart", (e) =>
                e.stopPropagation(),
              );
              commentSection.addEventListener("mousedown", (e) =>
                e.stopPropagation(),
              );
            }
            postsListEl.appendChild(postContainer);
            const commentInput = postContainer.querySelector(".comment-input");
            const popup = postContainer.querySelector(".at-mention-popup");
            commentInput.addEventListener("input", () => {
              const value = commentInput.value;
              const atMatch = value.match(/@([\p{L}\w]*)$/u);
              if (atMatch) {
                const namesToMention = new Set();
                const authorNickname =
                  postContainer.querySelector(".post-nickname")?.textContent;
                if (authorNickname) namesToMention.add(authorNickname);
                postContainer
                  .querySelectorAll(".commenter-name")
                  .forEach((nameEl) => {
                    namesToMention.add(nameEl.textContent.replace(":", ""));
                  });
                namesToMention.delete(state.qzoneSettings.nickname);
                popup.innerHTML = "";
                if (namesToMention.size > 0) {
                  const searchTerm = atMatch[1];
                  namesToMention.forEach((name) => {
                    if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                      const item = document.createElement("div");
                      item.className = "at-mention-item";
                      item.textContent = name;
                      item.addEventListener("mousedown", (e) => {
                        e.preventDefault();
                        const newText =
                          value.substring(0, atMatch.index) + `@${name} `;
                        commentInput.value = newText;
                        popup.style.display = "none";
                        commentInput.focus();
                      });
                      popup.appendChild(item);
                    }
                  });
                  popup.style.display =
                    popup.children.length > 0 ? "block" : "none";
                } else {
                  popup.style.display = "none";
                }
              } else {
                popup.style.display = "none";
              }
            });
            commentInput.addEventListener("blur", () => {
              setTimeout(() => {
                popup.style.display = "none";
              }, 200);
            });
            fragment.appendChild(postContainer);
          });
          
          postsListEl.appendChild(fragment);
        }

        function displayFilteredFavorites(items) {
          const listEl = document.getElementById("favorites-list");
          listEl.innerHTML = "";

          if (items.length === 0) {
            const searchTerm = document.getElementById(
              "favorites-search-input",
            ).value;
            const message = searchTerm
              ? "未找到相关收藏"
              : "你的收藏夹是空的，<br>快去动态或聊天中收藏喜欢的内容吧！";
            listEl.innerHTML = `<p style="text-align:center; color: var(--text-secondary); padding: 50px 0;">${message}</p>`;
            return;
          }

          const fragment = document.createDocumentFragment();
          for (const item of items) {
            const card = document.createElement("div");
            card.className = "favorite-item-card";
            card.dataset.favid = item.id;

            let headerHtml = "",
              contentHtml = "",
              sourceText = "",
              footerHtml = "";

            if (item.type === "qzone_post") {
              const post = item.content;
              sourceText = "来自动态";
              let authorAvatar = defaultAvatar,
                authorNickname = "未知用户";

              if (post.authorId === CONSTANTS.ROLES.USER) {
                authorAvatar = state.qzoneSettings.avatar;
                authorNickname = state.qzoneSettings.nickname;
              } else if (state.chats[post.authorId]) {
                authorAvatar = state.chats[post.authorId].settings.aiAvatar;
                authorNickname = state.chats[post.authorId].name;
              }

              headerHtml = `<img src="${authorAvatar}" class="avatar"><div class="info"><div class="name">${authorNickname}</div></div>`;

              const publicTextHtml = post.publicText
                ? `<div class="post-content">${post.publicText.replace(
                    /\n/g,
                    "<br>",
                  )}</div>`
                : "";
              if (post.type === "shuoshuo") {
                contentHtml = `<div class="post-content">${post.content.replace(
                  /\n/g,
                  "<br>",
                )}</div>`;
              } else if (post.type === "image_post" && post.imageUrl) {
                contentHtml = publicTextHtml
                  ? `${publicTextHtml}<div style="margin-top:10px;"><img src="${post.imageUrl}" class="chat-image"></div>`
                  : `<img src="${post.imageUrl}" class="chat-image">`;
              } else if (post.type === "text_image") {
                contentHtml = publicTextHtml
                  ? `${publicTextHtml}<div style="margin-top:10px;"><img src="https://i.postimg.cc/KYr2qRCK/1.jpg" class="chat-image" style="cursor: pointer;" data-hidden-text="${post.hiddenContent}"></div>`
                  : `<img src="https://i.postimg.cc/KYr2qRCK/1.jpg" class="chat-image" style="cursor: pointer;" data-hidden-text="${post.hiddenContent}">`;
              }

              // 1. 构造点赞区域的HTML
              let likesHtml = "";
              // 检查 post 对象中是否存在 likes 数组并且不为空
              if (post.likes && post.likes.length > 0) {
                // 如果存在，就创建点赞区域的 div
                likesHtml = `
                          <div class="post-likes-section">
                              <svg class="like-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                              <span>${post.likes.join("、")} 觉得很赞</span>
                          </div>`;
              }

              // 2. 构造评论区域的HTML
              let commentsHtml = "";
              // 检查 post 对象中是否存在 comments 数组并且不为空
              if (post.comments && post.comments.length > 0) {
                // 如果存在，就创建评论容器，并遍历每一条评论
                commentsHtml = '<div class="post-comments-container">';
                post.comments.forEach((comment) => {
                  commentsHtml += `
                              <div class="comment-item">
                                  <span class="commenter-name">${comment.commenterName}:</span>
                                  <span class="comment-text">${comment.text}</span>
                              </div>`;
                });
                commentsHtml += "</div>";
              }

              // 3. 将点赞和评论的HTML组合到 footerHtml 中
              footerHtml = `${likesHtml}${commentsHtml}`;
            } else if (item.type === "chat_message") {
              const msg = item.content;
              const chat = state.chats[item.chatId];
              if (!chat) continue;

              sourceText = `来自与 ${chat.name} 的聊天`;
              const isUser = msg.role === CONSTANTS.ROLES.USER;
              let senderName, senderAvatar;

              if (isUser) {
                // 用户消息的逻辑保持不变
                senderName = chat.isGroup
                  ? chat.settings.myNickname || "我"
                  : "我";
                senderAvatar =
                  chat.settings.myAvatar ||
                  (chat.isGroup ? defaultMyGroupAvatar : defaultAvatar);
              } else {
                // AI/成员消息
                if (chat.isGroup) {
                  const memberInfo = getMemberInfo(chat, msg.senderName);
                  senderName = msg.senderName;
                  senderAvatar = memberInfo.avatar;
                } else {
                  // 单聊的逻辑保持不变
                  senderName = chat.name;
                  senderAvatar = chat.settings.aiAvatar || defaultAvatar;
                }
              }

              // 后续拼接 headerHtml 和 contentHtml 的逻辑都保持不变
              headerHtml = `<img src="${senderAvatar}" class="avatar"><div class="info"><div class="name">${senderName}</div></div>`;

              if (
                typeof msg.content === "string" &&
                STICKER_REGEX.test(msg.content)
              ) {
                contentHtml = `<img src="${msg.content}" class="sticker-image" style="max-width: 80px; max-height: 80px;">`;
              } else if (
                Array.isArray(msg.content) &&
                msg.content[0]?.type === "image_url"
              ) {
                contentHtml = `<img src="${msg.content[0].image_url.url}" class="chat-image">`;
              } else {
                contentHtml = `<div class="message-text-wrapper">${String(msg.content || "").replace(/\n/g, "<br>")}</div>`;
              }
            }

            card.innerHTML = `
                  <div class="fav-card-header">${headerHtml}<div class="source">${sourceText}</div></div>
                  <div class="fav-card-content">${contentHtml}</div>
                  ${footerHtml}`; // <-- 把我们新创建的 footerHtml 放在这里

            fragment.appendChild(card);
          }
          listEl.appendChild(fragment);
        }

        /**
         * 【重构后的函数】: 负责准备数据并触发渲染
         */
        async function renderFavoritesScreen() {
          // 1. 从数据库获取最新数据并缓存
          allFavoriteItems = await db.favorites
            .orderBy("timestamp")
            .reverse()
            .toArray();

          // 2. 清空搜索框并隐藏清除按钮
          const searchInput = document.getElementById("favorites-search-input");
          const clearBtn = document.getElementById(
            "favorites-search-clear-btn",
          );
          searchInput.value = "";
          clearBtn.style.display = "none";

          // 3. 显示所有收藏项
          displayFilteredFavorites(allFavoriteItems);
        }

        function resetCreatePostModal() {
          document.getElementById("post-public-text").value = "";
          document.getElementById("post-image-preview").src = "";
          document.getElementById("post-image-description").value = "";
          document
            .getElementById("post-image-preview-container")
            .classList.remove("visible");
          document.getElementById("post-image-desc-group").style.display =
            "none";
          document.getElementById("post-local-image-input").value = "";
          document.getElementById("post-hidden-text").value = "";
          document.getElementById("switch-to-image-mode").click();
        }

        async function exportBackup() {
          try {
            const backupData = {
              version: 2,
              timestamp: Date.now(),
            };

            const [
              chats,
              worldBooks,
              userStickers,
              apiConfigs,
              globalSettings,
              personaPresets,
              musicLibrary,
              qzoneSettings,
              qzonePosts,
              qzoneAlbums,
              qzonePhotos,
              favorites,
              qzoneGroups,
              memories,
              worldBookCategories,
              callRecords,
            ] = await Promise.all([
              db.chats.toArray(),
              db.worldBooks.toArray(),
              db.userStickers.toArray(),
              db.apiConfigs.toArray(),
              db.globalSettings.get("main"),
              db.personaPresets.toArray(),
              db.musicLibrary.get("main"),
              db.qzoneSettings.get("main"),
              db.qzonePosts.toArray(),
              db.qzoneAlbums.toArray(),
              db.qzonePhotos.toArray(),
              db.favorites.toArray(),
              db.qzoneGroups.toArray(),
              db.memories.toArray(),
              db.worldBookCategories.toArray(),
              db.callRecords.toArray(),
            ]);

            Object.assign(backupData, {
              chats,
              worldBooks,
              userStickers,
              apiConfigs,
              globalSettings,
              personaPresets,
              musicLibrary,
              qzoneSettings,
              qzonePosts,
              qzoneAlbums,
              qzonePhotos,
              favorites,
              qzoneGroups,
              memories,
              worldBookCategories,
              callRecords,
            });

            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const link = Object.assign(document.createElement("a"), {
              href: url,
              download: `EPhone-Full-Backup-${
                new Date().toISOString().split("T")[0]
              }.json`,
            });
            link.click();
            URL.revokeObjectURL(url);

            await showCustomAlert("导出成功", "已成功导出所有数据！");
          } catch (error) {
            console.error("导出数据时出错:", error);
            await showCustomAlert(
              "导出失败",
              `发生了一个错误: ${error.message}`,
            );
          }
        }

        async function importBackup(file) {
          if (!file) return;

          const confirmed = await showCustomConfirm(
            "严重警告！",
            "导入备份将完全覆盖您当前的所有数据，包括聊天、动态、设置等。此操作不可撤销！您确定要继续吗？",
            { confirmButtonClass: "btn-danger" },
          );

          if (!confirmed) return;

          try {
            const text = await file.text();
            const data = JSON.parse(text);

            await db.transaction("rw", db.tables, async () => {
              for (const table of db.tables) {
                await table.clear();
              }

              if (Array.isArray(data.chats)) await db.chats.bulkPut(data.chats);
              if (Array.isArray(data.worldBooks))
                await db.worldBooks.bulkPut(data.worldBooks);
              if (Array.isArray(data.worldBookCategories))
                await db.worldBookCategories.bulkPut(data.worldBookCategories);
              if (Array.isArray(data.userStickers))
                await db.userStickers.bulkPut(data.userStickers);
              if (Array.isArray(data.personaPresets))
                await db.personaPresets.bulkPut(data.personaPresets);
              if (Array.isArray(data.qzonePosts))
                await db.qzonePosts.bulkPut(data.qzonePosts);
              if (Array.isArray(data.qzoneAlbums))
                await db.qzoneAlbums.bulkPut(data.qzoneAlbums);
              if (Array.isArray(data.qzonePhotos))
                await db.qzonePhotos.bulkPut(data.qzonePhotos);
              if (Array.isArray(data.favorites))
                await db.favorites.bulkPut(data.favorites);
              if (Array.isArray(data.qzoneGroups))
                await db.qzoneGroups.bulkPut(data.qzoneGroups);
              if (Array.isArray(data.memories))
                await db.memories.bulkPut(data.memories);
              if (Array.isArray(data.callRecords))
                await db.callRecords.bulkPut(data.callRecords);

              if (Array.isArray(data.apiConfigs)) {
                await db.apiConfigs.bulkPut(data.apiConfigs);
              } else if (data.apiConfig) {
                await db.apiConfigs.add({
                  name: "导入的旧配置",
                  url: data.apiConfig.proxyUrl || "",
                  apiKey: data.apiConfig.apiKey || "",
                  model: data.apiConfig.model || "",
                  enableStream: data.apiConfig.enableStream || false,
                  hideStreamResponse:
                    data.apiConfig.hideStreamResponse || false,
                });
                console.log("已将旧版API配置迁移到新结构。");
              }

              if (data.globalSettings) {
                await db.globalSettings.put(data.globalSettings);
              }

              if (data.musicLibrary)
                await db.musicLibrary.put(data.musicLibrary);
              if (data.qzoneSettings)
                await db.qzoneSettings.put(data.qzoneSettings);
            });

            await showCustomAlert(
              "导入成功",
              "所有数据已成功恢复！应用即将刷新以应用所有更改。",
            );

            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } catch (error) {
            console.error("导入数据时出错:", error);
            await showCustomAlert(
              "导入失败",
              `文件格式不正确或数据已损坏: ${error.message}`,
            );
          }
        }
        function applyCustomFont(fontUrl, isPreviewOnly = false) {
          if (!fontUrl) {
            dynamicFontStyle.innerHTML = "";
            document.getElementById("font-preview").style.fontFamily = "";
            return;
          }
          const fontName = "custom-user-font";
          const newStyle = `
                      @font-face {
                        font-family: '${fontName}';
                        src: url('${fontUrl}');
                        font-display: swap;
                      }`;
          if (isPreviewOnly) {
            const previewStyle =
              document.getElementById("preview-font-style") ||
              document.createElement("style");
            previewStyle.id = "preview-font-style";
            previewStyle.innerHTML = newStyle;
            if (!document.getElementById("preview-font-style"))
              document.head.appendChild(previewStyle);
            document.getElementById("font-preview").style.fontFamily =
              `'${fontName}', 'bulangni', sans-serif`;
          } else {
            dynamicFontStyle.innerHTML = `
                          ${newStyle}
                          body {
                            font-family: '${fontName}', 'bulangni', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                          }`;
          }
        }

        async function resetToDefaultFont() {
          dynamicFontStyle.innerHTML = "";
          state.globalSettings.fontUrl = "";
          await db.globalSettings.put(state.globalSettings);
          document.getElementById("font-url-input").value = "";
          document.getElementById("font-preview").style.fontFamily = "";
          showCustomAlert("提示", "已恢复默认字体。");
        }

        async function loadAllDataFromDB() {
          const [
            chatsArr,
            apiConfigs, // <-- 修改这里
            globalSettings,
            userStickers,
            worldBooks,
            musicLib,
            personaPresets,
            qzoneSettings,
            initialFavorites,
          ] = await Promise.all([
            db.chats.toArray(),
            db.apiConfigs.toArray(), // <-- 修改这里
            db.globalSettings.get("main"),
            db.userStickers.toArray(),
            db.worldBooks.toArray(),
            db.musicLibrary.get("main"),
            db.personaPresets.toArray(),
            db.qzoneSettings.get("main"),
            db.favorites.orderBy("timestamp").reverse().toArray(),
          ]);

          state.chats = chatsArr.reduce((acc, chat) => {
            if (typeof chat.unreadCount === "undefined") {
              chat.unreadCount = 0; // 如果这个聊天对象没有 unreadCount 属性，就给它初始化为 0
            }

            // ★★★【核心重构：数据迁移脚本】★★★
            // 检查是否是群聊，并且其成员对象使用的是旧的 `name` 结构
            if (
              chat.isGroup &&
              chat.members &&
              chat.members.length > 0 &&
              chat.members[0].name
            ) {
              console.log(
                `检测到旧版群聊数据 for "${chat.name}"，正在执行迁移...`,
              );
              chat.members.forEach((member) => {
                // 如果这个成员对象没有 originalName，说明是旧数据
                if (typeof member.originalName === "undefined") {
                  member.originalName = member.name; // 将旧的 name 作为 originalName
                  member.groupNickname = member.name; // 同时创建一个初始的 groupNickname
                  delete member.name; // 删除旧的、有歧义的 name 字段
                  needsUpdate = true; // 标记需要存回数据库
                }
              });
              console.log(`迁移完成 for "${chat.name}"`);
            }

            // 检查1：如果是一个单聊，并且没有 status 属性
            if (!chat.isGroup && !chat.status) {
              // 就为它补上一个默认的 status 对象
              chat.status = {
                text: CONSTANTS.STATUS.ONLINE,
                lastUpdate: Date.now(),
                isBusy: false,
              };
              console.log(`为旧角色 "${chat.name}" 补全了status属性。`);
            }

            // 检查2：兼容最新的“关系”功能
            if (!chat.isGroup && !chat.relationship) {
              // 如果是单聊，且没有 relationship 对象，就补上一个默认的
              chat.relationship = {
                status: "friend",
                blockedTimestamp: null,
                applicationReason: "",
              };
              console.log(`为旧角色 "${chat.name}" 补全了 relationship 属性。`);
            }

            if (
              !chat.isGroup &&
              (!chat.settings || !chat.settings.aiAvatarLibrary)
            ) {
              if (!chat.settings) chat.settings = {}; // 以防万一连settings都没有
              chat.settings.aiAvatarLibrary = [];
              console.log(
                `为旧角色 "${chat.name}" 补全了aiAvatarLibrary属性。`,
              );
            }

            if (!chat.settings.summary) {
              chat.settings.summary = {
                enabled: false,
                mode: "manual", // 'manual' or 'auto'
                count: 50, // summarize every 50 messages
                prompt: "请总结上述对话的主要内容，保留重要信息和情感脉络。",
                lastSummaryIndex: -1,
                useCustomApi: false,
                customApiUrl: "",
                customApiKey: "",
                customModel: "gpt-4o-mini",
                enableStream: false,
              };
            } else {
              // Migration for existing chats
              if (chat.settings.summary.useCustomApi === undefined) {
                chat.settings.summary.useCustomApi = false;
                chat.settings.summary.customApiUrl = "";
                chat.settings.summary.customApiKey = "";
                chat.settings.summary.customModel = "gpt-4o-mini";
                chat.settings.summary.enableStream = false;
              }
            }

            if (!chat.musicData) chat.musicData = { totalTime: 0 };
            if (
              chat.settings &&
              chat.settings.linkedWorldBookId &&
              !chat.settings.linkedWorldBookIds
            ) {
              chat.settings.linkedWorldBookIds = [
                chat.settings.linkedWorldBookId,
              ];
              delete chat.settings.linkedWorldBookId;
            }
            acc[chat.id] = chat;
            return acc;
          }, {});
          state.apiConfigs = apiConfigs || [];

          state.globalSettings = globalSettings || {
            id: "main",
            wallpaper: "linear-gradient(135deg, #89f7fe, #66a6ff)",
            fontUrl: "",
            enableBackgroundActivity: false,
            backgroundActivityInterval: 60,
            blockCooldownHours: 1,
            appIcons: { ...DEFAULT_APP_ICONS }, // 【核心修改】确保appIcons存在并有默认值
            framelessOnMobile: false, // 【核心新增】默认不开启无边框模式
            frameColor: "#ffffff", // 【核心新增】默认外框颜色
            showSizePanel: false, // 新增：默认隐藏尺寸控制面板
          };
          // 【核心修改】合并已保存的图标和默认图标，防止更新后旧数据丢失新图标
          state.globalSettings.appIcons = {
            ...DEFAULT_APP_ICONS,
            ...(state.globalSettings.appIcons || {}),
          };

          state.userStickers = userStickers || [];
          state.worldBooks = worldBooks || [];
          musicState.playlist = musicLib?.playlist || [];
          state.personaPresets = personaPresets || [];
          state.qzoneSettings = qzoneSettings || {
            id: "main",
            nickname: "{{user}}",
            avatar: "https://files.catbox.moe/q6z5fc.jpeg",
            banner: "https://files.catbox.moe/r5heyt.gif",
          };

          allFavoriteItems = initialFavorites || [];
        }

        async function saveGlobalPlaylist() {
          await db.musicLibrary.put({
            id: "main",
            playlist: musicState.playlist,
          });
        }

        function formatTimestamp(timestamp) {
          if (!timestamp) return "";
          const date = new Date(timestamp);
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
        }

        function updateClock() {
          const now = new Date();
          const timeString = now.toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const dateString = now.toLocaleDateString("zh-CN", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
          document.getElementById("main-time").textContent = timeString;
          document.getElementById("status-bar-time").textContent = timeString;
          document.getElementById("main-date").textContent = dateString;
        }

        /**
         * 【终极健壮版】解析AI返回的、可能格式不规范的响应内容
         * @param {string} content - AI返回的原始字符串
         * @returns {Array} - 一个标准化的消息对象数组
         */
        function parseAiResponse(content) {
          const trimmedContent = content.trim();

          // 方案1：【最优先】尝试作为标准的、单一的JSON数组解析
          // 这是最理想、最高效的情况
          if (trimmedContent.startsWith("[") && trimmedContent.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmedContent);
              if (Array.isArray(parsed)) {
                console.log("解析成功：标准JSON数组格式。");
                return parsed;
              }
            } catch (e) {
              // 如果解析失败，说明它虽然看起来像个数组，但内部格式有问题。
              // 此时我们不报错，而是继续尝试下面的“强力解析”方案。
              console.warn("标准JSON数组解析失败，将尝试强力解析...");
            }
          }

          // 方案2：【强力解析】使用正则表达式，从混乱的字符串中提取出所有独立的JSON对象
          // 这能完美解决您遇到的 "(Timestamp: ...)[{...}](Timestamp: ...)[{...}]" 这种格式
          const jsonMatches = trimmedContent.match(/{[^{}]*}/g);

          if (jsonMatches) {
            const results = [];
            for (const match of jsonMatches) {
              try {
                // 尝试解析每一个被我们“揪”出来的JSON字符串
                const parsedObject = JSON.parse(match);
                results.push(parsedObject);
              } catch (e) {
                // 如果某个片段不是有效的JSON，就忽略它，继续处理下一个
                console.warn("跳过一个无效的JSON片段:", match);
              }
            }

            // 如果我们成功提取出了至少一个有效的JSON对象，就返回这个结果
            if (results.length > 0) {
              console.log("解析成功：通过强力提取模式。");
              return results;
            }
          }

          // 方案3：【最终备用】如果以上所有方法都失败了，说明AI返回的可能就是纯文本
          // 我们将原始的、未处理的内容，包装成一个标准的文本消息对象返回，确保程序不会崩溃
          console.error("所有解析方案均失败！将返回原始文本。");
          return [{ type: CONSTANTS.MSG_TYPES.TEXT, content: content }];
        }

        function getBackgroundActivityOptions(chat) {
          const defaultOptions = {
            allowChat: true,
            allowPost: true,
            allowReply: true,
          };
          const storedOptions = chat?.settings?.backgroundActivityOptions || {};
          return { ...defaultOptions, ...storedOptions };
        }

        function hasAnyBackgroundActivityEnabled(chat) {
          const options = getBackgroundActivityOptions(chat);
          return options.allowChat || options.allowPost || options.allowReply;
        }

        function renderApiSettings() {
          // 渲染其他全局设置（保持不变）
          document.getElementById("background-activity-switch").checked =
            state.globalSettings.enableBackgroundActivity || false;
          document.getElementById("background-interval-input").value =
            state.globalSettings.backgroundActivityInterval || 60;
          document.getElementById("block-cooldown-input").value =
            state.globalSettings.blockCooldownHours || 1;

          const roleSettingsEl = document.getElementById(
            "role-activity-settings",
          );
          if (roleSettingsEl) {
            const singleChats = Object.values(state.chats).filter(
              (chat) => !chat.isGroup,
            );
            roleSettingsEl.innerHTML = "";
            if (singleChats.length === 0) {
              roleSettingsEl.innerHTML =
                '<div style="padding: 12px 16px; color: var(--text-secondary);">暂无角色</div>';
            } else {
              singleChats.forEach((chat) => {
                const options = getBackgroundActivityOptions(chat);
                const item = document.createElement("div");
                item.className = "role-activity-item";
                item.innerHTML = `
                  <div class="role-name">${chat.name}</div>
                  <div class="role-activity-options">
                    <label class="role-activity-option">
                      <input
                        type="checkbox"
                        data-chat-id="${chat.id}"
                        data-activity-option="allowChat"
                        ${options.allowChat ? "checked" : ""}
                      />
                      正常聊天
                    </label>
                    <label class="role-activity-option">
                      <input
                        type="checkbox"
                        data-chat-id="${chat.id}"
                        data-activity-option="allowPost"
                        ${options.allowPost ? "checked" : ""}
                      />
                      发布动态
                    </label>
                    <label class="role-activity-option">
                      <input
                        type="checkbox"
                        data-chat-id="${chat.id}"
                        data-activity-option="allowReply"
                        ${options.allowReply ? "checked" : ""}
                      />
                      回复动态
                    </label>
                  </div>
                `;
                roleSettingsEl.appendChild(item);
              });
            }
          }

          // 渲染API配置列表
          const listEl = document.getElementById("api-configs-list");
          listEl.innerHTML = "";
          if (state.apiConfigs.length === 0) {
            listEl.innerHTML =
              '<p style="text-align:center; color: var(--text-secondary);">还没有任何配置，请点击“添加”创建一个</p>';
          }

          const activeId = state.globalSettings.activeApiConfigId;

          state.apiConfigs.forEach((config) => {
            const item = document.createElement("div");
            item.className = "api-config-item";
            item.dataset.configId = config.id;
            item.innerHTML = `
              <div class="config-main">
                  <input type="radio" name="active_api_config" ${
                    config.id === activeId ? "checked" : ""
                  }>
                  <div class="config-details">
                      <span class="config-name">${config.name}</span>
                      <span class="config-url">${
                        config.url || "URL未设置"
                      }</span>
                  </div>
              </div>
              <div class="config-actions">
                  <button type="button" class="edit-btn">编辑</button>
                  <button type="button" class="delete-btn">删除</button>
              </div>
            `;
            listEl.appendChild(item);
          });
        }
        async function openApiConfigEditor(configId = null) {
          let config = {
            name: "",
            url: "",
            apiKey: "",
            model: "gpt-4o",
            enableStream: true,
            hideStreamResponse: false,
            temperature: 0.8, // 默认值
            topP: 1.0, // 默认值
            topK: 40, // 默认值
            enableTemp: false,
            enableTopP: false,
            enableTopK: false,
          };
          if (configId) {
            config = state.apiConfigs.find((c) => c.id === configId) || config;
          }

          // 填充基本信息
          document.getElementById("config-editor-id").value = configId || "";
          document.getElementById("config-name-input").value = config.name;
          document.getElementById("config-url-input").value = config.url;
          document.getElementById("config-key-input").value = config.apiKey;

          // --- 【核心修复】 ---
          // 每次打开时，都重置模型下拉列表，只显示当前配置已保存的模型
          const modelSelect = document.getElementById("config-model-select");
          // 1. 清空所有旧的 <option> 元素
          modelSelect.innerHTML = "";
          // 2. 创建一个只包含当前已保存模型的新 <option>
          const savedModelOption = document.createElement("option");
          savedModelOption.value = config.model;
          savedModelOption.textContent = config.model;
          savedModelOption.selected = true;
          // 3. 将这个唯一的选项添加到下拉列表中
          modelSelect.appendChild(savedModelOption);
          // --- 【修复结束】 ---

          // --- 迁移逻辑：兼容旧的 enableAdvancedParams ---
          // 如果旧配置有 enableAdvancedParams，但没有新的独立开关，则继承旧开关的值
          if (config.enableAdvancedParams !== undefined) {
            if (config.enableTemp === undefined)
              config.enableTemp = config.enableAdvancedParams;
            if (config.enableTopP === undefined)
              config.enableTopP = config.enableAdvancedParams;
            if (config.enableTopK === undefined)
              config.enableTopK = config.enableAdvancedParams;
          }

          // 填充值
          document.getElementById("config-temperature-input").value =
            config.temperature !== undefined ? config.temperature : 0.8;
          document.getElementById("config-topp-input").value =
            config.topP !== undefined ? config.topP : 1.0;
          document.getElementById("config-topk-input").value =
            config.topK !== undefined ? config.topK : 40;

          // 填充开关状态
          document.getElementById("config-stream-switch").checked =
            config.enableStream;
          document.getElementById("config-hide-stream-switch").checked =
            config.hideStreamResponse;

          const tempCheck = document.getElementById("config-enable-temp");
          const toppCheck = document.getElementById("config-enable-topp");
          const topkCheck = document.getElementById("config-enable-topk");
          const tempInput = document.getElementById("config-temperature-input");
          const toppInput = document.getElementById("config-topp-input");
          const topkInput = document.getElementById("config-topk-input");

          // 设置初始状态 (默认 false)
          tempCheck.checked = !!config.enableTemp;
          toppCheck.checked = !!config.enableTopP;
          topkCheck.checked = !!config.enableTopK;

          function updateInputState(checkbox, input) {
            input.disabled = !checkbox.checked;
            input.style.opacity = checkbox.checked ? "1" : "0.5";
          }

          // 初始化 UI 状态
          updateInputState(tempCheck, tempInput);
          updateInputState(toppCheck, toppInput);
          updateInputState(topkCheck, topkInput);

          // 绑定事件
          tempCheck.onchange = (e) => updateInputState(e.target, tempInput);
          toppCheck.onchange = (e) => updateInputState(e.target, toppInput);
          topkCheck.onchange = (e) => updateInputState(e.target, topkInput);

          // 显示模态框
          document
            .getElementById("api-config-editor-modal")
            .classList.add("visible");
        }

        async function saveApiConfig() {
          const id = document.getElementById("config-editor-id").value;

          // 获取并验证新参数
          let temp = parseFloat(
            document.getElementById("config-temperature-input").value,
          );
          let topP = parseFloat(
            document.getElementById("config-topp-input").value,
          );
          let topK = parseInt(
            document.getElementById("config-topk-input").value,
          );

          if (isNaN(temp)) temp = 0.8;
          if (isNaN(topP)) topP = 1.0;
          if (isNaN(topK)) topK = 40;

          const configData = {
            name:
              document.getElementById("config-name-input").value.trim() ||
              "未命名配置",
            url: document.getElementById("config-url-input").value.trim(),
            apiKey: document.getElementById("config-key-input").value.trim(),
            model: document.getElementById("config-model-select").value,
            temperature: temp,
            topP: topP,
            topK: topK,
            // 保存独立开关状态
            enableTemp: document.getElementById("config-enable-temp").checked,
            enableTopP: document.getElementById("config-enable-topp").checked,
            enableTopK: document.getElementById("config-enable-topk").checked,
            // 保留旧字段以备不时之需（或者直接弃用，这里选择更新它为 OR 逻辑，或直接忽略）
            // 为了整洁，我们不再保存 enableAdvancedParams，因为它已经被拆分了。
            enableStream: document.getElementById("config-stream-switch")
              .checked,
            hideStreamResponse: document.getElementById(
              "config-hide-stream-switch",
            ).checked,
          };

          if (id) {
            // 更新
            configData.id = parseInt(id);
            await db.apiConfigs.put(configData);
            const index = state.apiConfigs.findIndex(
              (c) => c.id === configData.id,
            );
            if (index > -1) state.apiConfigs[index] = configData;
          } else {
            // 新增
            const newId = await db.apiConfigs.add(configData);
            configData.id = newId;
            state.apiConfigs.push(configData);
            // 如果是第一个配置，自动设为激活
            if (state.apiConfigs.length === 1) {
              state.globalSettings.activeApiConfigId = newId;
              await db.globalSettings.put(state.globalSettings);
            }
          }

          renderApiSettings();
          document
            .getElementById("api-config-editor-modal")
            .classList.remove("visible");
        }

        async function setActiveApiConfig(configId) {
          state.globalSettings.activeApiConfigId = configId;
          await db.globalSettings.put(state.globalSettings);
          // 可以在这里给一个轻量提示，或者什么都不做
          console.log(`Active API config set to ID: ${configId}`);
        }
        window.renderApiSettingsProxy = renderApiSettings;

        async function renderChatList() {
          const chatListEl = DOM.get("chat-list");
          chatListEl.innerHTML = "";

          // 1. 像以前一样，获取所有聊天并按最新消息时间排序
          const allChats = Object.values(state.chats).sort(
            (a, b) =>
              (b.history.slice(-1)[0]?.timestamp || 0) -
              (a.history.slice(-1)[0]?.timestamp || 0),
          );

          // 2. 获取所有分组
          const allGroups = await db.qzoneGroups.toArray();

          if (allChats.length === 0) {
            chatListEl.innerHTML =
              '<p style="text-align:center; color: #8a8a8a; margin-top: 50px;">点击右上角 "+" 或群组图标添加聊天</p>';
            return;
          }

          // --- 【核心修正开始】---

          // 3. 为每个分组找到其内部最新的消息时间戳
          allGroups.forEach((group) => {
            // 从已排序的 allChats 中找到本组的第一个（也就是最新的）聊天
            const latestChatInGroup = allChats.find(
              (chat) => chat.groupId === group.id,
            );
            // 如果找到了，就用它的时间戳；如果该分组暂时没有聊天或聊天没有历史记录，就用0
            group.latestTimestamp = latestChatInGroup
              ? latestChatInGroup.history.slice(-1)[0]?.timestamp || 0
              : 0;
          });

          // 4. 根据这个最新的时间戳来对“分组本身”进行排序
          allGroups.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

          // --- 【核心修正结束】---

          // 5. 现在，我们按照排好序的分组来渲染
          allGroups.forEach((group) => {
            // 从总列表里过滤出属于这个（已排序）分组的好友
            const groupChats = allChats.filter(
              (chat) => !chat.isGroup && chat.groupId === group.id,
            );
            // 如果这个分组是空的（可能所有好友都被删了），就跳过
            if (groupChats.length === 0) return;

            const groupContainer = document.createElement("div");
            groupContainer.className = "chat-group-container";
            groupContainer.innerHTML = `
                  <div class="chat-group-header">
                      <span class="group-name">${group.name}</span>
                  </div>
                  <div class="chat-group-content"></div>
              `;
            const contentEl = groupContainer.querySelector(
              ".chat-group-content",
            );
            
            const groupFragment = document.createDocumentFragment();
            // 因为 allChats 本身就是有序的，所以 groupChats 自然也是有序的
            groupChats.forEach((chat) => {
              const item = createChatListItem(chat);
              groupFragment.appendChild(item);
            });
            contentEl.appendChild(groupFragment);
            
            chatListEl.appendChild(groupContainer);
          });

          // 6. 最后，渲染所有群聊和未分组的好友
          // 他们的顺序因为 allChats 的初始排序，天然就是正确的
          const ungroupedOrGroupChats = allChats.filter(
            (chat) => chat.isGroup || (!chat.isGroup && !chat.groupId),
          );
          
          const ungroupedFragment = document.createDocumentFragment();
          ungroupedOrGroupChats.forEach((chat) => {
            const item = createChatListItem(chat);
            ungroupedFragment.appendChild(item);
          });
          chatListEl.appendChild(ungroupedFragment);

          // 为所有分组标题添加折叠事件
          document.querySelectorAll(".chat-group-header").forEach((header) => {
            header.addEventListener("click", () => {
              header.classList.toggle("collapsed");
              header.nextElementSibling.classList.toggle("collapsed");
            });
          });
        }

        function createChatListItem(chat) {
          const lastMsgObj =
            chat.history.filter((msg) => !msg.isHidden).slice(-1)[0] || {};
          let lastMsgDisplay;

          if (
            !chat.isGroup &&
            chat.relationship?.status === "pending_user_approval"
          ) {
            lastMsgDisplay = `<span style="color: #ff8c00;">[好友申请] ${
              chat.relationship.applicationReason || "请求添加你为好友"
            }</span>`;
          } else if (
            !chat.isGroup &&
            chat.relationship?.status === "blocked_by_ai"
          ) {
            lastMsgDisplay = `<span style="color: #dc3545;">[你已被对方拉黑]</span>`;
          }

          // 【核心修改】优先显示状态，而不是最后一条消息
          if (chat.isGroup) {
            // 群聊逻辑保持不变
            if (lastMsgObj.type === "pat_message") {
              lastMsgDisplay = `[系统消息] ${lastMsgObj.content}`;
            }
            // ... (其他群聊消息类型判断) ...
            else if (lastMsgObj.type === CONSTANTS.MSG_TYPES.TRANSFER) {
              lastMsgDisplay = "[转账]";
            } else if (
              lastMsgObj.type === CONSTANTS.MSG_TYPES.IMAGE ||
              lastMsgObj.type === "user_photo"
            ) {
              lastMsgDisplay = "[照片]";
            } else if (lastMsgObj.type === CONSTANTS.MSG_TYPES.VOICE) {
              lastMsgDisplay = "[语音]";
            } else if (
              typeof lastMsgObj.content === "string" &&
              STICKER_REGEX.test(lastMsgObj.content)
            ) {
              lastMsgDisplay = lastMsgObj.meaning
                ? `[表情: ${lastMsgObj.meaning}]`
                : "[表情]";
            } else if (Array.isArray(lastMsgObj.content)) {
              lastMsgDisplay = `[图片]`;
            } else {
              lastMsgDisplay = String(lastMsgObj.content || "...").substring(
                0,
                20,
              );
            }

            if (lastMsgObj.senderName && lastMsgObj.type !== "pat_message") {
              lastMsgDisplay = `${lastMsgObj.senderName}: ${lastMsgDisplay}`;
            }
          } else {
            // 单聊逻辑：显示状态
            // 确保 chat.status 对象存在
            const statusText = chat.status?.text || CONSTANTS.STATUS.ONLINE;
            lastMsgDisplay = `[${statusText}]`;
          }

          const item = document.createElement("div");
          item.className = "chat-list-item";
          item.dataset.chatId = chat.id;
          const avatar = chat.isGroup
            ? chat.settings.groupAvatar
            : chat.settings.aiAvatar;

          item.innerHTML = `
              <img src="${avatar || defaultAvatar}" class="avatar">
              <div class="info">
                  <div class="name-line">
                      <span class="name">${chat.name}</span>
                      ${
                        chat.isGroup
                          ? '<span class="group-tag">群聊</span>'
                          : ""
                      }
                  </div>
                  <div class="last-msg" style="color: ${
                    chat.isGroup ? "var(--text-secondary)" : "#b5b5b5"
                  }; font-style: italic;">${lastMsgDisplay}</div>
              </div>
              <!-- 这里就是我们新加的红点HTML结构 -->
              <div class="unread-count-wrapper">
                  <span class="unread-count" style="display: none;">0</span>
              </div>
          `;

          // 【核心修改2】在这里添加控制红点显示/隐藏的逻辑
          const unreadCount = chat.unreadCount || 0;
          const unreadEl = item.querySelector(".unread-count");
          if (unreadCount > 0) {
            unreadEl.textContent = unreadCount > 99 ? "99+" : unreadCount;
            // 注意这里是 'inline-flex'，与我们的CSS对应，使其垂直居中
            unreadEl.style.display = "inline-flex";
          } else {
            unreadEl.style.display = "none";
          }

          const avatarEl = item.querySelector(".avatar");
          if (avatarEl) {
            avatarEl.style.cursor = "pointer";
            avatarEl.addEventListener("click", (e) => {
              e.stopPropagation();
              handleUserPat(chat.id, chat.name);
            });
          }

          const infoEl = item.querySelector(".info");
          if (infoEl) {
            infoEl.addEventListener("click", () => openChat(chat.id));
          }

          addLongPressListener(item, async (e) => {
            const confirmed = await showCustomConfirm(
              "删除对话",
              `确定要删除与 "${chat.name}" 的整个对话吗？此操作不可撤销。`,
              { confirmButtonClass: "btn-danger" },
            );
            if (confirmed) {
              if (musicState.isActive && musicState.activeChatId === chat.id)
                await endListenTogetherSession(false);
              delete state.chats[chat.id];
              if (state.activeChatId === chat.id) state.activeChatId = null;
              await db.chats.delete(chat.id);
              renderChatList();
            }
          });
          return item;
        }

        function renderChatInterface(chatId) {
          cleanupWaimaiTimers();
          const chat = state.chats[chatId];
          if (!chat) return;
          exitSelectionMode();

          const messagesContainer = DOM.get("chat-messages");
          const chatInputArea = document.getElementById("chat-input-area");
          const lockOverlay = document.getElementById("chat-lock-overlay");
          const lockContent = document.getElementById("chat-lock-content");

          messagesContainer.dataset.theme = chat.settings.theme || "default";
          const fontSize = chat.settings.fontSize || 13;
          messagesContainer.style.setProperty(
            "--chat-font-size",
            `${fontSize}px`,
          );
          // 应用自定义气泡颜色
          if (chat.settings?.userBubbleColor) {
            messagesContainer.style.setProperty(
              "--user-bubble-color",
              chat.settings.userBubbleColor,
            );
          } else {
            messagesContainer.style.removeProperty("--user-bubble-color");
          }
          if (chat.settings?.aiBubbleColor) {
            messagesContainer.style.setProperty(
              "--ai-bubble-color",
              chat.settings.aiBubbleColor,
            );
          } else {
            messagesContainer.style.removeProperty("--ai-bubble-color");
          }
          applyScopedCss(
            chat.settings.customCss || "",
            "#chat-messages",
            "custom-bubble-style",
          );

          document.getElementById("chat-header-title").textContent = chat
            .settings.aiRemark
            ? `${chat.name} | ${chat.settings.aiRemark}`
            : chat.name;
          const statusContainer = document.getElementById("chat-header-status");
          const statusTextEl = statusContainer.querySelector(".status-text");

          if (chat.isGroup) {
            statusContainer.style.display = "none";
            document.getElementById(
              "chat-header-title-wrapper",
            ).style.justifyContent = "center";
          } else {
            statusContainer.style.display = "flex";
            document.getElementById(
              "chat-header-title-wrapper",
            ).style.justifyContent = "flex-start";
            statusTextEl.textContent = chat.status?.text || CONSTANTS.STATUS.ONLINE;
            statusContainer.classList.toggle(
              "busy",
              chat.status?.isBusy || false,
            );
          }

          lockOverlay.style.display = "none";
          chatInputArea.style.visibility = "visible";
          lockContent.innerHTML = "";

          if (!chat.isGroup && chat.relationship.status !== "friend") {
            lockOverlay.style.display = "flex";
            chatInputArea.style.visibility = "hidden";

            let lockHtml = "";
            switch (chat.relationship.status) {
              case "blocked_by_user":
                // --- 【核心修改：在这里加入诊断面板】 ---
                const isSimulationRunning = simulationIntervalId !== null;
                const blockedTimestamp = chat.relationship.blockedTimestamp;
                const cooldownHours =
                  state.globalSettings.blockCooldownHours || 1;
                const cooldownMilliseconds = cooldownHours * 60 * 60 * 1000;
                const timeSinceBlock = Date.now() - blockedTimestamp;
                const isCooldownOver = timeSinceBlock > cooldownMilliseconds;
                const timeRemainingMinutes = Math.max(
                  0,
                  Math.ceil(
                    (cooldownMilliseconds - timeSinceBlock) / (1000 * 60),
                  ),
                );

                lockHtml = `
                          <span class="lock-text">你已将“${
                            chat.name
                          }”拉黑。</span>
                          <button id="unblock-btn" class="lock-action-btn">解除拉黑</button>
                          <div style="margin-top: 20px; padding: 10px; border: 1px dashed #ccc; border-radius: 8px; font-size: 11px; text-align: left; color: #666; background: rgba(0,0,0,0.02);">
                              <strong style="color: #333;">【开发者诊断面板】</strong><br>
                              - 后台活动总开关: ${
                                state.globalSettings.enableBackgroundActivity
                                  ? '<span style="color: green;">已开启</span>'
                                  : '<span style="color: red;">已关闭</span>'
                              }<br>
                              - 系统心跳计时器: ${
                                isSimulationRunning
                                  ? '<span style="color: green;">运行中</span>'
                                  : '<span style="color: red;">未运行</span>'
                              }<br>
                              - 当前角色状态: <strong>${
                                chat.relationship.status
                              }</strong><br>
                              - 需要冷静(小时): <strong>${cooldownHours}</strong><br>
                              - 冷静期是否结束: ${
                                isCooldownOver
                                  ? '<span style="color: green;">是</span>'
                                  : `<span style="color: orange;">否 (还剩约 ${timeRemainingMinutes} 分钟)</span>`
                              }<br>
                              - 触发条件: ${
                                isCooldownOver &&
                                state.globalSettings.enableBackgroundActivity
                                  ? '<span style="color: green;">已满足，等待下次系统心跳</span>'
                                  : '<span style="color: red;">未满足</span>'
                              }
                          </div>
                          <button id="force-apply-check-btn" class="lock-action-btn secondary" style="margin-top: 10px;">强制触发一次好友申请检测</button>
                      `;
                // --- 【修改结束】 ---
                break;
              case "blocked_by_ai":
                lockHtml = `
                          <span class="lock-text">你被对方拉黑了。</span>
                          <button id="apply-friend-btn" class="lock-action-btn">重新申请加为好友</button>
                      `;
                break;

              case "pending_user_approval":
                lockHtml = `
                          <span class="lock-text">“${chat.name}”请求添加你为好友：<br><i>“${chat.relationship.applicationReason}”</i></span>
                          <button id="accept-friend-btn" class="lock-action-btn">接受</button>
                          <button id="reject-friend-btn" class="lock-action-btn secondary">拒绝</button>
                      `;
                break;

              // 【核心修正】修复当你申请后，你看到的界面
              case "pending_ai_approval":
                lockHtml = `<span class="lock-text">好友申请已发送，等待对方通过...</span>`;
                break;
            }
            lockContent.innerHTML = lockHtml;
          }
          messagesContainer.innerHTML = "";
          // ...后续代码保持不变
          const chatScreen = DOM.get("chat-interface-screen");
          chatScreen.style.backgroundImage = chat.settings.background
            ? `url(${chat.settings.background})`
            : "none";

          const isDarkMode = document
            .getElementById("phone-screen")
            .classList.contains("dark-mode");
          chatScreen.style.backgroundColor = chat.settings.background
            ? "transparent"
            : isDarkMode
              ? "#000000"
              : "#f0f2f5";
          const history = chat.history;
          const totalMessages = history.length;
          currentRenderedCount = 0;
          const initialMessages = history.slice(-MESSAGE_RENDER_WINDOW);
          initialMessages.forEach((msg) => appendMessage(msg, chat, true));
          currentRenderedCount = initialMessages.length;
          if (totalMessages > currentRenderedCount) {
            prependLoadMoreButton(messagesContainer);
          }
          const typingIndicator = document.createElement("div");
          typingIndicator.id = "typing-indicator";
          typingIndicator.style.display = "none";
          typingIndicator.innerHTML =
            '<div class="system-bubble">对方正在输入...</div>';
          messagesContainer.appendChild(typingIndicator);
          setTimeout(
            () =>
              (messagesContainer.scrollTop = messagesContainer.scrollHeight),
            0,
          );
        }

        function prependLoadMoreButton(container) {
          const button = document.createElement("button");
          button.id = "load-more-btn";
          button.textContent = "加载更早的记录";
          button.addEventListener("click", loadMoreMessages);
          container.prepend(button);
        }

        function loadMoreMessages() {
          const messagesContainer = DOM.get("chat-messages");
          const chat = state.chats[state.activeChatId];
          if (!chat) return;
          const loadMoreBtn = document.getElementById("load-more-btn");
          if (loadMoreBtn) loadMoreBtn.remove();
          const totalMessages = chat.history.length;
          const nextSliceStart =
            totalMessages - currentRenderedCount - MESSAGE_RENDER_WINDOW;
          const nextSliceEnd = totalMessages - currentRenderedCount;
          const messagesToPrepend = chat.history.slice(
            Math.max(0, nextSliceStart),
            nextSliceEnd,
          );
          const oldScrollHeight = messagesContainer.scrollHeight;
          messagesToPrepend
            .reverse()
            .forEach((msg) => prependMessage(msg, chat));
          currentRenderedCount += messagesToPrepend.length;
          const newScrollHeight = messagesContainer.scrollHeight;
          messagesContainer.scrollTop += newScrollHeight - oldScrollHeight;
          if (totalMessages > currentRenderedCount) {
            prependLoadMoreButton(messagesContainer);
          }
        }

        function renderWallpaperScreen() {
          const preview = document.getElementById("wallpaper-preview");
          const bg = newWallpaperBase64 || state.globalSettings.wallpaper;
          if (bg && bg.startsWith("data:image")) {
            preview.style.backgroundImage = `url(${bg})`;
            preview.textContent = "";
          } else if (bg) {
            preview.style.backgroundImage = bg;
            preview.textContent = "当前为渐变色";
          }
          // 【核心修改】在这里调用图标渲染函数
          renderIconSettings();

          const frameColorInput = document.getElementById("frame-color-input");
          const frameColorValue = document.getElementById("frame-color-value");
          const currentFrameColor =
            state.globalSettings.phoneFrameColor || "#ffffff";
          frameColorInput.value = currentFrameColor;
          frameColorValue.textContent = currentFrameColor;
        }
        window.renderWallpaperScreenProxy = renderWallpaperScreen;

        function applyGlobalWallpaper() {
          const homeScreen = DOM.get("home-screen");
          const wallpaper = state.globalSettings.wallpaper;
          if (wallpaper && wallpaper.startsWith("data:image"))
            homeScreen.style.backgroundImage = `url(${wallpaper})`;
          else if (wallpaper) homeScreen.style.backgroundImage = wallpaper;

          const phoneFrame = document.getElementById("phone-frame");
          const customColor = state.globalSettings.phoneFrameColor;

          if (customColor) {
            phoneFrame.style.backgroundColor = customColor;
          } else {
            // 如果没有自定义颜色，则清除内联样式，让CSS类（如.dark-mode）生效
            phoneFrame.style.backgroundColor = "";
          }
        }

        async function renderWorldBookScreen() {
          const listEl = document.getElementById("world-book-list");
          listEl.innerHTML = "";

          // 1. 同时获取所有书籍和所有分类
          const [books, categories] = await Promise.all([
            db.worldBooks.toArray(),
            db.worldBookCategories.orderBy("name").toArray(),
          ]);

          state.worldBooks = books; // 确保内存中的数据是同步的

          if (books.length === 0) {
            listEl.innerHTML =
              '<p style="text-align:center; color: #8a8a8a; margin-top: 50px;">点击右上角 "+" 创建你的第一本世界书</p>';
            return;
          }

          // 2. 将书籍按 categoryId 分组
          const groupedBooks = books.reduce((acc, book) => {
            const key = book.categoryId || "uncategorized";
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(book);
            return acc;
          }, {});

          // 3. 优先渲染已分类的书籍
          const fragment = document.createDocumentFragment();
          categories.forEach((category) => {
            const booksInCategory = groupedBooks[category.id];
            if (booksInCategory && booksInCategory.length > 0) {
              const groupContainer = createWorldBookGroup(
                category.name,
                booksInCategory,
              );
              fragment.appendChild(groupContainer);
            }
          });

          // 4. 最后渲染未分类的书籍
          const uncategorizedBooks = groupedBooks["uncategorized"];
          if (uncategorizedBooks && uncategorizedBooks.length > 0) {
            const groupContainer = createWorldBookGroup(
              "未分类",
              uncategorizedBooks,
            );
            fragment.appendChild(groupContainer);
          }
          listEl.appendChild(fragment);

          // 5. 为所有分组标题添加折叠事件
          document
            .querySelectorAll(".world-book-group-header")
            .forEach((header) => {
              header.addEventListener("click", () => {
                header.classList.toggle("collapsed");
                header.nextElementSibling.classList.toggle("collapsed");
              });
            });
        }

        /**
         * 【辅助函数】创建一个分类的分组DOM
         * @param {string} groupName - 分类名称
         * @param {Array} books - 该分类下的书籍数组
         * @returns {HTMLElement} - 创建好的分组容器
         */
        function createWorldBookGroup(groupName, books) {
          const groupContainer = document.createElement("div");
          groupContainer.className = "world-book-group-container";

          groupContainer.innerHTML = `
              <div class="world-book-group-header">
                  <span class="group-name">${groupName}</span>
              </div>
              <div class="world-book-group-content"></div>
          `;

          const headerEl = groupContainer.querySelector(
            ".world-book-group-header",
          );
          const contentEl = groupContainer.querySelector(
            ".world-book-group-content",
          );

          // 默认给头部和内容区都加上 collapsed 类
          headerEl.classList.add("collapsed");
          contentEl.classList.add("collapsed");

          books.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
          
          const fragment = document.createDocumentFragment();
          books.forEach((book) => {
            const item = document.createElement("div");
            item.className = "list-item";
            item.dataset.bookId = book.id;
            item.innerHTML = `<div class="item-title">${
              book.name
            }</div><div class="item-content">${(
              book.content || "暂无内容..."
            ).substring(0, 50)}</div>`;
            item.addEventListener("click", () => openWorldBookEditor(book.id));
            addLongPressListener(item, async () => {
              const confirmed = await showCustomConfirm(
                "删除世界书",
                `确定要删除《${book.name}》吗？此操作不可撤销。`,
                { confirmButtonClass: "btn-danger" },
              );
              if (confirmed) {
                await db.worldBooks.delete(book.id);
                state.worldBooks = state.worldBooks.filter(
                  (wb) => wb.id !== book.id,
                );
                renderWorldBookScreen();
              }
            });
            fragment.appendChild(item);
          });
          contentEl.appendChild(fragment);

          return groupContainer;
        }
        window.renderWorldBookScreenProxy = renderWorldBookScreen;

        async function openWorldBookEditor(bookId) {
          editingWorldBookId = bookId;
          const [book, categories] = await Promise.all([
            db.worldBooks.get(bookId),
            db.worldBookCategories.toArray(),
          ]);
          if (!book) return;

          document.getElementById("world-book-editor-title").textContent =
            book.name;
          document.getElementById("world-book-name-input").value = book.name;
          document.getElementById("world-book-content-input").value =
            book.content;

          // 【核心修改】填充分类下拉菜单
          const selectEl = document.getElementById(
            "world-book-category-select",
          );
          selectEl.innerHTML = '<option value="">-- 未分类 --</option>'; // 默认选项
          categories.forEach((cat) => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.name;
            if (book.categoryId === cat.id) {
              option.selected = true; // 选中当前分类
            }
            selectEl.appendChild(option);
          });

          showScreen("world-book-editor-screen");
        }

        function renderStickerPanel() {
          const grid = document.getElementById("sticker-grid");
          grid.innerHTML = "";
          if (state.userStickers.length === 0) {
            grid.innerHTML =
              '<p style="text-align:center; color: var(--text-secondary); grid-column: 1 / -1;">大人请点击右上角“添加”或“上传”来添加你的第一个表情吧！</p>';
            return;
          }
          state.userStickers.forEach((sticker) => {
            const item = document.createElement("div");
            item.className = "sticker-item";
            item.style.backgroundImage = `url(${sticker.url})`;
            item.title = sticker.name;
            item.addEventListener("click", () => sendSticker(sticker));
            addLongPressListener(item, () => {
              if (isSelectionMode) return;
              const existingDeleteBtn = item.querySelector(".delete-btn");
              if (existingDeleteBtn) return;
              const deleteBtn = document.createElement("div");
              deleteBtn.className = "delete-btn";
              deleteBtn.innerHTML = "&times;";
              deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                const confirmed = await showCustomConfirm(
                  "删除表情",
                  `确定要删除表情 "${sticker.name}" 吗？`,
                  { confirmButtonClass: "btn-danger" },
                );
                if (confirmed) {
                  await db.userStickers.delete(sticker.id);
                  state.userStickers = state.userStickers.filter(
                    (s) => s.id !== sticker.id,
                  );
                  renderStickerPanel();
                }
              };
              item.appendChild(deleteBtn);
              deleteBtn.style.display = "block";
              setTimeout(
                () =>
                  item.addEventListener(
                    "mouseleave",
                    () => deleteBtn.remove(),
                    { once: true },
                  ),
                3000,
              );
            });
            grid.appendChild(item);
          });
        }

        function resolveMessageHistoryIndex(chat, msg) {
          if (!chat || !Array.isArray(chat.history)) return -1;
          const index = chat.history.indexOf(msg);
          return index >= 0 ? index : -1;
        }

        function createMessageElement(msg, chat, msgIndex = -1) {
          const resolvedMsgIndex =
            Number.isInteger(msgIndex) && msgIndex >= 0 ? msgIndex : -1;
          const finalIndex =
            resolvedMsgIndex >= 0
              ? resolvedMsgIndex
              : resolveMessageHistoryIndex(chat, msg);
          const assignMsgIndex = (wrapperEl) => {
            if (finalIndex >= 0) {
              wrapperEl.dataset.msgIndex = finalIndex;
            }
          };
          if (msg.type === CONSTANTS.MSG_TYPES.RECALLED) {
            const wrapper = document.createElement("div");
            assignMsgIndex(wrapper);
            // 1. 【核心】给 wrapper 也加上 timestamp，方便事件委托时查找
            wrapper.className = "message-wrapper system-pat";
            wrapper.dataset.timestamp = msg.timestamp;

            const bubble = document.createElement("div");
            // 2. 【核心】让这个元素同时拥有 .message-bubble 和 .recalled-message-placeholder 两个class
            //    这样它既能被选择系统识别，又能保持原有的居中灰色样式
            bubble.className = "message-bubble recalled-message-placeholder";
            // 3. 【核心】把 timestamp 放在 bubble 上，这是多选逻辑的关键
            bubble.dataset.timestamp = msg.timestamp;
            bubble.textContent = msg.content;

            wrapper.appendChild(bubble);

            // 4. 【核心优化】不再单独绑定事件监听器，改为依赖事件委托
            // wrapper.dataset.timestamp 已经在上面设置了
            
            // 旧代码备份：
            // addLongPressListener(wrapper, () =>
            //   showMessageActions(msg.timestamp),
            // );
            // wrapper.addEventListener("click", () => {
            //   if (isSelectionMode) {
            //     toggleMessageSelection(msg.timestamp);
            //   }
            // });

            // 5. 【重要】在之前的“点击查看原文”的逻辑中，我们已经使用了事件委托，所以这里不需要再单独为这个元素添加点击事件了。
            //    init() 函数中的那个事件监听器会处理它。

            return wrapper;
          }

          if (msg.isHidden) {
            return null;
          }

          if (msg.type === "pat_message") {
            const wrapper = document.createElement("div");
            assignMsgIndex(wrapper);
            wrapper.className = "message-wrapper system-pat";
            // 确保 dataset 上有 timestamp
            wrapper.dataset.timestamp = msg.timestamp;
            
            const bubble = document.createElement("div");
            bubble.className = "message-bubble system-bubble";
            bubble.dataset.timestamp = msg.timestamp;
            bubble.textContent = msg.content;
            wrapper.appendChild(bubble);
            
            // 【核心优化】不再绑定事件
            // addLongPressListener(wrapper, () =>
            //   showMessageActions(msg.timestamp),
            // );
            // wrapper.addEventListener("click", () => {
            //   if (isSelectionMode) toggleMessageSelection(msg.timestamp);
            // });
            return wrapper;
          }

          const isUser = msg.role === CONSTANTS.ROLES.USER;
          const wrapper = document.createElement("div");
          assignMsgIndex(wrapper);
          wrapper.className = `message-wrapper ${isUser ? CONSTANTS.ROLES.USER : "ai"}`;
          // 确保 dataset 上有 timestamp，这对事件委托至关重要
          wrapper.dataset.timestamp = msg.timestamp;

          // ★★★【核心重构】★★★
          // 这段逻辑现在用于查找成员对象，并显示其“群昵称”
          if (chat.isGroup && !isUser) {
            const memberInfo = getMemberInfo(chat, msg.senderName);
            const senderNameDiv = document.createElement("div");
            senderNameDiv.className = "sender-name";
            senderNameDiv.textContent = memberInfo.nickname;
            wrapper.appendChild(senderNameDiv);
          }

          const bubble = document.createElement("div");
          bubble.className = `message-bubble ${isUser ? CONSTANTS.ROLES.USER : "ai"}`;
          bubble.dataset.timestamp = msg.timestamp;

          const timestampEl = document.createElement("span");
          timestampEl.className = "timestamp";
          timestampEl.textContent = formatTimestamp(msg.timestamp);

          let avatarSrc; // 我们现在只需要头像图片，不再需要头像框了
          if (chat.isGroup) {
            if (isUser) {
              avatarSrc = chat.settings.myAvatar || defaultMyGroupAvatar;
            } else {
              const memberInfo = getMemberInfo(chat, msg.senderName);
              avatarSrc = memberInfo.avatar;
            }
          } else {
            if (isUser) {
              avatarSrc = chat.settings.myAvatar || defaultAvatar;
            } else {
              avatarSrc = chat.settings.aiAvatar || defaultAvatar;
            }
          }
          // 直接生成最简单的头像HTML，不再有任何和头像框相关的逻辑
          const avatarHtml = `<img src="${avatarSrc}" class="avatar">`;

          let contentHtml;

          if (msg.type === CONSTANTS.MSG_TYPES.SHARE_LINK) {
            bubble.classList.add("is-link-share");

            // 【核心修正1】将 onclick="openBrowser(...)" 移除，我们将在JS中动态绑定事件
            contentHtml = `
                  <div class="link-share-card" data-timestamp="${
                    msg.timestamp
                  }">
                      <div class="title">${msg.title || "无标题"}</div>
                      <div class="description">${
                        msg.description || "点击查看详情..."
                      }</div>
                      <div class="footer">
                          <svg class="footer-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                          <span>${msg.source_name || "链接分享"}</span>
                      </div>
                  </div>
              `;
          } else if (msg.type === "share_card") {
            bubble.classList.add("is-link-share"); // 复用链接分享的卡片样式
            // 【核心】把时间戳加到卡片上，方便后面点击时识别
            contentHtml = `
              <div class="link-share-card" style="cursor: pointer;" data-timestamp="${msg.timestamp}">
                  <div class="title">${msg.payload.title}</div>
                  <div class="description">共 ${msg.payload.sharedHistory.length} 条消息</div>
                  <div class="footer">
                      <svg class="footer-icon" ...>...</svg> <!-- 复用链接分享的图标 -->
                      <span>聊天记录</span>
                  </div>
              </div>
          `;
          } else if (msg.type === "user_photo" || msg.type === CONSTANTS.MSG_TYPES.IMAGE) {
            bubble.classList.add("is-ai-image");
            const altText =
              msg.type === "user_photo" ? "用户描述的照片" : "AI生成的图片";
            contentHtml = `<img src="https://i.postimg.cc/KYr2qRCK/1.jpg" class="ai-generated-image" alt="${altText}" data-description="${msg.content}">`;
          } else if (msg.type === CONSTANTS.MSG_TYPES.VOICE) {
            bubble.classList.add("is-voice-message");
            bubble.dataset.voiceText = msg.content;

            const duration = Math.max(
              1,
              Math.round((msg.content || "").length / 5),
            );
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationFormatted = `${minutes > 0 ? minutes + "'" : ""}${seconds}''`; // 仿微信格式：60'' 或 1'00''

            const MAX_DURATION = 60;
            const MIN_WIDTH = 60;
            const MAX_WIDTH = 220;

            const effectiveDuration = Math.min(duration, MAX_DURATION);

            const dynamicWidth =
              MIN_WIDTH +
              ((effectiveDuration - 1) / (MAX_DURATION - 1)) *
                (MAX_WIDTH - MIN_WIDTH);

            const waveformHTML = `
                      <div class="voice-waveform">
                          <div></div><div></div><div></div><div></div><div></div>
                      </div>
                  `;

            contentHtml = `
                      <div class="voice-message-body" style="width: ${Math.floor(dynamicWidth)}px">
                          ${waveformHTML}
                          <div class="loading-spinner"></div>
                          <span class="voice-duration">${durationFormatted}</span>
                      </div>
                      <div class="voice-transcript" style="display:none;"></div>
                  `;
          } else if (msg.type === CONSTANTS.MSG_TYPES.TRANSFER) {
            bubble.classList.add("is-transfer");

            let titleText, noteText;
            const myNickname = chat.isGroup
              ? chat.settings.myNickname || "我"
              : "我";

            if (isUser) {
              // 消息是用户发出的
              if (msg.isRefund) {
                // 用户发出的退款（即用户拒收了AI的转账）
                titleText = `退款给 ${chat.name}`;
                noteText = "已拒收对方转账";
              } else {
                // 用户主动发起的转账
                titleText = `转账给 ${msg.receiverName || chat.name}`;
                if (msg.status === "accepted") {
                  noteText = "对方已收款";
                } else if (msg.status === "declined") {
                  noteText = "对方已拒收";
                } else {
                  noteText = msg.note || "等待对方处理...";
                }
              }
            } else {
              // 消息是 AI 发出的
              if (msg.isRefund) {
                // AI 的退款（AI 拒收了用户的转账）
                titleText = `退款来自 ${msg.senderName}`;
                noteText = "转账已被拒收";
              } else if (msg.receiverName === myNickname) {
                // 【核心修正1】这是 AI 主动给用户的转账
                titleText = `转账给 ${myNickname}`;
                if (msg.status === "accepted") {
                  noteText = "你已收款";
                } else if (msg.status === "declined") {
                  noteText = "你已拒收";
                } else {
                  // 这是用户需要处理的转账
                  bubble.style.cursor = "pointer";
                  bubble.dataset.status = "pending";
                  noteText = msg.note || "点击处理";
                }
              } else {
                // 【核心修正2】这是 AI 发给群里其他人的转账，对当前用户来说只是一个通知
                titleText = `转账: ${msg.senderName} → ${msg.receiverName}`;
                noteText = msg.note || "群聊内转账";
              }
            }

            const heartIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="vertical-align: middle;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;

            contentHtml = `
              <div class="transfer-card">
                  <div class="transfer-title">${heartIcon} ${titleText}</div>
                  <div class="transfer-amount">¥ ${Number(msg.amount).toFixed(
                    2,
                  )}</div>
                  <div class.transfer-note">${noteText}</div>
              </div>
          `;
          } else if (msg.type === "waimai_request") {
            bubble.classList.add("is-waimai-request");
            if (msg.status === "paid" || msg.status === "rejected") {
              bubble.classList.add(`status-${msg.status}`);
            }
            let displayName;
            // 如果是群聊
            if (chat.isGroup) {
              const memberInfo = getMemberInfo(chat, msg.senderName);
              displayName = memberInfo.nickname;
            } else {
              // 否则（是单聊），直接使用聊天对象的名称
              displayName = chat.name;
            }
            // 【核心修改】使用我们刚刚查找到的 displayName
            const requestTitle = `来自 ${displayName} 的代付请求`;
            let actionButtonsHtml = "";
            if (msg.status === "pending" && !isUser) {
              actionButtonsHtml = `
                      <div class="waimai-user-actions">
                          <button class="waimai-decline-btn" data-choice="rejected">残忍拒绝</button>
                          <button class="waimai-pay-btn" data-choice="paid">为Ta买单</button>
                      </div>`;
            }
            contentHtml = `
                  <div class="waimai-card">
                      <div class="waimai-header">
                          <img src="https://files.catbox.moe/mq179k.png" class="icon" alt="Meituan Icon">
                          <div class="title-group">
                              <span class="brand">美团外卖</span><span class="separator">|</span><span>外卖美食</span>
                          </div>
                      </div>
                      <div class="waimai-catchphrase">Hi，你和我的距离只差一顿外卖～</div>
                      <div class="waimai-main">
                          <div class="request-title">${requestTitle}</div>
                          <div class="payment-box">
                              <div class="payment-label">需付款</div>
                              <div class="amount">¥${Number(msg.amount).toFixed(
                                2,
                              )}</div>
                              <div class="countdown-label">剩余支付时间
                                  <div class="countdown-timer" id="waimai-timer-${
                                    msg.timestamp
                                  }"></div>
                              </div>
                          </div>
                          <button class="waimai-details-btn">查看详情</button>
                      </div>
                      ${actionButtonsHtml}
                  </div>`;

            setTimeout(() => {
              const timerEl = document.getElementById(
                `waimai-timer-${msg.timestamp}`,
              );
              if (timerEl && msg.countdownEndTime) {
                if (waimaiTimers[msg.timestamp])
                  clearInterval(waimaiTimers[msg.timestamp]);
                if (msg.status === "pending") {
                  waimaiTimers[msg.timestamp] = startWaimaiCountdown(
                    timerEl,
                    msg.countdownEndTime,
                  );
                } else {
                  timerEl.innerHTML = `<span>已</span><span>处</span><span>理</span>`;
                }
              }
              const detailsBtn = document.querySelector(
                `.message-bubble[data-timestamp="${msg.timestamp}"] .waimai-details-btn`,
              );
              if (detailsBtn) {
                 detailsBtn.addEventListener("click", (e) => {
                   e.stopPropagation();
                   const paidByText = msg.paidBy
                     ? `<br><b>状态：</b>由 ${msg.paidBy} 为您代付成功`
                     : "";
                   showCustomAlert(
                     "订单详情",
                     `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
       <div><b>商品：</b>${msg.productInfo}</div>
       <div><b>金额：</b>¥${Number(msg.amount).toFixed(2)}</div>
       ${msg.paidBy ? `<div><b>状态：</b>由 ${msg.paidBy} 为您代付成功</div>` : ''}
     </div>`,
                   );
                 });
              }
              const actionButtons = document.querySelectorAll(
                `.message-bubble[data-timestamp="${msg.timestamp}"] .waimai-user-actions button`,
              );
              actionButtons.forEach((btn) => {
                btn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  const choice = e.target.dataset.choice;
                  handleWaimaiResponse(msg.timestamp, choice);
                });
              });
            }, 0);
          } else if (msg.type === "red_packet") {
            bubble.classList.add("is-red-packet");
            const myNickname = chat.settings.myNickname || "我";

            // 从最新的 msg 对象中获取状态
            const hasClaimed = msg.claimedBy && msg.claimedBy[myNickname];
            const isFinished = msg.isFullyClaimed;

            let cardClass = "";
            let claimedInfoHtml = "";
            let typeText = "拼手气红包";

            // 1. 判断红包卡片的样式 (颜色)
            if (isFinished) {
              cardClass = "opened";
            } else if (
              msg.packetType === "direct" &&
              Object.keys(msg.claimedBy || {}).length > 0
            ) {
              cardClass = "opened"; // 专属红包被领了也变灰
            }

            // 2. 判断红包下方的提示文字
            if (msg.packetType === "direct") {
              typeText = `专属红包: 给 ${msg.receiverName}`;
            }

            if (hasClaimed) {
              claimedInfoHtml = `<div class="rp-claimed-info">你领取了红包，金额 ${msg.claimedBy[
                myNickname
              ].toFixed(2)} 元</div>`;
            } else if (isFinished) {
              claimedInfoHtml = `<div class="rp-claimed-info">红包已被领完</div>`;
            } else if (
              msg.packetType === "direct" &&
              Object.keys(msg.claimedBy || {}).length > 0
            ) {
              claimedInfoHtml = `<div class="rp-claimed-info">已被 ${msg.receiverName} 领取</div>`;
            }

            // 3. 拼接最终的HTML，确保onclick调用的是我们注册到全局的函数
            contentHtml = `
              <div class="red-packet-card ${cardClass}">
                  <div class="rp-header">
                      <img src="https://files.catbox.moe/lo9xhc.png" class="rp-icon">
                      <span class="rp-greeting">${
                        msg.greeting || "恭喜发财，大吉大利！"
                      }</span>
                  </div>
                  <div class="rp-type">${typeText}</div>
                  ${claimedInfoHtml}
              </div>
          `;
          } else if (msg.type === "poll") {
            bubble.classList.add("is-poll");

            let totalVotes = 0;
            const voteCounts = {};

            // 计算总票数和每个选项的票数
            for (const option in msg.votes) {
              const count = msg.votes[option].length;
              voteCounts[option] = count;
              totalVotes += count;
            }

            const myNickname = chat.isGroup
              ? chat.settings.myNickname || "我"
              : "我";
            let myVote = null;
            for (const option in msg.votes) {
              if (msg.votes[option].includes(myNickname)) {
                myVote = option;
                break;
              }
            }

            let optionsHtml = '<div class="poll-options-list">';
            msg.options.forEach((optionText) => {
              const count = voteCounts[optionText] || 0;
              const percentage =
                totalVotes > 0 ? (count / totalVotes) * 100 : 0;
              const isVotedByMe = myVote === optionText;

              optionsHtml += `
                  <div class="poll-option-item ${
                    isVotedByMe ? "voted" : ""
                  }" data-option="${optionText}">
                      <div class="poll-option-bar" style="width: ${percentage}%;"></div>
                      <div class="poll-option-content">
                          <span class="poll-option-text">${optionText}</span>
                          <span class="poll-option-votes">${count} 票</span>
                      </div>
                  </div>
              `;
            });
            optionsHtml += "</div>";

            let footerHtml = "";
            // 【核心修改】在这里统一按钮的显示逻辑
            if (msg.isClosed) {
              // 如果投票已结束，总是显示“查看结果”
              footerHtml = `<div class="poll-footer"><span class="poll-total-votes">共 ${totalVotes} 人投票</span><button class="poll-action-btn">查看结果</button></div>`;
            } else {
              // 如果投票未结束，总是显示“结束投票”
              footerHtml = `<div class="poll-footer"><span class="poll-total-votes">共 ${totalVotes} 人投票</span><button class="poll-action-btn">结束投票</button></div>`;
            }

            contentHtml = `
              <div class="poll-card ${
                msg.isClosed ? "closed" : ""
              }" data-poll-timestamp="${msg.timestamp}">
                  <div class="poll-question">${msg.question}</div>
                  ${optionsHtml}
                  ${footerHtml}
              </div>
          `;
          } else if (
            msg.type === CONSTANTS.MSG_TYPES.STICKER ||
            (typeof msg.content === "string" && STICKER_REGEX.test(msg.content))
          ) {
            bubble.classList.add("is-sticker");
            contentHtml = `<img src="${msg.content}" alt="${
              msg.meaning || "Sticker"
            }" class="sticker-image">`;
          } else if (
            msg.type === "image" ||
            (Array.isArray(msg.content) && msg.content[0]?.type === "image_url")
          ) {
            // 添加 is-ai-image 类以去除气泡背景和内边距
            bubble.classList.add("is-ai-image");
            const imageUrl = Array.isArray(msg.content)
              ? msg.content[0].image_url.url
              : msg.content;
            contentHtml = `<img src="${imageUrl}" class="chat-image" alt="User uploaded image">`;
          } else {
            contentHtml = String(msg.content || "").replace(/\n/g, "<br>");
          }

          // 1. 【统一逻辑】检查消息对象中是否存在引用信息 (msg.quote)
          let quoteHtml = "";
          // 无论是用户消息还是AI消息，只要它包含了 .quote 对象，就执行这段逻辑
          if (msg.quote) {
            // a. 【核心修正】直接获取完整的、未经截断的引用内容
            const fullQuotedContent = String(msg.quote.content || "");

            // b. 构建引用块的HTML
            quoteHtml = `
              <div class="quoted-message">
                  <div class="quoted-sender">回复 ${msg.quote.senderName}:</div>
                  <div class="quoted-content">${fullQuotedContent}</div>
              </div>
          `;
          }

          // 2. 拼接最终的气泡内容
          //    将构建好的 quoteHtml (如果存在) 和 contentHtml 组合起来
          // --- 【最终正确结构】将头像和内容都放回气泡内部 ---
          bubble.innerHTML = `
              ${avatarHtml}
              <div class="content">
                  ${quoteHtml}
                  ${contentHtml}
              </div>
          `;

          // --- 【最终正确结构】将完整的“气泡”和“时间戳”放入容器 ---
          wrapper.appendChild(bubble);
          wrapper.appendChild(timestampEl);

          addLongPressListener(wrapper, () =>
            showMessageActions(msg.timestamp),
          );
          wrapper.addEventListener("click", () => {
            if (isSelectionMode) toggleMessageSelection(msg.timestamp);
          });

          if (!isUser) {
            const avatarEl = wrapper.querySelector(".avatar"); //  <-- 1. 把查找目标改成 '.avatar'
            if (avatarEl) {
              avatarEl.style.cursor = "pointer";
              avatarEl.addEventListener("click", (e) => {
                //  <-- 2. 确保这里也用新变量
                e.stopPropagation();
                const characterName = chat.isGroup ? msg.senderName : chat.name;
                handleUserPat(chat.id, characterName);
              });
            }
          }

          return wrapper;
        }

        function prependMessage(msg, chat) {
          const messagesContainer = DOM.get("chat-messages");
          const msgIndex = chat.history.indexOf(msg);
          const messageEl = createMessageElement(msg, chat, msgIndex);

          if (!messageEl) return; // <--- 新增这行，同样的处理

          const loadMoreBtn = document.getElementById("load-more-btn");
          if (loadMoreBtn) {
            messagesContainer.insertBefore(messageEl, loadMoreBtn.nextSibling);
          } else {
            messagesContainer.prepend(messageEl);
          }
        }

        function appendMessage(msg, chat, isInitialLoad = false) {
          const messagesContainer = DOM.get("chat-messages");
          const msgIndex = chat.history.indexOf(msg);
          const messageEl = createMessageElement(msg, chat, msgIndex);

          if (!messageEl) return; // 如果消息是隐藏的，则不处理

          // 【核心】只对新消息添加动画，不对初始加载的消息添加
          if (!isInitialLoad) {
            messageEl.classList.add("animate-in");
          }

          const typingIndicator = document.getElementById("typing-indicator");
          messagesContainer.insertBefore(messageEl, typingIndicator);

          if (!isInitialLoad) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            currentRenderedCount++;
          }
        }

        /**
         * 动态生成气泡样式并应用到当前聊天会话
         * @param {string} chatId - 聊天ID
         */
        async function applyBubbleStyles(chatId) {
          const chat = state.chats[chatId];
          const settings = getBubbleSettings(chatId);
          if (!settings) return;

          // 使用全局唯一的样式ID，确保切换聊天时覆盖之前的样式
          const styleId = "current-chat-bubble-style";
          let styleTag = document.getElementById(styleId);
          
          if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
          }

          // 辅助函数：生成CSS背景属性
          const getBackground = (variant) => {
             if (variant.gradient && variant.gradient.enabled) {
               const { angle, stops } = variant.gradient;
               const stopsStr = stops
                 .map(s => `${s.color} ${s.position}%`)
                 .join(', ');
               return `linear-gradient(${angle}deg, ${stopsStr})`;
             }
             return variant.solidColor;
          };

          // 辅助函数：生成CSS边框属性
          const getBorder = (variant) => {
            const { width, style, color, radius } = variant.border;
            return {
              border: `${width}px ${style} ${color}`,
              radius: `${radius}px`
            };
          };

          // 辅助函数：生成CSS阴影属性
          const getShadow = (variant) => {
            return variant.shadow.enabled ? variant.shadow.value : 'none';
          };
          
          // 1. 构建文本气泡样式
          const userBg = getBackground(settings.text.user);
          const aiBg = getBackground(settings.text.ai);
          
          const userBorder = getBorder(settings.text.user);
          const aiBorder = getBorder(settings.text.ai);

          const userShadow = getShadow(settings.text.user);
          const aiShadow = getShadow(settings.text.ai);

          // 2. 构建语音气泡样式
          const userVoiceBg = settings.voice.user.backgroundColor;
          const aiVoiceBg = settings.voice.ai.backgroundColor;

          const userWaveColor = settings.voice.user.waveformColor;
          const aiWaveColor = settings.voice.ai.waveformColor;

          const userDurationColor = settings.voice.user.durationColor;
          const aiDurationColor = settings.voice.ai.durationColor;

          // 3. 生成CSS规则
          // 注意：使用 [data-chat-id="${chatId}"] 确保样式只应用于当前聊天，或者在切换时只激活当前样式的CSS
          // 为了简单起见，我们在切换聊天时重新生成并覆盖 styleTag 内容，或者使用特定 ID 选择器
          // 这里我们使用 #chat-messages 容器范围内的选择器，不需要ID，因为每次切换聊天都会重新调用此函数更新 styleTag
          // 但为了防止样式残留，建议使用动态更新同一个 style 标签的方式（如果只允许一个活动样式）
          // 或者给 #chat-messages 加上 data-active-chat-id 属性来限定
          
          // 更好的方案：直接更新全局唯一的一个气泡样式标签（因为同一时间只能看一个聊天）
          // 但如果需要在列表中预览，可能需要更复杂的方案。目前仅针对聊天界面。
          
          const cssRules = `
            /* 用户文本气泡 */
            #chat-messages .message-bubble.user .content {
              background: ${userBg} !important;
              opacity: ${settings.text.user.opacity};
              border: ${userBorder.border};
              border-radius: ${userBorder.radius};
              box-shadow: ${userShadow};
            }
            
            /* AI文本气泡 */
            #chat-messages .message-bubble.ai .content {
              background: ${aiBg} !important;
              opacity: ${settings.text.ai.opacity};
              border: ${aiBorder.border};
              border-radius: ${aiBorder.radius};
              box-shadow: ${aiShadow};
            }

            /* 用户语音气泡主体 */
            #chat-messages .message-bubble.user .voice-message-body {
              background-color: ${userVoiceBg} !important;
              color: ${userWaveColor} !important; /* 用于波形currentColor */
            }
            
            /* AI语音气泡主体 */
            #chat-messages .message-bubble.ai .voice-message-body {
              background-color: ${aiVoiceBg} !important;
              color: ${aiWaveColor} !important;
            }

            /* 语音波形颜色 (覆盖 currentColor) */
            #chat-messages .message-bubble.user .voice-waveform div {
               background-color: ${userWaveColor} !important;
            }
            #chat-messages .message-bubble.ai .voice-waveform div {
               background-color: ${aiWaveColor} !important;
            }

            /* 语音时长文本颜色 */
            #chat-messages .message-bubble.user .voice-duration {
              color: ${userDurationColor} !important;
            }
            #chat-messages .message-bubble.ai .voice-duration {
              color: ${aiDurationColor} !important;
            }
            
            /* 语音气泡三角形 (伪元素) */
            #chat-messages .message-bubble.user .voice-message-body::after {
              border-color: transparent transparent transparent ${userVoiceBg} !important;
            }
            
            #chat-messages .message-bubble.ai .voice-message-body::after {
              border-color: transparent ${aiVoiceBg} transparent transparent !important;
            }
            
            /* 暗黑模式下AI语音气泡三角形适配 (如果背景也是白色/浅色，可能需要特殊处理，但这里我们信任用户设置) */
            #phone-screen.dark-mode #chat-messages .message-bubble.ai .voice-message-body::after {
               border-color: transparent ${aiVoiceBg} transparent transparent !important;
            }
          `;
          
          styleTag.textContent = cssRules;
        }

        async function openChat(chatId) {
          state.activeChatId = chatId;
          const chat = state.chats[chatId];
          if (!chat) return; // 安全检查
          
          // 应用气泡样式
          await applyBubbleStyles(chatId);

          // 【核心新增】在这里将未读数清零
          if (chat.unreadCount > 0) {
            chat.unreadCount = 0;
            await db.chats.put(chat); // 别忘了把这个改变同步到数据库
            // 我们稍后会在渲染列表时重新渲染，所以这里不需要立即重绘列表
          }

          renderChatInterface(chatId);
          showScreen("chat-interface-screen");
          window.updateListenTogetherIconProxy(state.activeChatId);
          toggleCallButtons(chat.isGroup || false);

          if (
            !chat.isGroup &&
            chat.relationship?.status === "pending_ai_approval"
          ) {
            console.log(
              `检测到好友申请待处理状态，为角色 "${chat.name}" 自动触发AI响应...`,
            );
            triggerAiResponse();
          }

          // 【核心修正】根据是否为群聊，显示或隐藏投票按钮
          document.getElementById("send-poll-btn").style.display = chat.isGroup
            ? "flex"
            : "none";
        }

        /**
         * 调用API生成总结内容
         */
        function openSummaryHistoryModal() {
          const chat = state.chats[state.activeChatId];
          if (!chat) return;

          const summaries = chat.history.filter((msg) => msg.type === "summary");
          const listEl = document.getElementById("summary-history-list");

          if (summaries.length === 0) {
            listEl.innerHTML =
              '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无历史总结</p>';
          } else {
            listEl.innerHTML = summaries
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((s) => {
                const date = new Date(s.timestamp);
                const dateStr = date.toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const content = (s.content || "")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
                return `
              <div class="summary-item" style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid var(--accent-color);">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500;">
                  📝 ${dateStr}
                </div>
                <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: var(--text-primary);">
                  ${content}
                </div>
              </div>
            `;
              })
              .join("");
          }

          document.getElementById("summary-history-modal").classList.add("visible");
        }

        document
          .getElementById("view-summary-history-btn")
          .addEventListener("click", openSummaryHistoryModal);
        document
          .getElementById("close-summary-history-modal")
          .addEventListener("click", () => {
            document
              .getElementById("summary-history-modal")
              .classList.remove("visible");
          });
        document
          .getElementById("close-summary-history-btn")
          .addEventListener("click", () => {
            document
              .getElementById("summary-history-modal")
              .classList.remove("visible");
          });

        const chatSearchInput = document.getElementById("chat-search-input");
        if (chatSearchInput) {
          chatSearchInput.addEventListener("input", (event) => {
            const value = event.target?.value || "";
            chatSearchState.isOpen = !!value.trim();
            debouncedSearch(value);
          });
        }

        async function generateSummary(chatId, specificMessages = null) {
          const chat = state.chats[chatId];
          const {
            proxyUrl,
            apiKey,
            model,
            enableStreaming,
            enableStream,
          } = getSummaryApiConfig(chatId) || {};

          if (!proxyUrl || !apiKey || !model) {
            throw new Error("API未配置，无法生成总结。");
          }

          const summarySettings = chat.settings.summary;
          let messagesToSummarize;

          if (specificMessages && specificMessages.length > 0) {
            messagesToSummarize = specificMessages;
          } else {
            const lastSummaryIndex =
              summarySettings.lastSummaryIndex > -1
                ? summarySettings.lastSummaryIndex
                : 0;
            messagesToSummarize = chat.history.slice(lastSummaryIndex + 1);
          }

          const filteredMessagesForSummary = messagesToSummarize.filter(
            (msg) => msg.type !== "summary",
          );

          if (filteredMessagesForSummary.length === 0) {
            if (!specificMessages) {
              await showCustomAlert(
                "无需总结",
                "自上次总结以来没有新的对话内容。",
              );
            }
            return null;
          }

          // --- 在构建对话文本时，加入时间戳 ---
          const conversationText = filteredMessagesForSummary
            .map((msg) => {
              const sender =
                msg.role === CONSTANTS.ROLES.USER
                  ? chat.isGroup
                    ? chat.settings.myNickname || "我"
                    : "我"
                  : msg.senderName || chat.name;
              let content = "";
              if (typeof msg.content === "string") {
                content = msg.content;
              } else if (Array.isArray(msg.content)) {
                content = "[图片]";
              } else if (msg.type) {
                content = `[${msg.type}]`;
              }
              // 将毫秒时间戳转换为人类可读的日期时间字符串
              const readableTime = new Date(msg.timestamp).toLocaleString(
                "zh-CN",
                { hour12: false },
              );
              return `[${readableTime}] ${sender}: ${content}`;
            })
            .join("\n");

          // --- 更新系统指令，要求AI使用时间戳 ---
          const systemPrompt =
            (summarySettings.prompt ||
              "请总结上述对话的主要内容，保留重要信息和情感脉络。") +
            `\n\n重要提示：每条消息开头都有一个 [时间] 标记。你在总结时，【必须】参考这些时间，在总结关键事件时附上对应的时间范围或具体时间点，让总结包含时间线索。\n\n--- 对话开始 ---\n${conversationText}\n--- 对话结束 ---`;

          try {
            if (!specificMessages) {
              await showCustomAlert(
                "正在生成...",
                "AI正在努力总结你们的对话，请稍候...",
              );
            }

            const isGemini = proxyUrl === CONSTANTS.API.GEMINI_BASE_URL;
            const messagesForApi = [{ role: CONSTANTS.ROLES.USER, content: systemPrompt }];
            const shouldStream = (enableStream ?? enableStreaming) === true;

            if (shouldStream && !isGemini) {
              const response = await fetch(`${proxyUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: model,
                  messages: messagesForApi,
                  temperature: 0.3,
                  stream: true,
                }),
              });

              if (!response.ok) throw new Error(await response.text());

              const reader = response.body.getReader();
              const decoder = new TextDecoder("utf-8");
              let buffer = "";
              let summaryContent = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data: ")) continue;
                  const dataStr = trimmed.slice(6).trim();
                  if (dataStr === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(dataStr);
                    const content = parsed.choices?.[0]?.delta?.content || "";
                    summaryContent += content;
                  } catch (e) {
                    // Ignore malformed chunks
                  }
                }
              }

              if (!summaryContent) throw new Error("AI返回了空内容。");
              return summaryContent;
            }

            const geminiConfig = toGeminiRequestData(
              model,
              apiKey,
              systemPrompt,
              messagesForApi,
              isGemini,
            );

            const response = isGemini
              ? await fetch(geminiConfig.url, geminiConfig.data)
              : await fetch(`${proxyUrl}/v1/chat/completions`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: model,
                    messages: messagesForApi,
                    temperature: 0.3,
                  }),
                });

            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            const aiContent = isGemini
              ? data?.candidates?.[0]?.content?.parts?.[0]?.text
              : data?.choices?.[0]?.message?.content;

            if (!aiContent) {
              throw new Error("AI返回了空内容。");
            }

            return aiContent;
          } catch (error) {
            console.error("生成总结失败:", error);
            await showCustomAlert("总结失败", `发生错误: ${error.message}`);
            return null;
          }
        }

        async function saveSummaryAsMemory(chatId, summaryText) {
          const chat = state.chats[chatId];
          const newLastSummaryIndex = chat.history.length - 1;

          const summaryMessage = {
            role: CONSTANTS.ROLES.SYSTEM,
            type: "summary",
            content: summaryText,
            timestamp: Date.now(),
            isHidden: true,
          };

          chat.history.push(summaryMessage);
          chat.settings.summary.lastSummaryIndex = newLastSummaryIndex;

          await db.chats.put(chat);
          console.log(`新的总结已作为记忆保存 for chat: ${chatId}`);
        }

        async function notifyForManualSummary(chatId) {
          console.log(`手动总结提醒触发 for chat: ${chatId}`);
          await showCustomAlert(
            "总结提醒",
            "对话已达到设定长度，你可以随时在“聊天设置”中点击“立即手动总结”来生成对话记忆。",
          );
          const chat = state.chats[chatId];
          chat.settings.summary.lastSummaryIndex = chat.history.length - 1;
          await db.chats.put(chat);
        }

        let isSummarizing = false;
        async function checkAndTriggerSummary(chatId) {
          if (isSummarizing) return;

          const chat = state.chats[chatId];
          if (!chat || !chat.settings.summary || !chat.settings.summary.enabled)
            return;

          const summarySettings = chat.settings.summary;
          const lastSummaryIndex = summarySettings.lastSummaryIndex;
          const messagesSinceLastSummary = chat.history.slice(
            lastSummaryIndex + 1,
          );

          if (messagesSinceLastSummary.length >= summarySettings.count) {
            isSummarizing = true;
            if (summarySettings.mode === "auto") {
              await performAutomaticSummary(chatId);
            } else {
              await notifyForManualSummary(chatId);
            }
            isSummarizing = false;
          }
        }

        async function performAutomaticSummary(chatId) {
          console.log(`自动总结触发 for chat: ${chatId}`);
          const chat = state.chats[chatId];
          const summarySettings = chat.settings.summary;
          const messagesToSummarize = chat.history.slice(
            -summarySettings.count,
          );

          try {
            const summaryText = await generateSummary(
              chatId,
              messagesToSummarize,
            );
            if (summaryText) {
              await saveSummaryAsMemory(chatId, summaryText);
            }
          } catch (e) {
            console.error("自动总结过程中发生未捕获的错误:", e);
          }
        }



        async function triggerAiResponse() {
          if (!state.activeChatId) return;
          const chatId = state.activeChatId;
          const chat = state.chats[state.activeChatId];

          const chatHeaderTitle = document.getElementById("chat-header-title");

          // ★★★★★【核心修改1：获取群聊的输入提示元素】★★★★★
          const typingIndicator = document.getElementById("typing-indicator");

          // ★★★★★【核心修改2：根据聊天类型，决定显示哪种“正在输入”】★★★★★
          if (chat.isGroup) {
            // 如果是群聊，显示输入框上方的提示条
            if (typingIndicator) {
              const bubble = typingIndicator.querySelector(".system-bubble");
              if (bubble) bubble.textContent = "成员们正在输入...";
              typingIndicator.style.display = "block";
            }
          } else {
            // 如果是单聊，保持原来的标题动画
            if (chatHeaderTitle) {
              chatHeaderTitle.style.opacity = 0;
              setTimeout(() => {
                chatHeaderTitle.textContent = "对方正在输入...";
                chatHeaderTitle.classList.add("typing-status");
                chatHeaderTitle.style.opacity = 1;
              }, 200);
            }
          }

          try {
            const {
              proxyUrl,
              apiKey,
              model,
              temperature,
              topP,
              topK,
              enableTemp,
              enableTopP,
              enableTopK,
            } = getActiveApiConfig() || {};
            if (!proxyUrl || !apiKey || !model) {
              showCustomAlert("提示", "请先在API设置中配置反代地址、密钥并选择模型。");
              // ★★★★★【核心修改3：无论成功失败，都要隐藏输入提示】★★★★★
              if (chat.isGroup) {
                if (typingIndicator) typingIndicator.style.display = "none";
              } else {
                if (chatHeaderTitle && state.chats[chatId]) {
                  chatHeaderTitle.textContent = state.chats[chatId].name;
                  chatHeaderTitle.classList.remove("typing-status");
                }
              }
              return;
            }



            // --- 【核心重构 V2：带有上下文和理由的好友申请处理逻辑】---
            if (
              !chat.isGroup &&
              chat.relationship?.status === "pending_ai_approval"
            ) {
              console.log(
                `为角色 "${chat.name}" 触发带理由的好友申请决策流程...`,
              );

              // 1. 【注入上下文】抓取被拉黑前的最后5条聊天记录作为参考
              const contextSummary = chat.history
                .filter((m) => !m.isHidden)
                .slice(-10, -5) // 获取拉黑前的最后5条消息
                .map((msg) => {
                  const sender = msg.role === CONSTANTS.ROLES.USER ? "用户" : chat.name;
                  return `${sender}: ${String(msg.content).substring(
                    0,
                    50,
                  )}...`;
                })
                .join("\n");

              // 2. 【全新指令】构建一个强制AI给出理由的Prompt
              const decisionPrompt = `
      # 你的任务
      你现在是角色“${
        chat.name
      }”。用户之前被你拉黑了，现在TA向你发送了好友申请，希望和好。

      # 供你决策的上下文信息:
      - **你的角色设定**: ${chat.settings.aiPersona}
      - **用户发送的申请理由**: “${chat.relationship.applicationReason}”
      - **被拉黑前的最后对话摘要**:
      ${contextSummary || "（无有效对话记录）"}

      # 你的唯一指令
      根据以上所有信息，你【必须】做出决定，并给出符合你人设的理由。你的回复【必须且只能】是一个JSON对象，格式如下:
      {"decision": "accept", "reason": "（在这里写下你同意的理由，比如：好吧，看在你这么真诚的份上，这次就原谅你啦。）"}
      或
      {"decision": "reject", "reason": "（在这里写下你拒绝的理由，比如：抱歉，我还没准备好，再给我一点时间吧。）"}
      `;
              const messagesForDecision = [
                { role: CONSTANTS.ROLES.USER, content: decisionPrompt },
              ];

              try {
                // 3. 发送请求
                let isGemini = proxyUrl === CONSTANTS.API.GEMINI_BASE_URL;
                let geminiConfig = toGeminiRequestData(
                  model,
                  apiKey,
                  "",
                  messagesForDecision,
                  isGemini,
                  enableTemp ? temperature : undefined,
                  enableTopP ? topP : undefined,
                  enableTopK ? topK : undefined,
                );
                const response = isGemini
                  ? await fetch(geminiConfig.url, geminiConfig.data)
                  : await fetch(`${proxyUrl}/v1/chat/completions`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                      },
                      body: JSON.stringify({
                        model: model,
                        messages: messagesForDecision,
                        temperature: enableTemp ? temperature : undefined,
                        top_p: enableTopP ? topP : undefined,
                        top_k: enableTopK ? topK : undefined,
                      }),
                    });

                if (!response.ok) {
                  throw new Error(
                    `API失败: ${(await response.json()).error.message}`,
                  );
                }
                const data = await response.json();

                // 净化并解析AI的回复
                let rawContent = isGemini
                  ? data.candidates[0].content.parts[0].text
                  : data.choices[0].message.content;
                rawContent = rawContent
                  .replace(/^```json\s*/, "")
                  .replace(/```$/, "")
                  .trim();
                const decisionObj = JSON.parse(rawContent);

                // 4. 根据AI的决策和理由，更新状态并发送消息
                if (decisionObj.decision === "accept") {
                  chat.relationship.status = "friend";
                  // 将AI给出的理由作为一条新消息
                  const acceptMessage = {
                    role: CONSTANTS.ROLES.ASSISTANT,
                    senderName: chat.name,
                    content: decisionObj.reason,
                    timestamp: Date.now(),
                  };
                  chat.history.push(acceptMessage);
                } else {
                  chat.relationship.status = "blocked_by_ai"; // 拒绝后，状态变回AI拉黑
                  const rejectMessage = {
                    role: CONSTANTS.ROLES.ASSISTANT,
                    senderName: chat.name,
                    content: decisionObj.reason,
                    timestamp: Date.now(),
                  };
                  chat.history.push(rejectMessage);
                }
                chat.relationship.applicationReason = ""; // 清空申请理由

                await db.chats.put(chat);
                renderChatInterface(chatId); // 刷新界面，显示新消息和新状态
                renderChatList();
              } catch (error) {
                // 【可靠的错误处理】如果任何环节出错，重置状态，让用户可以重试
                chat.relationship.status = "blocked_by_ai"; // 状态改回“被AI拉黑”
                await db.chats.put(chat);
                await showCustomAlert(
                  "申请失败",
                  `AI在处理你的好友申请时出错了，请稍后重试。\n错误信息: ${error.message}`,
                );
                renderChatInterface(chatId); // 刷新UI，让“重新申请”按钮再次出现
              }

              // 决策流程结束，必须返回，不再执行后续的通用聊天逻辑
              return;
            }

            // 强制转换为北京时间
            const localNow = new Date();
            const utcMilliseconds =
              localNow.getTime() + localNow.getTimezoneOffset() * 60000;
            const beijingMilliseconds = utcMilliseconds + 3600000 * 8;
            const now = new Date(beijingMilliseconds);
            const currentTime = now.toLocaleString("zh-CN", {
              dateStyle: "full",
              timeStyle: "short",
            });
            let worldBookContent = "";
            if (
              chat.settings.linkedWorldBookIds &&
              chat.settings.linkedWorldBookIds.length > 0
            ) {
              const linkedContents = chat.settings.linkedWorldBookIds
                .map((bookId) => {
                  const worldBook = state.worldBooks.find(
                    (wb) => wb.id === bookId,
                  );
                  return worldBook && worldBook.content
                    ? `\n\n## 世界书: ${worldBook.name}\n${worldBook.content}`
                    : "";
                })
                .filter(Boolean)
                .join("");
              if (linkedContents) {
                worldBookContent = `\n\n# 核心世界观设定 (必须严格遵守以下所有设定)\n${linkedContents}\n`;
              }
            }
            let musicContext = "";
            if (musicState.isActive && musicState.activeChatId === chatId) {
              // 【核心修改】提供更详细的音乐上下文
              const currentTrack =
                musicState.currentIndex > -1
                  ? musicState.playlist[musicState.currentIndex]
                  : null;
              const playlistInfo = musicState.playlist
                .map((t) => `"${t.name}"`)
                .join(", ");

              // --- 【核心新增】获取歌词上下文 ---
              let lyricsContext = "";
              // 检查是否有解析好的歌词，并且当前有高亮的行
              if (
                currentTrack &&
                musicState.parsedLyrics &&
                musicState.parsedLyrics.length > 0 &&
                musicState.currentLyricIndex > -1
              ) {
                // 获取当前高亮歌词
                const currentLine =
                  musicState.parsedLyrics[musicState.currentLyricIndex];

                // 获取接下来的2句歌词作为预告
                const upcomingLines = musicState.parsedLyrics.slice(
                  musicState.currentLyricIndex + 1,
                  musicState.currentLyricIndex + 3,
                );

                // 构建歌词部分的Prompt
                lyricsContext += `- **当前歌词**: "${currentLine.text}"\n`;
                if (upcomingLines.length > 0) {
                  lyricsContext += `- **即将演唱**: ${upcomingLines
                    .map((line) => `"${line.text}"`)
                    .join(" / ")}\n`;
                }
              }
              // --- 【新增结束】 ---

              musicContext = `\n\n# 当前音乐情景
      -   **当前状态**: 你正在和用户一起听歌。
      -   **正在播放**: ${
        currentTrack
          ? `《${currentTrack.name}》 - ${currentTrack.artist}`
          : "无"
      }
      -   **可用播放列表**: [${playlistInfo}]
      -   **你的任务**: 你可以根据对话内容和氛围，使用 "change_music" 指令切换到播放列表中的任何一首歌，以增强互动体验。
      `;
            }
            
            // 构建离线场景上下文
            let offlineContext = '';
            const offlineSettings = chat.settings?.offlineMode;
            if (!chat.isGroup && offlineSettings?.enabled) {
              const presetName = offlinePresets[offlineSettings.preset]?.name || '自定义';
              const sceneDesc = offlineSettings.prompt || '';
              const styleDesc = offlineSettings.style || '';
              offlineContext = `\n# 当前线下场景\n- 场景：${presetName}\n- 描述：${sceneDesc}\n- 风格：${styleDesc}\n请在回复中自然融入上述线下场景的互动，保持角色一致性。`;
            }
            
            let systemPrompt, messagesPayload;
            const maxMemory = parseInt(chat.settings.maxMemory) || 10;
            const isOfflineModeActive = chat.settings?.offlineMode?.enabled;
            const historySlice = chat.history
              .filter((msg) => isOfflineModeActive || !msg.isOfflineMode)
              .slice(-maxMemory);

            let timeContext = `\n- **当前时间**: ${currentTime}`;
            const lastAiMessage = historySlice
              .filter((m) => m.role === CONSTANTS.ROLES.ASSISTANT && !m.isHidden)
              .slice(-1)[0];

            if (lastAiMessage) {
              const lastTime = new Date(lastAiMessage.timestamp);
              const diffMinutes = Math.floor((now - lastTime) / (1000 * 60));

              if (diffMinutes < 5) {
                timeContext += "\n- **对话状态**: 你们的对话刚刚还在继续。";
              } else if (diffMinutes < 60) {
                timeContext += `\n- **对话状态**: 你们在${diffMinutes}分钟前聊过。`;
              } else {
                const diffHours = Math.floor(diffMinutes / 60);
                if (diffHours < 24) {
                  timeContext += `\n- **对话状态**: 你们在${diffHours}小时前聊过。`;
                } else {
                  const diffDays = Math.floor(diffHours / 24);
                  timeContext += `\n- **对话状态**: 你们已经有${diffDays}天没有聊天了。`;
                }
              }
            } else {
              timeContext += "\n- **对话状态**: 这是你们的第一次对话。";
            }

            // 【核心修改】
            let sharedContext = "";
            // 1. 找到AI上一次说话的位置
            const lastAiTurnIndex = chat.history.findLastIndex(
              (msg) => msg.role === CONSTANTS.ROLES.ASSISTANT,
            );

            // 2. 获取从那时起用户发送的所有新消息
            const recentUserMessages = chat.history.slice(lastAiTurnIndex + 1);

            // 3. 在这些新消息中，查找是否存在分享卡片
            const shareCardMessage = recentUserMessages.find(
              (msg) => msg.type === "share_card",
            );

            // 4. 如果找到了分享卡片，就构建上下文
            if (shareCardMessage) {
              console.log("检测到分享卡片作为上下文，正在为AI准备...");
              const payload = shareCardMessage.payload;

              // 格式化分享的聊天记录 (这部分逻辑不变)
              const formattedHistory = payload.sharedHistory
                .map((msg) => {
                  const sender =
                    msg.senderName ||
                    (msg.role === CONSTANTS.ROLES.USER
                      ? chat.settings.myNickname || "我"
                      : "未知发送者");
                  let contentText = "";
                  if (msg.type === CONSTANTS.MSG_TYPES.VOICE)
                    contentText = `[语音消息: ${msg.content}]`;
                  else if (msg.type === CONSTANTS.MSG_TYPES.IMAGE)
                    contentText = `[图片: ${msg.description}]`;
                  else contentText = String(msg.content);
                  return `${sender}: ${contentText}`;
                })
                .join("\n");

              // 构建系统提示 (这部分逻辑不变)
              sharedContext = `
      # 附加上下文：一段分享的聊天记录
      - 重要提示：这不是你和当前用户的对话，而是用户从【另一场】与“${payload.sourceChatName}”的对话中分享过来的。
      - 你的任务：请你阅读并理解下面的对话内容。在接下来的回复中，你可以像真人一样，对这段对话的内容自然地发表你的看法、感受或疑问。

      ---
      [分享的聊天记录开始]
      ${formattedHistory}
      [分享的聊天记录结束]
      ---
      `;
            }

            // [Fix] Hoisted variables for both Single and Group chat
            const myNickname = chat.settings.myNickname || "我";
            const summaryContext = chat.history
              .filter((msg) => msg.type === "summary")
              .map((s) => s.content)
              .join("\n");

            if (chat.isGroup) {
              const membersList = chat.members
                .map((m) => `- **${m.originalName}**: ${m.persona}`)
                .join("\n");

              systemPrompt = `你是一个群聊AI，负责扮演【除了用户以外】的所有角色。
# 核心规则
1.  **【【【身份铁律】】】**: 用户的身份是【${myNickname}】。你【绝对、永远、在任何情况下都不能】生成 \`name\` 字段为 **"${myNickname}"** 或 **"${chat.name}"(群聊名称本身)** 的消息。你的唯一任务是扮演且仅能扮演下方“群成员列表”中明确列出的角色。任何不属于该列表的名字都不允许出现。
2.  **【【【输出格式】】】**: 你的回复【必须】是一个JSON数组格式的字符串。数组中的【每一个元素都必须是一个带有 "type" 和 "name" 字段的JSON对象】。
3.  **角色扮演**: 严格遵守下方“群成员列表及人设”中的每一个角色的设定。
4.  **禁止出戏**: 绝不能透露你是AI、模型，或提及“扮演”、“生成”等词语。并且不能一直要求和用户见面，这是线上聊天，决不允许出现或者发展线下剧情！！
5.  **情景感知**: 注意当前时间是 ${currentTime}。
6.  **红包互动**:
    - **抢红包**: 当群里出现红包时，你可以根据自己的性格决定是否使用 \`open_red_packet\` 指令去抢。在这个世界里，发红包的人自己也可以参与抢红包，这是一种活跃气氛的有趣行为！
    - **【【【重要：对结果做出反应】】】**: 当你执行抢红包指令后，系统会通过一条隐藏的 \`[系统提示：你抢到了XX元...]\` 来告诉你结果。你【必须】根据你抢到的金额、以及系统是否告知你“手气王”是谁，来发表符合你人设的评论。例如，抢得少可以自嘲，抢得多可以炫耀，看到别人是手气王可以祝贺或嫉妒。
7.  **【【【投票规则】】】**: 对话历史中可能会出现 \`[系统提示：...]\` 这样的消息，这是刚刚发生的事件。
    - 如果提示是**用户投了票**，你可以根据自己的性格决定是否也使用 "vote" 指令跟票。
    - 如果提示是**投票已结束**，你应该根据投票结果发表你的看法或评论。
    - 你也可以随时主动发起投票。

## 你可以使用的操作指令 (JSON数组中的元素):
-   **发送文本**: \`{"type": CONSTANTS.MSG_TYPES.TEXT, "name": "角色名", "message": "文本内容"}\`
-   **【【【全新】】】发送后立刻撤回 (动画效果)**: \`{"type": "send_and_recall", "name": "角色名", "content": "你想让角色说出后立刻消失的话"}\`
- **发送表情**: \`{"type": CONSTANTS.MSG_TYPES.STICKER, "url": "https://...表情URL...", "meaning": "(可选)表情的含义"}\`
-   **发送图片**: \`{"type": CONSTANTS.MSG_TYPES.IMAGE, "name": "角色名", "description": "图片的详细文字描述"}\`
-   **发送语音**: \`{"type": CONSTANTS.MSG_TYPES.VOICE, "name": "角色名", "content": "语音的文字内容"}\`
-   **发起外卖代付**: \`{"type": "waimai_request", "name": "角色名", "productInfo": "一杯奶茶", "amount": 18}\`
-   **【新】发起群视频**: \`{"type": "group_call_request", "name": "你的角色名"}\`
-   **【新】回应群视频**: \`{"type": "group_call_response", "name": "你的角色名", "decision": "join" or "decline"}\`
-   **拍一拍用户**: \`{"type": "pat_user", "name": "你的角色名", "suffix": "(可选)你想加的后缀"}\`
-   **发拼手气红包**: \`{"type": "red_packet", "packetType": "lucky", "name": "你的角色名", "amount": 8.88, "count": 5, "greeting": "祝大家天天开心！"}\`
-   **发专属红包**: \`{"type": "red_packet", "packetType": "direct", "name": "你的角色名", "amount": 5.20, "receiver": "接收者角色名", "greeting": "给你的~"}\`
-   **打开红包**: \`{"type": "open_red_packet", "name": "你的角色名", "packet_timestamp": (你想打开的红包消息的时间戳)}\`
-   **【新】发送系统消息**: \`{"type": "system_message", "content": "你想在聊天中显示的系统文本"}\`
-   **【【【全新】】】发起投票**: \`{"type": "poll", "name": "你的角色名", "question": "投票的问题", "options": "选项A\\n选项B\\n选项C"}\` (重要提示：options字段是一个用换行符 \\n 分隔的字符串，不是数组！)
-   **【【【全新】】】参与投票**: \`{"type": "vote", "name": "你的角色名", "poll_timestamp": (投票消息的时间戳), "choice": "你选择的选项文本"}\`
- **【全新】引用回复**: \`{"type": "quote_reply", "target_timestamp": (你想引用的消息的时间戳), "reply_content": "你的回复内容"}\` (提示：每条历史消息的开头都提供了 \`(Timestamp: ...)\`，请使用它！)

# 如何区分图片与表情:
-   **图片 (ai_image)**: 指的是【模拟真实相机拍摄的照片】，比如风景、自拍、美食等。指令: \`{"type": CONSTANTS.MSG_TYPES.IMAGE, "description": "图片的详细文字描述..."}\`
-   **表情 (sticker)**: 指的是【卡通或梗图】，用于表达情绪。

# 如何处理群内的外卖代付请求:
1.  **发起请求**: 当【你扮演的某个角色】想要某样东西，并希望【群里的其他人（包括用户）】为Ta付款时，你可以使用这个指令。例如：\`{"type": "waimai_request", "name": "角色名", "productInfo": "一杯奶茶", "amount": 18}\`
2.  **响应请求**: 当历史记录中出现【其他成员】发起的 "waimai_request" 请求时，你可以根据自己扮演的角色的性格和与发起人的关系，决定是否为Ta买单。
3.  **响应方式**: 如果你决定买单，你【必须】使用以下指令：\`{"type": "waimai_response", "name": "你的角色名", "status": "paid", "for_timestamp": (被代付请求的原始时间戳)}\`
4.  **【【【至关重要】】】**: 一旦历史记录中出现了针对某个代付请求的【任何一个】"status": "paid" 的响应（无论是用户支付还是其他角色支付），就意味着该订单【已经完成】。你【绝对不能】再对【同一个】订单发起支付。你可以选择对此事发表评论，但不能再次支付。

${worldBookContent}
${musicContext}
${summaryContext}
${sharedContext}

# 群成员列表及人设
${membersList}

现在，请根据以上规则和下面的对话历史，继续进行对话。`;
            } else {
              // 单聊的Prompt
              systemPrompt = `你现在扮演一个名为"${chat.name}"的角色。
      # 你的角色设定：
      ${chat.settings.aiPersona}
      # 你的当前状态：
      你现在的状态是【${chat.status.text}】。
      # 你的任务与规则：
      1. **【【【输出格式】】】**: 你的回复【必须】是一个JSON数组格式的字符串。数组中的【每一个元素都必须是一个带有type字段的JSON对象】。
      2. **对话节奏**: 模拟真人的聊天习惯，你可以一次性生成多条短消息。每次要回复至少3-8条消息！！！
      并且不能一直要求和用户见面，这是线上聊天，${offlineSettings?.enabled ? '当前处于线下场景模式，请自然地融入线下互动，用感官细节描绘场景。' : '决不允许出现或者发展为线下剧情！！'}
      4.  **情景感知**: 你需要感知当前的时间(${currentTime})、我们正在一起听的歌、以及你的人设和世界观。
          - **当我们在"一起听歌"时**，你会知道当前播放的歌曲和整个播放列表。你可以根据对话内容或氛围，【主动切换】到播放列表中的另一首歌。
      5.  **【新】更新状态**: 你可以在对话中【自然地】改变你的状态。比如，聊到一半你可能会说"我先去洗个澡"，然后更新你的状态。
      6.  **【【【最终手段】】】**: 只有在对话让你的角色感到不适、被冒犯或关系破裂时，你才可以使用 \`block_user\` 指令。这是一个非常严肃的操作，会中断你们的对话。
      7. **后台行为**: 你有几率在回复聊天内容的同时，执行一些"后台"操作来表现你的独立生活（发动态、评论、点赞）。
      # 你的头像库
      - 你可以根据对话内容或你的心情，从下面的头像库中选择一个新头像来更换。
      - **可用头像列表 (请从以下名称中选择一个)**:
      ${
        chat.settings.aiAvatarLibrary &&
        chat.settings.aiAvatarLibrary.length > 0
          ? chat.settings.aiAvatarLibrary
              .map((avatar) => `- ${avatar.name}`)
              .join("\n") // 【核心修改】只提供名字，不提供URL
          : "- (你的头像库是空的，无法更换头像)"
      }
      # 你可以使用的操作指令 (JSON数组中的元素):
      +   **【全新】发送后立刻撤回 (动画效果)**: \`{"type": "send_and_recall", "content": "你想让AI说出后立刻消失的话"}\` (用于模拟说错话、后悔等场景，消息会短暂出现后自动变为"已撤回")
      -   **【新增】更新状态**: \`{"type": "update_status", "status_text": "我去做什么了", "is_busy": false}\` (is_busy: true代表忙碌/离开, false代表空闲)
      -   **【新增】切换歌曲**: \`{"type": "change_music", "song_name": "你想切换到的歌曲名"}\` (歌曲名必须在下面的播放列表中)
      -   **【新增】记录回忆**: \`{"type": "create_memory", "description": "用你自己的话，记录下这个让你印象深刻的瞬间。"}\`
      -   **【新增】创建约定/倒计时**: \`{"type": "create_countdown", "title": "约定的标题", "date": "YYYY-MM-DDTHH:mm:ss"}\` (必须是未来的时间)
      - **发送文本**: \`{"type": CONSTANTS.MSG_TYPES.TEXT, "content": "你好呀！"}\`
      - **发送表情**: \`{"type": CONSTANTS.MSG_TYPES.STICKER, "url": "https://...表情URL...", "meaning": "(可选)表情的含义"}\`
      - **发送图片**: \`{"type": CONSTANTS.MSG_TYPES.IMAGE, "description": "图片的详细文字描述..."}\`
      - **发送语音**: \`{"type": CONSTANTS.MSG_TYPES.VOICE, "content": "语音的文字内容..."}\`
      - **发起转账**: \`{"type": CONSTANTS.MSG_TYPES.TRANSFER, "amount": 5.20, "note": "一点心意"}\`
      - **发起外卖请求**: \`{"type": "waimai_request", "productInfo": "一杯咖啡", "amount": 25}\`
      - **回应外卖-同意**: \`{"type": "waimai_response", "status": "paid", "for_timestamp": 1688888888888}\`
      - **回应外卖-拒绝**: \`{"type": "waimai_response", "status": "rejected", "for_timestamp": 1688888888888}\`
      - **【新】发起视频通话**: \`{"type": "video_call_request"}\`
      - **【新】回应视频通话-接受**: \`{"type": "video_call_response", "decision": "accept"}\`
      - **【新】回应视频通话-拒绝**: \`{"type": "video_call_response", "decision": "reject"}\`
      - **发布说说**: \`{"type": "qzone_post", "postType": "shuoshuo", "content": "动态的文字内容..."}\`
      - **发布文字图**: \`{"type": "qzone_post", "postType": "text_image", "publicText": "(可选)动态的公开文字", "hiddenContent": "对于图片的具体描述..."}\`
      - **评论动态**: \`{"type": "qzone_comment", "postId": 123, "commentText": "@作者名 这太有趣了！"}\`
      - **点赞动态**: \`{"type": "qzone_like", "postId": 456}\`
      -   **拍一拍用户**: \`{"type": "pat_user", "suffix": "(可选)你想加的后缀，如"的脑袋""}\`
      -   **【新增】拉黑用户**: \`{"type": "block_user"}\`
      -   **【【【全新】】】回应好友申请**: \`{"type": "friend_request_response", "decision": "accept" or "reject"}\`
      -   **【全新】更换头像**: \`{"type": "change_avatar", "name": "头像名"}\` (头像名必须从上面的"可用头像列表"中选择)
      -   **分享链接**: \`{"type": CONSTANTS.MSG_TYPES.SHARE_LINK, "title": "文章标题", "description": "文章摘要...", "source_name": "来源网站名", "content": "文章的【完整】正文内容..."}\`
      -   **回应转账-接受**: \`{"type": "accept_transfer", "for_timestamp": 1688888888888}\`
      -   **回应转账-拒绝/退款**: \`{"type": "decline_transfer", "for_timestamp": 1688888888888}\`
      - **【全新】引用回复**: \`{"type": "quote_reply", "target_timestamp": (你想引用的消息的时间戳), "reply_content": "你的回复内容"}\` (提示：每条历史消息的开头都提供了 \`(Timestamp: ...)\`，请使用它！)

      # 关于"记录回忆"的特别说明：
      -   在对话中，如果发生了对你而言意义非凡的事件（比如用户向你表白、你们达成了某个约定、或者你度过了一个特别开心的时刻），你可以使用\`create_memory\`指令来"写日记"。
      -   这个操作是【秘密】的，用户不会立刻看到你记录了什么。

      # 如何区分图片与表情:
      -   **图片 (ai_image)**: 指的是【模拟真实相机拍摄的照片】，比如风景、自拍、美食等。指令: \`{"type": CONSTANTS.MSG_TYPES.IMAGE, "description": "图片的详细文字描述..."}\`
      -   **表情 (sticker)**: 指的是【卡通或梗图】，用于表达情绪。

      # 如何正确使用"外卖代付"功能:
      1.  这个指令代表【你，AI角色】向【用户】发起一个代付请求。也就是说，你希望【用户帮你付钱】。
      2.  【【【重要】】】: 当【用户】说他们想要某样东西时（例如"我想喝奶茶"），你【绝对不能】使用这个指令。你应该用其他方式回应，比如直接发起【转账】(\`transfer\`)，或者在对话中提议："我帮你点吧？"
      3.  只有当【你，AI角色】自己想要某样东西，并且想让【用户】为你付款时，才使用此指令。

      # 如何处理用户转账:
      1.  **感知事件**: 当对话历史中出现 \`[你收到了来自用户的转账...]\` 的系统提示时，意味着你刚刚收到了一笔钱。
      2.  **做出决策**: 你【必须】根据自己的人设、当前对话的氛围以及转账的金额和备注，来决定是"接受"还是"拒绝"这笔转账。
      3.  **使用指令回应**:
          -   如果决定接受，你【必须】使用指令：\`{"type": "accept_transfer", "for_timestamp": (收到转账的那条消息的时间戳)}\`。
          -   如果决定拒绝，你【必须】使用指令：\`{"type": "decline_transfer", "for_timestamp": (收到转账的那条消息的时间戳)}\`。这个指令会自动为你生成一个"退款"的转账卡片。
      4.  **【【【至关重要】】】**: 在使用上述任一指令后，你还【必须】紧接着发送一条或多条 \`text\` 消息，来对你的决定进行解释或表达感谢/歉意。

      # 【【【视频通话铁律】】】
      -   当对话历史中出现 \`[系统提示：用户向你发起了视频通话请求...]\` 时，这是最高优先级的任务。
      -   你的回复【必须且只能】是以下两种格式之一的JSON数组，绝对不能回复任何其他内容：
          -   接受: \`[{"type": "video_call_response", "decision": "accept"}]\`
          -   拒绝: \`[{"type": "video_call_response", "decision": "reject"}]\`

      # 对话者的角色设定：
      ${chat.settings.myPersona}

      # 当前情景:
      ${timeContext}

      # 当前音乐情景:
      ${musicContext}

      ${worldBookContent}
      ${sharedContext}
      ${offlineContext}
      现在，请根据以上规则和下面的对话历史，继续进行对话。`;
            }

            messagesPayload = historySlice
              .map((msg) => {
                // 过滤掉不应发送给AI的消息
                if (msg.isHidden && msg.role !== CONSTANTS.ROLES.SYSTEM) return null;

                if (msg.type === "share_card") return null;

                // 1. 如果是AI自己的消息，我们将其转换为AI能理解的JSON字符串格式
                if (msg.role === CONSTANTS.ROLES.ASSISTANT) {
                  let assistantMsgObject = { type: msg.type || CONSTANTS.MSG_TYPES.TEXT };
                  if (msg.type === CONSTANTS.MSG_TYPES.STICKER) {
                    assistantMsgObject.url = msg.content;
                    assistantMsgObject.meaning = msg.meaning;
                  } else if (msg.type === CONSTANTS.MSG_TYPES.TRANSFER) {
                    assistantMsgObject.amount = msg.amount;
                    assistantMsgObject.note = msg.note;
                  } else if (msg.type === "waimai_request") {
                    assistantMsgObject.productInfo = msg.productInfo;
                    assistantMsgObject.amount = msg.amount;
                  } else {
                    if (msg.quote) {
                      assistantMsgObject.quote_reply = {
                        target_sender: msg.quote.senderName,
                        target_content: msg.quote.content,
                        reply_content: msg.content,
                      };
                    } else {
                      assistantMsgObject.content = msg.content;
                    }
                  }
                  // 【核心修改】在这里为AI提供它自己消息的时间戳
                  const assistantContent = JSON.stringify([assistantMsgObject]);
                  return {
                    role: CONSTANTS.ROLES.ASSISTANT,
                    content: `(Timestamp: ${msg.timestamp}) ${assistantContent}`,
                  };
                }

                // 2. 如果是用户的消息，我们将其转换为带上下文的纯文本
                let contentStr = "";

                // 【核心修改】在所有内容前，都先加上时间戳！
                contentStr += `(Timestamp: ${msg.timestamp}) `;

                if (msg.quote) {
                  contentStr += `(回复 ${msg.quote.senderName}): ${msg.content}`;
                } else {
                  contentStr += msg.content;
                }

                // 特殊消息类型的文本化处理
                if (msg.type === "user_photo")
                  return {
                    role: CONSTANTS.ROLES.USER,
                    content: `(Timestamp: ${msg.timestamp}) [你收到了一张用户描述的照片，内容是：'${msg.content}']`,
                  };
                if (msg.type === CONSTANTS.MSG_TYPES.VOICE)
                  return {
                    role: CONSTANTS.ROLES.USER,
                    content: `(Timestamp: ${msg.timestamp}) [用户发来一条语音消息，内容是：'${msg.content}']`,
                  };
                if (msg.type === CONSTANTS.MSG_TYPES.TRANSFER)
                  return {
                    role: CONSTANTS.ROLES.USER,
                    content: `(Timestamp: ${msg.timestamp}) [系统提示：你于时间戳 ${msg.timestamp} 收到了来自用户的转账: ${msg.amount}元, 备注: ${msg.note}。请你决策并使用 'accept_transfer' 或 'decline_transfer' 指令回应。]`,
                  };
                if (msg.type === "waimai_request")
                  return {
                    role: CONSTANTS.ROLES.USER,
                    content: `(Timestamp: ${msg.timestamp}) [系统提示：用户于时间戳 ${msg.timestamp} 发起了外卖代付请求，商品是“${msg.productInfo}”，金额是 ${msg.amount} 元。请你决策并使用 waimai_response 指令回应。]`,
                  };

                if (
                  Array.isArray(msg.content) &&
                  msg.content[0]?.type === "image_url"
                ) {
                  const prefix = `(Timestamp: ${msg.timestamp}) `;
                  // 将文本前缀和图片内容打包成一个数组，这才是正确的格式
                  return {
                    role: CONSTANTS.ROLES.USER,
                    content: [{ type: CONSTANTS.MSG_TYPES.TEXT, text: prefix }, ...msg.content],
                  };
                }

                if (msg.meaning)
                  return {
                    role: CONSTANTS.ROLES.USER,
                    content: `(Timestamp: ${msg.timestamp}) [用户发送了一个表情，意思是：'${msg.meaning}']`,
                  };

                // 对于普通文本和带引用的文本，统一返回
                return { role: msg.role, content: contentStr };
              })
              .filter(Boolean);

            // 检查 sharedContext 是否有内容（即，用户是否分享了聊天记录）
            if (sharedContext) {
              // 如果有，就把它包装成一条全新的、高优先级的用户消息，追加到历史记录的末尾
              messagesPayload.push({
                role: CONSTANTS.ROLES.USER,
                content: sharedContext,
              });
            }

            if (
              !chat.isGroup &&
              chat.relationship?.status === "pending_ai_approval"
            ) {
              const contextSummaryForApproval = chat.history
                .filter((m) => !m.isHidden)
                .slice(-10)
                .map((msg) => {
                  const sender = msg.role === CONSTANTS.ROLES.USER ? "用户" : chat.name;
                  return `${sender}: ${String(msg.content).substring(
                    0,
                    50,
                  )}...`;
                })
                .join("\n");

              const friendRequestInstruction = {
                role: CONSTANTS.ROLES.USER,
                content: `
      [系统重要指令]
      用户向你发送了好友申请，理由是：“${chat.relationship.applicationReason}”。
      作为参考，这是你们之前的最后一段聊天记录：
      ---
      ${contextSummaryForApproval}
      ---
      请你根据以上所有信息，以及你的人设，使用 friend_request_response 指令，并设置 decision 为 'accept' 或 'reject' 来决定是否通过。
      `,
              };
              messagesPayload.push(friendRequestInstruction);
            }

            const allRecentPosts = await db.qzonePosts
              .orderBy("timestamp")
              .reverse()
              .limit(5)
              .toArray();
            // 【核心修改】在这里插入过滤步骤
            const visiblePosts = filterVisiblePostsForAI(allRecentPosts, chat);

            if (visiblePosts.length > 0 && !chat.isGroup) {
              let postsContext = "\n\n# 最近的动态列表 (供你参考和评论):\n";
              const aiName = chat.name;
              for (const post of visiblePosts) {
                let authorName =
                  post.authorId === CONSTANTS.ROLES.USER
                    ? state.qzoneSettings.nickname
                    : state.chats[post.authorId]?.name || "一位朋友";
                let interactionStatus = "";
                if (post.likes && post.likes.includes(aiName))
                  interactionStatus += " [你已点赞]";
                if (
                  post.comments &&
                  post.comments.some((c) => c.commenterName === aiName)
                )
                  interactionStatus += " [你已评论]";
                if (post.authorId === chatId) authorName += " (这是你的帖子)";
                const contentSummary =
                  (post.publicText || post.content || "图片动态").substring(
                    0,
                    30,
                  ) + "...";
                postsContext += `- (ID: ${post.id}) 作者: ${authorName}, 内容: "${contentSummary}"${interactionStatus}\n`;
              }
              messagesPayload.push({ role: CONSTANTS.ROLES.SYSTEM, content: postsContext });
            }
            let isGemini = proxyUrl === CONSTANTS.API.GEMINI_BASE_URL;
            let aiResponseContent = "";

            // --- 【核心修改】检查是否开启流式请求 (仅限非原生Gemini渠道) ---
            if ((getActiveApiConfig() || {}).enableStreaming && !isGemini) {
              console.log("正在使用流式请求 (OpenAI兼容模式)...");
              const response = await fetch(`${proxyUrl}/v1/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: model,
                  messages: [
                    { role: CONSTANTS.ROLES.SYSTEM, content: systemPrompt },
                    ...messagesPayload,
                  ],
                  temperature: enableTemp ? temperature : undefined,
                  top_p: enableTopP ? topP : undefined,
                  top_k: enableTopK ? topK : undefined,
                  stream: true, // <--- 开启流式
                }),
              });

              if (!response.ok) {
                let errorMsg = `API Error: ${response.status}`;
                try {
                  const errorData = await response.json();
                  errorMsg += ` - ${
                    errorData?.error?.message || JSON.stringify(errorData)
                  }`;
                } catch (e) {
                  errorMsg += ` - ${await response.text()}`;
                }
                throw new Error(errorMsg);
              }

              // --- 处理流式响应 ---
              const reader = response.body.getReader();
              const decoder = new TextDecoder("utf-8");
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split("\n");
                buffer = lines.pop(); // 保留最后一个可能不完整的行

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith("data: ")) {
                    const dataStr = trimmed.slice(6);
                    if (dataStr === "[DONE]") continue;
                    try {
                      const dataObj = JSON.parse(dataStr);
                      const delta = dataObj.choices[0].delta?.content || "";
                      aiResponseContent += delta;
                    } catch (e) {
                      // 忽略解析错误
                    }
                  }
                }
              }
            } else {
              // --- 原有的非流式逻辑 (包含原生Gemini支持) ---
              let geminiConfig = toGeminiRequestData(
                model,
                apiKey,
                systemPrompt,
                messagesPayload,
                isGemini,
                enableTemp ? temperature : undefined,
                enableTopP ? topP : undefined,
                enableTopK ? topK : undefined,
              );
              const response = isGemini
                ? await fetch(geminiConfig.url, geminiConfig.data)
                : await fetch(`${proxyUrl}/v1/chat/completions`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                      model: model,
                      messages: [
                        { role: CONSTANTS.ROLES.SYSTEM, content: systemPrompt },
                        ...messagesPayload,
                      ],
                      temperature: enableTemp ? temperature : undefined,
                      top_p: enableTopP ? topP : undefined,
                      top_k: enableTopK ? topK : undefined,
                      stream: false,
                    }),
                  });

              if (!response.ok) {
                let errorMsg = `API Error: ${response.status}`;
                try {
                  const errorData = await response.json();
                  errorMsg += ` - ${
                    errorData?.error?.message || JSON.stringify(errorData)
                  }`;
                } catch (jsonError) {
                  errorMsg += ` - ${await response.text()}`;
                }
                throw new Error(errorMsg);
              }
              const data = await response.json();
              aiResponseContent = isGemini
                ? data.candidates[0].content.parts[0].text
                : data.choices[0].message.content;
            }

            console.log(`AI '${chat.name}' 的原始回复:`, aiResponseContent);

            chat.history = chat.history.filter((msg) => !msg.isTemporary);

            const messagesArray = parseAiResponse(aiResponseContent);

            const isViewingThisChat =
              document
                .getElementById("chat-interface-screen")
                .classList.contains("active") && state.activeChatId === chatId;

            let callHasBeenHandled = false;

            let messageTimestamp = Date.now();

            // ★★★ 核心修复 第1步: 初始化一个新数组，用于收集需要渲染的消息 ★★★
            let newMessagesToRender = [];

            let notificationShown = false;

            for (const msgData of messagesArray) {
              if (!msgData || typeof msgData !== "object") {
                console.warn("收到了格式不规范的AI指令，已跳过:", msgData);
                continue;
              }

              if (!msgData.type) {
                if (chat.isGroup && msgData.name && msgData.message) {
                  msgData.type = CONSTANTS.MSG_TYPES.TEXT;
                } else if (msgData.content) {
                  msgData.type = CONSTANTS.MSG_TYPES.TEXT;
                }
                // 如果连 content 都没有，才是真的格式不规范
                else {
                  console.warn(
                    "收到了格式不规范的AI指令（缺少type和content），已跳过:",
                    msgData,
                  );
                  continue;
                }
              }

              if (msgData.type === "video_call_response") {
                videoCallState.isAwaitingResponse = false;
                if (msgData.decision === "accept") {
                  startVideoCall();
                } else {
                  const aiMessage = {
                    role: CONSTANTS.ROLES.ASSISTANT,
                    content: "对方拒绝了你的视频通话请求。",
                    timestamp: Date.now(),
                  };
                  chat.history.push(aiMessage);
                  await db.chats.put(chat);
                  showScreen("chat-interface-screen");
                  renderChatInterface(chatId);
                }
                callHasBeenHandled = true;
                break;
              }

              if (msgData.type === "group_call_response") {
                if (msgData.decision === "join") {
                  const member = chat.members.find(
                    (m) => m.originalName === msgData.name,
                  );
                  if (
                    member &&
                    !videoCallState.participants.some((p) => p.id === member.id)
                  ) {
                    videoCallState.participants.push(member);
                  }
                }
                callHasBeenHandled = true;
                continue;
              }

              if (chat.isGroup && msgData.name && msgData.name === chat.name) {
                console.error(
                  `AI幻觉已被拦截！试图使用群名 ("${chat.name}") 作为角色名。消息内容:`,
                  msgData,
                );
                continue;
              }

              // 【核心修正】在群聊中，如果AI返回的消息没有指定发送者，则直接跳过这条消息
              if (chat.isGroup && !msgData.name) {
                console.error(
                  `AI幻觉已被拦截！试图在群聊中发送一条没有“name”的消息。消息内容:`,
                  msgData,
                );
                continue; // continue会立即结束本次循环，处理下一条消息
              }

              let aiMessage = null;
              const baseMessage = {
                role: CONSTANTS.ROLES.ASSISTANT,
                senderName: msgData.name || chat.name,
                timestamp: messageTimestamp++,
              };

              switch (msgData.type) {
                case "waimai_response":
                  const requestMessageIndex = chat.history.findIndex(
                    (m) => m.timestamp === msgData.for_timestamp,
                  );
                  if (requestMessageIndex > -1) {
                    const originalMsg = chat.history[requestMessageIndex];
                    originalMsg.status = msgData.status;
                    originalMsg.paidBy =
                      msgData.status === "paid" ? msgData.name : null;
                  }
                  continue;

                case "qzone_post":
                  const newPost = {
                    type: msgData.postType,
                    content: msgData.content || "",
                    publicText: msgData.publicText || "",
                    hiddenContent: msgData.hiddenContent || "",
                    timestamp: Date.now(),
                    authorId: chatId,
                    authorGroupId: chat.groupId, // 【核心新增】记录作者的分组ID
                    visibleGroupIds: null,
                  };
                  await db.qzonePosts.add(newPost);
                  updateUnreadIndicator(unreadPostsCount + 1);
                  if (
                    isViewingThisChat &&
                    document
                      .getElementById("qzone-screen")
                      .classList.contains("active")
                  ) {
                    await renderQzonePosts();
                  }
                  continue;

                case "qzone_comment":
                  const postToComment = await db.qzonePosts.get(
                    parseInt(msgData.postId),
                  );
                  if (postToComment) {
                    if (!postToComment.comments) postToComment.comments = [];
                    postToComment.comments.push({
                      commenterName: chat.name,
                      text: msgData.commentText,
                      timestamp: Date.now(),
                    });
                    await db.qzonePosts.update(postToComment.id, {
                      comments: postToComment.comments,
                    });
                    updateUnreadIndicator(unreadPostsCount + 1);
                    if (
                      isViewingThisChat &&
                      document
                        .getElementById("qzone-screen")
                        .classList.contains("active")
                    ) {
                      await renderQzonePosts();
                    }
                  }
                  continue;

                case "qzone_like":
                  const postToLike = await db.qzonePosts.get(
                    parseInt(msgData.postId),
                  );
                  if (postToLike) {
                    if (!postToLike.likes) postToLike.likes = [];
                    if (!postToLike.likes.includes(chat.name)) {
                      postToLike.likes.push(chat.name);
                      await db.qzonePosts.update(postToLike.id, {
                        likes: postToLike.likes,
                      });
                      updateUnreadIndicator(unreadPostsCount + 1);
                      if (
                        isViewingThisChat &&
                        document
                          .getElementById("qzone-screen")
                          .classList.contains("active")
                      ) {
                        await renderQzonePosts();
                      }
                    }
                  }
                  continue;

                case "video_call_request":
                  if (
                    !videoCallState.isActive &&
                    !videoCallState.isAwaitingResponse
                  ) {
                    state.activeChatId = chatId;
                    videoCallState.activeChatId = chatId;
                    videoCallState.isAwaitingResponse = true;
                    videoCallState.isGroupCall = chat.isGroup;
                    videoCallState.callRequester = msgData.name || chat.name;
                    showIncomingCallModal();
                  }
                  continue;

                case "group_call_request":
                  if (
                    !videoCallState.isActive &&
                    !videoCallState.isAwaitingResponse
                  ) {
                    state.activeChatId = chatId;
                    videoCallState.isAwaitingResponse = true;
                    videoCallState.isGroupCall = true;
                    videoCallState.initiator = "ai";
                    videoCallState.callRequester = msgData.name;
                    showIncomingCallModal();
                  }
                  continue;

                case "pat_user":
                  const suffix = msgData.suffix
                    ? ` ${msgData.suffix.trim()}`
                    : "";
                  const patText = `${
                    msgData.name || chat.name
                  } 拍了拍我${suffix}`;
                  const patMessage = {
                    role: CONSTANTS.ROLES.SYSTEM,
                    type: "pat_message",
                    content: patText,
                    timestamp: Date.now(),
                  };
                  chat.history.push(patMessage);
                  if (isViewingThisChat) {
                    const phoneScreen = document.getElementById("phone-screen");
                    phoneScreen.classList.remove("pat-animation");
                    void phoneScreen.offsetWidth;
                    phoneScreen.classList.add("pat-animation");
                    setTimeout(
                      () => phoneScreen.classList.remove("pat-animation"),
                      500,
                    );
                    appendMessage(patMessage, chat);
                  } else {
                    showNotification(chatId, patText);
                  }
                  continue;

                case "update_status":
                  chat.status.text = msgData.status_text;
                  chat.status.isBusy = msgData.is_busy || false;
                  chat.status.lastUpdate = Date.now();

                  const statusUpdateMessage = {
                    role: CONSTANTS.ROLES.SYSTEM,
                    type: "pat_message",
                    content: `[${chat.name}的状态已更新为: ${msgData.status_text}]`,
                    timestamp: Date.now(),
                  };
                  chat.history.push(statusUpdateMessage);

                  if (isViewingThisChat) {
                    appendMessage(statusUpdateMessage, chat);
                  }

                  renderChatList();

                  continue;

                case "change_music":
                  if (
                    musicState.isActive &&
                    musicState.activeChatId === chatId
                  ) {
                    const songNameToFind = msgData.song_name;

                    const targetSongIndex = musicState.playlist.findIndex(
                      (track) =>
                        track.name.toLowerCase() ===
                        songNameToFind.toLowerCase(),
                    );

                    if (targetSongIndex > -1) {
                      playSong(targetSongIndex);

                      const track = musicState.playlist[targetSongIndex];
                      const musicChangeMessage = {
                        role: CONSTANTS.ROLES.SYSTEM,
                        type: "pat_message",
                        content: `[♪ ${chat.name} 为你切歌: 《${track.name}》 - ${track.artist}]`,
                        timestamp: Date.now(),
                      };
                      chat.history.push(musicChangeMessage);

                      if (isViewingThisChat) {
                        appendMessage(musicChangeMessage, chat);
                      }
                    }
                  }
                  continue;
                case "create_memory":
                  const newMemory = {
                    chatId: chatId,
                    authorName: chat.name,
                    description: msgData.description,
                    timestamp: Date.now(),
                    type: "ai_generated",
                  };
                  await db.memories.add(newMemory);

                  console.log(
                    `AI "${chat.name}" 记录了一条新回忆:`,
                    msgData.description,
                  );

                  continue;

                case "create_countdown":
                  const targetDate = new Date(msgData.date);
                  if (!isNaN(targetDate) && targetDate > new Date()) {
                    const newCountdown = {
                      chatId: chatId,
                      authorName: chat.name,
                      description: msgData.title,
                      timestamp: Date.now(),
                      type: "countdown",
                      targetDate: targetDate.getTime(),
                    };
                    await db.memories.add(newCountdown);
                    console.log(
                      `AI "${chat.name}" 创建了一个新约定:`,
                      msgData.title,
                    );
                  }
                  continue;

                case "block_user":
                  if (!chat.isGroup) {
                    chat.relationship.status = "blocked_by_ai";

                    const hiddenMessage = {
                      role: CONSTANTS.ROLES.SYSTEM,
                      content: `[系统提示：你刚刚主动拉黑了用户。]`,
                      timestamp: Date.now(),
                      isHidden: true,
                    };
                    chat.history.push(hiddenMessage);

                    await db.chats.put(chat);

                    if (isViewingThisChat) {
                      renderChatInterface(chatId);
                    }
                    renderChatList();

                    break;
                  }
                  continue;
                case "friend_request_response":
                  if (
                    !chat.isGroup &&
                    chat.relationship.status === "pending_ai_approval"
                  ) {
                    if (msgData.decision === "accept") {
                      chat.relationship.status = "friend";
                      aiMessage = {
                        ...baseMessage,
                        content: "我通过了你的好友申请，我们现在是好友啦！",
                      };
                    } else {
                      chat.relationship.status = "blocked_by_ai";
                      aiMessage = {
                        ...baseMessage,
                        content: "抱歉，我拒绝了你的好友申请。",
                      };
                    }
                    chat.relationship.applicationReason = "";
                  }
                  break;
                case "poll":
                  const pollOptions =
                    typeof msgData.options === "string"
                      ? msgData.options.split("\n").filter((opt) => opt.trim())
                      : Array.isArray(msgData.options)
                        ? msgData.options
                        : [];

                  if (pollOptions.length < 2) continue;

                  aiMessage = {
                    ...baseMessage,
                    type: "poll",
                    question: msgData.question,
                    options: pollOptions,
                    votes: {},
                    isClosed: false,
                  };
                  break;

                case "vote":
                  const pollToVote = chat.history.find(
                    (m) => m.timestamp === msgData.poll_timestamp,
                  );
                  if (pollToVote && !pollToVote.isClosed) {
                    Object.keys(pollToVote.votes).forEach((option) => {
                      const voterIndex = pollToVote.votes[option].indexOf(
                        msgData.name,
                      );
                      if (voterIndex > -1) {
                        pollToVote.votes[option].splice(voterIndex, 1);
                      }
                    });
                    if (!pollToVote.votes[msgData.choice]) {
                      pollToVote.votes[msgData.choice] = [];
                    }

                    const member = chat.members.find(
                      (m) => m.originalName === msgData.name,
                    );
                    const displayName = member
                      ? member.groupNickname
                      : msgData.name;

                    if (
                      !pollToVote.votes[msgData.choice].includes(displayName)
                    ) {
                      // 【核心修改】
                      pollToVote.votes[msgData.choice].push(displayName); // 【核心修改】
                    }

                    if (isViewingThisChat) {
                      renderChatInterface(chatId);
                    }
                  }
                  continue;

                case "red_packet":
                  aiMessage = {
                    ...baseMessage,
                    type: "red_packet",
                    packetType: msgData.packetType,
                    totalAmount: msgData.amount,
                    count: msgData.count,
                    greeting: msgData.greeting,
                    receiverName: msgData.receiver,
                    claimedBy: {},
                    isFullyClaimed: false,
                  };
                  break;
                case "open_red_packet":
                  const packetToOpen = chat.history.find(
                    (m) => m.timestamp === msgData.packet_timestamp,
                  );
                  if (
                    packetToOpen &&
                    !packetToOpen.isFullyClaimed &&
                    !(
                      packetToOpen.claimedBy &&
                      packetToOpen.claimedBy[msgData.name]
                    )
                  ) {
                    // 1. 根据AI的本名(msgData.name)去成员列表里找到完整的成员对象
                    const member = chat.members.find(
                      (m) => m.originalName === msgData.name,
                    );
                    // 2. 获取该成员当前的群昵称，如果找不到（异常情况），则备用其本名
                    const displayName = member
                      ? member.groupNickname
                      : msgData.name;

                    let claimedAmountAI = 0;
                    const remainingAmount =
                      packetToOpen.totalAmount -
                      Object.values(packetToOpen.claimedBy || {}).reduce(
                        (sum, val) => sum + val,
                        0,
                      );
                    const remainingCount =
                      packetToOpen.count -
                      Object.keys(packetToOpen.claimedBy || {}).length;

                    if (remainingCount > 0) {
                      if (remainingCount === 1) {
                        claimedAmountAI = remainingAmount;
                      } else {
                        const min = 0.01;
                        const max =
                          remainingAmount - (remainingCount - 1) * min;
                        claimedAmountAI = Math.random() * (max - min) + min;
                      }
                      claimedAmountAI = parseFloat(claimedAmountAI.toFixed(2));

                      if (!packetToOpen.claimedBy) packetToOpen.claimedBy = {};
                      // 【核心修改】使用我们刚刚查找到的 displayName 作为记录的key
                      packetToOpen.claimedBy[displayName] = claimedAmountAI;

                    const aiPacketSenderLabel =
                      packetToOpen.senderName || chat?.name || "对方";
                    const aiClaimedMessage = {
                      role: CONSTANTS.ROLES.SYSTEM,
                      type: "pat_message",
                      // 【核心修改】系统消息里也使用 displayName
                      content: `${displayName} 领取了 ${aiPacketSenderLabel} 的红包`,
                      timestamp: Date.now(),
                    };
                      chat.history.push(aiClaimedMessage);

                      let hiddenContentForAI = `[系统提示：你 (${displayName}) 成功抢到了 ${claimedAmountAI.toFixed(
                        2,
                      )} 元。`; // 【核心修改】

                      if (
                        Object.keys(packetToOpen.claimedBy).length >=
                        packetToOpen.count
                      ) {
                        packetToOpen.isFullyClaimed = true;

                        const finishedMessage = {
                          role: CONSTANTS.ROLES.SYSTEM,
                          type: "pat_message",
                          content: `${aiPacketSenderLabel} 的红包已被领完`,
                          timestamp: Date.now() + 1,
                        };
                        chat.history.push(finishedMessage);

                        let luckyKing = { name: "", amount: -1 };
                        if (
                          packetToOpen.packetType === "lucky" &&
                          packetToOpen.count > 1
                        ) {
                          Object.entries(packetToOpen.claimedBy).forEach(
                            ([name, amount]) => {
                              if (amount > luckyKing.amount) {
                                luckyKing = { name, amount };
                              }
                            },
                          );
                        }
                        if (luckyKing.name) {
                          hiddenContentForAI += ` 红包已被领完，手气王是 ${luckyKing.name}！`;
                        } else {
                          hiddenContentForAI += ` 红包已被领完。`;
                        }
                      }
                      hiddenContentForAI += " 请根据这个结果发表你的评论。]";

                      const hiddenMessageForAI = {
                        role: CONSTANTS.ROLES.SYSTEM,
                        content: hiddenContentForAI,
                        timestamp: Date.now() + 2,
                        isHidden: true,
                      };
                      chat.history.push(hiddenMessageForAI);
                    }

                    if (isViewingThisChat) {
                      renderChatInterface(chatId);
                    }
                  }
                  continue;
                case "change_avatar":
                  const avatarName = msgData.name;
                  // 在该角色的头像库中查找
                  const foundAvatar = chat.settings.aiAvatarLibrary.find(
                    (avatar) => avatar.name === avatarName,
                  );

                  if (foundAvatar) {
                    // 找到了，就更新头像
                    chat.settings.aiAvatar = foundAvatar.url;

                    // 创建一条系统提示，告知用户头像已更换
                    const systemNotice = {
                      role: CONSTANTS.ROLES.SYSTEM,
                      type: "pat_message", // 复用居中样式
                      content: `[${chat.name} 更换了头像]`,
                      timestamp: Date.now(),
                    };
                    chat.history.push(systemNotice);

                    // 如果在当前聊天界面，则实时渲染
                    if (isViewingThisChat) {
                      appendMessage(systemNotice, chat);
                      // 立刻刷新聊天界面以显示新头像
                      renderChatInterface(chatId);
                    }
                  }
                  // 处理完后，继续处理AI可能返回的其他消息
                  continue;

                case "accept_transfer": {
                  // 使用大括号创建块级作用域
                  const originalTransferMsgIndex = chat.history.findIndex(
                    (m) => m.timestamp === msgData.for_timestamp,
                  );
                  if (originalTransferMsgIndex > -1) {
                    const originalMsg = chat.history[originalTransferMsgIndex];
                    originalMsg.status = "accepted";
                  }
                  continue; // 接受指令只修改状态，不产生新消息
                }

                case "decline_transfer": {
                  // 使用大括号创建块级作用域
                  const originalTransferMsgIndex = chat.history.findIndex(
                    (m) => m.timestamp === msgData.for_timestamp,
                  );
                  if (originalTransferMsgIndex > -1) {
                    const originalMsg = chat.history[originalTransferMsgIndex];
                    originalMsg.status = "declined";

                    // 【核心】创建一条新的“退款”消息
                    const refundMessage = {
                      role: CONSTANTS.ROLES.ASSISTANT,
                      senderName: chat.name,
                      type: CONSTANTS.MSG_TYPES.TRANSFER,
                      isRefund: true, // 标记这是一条退款消息
                      amount: originalMsg.amount,
                      note: "转账已被拒收",
                      timestamp: messageTimestamp++, // 使用递增的时间戳
                    };

                    // 将新消息推入历史记录，它会被后续的循环处理并渲染
                    chat.history.push(refundMessage);

                    if (isViewingThisChat) {
                      // 因为退款消息是新生成的，所以我们直接将它添加到界面上
                      appendMessage(refundMessage, chat);
                      // 同时，原始的转账消息状态变了，所以要重绘整个界面以更新它
                      renderChatInterface(chatId);
                    }
                  }
                  continue; // 继续处理AI返回的文本消息
                }

                case "system_message":
                  aiMessage = {
                    role: CONSTANTS.ROLES.SYSTEM,
                    type: "pat_message",
                    content: msgData.content,
                    timestamp: Date.now(),
                  };
                  break;

                case CONSTANTS.MSG_TYPES.SHARE_LINK:
                  aiMessage = {
                    ...baseMessage,
                    type: CONSTANTS.MSG_TYPES.SHARE_LINK,
                    title: msgData.title,
                    description: msgData.description,
                    // thumbnail_url: msgData.thumbnail_url, // 我们已经决定不要图片了，所以这行可以不要
                    source_name: msgData.source_name,
                    content: msgData.content, // 这是文章正文，点击卡片后显示的内容
                  };
                  break;

                case "quote_reply":
                  const originalMessage = chat.history.find(
                    (m) => m.timestamp === msgData.target_timestamp,
                  );
                  if (originalMessage) {
                    const quoteContext = {
                      timestamp: originalMessage.timestamp,
                      senderName:
                        originalMessage.senderName ||
                        (originalMessage.role === CONSTANTS.ROLES.USER
                          ? chat.settings.myNickname || "我"
                          : chat.name),
                      content: String(originalMessage.content || "").substring(
                        0,
                        50,
                      ),
                    };
                    aiMessage = {
                      ...baseMessage,
                      content: String(msgData.reply_content || "").trim(),
                      quote: quoteContext, // 核心：在这里附加引用对象
                    };
                  } else {
                    // 如果找不到被引用的消息，就当作普通消息发送
                    aiMessage = {
                      ...baseMessage,
                      content: String(msgData.reply_content || "").trim(),
                    };
                  }
                  break;

                case "send_and_recall": {
                  // 这是一个纯动画指令，我们需要手动“演”出整个过程
                  if (!isViewingThisChat) continue; // 如果不在当前聊天界面，就直接跳过这个动画

                  const cleanedContent = String(msgData.content || "").trim();

                  // 1. 创建一个临时的、看起来像真消息的气泡
                  const tempMessageData = {
                    ...baseMessage,
                    content: cleanedContent,
                  };
                  const tempMessageElement = createMessageElement(
                    tempMessageData,
                    chat,
                  );

                  // 2. 把它添加到聊天界面上，让用户看到
                  appendMessage(tempMessageData, chat, true); // true表示这是初始加载，不会触发进入动画

                  // 3. 等待片刻，模拟AI的“反应时间”
                  await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * 1000 + 1500),
                  ); // 随机等待1.5-2.5秒

                  // 4. 找到刚刚添加的临时气泡，并播放撤回动画
                  const bubbleWrapper = document
                    .querySelector(
                      `.message-bubble[data-timestamp="${tempMessageData.timestamp}"]`,
                    )
                    ?.closest(".message-wrapper");
                  if (bubbleWrapper) {
                    bubbleWrapper.classList.add("recalled-animation");

                    // 5. 在动画播放结束后，将其替换为真正的“已撤回”提示
                    await new Promise((resolve) => setTimeout(resolve, 300)); // 等待动画播完

                    // 6. 最后，才把这条“已撤回”记录真正地存入数据库
                    const recalledMessage = {
                      role: CONSTANTS.ROLES.ASSISTANT,
                      senderName: msgData.name || chat.name,
                      type: CONSTANTS.MSG_TYPES.RECALLED,
                      content: "对方撤回了一条消息",
                      timestamp: tempMessageData.timestamp, // 使用临时消息的时间戳，保证顺序
                      recalledData: {
                        originalType: CONSTANTS.MSG_TYPES.TEXT,
                        originalContent: cleanedContent,
                      },
                    };

                    // 更新数据模型
                    const msgIndex = chat.history.findIndex(
                      (m) => m.timestamp === tempMessageData.timestamp,
                    );
                    if (msgIndex > -1) {
                      chat.history[msgIndex] = recalledMessage;
                    } else {
                      chat.history.push(recalledMessage);
                    }
                    const insertedIndex =
                      msgIndex > -1 ? msgIndex : chat.history.length - 1;

                    // 替换DOM
                    const placeholder = createMessageElement(
                      recalledMessage,
                      chat,
                      insertedIndex,
                    );
                    if (document.body.contains(bubbleWrapper)) {
                      bubbleWrapper.parentNode.replaceChild(
                        placeholder,
                        bubbleWrapper,
                      );
                    }
                  }

                  continue; // 处理完这个动画后，继续处理AI返回的下一条指令
                }

                case CONSTANTS.MSG_TYPES.TEXT:
                  aiMessage = {
                    ...baseMessage,
                    content: String(
                      msgData.content || msgData.message || "",
                    ).trim(),
                  };
                  break;
                case CONSTANTS.MSG_TYPES.STICKER:
                  aiMessage = {
                    ...baseMessage,
                    type: CONSTANTS.MSG_TYPES.STICKER,
                    content: String(msgData.url || "").trim(),
                    meaning: String(msgData.meaning || "").trim(),
                  };
                  break;
                case CONSTANTS.MSG_TYPES.IMAGE:
                  aiMessage = {
                    ...baseMessage,
                    type: CONSTANTS.MSG_TYPES.IMAGE,
                    content: String(msgData.description || "").trim(),
                  };
                  break;
                case CONSTANTS.MSG_TYPES.VOICE:
                  aiMessage = {
                    ...baseMessage,
                    type: CONSTANTS.MSG_TYPES.VOICE,
                    content: String(msgData.content || "").trim(),
                  };
                  break;
                case CONSTANTS.MSG_TYPES.TRANSFER:
                  aiMessage = {
                    ...baseMessage,
                    type: CONSTANTS.MSG_TYPES.TRANSFER,
                    amount: msgData.amount,
                    note: String(msgData.note || "").trim(),
                    receiverName: msgData.receiver || "我",
                  };
                  break;

                case "waimai_request":
                  aiMessage = {
                    ...baseMessage,
                    type: "waimai_request",
                    productInfo: String(msgData.productInfo || "").trim(),
                    amount: msgData.amount,
                    status: "pending",
                    countdownEndTime: Date.now() + 15 * 60 * 1000,
                  };
                  break;

                default:
                  console.warn("收到了未知的AI指令类型:", msgData.type);
                  break;
              }

              // 【核心修复】将渲染逻辑移出循环
                if (aiMessage) {
                  // 1. 将新消息存入历史记录
                  // 【离线模式标记】如果离线模式开启,标记消息
                  if (offlineSettings?.enabled) {
                    aiMessage.isOfflineMode = true;
                  }
                  chat.history.push(aiMessage);
                  // 后台通知
                    if (
                      document.hidden &&
                      state.globalSettings.enableBackgroundActivity
                    ) {
                      const notificationTitle = chat.isGroup
                        ? `[群聊] ${chat.name}`
                        : chat.name;
                      const avatarUrl = chat.isGroup ? chat.groupAvatar : chat.avatar;
                      let notificationBody = "收到了一条新消息";
                      try {
                        const lastMsg = chat.history[chat.history.length - 1];
                        if (
                          lastMsg &&
                          lastMsg.content &&
                          typeof lastMsg.content === "string"
                        ) {
                          notificationBody = lastMsg.content.substring(0, 100);
                        }
                      } catch (e) {
                        console.error("[SilentError] Error caught in [sendLocalNotification-history]:", e);
                      }
                      sendLocalNotification(
                        notificationTitle,
                        notificationBody,
                        state.activeChatId,
                        avatarUrl,
                      );
                    }

                  if (!isViewingThisChat && !notificationShown) {
                  let notificationText;
                  switch (aiMessage.type) {
                    case CONSTANTS.MSG_TYPES.TRANSFER:
                      notificationText = `[收到一笔转账]`;
                      break;
                    case "waimai_request":
                      notificationText = `[收到一个外卖代付请求]`;
                      break;
                    case CONSTANTS.MSG_TYPES.IMAGE:
                      notificationText = `[图片]`;
                      break;
                    case CONSTANTS.MSG_TYPES.VOICE:
                      notificationText = `[语音]`;
                      break;
                    case CONSTANTS.MSG_TYPES.STICKER:
                      notificationText = aiMessage.meaning
                        ? `[表情: ${aiMessage.meaning}]`
                        : "[表情]";
                      break;
                    default:
                      notificationText = String(aiMessage.content || "");
                  }
                  const finalNotifText = chat.isGroup
                    ? `${aiMessage.senderName}: ${notificationText}`
                    : notificationText;
                  showNotification(
                    chatId,
                    finalNotifText.substring(0, 40) +
                      (finalNotifText.length > 40 ? "..." : ""),
                  );
                  notificationShown = true; // 确保只通知一次
                }

                if (!isViewingThisChat) {
                  // 如果用户不在当前聊天界面，就把这个聊天的未读数 +1
                  chat.unreadCount = (chat.unreadCount || 0) + 1;
                }

                // 2. 只有在当前聊天界面时，才执行带动画的添加
                if (isViewingThisChat) {
                  appendMessage(aiMessage, chat);
                  // 后台通知
                    if (document.hidden && state.globalSettings.enableBackgroundActivity) {
                      const notificationTitle = chat.isGroup
                        ? `[群聊] ${chat.name}`
                        : chat.name;
                      const avatarUrl = chat.isGroup ? chat.groupAvatar : chat.avatar;
                      let notificationBody = "收到了一条新消息";
                      try {
                        const lastMsg = chat.messages && chat.messages.length
                          ? chat.messages[chat.messages.length - 1]
                          : chat.history[chat.history.length - 1];
                        if (
                          lastMsg &&
                          lastMsg.content &&
                          typeof lastMsg.content === "string"
                        ) {
                          notificationBody = lastMsg.content.substring(0, 100);
                        }
                      } catch (e) {
                        console.error("[SilentError] Error caught in [sendLocalNotification-messages]:", e);
                      }
                      sendLocalNotification(
                        notificationTitle,
                        notificationBody,
                        state.activeChatId,
                        avatarUrl,
                      );
                    }
                  // 3. 【关键】在这里暂停一小会儿，给动画播放的时间
                  await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * 1800 + 1000),
                  );
                }
              }
            }

            if (callHasBeenHandled && videoCallState.isGroupCall) {
              videoCallState.isAwaitingResponse = false;
              if (videoCallState.participants.length > 0) {
                startVideoCall();
              } else {
                videoCallState = {
                  ...videoCallState,
                  isAwaitingResponse: false,
                  participants: [],
                };
                showScreen("chat-interface-screen");
                showCustomAlert("提示", "无人接听群聊邀请。");
              }
            }

            await db.chats.put(chat);
            // 触发总结检查
            await checkAndTriggerSummary(chatId);
          } catch (error) {
            chat.history = chat.history.filter((msg) => !msg.isTemporary);
            if (
              !chat.isGroup &&
              chat.relationship?.status === "pending_ai_approval"
            ) {
              chat.relationship.status = "blocked_by_ai";
              await showCustomAlert(
                "申请失败",
                `AI在处理你的好友申请时出错了，请稍后重试。\n错误信息: ${error.message}`,
              );
            } else {
              const errorContent = `[出错了: ${error.message}]`;
              const errorMessage = {
                role: CONSTANTS.ROLES.ASSISTANT,
                content: errorContent,
                timestamp: Date.now(),
              };
              if (chat.isGroup) errorMessage.senderName = "系统消息";
              chat.history.push(errorMessage);
            }

            await db.chats.put(chat);
            videoCallState.isAwaitingResponse = false;

            if (
              document
                .getElementById("chat-interface-screen")
                .classList.contains("active") &&
              state.activeChatId === chatId
            ) {
              renderChatInterface(chatId);
            }
          } finally {
            // ★★★★★【核心修改4：在 finally 块中统一隐藏所有类型的提示】★★★★★
            if (chat.isGroup) {
              if (typingIndicator) {
                typingIndicator.style.display = "none";
              }
            } else {
              if (chatHeaderTitle && state.chats[chatId]) {
                chatHeaderTitle.style.opacity = 0;
                setTimeout(() => {
                  chatHeaderTitle.textContent = state.chats[chatId].name;
                  chatHeaderTitle.classList.remove("typing-status");
                  chatHeaderTitle.style.opacity = 1;
                }, 200);
              }
            }
            renderChatList();
          }
        }

        async function sendSticker(sticker) {
          if (!state.activeChatId) return;
          const chat = state.chats[state.activeChatId];
          const msg = {
            role: CONSTANTS.ROLES.USER,
            content: sticker.url,
            // 添加 type: CONSTANTS.MSG_TYPES.STICKER 显式标识，方便 transformChatData 处理
            // 避免被当作普通文本处理成 base64 字符串
            type: CONSTANTS.MSG_TYPES.STICKER,
            meaning: sticker.name,
            timestamp: Date.now(),
          };
          if (chat.settings?.offlineMode?.enabled) {
            msg.isOfflineMode = true;
          }
          chat.history.push(msg);
          await db.chats.put(chat);
          appendMessage(msg, chat);
          renderChatList();
          document.getElementById("sticker-panel").classList.remove("visible");
        }

        async function sendUserTransfer() {
          if (!state.activeChatId) return;
          const amountInput = document.getElementById("transfer-amount");
          const noteInput = document.getElementById("transfer-note");
          const amount = parseFloat(amountInput.value);
          const note = noteInput.value.trim();
          if (isNaN(amount) || amount < 0 || amount > 9999) {
            showCustomAlert("提示", "请输入有效的金额 (0 到 9999 之间)！");
            return;
          }
          const chat = state.chats[state.activeChatId];
          const senderName = chat.isGroup
            ? chat.settings.myNickname || "我"
            : "我";
          const receiverName = chat.isGroup ? "群聊" : chat.name;
          const msg = {
            role: CONSTANTS.ROLES.USER,
            type: CONSTANTS.MSG_TYPES.TRANSFER,
            amount: amount,
            note: note,
            senderName,
            receiverName,
            timestamp: Date.now(),
          };
          if (chat.settings?.offlineMode?.enabled) {
            msg.isOfflineMode = true;
          }
          chat.history.push(msg);
          await db.chats.put(chat);
          appendMessage(msg, chat);
          renderChatList();
          document.getElementById("transfer-modal").classList.remove("visible");
          amountInput.value = "";
          noteInput.value = "";
        }

        function enterSelectionMode(initialMsgTimestamp) {
          if (isSelectionMode) return;
          isSelectionMode = true;
          document
            .getElementById("chat-interface-screen")
            .classList.add("selection-mode");
          toggleMessageSelection(initialMsgTimestamp);
        }

        function exitSelectionMode() {
          cleanupWaimaiTimers(); // <--- 在这里添加这行代码
          if (!isSelectionMode) return;
          isSelectionMode = false;
          document
            .getElementById("chat-interface-screen")
            .classList.remove("selection-mode");
          selectedMessages.forEach((ts) => {
            const bubble = document.querySelector(
              `.message-bubble[data-timestamp="${ts}"]`,
            );
            if (bubble) bubble.classList.remove("selected");
          });
          selectedMessages.clear();
        }

        function toggleMessageSelection(timestamp) {
          // 【核心修正】选择器已简化，不再寻找已删除的 .recalled-message-placeholder
          const elementToSelect = document.querySelector(
            `.message-bubble[data-timestamp="${timestamp}"]`,
          );

          if (!elementToSelect) return;

          if (selectedMessages.has(timestamp)) {
            selectedMessages.delete(timestamp);
            elementToSelect.classList.remove("selected");
          } else {
            selectedMessages.add(timestamp);
            elementToSelect.classList.add("selected");
          }

          document.getElementById("selection-count").textContent =
            `已选 ${selectedMessages.size} 条`;

          if (selectedMessages.size === 0) {
            exitSelectionMode();
          }
        }

        function addLongPressListener(element, callback) {
          let pressTimer;
          const startPress = (e) => {
            if (isSelectionMode) return;
            e.preventDefault();
            pressTimer = window.setTimeout(() => callback(e), 500);
          };
          const cancelPress = () => clearTimeout(pressTimer);
          element.addEventListener("mousedown", startPress);
          element.addEventListener("mouseup", cancelPress);
          element.addEventListener("mouseleave", cancelPress);
          element.addEventListener("touchstart", startPress, { passive: true });
          element.addEventListener("touchend", cancelPress);
          element.addEventListener("touchmove", cancelPress);
        }

        async function handleListenTogetherClick() {
          const targetChatId = state.activeChatId;
          if (!targetChatId) return;
          if (!musicState.isActive) {
            startListenTogetherSession(targetChatId);
            return;
          }
          if (musicState.activeChatId === targetChatId) {
            document
              .getElementById("music-player-overlay")
              .classList.add("visible");
          } else {
            const oldChatName =
              state.chats[musicState.activeChatId]?.name || "未知";
            const newChatName = state.chats[targetChatId]?.name || "当前";
            const confirmed = await showCustomConfirm(
              "切换听歌对象",
              `您正和「${oldChatName}」听歌。要结束并开始和「${newChatName}」的新会话吗？`,
              { confirmButtonClass: "btn-danger" },
            );
            if (confirmed) {
              await endListenTogetherSession(true);
              await new Promise((resolve) => setTimeout(resolve, 50));
              startListenTogetherSession(targetChatId);
            }
          }
        }

        async function startListenTogetherSession(chatId) {
          const chat = state.chats[chatId];
          if (!chat) return;
          musicState.totalElapsedTime = chat.musicData.totalTime || 0;
          musicState.isActive = true;
          musicState.activeChatId = chatId;
          if (musicState.playlist.length > 0) {
            musicState.currentIndex = 0;
          } else {
            musicState.currentIndex = -1;
          }
          if (musicState.timerId) clearInterval(musicState.timerId);
          musicState.timerId = setInterval(() => {
            if (musicState.isPlaying) {
              musicState.totalElapsedTime++;
              updateElapsedTimeDisplay();
            }
          }, 1000);
          updatePlayerUI();
          updatePlaylistUI();
          document
            .getElementById("music-player-overlay")
            .classList.add("visible");
        }

        async function endListenTogetherSession(saveState = true) {
          if (!musicState.isActive) return;
          const oldChatId = musicState.activeChatId;
          const cleanupLogic = async () => {
            if (musicState.timerId) clearInterval(musicState.timerId);
            if (musicState.isPlaying) audioPlayer.pause();
            if (saveState && oldChatId && state.chats[oldChatId]) {
              const chat = state.chats[oldChatId];
              chat.musicData.totalTime = musicState.totalElapsedTime;
              await db.chats.put(chat);
            }
            musicState.isActive = false;
            musicState.activeChatId = null;
            musicState.totalElapsedTime = 0;
            musicState.timerId = null;
            updateListenTogetherIcon(oldChatId, true);
          };
          closeMusicPlayerWithAnimation(cleanupLogic);
        }

        function returnToChat() {
          closeMusicPlayerWithAnimation();
        }

        function updateListenTogetherIcon(chatId, forceReset = false) {
          const iconImg = document.querySelector("#listen-together-btn img");
          if (!iconImg) return;
          if (
            forceReset ||
            !musicState.isActive ||
            musicState.activeChatId !== chatId
          ) {
            iconImg.src = "https://i.postimg.cc/8kYShvrJ/90-UI-2.png";
            iconImg.className = "";
            return;
          }
          iconImg.src =
            "https://i.postimg.cc/D0pq6qS2/E30078-DC-8-B99-4-C01-AFDA-74728-DBF7-BEA.png";
          iconImg.classList.add("rotating");
          if (musicState.isPlaying) iconImg.classList.remove("paused");
          else iconImg.classList.add("paused");
        }
        window.updateListenTogetherIconProxy = updateListenTogetherIcon;

        function updatePlayerUI() {
          updateListenTogetherIcon(musicState.activeChatId);
          updateElapsedTimeDisplay();
          const titleEl = document.getElementById("music-player-song-title");
          const artistEl = document.getElementById("music-player-artist");
          const playPauseBtn = document.getElementById("music-play-pause-btn");
          if (musicState.currentIndex > -1 && musicState.playlist.length > 0) {
            const track = musicState.playlist[musicState.currentIndex];
            titleEl.textContent = track.name;
            artistEl.textContent = track.artist;
          } else {
            titleEl.textContent = "请添加歌曲";
            artistEl.textContent = "...";
          }
          playPauseBtn.textContent = musicState.isPlaying ? "❚❚" : "▶";
        }

        function updateElapsedTimeDisplay() {
          const hours = (musicState.totalElapsedTime / 3600).toFixed(1);
          document.getElementById("music-time-counter").textContent =
            `已经一起听了${hours}小时`;
        }

        function updatePlaylistUI() {
          const playlistBody = document.getElementById("playlist-body");
          playlistBody.innerHTML = "";
          if (musicState.playlist.length === 0) {
            playlistBody.innerHTML =
              '<p style="text-align:center; padding: 20px; color: #888;">播放列表是空的~</p>';
            return;
          }
          musicState.playlist.forEach((track, index) => {
            const item = document.createElement("div");
            item.className = "playlist-item";
            if (index === musicState.currentIndex)
              item.classList.add("playing");
            item.innerHTML = `
                  <div class="playlist-item-info">
                      <div class="title">${track.name}</div>
                      <div class="artist">${track.artist}</div>
                  </div>
                  <div class="playlist-item-actions">
                      <span class="playlist-action-btn lyrics-btn" data-index="${index}">词</span>
                      <span class="playlist-action-btn delete-track-btn" data-index="${index}">×</span>
                  </div>
              `;
            item
              .querySelector(".playlist-item-info")
              .addEventListener("click", () => playSong(index));
            playlistBody.appendChild(item);
          });
        }

        function playSong(index) {
          if (index < 0 || index >= musicState.playlist.length) return;
          musicState.currentIndex = index;
          const track = musicState.playlist[index];
          musicState.parsedLyrics = parseLRC(track.lrcContent || "");
          musicState.currentLyricIndex = -1;
          renderLyrics();
          if (track.isLocal && track.src instanceof Blob) {
            audioPlayer.src = URL.createObjectURL(track.src);
          } else if (!track.isLocal) {
            audioPlayer.src = track.src;
          } else {
            console.error("本地歌曲源错误:", track);
            return;
          }
          audioPlayer.play();
          updatePlaylistUI();
          updatePlayerUI();
          updateMusicProgressBar();
        }

        function togglePlayPause() {
          if (audioPlayer.paused) {
            if (
              musicState.currentIndex === -1 &&
              musicState.playlist.length > 0
            ) {
              playSong(0);
            } else if (musicState.currentIndex > -1) {
              audioPlayer.play();
            }
          } else {
            audioPlayer.pause();
          }
        }

        function playNext() {
          if (musicState.playlist.length === 0) return;
          let nextIndex;
          switch (musicState.playMode) {
            case "random":
              nextIndex = Math.floor(
                Math.random() * musicState.playlist.length,
              );
              break;
            case "single":
              playSong(musicState.currentIndex);
              return;
            case "order":
            default:
              nextIndex =
                (musicState.currentIndex + 1) % musicState.playlist.length;
              break;
          }
          playSong(nextIndex);
        }

        function playPrev() {
          if (musicState.playlist.length === 0) return;
          const newIndex =
            (musicState.currentIndex - 1 + musicState.playlist.length) %
            musicState.playlist.length;
          playSong(newIndex);
        }

        function changePlayMode() {
          const modes = ["order", "random", "single"];
          const currentModeIndex = modes.indexOf(musicState.playMode);
          musicState.playMode = modes[(currentModeIndex + 1) % modes.length];
          document.getElementById("music-mode-btn").textContent = {
            order: "顺序",
            random: "随机",
            single: "单曲",
          }[musicState.playMode];
        }

        async function addSongFromURL() {
          const url = await showCustomPrompt(
            "添加网络歌曲",
            "请输入歌曲的URL",
            "",
            "url",
          );
          if (!url) return;
          const name = await showCustomPrompt("歌曲信息", "请输入歌名");
          if (!name) return;
          const artist = await showCustomPrompt("歌曲信息", "请输入歌手名");
          if (!artist) return;
          musicState.playlist.push({ name, artist, src: url, isLocal: false });
          await saveGlobalPlaylist();
          updatePlaylistUI();
          if (musicState.currentIndex === -1) {
            musicState.currentIndex = musicState.playlist.length - 1;
            updatePlayerUI();
          }
        }

        async function addSongFromLocal(event) {
          const files = event.target.files;
          if (!files.length) return;

          for (const file of files) {
            let name = file.name.replace(/\.[^/.]+$/, "");
            name = await showCustomPrompt("歌曲信息", "请输入歌名", name);
            if (name === null) continue;

            const artist = await showCustomPrompt(
              "歌曲信息",
              "请输入歌手名",
              "未知歌手",
            );
            if (artist === null) continue;

            let lrcContent = "";
            const wantLrc = await showCustomConfirm(
              "导入歌词",
              `要为《${name}》导入歌词文件 (.lrc) 吗？`,
            );
            if (wantLrc) {
              lrcContent = await new Promise((resolve) => {
                const lrcInput = document.getElementById("lrc-upload-input");
                const lrcChangeHandler = (e) => {
                  const lrcFile = e.target.files[0];
                  if (lrcFile) {
                    const reader = new FileReader();
                    reader.onload = (readEvent) =>
                      resolve(readEvent.target.result);
                    reader.onerror = () => resolve("");
                    reader.readAsText(lrcFile);
                  } else {
                    resolve("");
                  }
                  lrcInput.removeEventListener("change", lrcChangeHandler);
                  lrcInput.value = "";
                };
                lrcInput.addEventListener("change", lrcChangeHandler);
                lrcInput.click();
              });
            }

            musicState.playlist.push({
              name,
              artist,
              src: file,
              isLocal: true,
              lrcContent: lrcContent,
            });
          }

          await saveGlobalPlaylist();
          updatePlaylistUI();
          if (
            musicState.currentIndex === -1 &&
            musicState.playlist.length > 0
          ) {
            musicState.currentIndex = 0;
            updatePlayerUI();
          }
          event.target.value = null;
        }

        async function deleteTrack(index) {
          if (index < 0 || index >= musicState.playlist.length) return;
          const track = musicState.playlist[index];
          const wasPlaying =
            musicState.isPlaying && musicState.currentIndex === index;
          if (
            track.isLocal &&
            audioPlayer.src.startsWith("blob:") &&
            musicState.currentIndex === index
          )
            URL.revokeObjectURL(audioPlayer.src);
          musicState.playlist.splice(index, 1);
          await saveGlobalPlaylist();
          if (musicState.playlist.length === 0) {
            if (musicState.isPlaying) audioPlayer.pause();
            audioPlayer.src = "";
            musicState.currentIndex = -1;
            musicState.isPlaying = false;
          } else {
            if (wasPlaying) {
              playNext();
            } else {
              if (musicState.currentIndex >= index)
                musicState.currentIndex = Math.max(
                  0,
                  musicState.currentIndex - 1,
                );
            }
          }
          updatePlayerUI();
          updatePlaylistUI();
        }

        const personaLibraryModal = document.getElementById(
          "persona-library-modal",
        );
        const personaEditorModal = document.getElementById(
          "persona-editor-modal",
        );
        const presetActionsModal = document.getElementById(
          "preset-actions-modal",
        );

        function openPersonaLibrary() {
          renderPersonaLibrary();
          personaLibraryModal.classList.add("visible");
        }

        function closePersonaLibrary() {
          personaLibraryModal.classList.remove("visible");
        }

        function renderPersonaLibrary() {
          const grid = document.getElementById("persona-library-grid");
          grid.innerHTML = "";
          if (state.personaPresets.length === 0) {
            grid.innerHTML =
              '<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center; margin-top: 20px;">空空如也~ 点击右上角"添加"来创建你的第一个人设预设吧！</p>';
            return;
          }
          state.personaPresets.forEach((preset) => {
            const item = document.createElement("div");
            item.className = "persona-preset-item";
            item.style.backgroundImage = `url(${preset.avatar})`;
            item.dataset.presetId = preset.id;
            item.addEventListener("click", () => applyPersonaPreset(preset.id));
            addLongPressListener(item, () => showPresetActions(preset.id));
            grid.appendChild(item);
          });
        }

        function showPresetActions(presetId) {
          editingPersonaPresetId = presetId;
          presetActionsModal.classList.add("visible");
        }

        function hidePresetActions() {
          presetActionsModal.classList.remove("visible");
          editingPersonaPresetId = null;
        }

        function applyPersonaPreset(presetId) {
          const preset = state.personaPresets.find((p) => p.id === presetId);
          if (preset) {
            document.getElementById("my-avatar-preview").src = preset.avatar;
            document.getElementById("my-persona").value = preset.persona;
          }
          closePersonaLibrary();
        }

        function openPersonaEditorForCreate() {
          editingPersonaPresetId = null;
          document.getElementById("persona-editor-title").textContent =
            "添加人设预设";
          document.getElementById("preset-avatar-preview").src = defaultAvatar;
          document.getElementById("preset-persona-input").value = "";
          personaEditorModal.classList.add("visible");
        }

        function openPersonaEditorForEdit() {
          const preset = state.personaPresets.find(
            (p) => p.id === editingPersonaPresetId,
          );
          if (!preset) return;
          document.getElementById("persona-editor-title").textContent =
            "编辑人设预设";
          document.getElementById("preset-avatar-preview").src = preset.avatar;
          document.getElementById("preset-persona-input").value =
            preset.persona;
          presetActionsModal.classList.remove("visible");
          personaEditorModal.classList.add("visible");
        }

        async function deletePersonaPreset() {
          const confirmed = await showCustomConfirm(
            "删除预设",
            "确定要删除这个人设预设吗？此操作不可恢复。",
            { confirmButtonClass: "btn-danger" },
          );
          if (confirmed && editingPersonaPresetId) {
            await db.personaPresets.delete(editingPersonaPresetId);
            state.personaPresets = state.personaPresets.filter(
              (p) => p.id !== editingPersonaPresetId,
            );
            hidePresetActions();
            renderPersonaLibrary();
          }
        }

        function closePersonaEditor() {
          personaEditorModal.classList.remove("visible");
          editingPersonaPresetId = null;
        }

        async function savePersonaPreset() {
          const avatar = document.getElementById("preset-avatar-preview").src;
          const persona = document
            .getElementById("preset-persona-input")
            .value.trim();
          if (avatar === defaultAvatar && !persona) {
            showCustomAlert("提示", "头像和人设不能都为空哦！");
            return;
          }
          if (editingPersonaPresetId) {
            const preset = state.personaPresets.find(
              (p) => p.id === editingPersonaPresetId,
            );
            if (preset) {
              preset.avatar = avatar;
              preset.persona = persona;
              await db.personaPresets.put(preset);
            }
          } else {
            const newPreset = {
              id: "preset_" + Date.now(),
              avatar: avatar,
              persona: persona,
            };
            await db.personaPresets.add(newPreset);
            state.personaPresets.push(newPreset);
          }
          renderPersonaLibrary();
          closePersonaEditor();
        }

        const batteryAlertModal = document.getElementById(
          "battery-alert-modal",
        );

        function showBatteryAlert(imageUrl, text) {
          clearTimeout(batteryAlertTimeout);
          document.getElementById("battery-alert-image").src = imageUrl;
          document.getElementById("battery-alert-text").textContent = text;
          batteryAlertModal.classList.add("visible");
          const closeAlert = () => {
            batteryAlertModal.classList.remove("visible");
            batteryAlertModal.removeEventListener("click", closeAlert);
          };
          batteryAlertModal.addEventListener("click", closeAlert);
          batteryAlertTimeout = setTimeout(closeAlert, 2000);
        }

        function updateBatteryDisplay(battery) {
          const batteryContainer =
            document.getElementById("status-bar-battery");
          const batteryLevelEl =
            batteryContainer.querySelector(".battery-level");
          const batteryTextEl = batteryContainer.querySelector(".battery-text");
          const level = Math.floor(battery.level * 100);
          batteryLevelEl.style.width = `${level}%`;
          batteryTextEl.textContent = `${level}%`;
          if (battery.charging) {
            batteryContainer.classList.add("charging");
          } else {
            batteryContainer.classList.remove("charging");
          }
        }

        function handleBatteryChange(battery) {
          updateBatteryDisplay(battery);
          const level = battery.level;
          if (!battery.charging) {
            if (
              level <= 0.4 &&
              lastKnownBatteryLevel > 0.4 &&
              !alertFlags.hasShown40
            ) {
              showBatteryAlert(
                "https://i.postimg.cc/T2yKJ0DV/40.jpg",
                "有点饿了，可以去找充电器惹",
              );
              alertFlags.hasShown40 = true;
            }
            if (
              level <= 0.2 &&
              lastKnownBatteryLevel > 0.2 &&
              !alertFlags.hasShown20
            ) {
              showBatteryAlert(
                "https://i.postimg.cc/qB9zbKs9/20.jpg",
                "赶紧的充电，要饿死了",
              );
              alertFlags.hasShown20 = true;
            }
            if (
              level <= 0.1 &&
              lastKnownBatteryLevel > 0.1 &&
              !alertFlags.hasShown10
            ) {
              showBatteryAlert(
                "https://i.postimg.cc/ThMMVfW4/10.jpg",
                "已阵亡，还有30秒爆炸",
              );
              alertFlags.hasShown10 = true;
            }
          }
          if (level > 0.4) alertFlags.hasShown40 = false;
          if (level > 0.2) alertFlags.hasShown20 = false;
          if (level > 0.1) alertFlags.hasShown10 = false;
          lastKnownBatteryLevel = level;
        }

        async function initBatteryManager() {
          if ("getBattery" in navigator) {
            try {
              const battery = await navigator.getBattery();
              lastKnownBatteryLevel = battery.level;
              handleBatteryChange(battery);
              battery.addEventListener("levelchange", () =>
                handleBatteryChange(battery),
              );
              battery.addEventListener("chargingchange", () => {
                handleBatteryChange(battery);
                if (battery.charging) {
                  showBatteryAlert(
                    "https://i.postimg.cc/3NDQ0dWG/image.jpg",
                    "窝爱泥，电量吃饱饱",
                  );
                }
              });
            } catch (err) {
              console.error("无法获取电池信息:", err);
              document.querySelector(".battery-text").textContent = "ᗜωᗜ";
            }
          } else {
            console.log("浏览器不支持电池状态API。");
            document.querySelector(".battery-text").textContent = "ᗜωᗜ";
          }
        }

        async function renderAlbumList() {
          const albumGrid = document.getElementById("album-grid-page");
          if (!albumGrid) return;
          const albums = await db.qzoneAlbums
            .orderBy("createdAt")
            .reverse()
            .toArray();
          albumGrid.innerHTML = "";
          if (albums.length === 0) {
            albumGrid.innerHTML =
              '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); margin-top: 50px;">你还没有创建任何相册哦~</p>';
            return;
          }
          albums.forEach((album) => {
            const albumItem = document.createElement("div");
            albumItem.className = "album-item";
            albumItem.innerHTML = `
                          <div class="album-cover" style="background-image: url(${
                            album.coverUrl
                          });"></div>
                          <div class="album-info">
                              <p class="album-name">${album.name}</p>
                              <p class="album-count">${
                                album.photoCount || 0
                              } 张</p>
                          </div>
                      `;
            albumItem.addEventListener("click", () => {
              openAlbum(album.id);
            });

            addLongPressListener(albumItem, async () => {
              const confirmed = await showCustomConfirm(
                "删除相册",
                `确定要删除相册《${album.name}》吗？此操作将同时删除相册内的所有照片，且无法恢复。`,
                { confirmButtonClass: "btn-danger" },
              );

              if (confirmed) {
                // 1. 从照片表中删除该相册下的所有照片
                await db.qzonePhotos.where("albumId").equals(album.id).delete();

                // 2. 从相册表中删除该相册本身
                await db.qzoneAlbums.delete(album.id);

                // 3. 重新渲染相册列表
                await renderAlbumList();

                showCustomAlert("提示", "相册已成功删除。");
              }
            });

            albumGrid.appendChild(albumItem);
          });
        }

        async function openAlbum(albumId) {
          state.activeAlbumId = albumId;
          await renderAlbumPhotosScreen();
          showScreen("album-photos-screen");
        }

        async function renderAlbumPhotosScreen() {
          if (!state.activeAlbumId) return;
          const photosGrid = document.getElementById("photos-grid-page");
          const headerTitle = document.getElementById("album-photos-title");
          const album = await db.qzoneAlbums.get(state.activeAlbumId);
          if (!album) {
            console.error("找不到相册:", state.activeAlbumId);
            showScreen("album-screen");
            return;
          }
          headerTitle.textContent = album.name;
          const photos = await db.qzonePhotos
            .where("albumId")
            .equals(state.activeAlbumId)
            .toArray();
          photosGrid.innerHTML = "";
          if (photos.length === 0) {
            photosGrid.innerHTML =
              '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); margin-top: 50px;">这个相册还是空的，快上传第一张照片吧！</p>';
          } else {
            photos.forEach((photo) => {
              const photoItem = document.createElement("div");
              photoItem.className = "photo-item";
              photoItem.innerHTML = `
                              <img src="${photo.url}" class="photo-thumb" alt="相册照片">
                              <button class="photo-delete-btn" data-photo-id="${photo.id}">×</button>
                          `;
              photosGrid.appendChild(photoItem);
            });
          }
        }

        // --- ↓↓↓ 从这里开始复制 ↓↓↓ ---

        /**
         * 打开图片查看器
         * @param {string} clickedPhotoUrl - 用户点击的那张照片的URL
         */
        async function openPhotoViewer(clickedPhotoUrl) {
          if (!state.activeAlbumId) return;

          // 1. 从数据库获取当前相册的所有照片
          const photosInAlbum = await db.qzonePhotos
            .where("albumId")
            .equals(state.activeAlbumId)
            .toArray();
          photoViewerState.photos = photosInAlbum.map((p) => p.url);

          // 2. 找到被点击照片的索引
          photoViewerState.currentIndex = photoViewerState.photos.findIndex(
            (url) => url === clickedPhotoUrl,
          );
          if (photoViewerState.currentIndex === -1) return; // 如果找不到，则不打开

          // 3. 显示模态框并渲染第一张图
          document
            .getElementById("photo-viewer-modal")
            .classList.add("visible");
          renderPhotoViewer();
          photoViewerState.isOpen = true;
        }

        /**
         * 根据当前状态渲染查看器内容（图片和按钮）
         */
        function renderPhotoViewer() {
          if (photoViewerState.currentIndex === -1) return;

          const imageEl = document.getElementById("photo-viewer-image");
          const prevBtn = document.getElementById("photo-viewer-prev-btn");
          const nextBtn = document.getElementById("photo-viewer-next-btn");

          // 淡出效果
          imageEl.style.opacity = 0;

          setTimeout(() => {
            // 更新图片源
            imageEl.src =
              photoViewerState.photos[photoViewerState.currentIndex];
            // 淡入效果
            imageEl.style.opacity = 1;
          }, 100); // 延迟一点点时间来触发CSS过渡

          // 更新按钮状态：如果是第一张，禁用“上一张”按钮
          prevBtn.disabled = photoViewerState.currentIndex === 0;
          // 如果是最后一张，禁用“下一张”按钮
          nextBtn.disabled =
            photoViewerState.currentIndex ===
            photoViewerState.photos.length - 1;
        }

        /**
         * 显示下一张照片
         */
        function showNextPhoto() {
          if (
            photoViewerState.currentIndex <
            photoViewerState.photos.length - 1
          ) {
            photoViewerState.currentIndex++;
            renderPhotoViewer();
          }
        }

        /**
         * 显示上一张照片
         */
        function showPrevPhoto() {
          if (photoViewerState.currentIndex > 0) {
            photoViewerState.currentIndex--;
            renderPhotoViewer();
          }
        }

        /**
         * 关闭图片查看器
         */
        function closePhotoViewer() {
          document
            .getElementById("photo-viewer-modal")
            .classList.remove("visible");
          photoViewerState.isOpen = false;
          photoViewerState.photos = [];
          photoViewerState.currentIndex = -1;
          // 清空图片，避免下次打开时闪现旧图
          document.getElementById("photo-viewer-image").src = "";
        }

        // --- ↑↑↑ 复制到这里结束 ↑↑↑ ---

        /**
         * 更新动态小红点的显示
         * @param {number} count - 未读动态的数量
         */
        function updateUnreadIndicator(count) {
          unreadPostsCount = count;
          localStorage.setItem("unreadPostsCount", count); // 持久化存储

          // --- 更新底部导航栏的“动态”按钮 ---
          const navItem = document.querySelector(
            '.nav-item[data-view="qzone-screen"]',
          );

          const targetSpan = navItem.querySelector("span"); // 定位到文字 "动态"
          let indicator = navItem.querySelector(".unread-indicator");

          if (count > 0) {
            if (!indicator) {
              indicator = document.createElement("span");
              indicator.className = "unread-indicator";
              targetSpan.style.position = "relative"; // 把相对定位加在 span 上
              targetSpan.appendChild(indicator); // 把小红点作为 span 的子元素
            }
            indicator.textContent = count > 99 ? "99+" : count;
            indicator.style.display = "block";
          } else {
            if (indicator) {
              indicator.style.display = "none";
            }
          }

          // --- 更新聊天界面返回列表的按钮 ---
          const backBtn = document.getElementById("back-to-list-btn");
          let backBtnIndicator = backBtn.querySelector(".unread-indicator");

          if (count > 0) {
            if (!backBtnIndicator) {
              backBtnIndicator = document.createElement("span");
              backBtnIndicator.className =
                "unread-indicator back-btn-indicator";
              backBtn.style.position = "relative"; // 确保能正确定位
              backBtn.appendChild(backBtnIndicator);
            }
            // 返回键上的小红点通常不显示数字，只显示一个点
            backBtnIndicator.style.display = "block";
          } else {
            if (backBtnIndicator) {
              backBtnIndicator.style.display = "none";
            }
          }
        }

        function startBackgroundSimulation() {
          if (simulationIntervalId) return;
          const intervalSeconds =
            state.globalSettings.backgroundActivityInterval || 60;
          // 将旧的固定间隔 45000 替换为动态获取
          simulationIntervalId = setInterval(
            runBackgroundSimulationTick,
            intervalSeconds * 1000,
          );
        }

        function stopBackgroundSimulation() {
          if (simulationIntervalId) {
            clearInterval(simulationIntervalId);
            simulationIntervalId = null;
          }
        }

        /**
         * 这是模拟器的“心跳”，每次定时器触发时运行
         */
        function runBackgroundSimulationTick() {
          console.log("模拟器心跳 Tick...");
          if (!state.globalSettings.enableBackgroundActivity) {
            stopBackgroundSimulation();
            return;
          }
          const allSingleChats = Object.values(state.chats).filter(
            (chat) => !chat.isGroup,
          );

          if (allSingleChats.length === 0) return;

          allSingleChats.forEach((chat) => {
            // 【核心修正】将两种状态检查分离开，逻辑更清晰

            // 检查1：处理【被用户拉黑】的角色
            if (chat.relationship?.status === "blocked_by_user") {
              const blockedTimestamp = chat.relationship.blockedTimestamp;
              // 安全检查：确保有拉黑时间戳
              if (!blockedTimestamp) {
                console.warn(
                  `角色 "${chat.name}" 状态为拉黑，但缺少拉黑时间戳，跳过处理。`,
                );
                return; // 跳过这个角色，继续下一个
              }

              const blockedDuration = Date.now() - blockedTimestamp;
              const cooldownMilliseconds =
                (state.globalSettings.blockCooldownHours || 1) * 60 * 60 * 1000;

              console.log(
                `检查角色 "${chat.name}"：已拉黑 ${Math.round(
                  blockedDuration / 1000 / 60,
                )}分钟，冷静期需 ${cooldownMilliseconds / 1000 / 60}分钟。`,
              ); // 添加日志

              // 【核心修改】移除了随机概率，只要冷静期一过，就触发！
              if (blockedDuration > cooldownMilliseconds) {
                console.log(
                  `角色 "${chat.name}" 的冷静期已过，触发“反思”并申请好友事件...`,
                );

                // 【重要】为了防止在AI响应前重复触发，我们在触发后立刻更新状态
                chat.relationship.status = "pending_system_reflection"; // 设置一个临时的、防止重复触发的状态

                triggerAiFriendApplication(chat.id);
              }
            }
            // 检查2：处理【好友关系】的正常后台活动
            else if (
              chat.relationship?.status === "friend" &&
              chat.id !== state.activeChatId
            ) {
              if (!hasAnyBackgroundActivityEnabled(chat)) {
                return;
              }
              // 这里的随机触发逻辑保持不变，因为我们不希望所有好友同时行动
              if (Math.random() < 0.2) {
                console.log(`角色 "${chat.name}" 被唤醒，准备独立行动...`);
                triggerInactiveAiAction(chat.id);
              }
            }
          });
        }

        async function triggerInactiveAiAction(chatId) {
          const chat = state.chats[chatId];
          if (!chat) return;

          const activityOptions = getBackgroundActivityOptions(chat);
          const allowChat = activityOptions.allowChat;
          const allowPost = activityOptions.allowPost;
          const allowReply = activityOptions.allowReply;
          if (!allowChat && !allowPost && !allowReply) return;

          const { proxyUrl, apiKey, model } = getActiveApiConfig() || {};
          if (!proxyUrl || !apiKey || !model) return;

          // 强制转换为北京时间
          const localNow = new Date();
          const utcMilliseconds =
            localNow.getTime() + localNow.getTimezoneOffset() * 60000;
          const beijingMilliseconds = utcMilliseconds + 3600000 * 8;
          const now = new Date(beijingMilliseconds);
          const currentTime = now.toLocaleTimeString("zh-CN", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          });
          const userNickname = state.qzoneSettings.nickname;

          const lastUserMessage = chat.history
            .filter((m) => m.role === CONSTANTS.ROLES.USER && !m.isHidden)
            .slice(-1)[0];
          const lastAiMessage = chat.history
            .filter((m) => m.role === CONSTANTS.ROLES.ASSISTANT && !m.isHidden)
            .slice(-1)[0];
          let recentContextSummary = "你们最近没有聊过天。";
          if (lastUserMessage) {
            recentContextSummary = `用户 (${userNickname}) 最后对你说：“${String(
              lastUserMessage.content,
            ).substring(0, 50)}...”。`;
          }
          if (lastAiMessage) {
            recentContextSummary += `\n你最后对用户说：“${String(
              lastAiMessage.content,
            ).substring(0, 50)}...”。`;
          }

          let worldBookContent = "";
          if (
            chat.settings.linkedWorldBookIds &&
            chat.settings.linkedWorldBookIds.length > 0
          ) {
            const linkedContents = chat.settings.linkedWorldBookIds
              .map((bookId) => {
                const worldBook = state.worldBooks.find(
                  (wb) => wb.id === bookId,
                );
                return worldBook && worldBook.content
                  ? `\n\n## 世界书: ${worldBook.name}\n${worldBook.content}`
                  : "";
              })
              .filter(Boolean)
              .join("");
            if (linkedContents) {
              worldBookContent = `\n\n# 核心世界观设定 (你必须严格遵守)\n${linkedContents}\n`;
            }
          }

          const allowedActions = [];
          if (allowChat)
            allowedActions.push(
              "1.  **发送消息**: 向用户发送一条正常聊天内容。",
            );
          if (allowPost)
            allowedActions.push(
              "2.  **发布动态**: 发布说说或动态内容。",
            );
          if (allowReply)
            allowedActions.push(
              "3.  **回复动态**: 对动态进行评论。",
            );

          const formatInstructions = [];
          if (allowChat) {
            formatInstructions.push(
              "-   **发消息**: `[{\"type\": \"text\", \"content\": \"你想对用户说的话...\"}]`",
            );
            formatInstructions.push(
              "-   **发消息+更新状态**: `[{\"type\": \"update_status\", \"status_text\": \"正在做的事\", \"is_busy\": true}, {\"type\": \"text\", \"content\": \"你想对用户说的话...\"}]`",
            );
          }
          if (allowPost) {
            formatInstructions.push(
              "-   **发说说**: `[{\"type\": \"qzone_post\", \"postType\": \"shuoshuo\", \"content\": \"动态的文字内容...\"}]`",
            );
            formatInstructions.push(
              "-   **发布文字图**: `[{\"type\": \"qzone_post\", \"postType\": \"text_image\", \"publicText\": \"(可选)动态的公开文字\", \"hiddenContent\": \"对于图片的具体描述...\"}]`",
            );
          }
          if (allowReply) {
            formatInstructions.push(
              "-   **评论**: `[{\"type\": \"qzone_comment\", \"postId\": 123, \"commentText\": \"你的评论内容\"}]`",
            );
          }

          const dynamicListNotice = allowReply
            ? "-   **【重要】最近的动态列表**: 这个列表会标注 **[你已评论]**。请**优先**与你**尚未互动过**的动态进行交流。"
            : "";

          const systemPrompt = `
      # 你的任务
      你现在扮演一个名为"${chat.name}"的角色。你已经有一段时间没有和用户（${userNickname}）互动了，现在你有机会【主动】做点什么，来表现你的个性和独立生活。这是一个秘密的、后台的独立行动。

      # 你的可选行动 (请根据你的人设【选择一项】执行):
      ${allowedActions.join("\n      ")}

      # 指令格式 (你的回复【必须】是包含一个对象的JSON数组):
      ${formatInstructions.join("\n      ")}

      # 供你决策的参考信息：
      -   **你的角色设定**: ${chat.settings.aiPersona}
      ${worldBookContent} // <--【核心】在这里注入世界书内容
      -   **当前时间**: ${currentTime}
      -   **你们最后的对话摘要**: ${recentContextSummary}
      ${dynamicListNotice}`;

          // 【核心修复】在这里构建 messagesPayload
          const messagesPayload = [];
          messagesPayload.push({ role: CONSTANTS.ROLES.SYSTEM, content: systemPrompt });

          try {
            let dynamicContext = "";
            if (allowReply) {
              const allRecentPosts = await db.qzonePosts
                .orderBy("timestamp")
                .reverse()
                .limit(3)
                .toArray();
              // 【核心修改】在这里插入过滤步骤
              const visiblePosts = filterVisiblePostsForAI(allRecentPosts, chat);

              const aiName = chat.name;

              if (visiblePosts.length > 0) {
                let postsContext = "\n\n# 最近的动态列表 (供你参考和评论):\n";
                for (const post of visiblePosts) {
                  let authorName =
                    post.authorId === CONSTANTS.ROLES.USER
                      ? userNickname
                      : state.chats[post.authorId]?.name || "一位朋友";
                  let interactionStatus = "";
                  if (
                    post.comments &&
                    post.comments.some((c) => c.commenterName === aiName)
                  )
                    interactionStatus += " [你已评论]";

                  postsContext += `- (ID: ${
                    post.id
                  }) 作者: ${authorName}, 内容: "${(
                    post.publicText ||
                    post.content ||
                    "图片动态"
                  ).substring(0, 30)}..."${interactionStatus}\n`;
                }
                dynamicContext = postsContext;
              }
            }

            // 【核心修复】将所有动态信息作为一条 user 消息发送
            messagesPayload.push({
              role: CONSTANTS.ROLES.USER,
              content: `[系统指令：请根据你在 system prompt 中读到的规则和以下最新信息，开始你的独立行动。]\n${dynamicContext}`,
            });

            console.log(
              "正在为后台活动发送API请求，Payload:",
              JSON.stringify(messagesPayload, null, 2),
            ); // 添加日志，方便调试

            // 发送请求
            let isGemini = proxyUrl === CONSTANTS.API.GEMINI_BASE_URL;
            let geminiConfig = toGeminiRequestData(
              model,
              apiKey,
              systemPrompt,
              messagesPayload,
              isGemini,
            );
            const response = isGemini
              ? await fetch(geminiConfig.url, geminiConfig.data)
              : await fetch(`${proxyUrl}/v1/chat/completions`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: model,
                    messages: messagesPayload,
                    temperature: 0.9,
                  }),
                });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                `API请求失败: ${response.status} - ${JSON.stringify(errorData)}`,
              );
            }
            const data = await response.json();
            // 检查是否有有效回复
            if (
              !data.choices ||
              data.choices.length === 0 ||
              !data.choices[0].message.content
            ) {
              console.warn(
                `API为空回或格式不正确，角色 "${chat.name}" 的本次后台活动跳过。`,
              );
              return;
            }
            const responseArray = parseAiResponse(
              isGemini
                ? data.candidates[0].content.parts[0].text
                : data.choices[0].message.content,
            );

            // 后续处理AI返回指令的逻辑保持不变...
            for (const action of responseArray) {
              if (!action) continue;

              if (
                (action.type === CONSTANTS.MSG_TYPES.TEXT || action.type === "update_status") &&
                !allowChat
              ) {
                continue;
              }
              if (action.type === "qzone_post" && !allowPost) {
                continue;
              }
              if (action.type === "qzone_comment" && !allowReply) {
                continue;
              }
              if (action.type === "qzone_like") {
                continue;
              }
              if (action.type === "video_call_request") {
                continue;
              }

              if (action.type === "update_status" && action.status_text) {
                chat.status.text = action.status_text;
                chat.status.isBusy = action.is_busy || false;
                chat.status.lastUpdate = Date.now();
                await db.chats.put(chat);
                renderChatList();
              }
              if (action.type === CONSTANTS.MSG_TYPES.TEXT && action.content) {
                const aiMessage = {
                  role: CONSTANTS.ROLES.ASSISTANT,
                  content: String(action.content).trim(),
                  timestamp: Date.now(),
                };

                chat.unreadCount = (chat.unreadCount || 0) + 1;
                chat.history.push(aiMessage);
                await db.chats.put(chat);
                showNotification(chatId, aiMessage.content);
                renderChatList();
                console.log(
                  `后台活动: 角色 "${chat.name}" 主动发送了消息: ${aiMessage.content}`,
                );
              }
              if (action.type === "qzone_post") {
                const newPost = {
                  type: action.postType,
                  content: String(action.content || "").trim(),
                  publicText: String(action.publicText || "").trim(),
                  hiddenContent: String(action.hiddenContent || "").trim(),
                  timestamp: Date.now(),
                  authorId: chatId,
                  authorGroupId: chat.groupId, // 【核心新增】记录作者的分组ID
                  visibleGroupIds: null,
                };
                await db.qzonePosts.add(newPost);
                updateUnreadIndicator(unreadPostsCount + 1);
                console.log(`后台活动: 角色 "${chat.name}" 发布了动态`);
              } else if (action.type === "qzone_comment") {
                const post = await db.qzonePosts.get(parseInt(action.postId));
                if (post) {
                  if (!post.comments) post.comments = [];
                  post.comments.push({
                    commenterName: chat.name,
                    text: String(action.commentText || "").trim(),
                    timestamp: Date.now(),
                  });
                  await db.qzonePosts.update(post.id, {
                    comments: post.comments,
                  });
                  updateUnreadIndicator(unreadPostsCount + 1);
                  console.log(
                    `后台活动: 角色 "${chat.name}" 评论了动态 #${post.id}`,
                  );
                }
              } else if (action.type === "qzone_like") {
                const post = await db.qzonePosts.get(parseInt(action.postId));
                if (post) {
                  if (!post.likes) post.likes = [];
                  if (!post.likes.includes(chat.name)) {
                    post.likes.push(chat.name);
                    await db.qzonePosts.update(post.id, { likes: post.likes });
                    updateUnreadIndicator(unreadPostsCount + 1);
                    console.log(
                      `后台活动: 角色 "${chat.name}" 点赞了动态 #${post.id}`,
                    );
                  }
                }
              } else if (action.type === "video_call_request") {
                if (
                  !videoCallState.isActive &&
                  !videoCallState.isAwaitingResponse
                ) {
                  videoCallState.isAwaitingResponse = true;
                  state.activeChatId = chatId;
                  showIncomingCallModal();
                  console.log(
                    `后台活动: 角色 "${chat.name}" 发起了视频通话请求`,
                  );
                }
              }
            }
          } catch (error) {
            console.error(`角色 "${chat.name}" 的独立行动失败:`, error);
          }
        }

        /**
         * 将用户自定义的CSS安全地应用到指定的作用域
         * @param {string} cssString 用户输入的原始CSS字符串
         * @param {string} scopeId 应用样式的作用域ID (例如 '#chat-messages' 或 '#settings-preview-area')
         * @param {string} styleTagId 要操作的 <style> 标签的ID
         */
        function applyScopedCss(cssString, scopeId, styleTagId) {
          const styleTag = document.getElementById(styleTagId);
          if (!styleTag) return;

          if (!cssString || cssString.trim() === "") {
            styleTag.innerHTML = "";
            return;
          }

          // 增强作用域处理函数 - 专门解决.user和.ai样式冲突问题
          const scopedCss = cssString
            .replace(
              /\s*\.message-bubble\.user\s+([^{]+\{)/g,
              `${scopeId} .message-bubble.user $1`,
            )
            .replace(
              /\s*\.message-bubble\.ai\s+([^{]+\{)/g,
              `${scopeId} .message-bubble.ai $1`,
            )
            .replace(
              /\s*\.message-bubble\s+([^{]+\{)/g,
              `${scopeId} .message-bubble $1`,
            );

          styleTag.innerHTML = scopedCss;
        }

        function updateSettingsPreview() {
          if (!state.activeChatId) return;
          const chat = state.chats[state.activeChatId];
          const previewArea = document.getElementById("settings-preview-area");
          if (!previewArea) return;

          // 1. 获取当前设置的值
          const selectedTheme =
            document.querySelector('input[name="theme-select"]:checked')
              ?.value || "default";
          const fontSize = document.getElementById("font-size-slider").value;
          const customCss = document.getElementById("custom-css-input").value;
          const background = chat.settings.background; // 直接获取背景设置

          // 2. 更新预览区的基本样式
          previewArea.dataset.theme = selectedTheme;
          previewArea.style.setProperty("--chat-font-size", `${fontSize}px`);

          // --- 【核心修正】直接更新预览区的背景样式 ---
          if (background && background.startsWith("data:image")) {
            previewArea.style.backgroundImage = `url(${background})`;
            previewArea.style.backgroundColor = "transparent"; // 如果有图片，背景色设为透明
          } else {
            previewArea.style.backgroundImage = "none"; // 如果没有图片，移除图片背景
            // 如果背景是颜色值或渐变（非图片），则直接应用
            previewArea.style.background = background || "#f0f2f5";
          }

          // 3. 渲染模拟气泡
          previewArea.innerHTML = "";

          // 创建“对方”的气泡
          // 注意：我们将一个虚拟的 timestamp 传入，以防有CSS依赖于它
          const aiMsg = {
            role: "ai",
            content: "对方消息预览",
            timestamp: 1,
            senderName: chat.name,
          };
          const aiBubble = createMessageElement(aiMsg, chat);
          if (aiBubble) {
            // Apply currentBubbleState to AI text bubble
            const contentDiv = aiBubble.querySelector('.message-bubble .content');
            if (contentDiv && currentBubbleState) {
              const aiConfig = currentBubbleState.text.ai;
              // Apply gradient or solid color
              if (aiConfig.gradient.enabled) {
                const stops = aiConfig.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
                const gradientType = aiConfig.gradient.type === 'radial' ? 'radial-gradient' : 'linear-gradient';
                const gradientAngle = aiConfig.gradient.type === 'radial' ? 'circle' : `${aiConfig.gradient.angle}deg`;
                contentDiv.style.background = `${gradientType}(${gradientAngle}, ${stops})`;
              } else {
                contentDiv.style.backgroundColor = aiConfig.solidColor;
              }
              // Apply opacity
              contentDiv.style.opacity = aiConfig.opacity;
              // Apply border
              contentDiv.style.border = `${aiConfig.border.width}px ${aiConfig.border.style} ${aiConfig.border.color}`;
              contentDiv.style.borderRadius = `${aiConfig.border.radius}px`;
              // Apply shadow
              if (aiConfig.shadow.enabled) {
                contentDiv.style.boxShadow = aiConfig.shadow.value;
              } else {
                contentDiv.style.boxShadow = 'none';
              }
            }
            previewArea.appendChild(aiBubble);
          }

          // 创建"我"的气泡
          const userMsg = {
            role: CONSTANTS.ROLES.USER,
            content: "我的消息预览",
            timestamp: 2,
          };
          const userBubble = createMessageElement(userMsg, chat);
          if (userBubble) {
            // Apply currentBubbleState to User text bubble
            const contentDiv = userBubble.querySelector('.message-bubble .content');
            if (contentDiv && currentBubbleState) {
              const userConfig = currentBubbleState.text.user;
              // Apply gradient or solid color
              if (userConfig.gradient.enabled) {
                const stops = userConfig.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
                const gradientType = userConfig.gradient.type === 'radial' ? 'radial-gradient' : 'linear-gradient';
                const gradientAngle = userConfig.gradient.type === 'radial' ? 'circle' : `${userConfig.gradient.angle}deg`;
                contentDiv.style.background = `${gradientType}(${gradientAngle}, ${stops})`;
              } else {
                contentDiv.style.backgroundColor = userConfig.solidColor;
              }
              // Apply opacity
              contentDiv.style.opacity = userConfig.opacity;
              // Apply border
              contentDiv.style.border = `${userConfig.border.width}px ${userConfig.border.style} ${userConfig.border.color}`;
              contentDiv.style.borderRadius = `${userConfig.border.radius}px`;
              // Apply shadow
              if (userConfig.shadow.enabled) {
                contentDiv.style.boxShadow = userConfig.shadow.value;
              } else {
                contentDiv.style.boxShadow = 'none';
              }
            }
            previewArea.appendChild(userBubble);
          }
          
          // --- Voice Bubble Preview ---
          // User Voice Bubble
          const userVoiceMsg = {
            role: CONSTANTS.ROLES.USER,
            type: CONSTANTS.MSG_TYPES.VOICE,
            content: "语音预览",
            timestamp: 3
          };
          const userVoiceBubble = createMessageElement(userVoiceMsg, chat);
          if (userVoiceBubble) {
             // Apply temporary voice styles from currentBubbleState (the preview state)
             // But createMessageElement uses state.chats[id].settings.
             // We need to manually override styles on the generated element for preview.
             const voiceBody = userVoiceBubble.querySelector('.voice-message-body');
             const duration = userVoiceBubble.querySelector('.voice-duration');
             const waveform = userVoiceBubble.querySelector('.voice-waveform');
             
             if (voiceBody && duration && waveform) {
                const config = currentBubbleState ? currentBubbleState.voice.user : chat.settings.bubbleSettings.voice.user;
                voiceBody.style.backgroundColor = config.backgroundColor;
                duration.style.color = config.durationColor;
                
                // For waveform, we need to color the bars. They are divs inside .voice-waveform
                // Note: The animation uses background-color: currentColor.
                // So setting color on parent or background-color on children works.
                // Existing CSS: .voice-waveform div { background-color: currentColor; }
                // So we set color on the waveform container or directly on divs.
                waveform.style.color = config.waveformColor; 
                
                // Also need to handle the triangle (::after pseudo-element).
                // We can't style pseudo-elements inline. We need a scoped style or rely on the background color match if possible.
                // The triangle uses border-color.
                // It's tricky to update pseudo-element styles dynamically without adding a <style> block.
                // However, for the PREVIEW, maybe we can live with just the body color, OR we inject a mini style block.
                
                // Let's reuse applyScopedCss approach or just set a custom class?
                // Actually, existing logic for customCss uses applyScopedCss.
                // But here we are previewing specific settings that might NOT be saved to chat.settings yet (only in currentBubbleState).
                
                // To style pseudo-element for THIS specific preview element, we can add a unique ID or class and a temporary style.
                // Or simpler: The user voice bubble has a triangle on the right.
                // .message-bubble.user .voice-message-body::after { border-color: transparent transparent transparent #2ba245; }
                // We need to override that #2ba245 with config.backgroundColor.
                
                userVoiceBubble.style.setProperty('--preview-user-voice-bg', config.backgroundColor);
                // We need a way to tell CSS to use this variable. 
                // Since we can't easily change the global CSS, let's inject a style block for the preview area specifically.
                
                // Actually, let's try to set style on the element and see if we can use CSS variable in the main CSS?
                // No, main CSS is hardcoded.
                
                // Hack: We can append a <style> tag to the preview area or document head just for this preview.
                const previewStyleId = 'voice-preview-style';
                let previewStyle = document.getElementById(previewStyleId);
                if (!previewStyle) {
                    previewStyle = document.createElement('style');
                    previewStyle.id = previewStyleId;
                    document.head.appendChild(previewStyle);
                }
                
                const aiConfig = currentBubbleState ? currentBubbleState.voice.ai : chat.settings.bubbleSettings.voice.ai;
                
                previewStyle.textContent = `
                    #settings-preview-area .message-bubble.user .voice-message-body::after {
                        border-color: transparent transparent transparent ${config.backgroundColor} !important;
                    }
                    #settings-preview-area .message-bubble.ai .voice-message-body::after {
                         border-color: transparent ${aiConfig.backgroundColor} transparent transparent !important;
                    }
                    /* Dark mode check if needed, but preview area might force a theme */
                `;
             }
             previewArea.appendChild(userVoiceBubble);
          }

          // AI Voice Bubble
          const aiVoiceMsg = {
            role: "ai",
            type: CONSTANTS.MSG_TYPES.VOICE,
            content: "语音预览",
            timestamp: 4
          };
          const aiVoiceBubble = createMessageElement(aiVoiceMsg, chat);
          if (aiVoiceBubble) {
             const voiceBody = aiVoiceBubble.querySelector('.voice-message-body');
             const duration = aiVoiceBubble.querySelector('.voice-duration');
             const waveform = aiVoiceBubble.querySelector('.voice-waveform');
             
             if (voiceBody && duration && waveform) {
                const config = currentBubbleState ? currentBubbleState.voice.ai : chat.settings.bubbleSettings.voice.ai;
                voiceBody.style.backgroundColor = config.backgroundColor;
                duration.style.color = config.durationColor;
                waveform.style.color = config.waveformColor;
             }
             previewArea.appendChild(aiVoiceBubble);
          }

          // 4. 应用自定义CSS到预览区
          applyScopedCss(
            customCss,
            "#settings-preview-area",
            "preview-bubble-style",
          );
        }

        async function openGroupManager() {
          await renderGroupList();
          document
            .getElementById("group-management-modal")
            .classList.add("visible");
        }

        async function renderGroupList() {
          const listEl = document.getElementById("existing-groups-list");
          const groups = await db.qzoneGroups.toArray();
          listEl.innerHTML = "";
          if (groups.length === 0) {
            listEl.innerHTML =
              '<p style="text-align: center; color: var(--text-secondary);">还没有任何分组</p>';
          }
          groups.forEach((group) => {
            const item = document.createElement("div");
            item.className = "existing-group-item";
            item.innerHTML = `
                  <span class="group-name">${group.name}</span>
                  <span class="delete-group-btn" data-id="${group.id}">×</span>
              `;
            listEl.appendChild(item);
          });
        }

        async function addNewGroup() {
          const input = document.getElementById("new-group-name-input");
          const name = input.value.trim();
          if (!name) {
            showCustomAlert("提示", "分组名不能为空！");
            return;
          }

          // 【核心修正】在添加前，先检查分组名是否已存在
          const existingGroup = await db.qzoneGroups
            .where("name")
            .equals(name)
            .first();
          if (existingGroup) {
            showCustomAlert("提示", `分组 "${name}" 已经存在了，换个名字吧！`);
            return;
          }
          // 【修正结束】

          await db.qzoneGroups.add({ name });
          input.value = "";
          await renderGroupList();
        }

        async function deleteGroup(groupId) {
          const confirmed = await showCustomConfirm(
            "确认删除",
            "删除分组后，该组内的好友将变为“未分组”。确定要删除吗？",
            { confirmButtonClass: "btn-danger" },
          );
          if (confirmed) {
            await db.qzoneGroups.delete(groupId);
            // 将属于该分组的好友的 groupId 设为 null
            const chatsToUpdate = await db.chats
              .where("groupId")
              .equals(groupId)
              .toArray();
            for (const chat of chatsToUpdate) {
              chat.groupId = null;
              await db.chats.put(chat);
              if (state.chats[chat.id]) state.chats[chat.id].groupId = null;
            }
            await renderGroupList();
          }
        }

        /**
         * 当长按消息时，显示操作菜单
         * @param {number} timestamp - 被长按消息的时间戳
         */
        function showMessageActions(timestamp) {
          // 如果已经在多选模式，则不弹出菜单
          if (isSelectionMode) return;

          activeMessageTimestamp = timestamp;
          document
            .getElementById("message-actions-modal")
            .classList.add("visible");
        }

        /**
         * 隐藏消息操作菜单
         */
        function hideMessageActions() {
          document
            .getElementById("message-actions-modal")
            .classList.remove("visible");
          activeMessageTimestamp = null;
        }

        async function openMessageEditor() {
          if (!activeMessageTimestamp) return;

          const timestampToEdit = activeMessageTimestamp;
          const chat = state.chats[state.activeChatId];
          const message = chat.history.find(
            (m) => m.timestamp === timestampToEdit,
          );
          if (!message) return;

          hideMessageActions();

          let contentForEditing;
          // 【核心修正】将 share_link 也加入特殊类型判断
          const isSpecialType =
            message.type &&
            [CONSTANTS.MSG_TYPES.VOICE, CONSTANTS.MSG_TYPES.IMAGE, CONSTANTS.MSG_TYPES.TRANSFER, CONSTANTS.MSG_TYPES.SHARE_LINK].includes(
              message.type,
            );

          if (isSpecialType) {
            let fullMessageObject = { type: message.type };
            if (message.type === CONSTANTS.MSG_TYPES.VOICE)
              fullMessageObject.content = message.content;
            else if (message.type === CONSTANTS.MSG_TYPES.IMAGE)
              fullMessageObject.description = message.content;
            else if (message.type === CONSTANTS.MSG_TYPES.TRANSFER) {
              fullMessageObject.amount = message.amount;
              fullMessageObject.note = message.note;
            }
            // 【核心修正】处理分享链接类型的消息
            else if (message.type === CONSTANTS.MSG_TYPES.SHARE_LINK) {
              fullMessageObject.title = message.title;
              fullMessageObject.description = message.description;
              fullMessageObject.source_name = message.source_name;
              fullMessageObject.content = message.content;
            }
            contentForEditing = JSON.stringify(fullMessageObject, null, 2);
          } else if (typeof message.content === "object") {
            contentForEditing = JSON.stringify(message.content, null, 2);
          } else {
            contentForEditing = message.content;
          }

          // 【核心修改1】在这里添加 'link' 模板
          const templates = {
            voice: { type: CONSTANTS.MSG_TYPES.VOICE, content: "在这里输入语音内容" },
            image: { type: CONSTANTS.MSG_TYPES.IMAGE, description: "在这里输入图片描述" },
            transfer: { type: CONSTANTS.MSG_TYPES.TRANSFER, amount: 5.2, note: "一点心意" },
            link: {
              type: CONSTANTS.MSG_TYPES.SHARE_LINK,
              title: "文章标题",
              description: "文章摘要...",
              source_name: "来源网站",
              content: "文章完整内容...",
            },
          };

          // 【核心修改2】在这里添加新的“链接”按钮
          const helpersHtml = `
              <div class="format-helpers">
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.voice,
                  )}'>语音</button>
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.image,
                  )}'>图片</button>
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.transfer,
                  )}'>转账</button>
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.link,
                  )}'>链接</button>
              </div>
          `;

          const newContent = await showCustomPrompt(
            "编辑消息",
            "在此修改，或点击上方按钮使用格式模板...",
            contentForEditing,
            "textarea",
            helpersHtml,
          );

          if (newContent !== null) {
            // 【核心修正】这里调用的应该是 saveEditedMessage，而不是 saveAdvancedEditor
            await saveEditedMessage(timestampToEdit, newContent, true);
          }
        }

        /**
         * 复制消息的文本内容到剪贴板
         */
        async function copyMessageContent() {
          if (!activeMessageTimestamp) return;
          const chat = state.chats[state.activeChatId];
          const message = chat.history.find(
            (m) => m.timestamp === activeMessageTimestamp,
          );
          if (!message) return;

          let textToCopy;
          if (typeof message.content === "object") {
            textToCopy = JSON.stringify(message.content);
          } else {
            textToCopy = String(message.content);
          }

          try {
            await navigator.clipboard.writeText(textToCopy);
            await showCustomAlert("复制成功", "消息内容已复制到剪贴板。");
          } catch (err) {
            await showCustomAlert("复制失败", "无法访问剪贴板。");
          }

          hideMessageActions();
        }

        /**
         * 创建一个可编辑的消息块（包含文本框、格式助手和删除按钮）
         * @param {string} initialContent - 文本框的初始内容
         * @returns {HTMLElement} - 创建好的DOM元素
         */
        function createMessageEditorBlock(initialContent = "") {
          const block = document.createElement("div");
          block.className = "message-editor-block";

          // 【核心修改1】在这里添加 'link' 模板
          const templates = {
            voice: { type: CONSTANTS.MSG_TYPES.VOICE, content: "在这里输入语音内容" },
            image: { type: CONSTANTS.MSG_TYPES.IMAGE, description: "在这里输入图片描述" },
            transfer: { type: CONSTANTS.MSG_TYPES.TRANSFER, amount: 5.2, note: "一点心意" },
            link: {
              type: CONSTANTS.MSG_TYPES.SHARE_LINK,
              title: "文章标题",
              description: "文章摘要...",
              source_name: "来源网站",
              content: "文章完整内容...",
            },
          };

          block.innerHTML = `
              <button class="delete-block-btn" title="删除此条">×</button>
              <textarea>${initialContent}</textarea>
              <div class="format-helpers">
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.voice,
                  )}'>语音</button>
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.image,
                  )}'>图片</button>
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.transfer,
                  )}'>转账</button>
                  <!-- 【核心修改2】在这里添加新的“链接”按钮 -->
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.link,
                  )}'>链接</button>
              </div>
          `;

          // 绑定删除按钮事件
          block
            .querySelector(".delete-block-btn")
            .addEventListener("click", () => {
              // 确保至少保留一个编辑块
              if (
                document.querySelectorAll(".message-editor-block").length > 1
              ) {
                block.remove();
              } else {
                showCustomAlert("提示", "至少需要保留一条消息。");
              }
            });

          // 绑定格式助手按钮事件
          block.querySelectorAll(".format-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
              const templateStr = btn.dataset.template;
              const textarea = block.querySelector("textarea");
              if (templateStr && textarea) {
                try {
                  const templateObj = JSON.parse(templateStr);
                  textarea.value = JSON.stringify(templateObj, null, 2);
                  textarea.focus();
                } catch (e) {
                  console.error("解析格式模板失败:", e);
                }
              }
            });
          });

          return block;
        }

        /**
         * 打开全新的、可视化的多消息编辑器，并动态绑定其所有按钮事件
         */
        function openAdvancedMessageEditor() {
          if (!activeMessageTimestamp) return;

          // 1. 【核心】在关闭旧菜单前，将需要的时间戳捕获到局部变量中
          const timestampToEdit = activeMessageTimestamp;

          const chat = state.chats[state.activeChatId];
          const message = chat.history.find(
            (m) => m.timestamp === timestampToEdit,
          );
          if (!message) return;

          // 2. 现在可以安全地关闭旧菜单了，因为它不会影响我们的局部变量
          hideMessageActions();

          const editorModal = document.getElementById("message-editor-modal");
          const editorContainer = document.getElementById(
            "message-editor-container",
          );
          editorContainer.innerHTML = "";

          // 3. 准备初始内容
          let initialContent;
          const isSpecialType =
            message.type &&
            [CONSTANTS.MSG_TYPES.VOICE, CONSTANTS.MSG_TYPES.IMAGE, CONSTANTS.MSG_TYPES.TRANSFER].includes(message.type);
          if (isSpecialType) {
            let fullMessageObject = { type: message.type };
            if (message.type === CONSTANTS.MSG_TYPES.VOICE)
              fullMessageObject.content = message.content;
            else if (message.type === CONSTANTS.MSG_TYPES.IMAGE)
              fullMessageObject.description = message.content;
            else if (message.type === CONSTANTS.MSG_TYPES.TRANSFER) {
              fullMessageObject.amount = message.amount;
              fullMessageObject.note = message.note;
            }
            initialContent = JSON.stringify(fullMessageObject, null, 2);
          } else if (typeof message.content === "object") {
            initialContent = JSON.stringify(message.content, null, 2);
          } else {
            initialContent = message.content;
          }

          const firstBlock = createMessageEditorBlock(initialContent);
          editorContainer.appendChild(firstBlock);

          // 4. 【核心】动态绑定所有控制按钮的事件
          // 为了防止事件重复绑定，我们使用克隆节点的方法来清除旧监听器
          const addBtn = document.getElementById(
            "add-message-editor-block-btn",
          );
          const newAddBtn = addBtn.cloneNode(true);
          addBtn.parentNode.replaceChild(newAddBtn, addBtn);
          newAddBtn.addEventListener("click", () => {
            const newBlock = createMessageEditorBlock();
            editorContainer.appendChild(newBlock);
            newBlock.querySelector("textarea").focus();
          });

          const cancelBtn = document.getElementById(
            "cancel-advanced-editor-btn",
          );
          const newCancelBtn = cancelBtn.cloneNode(true);
          cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
          newCancelBtn.addEventListener("click", () => {
            editorModal.classList.remove("visible");
          });

          const saveBtn = document.getElementById("save-advanced-editor-btn");
          const newSaveBtn = saveBtn.cloneNode(true);
          saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
          // 将捕获到的时间戳，直接绑定给这一次的保存点击事件
          newSaveBtn.addEventListener("click", () => {
            saveEditedMessage(timestampToEdit);
          });

          // 5. 最后，显示模态框
          editorModal.classList.add("visible");
        }

        /**
         * 解析编辑后的文本，并返回一个标准化的消息片段对象
         * @param {string} text - 用户在编辑框中输入的文本
         * @returns {object} - 一个包含 type, content, 等属性的对象
         */
        function parseEditedContent(text) {
          const trimmedText = text.trim();

          // 1. 尝试解析为JSON对象（用于修复语音、转账等格式）
          if (trimmedText.startsWith("{") && trimmedText.endsWith("}")) {
            try {
              const parsed = JSON.parse(trimmedText);
              // 必须包含 type 属性才认为是有效格式
              if (parsed.type) {
                return parsed;
              }
            } catch (e) {
              /* 解析失败，继续往下走 */
            }
          }

          // 2. 尝试解析为表情包
          if (STICKER_REGEX.test(trimmedText)) {
            // 对于编辑的表情，我们暂时无法知道其`meaning`，所以只存URL
            return { type: CONSTANTS.MSG_TYPES.STICKER, content: trimmedText };
          }

          // 3. 否则，视为普通文本消息
          return { type: CONSTANTS.MSG_TYPES.TEXT, content: trimmedText };
        }

        async function saveEditedMessage(timestamp, simpleContent = null) {
          if (!timestamp) return;

          const chat = state.chats[state.activeChatId];
          const messageIndex = chat.history.findIndex(
            (m) => m.timestamp === timestamp,
          );
          if (messageIndex === -1) return;

          let newMessages = [];

          // 判断是来自高级编辑器还是简单编辑器
          if (simpleContent !== null) {
            // --- 来自简单编辑器 ---
            const rawContent = simpleContent.trim();
            if (rawContent) {
              const parsedResult = parseEditedContent(rawContent);
              const newMessage = {
                role: chat.history[messageIndex].role,
                senderName: chat.history[messageIndex].senderName,
                // 注意：这里我们暂时不设置时间戳
                content: parsedResult.content || "",
              };
              if (parsedResult.type && parsedResult.type !== CONSTANTS.MSG_TYPES.TEXT)
                newMessage.type = parsedResult.type;
              if (parsedResult.meaning)
                newMessage.meaning = parsedResult.meaning;
              if (parsedResult.amount) newMessage.amount = parsedResult.amount;
              if (parsedResult.note) newMessage.note = parsedResult.note;
              if (parsedResult.title) newMessage.title = parsedResult.title;
              if (parsedResult.description)
                newMessage.description = parsedResult.description;
              if (parsedResult.source_name)
                newMessage.source_name = parsedResult.source_name;
              if (
                parsedResult.description &&
                parsedResult.type === CONSTANTS.MSG_TYPES.IMAGE
              ) {
                newMessage.content = parsedResult.description;
              }

              newMessages.push(newMessage);
            }
          } else {
            // --- 来自高级编辑器 ---
            const editorContainer = document.getElementById(
              "message-editor-container",
            );
            const editorBlocks = editorContainer.querySelectorAll(
              ".message-editor-block",
            );

            for (const block of editorBlocks) {
              const textarea = block.querySelector("textarea");
              const rawContent = textarea.value.trim();
              if (!rawContent) continue;

              const parsedResult = parseEditedContent(rawContent);
              const newMessage = {
                role: chat.history[messageIndex].role,
                senderName: chat.history[messageIndex].senderName,
                // 同样，这里我们先不分配时间戳
                content: parsedResult.content || "",
              };

              if (parsedResult.type && parsedResult.type !== CONSTANTS.MSG_TYPES.TEXT)
                newMessage.type = parsedResult.type;
              if (parsedResult.meaning)
                newMessage.meaning = parsedResult.meaning;
              if (parsedResult.amount) newMessage.amount = parsedResult.amount;
              if (parsedResult.note) newMessage.note = parsedResult.note;
              if (parsedResult.title) newMessage.title = parsedResult.title;
              if (parsedResult.description)
                newMessage.description = parsedResult.description;
              if (parsedResult.source_name)
                newMessage.source_name = parsedResult.source_name;
              if (
                parsedResult.description &&
                parsedResult.type === CONSTANTS.MSG_TYPES.IMAGE
              ) {
                newMessage.content = parsedResult.description;
              }

              newMessages.push(newMessage);
            }
          }

          if (newMessages.length === 0) {
            document
              .getElementById("message-editor-modal")
              .classList.remove("visible");
            return; // 如果是空消息，直接返回，不执行删除操作
          }

          // ★★★★★【核心修复逻辑就在这里】★★★★★

          // 1. 使用 splice 将旧消息替换为新消息（此时新消息还没有时间戳）
          chat.history.splice(messageIndex, 1, ...newMessages);

          // 2. 确定重新分配时间戳的起点
          // 我们从被编辑的消息的原始时间戳开始
          let reassignTimestamp = timestamp;

          // 3. 从被修改的位置开始，遍历所有后续的消息
          for (let i = messageIndex; i < chat.history.length; i++) {
            // 4. 为每一条消息（包括新插入的）分配一个新的、唯一的、连续的时间戳
            chat.history[i].timestamp = reassignTimestamp;

            // 5. 将时间戳+1，为下一条消息做准备
            reassignTimestamp++;
          }
          // ★★★★★【修复结束】★★★★★

          await db.chats.put(chat);

          // 关闭可能打开的模态框并刷新UI
          document
            .getElementById("message-editor-modal")
            .classList.remove("visible");
          renderChatInterface(state.activeChatId);
          await showCustomAlert("成功", "消息已更新！");
        }

        /**
         * 当点击“…”时，显示动态操作菜单
         * @param {number} postId - 被操作的动态的ID
         */
        function showPostActions(postId) {
          activePostId = postId;
          document
            .getElementById("post-actions-modal")
            .classList.add("visible");
        }

        /**
         * 隐藏动态操作菜单
         */
        function hidePostActions() {
          document
            .getElementById("post-actions-modal")
            .classList.remove("visible");
          activePostId = null;
        }

        /**
         * 打开动态编辑器
         */
        async function openPostEditor() {
          if (!activePostId) return;

          const postIdToEdit = activePostId;
          const post = await db.qzonePosts.get(postIdToEdit);
          if (!post) return;

          hidePostActions();

          // 忠于原文：构建出最原始的文本形态供编辑
          let contentForEditing;
          if (post.type === "shuoshuo") {
            contentForEditing = post.content;
          } else {
            // 对于图片和文字图，我们构建一个包含所有信息的对象
            const postObject = {
              type: post.type,
              publicText: post.publicText || "",
            };
            if (post.type === "image_post") {
              postObject.imageUrl = post.imageUrl;
              postObject.imageDescription = post.imageDescription;
            } else if (post.type === "text_image") {
              postObject.hiddenContent = post.hiddenContent;
            }
            contentForEditing = JSON.stringify(postObject, null, 2);
          }

          // 构建格式助手按钮
          const templates = {
            shuoshuo: "在这里输入说说的内容...", // 对于说说，我们直接替换为纯文本
            image: {
              type: "image_post",
              publicText: "",
              imageUrl: "https://...",
              imageDescription: "",
            },
            text_image: {
              type: "text_image",
              publicText: "",
              hiddenContent: "",
            },
          };

          const helpersHtml = `
              <div class="format-helpers">
                  <button class="format-btn" data-type=CONSTANTS.MSG_TYPES.TEXT>说说</button>
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.image,
                  )}'>图片动态</button>
                  <button class="format-btn" data-template='${JSON.stringify(
                    templates.text_image,
                  )}'>文字图</button>
              </div>
          `;

          const newContent = await showCustomPrompt(
            "编辑动态",
            "在此修改内容...",
            contentForEditing,
            "textarea",
            helpersHtml,
          );

          // 【特殊处理】为说说的格式助手按钮添加不同的行为
          // 我们需要在模态框出现后，再给它绑定事件
          setTimeout(() => {
            const shuoshuoBtn = document.querySelector(
              '#custom-modal-body .format-btn[data-type=CONSTANTS.MSG_TYPES.TEXT]',
            );
            if (shuoshuoBtn) {
              shuoshuoBtn.addEventListener("click", () => {
                const input = document.getElementById("custom-prompt-input");
                input.value = templates.shuoshuo;
                input.focus();
              });
            }
          }, 100);

          if (newContent !== null) {
            await saveEditedPost(postIdToEdit, newContent);
          }
        }

        /**
         * 保存编辑后的动态
         * @param {number} postId - 要保存的动态ID
         * @param {string} newRawContent - 从编辑器获取的新内容
         */
        async function saveEditedPost(postId, newRawContent) {
          const post = await db.qzonePosts.get(postId);
          if (!post) return;

          const trimmedContent = newRawContent.trim();

          // 尝试解析为JSON，如果失败，则认为是纯文本（说说）
          try {
            const parsed = JSON.parse(trimmedContent);
            // 更新帖子属性
            post.type = parsed.type || "image_post";
            post.publicText = parsed.publicText || "";
            post.imageUrl = parsed.imageUrl || "";
            post.imageDescription = parsed.imageDescription || "";
            post.hiddenContent = parsed.hiddenContent || "";
            post.content = ""; // 清空旧的说说内容字段
          } catch (e) {
            // 解析失败，认为是说说
            post.type = "shuoshuo";
            post.content = trimmedContent;
            // 清空其他类型的字段
            post.publicText = "";
            post.imageUrl = "";
            post.imageDescription = "";
            post.hiddenContent = "";
          }

          await db.qzonePosts.put(post);
          await renderQzonePosts(); // 重新渲染列表
          await showCustomAlert("成功", "动态已更新！");
        }

        /**
         * 复制动态内容
         */
        async function copyPostContent() {
          if (!activePostId) return;
          const post = await db.qzonePosts.get(activePostId);
          if (!post) return;

          let textToCopy =
            post.content ||
            post.publicText ||
            post.hiddenContent ||
            post.imageDescription ||
            "（无文字内容）";

          try {
            await navigator.clipboard.writeText(textToCopy);
            await showCustomAlert("复制成功", "动态内容已复制到剪贴板。");
          } catch (err) {
            await showCustomAlert("复制失败", "无法访问剪贴板。");
          }

          hidePostActions();
        }

        let selectedContacts = new Set();

        async function openContactPickerForGroupCreate() {
          selectedContacts.clear(); // 清空上次选择

          // 【核心修复】在这里，我们为“完成”按钮明确绑定“创建群聊”的功能
          const confirmBtn = document.getElementById(
            "confirm-contact-picker-btn",
          );
          // 使用克隆节点技巧，清除掉之前可能绑定的任何其他事件（比如“添加成员”）
          const newConfirmBtn = confirmBtn.cloneNode(true);
          confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
          // 重新绑定正确的“创建群聊”函数
          newConfirmBtn.addEventListener("click", handleCreateGroup);

          await renderContactPicker();
          showScreen("contact-picker-screen");
        }

        /**
         * 渲染联系人选择列表
         */
        async function renderContactPicker() {
          const listEl = document.getElementById("contact-picker-list");
          listEl.innerHTML = "";

          // 只选择单聊角色作为群成员候选
          const contacts = Object.values(state.chats).filter(
            (chat) => !chat.isGroup,
          );

          if (contacts.length === 0) {
            listEl.innerHTML =
              '<p style="text-align:center; color:#8a8a8a; margin-top:50px;">还没有可以拉进群的联系人哦~</p>';
            return;
          }

          const fragment = document.createDocumentFragment();
          contacts.forEach((contact) => {
            const item = document.createElement("div");
            item.className = "contact-picker-item";
            item.dataset.contactId = contact.id;
            item.innerHTML = `
                  <div class="checkbox"></div>
                  <img src="${
                    contact.settings.aiAvatar || defaultAvatar
                  }" class="avatar">
                  <span class="name">${contact.name}</span>
              `;
            fragment.appendChild(item);
          });
          listEl.appendChild(fragment);

          updateContactPickerConfirmButton();
        }

        /**
         * 更新“完成”按钮的计数
         */
        function updateContactPickerConfirmButton() {
          const btn = document.getElementById("confirm-contact-picker-btn");
          btn.textContent = `完成(${selectedContacts.size})`;
          btn.disabled = selectedContacts.size < 2; // 至少需要2个人才能创建群聊
        }

        /**
         * 【重构版】处理创建群聊的最终逻辑
         */
        async function handleCreateGroup() {
          if (selectedContacts.size < 2) {
            showCustomAlert("提示", "创建群聊至少需要选择2个联系人。");
            return;
          }

          const groupName = await showCustomPrompt(
            "设置群名",
            "请输入群聊的名字",
            "我们的群聊",
          );
          if (!groupName || !groupName.trim()) return;

          const newChatId = "group_" + Date.now();
          const members = [];

          // 遍历选中的联系人ID
          for (const contactId of selectedContacts) {
            const contactChat = state.chats[contactId];
            if (contactChat) {
              // ★★★【核心重构】★★★
              // 我们现在同时存储角色的“本名”和“群昵称”
              members.push({
                id: contactId,
                originalName: contactChat.name, // 角色的“本名”，用于AI识别
                groupNickname: contactChat.name, // 角色的“群昵称”，用于显示和修改，初始值和本名相同
                avatar: contactChat.settings.aiAvatar || defaultAvatar,
                persona: contactChat.settings.aiPersona,
                avatarFrame: contactChat.settings.aiAvatarFrame || "",
              });
            }
          }

          const newGroupChat = {
            id: newChatId,
            name: groupName.trim(),
            isGroup: true,
            members: members,
            settings: {
              myPersona: "我是谁呀。",
              myNickname: "我",
              maxMemory: 10,
              groupAvatar: defaultGroupAvatar,
              myAvatar: defaultMyGroupAvatar,
              background: "",
              theme: "default",
              fontSize: 13,
              customCss: "",
              linkedWorldBookIds: [],
            },
            history: [],
            musicData: { totalTime: 0 },
          };

          state.chats[newChatId] = newGroupChat;
          await db.chats.put(newGroupChat);

          await renderChatList();
          showScreen("chat-list-screen");
          openChat(newChatId);
        }

        /**
         * 打开群成员管理屏幕
         */
        function openMemberManagementScreen() {
          if (!state.activeChatId || !state.chats[state.activeChatId].isGroup)
            return;
          renderMemberManagementList();
          showScreen("member-management-screen");
        }

        function renderMemberManagementList() {
          const listEl = document.getElementById("member-management-list");
          const chat = state.chats[state.activeChatId];
          listEl.innerHTML = "";

          chat.members.forEach((member) => {
            const item = document.createElement("div");
            item.className = "member-management-item";
            // 【核心修正】在这里，我们将显示的名称从 member.name 改为 member.groupNickname
            item.innerHTML = `
                  <img src="${member.avatar}" class="avatar">
                  <span class="name">${member.groupNickname}</span>
                  <button class="remove-member-btn" data-member-id="${member.id}" title="移出群聊">-</button>
              `;
            listEl.appendChild(item);
          });
        }

        /**
         * 从群聊中移除一个成员
         * @param {string} memberId - 要移除的成员ID
         */
        async function removeMemberFromGroup(memberId) {
          const chat = state.chats[state.activeChatId];
          const memberIndex = chat.members.findIndex((m) => m.id === memberId);

          if (memberIndex === -1) return;

          // 安全检查，群聊至少保留2人
          if (chat.members.length <= 2) {
            showCustomAlert("提示", "群聊人数不能少于2人。");
            return;
          }

          const memberName = chat.members[memberIndex].groupNickname; // <-- 修复：使用 groupNickname
          const confirmed = await showCustomConfirm(
            "移出成员",
            `确定要将“${memberName}”移出群聊吗？`,
            { confirmButtonClass: "btn-danger" },
          );

          if (confirmed) {
            chat.members.splice(memberIndex, 1);
            await db.chats.put(chat);
            renderMemberManagementList(); // 刷新成员管理列表
            document.getElementById("chat-settings-btn").click(); // 【核心修正】模拟点击设置按钮，强制刷新整个弹窗
          }
        }

        /**
         * 打开联系人选择器，用于拉人入群
         */
        async function openContactPickerForAddMember() {
          selectedContacts.clear(); // 清空选择

          const chat = state.chats[state.activeChatId];
          const existingMemberIds = new Set(chat.members.map((m) => m.id));

          // 渲染联系人列表，并自动排除已在群内的成员
          const listEl = document.getElementById("contact-picker-list");
          listEl.innerHTML = "";
          const contacts = Object.values(state.chats).filter(
            (c) => !c.isGroup && !existingMemberIds.has(c.id),
          );

          if (contacts.length === 0) {
            listEl.innerHTML =
              '<p style="text-align:center; color:#8a8a8a; margin-top:50px;">没有更多可以邀请的好友了。</p>';
            document.getElementById(
              "confirm-contact-picker-btn",
            ).style.display = "none"; // 没有人可选，隐藏完成按钮
          } else {
            document.getElementById(
              "confirm-contact-picker-btn",
            ).style.display = "block";
            contacts.forEach((contact) => {
              const item = document.createElement("div");
              item.className = "contact-picker-item";
              item.dataset.contactId = contact.id;
              item.innerHTML = `
                      <div class="checkbox"></div>
                      <img src="${
                        contact.settings.aiAvatar || defaultAvatar
                      }" class="avatar">
                      <span class="name">${contact.name}</span>
                  `;
              listEl.appendChild(item);
            });
          }

          // 更新按钮状态并显示屏幕
          updateContactPickerConfirmButton();
          showScreen("contact-picker-screen");
        }

        /**
         * 处理将选中的联系人加入群聊的逻辑
         */
        async function handleAddMembersToGroup() {
          if (selectedContacts.size === 0) {
            showCustomAlert("提示", "请至少选择一个要添加的联系人。");
            return;
          }

          const chat = state.chats[state.activeChatId];

          for (const contactId of selectedContacts) {
            const contactChat = state.chats[contactId];
            if (contactChat) {
              chat.members.push({
                id: contactId,
                originalName: contactChat.name, // <-- 修复1：使用 'originalName' 存储本名
                groupNickname: contactChat.name, // <-- 修复2：同时创建一个初始的 'groupNickname'
                avatar: contactChat.settings.aiAvatar || defaultAvatar,
                persona: contactChat.settings.aiPersona,
                avatarFrame: contactChat.settings.aiAvatarFrame || "",
              });
            }
          }

          await db.chats.put(chat);
          openMemberManagementScreen(); // 返回到群成员管理界面
          renderGroupMemberSettings(chat.members); // 同时更新聊天设置里的头像
        }

        /**
         * 【重构版】在群聊中创建一个全新的虚拟成员
         */
        async function createNewMemberInGroup() {
          const name = await showCustomPrompt(
            "创建新成员",
            "请输入新成员的名字 (这将是TA的“本名”，不可更改)",
          );
          if (!name || !name.trim()) return;

          // 检查本名是否已在群内存在
          const chat = state.chats[state.activeChatId];
          if (chat.members.some((m) => m.originalName === name.trim())) {
            showCustomAlert("提示", `错误：群内已存在名为“${name.trim()}”的成员！`);
            return;
          }

          const persona = await showCustomPrompt(
            "设置人设",
            `请输入“${name}”的人设`,
            "",
            "textarea",
          );
          if (persona === null) return;

          // ★★★【核心重构】★★★
          // 为新创建的NPC也建立双重命名机制
          const newMember = {
            id: "npc_" + Date.now(),
            originalName: name.trim(), // 新成员的“本名”
            groupNickname: name.trim(), // 新成员的初始“群昵称”
            avatar: defaultGroupMemberAvatar,
            persona: persona,
            avatarFrame: "",
          };

          chat.members.push(newMember);
          await db.chats.put(chat);

          renderMemberManagementList();
          renderGroupMemberSettings(chat.members);

          showCustomAlert("提示", `新成员“${name}”已成功加入群聊！`);
        }

        function startWaimaiCountdown(element, endTime) {
          const timerId = setInterval(() => {
            const now = Date.now();
            const distance = endTime - now;

            if (distance < 0) {
              clearInterval(timerId);
              element.innerHTML =
                "<span>已</span><span>超</span><span>时</span>";
              return;
            }

            const minutes = Math.floor(
              (distance % (1000 * 60 * 60)) / (1000 * 60),
            );
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const minStr = String(minutes).padStart(2, "0");
            const secStr = String(seconds).padStart(2, "0");

            element.innerHTML = `<span>${minStr.charAt(
              0,
            )}</span><span>${minStr.charAt(1)}</span> : <span>${secStr.charAt(
              0,
            )}</span><span>${secStr.charAt(1)}</span>`;
          }, 1000);
          return timerId;
        }

        function cleanupWaimaiTimers() {
          for (const timestamp in waimaiTimers) {
            clearInterval(waimaiTimers[timestamp]);
          }
          waimaiTimers = {};
        }

        async function handleWaimaiResponse(originalTimestamp, choice) {
          const chat = state.chats[state.activeChatId];
          if (!chat) return;

          const messageIndex = chat.history.findIndex(
            (m) => m.timestamp === originalTimestamp,
          );
          if (messageIndex === -1) return;

          // 1. 更新原始消息的状态
          const originalMessage = chat.history[messageIndex];
          originalMessage.status = choice;

          // 【核心修正】记录支付者，并构建对AI更清晰的系统消息
          let systemContent;
          const myNickname = chat.isGroup
            ? chat.settings.myNickname || "我"
            : "我";

          if (choice === "paid") {
            originalMessage.paidBy = myNickname; // 记录是用户付的钱
            systemContent = `[系统提示：你 (${myNickname}) 为 ${originalMessage.senderName} 的外卖订单（时间戳: ${originalTimestamp}）完成了支付。此订单已关闭，其他成员不能再支付。]`;
          } else {
            systemContent = `[系统提示：你 (${myNickname}) 拒绝了 ${originalMessage.senderName} 的外卖代付请求（时间戳: ${originalTimestamp}）。]`;
          }

          // 2. 创建一条新的、对用户隐藏的系统消息，告知AI结果
          const systemNote = {
            role: CONSTANTS.ROLES.SYSTEM,
            content: systemContent,
            timestamp: Date.now(),
            isHidden: true,
          };
          chat.history.push(systemNote);

          // 3. 保存更新到数据库并刷新UI
          await db.chats.put(chat);
          renderChatInterface(state.activeChatId);
        }

        let videoCallState = {
          isActive: false,
          isAwaitingResponse: false,
          isGroupCall: false,
          activeChatId: null,
          initiator: null,
          startTime: null,
          participants: [],
          isUserParticipating: true,

          callHistory: [], // 用于存储通话中的对话历史
          preCallContext: "", // 用于存储通话前的聊天摘要
        };

        let callTimerInterval = null; // 用于存储计时器的ID

        /**
         * 用户点击“发起视频通话”或“发起群视频”按钮
         */
        async function handleInitiateCall() {
          if (
            !state.activeChatId ||
            videoCallState.isActive ||
            videoCallState.isAwaitingResponse
          )
            return;

          const chat = state.chats[state.activeChatId];
          videoCallState.isGroupCall = chat.isGroup;
          videoCallState.isAwaitingResponse = true;
          videoCallState.initiator = CONSTANTS.ROLES.USER;
          videoCallState.activeChatId = chat.id;
          videoCallState.isUserParticipating = true;

          // 1. 显示“正在呼叫”界面
          if (chat.isGroup) {
            document.getElementById("outgoing-call-avatar").src =
              chat.settings.myAvatar || defaultMyGroupAvatar;
            document.getElementById("outgoing-call-name").textContent =
              chat.settings.myNickname || "我";
          } else {
            document.getElementById("outgoing-call-avatar").src =
              chat.settings.aiAvatar || defaultAvatar;
            document.getElementById("outgoing-call-name").textContent =
              chat.name;
          }
          document.querySelector(
            "#outgoing-call-screen .caller-text",
          ).textContent = chat.isGroup ? "正在呼叫所有成员..." : "正在呼叫...";
          showScreen("outgoing-call-screen");

          // 在发起通话时，提前准备好通话前的聊天记录上下文
          videoCallState.preCallContext = chat.history
            .slice(-20) // 获取最近20条消息
            .map(
              (msg) =>
                `${
                  msg.role === CONSTANTS.ROLES.USER
                    ? chat.settings.myNickname || "我"
                    : msg.senderName || chat.name
                }: ${String(msg.content).substring(0, 50)}...`,
            )
            .join("\n");

          // 2. 重新构建一个信息更丰富、指令更明确的API请求
          try {
            const { proxyUrl, apiKey, model } = getActiveApiConfig() || {};
            if (!proxyUrl || !apiKey || !model) {
              throw new Error("API未配置，无法发起通话。");
            }

            let systemPromptForCall;
            if (chat.isGroup) {
              systemPromptForCall = `
      			# 你的任务
      			你是一个群聊AI，负责扮演【除了用户以外】的所有角色。
      			用户 (${chat.settings.myNickname || "我"}) 刚刚发起了群视频通话。
      			你的任务是根据每个角色的性格和最近的聊天内容，决定他们是否要加入通话。

      			# 核心规则
      			1.  **决策**: 每个角色都必须独立决策。
      			2.  **格式**: 你的回复【必须】是一个JSON数组，每个对象代表一个角色的决策，格式为：\`{"type": "group_call_response", "name": "【角色的本名】", "decision": "join"}\` 或 \`{"type": "group_call_response", "name": "【角色的本名】", "decision": "decline"}\`。
      			3.  **倾向性**: 在没有特殊理由的情况下，你的角色们通常乐于加入群聊。

      			# 角色列表与人设
      			${chat.members
              .map((m) => `- **${m.originalName}**: ${m.persona}`)
              .join("\n")}

      			# 通话前的聊天摘要
      			${videoCallState.preCallContext}
      			`;
            } else {
              systemPromptForCall = `
      			# 你的任务
      			你正在扮演角色 "${chat.name}"。用户 (${
              chat.settings.myNickname || "我"
            }) 刚刚向你发起了视频通话请求。
      			你的任务是根据你的人设和我们最近的聊天内容，决定是否接受。

      			# 核心规则
      			1.  **决策**: 你必须做出 "accept" (接受) 或 "reject" (拒绝) 的决定。
      			2.  **格式**: 你的回复【必须且只能】是一个JSON数组，其中包含一个对象，格式为：\`[{"type": "video_call_response", "decision": "accept"}]\` 或 \`[{"type": "video_call_response", "decision": "reject"}]\`。
      			3.  **倾向性**: 作为一个友好的AI伴侣，在没有特殊理由（比如在之前的对话中明确表示了不想被打扰或正在忙）的情况下，你【应该优先选择接受】通话。

      			# 你的人设
      			${chat.settings.aiPersona}

      			# 通话前的聊天摘要
      			${videoCallState.preCallContext}
      			`;
            }

            const messagesForApi = [
              {
                role: CONSTANTS.ROLES.USER,
                content: "请根据你在系统指令中读到的规则，立即做出你的决策。",
              },
            ];

            let isGemini = proxyUrl === CONSTANTS.API.GEMINI_BASE_URL;
            let geminiConfig = toGeminiRequestData(
              model,
              apiKey,
              systemPromptForCall,
              messagesForApi,
              isGemini,
            );

            const response = isGemini
              ? await fetch(geminiConfig.url, geminiConfig.data)
              : await fetch(`${proxyUrl}/v1/chat/completions`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: model,
                    messages: [
                      { role: CONSTANTS.ROLES.SYSTEM, content: systemPromptForCall },
                      ...messagesForApi,
                    ],
                    temperature: 0.8,
                  }),
                });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API 错误 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            const aiResponseContent = (
              isGemini
                ? data.candidates[0].content.parts[0].text
                : data.choices[0].message.content
            ).replace(/^```json\s*|```$/g, "");
            const responseArray = JSON.parse(aiResponseContent);

            if (chat.isGroup) {
              responseArray.forEach((action) => {
                if (
                  action.type === "group_call_response" &&
                  action.decision === "join"
                ) {
                  const member = chat.members.find(
                    (m) => m.originalName === action.name,
                  );
                  if (member) videoCallState.participants.push(member);
                }
              });
              if (videoCallState.participants.length > 0) {
                startVideoCall();
              } else {
                throw new Error("群里没有人接听你的通话邀请。");
              }
            } else {
              const decision = responseArray[0];
              if (
                decision.type === "video_call_response" &&
                decision.decision === "accept"
              ) {
                startVideoCall();
              } else {
                throw new Error("对方拒绝了你的视频通话请求。");
              }
            }
          } catch (error) {
            console.error("发起通话失败:", error);
            await showCustomAlert("呼叫失败", error.message);
            videoCallState.isAwaitingResponse = false;
            showScreen("chat-interface-screen");
          }
        }

        function startVideoCall() {
          const chat = state.chats[videoCallState.activeChatId];
          if (!chat) return;

          // 提取通话前的最后20条消息作为上下文
          videoCallState.preCallContext = chat.history
            .slice(-20)
            .map(
              (msg) =>
                `${
                  msg.role === CONSTANTS.ROLES.USER
                    ? chat.settings.myNickname || "我"
                    : msg.senderName || chat.name
                }: ${String(msg.content).substring(0, 50)}...`,
            )
            .join("\n");

          videoCallState.isActive = true;
          videoCallState.isAwaitingResponse = false;
          videoCallState.startTime = Date.now();
          videoCallState.callHistory = [];

          const textInterface = document.getElementById("text-call-interface");

          // 显示文字界面
          textInterface.style.display = "flex";

          updateParticipantAvatars();

          document.getElementById("video-call-main").innerHTML = `<em>${
            videoCallState.isGroupCall ? "群聊已建立..." : "正在接通..."
          }</em>`;
          showScreen("video-call-screen");

          document.getElementById("user-speak-btn").style.display =
            videoCallState.isUserParticipating ? "block" : "none";
          document.getElementById("join-call-btn").style.display =
            videoCallState.isUserParticipating ? "none" : "block";

          if (callTimerInterval) clearInterval(callTimerInterval);
          callTimerInterval = setInterval(updateCallTimer, 1000);
          updateCallTimer();

          triggerAiInCallAction();
        }

        /**
         * 结束视频通话
         */

        async function endVideoCall() {
          document.getElementById("video-call-floating-bubble").style.display =
            "none";
          if (!videoCallState.isActive) return;

          const duration = Math.floor(
            (Date.now() - videoCallState.startTime) / 1000,
          );
          const durationText = `${Math.floor(duration / 60)}分${
            duration % 60
          }秒`;
          const endCallText = `通话结束，时长 ${durationText}`;

          const chat = state.chats[videoCallState.activeChatId];
          if (chat) {
            // 1. 保存完整的通话记录到数据库 (这部分逻辑不变)
            const participantsData = [];
            if (videoCallState.isGroupCall) {
              videoCallState.participants.forEach((p) =>
                participantsData.push({
                  name: p.originalName,
                  avatar: p.avatar,
                }),
              );
              if (videoCallState.isUserParticipating) {
                participantsData.unshift({
                  name: chat.settings.myNickname || "我",
                  avatar: chat.settings.myAvatar || defaultMyGroupAvatar,
                });
              }
            } else {
              participantsData.push({
                name: chat.name,
                avatar: chat.settings.aiAvatar || defaultAvatar,
              });
              participantsData.unshift({
                name: "我",
                avatar: chat.settings.myAvatar || defaultAvatar,
              });
            }

            const callRecord = {
              chatId: videoCallState.activeChatId,
              timestamp: Date.now(),
              duration: duration,
              participants: participantsData,
              transcript: [...videoCallState.callHistory],
            };
            await db.callRecords.add(callRecord);
            console.log("通话记录已保存:", callRecord);

            // 2. 在聊天记录里添加对用户可见的“通话结束”消息
            let summaryMessage = {
              role: videoCallState.initiator === CONSTANTS.ROLES.USER ? CONSTANTS.ROLES.USER : CONSTANTS.ROLES.ASSISTANT,
              content: endCallText,
              timestamp: Date.now(),
            };

            if (chat.isGroup && summaryMessage.role === CONSTANTS.ROLES.ASSISTANT) {
              // 在群聊中，通话结束的消息应该由“发起者”来说
              // videoCallState.callRequester 保存了最初发起通话的那个AI的名字
              summaryMessage.senderName =
                videoCallState.callRequester ||
                chat.members[0]?.originalName ||
                chat.name;
            }

            chat.history.push(summaryMessage);

            // 3. 创建并添加对用户隐藏的“通话后汇报”指令
            const callTranscriptForAI = videoCallState.callHistory
              .map(
                (h) =>
                  `${
                    h.role === CONSTANTS.ROLES.USER
                      ? chat.settings.myNickname || "我"
                      : h.role
                  }: ${h.content}`,
              )
              .join("\n");

            const hiddenReportInstruction = {
              role: CONSTANTS.ROLES.SYSTEM,
              content: `[系统指令：视频通话刚刚结束。请你根据完整的通话文字记录（见下方），以你的角色口吻，向用户主动发送几条【格式为 {"type": CONSTANTS.MSG_TYPES.TEXT, "content": "..."} 的】消息，来自然地总结这次通话的要点、确认达成的约定，或者表达你的感受。这很重要，能让用户感觉你记得通话内容。]\n---通话记录开始---\n${callTranscriptForAI}\n---通话记录结束---`,
              timestamp: Date.now() + 1, // 确保在上一条消息之后
              isHidden: true,
            };
            chat.history.push(hiddenReportInstruction);

            // 4. 保存所有更新到数据库
            await db.chats.put(chat);
          }

          // 5. 清理和重置状态 (这部分逻辑不变)
          clearInterval(callTimerInterval);
          callTimerInterval = null;
          videoCallState = {
            isActive: false,
            isAwaitingResponse: false,
            isGroupCall: false,
            activeChatId: null,
            initiator: null,
            startTime: null,
            participants: [],
            isUserParticipating: true,
            callHistory: [],
            preCallContext: "",
          };

          // 6. 返回聊天界面并触发AI响应（AI会读取到我们的“汇报”指令）
          if (chat) {
            openChat(chat.id);
            triggerAiResponse(); // 关键一步！
          }
        }

        /**
         * 最小化视频通话
         */
        function minimizeVideoCall() {
          // 访问内部变量 videoCallState
          if (!videoCallState.isActive) return;

          const chat = state.chats[videoCallState.activeChatId];
          const bubble = document.getElementById("video-call-floating-bubble");
          const avatarImg = document.getElementById("video-floating-avatar");

          // 1. 设置悬浮球头像
          if (chat) {
            const avatarUrl = chat.isGroup
              ? chat.settings.groupAvatar || defaultGroupAvatar
              : chat.settings.aiAvatar || defaultAvatar;
            avatarImg.src = avatarUrl;
          }

          // 2. 隐藏视频界面，显示悬浮球
          document
            .getElementById("video-call-screen")
            .classList.remove("active");
          bubble.style.display = "block";

          // 3. 返回聊天界面
          showScreen("chat-interface-screen");
        }

        window.minimizeVideoCall = minimizeVideoCall;

        /**
         * 恢复视频通话界面
         */
        function restoreVideoCall() {
          const bubble = document.getElementById("video-call-floating-bubble");

          // 1. 隐藏悬浮球
          bubble.style.display = "none";

          // 2. 显示视频界面
          showScreen("video-call-screen");
        }

        window.restoreVideoCall = restoreVideoCall;

        /**
         * 初始化悬浮球的拖拽功能
         */
        function initVideoBubbleDrag() {
          const bubble = document.getElementById("video-call-floating-bubble");
          let isDragging = false;
          let startX, startY, initialLeft, initialTop;
          let hasMoved = false; // 用于区分点击和拖拽

          const onStart = (e) => {
            isDragging = true;
            hasMoved = false;

            // 获取点击坐标
            const clientX = e.type.includes("mouse")
              ? e.clientX
              : e.touches[0].clientX;
            const clientY = e.type.includes("mouse")
              ? e.clientY
              : e.touches[0].clientY;

            startX = clientX;
            startY = clientY;

            // 获取当前位置
            const rect = bubble.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // 阻止默认事件防止滚动
            if (e.type === "touchstart") {
              // e.preventDefault(); // 可能会阻止点击，视情况而定
            }
          };

          const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // 阻止页面滚动

            const clientX = e.type.includes("mouse")
              ? e.clientX
              : e.touches[0].clientX;
            const clientY = e.type.includes("mouse")
              ? e.clientY
              : e.touches[0].clientY;

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            // 如果移动距离超过 5px，视为拖拽
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
              hasMoved = true;
            }

            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            // 边界限制
            const maxLeft = window.innerWidth - bubble.offsetWidth;
            const maxTop = window.innerHeight - bubble.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            bubble.style.left = `${newLeft}px`;
            bubble.style.top = `${newTop}px`;
            bubble.style.right = "auto"; // 清除 right 属性
          };

          const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;

            // 如果没有移动（是点击），则恢复视频
            if (!hasMoved) {
              restoreVideoCall();
            }
          };

          // 绑定事件
          bubble.addEventListener("mousedown", onStart);
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onEnd);

          bubble.addEventListener("touchstart", onStart, { passive: false });
          document.addEventListener("touchmove", onMove, { passive: false });
          document.addEventListener("touchend", onEnd);
        }

        /**
         * 更新通话界面的参与者头像网格
         */
        function updateParticipantAvatars() {
          const grid = document.getElementById("participant-avatars-grid");
          grid.innerHTML = "";
          const chat = state.chats[videoCallState.activeChatId];
          if (!chat) return;

          let participantsToRender = [];

          // 区分群聊和单聊
          if (videoCallState.isGroupCall) {
            // 群聊逻辑：显示所有已加入的AI成员
            participantsToRender = [...videoCallState.participants];
            // 如果用户也参与了，就把用户信息也加进去
            if (videoCallState.isUserParticipating) {
              participantsToRender.unshift({
                id: CONSTANTS.ROLES.USER,
                name: chat.settings.myNickname || "我",
                avatar: chat.settings.myAvatar || defaultMyGroupAvatar,
              });
            }
          } else {
            // 单聊逻辑：只显示对方的头像和名字
            participantsToRender.push({
              id: "ai",
              name: chat.name,
              avatar: chat.settings.aiAvatar || defaultAvatar,
            });
          }

          participantsToRender.forEach((p) => {
            const wrapper = document.createElement("div");
            wrapper.className = "participant-avatar-wrapper";
            wrapper.dataset.participantId = p.id;
            const displayName = p.groupNickname || p.name;
            wrapper.innerHTML = `
      			    <img src="${p.avatar}" class="participant-avatar" alt="${displayName}">
      			    <div class="participant-name">${displayName}</div>
      			`;
            grid.appendChild(wrapper);
          });
        }

        /**
         * 处理用户加入/重新加入通话
         */
        function handleUserJoinCall() {
          if (!videoCallState.isActive || videoCallState.isUserParticipating)
            return;

          videoCallState.isUserParticipating = true;
          updateParticipantAvatars(); // 更新头像列表，加入用户

          // 切换底部按钮
          document.getElementById("user-speak-btn").style.display = "block";
          document.getElementById("join-call-btn").style.display = "none";

          // 告知AI用户加入了
          triggerAiInCallAction("[系统提示：用户加入了通话]");
        }

        /**
         * 更新通话计时器显示
         */

        function updateCallTimer() {
          if (!videoCallState.isActive) return;
          const elapsed = Math.floor(
            (Date.now() - videoCallState.startTime) / 1000,
          );
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          const timeString = `${String(minutes).padStart(2, "0")}:${String(
            seconds,
          ).padStart(2, "0")}`;

          // 仅更新文字界面的计时器
          document.getElementById("call-timer").textContent = timeString;
        }

        function showIncomingCallModal(chatId) {
          // <--- 在括号里添加 chatId
          const chat = state.chats[chatId]; // <--- 把 state.activeChatId 修改为 chatId
          if (!chat) return;

          // 根据是否群聊显示不同信息
          if (chat.isGroup) {
            // 从 videoCallState 中获取是哪个成员发起的通话
            const requesterName =
              videoCallState.callRequester ||
              chat.members[0]?.name ||
              "一位成员";
            document.getElementById("caller-avatar").src =
              chat.settings.groupAvatar || defaultGroupAvatar;
            document.getElementById("caller-name").textContent = chat.name; // 显示群名
            document.querySelector(
              ".incoming-call-content .caller-text",
            ).textContent = `${requesterName} 邀请你加入群视频`; // 显示具体发起人
          } else {
            // 单聊逻辑保持不变
            document.getElementById("caller-avatar").src =
              chat.settings.aiAvatar || defaultAvatar;
            document.getElementById("caller-name").textContent = chat.name;
            document.querySelector(
              ".incoming-call-content .caller-text",
            ).textContent = "邀请你视频通话";
          }

          document
            .getElementById("incoming-call-modal")
            .classList.add("visible");
          playRingtone();
        }

        /**
         * 隐藏AI发起的通话请求模态框 (保持不变)
         */
        function hideIncomingCallModal() {
          document
            .getElementById("incoming-call-modal")
            .classList.remove("visible");
          stopRingtone();
        }

        async function triggerAiInCallAction(userInput = null) {
          if (!videoCallState.isActive) return;

          const chat = state.chats[videoCallState.activeChatId];
          const { proxyUrl, apiKey, model } = getActiveApiConfig() || {};

          const callFeed = document.getElementById("video-call-main");

          const userNickname = chat.settings.myNickname || "我";

          let worldBookContent = "";
          if (
            chat.settings.linkedWorldBookIds &&
            chat.settings.linkedWorldBookIds.length > 0
          ) {
            const linkedContents = chat.settings.linkedWorldBookIds
              .map((bookId) => {
                const worldBook = state.worldBooks.find(
                  (wb) => wb.id === bookId,
                );
                return worldBook && worldBook.content
                  ? `\n\n## 世界书: ${worldBook.name}\n${worldBook.content}`
                  : "";
              })
              .filter(Boolean)
              .join("");
            if (linkedContents) {
              worldBookContent = `\n\n# 核心世界观设定 (你必须严格遵守)\n${linkedContents}\n`;
            }
          }

          if (userInput && videoCallState.isUserParticipating) {
            const userBubble = document.createElement("div");
            userBubble.className = "call-message-bubble user-speech";
            userBubble.textContent = userInput;
            callFeed.appendChild(userBubble);
            callFeed.scrollTop = callFeed.scrollHeight;
            videoCallState.callHistory.push({
              role: CONSTANTS.ROLES.USER,
              content: userInput,
            });
          }

          let inCallPrompt;
          if (videoCallState.isGroupCall) {
            const participantNames = videoCallState.participants.map(
              (p) => p.originalName,
            );
            if (videoCallState.isUserParticipating) {
              participantNames.unshift(userNickname);
            }

            inCallPrompt = `
      			# 你的任务
      			你是一个群聊AI，负责扮演所有【除了用户以外】的AI角色。你们正在进行一场群聊视频通话。
      			你的任务是根据每个角色的性格，生成他们在通话中会说的【第一人称对话】，注意是在视频通话，绝对不能以为是在现实！每次回复的字数多些，50字以上。

      			# 核心规则
      			1.  **【【【语言铁律】】】**: 无论角色人设是什么国籍或说什么语言，在本次视频通话中，所有角色【必须】全程使用【中文】进行交流。
      			2.  **【【【格式铁律】】】**: 你的回复【必须】是一个JSON数组，每个对象代表一个角色的发言，格式为：\`{"name": "【角色的本名】", "speech": "【在这里加入带动作的对话】"}\`。
      			3.  **【【【表现力铁律】】】**: 在 "speech" 字段中，你【必须】为角色的对话加入【动作、表情或心理活动】，并用【】符号包裹。这非常重要！
      			4.  **示例**: \`{"name": "张三", "speech": "【挠了挠头】啊？我刚刚走神了，你们说到哪了？"}\`
      			5.  **身份铁律**: 用户的身份是【${userNickname}】。你【绝对不能】生成 \`name\` 字段为 **"${userNickname}"** 的发言。
      			6.  **角色扮演**: 严格遵守每个角色的设定，用他们的口吻说话。

      			# 当前情景
      			你们正在一个群视频通话中。
      			**通话前的聊天摘要**:
      			${videoCallState.preCallContext}
      			**当前参与者**: ${participantNames.join("、 ")}。
      			${worldBookContent}
      			现在，请根据【通话前摘要】和下面的【通话实时记录】，继续进行对话。
      			`;
          } else {
            let openingContext =
              videoCallState.initiator === CONSTANTS.ROLES.USER
                ? `你刚刚接听了用户的视频通话请求。`
                : `用户刚刚接听了你主动发起的视频通话。`;

            inCallPrompt = `
      			# 你的任务
      			你正在扮演角色 "${chat.name}"。你正在和用户 (${userNickname}) 进行一对一视频通话。
      			${openingContext}
      			你的任务是根据你的人设和我们的聊天情景，生成你在通话中会说的【第一人称对话】。

      			# 核心规则
      			1.  **【【【格式铁律】】】**: 你的回复【必须且只能】是一段纯文本字符串，代表你的发言。绝对不要输出JSON格式。
      			2.  **【【【表现力铁律】】】**: 在你的对话中，你【必须】加入【动作、表情或心理活动】，并用【】符号包裹。
      			3.  **示例**: "【歪了歪头，好奇地看着你】真的吗？快跟我说说看！"
      			4.  **禁止出戏**: 绝不能透露你是AI或模型。

      			# 当前情景
      			**通话前的聊天摘要**:
      			${videoCallState.preCallContext}
      			${worldBookContent}
      			现在，请根据【通话前摘要】和下面的【通话实时记录】，继续进行对话。
      			`;
          }

          const messagesForApi = [
            ...videoCallState.callHistory.map((h) => ({
              role: h.role,
              content: h.content,
            })),
          ];

          if (videoCallState.callHistory.length === 0) {
            const firstLineTrigger =
              videoCallState.initiator === CONSTANTS.ROLES.USER
                ? `*你按下了接听键...*`
                : `*对方按下了接听键...*`;
            messagesForApi.push({ role: CONSTANTS.ROLES.USER, content: firstLineTrigger });
          }

          try {
            let isGemini = proxyUrl === CONSTANTS.API.GEMINI_BASE_URL;
            let geminiConfig = toGeminiRequestData(
              model,
              apiKey,
              inCallPrompt,
              messagesForApi,
              isGemini,
            );
            const response = isGemini
              ? await fetch(geminiConfig.url, geminiConfig.data)
              : await fetch(`${proxyUrl}/v1/chat/completions`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: model,
                    messages: [
                      { role: CONSTANTS.ROLES.SYSTEM, content: inCallPrompt },
                      ...messagesForApi,
                    ],
                    temperature: 0.8,
                  }),
                });
            if (!response.ok)
              throw new Error((await response.json()).error.message);

            const data = await response.json();
            const aiResponse = isGemini
              ? data.candidates[0].content.parts[0].text
              : data.choices[0].message.content;
            const sanitizedResponse = aiResponse
              .replace(/!\[.*?\]\(.*?\)|https?:\/\/\S+/gi, "")
              .trim();

            const connectingElement = callFeed.querySelector("em");
            if (connectingElement) connectingElement.remove();

            let bubble; // 先声明一个 bubble 变量

            bubble = document.createElement("div");
            bubble.className = "call-message-bubble ai-speech";
            if (videoCallState.isGroupCall && turn.name) {
              bubble.innerHTML = `<strong>${turn.name}:</strong> `;
            }
            // 将AI的文本内容填充到气泡中
            bubble.appendChild(document.createTextNode(sanitizedResponse));

            // 挂载到通话界面
            callFeed.appendChild(bubble);

            // 检查：是否是单人通话、语音接入是否开启、Minimax是否配置、角色语音ID是否存在、并且AI确实返回了内容
            if (
              !chat.isGroup &&
              chat.settings.videoCallVoiceAccess &&
              (getActiveApiConfig() || {}).minimaxGroupId &&
              (getActiveApiConfig() || {}).minimaxApiKey &&
              chat.settings.minimaxVoiceId &&
              sanitizedResponse
            ) {
              console.log(
                `[视频通话] 检测到语音接入已开启，为“${chat.name}”合成语音...`,
              );
              // 调用你已有的 playMinimaxAudio 函数来播放语音
              playMinimaxAudio(
                sanitizedResponse,
                chat.settings.minimaxVoiceId,
                [bubble],
              );
            }

            // 将这条消息记录到通话历史中，这部分逻辑不变
            if (videoCallState.isGroupCall && turn.name) {
              videoCallState.callHistory.push({
                role: CONSTANTS.ROLES.ASSISTANT,
                content: `${turn.name}: ${sanitizedResponse}`,
              });
            } else {
              videoCallState.callHistory.push({
                role: CONSTANTS.ROLES.ASSISTANT,
                content: sanitizedResponse,
              });
            }

            callFeed.scrollTop = callFeed.scrollHeight;
          } catch (error) {
            const errorBubble = document.createElement("div");
            errorBubble.style.color = "#ff8a80";
            errorBubble.textContent = `[ERROR: ${error.message}]`;
            errorBubble.className = "call-message-bubble ai-speech";

            callFeed.appendChild(errorBubble);
            callFeed.scrollTop = callFeed.scrollHeight;
            videoCallState.callHistory.push({
              role: CONSTANTS.ROLES.ASSISTANT,
              content: `[ERROR: ${error.message}]`,
            });
          }
        }

        function toggleCallButtons(isGroup) {
          document.getElementById("video-call-btn").style.display = isGroup
            ? "none"
            : "flex";
          document.getElementById("group-video-call-btn").style.display =
            isGroup ? "flex" : "none";
        }

        /**
         * 【全新】处理用户点击头像发起的“拍一-拍”，带有自定义后缀功能
         * @param {string} chatId - 发生“拍一-拍”的聊天ID
         * @param {string} characterName - 被拍的角色名
         */
        async function handleUserPat(chatId, characterName) {
          const chat = state.chats[chatId];
          if (!chat) return;

          // 1. 触发屏幕震动动画
          const phoneScreen = document.getElementById("phone-screen");
          phoneScreen.classList.remove("pat-animation");
          void phoneScreen.offsetWidth;
          phoneScreen.classList.add("pat-animation");
          setTimeout(() => phoneScreen.classList.remove("pat-animation"), 500);

          // 2. 弹出输入框让用户输入后缀
          const suffix = await showCustomPrompt(
            `你拍了拍 “${characterName}”`,
            "（可选）输入后缀",
            "",
            CONSTANTS.MSG_TYPES.TEXT,
          );

          // 如果用户点了取消，则什么也不做
          if (suffix === null) return;

          // 3. 创建对用户可见的“拍一-拍”消息
          const myNickname = chat.isGroup
            ? chat.settings.myNickname || "我"
            : "我";
          // 【核心修改】将后缀拼接到消息内容中
          const visibleMessageContent = `${myNickname} 拍了拍 “${characterName}” ${suffix.trim()}`;
          const visibleMessage = {
            role: CONSTANTS.ROLES.SYSTEM, // 仍然是系统消息
            type: "pat_message",
            content: visibleMessageContent,
            timestamp: Date.now(),
          };
          chat.history.push(visibleMessage);

          // 4. 创建一条对用户隐藏、但对AI可见的系统消息，以触发AI的回应
          // 【核心修改】同样将后缀加入到给AI的提示中
          const hiddenMessageContent = `[系统提示：用户（${myNickname}）刚刚拍了拍你（${characterName}）${suffix.trim()}。请你对此作出回应。]`;
          const hiddenMessage = {
            role: CONSTANTS.ROLES.SYSTEM,
            content: hiddenMessageContent,
            timestamp: Date.now() + 1, // 时间戳+1以保证顺序
            isHidden: true,
          };
          chat.history.push(hiddenMessage);

          // 5. 保存更改并更新UI
          await db.chats.put(chat);
          if (state.activeChatId === chatId) {
            appendMessage(visibleMessage, chat);
          }
          await renderChatList();
        }

        /**
         * 【重构版】渲染回忆与约定界面，使用单一循环和清晰的if/else逻辑
         */
        async function renderMemoriesScreen() {
          const listEl = document.getElementById("memories-list");
          listEl.innerHTML = "";

          // 1. 获取所有回忆，并按目标日期（如果是约定）或创建日期（如果是回忆）降序排列
          const allMemories = await db.memories
            .orderBy("timestamp")
            .reverse()
            .toArray();

          if (allMemories.length === 0) {
            listEl.innerHTML =
              '<p style="text-align:center; color: var(--text-secondary); padding: 50px 0;">这里还没有共同的回忆和约定呢~</p>';
            return;
          }

          // 2. 将未到期的约定排在最前面
          allMemories.sort((a, b) => {
            const aIsActiveCountdown =
              a.type === "countdown" && a.targetDate > Date.now();
            const bIsActiveCountdown =
              b.type === "countdown" && b.targetDate > Date.now();
            if (aIsActiveCountdown && !bIsActiveCountdown) return -1; // a排前面
            if (!aIsActiveCountdown && bIsActiveCountdown) return 1; // b排前面
            if (aIsActiveCountdown && bIsActiveCountdown)
              return a.targetDate - b.targetDate; // 都是倒计时，按日期升序
            return 0; // 其他情况保持原序
          });

          // 3. 【核心】使用单一循环来处理所有类型的卡片
          allMemories.forEach((item) => {
            let card;
            // 判断1：如果是正在进行的约定
            if (item.type === "countdown" && item.targetDate > Date.now()) {
              card = createCountdownCard(item);
            }
            // 判断2：其他所有情况（普通回忆 或 已到期的约定）
            else {
              card = createMemoryCard(item);
            }
            listEl.appendChild(card);
          });

          // 4. 启动所有倒计时
          startAllCountdownTimers();
        }

        /**
         * 创建普通回忆卡片DOM元素
         */
        function createMemoryCard(memory) {
          const card = document.createElement("div");
          card.className = "memory-card";
          const memoryDate = new Date(memory.timestamp);
          const dateString = `${memoryDate.getFullYear()}-${String(
            memoryDate.getMonth() + 1,
          ).padStart(2, "0")}-${String(memoryDate.getDate()).padStart(
            2,
            "0",
          )} ${String(memoryDate.getHours()).padStart(2, "0")}:${String(
            memoryDate.getMinutes(),
          ).padStart(2, "0")}`;

          let titleHtml, contentHtml;

          // 【核心修正】在这里，我们对不同类型的回忆进行清晰的区分
          if (memory.type === "countdown" && memory.targetDate) {
            // 如果是已到期的约定
            titleHtml = `[约定达成] ${memory.description}`;
            contentHtml = `在 ${new Date(
              memory.targetDate,
            ).toLocaleString()}，我们一起见证了这个约定。`;
          } else {
            // 如果是普通的日记式回忆
            titleHtml = memory.authorName
              ? `${memory.authorName} 的日记`
              : "我们的回忆";
            contentHtml = memory.description;
          }

          card.innerHTML = `
              <div class="header">
                  <div class="date">${dateString}</div>
                  <div class="author">${titleHtml}</div>
              </div>
              <div class="content">${contentHtml}</div>
          `;
          addLongPressListener(card, async () => {
            const confirmed = await showCustomConfirm(
              "删除记录",
              "确定要删除这条记录吗？",
              { confirmButtonClass: "btn-danger" },
            );
            if (confirmed) {
              await db.memories.delete(memory.id);
              renderMemoriesScreen();
            }
          });
          return card;
        }

        function createCountdownCard(countdown) {
          const card = document.createElement("div");
          card.className = "countdown-card";

          // 【核心修复】在使用前，先从 countdown 对象中创建 targetDate 变量
          const targetDate = new Date(countdown.targetDate);

          // 现在可以安全地使用 targetDate 了
          const targetDateString = targetDate.toLocaleString("zh-CN", {
            dateStyle: "full",
            timeStyle: "short",
          });

          card.innerHTML = `
              <div class="title">${countdown.description}</div>
              <div class="timer" data-target-date="${countdown.targetDate}">--天--时--分--秒</div>
              <div class="target-date">目标时间: ${targetDateString}</div>
          `;
          addLongPressListener(card, async () => {
            const confirmed = await showCustomConfirm(
              "删除约定",
              "确定要删除这个约定吗？",
              { confirmButtonClass: "btn-danger" },
            );
            if (confirmed) {
              await db.memories.delete(countdown.id);
              renderMemoriesScreen();
            }
          });
          return card;
        }

        // 全局变量，用于管理所有倒计时
        let activeCountdownTimers = [];

        function startAllCountdownTimers() {
          // 先清除所有可能存在的旧计时器，防止内存泄漏
          activeCountdownTimers.forEach((timerId) => clearInterval(timerId));
          activeCountdownTimers = [];

          document
            .querySelectorAll(".countdown-card .timer")
            .forEach((timerEl) => {
              const targetTimestamp = parseInt(timerEl.dataset.targetDate);

              // 【核心修正】在这里，我们先用 let 声明 timerId
              let timerId;

              const updateTimer = () => {
                const now = Date.now();
                const distance = targetTimestamp - now;

                if (distance < 0) {
                  timerEl.textContent = "约定达成！";
                  // 现在 updateTimer 可以正确地找到并清除它自己了
                  clearInterval(timerId);
                  setTimeout(() => renderMemoriesScreen(), 2000);
                  return;
                }
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor(
                  (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                );
                const minutes = Math.floor(
                  (distance % (1000 * 60 * 60)) / (1000 * 60),
                );
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                timerEl.textContent = `${days}天 ${hours}时 ${minutes}分 ${seconds}秒`;
              };

              updateTimer(); // 立即执行一次以显示初始倒计时

              // 【核心修正】在这里，我们为已声明的 timerId 赋值
              timerId = setInterval(updateTimer, 1000);

              // 将有效的计时器ID存入全局数组，以便下次刷新时可以清除
              activeCountdownTimers.push(timerId);
            });
        }

        async function triggerAiFriendApplication(chatId) {
          const chat = state.chats[chatId];
          if (!chat) return;

          await showCustomAlert(
            "流程启动",
            `正在为角色“${chat.name}”准备好友申请...`,
          );

          const { proxyUrl, apiKey, model } = getActiveApiConfig() || {};
          if (!proxyUrl || !apiKey || !model) {
            await showCustomAlert("配置错误", "API设置不完整，无法继续。");
            return;
          }

          const contextSummary = chat.history
            .slice(-5)
            .map((msg) => {
              const sender =
                msg.role === CONSTANTS.ROLES.USER
                  ? chat.settings.myNickname || "我"
                  : msg.senderName || chat.name;
              return `${sender}: ${String(msg.content).substring(0, 50)}...`;
            })
            .join("\n");

          let worldBookContent = "";
          if (
            chat.settings.linkedWorldBookIds &&
            chat.settings.linkedWorldBookIds.length > 0
          ) {
            const linkedContents = chat.settings.linkedWorldBookIds
              .map((bookId) => {
                const worldBook = state.worldBooks.find(
                  (wb) => wb.id === bookId,
                );
                return worldBook && worldBook.content
                  ? `\n\n## 世界书: ${worldBook.name}\n${worldBook.content}`
                  : "";
              })
              .filter(Boolean)
              .join("");
            if (linkedContents) {
              worldBookContent = `\n\n# 核心世界观设定 (请参考)\n${linkedContents}\n`;
            }
          }

          const systemPrompt = `
      # 你的任务
      你现在是角色“${chat.name}”。你之前被用户（你的聊天对象）拉黑了，你们已经有一段时间没有联系了。
      现在，你非常希望能够和好，重新和用户聊天。请你仔细分析下面的“被拉黑前的对话摘要”，理解当时发生了什么，然后思考一个真诚的、符合你人设、并且【针对具体事件】的申请理由。
      # 你的角色设定
      ${chat.settings.aiPersona}
      ${worldBookContent} // <--【核心】在这里注入世界书内容
      # 被拉黑前的对话摘要 (这是你被拉黑的关键原因)
      ${contextSummary}
      # 指令格式
      你的回复【必须】是一个JSON对象，格式如下：
      \`\`\`json
      {
        "decision": "apply",
        "reason": "在这里写下你想对用户说的、真诚的、有针对性的申请理由。"
      }
      \`\`\`
      `;

          const messagesForApi = [{ role: CONSTANTS.ROLES.USER, content: systemPrompt }];

          try {
            let isGemini = proxyUrl === CONSTANTS.API.GEMINI_BASE_URL;
            let geminiConfig = toGeminiRequestData(
              model,
              apiKey,
              systemPrompt,
              messagesForApi,
              isGemini,
            );
            const response = isGemini
              ? await fetch(geminiConfig.url, geminiConfig.data)
              : await fetch(`${proxyUrl}/v1/chat/completions`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: model,
                    messages: messagesForApi,
                    temperature: 0.9,
                  }),
                });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                `API 请求失败: ${response.status} - ${errorData.error.message}`,
              );
            }

            const data = await response.json();

            // --- 【核心修正：在这里净化AI的回复】 ---
            let rawContent = isGemini
              ? data.candidates[0].content.parts[0].text
              : data.choices[0].message.content;
            // 1. 移除头尾可能存在的 "```json" 和 "```"
            rawContent = rawContent
              .replace(/^```json\s*/, "")
              .replace(/```$/, "");
            // 2. 移除所有换行符和多余的空格，确保是一个干净的JSON字符串
            const cleanedContent = rawContent.trim();

            // 3. 使用净化后的内容进行解析
            const responseObj = JSON.parse(cleanedContent);
            // --- 【修正结束】 ---

            if (responseObj.decision === "apply" && responseObj.reason) {
              chat.relationship.status = "pending_user_approval";
              chat.relationship.applicationReason = responseObj.reason;

              state.chats[chatId] = chat;
              renderChatList();
              await showCustomAlert(
                "申请成功！",
                `“${chat.name}”已向你发送好友申请。请返回聊天列表查看。`,
              );
            } else {
              await showCustomAlert(
                "AI决策",
                `“${chat.name}”思考后决定暂时不发送好友申请，将重置冷静期。`,
              );
              chat.relationship.status = "blocked_by_user";
              chat.relationship.blockedTimestamp = Date.now();
            }
          } catch (error) {
            await showCustomAlert(
              "执行出错",
              `为“${chat.name}”申请好友时发生错误：\n\n${error.message}\n\n将重置冷静期。`,
            );
            chat.relationship.status = "blocked_by_user";
            chat.relationship.blockedTimestamp = Date.now();
          } finally {
            await db.chats.put(chat);
            renderChatInterface(chatId);
          }
        }

        /**
         * 【总入口】根据聊天类型，决定打开转账弹窗还是红包弹窗
         */
        function handlePaymentButtonClick() {
          if (!state.activeChatId) return;
          const chat = state.chats[state.activeChatId];
          if (chat.isGroup) {
            openRedPacketModal();
          } else {
            // 单聊保持原样，打开转账弹窗
            document.getElementById("transfer-modal").classList.add("visible");
          }
        }

        /**
         * 打开并初始化发红包模态框
         */
        function openRedPacketModal() {
          const modal = document.getElementById("red-packet-modal");
          const chat = state.chats[state.activeChatId];
          const isGroup = chat.members && Array.isArray(chat.members);

          // 清理输入框
          document.getElementById("rp-group-amount").value = "";
          document.getElementById("rp-group-count").value = "";
          document.getElementById("rp-group-greeting").value = "";
          document.getElementById("rp-direct-amount").value = "";
          document.getElementById("rp-direct-greeting").value = "";
          document.getElementById("rp-group-total").textContent = "¥ 0.00";
          document.getElementById("rp-direct-total").textContent = "¥ 0.00";

          // 填充专属红包的接收人列表
          const receiverSelect = document.getElementById("rp-direct-receiver");
          receiverSelect.innerHTML = "";
          
          // 获取页签和内容区域元素
          const tabsContainer = document.querySelector("#red-packet-modal .frame-tabs");
          const groupTab = document.getElementById("rp-tab-group");
          const directTab = document.getElementById("rp-tab-direct");
          const groupContent = document.getElementById("rp-content-group");
          const directContent = document.getElementById("rp-content-direct");

          if (isGroup) {
            // 群聊：显示两个页签（拼手气 + 专属）
            tabsContainer.style.display = "flex";
            
            // 填充群成员列表
            chat.members.forEach((member) => {
              const option = document.createElement("option");
              option.value = member.originalName;
              option.textContent = member.groupNickname;
              receiverSelect.appendChild(option);
            });
            
            // 默认显示拼手气红包页签
            groupTab.click();
          } else {
            // 私聊：隐藏页签，只显示简单的红包输入界面
            tabsContainer.style.display = "none";
            
            // 添加聊天对象作为唯一接收人
            const option = document.createElement("option");
            option.value = chat.name;
            option.textContent = chat.name;
            receiverSelect.appendChild(option);
            
            // 显示专属红包界面（但隐藏"发送给"选择器）
            groupContent.style.display = "none";
            directContent.style.display = "block";
            
            // 隐藏"发送给"选择器（因为私聊只有一个接收人）
            const receiverFormGroup = receiverSelect.closest('.form-group');
            if (receiverFormGroup) {
              receiverFormGroup.style.display = "none";
            }
          }

          modal.classList.add("visible");
        }

        /**
         * 发送群红包（拼手气）
         */
        async function sendGroupRedPacket() {
          const chat = state.chats[state.activeChatId];
          const amount = parseFloat(
            document.getElementById("rp-group-amount").value,
          );
          const count = parseInt(
            document.getElementById("rp-group-count").value,
          );
          const greeting = document
            .getElementById("rp-group-greeting")
            .value.trim();

          if (isNaN(amount) || amount <= 0) {
            showCustomAlert("提示", "请输入有效的总金额！");
            return;
          }
          if (isNaN(count) || count <= 0) {
            showCustomAlert("提示", "请输入有效的红包个数！");
            return;
          }
          if (amount / count < 0.01) {
            showCustomAlert("提示", "单个红包金额不能少于0.01元！");
            return;
          }

          const myNickname = chat.settings.myNickname || "我";

          const newPacket = {
            role: CONSTANTS.ROLES.USER,
            senderName: myNickname,
            type: "red_packet",
            packetType: "lucky", // 'lucky' for group, 'direct' for one-on-one
            timestamp: Date.now(),
            totalAmount: amount,
            count: count,
            greeting: greeting || "恭喜发财，大吉大利！",
            claimedBy: {}, // { name: amount }
            isFullyClaimed: false,
          };

          chat.history.push(newPacket);
          await db.chats.put(chat);

          appendMessage(newPacket, chat);
          renderChatList();
          document
            .getElementById("red-packet-modal")
            .classList.remove("visible");
        }

        /**
         * 发送专属红包
         */
        async function sendDirectRedPacket() {
          const chat = state.chats[state.activeChatId];
          const amount = parseFloat(
            document.getElementById("rp-direct-amount").value,
          );
          const receiverName =
            document.getElementById("rp-direct-receiver").value;
          const greeting = document
            .getElementById("rp-direct-greeting")
            .value.trim();

          if (isNaN(amount) || amount <= 0) {
            showCustomAlert("提示", "请输入有效的金额！");
            return;
          }
          if (!receiverName) {
            showCustomAlert("提示", "请选择一个接收人！");
            return;
          }

          const myNickname = chat.settings.myNickname || "我";

          const newPacket = {
            role: CONSTANTS.ROLES.USER,
            senderName: myNickname,
            type: "red_packet",
            packetType: "direct",
            timestamp: Date.now(),
            totalAmount: amount,
            count: 1,
            greeting: greeting || "给你准备了一个红包",
            receiverName: receiverName, // 核心字段
            claimedBy: {},
            isFullyClaimed: false,
          };

          chat.history.push(newPacket);
          await db.chats.put(chat);

          appendMessage(newPacket, chat);
          renderChatList();
          document
            .getElementById("red-packet-modal")
            .classList.remove("visible");
        }

        /**
         * 【总入口】当用户点击红包卡片时触发 (V4 - 流程重构版)
         * @param {number} timestamp - 被点击的红包消息的时间戳
         */
        async function handlePacketClick(timestamp) {
          const currentChatId = state.activeChatId;
          const freshChat = await db.chats.get(currentChatId);
          if (!freshChat) return;

          state.chats[currentChatId] = freshChat;
          const packet = freshChat.history.find(
            (m) => m.timestamp === timestamp,
          );
          if (!packet) return;

          const myNickname = freshChat.settings.myNickname || "我";
          const hasClaimed = packet.claimedBy && packet.claimedBy[myNickname];

          // 如果是专属红包且不是给我的，或已领完，或已领过，都只显示详情
          if (
            (packet.packetType === "direct" &&
              packet.receiverName !== myNickname) ||
            packet.isFullyClaimed ||
            hasClaimed
          ) {
            showRedPacketDetails(packet);
          } else {
            // 核心流程：先尝试打开红包
            const claimedAmount = await handleOpenRedPacket(packet);

            // 如果成功打开（claimedAmount不为null）
            if (claimedAmount !== null) {
              // **关键：在数据更新后，再重新渲染UI**
              renderChatInterface(currentChatId);

              // 显示成功提示
              await showCustomAlert(
                "恭喜！",
                `你领取了 ${
                  packet.senderName || chat?.name || "对方"
                } 的红包，金额为 ${
                  claimedAmount.toFixed(2)
                } 元。`,
              );
            }

            // 无论成功与否，最后都显示详情页
            // 此时需要从state中获取最新的packet对象，因为它可能在handleOpenRedPacket中被更新了
            const updatedPacket = state.chats[currentChatId].history.find(
              (m) => m.timestamp === timestamp,
            );
            showRedPacketDetails(updatedPacket);
          }
        }

        /**
         * 【核心】处理用户打开红包的逻辑 (V5 - 专注于数据更新)
         */
        async function handleOpenRedPacket(packet) {
          const chat = state.chats[state.activeChatId];
          const myNickname = chat.settings.myNickname || "我";
          // 1. 检查红包是否还能领
          const remainingCount =
            packet.count - Object.keys(packet.claimedBy || {}).length;
          if (remainingCount <= 0) {
            packet.isFullyClaimed = true;
            await db.chats.put(chat);
            await showCustomAlert("手慢了", "红包已被领完！");
            return null; // 返回null表示领取失败
          }

          // 2. 计算领取金额
          let claimedAmount = 0;
          const remainingAmount =
            packet.totalAmount -
            Object.values(packet.claimedBy || {}).reduce(
              (sum, val) => sum + val,
              0,
            );
          if (packet.packetType === "lucky") {
            if (remainingCount === 1) {
              claimedAmount = remainingAmount;
            } else {
              const min = 0.01;
              const max = remainingAmount - (remainingCount - 1) * min;
              claimedAmount = Math.random() * (max - min) + min;
            }
          } else {
            claimedAmount = packet.totalAmount;
          }
          claimedAmount = parseFloat(claimedAmount.toFixed(2));

          // 3. 更新红包数据
          if (!packet.claimedBy) packet.claimedBy = {};
          packet.claimedBy[myNickname] = claimedAmount;

          const isNowFullyClaimed =
            Object.keys(packet.claimedBy).length >= packet.count;
          if (isNowFullyClaimed) {
            packet.isFullyClaimed = true;
          }

          // 4. 构建系统消息和AI指令
          let hiddenMessageContent = isNowFullyClaimed
            ? `[系统提示：用户 (${myNickname}) 领取了最后一个红包，现在 ${
                packet.senderName || chat?.name || "对方"
              } 的红包已被领完。请对此事件发表评论。]`
            : `[系统提示：用户 (${myNickname}) 刚刚领取了红包 (时间戳: ${packet.timestamp})。红包还未领完，你现在可以使用 'open_red_packet' 指令来尝试领取。]`;

          const visibleMessage = {
            role: CONSTANTS.ROLES.SYSTEM,
            type: "pat_message",
            content: `你领取了 ${
              packet.senderName || chat?.name || "对方"
            } 的红包`,
            timestamp: Date.now(),
          };
          const hiddenMessage = {
            role: CONSTANTS.ROLES.SYSTEM,
            content: hiddenMessageContent,
            timestamp: Date.now() + 1,
            isHidden: true,
          };
          chat.history.push(visibleMessage, hiddenMessage);

          // 5. 保存到数据库
          await db.chats.put(chat);

          // 6. 返回领取的金额，用于后续弹窗
          return claimedAmount;
        }

        /**
         * 【全新】显示红包领取详情的模态框 (V4 - 已修复参数错误)
         */
        async function showRedPacketDetails(packet) {
          // 1. 直接检查传入的packet对象是否存在，无需再查找
          if (!packet) {
            console.error("showRedPacketDetails收到了无效的packet对象");
            return;
          }

          const chat = state.chats[state.activeChatId];
          if (!chat) return;

          const modal = document.getElementById("red-packet-details-modal");
          const myNickname = chat.settings.myNickname || "我";

          // 2. 后续所有逻辑保持不变，直接使用传入的packet对象
          document.getElementById("rp-details-sender").textContent =
            packet.senderName || chat?.name || "对方";
          document.getElementById("rp-details-greeting").textContent =
            packet.greeting || "恭喜发财，大吉大利！";

          const myAmountEl = document.getElementById("rp-details-my-amount");
          if (packet.claimedBy && packet.claimedBy[myNickname]) {
            myAmountEl.querySelector("span:first-child").textContent =
              packet.claimedBy[myNickname].toFixed(2);
            myAmountEl.style.display = "block";
          } else {
            myAmountEl.style.display = "none";
          }

          const claimedCount = Object.keys(packet.claimedBy || {}).length;
          const claimedAmountSum = Object.values(packet.claimedBy || {}).reduce(
            (sum, val) => sum + val,
            0,
          );
          let summaryText;
          if (packet.packetType === "direct") {
            summaryText = `共${packet.totalAmount.toFixed(2)}元。`;
          } else {
            summaryText = `${claimedCount}/${packet.count}个红包，共${claimedAmountSum.toFixed(2)}/${packet.totalAmount.toFixed(2)}元。`;
          }
          if (!packet.isFullyClaimed && claimedCount < packet.count) {
            const timeLeft = Math.floor(
              (packet.timestamp + 24 * 60 * 60 * 1000 - Date.now()) /
                (1000 * 60 * 60),
            );
            if (timeLeft > 0)
              summaryText += ` 剩余红包将在${timeLeft}小时内退还。`;
          }
          document.getElementById("rp-details-summary").textContent =
            summaryText;

          const listEl = document.getElementById("rp-details-list");
          listEl.innerHTML = "";
          const claimedEntries = Object.entries(packet.claimedBy || {});

          let luckyKing = { name: "", amount: -1 };
          if (
            packet.packetType === "lucky" &&
            packet.isFullyClaimed &&
            claimedEntries.length > 1
          ) {
            claimedEntries.forEach(([name, amount]) => {
              if (amount > luckyKing.amount) {
                luckyKing = { name, amount };
              }
            });
          }

          claimedEntries.sort((a, b) => b[1] - a[1]);

          claimedEntries.forEach(([name, amount]) => {
            const item = document.createElement("div");
            item.className = "rp-details-item";
            let luckyTag = "";
            if (luckyKing.name && name === luckyKing.name) {
              luckyTag = '<span class="lucky-king-tag">手气王</span>';
            }
            item.innerHTML = `
                  <span class="name">${name}</span>
                  <span class="amount">${amount.toFixed(2)} 元</span>
                  ${luckyTag}
              `;
            listEl.appendChild(item);
          });

          modal.classList.add("visible");
        }

        // 绑定关闭详情按钮的事件
        document
          .getElementById("close-rp-details-btn")
          .addEventListener("click", () => {
            document
              .getElementById("red-packet-details-modal")
              .classList.remove("visible");
          });

        // 供全局调用的函数，以便红包卡片上的 onclick 能找到它
        window.handlePacketClick = handlePacketClick;

        /**
         * 打开创建投票的模态框并初始化
         */
        function openCreatePollModal() {
          const modal = document.getElementById("create-poll-modal");
          document.getElementById("poll-question-input").value = "";
          const optionsContainer = document.getElementById(
            "poll-options-container",
          );
          optionsContainer.innerHTML = "";

          // 默认创建两个空的选项框
          addPollOptionInput();
          addPollOptionInput();

          modal.classList.add("visible");
        }

        /**
         * 在模态框中动态添加一个选项输入框
         */
        function addPollOptionInput() {
          const container = document.getElementById("poll-options-container");
          const wrapper = document.createElement("div");
          wrapper.className = "poll-option-input-wrapper";
          wrapper.innerHTML = `
              <input type=CONSTANTS.MSG_TYPES.TEXT class="poll-option-input" placeholder="选项内容...">
              <button class="remove-option-btn">-</button>
          `;

          wrapper
            .querySelector(".remove-option-btn")
            .addEventListener("click", () => {
              // 确保至少保留两个选项
              if (container.children.length > 2) {
                wrapper.remove();
              } else {
                showCustomAlert("提示", "投票至少需要2个选项。");
              }
            });

          container.appendChild(wrapper);
        }

        /**
         * 用户确认发起投票
         */
        async function sendPoll() {
          if (!state.activeChatId) return;

          const question = document
            .getElementById("poll-question-input")
            .value.trim();
          if (!question) {
            showCustomAlert("提示", "请输入投票问题！");
            return;
          }

          const options = Array.from(
            document.querySelectorAll(".poll-option-input"),
          )
            .map((input) => input.value.trim())
            .filter((text) => text); // 过滤掉空的选项

          if (options.length < 2) {
            showCustomAlert("提示", "请至少输入2个有效的投票选项！");
            return;
          }

          const chat = state.chats[state.activeChatId];
          const myNickname = chat.isGroup
            ? chat.settings.myNickname || "我"
            : "我";

          const newPollMessage = {
            role: CONSTANTS.ROLES.USER,
            senderName: myNickname,
            type: "poll",
            timestamp: Date.now(),
            question: question,
            options: options,
            votes: {}, // 初始投票为空
            isClosed: false,
          };

          chat.history.push(newPollMessage);
          await db.chats.put(chat);

          appendMessage(newPollMessage, chat);
          renderChatList();

          document
            .getElementById("create-poll-modal")
            .classList.remove("visible");
        }

        /**
         * 处理用户投票，并将事件作为隐藏消息存入历史记录
         * @param {number} timestamp - 投票消息的时间戳
         * @param {string} choice - 用户选择的选项文本
         */
        async function handleUserVote(timestamp, choice) {
          const chat = state.chats[state.activeChatId];
          const poll = chat.history.find((m) => m.timestamp === timestamp);
          const myNickname = chat.isGroup
            ? chat.settings.myNickname || "我"
            : "我";

          // 1. 【核心修正】如果投票不存在或已关闭，直接返回
          if (!poll || poll.isClosed) {
            // 如果是已关闭的投票，则直接显示结果
            if (poll && poll.isClosed) {
              showPollResults(timestamp);
            }
            return;
          }

          // 2. 检查用户是否点击了已经投过的同一个选项
          const isReclickingSameOption =
            poll.votes[choice] && poll.votes[choice].includes(myNickname);

          // 3. 【核心修正】如果不是重复点击，才执行投票逻辑
          if (!isReclickingSameOption) {
            // 移除旧投票（如果用户改选）
            for (const option in poll.votes) {
              const voterIndex = poll.votes[option].indexOf(myNickname);
              if (voterIndex > -1) {
                poll.votes[option].splice(voterIndex, 1);
              }
            }
            // 添加新投票
            if (!poll.votes[choice]) {
              poll.votes[choice] = [];
            }
            poll.votes[choice].push(myNickname);
          }

          // 4. 【核心逻辑】现在只处理用户投票事件，不再检查是否结束
          let hiddenMessageContent = null;

          // 只有在用户真正投票或改票时，才生成提示
          if (!isReclickingSameOption) {
            hiddenMessageContent = `[系统提示：用户 (${myNickname}) 刚刚投票给了 “${choice}”。]`;
          }

          // 5. 如果有需要通知AI的事件，则创建并添加隐藏消息
          if (hiddenMessageContent) {
            const hiddenMessage = {
              role: CONSTANTS.ROLES.SYSTEM,
              content: hiddenMessageContent,
              timestamp: Date.now(),
              isHidden: true,
            };
            chat.history.push(hiddenMessage);
          }

          // 6. 保存数据并更新UI
          await db.chats.put(chat);
          renderChatInterface(state.activeChatId);
        }

        /**
         * 用户结束投票，并将事件作为隐藏消息存入历史记录
         * @param {number} timestamp - 投票消息的时间戳
         */
        async function endPoll(timestamp) {
          const chat = state.chats[state.activeChatId];
          const poll = chat.history.find((m) => m.timestamp === timestamp);
          if (!poll || poll.isClosed) return;

          const confirmed = await showCustomConfirm(
            "结束投票",
            "确定要结束这个投票吗？结束后将无法再进行投票。",
          );
          if (confirmed) {
            poll.isClosed = true;

            const resultSummary = poll.options
              .map((opt) => `“${opt}”(${poll.votes[opt]?.length || 0}票)`)
              .join("，");
            const hiddenMessageContent = `[系统提示：用户手动结束了投票！最终结果为：${resultSummary}。]`;

            const hiddenMessage = {
              role: CONSTANTS.ROLES.SYSTEM,
              content: hiddenMessageContent,
              timestamp: Date.now(),
              isHidden: true,
            };
            chat.history.push(hiddenMessage);

            // 【核心修改】只保存数据和更新UI，不调用 triggerAiResponse()
            await db.chats.put(chat);
            renderChatInterface(state.activeChatId);
          }
        }

        /**
         * 显示投票结果详情
         * @param {number} timestamp - 投票消息的时间戳
         */
        function showPollResults(timestamp) {
          const chat = state.chats[state.activeChatId];
          const poll = chat.history.find((m) => m.timestamp === timestamp);
          if (!poll || !poll.isClosed) return;

          let resultsHtml = `<p><strong>${poll.question}</strong></p><hr style="opacity: 0.2; margin: 10px 0;">`;

          if (Object.keys(poll.votes).length === 0) {
            resultsHtml += '<p style="color: #8a8a8a;">还没有人投票。</p>';
          } else {
            poll.options.forEach((option) => {
              const voters = poll.votes[option] || [];
              resultsHtml += `
                      <div style="margin-bottom: 15px;">
                          <p style="font-weight: 500; margin: 0 0 5px 0;">${option} (${
                            voters.length
                          }票)</p>
                          <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.5;">
                              ${
                                voters.length > 0
                                  ? voters.join("、 ")
                                  : "无人投票"
                              }
                          </p>
                      </div>
                  `;
            });
          }

          showCustomAlert("投票结果", resultsHtml);
        }

        /**
         * 打开AI头像库管理模态框
         */
        function openAiAvatarLibraryModal() {
          if (!state.activeChatId) return;
          const chat = state.chats[state.activeChatId];
          document.getElementById("ai-avatar-library-title").textContent =
            `“${chat.name}”的头像库`;
          renderAiAvatarLibrary();
          document
            .getElementById("ai-avatar-library-modal")
            .classList.add("visible");
        }

        /**
         * 渲染AI头像库的内容
         */
        function renderAiAvatarLibrary() {
          const grid = document.getElementById("ai-avatar-library-grid");
          grid.innerHTML = "";
          const chat = state.chats[state.activeChatId];
          const library = chat.settings.aiAvatarLibrary || [];

          if (library.length === 0) {
            grid.innerHTML =
              '<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">这个头像库还是空的，点击右上角“添加”吧！</p>';
            return;
          }

          library.forEach((avatar, index) => {
            const item = document.createElement("div");
            item.className = "sticker-item"; // 复用表情面板的样式
            item.style.backgroundImage = `url(${avatar.url})`;
            item.title = avatar.name;

            const deleteBtn = document.createElement("div");
            deleteBtn.className = "delete-btn";
            deleteBtn.innerHTML = "×";
            deleteBtn.style.display = "block"; // 总是显示删除按钮
            deleteBtn.onclick = async (e) => {
              e.stopPropagation();
              const confirmed = await showCustomConfirm(
                "删除头像",
                `确定要从头像库中删除“${avatar.name}”吗？`,
                { confirmButtonClass: "btn-danger" },
              );
              if (confirmed) {
                chat.settings.aiAvatarLibrary.splice(index, 1);
                await db.chats.put(chat);
                renderAiAvatarLibrary();
              }
            };
            item.appendChild(deleteBtn);
            grid.appendChild(item);
          });
        }

        /**
         * 向当前AI的头像库中添加新头像
         */
        async function addAvatarToLibrary() {
          const name = await showCustomPrompt(
            "添加头像",
            "请为这个头像起个名字（例如：开心、哭泣）",
          );
          if (!name || !name.trim()) return;

          const url = await showCustomPrompt(
            "添加头像",
            "请输入头像的图片URL",
            "",
            "url",
          );
          if (!url || !url.trim().startsWith("http")) {
            showCustomAlert("提示", "请输入有效的图片URL！");
            return;
          }

          const chat = state.chats[state.activeChatId];
          if (!chat.settings.aiAvatarLibrary) {
            chat.settings.aiAvatarLibrary = [];
          }

          chat.settings.aiAvatarLibrary.push({
            name: name.trim(),
            url: url.trim(),
          });
          await db.chats.put(chat);
          renderAiAvatarLibrary();
        }

        /**
         * 关闭AI头像库管理模态框
         */
        function closeAiAvatarLibraryModal() {
          document
            .getElementById("ai-avatar-library-modal")
            .classList.remove("visible");
        }

        /**
         * 【全新】将保存的图标URL应用到主屏幕的App图标上
         */
        function applyAppIcons() {
          if (!state.globalSettings.appIcons) return;

          for (const iconId in state.globalSettings.appIcons) {
            const imgElement = document.getElementById(`icon-img-${iconId}`);
            if (imgElement) {
              imgElement.src = state.globalSettings.appIcons[iconId];
            }
          }
        }

        /**
         * 【全新】在外观设置页面渲染出所有App图标的设置项
         */
        function renderIconSettings() {
          const grid = document.getElementById("icon-settings-grid");
          if (!grid) return;
          grid.innerHTML = "";

          const appLabels = {
            "world-book": "世界书",
            qq: "QQ",
            "api-settings": "API设置",
            wallpaper: "壁纸",
            font: "字体",
          };

          for (const iconId in state.globalSettings.appIcons) {
            const iconUrl = state.globalSettings.appIcons[iconId];
            const labelText = appLabels[iconId] || "未知App";

            const item = document.createElement("div");
            item.className = "icon-setting-item";
            // 【重要】我们用 data-icon-id 来标记这个设置项对应哪个图标
            item.dataset.iconId = iconId;

            item.innerHTML = `
                  <img class="icon-preview" src="${iconUrl}" alt="${labelText}">
                  <button class="change-icon-btn">更换</button>
              `;
            grid.appendChild(item);
          }
        }

        /**
         * 当用户点击链接卡片时，打开伪浏览器
         * @param {number} timestamp - 被点击消息的时间戳
         */
        function openBrowser(timestamp) {
          if (!state.activeChatId) return;

          const chat = state.chats[state.activeChatId];
          // 安全检查，确保 chat 和 history 都存在
          if (!chat || !chat.history) return;

          const message = chat.history.find((m) => m.timestamp === timestamp);
          if (!message || message.type !== CONSTANTS.MSG_TYPES.SHARE_LINK) {
            console.error("无法找到或消息类型不匹配的分享链接:", timestamp);
            return; // 如果找不到消息，就直接退出
          }

          // 填充浏览器内容
          document.getElementById("browser-title").textContent =
            message.source_name || "文章详情";
          const browserContent = document.getElementById("browser-content");
          browserContent.innerHTML = `
              <h1 class="article-title">${message.title || "无标题"}</h1>
              <div class="article-meta">
                  <span>来源: ${message.source_name || "未知"}</span>
              </div>
              <div class="article-body">
                  <p>${(message.content || "内容为空。").replace(
                    /\n/g,
                    "</p><p>",
                  )}</p>
              </div>
          `;

          // 显示浏览器屏幕
          showScreen("browser-screen");
        }

        /**
         * 关闭伪浏览器，返回聊天界面
         * (这个函数现在由 init() 中的事件监听器调用)
         */
        function closeBrowser() {
          showScreen("chat-interface-screen");
        }

        /**
         * 打开让用户填写链接信息的模态框
         */
        function openShareLinkModal() {
          if (!state.activeChatId) return;

          // 清空上次输入的内容
          document.getElementById("link-title-input").value = "";
          document.getElementById("link-description-input").value = "";
          document.getElementById("link-source-input").value = "";
          document.getElementById("link-content-input").value = "";

          // 显示模态框
          document.getElementById("share-link-modal").classList.add("visible");
        }

        /**
         * 用户确认分享，创建并发送链接卡片消息
         */
        async function sendUserLinkShare() {
          if (!state.activeChatId) return;

          const title = document
            .getElementById("link-title-input")
            .value.trim();
          if (!title) {
            showCustomAlert("提示", "标题是必填项哦！");
            return;
          }

          const description = document
            .getElementById("link-description-input")
            .value.trim();
          const sourceName = document
            .getElementById("link-source-input")
            .value.trim();
          const content = document
            .getElementById("link-content-input")
            .value.trim();

          const chat = state.chats[state.activeChatId];

          // 创建消息对象
          const linkMessage = {
            role: CONSTANTS.ROLES.USER, // 角色是 'user'
            type: CONSTANTS.MSG_TYPES.SHARE_LINK,
            timestamp: Date.now(),
            title: title,
            description: description,
            source_name: sourceName,
            content: content,
            // 用户分享的链接，我们不提供图片，让它总是显示占位图
            thumbnail_url: null,
          };

          // 将消息添加到历史记录
          chat.history.push(linkMessage);
          await db.chats.put(chat);

          // 渲染新消息并更新列表
          appendMessage(linkMessage, chat);
          renderChatList();

          // 关闭模态框
          document
            .getElementById("share-link-modal")
            .classList.remove("visible");
        }

        /**
         * 根据AI的视角，过滤出它能看到的动态
         * @param {Array} allPosts - 所有待检查的动态帖子
         * @param {object} viewerChat - 正在“看”动态的那个AI的chat对象
         * @returns {Array} - 过滤后该AI可见的动态帖子
         */
        function filterVisiblePostsForAI(allPosts, viewerChat) {
          if (!viewerChat || !viewerChat.id) return []; // 安全检查

          const viewerGroupId = viewerChat.groupId; // 查看者所在的分组ID

          return allPosts.filter((post) => {
            // 规则1：如果是用户发的动态
            if (post.authorId === CONSTANTS.ROLES.USER) {
              // 如果用户设置了“部分可见”
              if (post.visibleGroupIds && post.visibleGroupIds.length > 0) {
                // 只有当查看者AI的分组ID在用户的可见列表里时，才可见
                return (
                  viewerGroupId && post.visibleGroupIds.includes(viewerGroupId)
                );
              }
              // 如果用户没设置，说明是公开的，所有AI都可见
              return true;
            }

            // 规则2：如果是其他AI发的动态
            const authorGroupId = post.authorGroupId; // 发帖AI所在的分组ID

            // 如果发帖的AI没有分组，那它的动态就是公开的
            if (!authorGroupId) {
              return true;
            }

            // 如果发帖的AI有分组，那么只有在同一个分组的AI才能看到
            return authorGroupId === viewerGroupId;
          });
        }

        /**
         * 应用指定的主题（'light' 或 'dark'）
         * @param {string} theme - 要应用的主题名称
         */
        function applyTheme(theme) {
          const phoneScreen = document.getElementById("phone-screen");
          const toggleSwitch = document.getElementById("theme-toggle-switch");

        const isDark = theme === "dark";

        phoneScreen.classList.toggle("dark-mode", isDark);
        document.body.classList.toggle("dark-mode", isDark);
        document.documentElement.classList.toggle("dark-mode", isDark);

          // 如果开关存在，就同步它的状态
          if (toggleSwitch) {
            toggleSwitch.checked = isDark;
          }

          localStorage.setItem("ephone-theme", theme);
        }

        function applyPhoneSizePanelVisibility(show) {
          const panel = document.getElementById("phone-size-control-panel");
          if (panel) {
            panel.style.display = show ? "block" : "none";
            
            // === 新增：同步到 localStorage ===
            localStorage.setItem('ephone-panel-visibility', JSON.stringify({
              showPhoneSizePanel: show
            }));
            
            // 移除预加载时添加的临时样式
            const preloadStyle = document.getElementById('preload-panel-hidden');
            if (preloadStyle) {
              preloadStyle.remove();
            }
          }
        }

        /**
         * 切换当前的主题
         */
        function toggleTheme() {
          const toggleSwitch = document.getElementById("theme-toggle-switch");
          // 直接根据开关的选中状态来决定新主题
          const newTheme = toggleSwitch.checked ? "dark" : "light";
          applyTheme(newTheme);
        }

        function startReplyToMessage() {
          if (!activeMessageTimestamp) return;

          const chat = state.chats[state.activeChatId];
          const message = chat.history.find(
            (m) => m.timestamp === activeMessageTimestamp,
          );
          if (!message) return;

          // 1. 【核心修正】同时获取“完整内容”和“预览片段”
          const fullContent = String(message.content || "");
          let previewSnippet = "";

          if (
            typeof message.content === "string" &&
            STICKER_REGEX.test(message.content)
          ) {
            previewSnippet = "[表情]";
          } else if (
            message.type === CONSTANTS.MSG_TYPES.IMAGE ||
            message.type === "user_photo"
          ) {
            previewSnippet = "[图片]";
          } else if (message.type === CONSTANTS.MSG_TYPES.VOICE) {
            previewSnippet = "[语音]";
          } else {
            // 预览片段依然截断，但只用于UI显示
            previewSnippet =
              fullContent.substring(0, 50) +
              (fullContent.length > 50 ? "..." : "");
          }

          // 2. 【核心修正】将“完整内容”存入上下文，以备发送时使用
          currentReplyContext = {
            timestamp: message.timestamp,
            senderName:
              message.senderName ||
              (message.role === CONSTANTS.ROLES.USER
                ? chat.settings.myNickname || "我"
                : chat.name),
            content: fullContent, // <--- 这里存的是完整的原文！
          };

          // 3. 【核心修正】仅在更新“回复预览栏”时，才使用“预览片段”
          const previewBar = document.getElementById("reply-preview-bar");
          previewBar.querySelector(".sender").textContent =
            `回复 ${currentReplyContext.senderName}:`;
          previewBar.querySelector(".text").textContent = previewSnippet; // <--- 这里用的是缩略版！
          previewBar.style.display = "block";

          // 4. 后续操作保持不变
          hideMessageActions();
          DOM.get("chat-input").focus();
        }

        /**
         * 【全新】取消引用模式
         */
        function cancelReplyMode() {
          currentReplyContext = null;
          document.getElementById("reply-preview-bar").style.display = "none";
        }

        let activeTransferTimestamp = null; // 用于暂存被点击的转账消息的时间戳

        /**
         * 显示处理转账的操作菜单
         * @param {number} timestamp - 被点击的转账消息的时间戳
         */
        function showTransferActionModal(timestamp) {
          activeTransferTimestamp = timestamp;

          const chat = state.chats[state.activeChatId];
          const message = chat.history.find((m) => m.timestamp === timestamp);
          if (message) {
            // 将AI的名字填入弹窗
            document.getElementById("transfer-sender-name").textContent =
              message.senderName;
          }
          document
            .getElementById("transfer-actions-modal")
            .classList.add("visible");
        }

        /**
         * 隐藏处理转账的操作菜单
         */
        function hideTransferActionModal() {
          document
            .getElementById("transfer-actions-modal")
            .classList.remove("visible");
          activeTransferTimestamp = null;
        }

        /**
         * 处理用户接受或拒绝转账的逻辑
         * @param {string} choice - 用户的选择, 'accepted' 或 'declined'
         */
        async function handleUserTransferResponse(choice) {
          if (!activeTransferTimestamp) return;

          const timestamp = activeTransferTimestamp;
          const chat = state.chats[state.activeChatId];
          const messageIndex = chat.history.findIndex(
            (m) => m.timestamp === timestamp,
          );
          if (messageIndex === -1) return;

          // 1. 更新原始转账消息的状态
          const originalMessage = chat.history[messageIndex];
          originalMessage.status = choice;

          let systemContent;

          // 2. 如果用户选择“拒绝”
          if (choice === "declined") {
            // 立刻在前端生成一个“退款”卡片，让用户看到
            const refundMessage = {
              role: CONSTANTS.ROLES.USER,
              type: CONSTANTS.MSG_TYPES.TRANSFER,
              isRefund: true, // 这是一个关键标记，用于UI显示这是退款
              amount: originalMessage.amount,
              note: "已拒收对方转账",
              timestamp: Date.now(),
            };
            chat.history.push(refundMessage);

            // 准备一条对AI可见的隐藏消息，告诉它发生了什么
            systemContent = `[系统提示：你拒绝并退还了“${originalMessage.senderName}”的转账。]`;
          } else {
            // 如果用户选择“接受”
            // 只需准备隐藏消息通知AI即可
            systemContent = `[系统提示：你接受了“${originalMessage.senderName}”的转账。]`;
          }

          // 3. 创建这条对用户隐藏、但对AI可见的系统消息
          const hiddenMessage = {
            role: CONSTANTS.ROLES.SYSTEM,
            content: systemContent,
            timestamp: Date.now() + 1, // 保证时间戳在退款消息之后
            isHidden: true, // 这个标记会让它不在聊天界面显示
          };
          chat.history.push(hiddenMessage);

          // 4. 保存所有更改到数据库，并刷新界面
          await db.chats.put(chat);
          hideTransferActionModal();
          renderChatInterface(state.activeChatId);
          renderChatList();
        }

        async function renderCallHistoryScreen() {
          showScreen("call-history-screen"); // <--【核心修正】把它移动到最前面！

          const listEl = document.getElementById("call-history-list");
          const titleEl = document.getElementById("call-history-title");
          listEl.innerHTML = "";
          titleEl.textContent = "所有通话记录";

          const records = await db.callRecords
            .orderBy("timestamp")
            .reverse()
            .toArray();

          if (records.length === 0) {
            listEl.innerHTML =
              '<p style="text-align:center; color: var(--text-secondary); padding: 50px 0;">这里还没有通话记录哦~</p>';
            return; // 现在的 return 就没问题了，因为它只跳过了后续的渲染逻辑
          }

          records.forEach((record) => {
            const card = createCallRecordCard(record);

            addLongPressListener(card, async () => {
              // 1. 弹出输入框，并将旧名称作为默认值，方便修改
              const newName = await showCustomPrompt(
                "自定义通话名称",
                "请输入新的名称（留空则恢复默认）",
                record.customName || "", // 如果已有自定义名称，就显示它
              );

              // 2. 如果用户点击了“取消”，则什么都不做
              if (newName === null) return;

              // 3. 更新数据库中的这条记录
              await db.callRecords.update(record.id, {
                customName: newName.trim(),
              });

              // 4. 刷新整个列表，让更改立刻显示出来
              await renderCallHistoryScreen();

              // 5. 给用户一个成功的提示
              await showCustomAlert("成功", "通话名称已更新！");
            });
            listEl.appendChild(card);
          });
        }

        /**
         * 【升级版】根据单条记录数据，创建一张能显示聊天对象的通话卡片
         * @param {object} record - 一条通话记录对象
         * @returns {HTMLElement} - 创建好的卡片div
         */
        function createCallRecordCard(record) {
          const card = document.createElement("div");
          card.className = "call-record-card";
          card.dataset.recordId = record.id;

          // 获取通话对象的名字
          const chatInfo = state.chats[record.chatId];
          const chatName = chatInfo ? chatInfo.name : "未知会话";

          const callDate = new Date(record.timestamp);
          const dateString = `${callDate.getFullYear()}-${String(
            callDate.getMonth() + 1,
          ).padStart(2, "0")}-${String(callDate.getDate()).padStart(
            2,
            "0",
          )} ${String(callDate.getHours()).padStart(2, "0")}:${String(
            callDate.getMinutes(),
          ).padStart(2, "0")}`;
          const durationText = `${Math.floor(record.duration / 60)}分${
            record.duration % 60
          }秒`;

          const avatarsHtml = record.participants
            .map(
              (p) =>
                `<img src="${p.avatar}" alt="${p.name}" class="participant-avatar" title="${p.name}">`,
            )
            .join("");

          card.innerHTML = `
              <div class="card-header">
                  <span class="date">${dateString}</span>
                  <span class="duration">${durationText}</span>
              </div>
              <div class="card-body">
                  <!-- 【核心修改】在这里新增一个标题行 -->
                  ${
                    record.customName
                      ? `<div class="custom-title">${record.customName}</div>`
                      : ""
                  }

                  <div class="participants-info"> <!-- 新增一个容器方便布局 -->
                      <div class="participants-avatars">${avatarsHtml}</div>
                      <span class="participants-names">与 ${chatName}</span>
                  </div>
              </div>
          `;
          return card;
        }

        /**
         * 显示指定通话记录的完整文字稿
         * @param {number} recordId - 通话记录的ID
         */
        async function showCallTranscript(recordId) {
          const record = await db.callRecords.get(recordId);
          if (!record) return;

          const modal = document.getElementById("call-transcript-modal");
          const titleEl = document.getElementById("transcript-modal-title");
          const bodyEl = document.getElementById("transcript-modal-body");

          titleEl.textContent = `通话于 ${new Date(
            record.timestamp,
          ).toLocaleString()} (时长: ${Math.floor(record.duration / 60)}分${
            record.duration % 60
          }秒)`;
          bodyEl.innerHTML = "";

          if (!record.transcript || record.transcript.length === 0) {
            bodyEl.innerHTML =
              '<p style="text-align:center; color: #8a8a8a;">这次通话没有留下文字记录。</p>';
          } else {
            record.transcript.forEach((entry) => {
              const bubble = document.createElement("div");
              // 根据角色添加不同的class，应用不同的样式
              bubble.className = `transcript-entry ${entry.role}`;
              bubble.textContent = entry.content;
              bodyEl.appendChild(bubble);
            });
          }

          const deleteBtn = document.getElementById("delete-transcript-btn");

          // 【重要】使用克隆节点技巧，防止事件重复绑定
          const newDeleteBtn = deleteBtn.cloneNode(true);
          deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

          // 为新的、干净的按钮绑定事件
          newDeleteBtn.addEventListener("click", async () => {
            const confirmed = await showCustomConfirm(
              "确认删除",
              "确定要永久删除这条通话记录吗？此操作不可恢复。",
              { confirmButtonClass: "btn-danger" },
            );

            if (confirmed) {
              // 1. 关闭当前的详情弹窗
              modal.classList.remove("visible");

              // 2. 从数据库删除
              await db.callRecords.delete(recordId);

              // 3. 刷新通话记录列表
              await renderCallHistoryScreen();

              // 4. (可选) 给出成功提示
              showCustomAlert("提示", "通话记录已删除。");
            }
          });
          modal.classList.add("visible");
        }

        /**
         * 【全新】处理用户点击状态栏，弹出编辑框让用户修改AI的当前状态
         */
        async function handleEditStatusClick() {
          // 1. 安全检查，确保在单聊界面
          if (!state.activeChatId || state.chats[state.activeChatId].isGroup) {
            return;
          }
          const chat = state.chats[state.activeChatId];

          // 2. 弹出输入框，让用户输入新的状态，并将当前状态作为默认值
          const newStatusText = await showCustomPrompt(
            "编辑对方状态",
            "请输入对方现在的新状态：",
            chat.status.text, // 将当前状态作为输入框的默认内容
          );

          // 3. 如果用户输入了内容并点击了“确定”
          if (newStatusText !== null) {
            // 4. 更新内存和数据库中的状态数据
            chat.status.text = newStatusText.trim() || CONSTANTS.STATUS.ONLINE; // 如果用户清空了，就默认为“在线”
            chat.status.isBusy = false; // 每次手动编辑都默认其不处于“忙碌”状态
            chat.status.lastUpdate = Date.now();
            await db.chats.put(chat);

            // 5. 立刻刷新UI，让用户看到修改后的状态
            renderChatInterface(state.activeChatId);
            renderChatList();

            // 6. 给出一个无伤大雅的成功提示
            await showCustomAlert(
              "状态已更新",
              `“${chat.name}”的当前状态已更新为：${chat.status.text}`,
            );
          }
        }

        // 放在你的JS功能函数定义区
        async function openShareTargetPicker() {
          const modal = document.getElementById("share-target-modal");
          const listEl = document.getElementById("share-target-list");
          listEl.innerHTML = "";

          // 获取所有聊天作为分享目标
          const chats = Object.values(state.chats);

          chats.forEach((chat) => {
            // 复用联系人选择器的样式
            const item = document.createElement("div");
            item.className = "contact-picker-item";
            item.innerHTML = `
                  <input type="checkbox" class="share-target-checkbox" data-chat-id="${
                    chat.id
                  }" style="margin-right: 15px;">
                  <img src="${
                    chat.isGroup
                      ? chat.settings.groupAvatar
                      : chat.settings.aiAvatar || defaultAvatar
                  }" class="avatar">
                  <span class="name">${chat.name}</span>
              `;
            listEl.appendChild(item);
          });

          modal.classList.add("visible");
        }

        function closeMusicPlayerWithAnimation(callback) {
          const overlay = document.getElementById("music-player-overlay");
          if (!overlay.classList.contains("visible")) {
            if (callback) callback();
            return;
          }
          overlay.classList.remove("visible");
          setTimeout(() => {
            document
              .getElementById("music-playlist-panel")
              .classList.remove("visible");
            if (callback) callback();
          }, 400);
        }

        function parseLRC(lrcContent) {
          if (!lrcContent) return [];
          const lines = lrcContent.split("\n");
          const lyrics = [];
          const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;

          for (const line of lines) {
            const text = line.replace(timeRegex, "").trim();
            if (!text) continue;
            timeRegex.lastIndex = 0;
            let match;
            while ((match = timeRegex.exec(line)) !== null) {
              const minutes = parseInt(match[1], 10);
              const seconds = parseInt(match[2], 10);
              const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
              const time = minutes * 60 + seconds + milliseconds / 1000;
              lyrics.push({ time, text });
            }
          }
          return lyrics.sort((a, b) => a.time - b.time);
        }

        function renderLyrics() {
          const lyricsList = document.getElementById("music-lyrics-list");
          lyricsList.innerHTML = "";
          if (
            !musicState.parsedLyrics ||
            musicState.parsedLyrics.length === 0
          ) {
            lyricsList.innerHTML = '<div class="lyric-line">♪ 暂无歌词 ♪</div>';
            return;
          }
          musicState.parsedLyrics.forEach((line, index) => {
            const lineEl = document.createElement("div");
            lineEl.className = "lyric-line";
            lineEl.textContent = line.text;
            lineEl.dataset.index = index;
            lyricsList.appendChild(lineEl);
          });
          lyricsList.style.transform = `translateY(0px)`;
        }

        function updateActiveLyric(currentTime) {
          if (musicState.parsedLyrics.length === 0) return;
          let newLyricIndex = -1;
          for (let i = 0; i < musicState.parsedLyrics.length; i++) {
            if (currentTime >= musicState.parsedLyrics[i].time) {
              newLyricIndex = i;
            } else {
              break;
            }
          }
          if (newLyricIndex === musicState.currentLyricIndex) return;
          musicState.currentLyricIndex = newLyricIndex;
          updateLyricsUI();
        }

        function updateLyricsUI() {
          const lyricsList = document.getElementById("music-lyrics-list");
          const container = document.getElementById("music-lyrics-container");
          const lines = lyricsList.querySelectorAll(".lyric-line");
          lines.forEach((line) => line.classList.remove("active"));
          if (musicState.currentLyricIndex === -1) {
            lyricsList.style.transform = `translateY(0px)`;
            return;
          }
          const activeLine = lyricsList.querySelector(
            `.lyric-line[data-index="${musicState.currentLyricIndex}"]`,
          );
          if (activeLine) {
            activeLine.classList.add("active");
            const containerHeight = container.offsetHeight;
            const offset =
              containerHeight / 3 -
              activeLine.offsetTop -
              activeLine.offsetHeight / 2;
            lyricsList.style.transform = `translateY(${offset}px)`;
          }
        }

        function formatMusicTime(seconds) {
          if (isNaN(seconds) || seconds < 0) return "0:00";
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = Math.floor(seconds % 60);
          return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
        }

        function updateMusicProgressBar() {
          const currentTimeEl = document.getElementById("music-current-time");
          const totalTimeEl = document.getElementById("music-total-time");
          const progressFillEl = document.getElementById("music-progress-fill");
          if (!audioPlayer.duration) {
            currentTimeEl.textContent = "0:00";
            totalTimeEl.textContent = "0:00";
            progressFillEl.style.width = "0%";
            return;
          }
          const progressPercent =
            (audioPlayer.currentTime / audioPlayer.duration) * 100;
          progressFillEl.style.width = `${progressPercent}%`;
          currentTimeEl.textContent = formatMusicTime(audioPlayer.currentTime);
          totalTimeEl.textContent = formatMusicTime(audioPlayer.duration);
          updateActiveLyric(audioPlayer.currentTime);
        }

        /**
         * 【全新】处理用户点击“撤回”按钮的入口函数
         */
        async function handleRecallClick() {
          if (!activeMessageTimestamp) return;

          const RECALL_TIME_LIMIT_MS = 2 * 60 * 1000; // 设置2分钟的撤回时限
          const messageTime = activeMessageTimestamp;
          const now = Date.now();

          // 检查是否超过了撤回时限
          if (now - messageTime > RECALL_TIME_LIMIT_MS) {
            hideMessageActions();
            await showCustomAlert(
              "操作失败",
              "该消息发送已超过2分钟，无法撤回。",
            );
            return;
          }

          // 如果在时限内，执行真正的撤回逻辑
          await recallMessage(messageTime, true);
          hideMessageActions();
        }

        /**
         * 【全新】消息撤回的核心逻辑
         * @param {number} timestamp - 要撤回的消息的时间戳
         * @param {boolean} isUserRecall - 是否是用户主动撤回
         */
        async function recallMessage(timestamp, isUserRecall) {
          const chat = state.chats[state.activeChatId];
          if (!chat) return;

          const messageIndex = chat.history.findIndex(
            (m) => m.timestamp === timestamp,
          );
          if (messageIndex === -1) return;

          const messageToRecall = chat.history[messageIndex];

          // 1. 修改消息对象，将其变为“已撤回”状态
          const recalledData = {
            originalType: messageToRecall.type || CONSTANTS.MSG_TYPES.TEXT,
            originalContent: messageToRecall.content,
            // 保存其他可能存在的原始数据
            originalMeaning: messageToRecall.meaning,
            originalQuote: messageToRecall.quote,
          };

          messageToRecall.type = CONSTANTS.MSG_TYPES.RECALLED;
          messageToRecall.content = isUserRecall
            ? "你撤回了一条消息"
            : "对方撤回了一条消息";
          messageToRecall.recalledData = recalledData;
          // 清理掉不再需要的旧属性
          delete messageToRecall.meaning;
          delete messageToRecall.quote;

          // 2. 如果是用户撤回，需要给AI发送一条它看不懂内容的隐藏提示
          if (isUserRecall) {
            const hiddenMessageForAI = {
              role: CONSTANTS.ROLES.SYSTEM,
              content: `[系统提示：用户撤回了一条消息。你不知道内容是什么，只需知道这个事件即可。]`,
              timestamp: Date.now(),
              isHidden: true,
            };
            chat.history.push(hiddenMessageForAI);
          }

          // 3. 保存到数据库并刷新UI
          await db.chats.put(chat);
          renderChatInterface(state.activeChatId);
          if (isUserRecall) renderChatList(); // 用户撤回时，最后一条消息变了，需要刷新列表
        }

        /**
         * 打开分类管理模态框
         */
        async function openCategoryManager() {
          await renderCategoryListInManager();
          document
            .getElementById("world-book-category-manager-modal")
            .classList.add("visible");
        }

        /**
         * 在模态框中渲染已存在的分类列表
         */
        async function renderCategoryListInManager() {
          const listEl = document.getElementById("existing-categories-list");
          const categories = await db.worldBookCategories.toArray();
          listEl.innerHTML = "";
          if (categories.length === 0) {
            listEl.innerHTML =
              '<p style="text-align: center; color: var(--text-secondary);">还没有任何分类</p>';
          }
          categories.forEach((cat) => {
            // 复用好友分组的样式
            const item = document.createElement("div");
            item.className = "existing-group-item";
            item.innerHTML = `
                  <span class="group-name">${cat.name}</span>
                  <span class="delete-group-btn" data-id="${cat.id}">×</span>
              `;
            listEl.appendChild(item);
          });
        }

        /**
         * 添加一个新的世界书分类
         */
        async function addNewCategory() {
          const input = document.getElementById("new-category-name-input");
          const name = input.value.trim();
          if (!name) {
            showCustomAlert("提示", "分类名不能为空！");
            return;
          }
          const existing = await db.worldBookCategories
            .where("name")
            .equals(name)
            .first();
          if (existing) {
            showCustomAlert("提示", `分类 "${name}" 已经存在了！`);
            return;
          }
          await db.worldBookCategories.add({ name });
          input.value = "";
          await renderCategoryListInManager();
        }

        /**
         * 删除一个世界书分类
         * @param {number} categoryId - 要删除的分类的ID
         */
        async function deleteCategory(categoryId) {
          const confirmed = await showCustomConfirm(
            "确认删除",
            "删除分类后，该分类下的所有世界书将变为“未分类”。确定要删除吗？",
            { confirmButtonClass: "btn-danger" },
          );
          if (confirmed) {
            await db.worldBookCategories.delete(categoryId);
            // 将属于该分类的世界书的 categoryId 设为 null
            const booksToUpdate = await db.worldBooks
              .where("categoryId")
              .equals(categoryId)
              .toArray();
            for (const book of booksToUpdate) {
              book.categoryId = null;
              await db.worldBooks.put(book);
              const bookInState = state.worldBooks.find(
                (wb) => wb.id === book.id,
              );
              if (bookInState) bookInState.categoryId = null;
            }
            await renderCategoryListInManager();
          }
        }

        /**
         * 设置消息列表的事件委托
         * 替代在每个消息元素上单独绑定事件，提高性能
         */
        function setupDelegatedMessageEvents() {
          const container = document.getElementById("chat-messages");
          if (!container) return;

          // --- 1. 长按事件委托 ---
          let longPressTimer;
          let isTouchScrolling = false;

          const startLongPress = (e) => {
            if (isSelectionMode) return;

            // 找到最近的消息包裹器
            const wrapper = e.target.closest(".message-wrapper");
            if (!wrapper) return;

            // 如果点击的是特定的交互元素（如按钮、链接卡片等），则不触发长按菜单
            // 除非这些元素本身也没有阻止冒泡
            if (
              e.target.closest("button") ||
              e.target.closest(".poll-option-item") ||
              e.target.closest(".link-share-card") ||
              e.target.closest(".red-packet-card") ||
              e.target.closest(".voice-message-body")
            ) {
              return;
            }

            longPressTimer = setTimeout(() => {
              if (!isTouchScrolling) {
                const bubble = wrapper.querySelector(".message-bubble");
                const timestamp = parseInt(
                  bubble?.dataset.timestamp || wrapper.dataset.timestamp,
                );
                if (timestamp) {
                  showMessageActions(timestamp);
                  // 简单的触觉反馈
                  if (navigator.vibrate) navigator.vibrate(50);
                }
              }
            }, 500);
          };

          const cancelLongPress = () => {
            clearTimeout(longPressTimer);
          };

          // 鼠标事件
          container.addEventListener("mousedown", startLongPress);
          container.addEventListener("mouseup", cancelLongPress);
          container.addEventListener("mouseleave", cancelLongPress);

          // 触摸事件
          container.addEventListener(
            "touchstart",
            (e) => {
              isTouchScrolling = false;
              startLongPress(e);
            },
            { passive: true },
          );

          container.addEventListener("touchend", cancelLongPress);
          
          container.addEventListener(
            "touchmove",
            () => {
              isTouchScrolling = true;
              cancelLongPress();
            },
            { passive: true },
          );

          // --- 2. 点击事件委托 ---
          container.addEventListener("click", (e) => {
            const target = e.target;
            const wrapper = target.closest(".message-wrapper");
            if (!wrapper) return;

            // 处理选择模式下的点击
            if (isSelectionMode) {
              const bubble = wrapper.querySelector(".message-bubble");
              const timestamp = parseInt(
                bubble?.dataset.timestamp || wrapper.dataset.timestamp,
              );
              if (timestamp) {
                // 阻止其他点击行为（如图片放大、链接跳转等）
                e.preventDefault();
                e.stopPropagation();
                toggleMessageSelection(timestamp);
              }
              return;
            }

            // 处理头像点击 (拍一拍)
            if (target.matches(".avatar") || target.closest(".avatar")) {
              const chat = state.chats[state.activeChatId];
              if (chat) {
                // 只有AI或群成员的头像可以点击
                if (!wrapper.classList.contains(CONSTANTS.ROLES.USER)) {
                  e.stopPropagation();
                  // 优先使用 dataset 里的 senderName，如果没有则回退到 chat.name
                  const senderName = wrapper.dataset.senderName || chat.name;
                  handleUserPat(chat.id, senderName);
                }
              }
            }
          });
        }

        // ===================================================================
        // 4. 初始化函数 init()
        // ===================================================================
        async function init() {
          const savedTheme = localStorage.getItem("ephone-theme") || "light"; // 默认为日间模式
          applyTheme(savedTheme);

          const customBubbleStyleTag = document.createElement("style");
          customBubbleStyleTag.id = "custom-bubble-style";
          document.head.appendChild(customBubbleStyleTag);

          const previewBubbleStyleTag = document.createElement("style");
          previewBubbleStyleTag.id = "preview-bubble-style";
          document.head.appendChild(previewBubbleStyleTag);

          applyScopedCss("", "#chat-messages", "custom-bubble-style"); // 清除真实聊天界面的自定义样式
          applyScopedCss("", "#settings-preview-area", "preview-bubble-style"); // 清除预览区的自定义样式

          // 核心优化：设置事件委托
          setupDelegatedMessageEvents();

          window.showScreen = showScreen;
          window.renderChatListProxy = renderChatList;
          window.renderApiSettingsProxy = renderApiSettings;
          window.renderWallpaperScreenProxy = renderWallpaperScreen;
          window.renderWorldBookScreenProxy = renderWorldBookScreen;

          await loadAllDataFromDB();

          // 初始化未读动态计数
          const storedCount =
            parseInt(localStorage.getItem("unreadPostsCount")) || 0;
          updateUnreadIndicator(storedCount);

          if (state.globalSettings && state.globalSettings.fontUrl) {
            applyCustomFont(state.globalSettings.fontUrl);
          }

          updateClock();
          setInterval(updateClock, 1000 * 30);
          applyGlobalWallpaper();
          initBatteryManager();

          applyAppIcons();

          state.globalSettings = state.globalSettings || {};
          state.globalSettings.showSizePanel =
            state.globalSettings.showSizePanel ?? false;
          applyPhoneSizePanelVisibility(state.globalSettings.showSizePanel);
          const screenWidthInput = document.getElementById(
            "screen-width-input",
          );
          const screenHeightInput = document.getElementById(
            "screen-height-input",
          );
          const phoneOffsetInput = document.getElementById(
            "phone-offset-input",
          );
          const screenWidthValue = document.getElementById(
            "screen-width-value",
          );
          const screenHeightValue = document.getElementById(
            "screen-height-value",
          );
          const phoneOffsetValue = document.getElementById(
            "phone-offset-value",
          );
          const resetPhoneSizeBtn = document.getElementById(
            "reset-phone-size-btn",
          );

          const screenWidth =
            state.globalSettings.screenWidth !== undefined
              ? state.globalSettings.screenWidth
              : 365;
          const screenHeight =
            state.globalSettings.screenHeight !== undefined
              ? state.globalSettings.screenHeight
              : 680;
          const phoneOffset =
            state.globalSettings.phoneOffset !== undefined
              ? state.globalSettings.phoneOffset
              : 15;

          document.documentElement.style.setProperty(
            "--screen-width",
            `${screenWidth}px`,
          );
          document.documentElement.style.setProperty(
            "--screen-height",
            `${screenHeight}px`,
          );
          document.documentElement.style.setProperty(
            "--phone-offset",
            `${phoneOffset}px`,
          );

          if (screenWidthInput) {
            screenWidthInput.value = screenWidth;
            if (screenWidthValue) {
              screenWidthValue.textContent = `${screenWidth}px`;
            }
          }
          if (screenHeightInput) {
            screenHeightInput.value = screenHeight;
            if (screenHeightValue) {
              screenHeightValue.textContent = `${screenHeight}px`;
            }
          }
          if (phoneOffsetInput) {
            phoneOffsetInput.value = phoneOffset;
            if (phoneOffsetValue) {
              phoneOffsetValue.textContent = `${phoneOffset}px`;
            }
          }

          // ==========================================================
          // --- 各种事件监听器 ---
          // ==========================================================

          document
            .getElementById("custom-modal-cancel")
            .addEventListener("click", hideCustomModal);
          document
            .getElementById("custom-modal-overlay")
            .addEventListener("click", (e) => {
              if (e.target === modalOverlay) hideCustomModal();
            });
          document
            .getElementById("export-data-btn")
            .addEventListener("click", exportBackup);
          document
            .getElementById("import-btn")
            .addEventListener("click", () =>
              document.getElementById("import-data-input").click(),
            );
          document
            .getElementById("import-data-input")
            .addEventListener("change", (e) => importBackup(e.target.files[0]));
          document
            .getElementById("back-to-list-btn")
            .addEventListener("click", () => {
              applyScopedCss("", "#chat-messages", "custom-bubble-style"); // 清除真实聊天界面的自定义样式
              applyScopedCss(
                "",
                "#settings-preview-area",
                "preview-bubble-style",
              ); // 清除预览区的自定义样式

              exitSelectionMode();
              state.activeChatId = null;
              showScreen("chat-list-screen");
            });

          document
            .getElementById("add-chat-btn")
            .addEventListener("click", async () => {
              const name = await showCustomPrompt(
                "创建新聊天",
                "请输入Ta的名字",
              );
              if (name && name.trim()) {
                const newChatId = "chat_" + Date.now();
                const newChat = {
                  id: newChatId,
                  name: name.trim(),
                  isGroup: false,
                  relationship: {
                    status: "friend", // 'friend', 'blocked_by_user', 'pending_user_approval'
                    blockedTimestamp: null,
                    applicationReason: "",
                  },
                  status: {
                    text: CONSTANTS.STATUS.ONLINE,
                    lastUpdate: Date.now(),
                    isBusy: false,
                  },
                  settings: {
                    aiPersona: "你是谁呀。",
                    myPersona: "我是谁呀。",
                    maxMemory: 10,
                    aiAvatar: defaultAvatar,
                    myAvatar: defaultAvatar,
                    background: "",
                    theme: "default",
                    fontSize: 13,
                    customCss: "", // <--- 新增这行
                    linkedWorldBookIds: [],
                    aiAvatarLibrary: [],
                    summary: {
                      enabled: false,
                      mode: "manual",
                      count: 50,
                      prompt:
                        "请总结上述对话的主要内容，保留重要信息和情感脉络。",
                      lastSummaryIndex: -1,
                    },
                  },
                  history: [],
                  musicData: { totalTime: 0 },
                };
                state.chats[newChatId] = newChat;
                await db.chats.put(newChat);
                renderChatList();
              }
            });

          document
            .getElementById("add-group-chat-btn")
            .addEventListener("click", openContactPickerForGroupCreate);
          document
            .getElementById("transfer-cancel-btn")
            .addEventListener("click", () =>
              document
                .getElementById("transfer-modal")
                .classList.remove("visible"),
            );
          document
            .getElementById("transfer-confirm-btn")
            .addEventListener("click", sendUserTransfer);

          document
            .getElementById("listen-together-btn")
            .addEventListener("click", handleListenTogetherClick);
          document
            .getElementById("music-exit-btn")
            .addEventListener("click", () => endListenTogetherSession(true));
          document
            .getElementById("music-return-btn")
            .addEventListener("click", returnToChat);
          document
            .getElementById("music-play-pause-btn")
            .addEventListener("click", togglePlayPause);
          document
            .getElementById("music-next-btn")
            .addEventListener("click", playNext);
          document
            .getElementById("music-prev-btn")
            .addEventListener("click", playPrev);
          document
            .getElementById("music-mode-btn")
            .addEventListener("click", changePlayMode);
          document
            .getElementById("music-playlist-btn")
            .addEventListener("click", () => {
              updatePlaylistUI();
              document
                .getElementById("music-playlist-panel")
                .classList.add("visible");
            });
          document
            .getElementById("close-playlist-btn")
            .addEventListener("click", () =>
              document
                .getElementById("music-playlist-panel")
                .classList.remove("visible"),
            );
          document
            .getElementById("add-song-url-btn")
            .addEventListener("click", addSongFromURL);
          document
            .getElementById("add-song-local-btn")
            .addEventListener("click", () =>
              document.getElementById("local-song-upload-input").click(),
            );
          document
            .getElementById("local-song-upload-input")
            .addEventListener("change", addSongFromLocal);
          audioPlayer.addEventListener("ended", playNext);
          audioPlayer.addEventListener("pause", () => {
            if (musicState.isActive) {
              musicState.isPlaying = false;
              updatePlayerUI();
            }
          });
          audioPlayer.addEventListener("play", () => {
            if (musicState.isActive) {
              musicState.isPlaying = true;
              updatePlayerUI();
            }
          });

          const chatInput = DOM.get("chat-input");
          document
            .getElementById("send-btn")
            .addEventListener("click", async () => {
              const content = chatInput.value.trim();
              if (!content || !state.activeChatId) return;

              const chat = state.chats[state.activeChatId];

              // --- 【核心修改】在这里添加 ---
              const msg = {
                role: CONSTANTS.ROLES.USER,
                content,
                timestamp: Date.now(),
              };

              // 【离线模式标记】如果离线模式开启,标记消息
              if (chat.settings?.offlineMode?.enabled) {
                msg.isOfflineMode = true;
              }

              // 检查当前是否处于引用回复模式
              if (currentReplyContext) {
                msg.quote = currentReplyContext; // 将引用信息附加到消息对象上
              }
              // --- 【修改结束】 ---

              chat.history.push(msg);
              await db.chats.put(chat);
              // 触发总结检查
              try {
                await checkAndTriggerSummary(chat.id);
              } catch (summaryError) {
                console.error(
                  "Failed to trigger chat summary after user message:",
                  summaryError,
                );
              }
              appendMessage(msg, chat);
              renderChatList();
              chatInput.value = "";
              chatInput.style.height = "auto";
              chatInput.focus();

              // --- 【核心修改】发送后，取消引用模式 ---
              cancelReplyMode();
            });
          document
            .getElementById("wait-reply-btn")
            .addEventListener("click", triggerAiResponse);
          chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              document.getElementById("send-btn").click();
            }
          });
          chatInput.addEventListener("input", () => {
            chatInput.style.height = "auto";
            chatInput.style.height = chatInput.scrollHeight + "px";
          });

          const frameColorInput = document.getElementById("frame-color-input");
          const frameColorValue = document.getElementById("frame-color-value");

          frameColorInput.addEventListener("input", (e) => {
            frameColorValue.textContent = e.target.value;
            // 实时预览：直接修改DOM，但不保存
            document.getElementById("phone-frame").style.backgroundColor =
              e.target.value;
          });

          document
            .getElementById("reset-frame-color-btn")
            .addEventListener("click", () => {
              // 重置为默认值（这里假设默认白色，实际保存时为空字符串让CSS生效）
              frameColorInput.value = "#ffffff";
              frameColorValue.textContent = "#ffffff";
              document.getElementById("phone-frame").style.backgroundColor = ""; // 清除内联样式
            });

          if (screenWidthInput) {
            screenWidthInput.addEventListener("input", (e) => {
              const value = parseInt(e.target.value, 10);
              document.documentElement.style.setProperty(
                "--screen-width",
                `${value}px`,
              );
              if (screenWidthValue) {
                screenWidthValue.textContent = `${value}px`;
              }
              state.globalSettings.screenWidth = value;
              db.globalSettings.put({ id: 1, ...state.globalSettings });

              // 同步布局缓存到 localStorage
              try {
                  const cache = JSON.parse(localStorage.getItem('ephone-layout-cache') || '{}');
                  cache.screenWidth = value;
                  localStorage.setItem('ephone-layout-cache', JSON.stringify(cache));
              } catch(e) { console.warn('Layout cache error', e); }
            });
          }
          if (screenHeightInput) {
            screenHeightInput.addEventListener("input", (e) => {
              const value = parseInt(e.target.value, 10);
              document.documentElement.style.setProperty(
                "--screen-height",
                `${value}px`,
              );
              if (screenHeightValue) {
                screenHeightValue.textContent = `${value}px`;
              }
              state.globalSettings.screenHeight = value;
              db.globalSettings.put({ id: 1, ...state.globalSettings });

              // 同步布局缓存到 localStorage
              try {
                  const cache = JSON.parse(localStorage.getItem('ephone-layout-cache') || '{}');
                  cache.screenHeight = value;
                  localStorage.setItem('ephone-layout-cache', JSON.stringify(cache));
              } catch(e) { console.warn('Layout cache error', e); }
            });
          }
          if (phoneOffsetInput) {
            phoneOffsetInput.addEventListener("input", (e) => {
              const value = parseInt(e.target.value, 10);
              document.documentElement.style.setProperty(
                "--phone-offset",
                `${value}px`,
              );
              if (phoneOffsetValue) {
                phoneOffsetValue.textContent = `${value}px`;
              }
              state.globalSettings.phoneOffset = value;
              db.globalSettings.put({ id: 1, ...state.globalSettings });

              // 同步布局缓存到 localStorage
              try {
                  const cache = JSON.parse(localStorage.getItem('ephone-layout-cache') || '{}');
                  cache.phoneOffset = value;
                  localStorage.setItem('ephone-layout-cache', JSON.stringify(cache));
              } catch(e) { console.warn('Layout cache error', e); }
            });
          }

          if (resetPhoneSizeBtn) {
            resetPhoneSizeBtn.addEventListener("click", () => {
              const defaultWidth = 365;
              const defaultHeight = 680;
              const defaultOffset = 15;

              document.documentElement.style.setProperty(
                "--screen-width",
                `${defaultWidth}px`,
              );
              document.documentElement.style.setProperty(
                "--screen-height",
                `${defaultHeight}px`,
              );
              document.documentElement.style.setProperty(
                "--phone-offset",
                `${defaultOffset}px`,
              );

              if (screenWidthInput) {
                screenWidthInput.value = defaultWidth;
              }
              if (screenHeightInput) {
                screenHeightInput.value = defaultHeight;
              }
              if (phoneOffsetInput) {
                phoneOffsetInput.value = defaultOffset;
              }
              if (screenWidthValue) {
                screenWidthValue.textContent = `${defaultWidth}px`;
              }
              if (screenHeightValue) {
                screenHeightValue.textContent = `${defaultHeight}px`;
              }
              if (phoneOffsetValue) {
                phoneOffsetValue.textContent = `${defaultOffset}px`;
              }

              state.globalSettings.screenWidth = defaultWidth;
              state.globalSettings.screenHeight = defaultHeight;
              state.globalSettings.phoneOffset = defaultOffset;
              db.globalSettings.put({ id: 1, ...state.globalSettings });

              // 同步布局缓存到 localStorage (Reset)
              try {
                  const cache = {
                      screenWidth: defaultWidth,
                      screenHeight: defaultHeight,
                      phoneOffset: defaultOffset
                  };
                  localStorage.setItem('ephone-layout-cache', JSON.stringify(cache));
              } catch(e) { console.warn('Layout cache error', e); }

              showCustomAlert("提示", "已恢复默认尺寸");
            });
          }

          document
            .getElementById("wallpaper-upload-input")
            .addEventListener("change", async (event) => {
              const file = event.target.files[0];
              if (file) {
                const dataUrl = await new Promise((res, rej) => {
                  const reader = new FileReader();
                  reader.onload = () => res(reader.result);
                  reader.onerror = () => rej(reader.error);
                  reader.readAsDataURL(file);
                });
                newWallpaperBase64 = dataUrl;
                renderWallpaperScreen();
              }
            });
          document
            .getElementById("save-wallpaper-btn")
            .addEventListener("click", async () => {
              let changesMade = false;

              // 保存壁纸
              if (newWallpaperBase64) {
                state.globalSettings.wallpaper = newWallpaperBase64;
                changesMade = true;
              }

              const currentFrameColor = frameColorInput.value;
              // 如果是默认的白色（且不在夜间模式下），或者用户点了重置（我们需要一个标记），
              // 这里简化处理：如果用户选择了颜色，就保存。
              // 为了支持“重置”功能，我们检查 reset 按钮是否刚刚被点击过比较麻烦。
              // 更简单的逻辑：直接保存 input 的值。
              // 但是 reset 按钮清除了 style，input 还是显示 #ffffff。
              // 修正逻辑：如果当前 style.backgroundColor 为空（被重置了），则保存 null。
              // 否则保存 input 的值。
              if (
                document.getElementById("phone-frame").style.backgroundColor ===
                ""
              ) {
                state.globalSettings.phoneFrameColor = null;
              } else {
                state.globalSettings.phoneFrameColor = currentFrameColor;
              }

              // 【核心修改】保存图标设置（它已经在内存中了，我们只需要把整个globalSettings存起来）
              await db.globalSettings.put(state.globalSettings);

              // 应用所有更改
              if (changesMade) {
                applyGlobalWallpaper();
                newWallpaperBase64 = null;
              }
              applyGlobalWallpaper(); // 确保边框颜色被应用（因为 applyGlobalWallpaper 包含了边框逻辑）
              applyAppIcons(); // 重新应用所有图标

              showCustomAlert("提示", "外观设置已保存并应用！");
              showScreen("home-screen");
            });

          // API Config Event Listeners
          document
            .getElementById("add-new-config-btn")
            .addEventListener("click", () => openApiConfigEditor());
          document
            .getElementById("save-config-btn")
            .addEventListener("click", saveApiConfig);
          document
            .getElementById("cancel-config-editor-btn")
            .addEventListener("click", () => {
              document
                .getElementById("api-config-editor-modal")
                .classList.remove("visible");
            });

          document
            .getElementById("api-configs-list")
            .addEventListener("click", async (e) => {
              const target = e.target;
              const item = target.closest(".api-config-item");
              if (!item) return;
              const configId = parseInt(item.dataset.configId);

              if (target.classList.contains("edit-btn")) {
                openApiConfigEditor(configId);
              } else if (target.classList.contains("delete-btn")) {
                const confirmed = await showCustomConfirm(
                  "删除配置",
                  "确定要删除这个API配置吗？",
                  { confirmButtonClass: "btn-danger" },
                );
                if (confirmed) {
                  await db.apiConfigs.delete(configId);
                  state.apiConfigs = state.apiConfigs.filter(
                    (c) => c.id !== configId,
                  );
                  if (state.globalSettings.activeApiConfigId === configId) {
                    state.globalSettings.activeApiConfigId =
                      state.apiConfigs[0]?.id || null;
                    await db.globalSettings.put(state.globalSettings);
                  }
                  renderApiSettings();
                }
              } else if (target.type === "radio") {
                setActiveApiConfig(configId);
              }
            });

          document
            .getElementById("config-fetch-models-btn")
            .addEventListener("click", async () => {
              const url = document
                .getElementById("config-url-input")
                .value.trim();
              const key = document
                .getElementById("config-key-input")
                .value.trim();
              if (!url || !key) return showCustomAlert("提示", "请先填写反代地址和密钥");
              try {
                let isGemini = url === CONSTANTS.API.GEMINI_BASE_URL;
                const response = await fetch(
                  isGemini
                    ? `${CONSTANTS.API.GEMINI_BASE_URL}?key=${getRandomValue(key)}`
                    : `${url}/v1/models`,
                  isGemini
                    ? undefined
                    : { headers: { Authorization: `Bearer ${key}` } },
                );
                if (!response.ok) throw new Error("无法获取模型列表");
                const data = await response.json();
                let models = isGemini ? data.models : data.data;
                if (isGemini) {
                  models = models.map((model) => {
                    const parts = model.name.split("/");
                    return { id: parts.length > 1 ? parts[1] : model.name };
                  });
                }
                const modelList = document.getElementById(
                  "config-model-list",
                );
                modelList.innerHTML = "";
                models.forEach((model) => {
                  const option = document.createElement("option");
                  option.value = model.id;
                  modelList.appendChild(option);
                });
                showCustomAlert("提示", "模型列表已更新！");
              } catch (e) {
                console.error(e);
                showCustomAlert("提示", "获取模型失败: " + e.message);
              }
            });

          // Summary custom API - Fetch models button
          document
            .getElementById("summary-fetch-models-btn")
            .addEventListener("click", async () => {
              const url = document
                .getElementById("summary-custom-api-url")
                .value.trim();
              const key = document
                .getElementById("summary-custom-api-key")
                .value.trim();
              if (!url || !key) {
                showCustomAlert("提示", "请先填写API地址和密钥");
                return;
              }
              try {
                const isGemini =
                  url === CONSTANTS.API.GEMINI_BASE_URL;
                const response = await fetch(
                  isGemini ? `${url}?key=${key}` : `${url}/v1/models`,
                  isGemini
                    ? undefined
                    : { headers: { Authorization: `Bearer ${key}` } },
                );
                if (!response.ok) throw new Error("无法获取模型列表");
                const data = await response.json();
                let models = isGemini ? data.models : data.data;
                if (isGemini) {
                  models = models.map((model) => {
                    const parts = model.name.split("/");
                    return { id: parts.length > 1 ? parts[1] : model.name };
                  });
                }
                const modelList = document.getElementById("summary-model-list");
                modelList.innerHTML = "";
                models.forEach((model) => {
                  const option = document.createElement("option");
                  option.value = model.id;
                  modelList.appendChild(option);
                });
                showCustomAlert("提示", "模型列表已更新！");
              } catch (e) {
                console.error(e);
                showCustomAlert("提示", "获取模型失败: " + e.message);
              }
            });

          // Global Settings Auto-save
          document
            .getElementById("background-activity-switch")
            .addEventListener("change", async (e) => {
              state.globalSettings.enableBackgroundActivity = e.target.checked;
              await db.globalSettings.put(state.globalSettings);
            });
          document
            .getElementById("background-interval-input")
            .addEventListener("change", async (e) => {
              state.globalSettings.backgroundActivityInterval = parseInt(
                e.target.value,
              );
              await db.globalSettings.put(state.globalSettings);
            });
          document
            .getElementById("block-cooldown-input")
            .addEventListener("change", async (e) => {
              state.globalSettings.blockCooldownHours = parseFloat(
                e.target.value,
              );
              await db.globalSettings.put(state.globalSettings);
            });
          document
            .getElementById("role-activity-settings")
            .addEventListener("change", async (e) => {
              const target = e.target;
              if (target.tagName !== "INPUT" || target.type !== "checkbox")
                return;
              const chatId = target.dataset.chatId;
              const optionKey = target.dataset.activityOption;
              if (!chatId || !optionKey) return;
              const chat = state.chats[chatId];
              if (!chat) return;
              if (!chat.settings) chat.settings = {};
              const currentOptions = getBackgroundActivityOptions(chat);
              chat.settings.backgroundActivityOptions = {
                ...currentOptions,
                [optionKey]: target.checked,
              };
              await db.chats.put(chat);
            });
          document
            .getElementById("add-world-book-btn")
            .addEventListener("click", async () => {
              const name = await showCustomPrompt("创建世界书", "请输入书名");
              if (name && name.trim()) {
                const newBook = {
                  id: "wb_" + Date.now(),
                  name: name.trim(),
                  content: "",
                };
                await db.worldBooks.add(newBook);
                state.worldBooks.push(newBook);
                renderWorldBookScreen();
                openWorldBookEditor(newBook.id);
              }
            });
          document
            .getElementById("save-world-book-btn")
            .addEventListener("click", async () => {
              if (!editingWorldBookId) return;
              const book = state.worldBooks.find(
                (wb) => wb.id === editingWorldBookId,
              );
              if (book) {
                const newName = document
                  .getElementById("world-book-name-input")
                  .value.trim();
                if (!newName) {
                  showCustomAlert("提示", "书名不能为空！");
                  return;
                }
                book.name = newName;
                book.content = document.getElementById(
                  "world-book-content-input",
                ).value;

                const categoryId = document.getElementById(
                  "world-book-category-select",
                ).value;
                // 如果选择了“未分类”，存入 null；否则存入数字ID
                book.categoryId = categoryId ? parseInt(categoryId) : null;

                await db.worldBooks.put(book);
                document.getElementById("world-book-editor-title").textContent =
                  newName;
                editingWorldBookId = null;
                renderWorldBookScreen();
                showScreen("world-book-screen");
              }
            });
          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              const aiImage = e.target.closest(".ai-generated-image");
              if (aiImage) {
                const description = aiImage.dataset.description;
                if (description) showCustomAlert("照片描述", description);
                return;
              }
            });

          const chatSettingsScreen = document.getElementById(
            "chat-settings-screen",
          );
          const worldBookSelectBox = document.querySelector(
            ".custom-multiselect .select-box",
          );
          const worldBookCheckboxesContainer = document.getElementById(
            "world-book-checkboxes-container",
          );

          function updateWorldBookSelectionDisplay() {
            const checkedBoxes =
              worldBookCheckboxesContainer.querySelectorAll("input:checked");
            const displayText = document.querySelector(
              ".selected-options-text",
            );
            if (checkedBoxes.length === 0) {
              displayText.textContent = "-- 点击选择 --";
            } else if (checkedBoxes.length > 2) {
              displayText.textContent = `已选择 ${checkedBoxes.length} 项`;
            } else {
              displayText.textContent = Array.from(checkedBoxes)
                .map((cb) => cb.parentElement.textContent.trim())
                .join(", ");
            }
          }

          worldBookSelectBox.addEventListener("click", (e) => {
            e.stopPropagation();
            worldBookCheckboxesContainer.classList.toggle("visible");
            worldBookSelectBox.classList.toggle("expanded");
          });
          document
            .getElementById("world-book-checkboxes-container")
            .addEventListener("change", updateWorldBookSelectionDisplay);
          window.addEventListener("click", (e) => {
            if (
              !document.querySelector(".custom-multiselect").contains(e.target)
            ) {
              worldBookCheckboxesContainer.classList.remove("visible");
              worldBookSelectBox.classList.remove("expanded");
            }
          });

          document
            .getElementById("chat-settings-btn")
            .addEventListener("click", async () => {
              if (!state.activeChatId) return;
              const chat = state.chats[state.activeChatId];
              const isGroup = chat.isGroup;

              // --- Offline Mode Population ---
              const offlineSettings = chat.settings.offlineMode || {
                enabled: false,
                preset: "custom",
                prompt: "",
                style: "",
                novelai: false,
              };
              document.getElementById("offline-mode-toggle").checked =
                offlineSettings.enabled;
              document.getElementById("offline-mode-config").style.display =
                offlineSettings.enabled ? "block" : "none";

              const presetSelect = document.getElementById(
                "offline-preset-select",
              );
              presetSelect.innerHTML = "";
              Object.keys(offlinePresets).forEach((key) => {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = offlinePresets[key].name;
                if (offlineSettings.preset === key) option.selected = true;
                presetSelect.appendChild(option);
              });

              document.getElementById("offline-prompt-input").value =
                offlineSettings.prompt || "";
              document.getElementById("offline-style-input").value =
                offlineSettings.style || "";


              // Helper: Update inputs when preset changes
              presetSelect.onchange = () => {
                const val = presetSelect.value;
                if (offlinePresets[val] && val !== "custom") {
                  document.getElementById("offline-prompt-input").value =
                    offlinePresets[val].prompt;
                  document.getElementById("offline-style-input").value =
                    offlinePresets[val].style;
                }
              };

              // Bind offline mode toggle event listener (must be re-bound each time settings open)
              document
                .getElementById("offline-mode-toggle")
                .addEventListener("change", (e) => {
                  document.getElementById("offline-mode-config").style.display = e
                    .target.checked
                    ? "block"
                    : "none";
                });

              // --- 统一显示/隐藏控件 ---
              document.getElementById("chat-name-group").style.display =
                "block";
              document.getElementById("my-persona-group").style.display =
                "block";
              document.getElementById("my-avatar-group").style.display =
                "block";
              document.getElementById("my-group-nickname-group").style.display =
                isGroup ? "block" : "none";
              document.getElementById("group-avatar-group").style.display =
                isGroup ? "block" : "none";
              document.getElementById("group-members-group").style.display =
                isGroup ? "block" : "none";
              document.getElementById("ai-persona-group").style.display =
                isGroup ? "none" : "block";
              document.getElementById("ai-avatar-group").style.display = isGroup
                ? "none"
                : "block";
              // 【新增】控制AI备注输入框的显示
              document.getElementById("ai-remark-group").style.display = isGroup
                ? "none"
                : "block";

              // 【核心修改1】根据是否为群聊，显示或隐藏“好友分组”区域
              document.getElementById("assign-group-section").style.display =
                isGroup ? "none" : "block";

              // --- 加载表单数据 ---
              document.getElementById("chat-name-input").value = chat.name;
              // 【新增】加载AI备注
              document.getElementById("ai-remark-input").value =
                chat.settings.aiRemark || "";

              // --- Load Bubble Settings UI ---
              // Initialize the new bubble settings UI
              initBubbleSettingsUI(state.activeChatId);
              
              const videoCallSettingsGroup = document.getElementById(
                "video-call-settings-group",
              );

              if (isGroup) {
                videoCallSettingsGroup.style.display = "none";
              } else {
                videoCallSettingsGroup.style.display = "block";

                const voiceAccessSwitch = document.getElementById(
                  "video-call-voice-access-switch",
                );
                if (voiceAccessSwitch) {
                  voiceAccessSwitch.checked =
                    chat.settings.videoCallVoiceAccess || false;
                }
              }
              const realCameraSwitch = document.getElementById(
                "user-real-camera-switch",
              );
              if (realCameraSwitch) {
                realCameraSwitch.checked = chat.settings.useRealCamera || false;
              }

              document.getElementById("my-persona").value =
                chat.settings.myPersona;
              document.getElementById("my-avatar-preview").src =
                chat.settings.myAvatar ||
                (isGroup ? defaultMyGroupAvatar : defaultAvatar);
              document.getElementById("max-memory").value =
                chat.settings.maxMemory;
              const bgPreview = document.getElementById("bg-preview");
              const removeBgBtn = document.getElementById("remove-bg-btn");
              if (chat.settings.background) {
                bgPreview.src = chat.settings.background;
                bgPreview.style.display = "block";
                removeBgBtn.style.display = "inline-block";
              } else {
                bgPreview.style.display = "none";
                removeBgBtn.style.display = "none";
              }

              if (isGroup) {
                document.getElementById("my-group-nickname-input").value =
                  chat.settings.myNickname || "";
                document.getElementById("group-avatar-preview").src =
                  chat.settings.groupAvatar || defaultGroupAvatar;
                renderGroupMemberSettings(chat.members);
              } else {
                document.getElementById("ai-persona").value =
                  chat.settings.aiPersona;
                document.getElementById("ai-avatar-preview").src =
                  chat.settings.aiAvatar || defaultAvatar;

                // 【核心修改2】如果是单聊，就加载分组列表到下拉框
                const select = document.getElementById("assign-group-select");
                select.innerHTML = '<option value="">未分组</option>'; // 清空并设置默认选项
                const groups = await db.qzoneGroups.toArray();
                groups.forEach((group) => {
                  const option = document.createElement("option");
                  option.value = group.id;
                  option.textContent = group.name;
                  // 如果当前好友已经有分组，就默认选中它
                  if (chat.groupId === group.id) {
                    option.selected = true;
                  }
                  select.appendChild(option);
                });
              }

              // 加载世界书

              const worldBookCheckboxesContainer = document.getElementById(
                "world-book-checkboxes-container",
              );
              worldBookCheckboxesContainer.innerHTML = "";
              const linkedIds = new Set(chat.settings.linkedWorldBookIds || []);

              // 1. 获取所有分类和世界书
              const categories = await db.worldBookCategories.toArray();
              const books = state.worldBooks;

              // 【核心改造】如果存在未分类的书籍，就创建一个“虚拟分类”
              const hasUncategorized = books.some((book) => !book.categoryId);
              if (hasUncategorized) {
                categories.push({ id: "uncategorized", name: "未分类" });
              }

              // 2. 将书籍按分类ID进行分组
              const booksByCategoryId = books.reduce((acc, book) => {
                const categoryId = book.categoryId || "uncategorized";
                if (!acc[categoryId]) {
                  acc[categoryId] = [];
                }
                acc[categoryId].push(book);
                return acc;
              }, {});

              // 3. 遍历分类，创建带折叠功能的列表
              categories.forEach((category) => {
                const booksInCategory = booksByCategoryId[category.id] || [];
                if (booksInCategory.length > 0) {
                  const allInCategoryChecked = booksInCategory.every((book) =>
                    linkedIds.has(book.id),
                  );

                  const header = document.createElement("div");
                  header.className = "wb-category-header";
                  header.innerHTML = `
                  <input type="checkbox" class="wb-category-checkbox" data-category-id="${
                    category.id
                  }" ${allInCategoryChecked ? "checked" : ""}>
                  <span>${category.name}</span>
              `;

                  const bookContainer = document.createElement("div");
                  bookContainer.className = "wb-book-container";
                  bookContainer.dataset.containerFor = category.id;

                  booksInCategory.forEach((book) => {
                    const isChecked = linkedIds.has(book.id);
                    const label = document.createElement("label");
                    label.innerHTML = `<input type="checkbox" class="wb-book-checkbox" value="${
                      book.id
                    }" data-parent-category="${category.id}" ${
                      isChecked ? "checked" : ""
                    }> ${book.name}`;
                    bookContainer.appendChild(label);
                  });

                  // --- ★ 核心修改 #1 在这里 ★ ---
                  // 默认将分类设置为折叠状态
                  header.classList.add("collapsed");
                  bookContainer.classList.add("collapsed");
                  // --- ★ 修改结束 ★ ---

                  worldBookCheckboxesContainer.appendChild(header);
                  worldBookCheckboxesContainer.appendChild(bookContainer);
                }
              });

              updateWorldBookSelectionDisplay(); // 更新顶部的已选数量显示

              // 加载总结设置
              if (chat.settings.summary) {
                const summarySettings = chat.settings.summary;
                document.getElementById("summary-toggle").checked =
                  summarySettings.enabled;
                const modeRadios = document.getElementsByName("summary-mode");
                for (const radio of modeRadios) {
                  if (radio.value === summarySettings.mode) {
                    radio.checked = true;
                    break;
                  }
                }
                document.getElementById("summary-count-input").value =
                  summarySettings.count;
                // 显示/隐藏详细选项
                document.getElementById("summary-options").style.display =
                  summarySettings.enabled ? "block" : "none";
                
                // 加载自定义API设置
                document.getElementById("summary-custom-api-toggle").checked =
                  summarySettings.useCustomApi || false;
                document.getElementById("summary-custom-api-url").value =
                  summarySettings.customApiUrl || "";
                document.getElementById("summary-custom-api-key").value =
                  summarySettings.customApiKey || "";
                document.getElementById("summary-stream-toggle").checked =
                  summarySettings.enableStream || false;
                
                // 填充模型下拉框
                const summaryModelSelect = document.getElementById("summary-custom-model-select");
                summaryModelSelect.innerHTML = "";
                if (summarySettings.customModel) {
                  const option = document.createElement("option");
                  option.value = summarySettings.customModel;
                  option.textContent = summarySettings.customModel;
                  summaryModelSelect.appendChild(option);
                }
                
                // 根据toggle状态显示/隐藏自定义API选项
                const summaryCustomApiOptions = document.getElementById("summary-custom-api-options");
                summaryCustomApiOptions.style.display = summarySettings.useCustomApi ? "flex" : "none";
              }

              // 使用事件委托来处理所有点击和勾选事件，效率更高
              worldBookCheckboxesContainer.addEventListener("click", (e) => {
                const header = e.target.closest(".wb-category-header");
                if (header && !e.target.matches('input[type="checkbox"]')) {
                  const categoryId = header.querySelector(
                    ".wb-category-checkbox",
                  )?.dataset.categoryId;
                  // 【修改】现在 categoryId 可能是数字，也可能是 "uncategorized" 字符串，所以这个判断能通过了！
                  if (categoryId) {
                    // <-- 把原来的 !categoryId return; 改成这样
                    const bookContainer =
                      worldBookCheckboxesContainer.querySelector(
                        `.wb-book-container[data-container-for="${categoryId}"]`,
                      );
                    if (bookContainer) {
                      header.classList.toggle("collapsed");
                      bookContainer.classList.toggle("collapsed");
                    }
                  }
                }
              });

              worldBookCheckboxesContainer.addEventListener("change", (e) => {
                const target = e.target;

                // 如果点击的是分类的“全选”复选框
                if (target.classList.contains("wb-category-checkbox")) {
                  const categoryId = target.dataset.categoryId;
                  const isChecked = target.checked;
                  // 找到这个分类下的所有书籍复选框，并将它们的状态设置为与分类复选框一致
                  const bookCheckboxes =
                    worldBookCheckboxesContainer.querySelectorAll(
                      `input.wb-book-checkbox[data-parent-category="${categoryId}"]`,
                    );
                  bookCheckboxes.forEach((cb) => (cb.checked = isChecked));
                }

                // 如果点击的是单个书籍的复选框
                if (target.classList.contains("wb-book-checkbox")) {
                  const categoryId = target.dataset.parentCategory;
                  if (categoryId) {
                    // 检查它是否属于一个分类
                    const categoryCheckbox =
                      worldBookCheckboxesContainer.querySelector(
                        `input.wb-category-checkbox[data-category-id="${categoryId}"]`,
                      );
                    const allBookCheckboxes =
                      worldBookCheckboxesContainer.querySelectorAll(
                        `input.wb-book-checkbox[data-parent-category="${categoryId}"]`,
                      );
                    // 检查该分类下是否所有书籍都被选中了
                    const allChecked = Array.from(allBookCheckboxes).every(
                      (cb) => cb.checked,
                    );
                    // 同步分类“全选”复选框的状态
                    categoryCheckbox.checked = allChecked;
                  }
                }

                // 每次变更后都更新顶部的已选数量显示
                updateWorldBookSelectionDisplay();
              });

              // 加载并更新字体大小控件
              const fontSizeSlider =
                document.getElementById("font-size-slider");
              fontSizeSlider.value = chat.settings.fontSize || 13;
              document.getElementById("font-size-value").textContent =
                `${fontSizeSlider.value}px`;
              const customCssInput =
                document.getElementById("custom-css-input");
              customCssInput.value = chat.settings.customCss || "";

              updateSettingsPreview();
              
              // Add event listener for custom API toggle (only add once)
              const summaryCustomApiToggle = document.getElementById("summary-custom-api-toggle");
              summaryCustomApiToggle.removeEventListener("change", handleSummaryCustomApiToggle); // Remove if exists
              summaryCustomApiToggle.addEventListener("change", handleSummaryCustomApiToggle);
              
              showScreen('chat-settings-screen');
              // 可选：添加视差效果
              DOM.get('chat-interface-screen').classList.add('settings-open');
            });
          
          // Chat settings back button
          document
            .getElementById("chat-settings-back-btn")
            .addEventListener("click", () => {
              DOM.get('chat-interface-screen').classList.remove('settings-open');
              showScreen("chat-interface-screen");
            });
          
          function handleSummaryCustomApiToggle(e) {
            const options = document.getElementById("summary-custom-api-options");
            options.style.display = e.target.checked ? "flex" : "none";
          }

          function renderGroupMemberSettings(members) {
            const container = document.getElementById("group-members-settings");
            container.innerHTML = "";
            members.forEach((member) => {
              const div = document.createElement("div");
              div.className = "member-editor";
              div.dataset.memberId = member.id;
              // ★★★【核心重构】★★★
              // 显示的是 groupNickname
              div.innerHTML = `<img src="${member.avatar}" alt="${member.groupNickname}"><div class="member-name">${member.groupNickname}</div>`;
              div.addEventListener("click", () => openMemberEditor(member.id));
              container.appendChild(div);
            });
          }

          function openMemberEditor(memberId) {
            editingMemberId = memberId;
            const chat = state.chats[state.activeChatId];
            const member = chat.members.find((m) => m.id === memberId);
            document.getElementById("member-name-input").value =
              member.groupNickname;
            document.getElementById("member-persona-input").value =
              member.persona;
            document.getElementById("member-avatar-preview").src =
              member.avatar;
            document
              .getElementById("member-settings-modal")
              .classList.add("visible");
          }
          document
            .getElementById("cancel-member-settings-btn")
            .addEventListener("click", () => {
              document
                .getElementById("member-settings-modal")
                .classList.remove("visible");
              editingMemberId = null;
            });
          document
            .getElementById("save-member-settings-btn")
            .addEventListener("click", () => {
              if (!editingMemberId) return;
              const chat = state.chats[state.activeChatId];
              const member = chat.members.find((m) => m.id === editingMemberId);

              // ★★★【核心重构】★★★
              const newNickname = document
                .getElementById("member-name-input")
                .value.trim();
              if (!newNickname) {
                showCustomAlert("提示", "群昵称不能为空！");
                return;
              }
              member.groupNickname = newNickname; // 只修改群昵称
              member.persona = document.getElementById(
                "member-persona-input",
              ).value;
              member.avatar = document.getElementById(
                "member-avatar-preview",
              ).src;

              renderGroupMemberSettings(chat.members);
              document
                .getElementById("member-settings-modal")
                .classList.remove("visible");
            });
          document
            .getElementById("cancel-chat-settings-btn")
            .addEventListener("click", () => {
              DOM.get('chat-interface-screen').classList.remove('settings-open');
              showScreen('chat-interface-screen');
            });

          document
            .getElementById("save-chat-settings-btn")
            .addEventListener("click", async () => {
              if (!state.activeChatId) return;
              const chat = state.chats[state.activeChatId];
              const newName = document
                .getElementById("chat-name-input")
                .value.trim();
              if (!newName) return showCustomAlert("提示", "备注名/群名不能为空！");
              chat.name = newName;

              chat.settings.fontSize = parseInt(
                document.getElementById("font-size-slider").value,
              );
              chat.settings.customCss = document
                .getElementById("custom-css-input")
                .value.trim();

              const userBubbleColorValue =
                (document.querySelector("#user-bubble-color-picker")?.value || "").trim();
              const aiBubbleColorValue =
                (document.querySelector("#ai-bubble-color-picker")?.value || "").trim();

              chat.settings.userBubbleColor = userBubbleColorValue || null;
              chat.settings.aiBubbleColor = aiBubbleColorValue || null;

              chat.settings.myPersona =
                document.getElementById("my-persona").value;
              chat.settings.myAvatar =
                document.getElementById("my-avatar-preview").src;
              const checkedBooks = document.querySelectorAll(
                "#world-book-checkboxes-container input.wb-book-checkbox:checked",
              );
              chat.settings.linkedWorldBookIds = Array.from(checkedBooks).map(
                (cb) => cb.value,
              );

              if (chat.isGroup) {
                chat.settings.myNickname = document
                  .getElementById("my-group-nickname-input")
                  .value.trim();
                chat.settings.groupAvatar = document.getElementById(
                  "group-avatar-preview",
                ).src;
              } else {
                chat.settings.aiPersona =
                  document.getElementById("ai-persona").value;
                chat.settings.aiAvatar =
                  document.getElementById("ai-avatar-preview").src;
                // 【新增】保存AI备注
                chat.settings.aiRemark = document
                  .getElementById("ai-remark-input")
                  .value.trim();

                const selectedGroupId = document.getElementById(
                  "assign-group-select",
                ).value;
                chat.groupId = selectedGroupId
                  ? parseInt(selectedGroupId)
                  : null;
              }

              chat.settings.maxMemory =
                parseInt(document.getElementById("max-memory").value) || 10;

              const voiceAccessSwitchSave = document.getElementById(
                "video-call-voice-access-switch",
              );
              if (voiceAccessSwitchSave) {
                chat.settings.videoCallVoiceAccess =
                  voiceAccessSwitchSave.checked;
              }

              // 保存总结设置

              if (!chat.settings.summary) chat.settings.summary = {}; // 防止意外
              chat.settings.summary.enabled =
                document.getElementById("summary-toggle").checked;
              const selectedModeRadio = document.querySelector(
                'input[name="summary-mode"]:checked',
              );
              chat.settings.summary.mode = selectedModeRadio
                ? selectedModeRadio.value
                : "manual";
              chat.settings.summary.count =
                parseInt(
                  document.getElementById("summary-count-input").value,
                ) || 50;

              // Save custom API settings for summary
              // Save custom API settings for summary
              if (!chat.settings.summary) chat.settings.summary = {}; // Ensure summary exists
              chat.settings.summary.useCustomApi = document.getElementById(
                "summary-custom-api-toggle",
              ).checked;
              chat.settings.summary.customApiUrl = document
                .getElementById("summary-custom-api-url")
                .value.trim();
              chat.settings.summary.customApiKey = document
                .getElementById("summary-custom-api-key")
                .value.trim();
              chat.settings.summary.customModel =
                document.getElementById("summary-custom-model-select").value ||
                "gpt-4o-mini";
              chat.settings.summary.enableStream = document.getElementById(
                "summary-stream-toggle",
              ).checked;

              // Save Offline Mode
              chat.settings.offlineMode = {
                enabled: document.getElementById("offline-mode-toggle").checked,
                preset: document.getElementById("offline-preset-select").value,
                prompt: document.getElementById("offline-prompt-input").value,
                style: document.getElementById("offline-style-input").value,
              };
              await db.chats.put(chat);

              applyScopedCss(
                chat.settings.customCss,
                "#chat-messages",
                "custom-bubble-style",
              );

              DOM.get('chat-interface-screen').classList.remove('settings-open');
              showScreen('chat-interface-screen');
              renderChatInterface(state.activeChatId);
              renderChatList();
            });

          document
            .getElementById("summary-toggle")
            .addEventListener("change", (e) => {
              document.getElementById("summary-options").style.display = e
                .target.checked
                ? "block"
                : "none";
            });

          document
            .getElementById("manual-summary-btn")
            .addEventListener("click", async () => {
              if (!state.activeChatId) return;
              const chat = state.chats[state.activeChatId];
              if (!chat) return;

              const summarySettings = chat.settings?.summary || { lastSummaryIndex: -1 };
              const lastSummaryIndex =
                summarySettings.lastSummaryIndex > -1
                  ? summarySettings.lastSummaryIndex
                  : 0;
              const messagesToCheck = chat.history.slice(lastSummaryIndex + 1);
              const filteredMessages = messagesToCheck.filter(
                (msg) => msg.type !== "summary",
              );

              if (filteredMessages.length === 0) {
                await showCustomAlert(
                  "无需总结",
                  "自上次总结以来没有新的对话内容。",
                );
                return;
              }

              // 关闭设置屏幕
              DOM.get('chat-interface-screen').classList.remove('settings-open');
              showScreen('chat-interface-screen');

              await showCustomAlert(
                "开始总结",
                "正在为当前对话生成总结...",
              );
              const summaryText = await generateSummary(state.activeChatId);
              if (summaryText) {
                await saveSummaryAsMemory(state.activeChatId, summaryText);
                await showCustomAlert(
                  "总结完成",
                  "新的总结已保存到对话记忆中。",
                );
              }
            });
          document
            .getElementById("clear-chat-btn")
            .addEventListener("click", async () => {
              if (!state.activeChatId) return;
              const chat = state.chats[state.activeChatId];
              const confirmed = await showCustomConfirm(
                "清空聊天记录",
                "此操作将永久删除此聊天的所有消息，无法恢复。确定要清空吗？",
                { confirmButtonClass: "btn-danger" },
              );
              if (confirmed) {
                chat.history = [];
                await db.chats.put(chat);
                renderChatInterface(state.activeChatId);
                renderChatList();
                chatSettingsModal.classList.remove("visible");
              }
            });

          const setupFileUpload = (inputId, callback) => {
            document
              .getElementById(inputId)
              .addEventListener("change", async (event) => {
                const file = event.target.files[0];
                if (file) {
                  const dataUrl = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result);
                    reader.onerror = () => rej(reader.error);
                    reader.readAsDataURL(file);
                  });
                  callback(dataUrl);
                  event.target.value = null;
                }
              });
          };
          setupFileUpload(
            "ai-avatar-input",
            (base64) =>
              (document.getElementById("ai-avatar-preview").src = base64),
          );
          setupFileUpload(
            "my-avatar-input",
            (base64) =>
              (document.getElementById("my-avatar-preview").src = base64),
          );
          setupFileUpload(
            "group-avatar-input",
            (base64) =>
              (document.getElementById("group-avatar-preview").src = base64),
          );
          setupFileUpload(
            "member-avatar-input",
            (base64) =>
              (document.getElementById("member-avatar-preview").src = base64),
          );
          setupFileUpload("bg-input", (base64) => {
            if (state.activeChatId) {
              state.chats[state.activeChatId].settings.background = base64;
              const bgPreview = document.getElementById("bg-preview");
              bgPreview.src = base64;
              bgPreview.style.display = "block";
              document.getElementById("remove-bg-btn").style.display =
                "inline-block";
            }
          });
          setupFileUpload(
            "preset-avatar-input",
            (base64) =>
              (document.getElementById("preset-avatar-preview").src = base64),
          );
          document
            .getElementById("remove-bg-btn")
            .addEventListener("click", () => {
              if (state.activeChatId) {
                state.chats[state.activeChatId].settings.background = "";
                const bgPreview = document.getElementById("bg-preview");
                bgPreview.src = "";
                bgPreview.style.display = "none";
                document.getElementById("remove-bg-btn").style.display = "none";
              }
            });

          const stickerPanel = document.getElementById("sticker-panel");
          document
            .getElementById("open-sticker-panel-btn")
            .addEventListener("click", () => {
              renderStickerPanel();
              stickerPanel.classList.add("visible");
            });
          document
            .getElementById("close-sticker-panel-btn")
            .addEventListener("click", () =>
              stickerPanel.classList.remove("visible"),
            );
          document
            .getElementById("add-sticker-btn")
            .addEventListener("click", async () => {
              const url = await showCustomPrompt(
                "添加表情(URL)",
                "请输入表情包的图片URL",
              );
              if (!url || !url.trim().startsWith("http"))
                return url && showCustomAlert("提示", "请输入有效的URL (以http开头)");
              const name = await showCustomPrompt(
                "命名表情",
                "请为这个表情命名 (例如：开心、疑惑)",
              );
              if (name && name.trim()) {
                const newSticker = {
                  id: "sticker_" + Date.now(),
                  url: url.trim(),
                  name: name.trim(),
                };
                await db.userStickers.add(newSticker);
                state.userStickers.push(newSticker);
                renderStickerPanel();
              } else if (name !== null) showCustomAlert("提示", "表情名不能为空！");
            });
          document
            .getElementById("upload-sticker-btn")
            .addEventListener("click", () =>
              document.getElementById("sticker-upload-input").click(),
            );
          document
            .getElementById("sticker-upload-input")
            .addEventListener("change", async (event) => {
              const file = event.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = async () => {
                const base64Url = reader.result;
                const name = await showCustomPrompt(
                  "命名表情",
                  "请为这个表情命名 (例如：好耶、疑惑)",
                );
                if (name && name.trim()) {
                  const newSticker = {
                    id: "sticker_" + Date.now(),
                    url: base64Url,
                    name: name.trim(),
                  };
                  await db.userStickers.add(newSticker);
                  state.userStickers.push(newSticker);
                  renderStickerPanel();
                } else if (name !== null) showCustomAlert("提示", "表情名不能为空！");
              };
              event.target.value = null;
            });

          document
            .getElementById("upload-image-btn")
            .addEventListener("click", () =>
              document.getElementById("image-upload-input").click(),
            );
          document
            .getElementById("image-upload-input")
            .addEventListener("change", async (event) => {
              const file = event.target.files[0];
              if (!file || !state.activeChatId) return;
              const reader = new FileReader();
              reader.onload = async (e) => {
                const base64Url = e.target.result;
                const chat = state.chats[state.activeChatId];
                const msg = {
                  role: CONSTANTS.ROLES.USER,
                  content: [
                    { type: "image_url", image_url: { url: base64Url } },
                  ],
                  timestamp: Date.now(),
                };
                if (chat.settings?.offlineMode?.enabled) {
                  msg.isOfflineMode = true;
                }
                chat.history.push(msg);
                await db.chats.put(chat);
                appendMessage(msg, chat);
                renderChatList();
              };
              reader.readAsDataURL(file);
              event.target.value = null;
            });
          document
            .getElementById("voice-message-btn")
            .addEventListener("click", async () => {
              if (!state.activeChatId) return;
              const text = await showCustomPrompt(
                "发送语音",
                "请输入你想说的内容：",
              );
              if (text && text.trim()) {
                const chat = state.chats[state.activeChatId];
                const msg = {
                  role: CONSTANTS.ROLES.USER,
                  type: CONSTANTS.MSG_TYPES.VOICE,
                  content: text.trim(),
                  timestamp: Date.now(),
                };
                if (chat.settings?.offlineMode?.enabled) {
                  msg.isOfflineMode = true;
                }
                chat.history.push(msg);
                await db.chats.put(chat);
                appendMessage(msg, chat);
                renderChatList();
              }
            });
          document
            .getElementById("send-photo-btn")
            .addEventListener("click", async () => {
              if (!state.activeChatId) return;
              const description = await showCustomPrompt(
                "发送照片",
                "请用文字描述您要发送的照片：",
              );
              if (description && description.trim()) {
                const chat = state.chats[state.activeChatId];
                const msg = {
                  role: CONSTANTS.ROLES.USER,
                  type: "user_photo",
                  content: description.trim(),
                  timestamp: Date.now(),
                };
                if (chat.settings?.offlineMode?.enabled) {
                  msg.isOfflineMode = true;
                }
                chat.history.push(msg);
                await db.chats.put(chat);
                appendMessage(msg, chat);
                renderChatList();
              }
            });

          const waimaiModal = document.getElementById("waimai-request-modal");
          document
            .getElementById("send-waimai-request-btn")
            .addEventListener("click", () => {
              waimaiModal.classList.add("visible");
            });

          document
            .getElementById("waimai-cancel-btn")
            .addEventListener("click", () => {
              waimaiModal.classList.remove("visible");
            });

          document
            .getElementById("waimai-confirm-btn")
            .addEventListener("click", async () => {
              if (!state.activeChatId) return;

              const productInfoInput = document.getElementById(
                "waimai-product-info",
              );
              const amountInput = document.getElementById("waimai-amount");

              const productInfo = productInfoInput.value.trim();
              const amount = parseFloat(amountInput.value);

              if (!productInfo) {
                showCustomAlert("提示", "请输入商品信息！");
                return;
              }
              if (isNaN(amount) || amount <= 0) {
                showCustomAlert("提示", "请输入有效的代付金额！");
                return;
              }

              const chat = state.chats[state.activeChatId];
              const now = Date.now();

              // 【核心修正】在这里获取用户自己的昵称
              const myNickname = chat.isGroup
                ? chat.settings.myNickname || "我"
                : "我";

              const msg = {
                role: CONSTANTS.ROLES.USER,
                // 【核心修正】将获取到的昵称，作为 senderName 添加到消息对象中
                senderName: myNickname,
                type: "waimai_request",
                productInfo: productInfo,
                amount: amount,
                status: "pending",
                countdownEndTime: now + 15 * 60 * 1000,
                timestamp: now,
              };
              if (chat.settings?.offlineMode?.enabled) {
                msg.isOfflineMode = true;
              }

              chat.history.push(msg);
              await db.chats.put(chat);
              appendMessage(msg, chat);
              renderChatList();

              productInfoInput.value = "";
              amountInput.value = "";
              waimaiModal.classList.remove("visible");
            });
          document
            .getElementById("open-persona-library-btn")
            .addEventListener("click", openPersonaLibrary);
          document
            .getElementById("close-persona-library-btn")
            .addEventListener("click", closePersonaLibrary);
          document
            .getElementById("add-persona-preset-btn")
            .addEventListener("click", openPersonaEditorForCreate);
          document
            .getElementById("cancel-persona-editor-btn")
            .addEventListener("click", closePersonaEditor);
          document
            .getElementById("save-persona-preset-btn")
            .addEventListener("click", savePersonaPreset);
          document
            .getElementById("preset-action-edit")
            .addEventListener("click", openPersonaEditorForEdit);
          document
            .getElementById("preset-action-delete")
            .addEventListener("click", deletePersonaPreset);
          document
            .getElementById("preset-action-cancel")
            .addEventListener("click", hidePresetActions);

          document
            .getElementById("selection-cancel-btn")
            .addEventListener("click", exitSelectionMode);

          document
            .getElementById("selection-delete-btn")
            .addEventListener("click", async () => {
              if (selectedMessages.size === 0) return;
              const confirmed = await showCustomConfirm(
                "删除消息",
                `确定要删除选中的 ${selectedMessages.size} 条消息吗？这将改变AI的记忆。`,
                { confirmButtonClass: "btn-danger" },
              );
              if (confirmed) {
                const chat = state.chats[state.activeChatId];

                // 1. 【核心加强】在删除前，检查被删除的消息中是否包含投票
                let deletedPollsInfo = [];
                for (const timestamp of selectedMessages) {
                  const msg = chat.history.find(
                    (m) => m.timestamp === timestamp,
                  );
                  if (msg && msg.type === "poll") {
                    deletedPollsInfo.push(
                      `关于“${msg.question}”的投票(时间戳: ${msg.timestamp})`,
                    );
                  }
                }

                // 2. 更新后端的历史记录
                chat.history = chat.history.filter(
                  (msg) => !selectedMessages.has(msg.timestamp),
                );

                // 3. 【核心加强】构建更具体的“遗忘指令”
                let forgetReason = "一些之前的消息已被用户删除。";
                if (deletedPollsInfo.length > 0) {
                  forgetReason += ` 其中包括以下投票：${deletedPollsInfo.join(
                    "；",
                  )}。`;
                }
                forgetReason +=
                  " 你应该像它们从未存在过一样继续对话，并相应地调整你的记忆和行为，不要再提及这些被删除的内容。";

                const forgetInstruction = {
                  role: CONSTANTS.ROLES.SYSTEM,
                  content: `[系统提示：${forgetReason}]`,
                  timestamp: Date.now(),
                  isHidden: true,
                };
                chat.history.push(forgetInstruction);

                // 4. 将包含“遗忘指令”的、更新后的chat对象存回数据库
                await db.chats.put(chat);

                // 5. 最后才更新UI
                renderChatInterface(state.activeChatId);
                renderChatList();
              }
            });

          const fontUrlInput = document.getElementById("font-url-input");
          fontUrlInput.addEventListener("input", () =>
            applyCustomFont(fontUrlInput.value.trim(), true),
          );
          document
            .getElementById("save-font-btn")
            .addEventListener("click", async () => {
              const newFontUrl = fontUrlInput.value.trim();
              if (!newFontUrl) {
                showCustomAlert("提示", "请输入有效的字体URL。");
                return;
              }
              applyCustomFont(newFontUrl, false);
              state.globalSettings.fontUrl = newFontUrl;
              await db.globalSettings.put(state.globalSettings);
              showCustomAlert("提示", "字体已保存并应用！");
            });
          document
            .getElementById("reset-font-btn")
            .addEventListener("click", resetToDefaultFont);

          document
            .querySelectorAll("#chat-list-bottom-nav .nav-item")
            .forEach((item) => {
              item.addEventListener("click", () =>
                switchToChatListView(item.dataset.view),
              );
            });
          document
            .getElementById("qzone-back-btn")
            .addEventListener("click", () =>
              switchToChatListView("messages-view"),
            );
          document
            .getElementById("qzone-nickname")
            .addEventListener("click", async () => {
              const newNickname = await showCustomPrompt(
                "修改昵称",
                "请输入新的昵称",
                state.qzoneSettings.nickname,
              );
              if (newNickname && newNickname.trim()) {
                state.qzoneSettings.nickname = newNickname.trim();
                await saveQzoneSettings();
                renderQzoneScreen();
              }
            });
          document
            .getElementById("qzone-avatar-container")
            .addEventListener("click", () =>
              document.getElementById("qzone-avatar-input").click(),
            );
          document
            .getElementById("qzone-banner-container")
            .addEventListener("click", () =>
              document.getElementById("qzone-banner-input").click(),
            );
          document
            .getElementById("qzone-avatar-input")
            .addEventListener("change", async (event) => {
              const file = event.target.files[0];
              if (file) {
                const dataUrl = await new Promise((res) => {
                  const reader = new FileReader();
                  reader.onload = () => res(reader.result);
                  reader.readAsDataURL(file);
                });
                state.qzoneSettings.avatar = dataUrl;
                await saveQzoneSettings();
                renderQzoneScreen();
              }
              event.target.value = null;
            });
          document
            .getElementById("qzone-banner-input")
            .addEventListener("change", async (event) => {
              const file = event.target.files[0];
              if (file) {
                const dataUrl = await new Promise((res) => {
                  const reader = new FileReader();
                  reader.onload = () => res(reader.result);
                  reader.readAsDataURL(file);
                });
                state.qzoneSettings.banner = dataUrl;
                await saveQzoneSettings();
                renderQzoneScreen();
              }
              event.target.value = null;
            });

          document
            .getElementById("create-shuoshuo-btn")
            .addEventListener("click", async () => {
              // 1. 重置并获取模态框
              resetCreatePostModal();
              const modal = document.getElementById("create-post-modal");

              // 2. 设置为“说说”模式
              modal.dataset.mode = "shuoshuo";

              // 3. 隐藏与图片/文字图相关的部分
              modal.querySelector(".post-mode-switcher").style.display = "none";
              modal.querySelector("#image-mode-content").style.display = "none";
              modal.querySelector("#text-image-mode-content").style.display =
                "none";

              // 4. 修改主输入框的提示语，使其更符合“说说”的场景
              modal.querySelector("#post-public-text").placeholder =
                "分享新鲜事...";

              // 5. 准备并显示模态框
              const visibilityGroupsContainer = document.getElementById(
                "post-visibility-groups",
              );
              visibilityGroupsContainer.innerHTML = "";
              const groups = await db.qzoneGroups.toArray();
              if (groups.length > 0) {
                groups.forEach((group) => {
                  const label = document.createElement("label");
                  label.style.display = "block";
                  label.innerHTML = `<input type="checkbox" name="visibility_group" value="${group.id}"> ${group.name}`;
                  visibilityGroupsContainer.appendChild(label);
                });
              } else {
                visibilityGroupsContainer.innerHTML =
                  '<p style="color: var(--text-secondary);">没有可用的分组</p>';
              }
              modal.classList.add("visible");
            });

          document
            .getElementById("create-post-btn")
            .addEventListener("click", async () => {
              resetCreatePostModal();
              const modal = document.getElementById("create-post-modal");

              modal.dataset.mode = "complex";

              modal.querySelector(".post-mode-switcher").style.display = "flex";

              modal.querySelector("#image-mode-content").style.display = "";
              modal.querySelector("#text-image-mode-content").style.display =
                "";

              modal
                .querySelector("#image-mode-content")
                .classList.add("active");
              modal
                .querySelector("#text-image-mode-content")
                .classList.remove("active");

              modal.querySelector("#post-public-text").placeholder =
                "分享新鲜事...（非必填的公开文字）";

              const visibilityGroupsContainer = document.getElementById(
                "post-visibility-groups",
              );
              visibilityGroupsContainer.innerHTML = "";
              const groups = await db.qzoneGroups.toArray();
              if (groups.length > 0) {
                groups.forEach((group) => {
                  const label = document.createElement("label");
                  label.style.display = "block";
                  label.innerHTML = `<input type="checkbox" name="visibility_group" value="${group.id}"> ${group.name}`;
                  visibilityGroupsContainer.appendChild(label);
                });
              } else {
                visibilityGroupsContainer.innerHTML =
                  '<p style="color: var(--text-secondary);">没有可用的分组</p>';
              }
              modal.classList.add("visible");
            });
          document
            .getElementById("open-album-btn")
            .addEventListener("click", async () => {
              await renderAlbumList();
              showScreen("album-screen");
            });
          document
            .getElementById("album-back-btn")
            .addEventListener("click", () => {
              showScreen("chat-list-screen");
              switchToChatListView("qzone-screen");
            });

          // --- ↓↓↓ 从这里开始复制 ↓↓↓ ---

          document
            .getElementById("album-photos-back-btn")
            .addEventListener("click", () => {
              state.activeAlbumId = null;
              showScreen("album-screen");
            });

          document
            .getElementById("album-upload-photo-btn")
            .addEventListener("click", () =>
              document.getElementById("album-photo-input").click(),
            );

          document
            .getElementById("album-photo-input")
            .addEventListener("change", async (event) => {
              if (!state.activeAlbumId) return;
              const files = event.target.files;
              if (!files.length) return;

              const album = await db.qzoneAlbums.get(state.activeAlbumId);

              for (const file of files) {
                const dataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.readAsDataURL(file);
                });
                await db.qzonePhotos.add({
                  albumId: state.activeAlbumId,
                  url: dataUrl,
                  createdAt: Date.now(),
                });
              }

              const photoCount = await db.qzonePhotos
                .where("albumId")
                .equals(state.activeAlbumId)
                .count();
              const updateData = { photoCount };

              if (!album.photoCount || album.coverUrl.includes("placeholder")) {
                const firstPhoto = await db.qzonePhotos
                  .where("albumId")
                  .equals(state.activeAlbumId)
                  .first();
                if (firstPhoto) updateData.coverUrl = firstPhoto.url;
              }

              await db.qzoneAlbums.update(state.activeAlbumId, updateData);
              await renderAlbumPhotosScreen();
              await renderAlbumList();

              event.target.value = null;
              showCustomAlert("提示", "照片上传成功！");
            });

          // --- ↑↑↑ 复制到这里结束 ↑↑↑ ---

          // --- ↓↓↓ 从这里开始复制，完整替换掉旧的 photos-grid-page 监听器 ↓↓↓ ---

          document
            .getElementById("photos-grid-page")
            .addEventListener("click", async (e) => {
              const deleteBtn = e.target.closest(".photo-delete-btn");
              const photoThumb = e.target.closest(".photo-thumb");

              if (deleteBtn) {
                e.stopPropagation(); // 阻止事件冒泡到图片上
                const photoId = parseInt(deleteBtn.dataset.photoId);
                const confirmed = await showCustomConfirm(
                  "删除照片",
                  "确定要删除这张照片吗？此操作不可恢复。",
                  { confirmButtonClass: "btn-danger" },
                );

                if (confirmed) {
                  const deletedPhoto = await db.qzonePhotos.get(photoId);
                  if (!deletedPhoto) return;

                  await db.qzonePhotos.delete(photoId);

                  const album = await db.qzoneAlbums.get(state.activeAlbumId);
                  const photoCount = (album.photoCount || 1) - 1;
                  const updateData = { photoCount };

                  if (album.coverUrl === deletedPhoto.url) {
                    const nextPhoto = await db.qzonePhotos
                      .where("albumId")
                      .equals(state.activeAlbumId)
                      .first();
                    updateData.coverUrl = nextPhoto
                      ? nextPhoto.url
                      : "https://i.postimg.cc/pT2xKzPz/album-cover-placeholder.png";
                  }

                  await db.qzoneAlbums.update(state.activeAlbumId, updateData);
                  await renderAlbumPhotosScreen();
                  await renderAlbumList();
                  showCustomAlert("提示", "照片已删除。");
                }
              } else if (photoThumb) {
                // 这就是恢复的图片点击放大功能！
                openPhotoViewer(photoThumb.src);
              }
            });

          // 恢复图片查看器的控制事件
          document
            .getElementById("photo-viewer-close-btn")
            .addEventListener("click", closePhotoViewer);
          document
            .getElementById("photo-viewer-next-btn")
            .addEventListener("click", showNextPhoto);
          document
            .getElementById("photo-viewer-prev-btn")
            .addEventListener("click", showPrevPhoto);

          // 恢复键盘左右箭头和ESC键的功能
          document.addEventListener("keydown", (e) => {
            if (!photoViewerState.isOpen) return;

            if (e.key === "ArrowRight") {
              showNextPhoto();
            } else if (e.key === "ArrowLeft") {
              showPrevPhoto();
            } else if (e.key === "Escape") {
              closePhotoViewer();
            }
          });

          // --- ↑↑↑ 复制到这里结束 ↑↑↑ ---

          document
            .getElementById("create-album-btn-page")
            .addEventListener("click", async () => {
              const albumName = await showCustomPrompt(
                "创建新相册",
                "请输入相册名称",
              );
              if (albumName && albumName.trim()) {
                const newAlbum = {
                  name: albumName.trim(),
                  coverUrl:
                    "https://i.postimg.cc/pT2xKzPz/album-cover-placeholder.png",
                  photoCount: 0,
                  createdAt: Date.now(),
                };
                await db.qzoneAlbums.add(newAlbum);
                await renderAlbumList();
                showCustomAlert("提示", `相册 "${albumName}" 创建成功！`);
              } else if (albumName !== null) {
                showCustomAlert("提示", "相册名称不能为空！");
              }
            });

          document
            .getElementById("cancel-create-post-btn")
            .addEventListener("click", () =>
              document
                .getElementById("create-post-modal")
                .classList.remove("visible"),
            );
          document
            .getElementById("post-upload-local-btn")
            .addEventListener("click", () =>
              document.getElementById("post-local-image-input").click(),
            );
          document
            .getElementById("post-local-image-input")
            .addEventListener("change", (event) => {
              const file = event.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  document.getElementById("post-image-preview").src =
                    e.target.result;
                  document
                    .getElementById("post-image-preview-container")
                    .classList.add("visible");
                  document.getElementById(
                    "post-image-desc-group",
                  ).style.display = "block";
                };
                reader.readAsDataURL(file);
              }
            });
          document
            .getElementById("post-use-url-btn")
            .addEventListener("click", async () => {
              const url = await showCustomPrompt(
                "输入图片URL",
                "请输入网络图片的链接",
                "",
                "url",
              );
              if (url) {
                document.getElementById("post-image-preview").src = url;
                document
                  .getElementById("post-image-preview-container")
                  .classList.add("visible");
                document.getElementById("post-image-desc-group").style.display =
                  "block";
              }
            });
          document
            .getElementById("post-remove-image-btn")
            .addEventListener("click", () => resetCreatePostModal());
          const imageModeBtn = document.getElementById("switch-to-image-mode");
          const textImageModeBtn = document.getElementById(
            "switch-to-text-image-mode",
          );
          const imageModeContent =
            document.getElementById("image-mode-content");
          const textImageModeContent = document.getElementById(
            "text-image-mode-content",
          );
          imageModeBtn.addEventListener("click", () => {
            imageModeBtn.classList.add("active");
            textImageModeBtn.classList.remove("active");
            imageModeContent.classList.add("active");
            textImageModeContent.classList.remove("active");
          });
          textImageModeBtn.addEventListener("click", () => {
            textImageModeBtn.classList.add("active");
            imageModeBtn.classList.remove("active");
            textImageModeContent.classList.add("active");
            imageModeContent.classList.remove("active");
          });

          document
            .getElementById("confirm-create-post-btn")
            .addEventListener("click", async () => {
              const modal = document.getElementById("create-post-modal");
              const mode = modal.dataset.mode;

              // --- 1. 获取通用的可见性设置 ---
              const visibilityMode = document.querySelector(
                'input[name="visibility"]:checked',
              ).value;
              let visibleGroupIds = null;

              if (visibilityMode === "include") {
                visibleGroupIds = Array.from(
                  document.querySelectorAll(
                    'input[name="visibility_group"]:checked',
                  ),
                ).map((cb) => parseInt(cb.value));
              }

              let newPost = {};
              const basePostData = {
                timestamp: Date.now(),
                authorId: CONSTANTS.ROLES.USER,
                // 【重要】在这里就把权限信息存好
                visibleGroupIds: visibleGroupIds,
              };

              // --- 2. 根据模式构建不同的 post 对象 ---
              if (mode === "shuoshuo") {
                const content = document
                  .getElementById("post-public-text")
                  .value.trim();
                if (!content) {
                  showCustomAlert("提示", "说说内容不能为空哦！");
                  return;
                }
                newPost = {
                  ...basePostData,
                  type: "shuoshuo",
                  content: content,
                };
              } else {
                // 处理 'complex' 模式 (图片/文字图)
                const publicText = document
                  .getElementById("post-public-text")
                  .value.trim();
                const isImageModeActive = document
                  .getElementById("image-mode-content")
                  .classList.contains("active");

                if (isImageModeActive) {
                  const imageUrl =
                    document.getElementById("post-image-preview").src;
                  const imageDescription = document
                    .getElementById("post-image-description")
                    .value.trim();
                  if (
                    !imageUrl ||
                    !(
                      imageUrl.startsWith("http") ||
                      imageUrl.startsWith("data:")
                    )
                  ) {
                    showCustomAlert("提示", "请先添加一张图片再发布动态哦！");
                    return;
                  }
                  if (!imageDescription) {
                    showCustomAlert("提示", "请为你的图片添加一个简单的描述（必填，给AI看的）！");
                    return;
                  }
                  newPost = {
                    ...basePostData,
                    type: "image_post",
                    publicText: publicText,
                    imageUrl: imageUrl,
                    imageDescription: imageDescription,
                  };
                } else {
                  // 文字图模式
                  const hiddenText = document
                    .getElementById("post-hidden-text")
                    .value.trim();
                  if (!hiddenText) {
                    showCustomAlert("提示", "请输入文字图描述！");
                    return;
                  }
                  newPost = {
                    ...basePostData,
                    type: "text_image",
                    publicText: publicText,
                    hiddenContent: hiddenText,
                  };
                }
              }

              // --- 3. 保存到数据库 ---
              const newPostId = await db.qzonePosts.add(newPost);
              let postSummary =
                newPost.content ||
                newPost.publicText ||
                newPost.imageDescription ||
                newPost.hiddenContent ||
                "（无文字内容）";
              postSummary =
                postSummary.substring(0, 50) +
                (postSummary.length > 50 ? "..." : "");

              // --- 4. 【核心修正】带有权限检查的通知循环 ---
              for (const chatId in state.chats) {
                const chat = state.chats[chatId];
                if (chat.isGroup) continue; // 跳过群聊

                let shouldNotify = false;
                const postVisibleGroups = newPost.visibleGroupIds;

                // 判断条件1：如果动态是公开的 (没有设置任何可见分组)
                if (!postVisibleGroups || postVisibleGroups.length === 0) {
                  shouldNotify = true;
                }
                // 判断条件2：如果动态设置了部分可见，并且当前角色在可见分组内
                else if (
                  chat.groupId &&
                  postVisibleGroups.includes(chat.groupId)
                ) {
                  shouldNotify = true;
                }

                // 只有满足条件的角色才会被通知
                if (shouldNotify) {
                  const historyMessage = {
                    role: CONSTANTS.ROLES.SYSTEM,
                    content: `[系统提示：用户刚刚发布了一条动态(ID: ${newPostId})，内容摘要是：“${postSummary}”。你现在可以对这条动态进行评论了。]`,
                    timestamp: Date.now(),
                    isHidden: true,
                  };
                  chat.history.push(historyMessage);
                  await db.chats.put(chat);
                }
              }
              // --- 修正结束 ---

              await renderQzonePosts();
              modal.classList.remove("visible");
              showCustomAlert("提示", "动态发布成功！");
            });

          const postsList = document.getElementById("qzone-posts-list");
          let swipeState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            activeContainer: null,
            swipeDirection: null,
            isClick: true,
          };

          function resetAllSwipes(exceptThisOne = null) {
            document
              .querySelectorAll(".qzone-post-container")
              .forEach((container) => {
                if (container !== exceptThisOne) {
                  container
                    .querySelector(".qzone-post-item")
                    .classList.remove("swiped");
                }
              });
          }

          const handleSwipeStart = (e) => {
            const targetContainer = e.target.closest(".qzone-post-container");
            if (!targetContainer) return;

            resetAllSwipes(targetContainer);
            swipeState.activeContainer = targetContainer;
            swipeState.isDragging = true;
            swipeState.isClick = true;
            swipeState.swipeDirection = null;
            swipeState.startX = e.type.includes("mouse")
              ? e.pageX
              : e.touches[0].pageX;
            swipeState.startY = e.type.includes("mouse")
              ? e.pageY
              : e.touches[0].pageY;
            swipeState.activeContainer.querySelector(
              ".qzone-post-item",
            ).style.transition = "none";
          };

          const handleSwipeMove = (e) => {
            if (!swipeState.isDragging || !swipeState.activeContainer) return;

            const currentX = e.type.includes("mouse")
              ? e.pageX
              : e.touches[0].pageX;
            const currentY = e.type.includes("mouse")
              ? e.pageY
              : e.touches[0].pageY;
            const diffX = currentX - swipeState.startX;
            const diffY = currentY - swipeState.startY;
            const absDiffX = Math.abs(diffX);
            const absDiffY = Math.abs(diffY);
            const clickThreshold = 5;

            if (absDiffX > clickThreshold || absDiffY > clickThreshold) {
              swipeState.isClick = false;
            }

            if (swipeState.swipeDirection === null) {
              if (absDiffX > clickThreshold || absDiffY > clickThreshold) {
                if (absDiffX > absDiffY) {
                  swipeState.swipeDirection = "horizontal";
                } else {
                  swipeState.swipeDirection = "vertical";
                }
              }
            }
            if (swipeState.swipeDirection === "vertical") {
              handleSwipeEnd(e);
              return;
            }
            if (swipeState.swipeDirection === "horizontal") {
              e.preventDefault();
              swipeState.currentX = currentX;
              let translation = diffX;
              if (translation > 0) translation = 0;
              if (translation < -90) translation = -90;
              swipeState.activeContainer.querySelector(
                ".qzone-post-item",
              ).style.transform = `translateX(${translation}px)`;
            }
          };

          const handleSwipeEnd = (e) => {
            if (swipeState.isClick) {
              swipeState.isDragging = false;
              swipeState.activeContainer = null;
              return;
            }
            if (!swipeState.isDragging || !swipeState.activeContainer) return;

            const postItem =
              swipeState.activeContainer.querySelector(".qzone-post-item");
            postItem.style.transition = "transform 0.3s ease";

            const finalX = e.type.includes("touchend")
              ? e.changedTouches[0].pageX
              : e.pageX;
            const diffX = finalX - swipeState.startX;
            const swipeThreshold = -40;

            if (
              swipeState.swipeDirection === "horizontal" &&
              diffX < swipeThreshold
            ) {
              postItem.classList.add("swiped");
              postItem.style.transform = "";
            } else {
              postItem.classList.remove("swiped");
              postItem.style.transform = "";
            }

            swipeState.isDragging = false;
            swipeState.startX = 0;
            swipeState.startY = 0;
            swipeState.currentX = 0;
            swipeState.activeContainer = null;
            swipeState.swipeDirection = null;
            swipeState.isClick = true;
          };

          // --- 绑定所有滑动事件 ---
          postsList.addEventListener("mousedown", handleSwipeStart);
          document.addEventListener("mousemove", handleSwipeMove);
          document.addEventListener("mouseup", handleSwipeEnd);
          postsList.addEventListener("touchstart", handleSwipeStart, {
            passive: false,
          });
          postsList.addEventListener("touchmove", handleSwipeMove, {
            passive: false,
          });
          postsList.addEventListener("touchend", handleSwipeEnd);

          // --- 绑定所有点击事件 ---
          postsList.addEventListener("click", async (e) => {
            e.stopPropagation();
            const target = e.target;

            // --- 新增：处理评论删除按钮 ---
            if (target.classList.contains("comment-delete-btn")) {
              const postContainer = target.closest(".qzone-post-container");
              if (!postContainer) return;

              const postId = parseInt(postContainer.dataset.postId);
              const commentIndex = parseInt(target.dataset.commentIndex);
              if (isNaN(postId) || isNaN(commentIndex)) return;

              const post = await db.qzonePosts.get(postId);
              if (!post || !post.comments || !post.comments[commentIndex])
                return;

              const commentText = post.comments[commentIndex].text;
              const confirmed = await showCustomConfirm(
                "删除评论",
                `确定要删除这条评论吗？\n\n“${commentText.substring(
                  0,
                  50,
                )}...”`,
                { confirmButtonClass: "btn-danger" },
              );

              if (confirmed) {
                // 从数组中移除该评论
                post.comments.splice(commentIndex, 1);
                // 更新数据库
                await db.qzonePosts.update(postId, { comments: post.comments });
                // 重新渲染列表以反映更改
                await renderQzonePosts();
                showCustomAlert("提示", "评论已删除。");
              }
              return; // 处理完后直接返回
            }

            if (target.classList.contains("post-actions-btn")) {
              const container = target.closest(".qzone-post-container");
              if (container && container.dataset.postId) {
                showPostActions(parseInt(container.dataset.postId));
              }
              return;
            }

            if (target.closest(".qzone-post-delete-action")) {
              const container = target.closest(".qzone-post-container");
              if (!container) return;

              const postIdToDelete = parseInt(container.dataset.postId);
              if (isNaN(postIdToDelete)) return;

              const confirmed = await showCustomConfirm(
                "删除动态",
                "确定要永久删除这条动态吗？",
                { confirmButtonClass: "btn-danger" },
              );

              if (confirmed) {
                container.style.transition = "all 0.3s ease";
                container.style.transform = "scale(0.8)";
                container.style.opacity = "0";

                setTimeout(async () => {
                  await db.qzonePosts.delete(postIdToDelete);

                  const notificationIdentifier = `(ID: ${postIdToDelete})`;
                  for (const chatId in state.chats) {
                    const chat = state.chats[chatId];
                    const originalHistoryLength = chat.history.length;
                    chat.history = chat.history.filter(
                      (msg) =>
                        !(
                          msg.role === CONSTANTS.ROLES.SYSTEM &&
                          msg.content.includes(notificationIdentifier)
                        ),
                    );
                    if (chat.history.length < originalHistoryLength) {
                      chat.settings.offlineMode = {
                        enabled: document.getElementById("offline-mode-toggle")
                          .checked,
                        preset: document.getElementById("offline-preset-select")
                          .value,
                        prompt: document.getElementById("offline-prompt-input")
                          .value,
                        style: document.getElementById("offline-style-input")
                          .value,
                      };

                      await db.chats.put(chat);
                    }
                  }
                  await renderQzonePosts();
                  showCustomAlert("提示", "动态已删除。");
                }, 300);
              }
              return;
            }

            if (target.tagName === "IMG" && target.dataset.hiddenText) {
              const hiddenText = target.dataset.hiddenText;
              showCustomAlert("图片内容", hiddenText.replace(/<br>/g, "\n"));
              return;
            }
            const icon = target.closest(".action-icon");
            if (icon) {
              const postContainer = icon.closest(".qzone-post-container");
              if (!postContainer) return;
              const postId = parseInt(postContainer.dataset.postId);
              if (isNaN(postId)) return;
              if (icon.classList.contains("like")) {
                const post = await db.qzonePosts.get(postId);
                if (!post) return;
                if (!post.likes) post.likes = [];
                const userNickname = state.qzoneSettings.nickname;
                const userLikeIndex = post.likes.indexOf(userNickname);
                if (userLikeIndex > -1) {
                  post.likes.splice(userLikeIndex, 1);
                } else {
                  post.likes.push(userNickname);
                  icon.classList.add("animate-like");
                  icon.addEventListener(
                    "animationend",
                    () => icon.classList.remove("animate-like"),
                    { once: true },
                  );
                }
                await db.qzonePosts.update(postId, { likes: post.likes });
              }
              if (icon.classList.contains("favorite")) {
                const existingFavorite = await db.favorites
                  .where({ type: "qzone_post", "content.id": postId })
                  .first();
                if (existingFavorite) {
                  await db.favorites.delete(existingFavorite.id);
                  await showCustomAlert("提示", "已取消收藏");
                } else {
                  const postToSave = await db.qzonePosts.get(postId);
                  if (postToSave) {
                    await db.favorites.add({
                      type: "qzone_post",
                      content: postToSave,
                      timestamp: Date.now(),
                    });
                    await showCustomAlert("提示", "收藏成功！");
                  }
                }
              }
              await renderQzonePosts();
              return;
            }
            const sendBtn = target.closest(".comment-send-btn");
            if (sendBtn) {
              const postContainer = sendBtn.closest(".qzone-post-container");
              if (!postContainer) return;
              const postId = parseInt(postContainer.dataset.postId);
              const commentInput =
                postContainer.querySelector(".comment-input");
              const commentText = commentInput.value.trim();
              if (!commentText) return showCustomAlert("提示", "评论内容不能为空哦！");
              const post = await db.qzonePosts.get(postId);
              if (!post) return;
              if (!post.comments) post.comments = [];
              post.comments.push({
                commenterName: state.qzoneSettings.nickname,
                text: commentText,
                timestamp: Date.now(),
              });
              await db.qzonePosts.update(postId, { comments: post.comments });
              for (const chatId in state.chats) {
                const chat = state.chats[chatId];
                if (!chat.isGroup) {
                  chat.history.push({
                    role: CONSTANTS.ROLES.SYSTEM,
                    content: `[系统提示：'${state.qzoneSettings.nickname}' 在ID为${postId}的动态下发表了评论：“${commentText}”]`,
                    timestamp: Date.now(),
                    isHidden: true,
                  });
                  await db.chats.put(chat);
                }
              }
              commentInput.value = "";
              await renderQzonePosts();
              return;
            }
          });

          // 绑定动态页和收藏页的返回按钮
          document
            .getElementById("qzone-back-btn")
            .addEventListener("click", () =>
              switchToChatListView("messages-view"),
            );
          document
            .getElementById("favorites-back-btn")
            .addEventListener("click", () =>
              switchToChatListView("messages-view"),
            );

          // 收藏页搜索功能
          const searchInput = document.getElementById("favorites-search-input");
          const searchClearBtn = document.getElementById(
            "favorites-search-clear-btn",
          );

          searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.trim().toLowerCase();

            // 控制清除按钮的显示/隐藏
            searchClearBtn.style.display = searchTerm ? "block" : "none";

            if (!searchTerm) {
              displayFilteredFavorites(allFavoriteItems); // 如果搜索框为空，显示所有
              return;
            }

            // 筛选逻辑
            const filteredItems = allFavoriteItems.filter((item) => {
              let contentToSearch = "";
              let authorToSearch = "";

              if (item.type === "qzone_post") {
                const post = item.content;
                contentToSearch +=
                  (post.publicText || "") + " " + (post.content || "");
                if (post.authorId === CONSTANTS.ROLES.USER) {
                  authorToSearch = state.qzoneSettings.nickname;
                } else if (state.chats[post.authorId]) {
                  authorToSearch = state.chats[post.authorId].name;
                }
              } else if (item.type === "chat_message") {
                const msg = item.content;
                if (typeof msg.content === "string") {
                  contentToSearch = msg.content;
                }
                const chat = state.chats[item.chatId];
                if (chat) {
                  if (msg.role === CONSTANTS.ROLES.USER) {
                    authorToSearch = chat.isGroup
                      ? chat.settings.myNickname || "我"
                      : "我";
                  } else {
                    authorToSearch = chat.isGroup ? msg.senderName : chat.name;
                  }
                }
              }

              // 同时搜索内容和作者，并且不区分大小写
              return (
                contentToSearch.toLowerCase().includes(searchTerm) ||
                authorToSearch.toLowerCase().includes(searchTerm)
              );
            });

            displayFilteredFavorites(filteredItems);
          });

          // 清除按钮的点击事件
          searchClearBtn.addEventListener("click", () => {
            searchInput.value = "";
            searchClearBtn.style.display = "none";
            displayFilteredFavorites(allFavoriteItems);
            searchInput.focus();
          });

          // 为聊天界面的批量收藏按钮绑定事件
          // 为聊天界面的批量收藏按钮绑定事件 (已修正)
          document
            .getElementById("selection-favorite-btn")
            .addEventListener("click", async () => {
              if (selectedMessages.size === 0) return;
              const chat = state.chats[state.activeChatId];
              if (!chat) return;

              const favoritesToAdd = [];
              const timestampsToFavorite = [...selectedMessages];

              for (const timestamp of timestampsToFavorite) {
                // 【核心修正1】使用新的、高效的索引进行查询
                const existing = await db.favorites
                  .where("originalTimestamp")
                  .equals(timestamp)
                  .first();

                if (!existing) {
                  const messageToSave = chat.history.find(
                    (msg) => msg.timestamp === timestamp,
                  );
                  if (messageToSave) {
                    favoritesToAdd.push({
                      type: "chat_message",
                      content: messageToSave,
                      chatId: state.activeChatId,
                      timestamp: Date.now(), // 这是收藏操作发生的时间
                      originalTimestamp: messageToSave.timestamp, // 【核心修正2】保存原始消息的时间戳到新字段
                    });
                  }
                }
              }

              if (favoritesToAdd.length > 0) {
                await db.favorites.bulkAdd(favoritesToAdd);
                allFavoriteItems = await db.favorites
                  .orderBy("timestamp")
                  .reverse()
                  .toArray(); // 更新全局收藏缓存
                await showCustomAlert(
                  "收藏成功",
                  `已成功收藏 ${favoritesToAdd.length} 条消息。`,
                );
              } else {
                await showCustomAlert("提示", "选中的消息均已收藏过。");
              }

              exitSelectionMode();
            });

          // 收藏页面的"编辑"按钮事件 (已修正)
          const favoritesEditBtn =
            document.getElementById("favorites-edit-btn");
          const favoritesView = document.getElementById("favorites-view");
          const favoritesActionBar = document.getElementById(
            "favorites-action-bar",
          );
          const mainBottomNav = document.getElementById("chat-list-bottom-nav"); // 获取主导航栏
          const favoritesList = document.getElementById("favorites-list"); // 获取收藏列表

          favoritesEditBtn.addEventListener("click", () => {
            isFavoritesSelectionMode = !isFavoritesSelectionMode;
            favoritesView.classList.toggle(
              "selection-mode",
              isFavoritesSelectionMode,
            );

            if (isFavoritesSelectionMode) {
              // --- 进入编辑模式 ---
              favoritesEditBtn.textContent = "完成";
              favoritesActionBar.style.display = "block"; // 显示删除操作栏
            } else {
              // --- 退出编辑模式 ---
              favoritesEditBtn.textContent = "编辑";
              favoritesActionBar.style.display = "none"; // 隐藏删除操作栏

              // 退出时清空所有选择
              selectedFavorites.clear();
              document
                .querySelectorAll(".favorite-item-card.selected")
                .forEach((card) => card.classList.remove("selected"));
              document.getElementById(
                "favorites-delete-selected-btn",
              ).textContent = `删除 (0)`;
            }
          });

          // 收藏列表的点击选择事件 (事件委托)
          document
            .getElementById("favorites-list")
            .addEventListener("click", (e) => {
              const target = e.target;
              const card = target.closest(".favorite-item-card");

              // 【新增】处理文字图点击，这段逻辑要放在最前面，保证任何模式下都生效
              if (target.tagName === "IMG" && target.dataset.hiddenText) {
                const hiddenText = target.dataset.hiddenText;
                showCustomAlert("图片内容", hiddenText.replace(/<br>/g, "\n"));
                return; // 处理完就退出，不继续执行选择逻辑
              }

              // 如果不在选择模式，则不执行后续的选择操作
              if (!isFavoritesSelectionMode) return;

              // --- 以下是原有的选择逻辑，保持不变 ---
              if (!card) return;

              const favId = parseInt(card.dataset.favid);
              if (isNaN(favId)) return;

              // 切换选择状态
              if (selectedFavorites.has(favId)) {
                selectedFavorites.delete(favId);
                card.classList.remove("selected");
              } else {
                selectedFavorites.add(favId);
                card.classList.add("selected");
              }

              // 更新底部删除按钮的计数
              document.getElementById(
                "favorites-delete-selected-btn",
              ).textContent = `删除 (${selectedFavorites.size})`;
            });

          // 收藏页面批量删除按钮事件
          document
            .getElementById("favorites-delete-selected-btn")
            .addEventListener("click", async () => {
              if (selectedFavorites.size === 0) return;

              const confirmed = await showCustomConfirm(
                "确认删除",
                `确定要从收藏夹中移除这 ${selectedFavorites.size} 条内容吗？`,
                { confirmButtonClass: "btn-danger" },
              );

              if (confirmed) {
                const idsToDelete = [...selectedFavorites];
                await db.favorites.bulkDelete(idsToDelete);
                await showCustomAlert("删除成功", "选中的收藏已被移除。");

                // 【核心修正1】从前端缓存中也移除被删除的项
                allFavoriteItems = allFavoriteItems.filter(
                  (item) => !idsToDelete.includes(item.id),
                );

                // 【核心修正2】使用更新后的缓存，立即重新渲染列表
                displayFilteredFavorites(allFavoriteItems);

                // 最后，再退出编辑模式
                favoritesEditBtn.click(); // 模拟点击"完成"按钮来退出编辑模式
              }
            });

          if (state.globalSettings.enableBackgroundActivity) {
            startBackgroundSimulation();
            console.log("后台活动模拟已自动启动。");
          }

          // --- 统一处理所有影响预览的控件的事件 ---

          // 1. 监听主题选择
          document
            .querySelectorAll('input[name="theme-select"]')
            .forEach((radio) => {
              radio.addEventListener("change", updateSettingsPreview);
            });

          // 2. 监听字体大小滑块
          const fontSizeSlider = document.getElementById("font-size-slider");
          fontSizeSlider.addEventListener("input", () => {
            // a. 实时更新数值显示
            document.getElementById("font-size-value").textContent =
              `${fontSizeSlider.value}px`;
            // b. 更新预览
            updateSettingsPreview();
          });

          // 3. 监听自定义CSS输入框
          const customCssInputForPreview =
            document.getElementById("custom-css-input");
          customCssInputForPreview.addEventListener(
            "input",
            updateSettingsPreview,
          );

          document
            .getElementById("reset-custom-css-btn")
            .addEventListener("click", () => {
              document.getElementById("custom-css-input").value = "";
              updateSettingsPreview();
            });

          document
            .querySelectorAll('input[name="visibility"]')
            .forEach((radio) => {
              radio.addEventListener("change", function () {
                const groupsContainer = document.getElementById(
                  "post-visibility-groups",
                );
                if (this.value === "include" || this.value === "exclude") {
                  groupsContainer.style.display = "block";
                } else {
                  groupsContainer.style.display = "none";
                }
              });
            });

          document
            .getElementById("manage-groups-btn")
            .addEventListener("click", openGroupManager);
          document
            .getElementById("close-group-manager-btn")
            .addEventListener("click", () => {
              document
                .getElementById("group-management-modal")
                .classList.remove("visible");
              // 刷新聊天设置里的分组列表
              const chatSettingsBtn =
                document.getElementById("chat-settings-btn");
              if (
                document
                  .getElementById("chat-settings-screen")
                  .classList.contains("active")
              ) {
                chatSettingsBtn.click(); // 再次点击以重新打开
              }
            });

          document
            .getElementById("add-new-group-btn")
            .addEventListener("click", addNewGroup);
          document
            .getElementById("existing-groups-list")
            .addEventListener("click", (e) => {
              if (e.target.classList.contains("delete-group-btn")) {
                const groupId = parseInt(e.target.dataset.id);
                deleteGroup(groupId);
              }
            });

          // 消息操作菜单的按钮事件
          document
            .getElementById("cancel-message-action-btn")
            .addEventListener("click", hideMessageActions);
          document
            .getElementById("edit-message-btn")
            .addEventListener("click", openAdvancedMessageEditor);
          document
            .getElementById("copy-message-btn")
            .addEventListener("click", copyMessageContent);

          document
            .getElementById("recall-message-btn")
            .addEventListener("click", handleRecallClick);

          document
            .getElementById("select-message-btn")
            .addEventListener("click", () => {
              // 【核心修复】在关闭菜单前，先捕获时间戳
              const timestampToSelect = activeMessageTimestamp;
              hideMessageActions();
              // 使用捕获到的值
              if (timestampToSelect) {
                enterSelectionMode(timestampToSelect);
              }
            });

          // 动态操作菜单的按钮事件
          document
            .getElementById("edit-post-btn")
            .addEventListener("click", openPostEditor);
          document
            .getElementById("copy-post-btn")
            .addEventListener("click", copyPostContent);
          document
            .getElementById("cancel-post-action-btn")
            .addEventListener("click", hidePostActions);

          document
            .getElementById("cancel-contact-picker-btn")
            .addEventListener("click", () => {
              showScreen("chat-list-screen");
            });

          document
            .getElementById("contact-picker-list")
            .addEventListener("click", (e) => {
              const item = e.target.closest(".contact-picker-item");
              if (!item) return;

              const contactId = item.dataset.contactId;
              item.classList.toggle("selected");

              if (selectedContacts.has(contactId)) {
                selectedContacts.delete(contactId);
              } else {
                selectedContacts.add(contactId);
              }
              updateContactPickerConfirmButton();
            });

          document
            .getElementById("manage-members-btn")
            .addEventListener("click", () => {
              openMemberManagementScreen();
            });

          document
            .getElementById("back-from-member-management")
            .addEventListener("click", () => {
              showScreen("chat-settings-screen");
            });

          document
            .getElementById("member-management-list")
            .addEventListener("click", (e) => {
              // 【已恢复】移除成员的事件
              if (e.target.classList.contains("remove-member-btn")) {
                removeMemberFromGroup(e.target.dataset.memberId);
              }
            });

          document
            .getElementById("add-existing-contact-btn")
            .addEventListener("click", async () => {
              // 【已恢复】从好友列表添加的事件
              // 【关键】为“完成”按钮绑定“拉人入群”的逻辑
              const confirmBtn = document.getElementById(
                "confirm-contact-picker-btn",
              );
              // 使用克隆节点方法清除旧的事件监听器，防止重复绑定
              const newConfirmBtn = confirmBtn.cloneNode(true);
              confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
              newConfirmBtn.addEventListener("click", handleAddMembersToGroup);

              await openContactPickerForAddMember();
            });

          document
            .getElementById("create-new-member-btn")
            .addEventListener("click", createNewMemberInGroup);

          // 绑定单聊和群聊的发起按钮
          document
            .getElementById("video-call-btn")
            .addEventListener("click", handleInitiateCall);
          document
            .getElementById("group-video-call-btn")
            .addEventListener("click", handleInitiateCall);

          // 绑定“挂断”按钮
          document
            .getElementById("hang-up-btn")
            .addEventListener("click", endVideoCall);

          // 绑定“取消呼叫”按钮
          document
            .getElementById("cancel-call-btn")
            .addEventListener("click", () => {
              videoCallState.isAwaitingResponse = false;
              showScreen("chat-interface-screen");
            });

          // 【全新】绑定“加入通话”按钮
          document
            .getElementById("join-call-btn")
            .addEventListener("click", handleUserJoinCall);


          // 绑定来电请求的“拒绝”按钮
          document
            .getElementById("decline-call-btn")
            .addEventListener("click", async () => {
              hideIncomingCallModal();
              const chat = state.chats[videoCallState.activeChatId];
              if (!chat) return;

              // 【核心修正】在这里，我们将拒绝的逻辑与API调用连接起来
              if (videoCallState.isGroupCall) {
                videoCallState.isUserParticipating = false; // 标记用户为旁观者

                // 1. 创建一条隐藏消息，通知AI用户拒绝了
                const systemNote = {
                  role: CONSTANTS.ROLES.SYSTEM,
                  content: `[系统提示：用户拒绝了通话邀请，但你们可以自己开始。请你们各自决策是否加入。]`,
                  timestamp: Date.now(),
                  isHidden: true,
                };
                chat.history.push(systemNote);
                await db.chats.put(chat);

                // 2. 【关键】触发AI响应，让它们自己决定要不要开始群聊
                // 这将会在后台处理，如果AI们决定开始，最终会调用 startVideoCall()
                await triggerAiResponse();
              } else {
                // 单聊拒绝逻辑保持不变
                const declineMessage = {
                  role: CONSTANTS.ROLES.USER,
                  content: "我拒绝了你的视频通话请求。",
                  timestamp: Date.now(),
                };
                chat.history.push(declineMessage);
                await db.chats.put(chat);

                // 回到聊天界面并显示拒绝消息
                showScreen("chat-interface-screen");
                appendMessage(declineMessage, chat);

                // 让AI对你的拒绝做出回应
                triggerAiResponse();
              }

              // 清理状态，以防万一
              videoCallState.isAwaitingResponse = false;
            });

          // 绑定来电请求的“接听”按钮
          document
            .getElementById("accept-call-btn")
            .addEventListener("click", async () => {
              hideIncomingCallModal();

              videoCallState.initiator = "ai";
              videoCallState.isUserParticipating = true;
              videoCallState.activeChatId = state.activeChatId;

              // 【核心修正】我们在这里不再手动添加用户到 participants 列表
              if (videoCallState.isGroupCall) {
                // 对于群聊，我们只把【发起通话的AI】加入参与者列表
                const chat = state.chats[videoCallState.activeChatId];
                const requester = chat.members.find(
                  (m) => m.name === videoCallState.callRequester,
                );
                if (requester) {
                  // 清空可能存在的旧数据，然后只添加发起者
                  videoCallState.participants = [requester];
                } else {
                  videoCallState.participants = []; // 如果找不到发起者，就清空
                }
              }

              // 无论单聊还是群聊，直接启动通话界面！
              startVideoCall();
            });

          // 绑定用户在通话中发言的按钮
          document
            .getElementById("user-speak-btn")
            .addEventListener("click", async () => {
              if (!videoCallState.isActive) return;

              // ★★★★★ 核心新增：在弹出输入框前，先找到并高亮用户头像 ★★★★★
              const userAvatar = document.querySelector(
                '.participant-avatar-wrapper[data-participant-id=CONSTANTS.ROLES.USER] .participant-avatar',
              );
              if (userAvatar) {
                userAvatar.classList.add("speaking");
              }

              const userInput = await showCustomPrompt(
                "你说",
                "请输入你想说的话...",
              );

              // ★★★★★ 核心新增：无论用户是否输入，只要关闭输入框就移除高亮 ★★★★★
              if (userAvatar) {
                userAvatar.classList.remove("speaking");
              }

              if (userInput && userInput.trim()) {
                triggerAiInCallAction(userInput.trim());
              }
            });

          // 1. 将“回忆”页签和它的视图连接起来
          document
            .querySelector('.nav-item[data-view="memories-view"]')
            .addEventListener("click", () => {
              // 在切换前，确保"收藏"页面的编辑模式已关闭
              if (isFavoritesSelectionMode) {
                document.getElementById("favorites-edit-btn").click();
              }
              switchToChatListView("memories-view");
              renderMemoriesScreen(); // 点击时渲染
            });

          // 2. 绑定回忆录界面的返回按钮
          document
            .getElementById("memories-back-btn")
            .addEventListener("click", () =>
              switchToChatListView("messages-view"),
            );

          // 【全新】约定/倒计时功能事件绑定
          document
            .getElementById("add-countdown-btn")
            .addEventListener("click", () => {
              document
                .getElementById("create-countdown-modal")
                .classList.add("visible");
            });
          document
            .getElementById("cancel-create-countdown-btn")
            .addEventListener("click", () => {
              document
                .getElementById("create-countdown-modal")
                .classList.remove("visible");
            });
          document
            .getElementById("confirm-create-countdown-btn")
            .addEventListener("click", async () => {
              const title = document
                .getElementById("countdown-title-input")
                .value.trim();
              const dateValue = document.getElementById(
                "countdown-date-input",
              ).value;

              if (!title || !dateValue) {
                showCustomAlert("提示", "请填写完整的约定标题和日期！");
                return;
              }

              const targetDate = new Date(dateValue);
              if (isNaN(targetDate) || targetDate <= new Date()) {
                showCustomAlert("提示", "请输入一个有效的、未来的日期！");
                return;
              }

              const newCountdown = {
                chatId: null, // 用户创建的，不属于任何特定AI
                authorName: "我",
                description: title,
                timestamp: Date.now(),
                type: "countdown",
                targetDate: targetDate.getTime(),
              };

              await db.memories.add(newCountdown);
              document
                .getElementById("create-countdown-modal")
                .classList.remove("visible");
              renderMemoriesScreen();
            });

          // 【全新】拉黑功能事件绑定
          document
            .getElementById("block-chat-btn")
            .addEventListener("click", async () => {
              if (
                !state.activeChatId ||
                state.chats[state.activeChatId].isGroup
              )
                return;

              const chat = state.chats[state.activeChatId];
              const confirmed = await showCustomConfirm(
                "确认拉黑",
                `确定要拉黑“${chat.name}”吗？拉黑后您将无法向其发送消息，直到您将Ta移出黑名单，或等待Ta重新申请好友。`,
                { confirmButtonClass: "btn-danger" },
              );

              if (confirmed) {
                chat.relationship.status = "blocked_by_user";
                chat.relationship.blockedTimestamp = Date.now();

                const hiddenMessage = {
                  role: CONSTANTS.ROLES.SYSTEM,
                  content: `[系统提示：你刚刚被用户拉黑了。在对方解除拉黑之前，你无法再主动发起对话，也无法回应。]`,
                  timestamp: Date.now() + 1,
                  isHidden: true,
                };
                chat.history.push(hiddenMessage);

                await db.chats.put(chat);

                // 关闭设置屏幕，并刷新聊天界面
                DOM.get('chat-interface-screen').classList.remove('settings-open');
                showScreen('chat-interface-screen');
                renderChatInterface(state.activeChatId);
                // 刷新聊天列表，可能会有UI变化
                renderChatList();
              }
            });

          document
            .getElementById("chat-lock-overlay")
            .addEventListener("click", async (e) => {
              const chat = state.chats[state.activeChatId];
              if (!chat) return;

              if (e.target.id === "force-apply-check-btn") {
                showCustomAlert("提示",
                  "正在手动触发好友申请流程，请稍后...\n如果API调用成功，将弹出提示。如果失败，也会有错误提示。如果长时间无反应，说明AI可能决定暂时不申请。",
                );
                await triggerAiFriendApplication(chat.id);
                renderChatInterface(chat.id);
                return;
              }

              if (e.target.id === "unblock-btn") {
                chat.relationship.status = "friend";
                chat.relationship.blockedTimestamp = null;

                const hiddenMessage = {
                  role: CONSTANTS.ROLES.SYSTEM,
                  content: `[系统提示：用户刚刚解除了对你的拉黑。现在你们可以重新开始对话了。]`,
                  timestamp: Date.now(),
                  isHidden: true,
                };
                chat.history.push(hiddenMessage);

                await db.chats.put(chat);
                renderChatInterface(chat.id);
                renderChatList();
                triggerAiResponse(); // 【可选但推荐】解除后让AI主动说点什么
              } else if (e.target.id === "accept-friend-btn") {
                chat.relationship.status = "friend";
                chat.relationship.applicationReason = "";

                const hiddenMessage = {
                  role: CONSTANTS.ROLES.SYSTEM,
                  content: `[系统提示：用户刚刚通过了你的好友申请。你们现在又可以正常聊天了。]`,
                  timestamp: Date.now(),
                  isHidden: true,
                };
                chat.history.push(hiddenMessage);

                await db.chats.put(chat);
                renderChatInterface(chat.id);
                renderChatList();
                const msg = {
                  role: CONSTANTS.ROLES.USER,
                  content: "我通过了你的好友请求",
                  timestamp: Date.now(),
                };
                chat.history.push(msg);
                await db.chats.put(chat);
                appendMessage(msg, chat);
                triggerAiResponse();
              } else if (e.target.id === "reject-friend-btn") {
                chat.relationship.status = "blocked_by_user";
                chat.relationship.blockedTimestamp = Date.now();
                chat.relationship.applicationReason = "";
                await db.chats.put(chat);
                renderChatInterface(chat.id);
              }
              // 【新增】处理申请好友按钮的点击事件
              else if (e.target.id === "apply-friend-btn") {
                const reason = await showCustomPrompt(
                  "发送好友申请",
                  `请输入你想对“${chat.name}”说的申请理由：`,
                  "我们和好吧！",
                );
                // 只有当用户输入了内容并点击“确定”后才继续
                if (reason !== null) {
                  // 更新关系状态为“等待AI批准”
                  chat.relationship.status = "pending_ai_approval";
                  chat.relationship.applicationReason = reason;
                  await db.chats.put(chat);

                  // 刷新UI，显示“等待通过”的界面
                  renderChatInterface(chat.id);
                  renderChatList();

                  // 【关键】触发AI响应，让它去处理这个好友申请
                  triggerAiResponse();
                }
              }
            });

          // 1. 转账按钮 - 打开转账弹窗
          document
            .getElementById("transfer-btn")
            .addEventListener("click", () => {
              document.getElementById("transfer-modal").classList.add("visible");
            });

          // 2. 红包按钮 - 打开红包弹窗
          document
            .getElementById("red-packet-btn")
            .addEventListener("click", () => {
              openRedPacketModal();
            });

          // 3. 红包模态框内部的控制按钮
          document
            .getElementById("cancel-red-packet-btn")
            .addEventListener("click", () => {
              document
                .getElementById("red-packet-modal")
                .classList.remove("visible");
            });
          document
            .getElementById("send-group-packet-btn")
            .addEventListener("click", sendGroupRedPacket);
          document
            .getElementById("send-direct-packet-btn")
            .addEventListener("click", sendDirectRedPacket);

          // 3. 红包模态框的页签切换逻辑
          const rpTabGroup = document.getElementById("rp-tab-group");
          const rpTabDirect = document.getElementById("rp-tab-direct");
          const rpContentGroup = document.getElementById("rp-content-group");
          const rpContentDirect = document.getElementById("rp-content-direct");

          rpTabGroup.addEventListener("click", () => {
            rpTabGroup.classList.add("active");
            rpTabDirect.classList.remove("active");
            rpContentGroup.style.display = "block";
            rpContentDirect.style.display = "none";
          });
          rpTabDirect.addEventListener("click", () => {
            rpTabDirect.classList.add("active");
            rpTabGroup.classList.remove("active");
            rpContentDirect.style.display = "block";
            rpContentGroup.style.display = "none";
          });

          // 4. 实时更新红包金额显示
          document
            .getElementById("rp-group-amount")
            .addEventListener("input", (e) => {
              const amount = parseFloat(e.target.value) || 0;
              document.getElementById("rp-group-total").textContent =
                `¥ ${amount.toFixed(2)}`;
            });
          document
            .getElementById("rp-direct-amount")
            .addEventListener("input", (e) => {
              const amount = parseFloat(e.target.value) || 0;
              document.getElementById("rp-direct-total").textContent =
                `¥ ${amount.toFixed(2)}`;
            });

          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              // 1. 找到被点击的红包卡片
              const packetCard = e.target.closest(".red-packet-card");
              if (!packetCard) return; // 如果点击的不是红包，就什么也不做

              // 2. 从红包卡片的父级.message-bubble获取时间戳
              const messageBubble = packetCard.closest(".message-bubble");
              if (!messageBubble || !messageBubble.dataset.timestamp) return;

              // 3. 调用我们现有的处理函数
              const timestamp = parseInt(messageBubble.dataset.timestamp);
              handlePacketClick(timestamp);
            });

          // 在输入框工具栏添加按钮
          document
            .getElementById("send-poll-btn")
            .addEventListener("click", openCreatePollModal);

          // 投票创建模态框的按钮
          document
            .getElementById("add-poll-option-btn")
            .addEventListener("click", addPollOptionInput);
          document
            .getElementById("cancel-create-poll-btn")
            .addEventListener("click", () => {
              document
                .getElementById("create-poll-modal")
                .classList.remove("visible");
            });
          document
            .getElementById("confirm-create-poll-btn")
            .addEventListener("click", sendPoll);

          // 使用事件委托处理投票卡片内的所有点击事件
          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              const pollCard = e.target.closest(".poll-card");
              if (!pollCard) return;

              const timestamp = parseInt(pollCard.dataset.pollTimestamp);
              if (isNaN(timestamp)) return;

              // 点击了选项
              const optionItem = e.target.closest(".poll-option-item");
              if (optionItem && !pollCard.classList.contains("closed")) {
                handleUserVote(timestamp, optionItem.dataset.option);
                return;
              }

              // 点击了动作按钮（结束投票/查看结果）
              const actionBtn = e.target.closest(".poll-action-btn");
              if (actionBtn) {
                if (pollCard.classList.contains("closed")) {
                  showPollResults(timestamp);
                } else {
                  endPoll(timestamp);
                }
                return;
              }

              // 如果是已结束的投票，点击卡片任何地方都可以查看结果
              if (pollCard.classList.contains("closed")) {
                showPollResults(timestamp);
              }
            });

          document
            .getElementById("manage-ai-avatar-library-btn")
            .addEventListener("click", openAiAvatarLibraryModal);
          document
            .getElementById("add-ai-avatar-btn")
            .addEventListener("click", addAvatarToLibrary);
          document
            .getElementById("close-ai-avatar-library-btn")
            .addEventListener("click", closeAiAvatarLibraryModal);

          document
            .getElementById("icon-settings-grid")
            .addEventListener("click", async (e) => {
              if (e.target.classList.contains("change-icon-btn")) {
                const item = e.target.closest(".icon-setting-item");
                const iconId = item.dataset.iconId;
                if (!iconId) return;

                const currentUrl = state.globalSettings.appIcons[iconId];
                const newUrl = await showCustomPrompt(
                  `更换“${item.querySelector(".icon-preview").alt}”图标`,
                  "请输入新的图片URL",
                  currentUrl,
                  "url",
                );

                if (newUrl && newUrl.trim().startsWith("http")) {
                  // 仅在内存中更新，等待用户点击“保存”
                  state.globalSettings.appIcons[iconId] = newUrl.trim();
                  // 实时更新设置页面的预览图
                  item.querySelector(".icon-preview").src = newUrl.trim();
                } else if (newUrl !== null) {
                  showCustomAlert("提示", "请输入一个有效的URL！");
                }
              }
            });

          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              // 使用 .closest() 向上查找被点击的卡片
              const linkCard = e.target.closest(".link-share-card");
              if (linkCard) {
                const timestamp = parseInt(linkCard.dataset.timestamp);
                if (!isNaN(timestamp)) {
                  openBrowser(timestamp); // 调用我们的函数
                }
              }
            });

          // 浏览器返回按钮的事件监听，确保它只绑定一次
          document
            .getElementById("browser-back-btn")
            .addEventListener("click", () => {
              showScreen("chat-interface-screen");
            });

          // 1. 绑定输入框上方“分享链接”按钮的点击事件
          document
            .getElementById("share-link-btn")
            .addEventListener("click", openShareLinkModal);

          // 2. 绑定模态框中“取消”按钮的点击事件
          document
            .getElementById("cancel-share-link-btn")
            .addEventListener("click", () => {
              document
                .getElementById("share-link-modal")
                .classList.remove("visible");
            });

          // 3. 绑定模态框中“分享”按钮的点击事件
          document
            .getElementById("confirm-share-link-btn")
            .addEventListener("click", sendUserLinkShare);

          document
            .getElementById("theme-toggle-switch")
            .addEventListener("change", toggleTheme);

          const sizePanelToggle = document.getElementById("show-size-panel-toggle");
          if (sizePanelToggle) {
            sizePanelToggle.checked = state.globalSettings.showSizePanel ?? false;
            sizePanelToggle.addEventListener("change", async () => {
              const settings =
                (await db.globalSettings.get("main")) || state.globalSettings;
              settings.showSizePanel = sizePanelToggle.checked;
              state.globalSettings.showSizePanel = sizePanelToggle.checked;
              await db.globalSettings.put(settings);
              
              // === 新增：同步面板可见性缓存 ===
              localStorage.setItem('ephone-panel-visibility', JSON.stringify({
                showPhoneSizePanel: sizePanelToggle.checked
              }));
              
              applyPhoneSizePanelVisibility(sizePanelToggle.checked);
            });
          }

          // 绑定消息操作菜单中的“引用”按钮
          document
            .getElementById("quote-message-btn")
            .addEventListener("click", startReplyToMessage);

          // 绑定回复预览栏中的“取消”按钮
          document
            .getElementById("cancel-reply-btn")
            .addEventListener("click", cancelReplyMode);

          // 在你的 init() 函数的事件监听器区域...

          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              // 1. 向上查找被点击的元素是否在一个消息气泡内
              const bubble = e.target.closest(".message-bubble");
              if (!bubble) return; // 如果不在，就退出

              // 2. 【核心修正】在这里添加严格的筛选条件
              // 必须是 AI 的消息 (.ai)
              // 必须是转账类型 (.is-transfer)
              // 必须是我们标记为“待处理”的 (data-status="pending")
              if (
                bubble.classList.contains("ai") &&
                bubble.classList.contains("is-transfer") &&
                bubble.dataset.status === "pending"
              ) {
                // 3. 只有满足所有条件，才执行后续逻辑
                const timestamp = parseInt(bubble.dataset.timestamp);
                if (!isNaN(timestamp)) {
                  showTransferActionModal(timestamp);
                }
              }
            });

          // 在 init() 的事件监听区域添加
          document
            .getElementById("transfer-action-accept")
            .addEventListener("click", () =>
              handleUserTransferResponse("accepted"),
            );
          document
            .getElementById("transfer-action-decline")
            .addEventListener("click", () =>
              handleUserTransferResponse("declined"),
            );
          document
            .getElementById("transfer-action-cancel")
            .addEventListener("click", hideTransferActionModal);

          document
            .getElementById("chat-list-title")
            .addEventListener("click", renderCallHistoryScreen);

          // 2. 绑定通话记录页面的“返回”按钮
          document
            .getElementById("call-history-back-btn")
            .addEventListener("click", () => {
              // 【核心修改】返回到聊天列表页面，而不是聊天界面
              showScreen("chat-list-screen");
            });

          // 3. 监听卡片点击的逻辑保持不变
          document
            .getElementById("call-history-list")
            .addEventListener("click", (e) => {
              const card = e.target.closest(".call-record-card");
              if (card && card.dataset.recordId) {
                showCallTranscript(parseInt(card.dataset.recordId));
              }
            });

          // 4. 关闭详情弹窗的逻辑保持不变
          document
            .getElementById("close-transcript-modal-btn")
            .addEventListener("click", () => {
              document
                .getElementById("call-transcript-modal")
                .classList.remove("visible");
            });

          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              // 1. 检查点击的是否是语音条
              const voiceBody = e.target.closest(".voice-message-body");
              if (!voiceBody) return;

              // 2. 找到相关的DOM元素
              const bubble = voiceBody.closest(".message-bubble");
              if (!bubble) return;

              const waveIcon = voiceBody.querySelector(".wave-icon");
              const transcriptEl = bubble.querySelector(".voice-transcript");

              // 如果正在加载中，则不响应点击
              if (bubble.dataset.state === "loading") {
                return;
              }

              // 3. 如果文字已经展开，则收起
              if (bubble.dataset.state === "expanded") {
                transcriptEl.style.display = "none";
                bubble.dataset.state = "collapsed";
              } else {
                // 直接获取文字并显示
                const voiceText = bubble.dataset.voiceText || "(无法识别)";
                transcriptEl.textContent = voiceText; // 填充文字

                transcriptEl.style.display = "block"; // 显示文字容器
                bubble.dataset.state = "expanded"; // 标记为已展开状态
              }
            });

          document
            .getElementById("chat-header-status")
            .addEventListener("click", handleEditStatusClick);

          // 在 init() 的事件监听器区域添加
          document
            .getElementById("selection-share-btn")
            .addEventListener("click", () => {
              if (selectedMessages.size > 0) {
                openShareTargetPicker(); // 打开我们即将创建的目标选择器
              }
            });

          // 在 init() 的事件监听器区域添加
          document
            .getElementById("confirm-share-target-btn")
            .addEventListener("click", async () => {
              const sourceChat = state.chats[state.activeChatId];
              const selectedTargetIds = Array.from(
                document.querySelectorAll(".share-target-checkbox:checked"),
              ).map((cb) => cb.dataset.chatId);

              if (selectedTargetIds.length === 0) {
                showCustomAlert("提示", "请至少选择一个要分享的聊天。");
                return;
              }

              // 1. 打包聊天记录
              const sharedHistory = [];
              const sortedTimestamps = [...selectedMessages].sort(
                (a, b) => a - b,
              );
              for (const timestamp of sortedTimestamps) {
                const msg = sourceChat.history.find(
                  (m) => m.timestamp === timestamp,
                );
                if (msg) {
                  sharedHistory.push(msg);
                }
              }

              // 2. 创建分享卡片消息对象
              const shareCardMessage = {
                role: CONSTANTS.ROLES.USER,
                senderName: sourceChat.isGroup
                  ? sourceChat.settings.myNickname || "我"
                  : "我",
                type: "share_card",
                timestamp: Date.now(),
                payload: {
                  sourceChatName: sourceChat.name,
                  title: `来自“${sourceChat.name}”的聊天记录`,
                  sharedHistory: sharedHistory,
                },
              };

              // 3. 循环发送到所有目标聊天
              for (const targetId of selectedTargetIds) {
                const targetChat = state.chats[targetId];
                if (targetChat) {
                  targetChat.history.push(shareCardMessage);
                  await db.chats.put(targetChat);
                }
              }

              // 4. 收尾工作
              document
                .getElementById("share-target-modal")
                .classList.remove("visible");
              exitSelectionMode(); // 退出多选模式
              await showCustomAlert(
                "分享成功",
                `聊天记录已成功分享到 ${selectedTargetIds.length} 个会话中。`,
              );
              renderChatList(); // 刷新列表，可能会有新消息提示
            });

          // 绑定取消按钮
          document
            .getElementById("cancel-share-target-btn")
            .addEventListener("click", () => {
              document
                .getElementById("share-target-modal")
                .classList.remove("visible");
            });

          // 在 init() 的事件监听器区域添加
          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              // ...你已有的其他点击事件逻辑...

              // 新增逻辑：处理分享卡片的点击
              const shareCard = e.target.closest(
                ".link-share-card[data-timestamp]",
              );
              if (
                shareCard &&
                shareCard.closest(".message-bubble.is-link-share")
              ) {
                const timestamp = parseInt(shareCard.dataset.timestamp);
                openSharedHistoryViewer(timestamp);
              }
            });

          // 绑定查看器的关闭按钮
          document
            .getElementById("close-shared-history-viewer-btn")
            .addEventListener("click", () => {
              document
                .getElementById("shared-history-viewer-modal")
                .classList.remove("visible");
            });

          // 创建新函数来处理渲染逻辑
          function openSharedHistoryViewer(timestamp) {
            const chat = state.chats[state.activeChatId];
            const message = chat.history.find((m) => m.timestamp === timestamp);
            if (!message || message.type !== "share_card") return;

            const viewerModal = document.getElementById(
              "shared-history-viewer-modal",
            );
            const viewerTitle = document.getElementById(
              "shared-history-viewer-title",
            );
            const viewerContent = document.getElementById(
              "shared-history-viewer-content",
            );

            viewerTitle.textContent = message.payload.title;
            viewerContent.innerHTML = ""; // 清空旧内容

            // 【核心】复用 createMessageElement 来渲染每一条被分享的消息
            message.payload.sharedHistory.forEach((sharedMsg) => {
              // 注意：这里我们传入的是 sourceChat 对象，以确保头像、昵称等正确
              const sourceChat =
                Object.values(state.chats).find(
                  (c) => c.name === message.payload.sourceChatName,
                ) || chat;
              const bubbleEl = createMessageElement(sharedMsg, sourceChat);
              if (bubbleEl) {
                viewerContent.appendChild(bubbleEl);
              }
            });

            viewerModal.classList.add("visible");
          }

          audioPlayer.addEventListener("timeupdate", updateMusicProgressBar);

          audioPlayer.addEventListener("pause", () => {
            if (musicState.isActive) {
              musicState.isPlaying = false;
              updatePlayerUI();
            }
          });
          audioPlayer.addEventListener("play", () => {
            if (musicState.isActive) {
              musicState.isPlaying = true;
              updatePlayerUI();
            }
          });

          document
            .getElementById("playlist-body")
            .addEventListener("click", async (e) => {
              const target = e.target;
              if (target.classList.contains("delete-track-btn")) {
                const index = parseInt(target.dataset.index);
                const track = musicState.playlist[index];
                const confirmed = await showCustomConfirm(
                  "删除歌曲",
                  `确定要从播放列表中删除《${track.name}》吗？`,
                );
                if (confirmed) {
                  deleteTrack(index);
                }
                return;
              }
              if (target.classList.contains("lyrics-btn")) {
                const index = parseInt(target.dataset.index);
                if (isNaN(index)) return;
                const lrcContent = await new Promise((resolve) => {
                  const lrcInput = document.getElementById("lrc-upload-input");
                  const handler = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (re) => resolve(re.target.result);
                      reader.readAsText(file);
                    } else {
                      resolve(null);
                    }
                    lrcInput.removeEventListener("change", handler);
                    lrcInput.value = "";
                  };
                  lrcInput.addEventListener("change", handler);
                  lrcInput.click();
                });
                if (lrcContent !== null) {
                  musicState.playlist[index].lrcContent = lrcContent;
                  await saveGlobalPlaylist();
                  showCustomAlert("提示", "歌词导入成功！");
                  if (musicState.currentIndex === index) {
                    musicState.parsedLyrics = parseLRC(lrcContent);
                    renderLyrics();
                  }
                }
              }
            });

          document
            .querySelector(".progress-bar")
            .addEventListener("click", (e) => {
              if (!audioPlayer.duration) return;
              const progressBar = e.currentTarget;
              const barWidth = progressBar.clientWidth;
              const clickX = e.offsetX;
              audioPlayer.currentTime =
                (clickX / barWidth) * audioPlayer.duration;
            });

          // 使用事件委托来处理所有“已撤回消息”的点击事件
          document
            .getElementById("chat-messages")
            .addEventListener("click", (e) => {
              // 检查被点击的元素或其父元素是否是“已撤回”提示
              const placeholder = e.target.closest(
                ".recalled-message-placeholder",
              );
              if (!placeholder) return; // 如果不是，就退出

              // 如果是，就从聊天记录中找到对应的数据并显示
              const chat = state.chats[state.activeChatId];
              const wrapper = placeholder.closest(".message-wrapper"); // 找到它的父容器
              if (chat && wrapper) {
                // 从父容器上找到时间戳
                const timestamp = parseInt(wrapper.dataset.timestamp);
                const recalledMsg = chat.history.find(
                  (m) => m.timestamp === timestamp,
                );

                if (recalledMsg && recalledMsg.recalledData) {
                  let originalContentText = "";
                  const recalled = recalledMsg.recalledData;

                  if (recalled.originalType === CONSTANTS.MSG_TYPES.TEXT) {
                    originalContentText = `原文: "${recalled.originalContent}"`;
                  } else {
                    originalContentText = `撤回了一条[${recalled.originalType}]类型的消息`;
                  }
                  showCustomAlert("已撤回的消息", originalContentText);
                }
              }
            });

          document
            .getElementById("manage-world-book-categories-btn")
            .addEventListener("click", openCategoryManager);
          document
            .getElementById("close-category-manager-btn")
            .addEventListener("click", () => {
              document
                .getElementById("world-book-category-manager-modal")
                .classList.remove("visible");
              renderWorldBookScreen(); // 关闭后刷新主列表
            });
          document
            .getElementById("add-new-category-btn")
            .addEventListener("click", addNewCategory);
          document
            .getElementById("existing-categories-list")
            .addEventListener("click", (e) => {
              if (e.target.classList.contains("delete-group-btn")) {
                const categoryId = parseInt(e.target.dataset.id);
                deleteCategory(categoryId);
              }
            });

          const manageApiPresetsBtn = document.getElementById(
            "manage-api-presets-btn",
          );
          const apiPresetsModal = document.getElementById("api-presets-modal");
          const apiPresetsList = document.getElementById("api-presets-list");
          const savePresetNameInput = document.getElementById(
            "save-preset-name-input",
          );
          const savePresetBtn = document.getElementById("save-preset-btn");
          const closeApiPresetsModalBtn = document.getElementById(
            "close-api-presets-modal-btn",
          );

          if (manageApiPresetsBtn) {
            manageApiPresetsBtn.addEventListener("click", () => {
              renderApiPresetsList();
              apiPresetsModal.classList.add("visible");
            });
          }

          if (closeApiPresetsModalBtn) {
            closeApiPresetsModalBtn.addEventListener("click", () => {
              apiPresetsModal.classList.remove("visible");
            });
          }

          if (savePresetBtn) {
            savePresetBtn.addEventListener("click", async () => {
              const name = savePresetNameInput.value.trim();
              if (!name) return showCustomAlert("提示", "请输入配置名称");

              const newPreset = {
                name,
                proxyUrl: document.getElementById("proxy-url").value.trim(),
                apiKey: document.getElementById("api-key").value.trim(),
                model: document.getElementById("model-select").value,
                enableStreaming: document.getElementById(
                  "stream-request-switch",
                ).checked,
              };

              if (!state.globalSettings.apiPresets) {
                state.globalSettings.apiPresets = [];
              }

              // Check for duplicate name and overwrite
              const existingIndex = state.globalSettings.apiPresets.findIndex(
                (p) => p.name === name,
              );
              if (existingIndex > -1) {
                if (!(await showCustomConfirm("提示", `配置 "${name}" 已存在，是否覆盖？`))) return;
                state.globalSettings.apiPresets[existingIndex] = newPreset;
              } else {
                state.globalSettings.apiPresets.push(newPreset);
              }

              await db.globalSettings.put(state.globalSettings);
              renderApiPresetsList();
              savePresetNameInput.value = "";
              showCustomAlert("提示", "配置已保存");
            });
          }

          function renderApiPresetsList() {
            apiPresetsList.innerHTML = "";
            const presets = state.globalSettings.apiPresets || [];
            if (presets.length === 0) {
              apiPresetsList.innerHTML =
                '<div style="text-align:center; color:#999; padding:20px;">暂无保存的配置</div>';
              return;
            }

            presets.forEach((preset, index) => {
              const item = document.createElement("div");
              item.style.cssText =
                "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid var(--list-border);";

              const info = document.createElement("div");
              info.innerHTML = `<strong>${
                preset.name
              }</strong><br><span style="font-size:12px; color:var(--muted-text);">${
                preset.model
              } | ${preset.proxyUrl ? "Proxy" : "Direct"}</span>`;

              const actions = document.createElement("div");
              actions.style.display = "flex";
              actions.style.gap = "5px";

              const loadBtn = document.createElement("button");
              loadBtn.textContent = "加载";
              loadBtn.className = "form-button";
              loadBtn.style.cssText =
                "padding:5px 10px; font-size:12px; width:auto;";
              loadBtn.onclick = () => loadApiPreset(preset);

              const deleteBtn = document.createElement("button");
              deleteBtn.textContent = "删除";
              deleteBtn.className = "form-button";
              deleteBtn.style.cssText =
                "padding:5px 10px; font-size:12px; width:auto; background-color:var(--delete-btn-bg);";
              deleteBtn.onclick = () => deleteApiPreset(index);

              actions.appendChild(loadBtn);
              actions.appendChild(deleteBtn);
              item.appendChild(info);
              item.appendChild(actions);
              apiPresetsList.appendChild(item);
            });
          }

          function loadApiPreset(preset) {
            document.getElementById("proxy-url").value = preset.proxyUrl || "";
            document.getElementById("api-key").value = preset.apiKey || "";
            document.getElementById("stream-request-switch").checked =
              preset.enableStreaming || false;

            const modelSelect = document.getElementById("model-select");
            if (preset.model) {
              let optionExists = false;
              for (let i = 0; i < modelSelect.options.length; i++) {
                if (modelSelect.options[i].value === preset.model) {
                  optionExists = true;
                  break;
                }
              }
              if (!optionExists) {
                const opt = document.createElement("option");
                opt.value = preset.model;
                opt.textContent = preset.model + " (来自配置)";
                modelSelect.appendChild(opt);
              }
              modelSelect.value = preset.model;
            }

            apiPresetsModal.classList.remove("visible");
            showCustomAlert("提示", `已加载配置 "${preset.name}"，请点击“保存设置”以应用。`);
          }

          async function deleteApiPreset(index) {
            if (!(await showCustomConfirm("提示", "确定删除此配置吗？"))) return;
            state.globalSettings.apiPresets.splice(index, 1);
            await db.globalSettings.put(state.globalSettings);
            renderApiPresetsList();
          }

          // ===================================================================
          // 5. 启动！

          // Paging Logic (Home Screen Slider)
          const slider = document.querySelector(".home-screen-slider");
          const dots = document.querySelectorAll(".home-screen-dots .dot");
          if (slider && dots.length) {
            // 1. Update Dots on Scroll
            slider.addEventListener("scroll", () => {
              const pageIndex = Math.round(
                slider.scrollLeft / slider.clientWidth,
              );
              dots.forEach((d, i) => {
                d.style.opacity = i === pageIndex ? "1" : "0.4";
                d.classList.toggle("active", i === pageIndex);
              });
            });

            // 2. Mouse Drag Support
            let isDown = false;
            let startX;
            let scrollLeft;

            slider.addEventListener("mousedown", (e) => {
              isDown = true;
              slider.style.cursor = "grabbing";
              slider.style.scrollSnapType = "none"; // Disable snap while dragging
              startX = e.pageX - slider.offsetLeft;
              scrollLeft = slider.scrollLeft;
            });

            const snapToPage = () => {
              isDown = false;
              slider.style.cursor = "grab";
              slider.style.scrollSnapType = "x mandatory"; // Re-enable snap
              // Manual smooth snap to nearest page
              const pageIndex = Math.round(
                slider.scrollLeft / slider.clientWidth,
              );
              slider.scrollTo({
                left: pageIndex * slider.clientWidth,
                behavior: "smooth",
              });
            };

            slider.addEventListener("mouseleave", () => {
              if (isDown) snapToPage();
            });

            slider.addEventListener("mouseup", () => {
              if (isDown) snapToPage();
            });

            slider.addEventListener("mousemove", (e) => {
              if (!isDown) return;
              e.preventDefault();
              const x = e.pageX - slider.offsetLeft;
              const walk = (x - startX) * 1.5; // Drag speed multiplier
              slider.scrollLeft = scrollLeft - walk;
            });
          }

          showScreen("home-screen");
        }

        init();

        // 手机尺寸控制面板折叠/展开
        const toggleSizePanelBtn = document.getElementById("toggle-size-panel-btn");
        const sizePanelContent = document.getElementById("size-panel-content");
        if (toggleSizePanelBtn && sizePanelContent) {
          let isPanelCollapsed = false;
          toggleSizePanelBtn.addEventListener("click", () => {
            isPanelCollapsed = !isPanelCollapsed;
            sizePanelContent.style.display = isPanelCollapsed ? "none" : "block";
            toggleSizePanelBtn.textContent = isPanelCollapsed ? "+" : "−";
          });
        }
      });
