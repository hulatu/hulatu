---
title: "工科研究生用 Mac，也可以很完美"
date: 2026-10-07T13:41:50+08:00
lastmod: 2026-10-07T13:41:50+08:00
slug: "engineering-students-use-macbook"
summary: "为了最想要的那个理想物品，总得付出点什么。"
description: "我是一名超级喜欢 Mac 的工科研究生，结合我自己读研的经验，告诉大家如何好好使用 Mac，完成自己读研过程中的数据分析处理、绘图要求等等，其实我们工科生，也能用 Mac。"
categories: ["工具"]
tags: ["Mac", "AI", "科研", "编程"]
series: ""
comments: true
draft: false
---

关于 Mac 和 Windows 之争，貌似一直就没有休止过。好像每一边都有另一边「不可替代」的护城河，最后得出的结论，都会回到：「大家根据自己的需求和关注点，选择合适的产品」这样熟悉、统一又无感的话术里。

但现实很多时候，我觉得并不是那么理性、明晰的，有一个完美的选择，等待着每个人去按下确认/否认按钮。

很多时候是，我更喜欢某一个东西——做工、质感、审美。但因为某些「不可更改的」情景和前提，只能忍痛放弃掉那个更喜欢的东西，选择妥协，最终导致花了不小一笔支出，但还是没有收获到那么让人满意的产品！

说的是不是你？

## 我喜欢 Mac {#wo-xi-huan-mac}

对于电脑，我个人是 Mac 的忠实推荐者，并且是基于「长年限、高频使用后」的强烈推荐，我并没有收取任何的广告费，单纯的基于产品、工具、使用体验来推荐这款产品。

所以 21 年买电脑的时候，我就不是基于「脑子一热」的冲动下单，而是基于我对这款产品历史的足够了解、未来的发展计划、我自己的平日习惯和要求，而下单的一款产品。

准确来说：我十分坚定且清晰的知道我自己是什么样的、且未来要做什么、我想要什么！也知道这款产品过去是怎样的、现在在干嘛、未来会怎么发展。

一直到今天，我都觉得：每个人，都应该拥有一台搭载 M 芯片的 Mac 电脑，体验一下这个世界上最优雅、最符合笔记本终极形态的顶级工业产品，是什么样的。

## 工科生也适合用 Mac {#gong-ke-sheng-ye-shi-he}

过去我们提到「劝退购买 Mac」的理由里，总会看到那一条——如果你是理工科的学生，有很多专业软件的需求，那么不建议购买 Mac 电脑。

这个建议好像看起来有一些道理，但是越到今天、越往后，这个建议显得越发无力、苍白。

因为 Mac 的软件生态、开源生态已经越来越丰富，很多工业软件在 Mac 上已经有设计更精美、交互体验更好的平替了，只是说很多人只听说过在 Windows 上那些大名鼎鼎的软件，以为 Mac 上没有，就好像 Mac 不能用。

但其实，现实并不是这样。只是我们需要花时间、花精力去找找资源、学习一些操作。

## 我就是工科研究生 {#wo-jiu-shi-gong-ke-yan}

我本身就是一名工科在读研究生，我使用的就是 MacBook，但是马上研三即将毕业，我也没有遇到过「一定非得 Windows 不可」的场景，真的！

比如说平日汇报的 PPT，论文里需要用到的机理图、流程图等等，Keynote 的使用体验不知道甩 PowerPoint 多少条街，我依旧这么觉得。Mac 系统自带的软件，Keynote 一定是值得大家悉心把玩的应用。

遇到一些需要数据处理、绘制图表的场景，比如需要分析处理一批新鲜出炉的「平行实验数据」，需要知道显著性差异、方差等等；然后根据这些数据结果绘制带有误差棒和标记显著差异性的图表。

貌似这些工作「一定要用到 SPSS、Origin」，但其实它一直都有其它可以解决的办法。

## 我怎么用 Mac {#wo-zen-me-yong-mac}

在 AI 兴起之前，Python 就是一个「万金油编程语言」，简单直观的语法结构搭配上丰富的第三方库，真的可以实现、解决很多领域的功能需求。

比如我们工科生的数据分析处理、图表绘制要求，Python 的 Numpy、Pandas、Matplotlib、Seaborn 这几个库，可以满足我们的绝大部分需求，并且我也一直在使用。

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import re
import io

# ================= 1. 绘图风格与字体设置 =================
# 使用 Matplotlib 内置字体，避免系统字体缺失导致报错
sns.set_theme(style="whitegrid", rc={"grid.linestyle": "--", "grid.linewidth": 0.5})
plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False


