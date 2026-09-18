---
title: 用 HuggingFace + MongoDb 搭建 Twikoo 评论系统
categories: ["工具"]
tags: ["Hugo", "Twikoo", "评论", "博客"]
date: 2026-01-26T10:19:41+08:00  
slug: "Set-up-Twikoo-comment-system"  
summary: “缺少评论系统的博客，总觉得缺少点灵魂。“  
draft: false  
comments: true  
---

如果你想有一个个人网站，市面上有很多搭建教程，我就先不写了，基于 **Hexo、Hugo、WordPress、VuePress……**这些平台都可以，挑选一款喜欢的主题，比如我的主题是 hugo-PaperMod，然后就可以开始搭建了，把网站放在 GitHub 的仓库里。

这时候，很多人会想要一个评论系统，giscus 搭建起来是最简单的，因为开源、免费、无广告，而且和 GitHub 的互联很好，有个缺点——就是浏览者想要评论必须要有个 GitHub 账号，这个其实有点门槛。

后来，我还是换成了 Twikoo，任何人都可以评论，大大的增加了个人博客的温度。

我使用的工具是 **HuggingFace+MongoDb**，下面我给大家分享一下，搭建的过程。

[MongoDb](https://cloud.mongodb.com/)

[HuggingFace](https://huggingface.co)

第一步，这两个网站的账号，你得先注册，有一个自己的账号。

![新建](https://img.hulatu.com/post/pG97hv.png)

![任意填一个名称](https://img.hulatu.com/post/uiR6fY.png)

![下一步](https://img.hulatu.com/post/8ZYyde.png)

![新建](https://img.hulatu.com/post/3a3ACh.png)

![必须要和我选择一样](https://img.hulatu.com/post/rp9z5k.png)

![记好这串密码](https://img.hulatu.com/post/hm6A6H.png)

请记好这串密码，后面要用到。

![调整 Ip](https://img.hulatu.com/post/5PyiX8.png)

![必须出现0.0.0.0/0](https://img.hulatu.com/post/PVAtTB.png)

![等状态称为 Active](https://img.hulatu.com/post/Br3prP.png)

![点 connect](https://img.hulatu.com/post/F1ktUU.png)

![点 drivers](https://img.hulatu.com/post/H2t32C.png)

![复制密钥](https://img.hulatu.com/post/bjIGV2.png)

记得把方框框起来的部分（包括尖括号），换成前面我要求大家复制保存起来的那个密钥，再把这一长串密钥，保存好。然后，打开下面的链接：

[密钥](https://huggingface.co/spaces/imaegoo/twikoo?duplicate=true)

![粘贴密钥](https://img.hulatu.com/post/MzsyFS.png)

把刚才复制的那一串密钥，粘贴进来，进行下一步。

![点击这里](https://img.hulatu.com/post/wh145n.png)


![复制这串地址](https://img.hulatu.com/post/nqXdoK.png)

在把刚才复制的链接，放在以下这段代码里。

在你的博客根目录下找到 layouts/partials/ 文件夹（如果没有就新建一个），创建一个文件叫 comments.html。填入以下代码：

```html
<div id="tcomment"></div>
<script src="https://registry.npmmirror.com/twikoo/1.6.44/files/dist/twikoo.min.js"></script>
<script>
twikoo.init({
  envId: '你的后端URL',    // 在单引号里填入获取的链接
  el: '#tcomment',
})
</script>
```

在 envId: 后填入我们刚复制的那个地址，那就是你的后端 URL。

最后，找到主题中显示文章内容的模板（通常在 themes/你的主题/layouts/_default/single.html）。不要直接改主题文件，建议将其**复制**到根目录下的 layouts/_default/single.html 中。
在合适的位置（通常是 {{ .Content }} 之后）添加：

```html
{{ partial "comments.html" . }}
```

然后去预览一下你的博客，开启了评论的文章，都可以显示评论系统了。

大家有什么问题，欢迎评论区讨论交流。
