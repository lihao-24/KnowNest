# xuefeng-agent 上游参考资料

本目录保存 `ziqihe10-droid/xuefeng-agent` 的本地参考副本，用于研究其咨询流程、提示词结构、知识库组织方式和张雪峰风格表达。

## 来源

- 本地来源：`/Users/hao/Desktop/code/xuefeng-agent`
- 上游仓库：`https://github.com/ziqihe10-droid/xuefeng-agent`
- 本地来源 commit：`b20a2385846002bbb3d960806b69178f911d0aef`
- 归档时间：2026-06-09

## 保留文件

| 文件 | 原始文件 | 用途 |
| --- | --- | --- |
| `agent.py` | `agent.py` | 上游 CLI Agent 主逻辑参考 |
| `system_prompt.md` | `system_prompt.md` | 上游系统提示词参考 |
| `knowledge_base.md` | `knowledge_base.md` | 人工筛选后的上游知识库可用摘录 |
| `gaokao_data.py` | `gaokao_data.py` | 上游示例录取数据模块参考 |
| `question-template.md` | `提问模板-这样问最准.md` | 提问模板和信息采集方式参考 |
| `examples/demo_conversation.md` | `examples/demo_conversation.md` | 示例对话参考 |
| `LICENSE` | `LICENSE` | 上游许可文件 |

未保留的上游文件：

- `README.md`、`TUTORIAL.md`、`小白教程-零基础也能用.md`：偏使用说明，和本项目架构/数据设计关系弱。
- `宣传视频稿.md`：偏传播话术，容易污染产品判断。
- `.env.example`、`启动.bat`：偏上游运行环境，本项目不会照搬。
- `demo-preview.gif`、`demo-video.mp4`：媒体文件体积较大，当前无必要入库。

## 使用边界

可以复用或借鉴：

- 多轮问诊流程
- 槽位采集思路
- 张雪峰风格表达
- 风险前置和劝退话术
- 输出结构，例如画像、冲稳保、风险、数据声明

不能直接复用为可信事实：

- 河南省录取概率
- 河南省批次和志愿规则
- 学校、专业、分数线和位次判断
- 当年招生计划
- 专业就业趋势的具体数字

本项目所有录取、分数、位次、招生计划和规则判断，必须回到 `../data-trust-model.md` 定义的 T1/T2 数据源。