# ================= 2. 数据 =================
# 如果本地有“色泽.csv”，可以取消下面这行注释，并注释掉 df = pd.read_csv(io.StringIO(csv_data))
# df = pd.read_csv("色泽.csv", encoding="utf-8-sig")

csv_data = """指标,CK,LP,MP,OPT,HP
L*（亮度）,38.38±0.32ᵃ,39.06±0.54ᵃ,40.21±0.31ᵇ,41.43±0.16ᶜ,42.23±0.06ᶜ
a*（红度）,6.44±0.07ᵃ,6.52±0.07ᵃ,6.63±0.05ᵇ,6.78±0.06ᶜ,6.80±0.02ᶜ
b*（黄度）,10.52±0.42ᵃ,11.49±0.21ᵇ,12.74±0.29ᶜ,13.79±0.25ᵈ,14.19±0.25ᵈ
C*（色度）,12.33±0.39ᵃ,13.22±0.18ᵇ,14.36±0.27ᶜ,15.36±0.25ᵈ,15.73±0.24ᵈ
h°（色调角）,58.50±0.73ᵃ,60.42±0.50ᵇ,62.49±0.43ᶜ,63.80±0.26ᵈ,64.40±0.33ᵈ
ΔE*（总色差）,58.60±0.25ᶜ,58.09±0.54ᶜ,57.20±0.34ᵇ,56.24±0.17ᵃ,55.55±0.12ᵃ
"""

df = pd.read_csv(io.StringIO(csv_data))


# ================= 3. 修复上标字母映射 =================
# 只映射数据中实际出现的上标字母：ᵃ、ᵇ、ᶜ、ᵈ
superscript_map = str.maketrans("ᵃᵇᶜᵈ", "abcd")


# ================= 4. 解析“均值±标准差字母” =================
def parse_value(val):
    """
    将类似 38.38±0.32a 的字符串拆分为：
    均值、标准差、显著性字母
    """
    val_str = str(val).translate(superscript_map)

    match = re.search(r"([\d\.]+)\s*±\s*([\d\.]+)", val_str)

    if not match:
        return np.nan, np.nan, ""

    mean = float(match.group(1))
    std = float(match.group(2))
    letter = val_str[match.end():].strip()

    return mean, std, letter


# ================= 5. 图表标题映射 =================
# 使用英文标题，避免中文字体或特殊符号导致渲染异常
def get_safe_title(name):
    name = str(name)

    if "ΔE" in name or "总色差" in name:
        return "ΔE* (Total Color Difference)"

    if "L*" in name:
        return "L* (Lightness)"

    if "a*" in name:
        return "a* (Redness)"

    if "b*" in name:
        return "b* (Yellowness)"

    if "C*" in name:
        return "C* (Chroma)"

    if "h" in name and ("°" in name or "色调" in name):
        return "h° (Hue angle)"

    return name


# ================= 6. 开始绘图 =================
indicators = df["指标"].tolist()
groups = df.columns[1:].tolist()

fig, axes = plt.subplots(2, 3, figsize=(16, 10))
axes = axes.flatten()

palette = sns.color_palette("muted", len(groups))
x = np.arange(len(groups))
width = 0.6

for i, indicator in enumerate(indicators):
    ax = axes[i]

    means = []
    stds = []
    letters = []

    row = df[df["指标"] == indicator]

    for group in groups:
        m, s, l = parse_value(row[group].values[0])
        means.append(m)
        stds.append(s)
        letters.append(l)

    # 柱状图 + 误差棒
    ax.bar(
        x,
        means,
        width,
        yerr=stds,
        color=palette,
        capsize=6,
        edgecolor="black",
        linewidth=1.2,
        error_kw={"linewidth": 1.2},
    )

    # 动态设置 Y 轴上限，避免显著性字母被截断
    y_max = max([m + s for m, s in zip(means, stds)])
    ax.set_ylim(0, y_max * 1.20)

    # 添加显著性字母
    for j in range(len(groups)):
        ax.text(
            x[j],
            means[j] + stds[j] + y_max * 0.03,
            letters[j],
            ha="center",
            va="bottom",
            fontsize=14,
            fontweight="bold",
            color="black",
        )

    # 坐标轴和标题
    ax.set_xticks(x)
    ax.set_xticklabels(groups, fontsize=12, fontweight="bold")
    ax.set_title(get_safe_title(indicator), fontsize=14, fontweight="bold", pad=10)
    ax.set_ylabel("Value", fontsize=12)

    # 去掉上边框和右边框，使图表更符合科研论文风格
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_linewidth(1.2)
    ax.spines["bottom"].set_linewidth(1.2)

