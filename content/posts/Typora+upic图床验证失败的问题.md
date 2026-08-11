---
title: "Typora+upic图床验证失败的问题" 
categories: ["工具", "博客"]
tags: ["写作工具", "Typora"]
cover: "https://img.hulatu.com/post/img-bed.webp"
date: 2026-01-18T22:08:48+08:00  
slug: "Image-Hosting-Service-Blog"  
draft: false  
summary: "一个格式，解决图片上传图床失败问题。"
comments: true
---

我经常用的写作工具是 Typora，我喜欢他的白背板、即时渲染。搭配上 uPic 图床工具，插进来的图片可以直接自动上传到 GitHub 图床，很丝滑。

但是，我重装电脑后，Typora 和 uPic 的**验证**出问题了——总是验证失败。不是图床的问题，因为我的 uPic 单独上传图片，是成功的，那是什么问题？

查了很多资料后，发现是我曾经建立过 Typora 和 uPic 的连接，所以再次验证上传的图片，其实在 GitHub 图床里已经存在了，那么再次上传一样的照片，因为 uPic 没有覆盖机制，就会显示**验证失败**。

这个图片重复问题，并不是只出现在 Typora 的验证图片上传设置的时候，还有其他时候——如果我们上传一张过去传过的照片，就有极大的概率失败。

找到问题就很好解决了：

![修改保存路径][image-1]

在我们的 uPic 偏好设置里，把**保存路径**的格式修改一下，加上{random}这个变量，这样哪怕我们传送同一张照片多次，因为文件名里一定有一个**随机元素**，所以他们的文件名不可能重复，也就不会出现文件名带来的错误。

```markdown
uPic/{random}{.suffix}
```

把我的这段路径名直接替换掉你原来的。

最后，这个开关一定选择关闭，不然也容易上传图片失败。

![输出格式编码，选择关闭][image-2]

用我这个方法操作后，再去 Typora 验证 uPic 图片上传选项，就一定能成功了。

![推荐设置+验证图片上传][image-3]

![成功][image-4]

希望对大家有帮助，谢谢！

[image-1]:	https://img.hulatu.com/post/image-20260118204110354_XYkciA_1Kcicx.webp
[image-2]:	https://img.hulatu.com/post/image-20260120091231876_Q02gqg.webp
[image-3]:	https://img.hulatu.com/post/image-20260118204738912_YDQsok_jhnxpU.webp
[image-4]:	https://img.hulatu.com/post/image-20260118204758814_xwLekM_8tfHEa.webp