---
title: 互联网工作方法论
date: 2024-09-23
lang: zh
tags: [工作]
description: 总结大厂工作的一套方法论——季度 OKR、例会节奏、任务推进、技术文档结构、研发流程与指标驱动。
---

总结下，目前大厂工作的方法论。

## 1. 季度 OKR

每个季度初制定这个季度的 OKR，开会在组内对齐。
在季度末进行 OKR review，对 kr 打分。

## 2. 例会

同步性质的会议多以“阅读并评论 + 过评论”为主。

- 双周会：规划双周迭代，review 上周的完成情况。
- 项目周会：总结单周任务进展。

  - review 项目核心指标
  - 记录 todo
  - 详细任务进展

- 站会：日常同步工作进度。

## 3. 任务推进

owner 指定方案，拉齐所有相关方评审。
评审完成后，拆解任务形成开发计划，较大的任务需要列出各个阶段的 milestone。

## 4. 文档

当同步一个较大的 context，使用文档作为载体。
常见的文档类型有：

- 需求调研文档
- 技术方案文档
- 联调文档
- 复盘文档

常见的技术文档结构

```
背景
提供必要的背景信息, 介绍为什么要做这件事情, 以及本文描述的方案在对应系统中的位置/作用是什么 ? (简单的架构图)

[optional]现状
部分方案为了更好解释现在遇到的问题, 需要提供下现状..

目的
To define the right problem | 背景和目标部分非常关键, 这里定义了到底要做什么事情, 以及解决什么问题(为什么). 请务必确认能清楚回答一下几个问题:
- What's the purpose of this design doc ?  | 目标是什么
- What product problem to solve, if applicable ? | 解决什么产品问题/带来什么产品价值 ?
- What technical problem do we need to solve, in order to solve this product problem ? | 为了实现对应目标/解决对应产品问题, 我们需要解决哪些技术问题 ?

[optional]Non-Goal
比如说: 这个方案不解决/不考虑什么问题等;

思路
在定义清楚要解决什么问题(即目标是什么)的基础:
- Can this technical problem broken down into smaller technical problems? | 将问题进一步拆解成几个关键子问题或者是步骤;
- For each technical problem, do we have different possible solutions? | 针对每个子问题和步骤, High Level给出对应可行的方案, 思考是否有其他更优的方案(Pros vs Cons);
备注: 思路部分应该是很精简的文字, 字数应该很少.

方案
方案部分是思路部分的延伸, 进一步具体介绍应该怎么做:
- For each technical problem, propose a preferred solution and at least one alternative solution. | 对每个子问题(步骤), 定义清楚最优(合适)的方案是什么; 如果有很值得考虑的候选方案的话, 最好描述清楚二者的对比(Pros vs Cons), 并总结最终选择某个方案的原因是什么(Architecture Desicions);
- Break down preferred solution into implementation tasks, if preferred solution is obvious or agreed after a review | 对应子问题的方案, 需要的话可以进一步拆解成具体要做的事情(子任务);
[Optional]整体架构
对于复杂的系统, 最好画个架构图: 描述清楚内部有哪些组件, 之间的关系是什么; 依赖哪些外部组件等;

[Optional]指标
对于技术方案来说, 不是拆解问题给出方案, 并完成对应实现就算完了; 需要在完成上线后再回顾下对应问题是否真的解决了.
对于部分场景来说, 可能完成后重新上线/测试验证下, 就能确定问题是否解决了; 但对于其他场景来说, 需要思考需要用哪些指标来衡量问题解决的怎么样 ? 比如说对于 xxx 自动上线系统来说, 需要评估多少服务是可以通过自动接入系统完成接入的, 以及自动接入系统消耗的人力和人工手动接入的人力对比等;

[Optional]测试和上线方案

[Optional]项目排期
Q: 项目排期怎么写 ?
A: 原则上至于持续时间比较长的项目才需要在方案中列下排期; 比如说1个月以上的项目;
1. 项目需要拆里程碑, 每个里程碑需要给出预期的DDL;
2. Best To Have: 每个里程碑下最好列下最重要的事情有哪些(KR, 预期是3-5个左右), 对应事情无需标注DDL;
```

## 5. 日常沟通

日常简单沟通以文字、截图为主，复杂问题使用语音/视频方式沟通。

## 6. 研发流程

- 新建分支
- 开发
- 提交 MR
- code review
- 触发流水线自动部署
- 线上回归

## 7. 指标驱动

- 运营指标
  - 满意度
  - PV / UV
  - 核心价值指标
- 服务稳定性指标
  - 接口成功率
  - 耗时