plt.tight_layout()

# 保存图片
plt.savefig("Color_Properties_Chart.png", dpi=300, bbox_inches="tight")
plt.savefig("Color_Properties_Chart.pdf", bbox_inches="tight")

print("图表已生成：Color_Properties_Chart.png 和 Color_Properties_Chart.pdf")

plt.show()
```

在组会汇报上使用过很多次，没什么问题出现。而且偷偷告诉你，我的表真的真的几秒钟，就能自动完整生成。

![完全可用](https://img.hulatu.com/post/GCB5TQ.png)

再比如我的实验会用到「响应面」，Design-Expert 这个 Windows 专业软件，貌似绕不过去，但是其实也有解决方法，让我不需要用到 Windows 电脑，也可以在 Mac 上达成目的。

pydoe + pandas + statsmodels + scipy + matplotlib 这几个 Python 第三方库，就能够达成「响应面专业软件」实现的功能。并且更轻量、更快速。

如果你的实验与「正交试验」设计相关，那么 pydoe + oapackage + statsmodels + pandas + matplotlib 这些库搭配起来，也可以达成目的。

| **步骤**           | **推荐工具**           | **说明**                     |
| ------------------ | ---------------------- | ---------------------------- |
| 生成正交表/RSM设计 | pydoe + oapackage      | 覆盖绝大多数正交与响应面设计 |
| 数据整理           | numpy + pandas         | 必用                         |
| 极差 + 方差分析    | pandas + statsmodels   | 完全可替代专业软件           |
| 二次响应面拟合     | statsmodels 或 sklearn | 得到回归方程                 |
| 优化与驻点求解     | scipy.optimize         | 求最优条件                   |
| 可视化             | matplotlib + seaborn   | 极差图、等高线、3D响应面     |
| 交互式报告         | Jupyter Notebook       | 强烈推荐使用                 |

那么这些库和编程语言的「使用」，是不是会耗费我们大量的时间成本去学士、去钻研编程呢？

答案是：不用！

## AI 的时代红利 {#ai-de-shi-dai-hong-li}

很多人都在讨论，AI 时代「毁掉了我们什么」。但我今天，可能要聊聊可能很长一段时间大家都忽略了的话题——AI 真正可以解放我们什么？

不说远的，我就只谈谈与我身份相关的、与所有工科生相关的话题——AI 能帮助我们做什么？

**一个意识**

请大家一定要有一个意识：我们所使用的所有「工程、工科软件」，都是使用「计算机编程语言」编写出来的，所以再精确、好用的软件，说到底这个软件的「内核」，是编程语言。

这个没问题吧！

然后，如果我们跳过「软件」，直接使用某一门语言，比如 Python、R 语言，这些天然就适合「数据、图表处理」相关的编程语言，来处理我们的实验数据、绘制图表，本就是很合理且很高效的一种手段，它不存在「不准确、会出错、不可靠」的说法。

相反，它很可靠、很快速，可能只是操作没有「软件操作」那么直观。

**一个红利**

在 AI 工具遍地开花的今天，你使用任何一个 AI 工具（免费额度都可以），向它们提出要求，它们都能把我们自己可能「串联不起来的需求、功能」，完成的非常好。

这就是我觉得我们处于 AI 时代最大的红利：不需要完整的了解、熟悉一个新领域，就能够用上它来干活。

比如说，我刚测完了几个样品平行数据，我把它录入进了 Excel，但是下一步要怎么分析、要用到什么软件等等，我都不知道，因为我的电脑好像既没有专业的数据分析软件，我也不会使用上面提到的那些变成语言。

那我是不是就卡在这了？No！

我们只需要知道我们会用到 Python、R 语言，然后向 AI 工具提要求，让它们告诉我们应该怎样操作，让它们为我们编写好对应的脚本，后面我们按照它的要求，在命令行工具或者 VsCode 里跑起来，可能所有的目标，都实现了，而且很快、很高效。

然后等到下一次，遇到同样的要求，我们只需要更改数据，使用同样的脚本，依旧可以跑出来满意的结果。

这，难道不是一种 AI 时代的「降本增效」嘛！

---

所以说，MacBook、MacOS 这套搭配，在今天，已经不存在「适不适用」于某个特殊的专业了，可能确实有一些专业不匹配，但我相信这个范围也已经无限缩小，缩小到极大的概率不会是你。

学会向 AI 提问解决方案，用 AI 串联起我们没有基础的领域，给我们创造出 1 个能跑起来的工作流，真的能解决很多「左右我们决定」的选择性难题。
