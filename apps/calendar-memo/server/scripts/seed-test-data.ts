/**
 * 测试数据生成脚本
 * 生成 50 条覆盖所有功能的测试备忘录
 * 基于日期: 2026-03-23
 */

import { PrismaClient, Priority, RepeatType, RepeatEndType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 基础日期：2026-03-23 (周一)
const BASE_DATE = new Date('2026-03-23');

// 日期辅助函数
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🌱 开始生成测试数据...');

  // 1. 创建测试用户
  const hashedPassword = await bcrypt.hash('Test123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: '测试用户',
      password: hashedPassword,
    },
  });
  console.log('✅ 测试用户已创建:', user.id);

  // 2. 创建标签
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '工作' } },
      update: {},
      create: { name: '工作', color: '#EF4444', userId: user.id },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '个人' } },
      update: {},
      create: { name: '个人', color: '#3B82F6', userId: user.id },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '健康' } },
      update: {},
      create: { name: '健康', color: '#10B981', userId: user.id },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '学习' } },
      update: {},
      create: { name: '学习', color: '#F59E0B', userId: user.id },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '家庭' } },
      update: {},
      create: { name: '家庭', color: '#8B5CF6', userId: user.id },
    }),
  ]);
  console.log('✅ 标签已创建:', tags.map(t => t.name).join(', '));

  const tagIds = tags.map(t => t.id);

  // 3. 删除该用户现有的所有备忘录（避免重复）
  await prisma.memo.deleteMany({
    where: { userId: user.id },
  });
  console.log('🧹 已清理现有备忘录');

  // 4. 创建 50 条测试备忘录
  const memos = [
    // ========== 今天 (2026-03-23) - 第1-8条 ==========
    {
      // 1. 今天高优先级未完成
      title: '提交季度报告',
      description: '需要完成Q1季度的业务报告，包含数据分析和总结',
      location: '公司',
      date: formatDate(BASE_DATE),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]], // 工作
    },
    {
      // 2. 今天高优先级已完成
      title: '晨会汇报',
      description: '向团队汇报项目进度',
      location: '会议室A',
      date: formatDate(BASE_DATE),
      priority: Priority.HIGH,
      completed: true,
      tags: [tagIds[0]],
    },
    {
      // 3. 今天中优先级未完成
      title: '回复客户邮件',
      description: '回复重要客户的询价邮件',
      location: '',
      date: formatDate(BASE_DATE),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 4. 今天低优先级
      title: '整理桌面文件',
      description: '清理电脑桌面和文件夹',
      location: '',
      date: formatDate(BASE_DATE),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[1]], // 个人
    },
    {
      // 5. 今天无优先级
      title: '午休散步',
      description: '饭后散步15分钟',
      location: '公园',
      date: formatDate(BASE_DATE),
      priority: null,
      completed: false,
      tags: [tagIds[2]], // 健康
    },
    {
      // 6. 今天多标签
      title: '团队建设活动筹备',
      description: '计划下周的团队建设活动',
      location: '公司',
      date: formatDate(BASE_DATE),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[0], tagIds[4]], // 工作+家庭
    },
    {
      // 7. 今天带图片
      title: '拍摄产品照片',
      description: '为新产品拍摄宣传照片',
      location: '摄影棚',
      date: formatDate(BASE_DATE),
      priority: Priority.HIGH,
      completed: false,
      imageUrl: 'https://picsum.photos/400/300?random=1',
      tags: [tagIds[0]],
    },
    {
      // 8. 今天重复事项
      title: '每日站会',
      description: '团队每日15分钟站会',
      location: '办公室',
      date: formatDate(BASE_DATE),
      priority: Priority.MEDIUM,
      completed: false,
      repeatType: RepeatType.DAILY,
      tags: [tagIds[0]],
    },

    // ========== 明天 (2026-03-24) - 第9-14条 ==========
    {
      // 9. 明天高优先级
      title: '重要客户会议',
      description: '与ABC公司讨论合作协议',
      location: 'ABC公司总部',
      date: formatDate(addDays(BASE_DATE, 1)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 10. 明天中优先级
      title: '代码审查',
      description: '审查团队成员提交的代码',
      location: '',
      date: formatDate(addDays(BASE_DATE, 1)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[0], tagIds[3]], // 工作+学习
    },
    {
      // 11. 明天健康事项
      title: '牙医预约',
      description: '半年一次牙齿检查',
      location: '市口腔医院',
      date: formatDate(addDays(BASE_DATE, 1)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[2]],
    },
    {
      // 12. 明天个人事项
      title: '购买生日礼物',
      description: '给妈妈买生日礼物',
      location: '购物中心',
      date: formatDate(addDays(BASE_DATE, 1)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[1], tagIds[4]],
    },
    {
      // 13. 明天学习
      title: '在线课程学习',
      description: '完成React高级课程第5章',
      location: '家中',
      date: formatDate(addDays(BASE_DATE, 1)),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[3]],
    },
    {
      // 14. 明天重复-每周
      title: '周报提交',
      description: '提交本周工作总结',
      location: '',
      date: formatDate(addDays(BASE_DATE, 1)),
      priority: Priority.MEDIUM,
      completed: false,
      repeatType: RepeatType.WEEKLY,
      tags: [tagIds[0]],
    },

    // ========== 后天 (2026-03-25) - 第15-18条 ==========
    {
      // 15. 后天高优先级
      title: '产品发布会',
      description: '新产品上线发布会，需要准备演讲稿',
      location: '会议中心',
      date: formatDate(addDays(BASE_DATE, 2)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 16. 后天家庭
      title: '接孩子放学',
      description: '提前下班接孩子',
      location: '学校',
      date: formatDate(addDays(BASE_DATE, 2)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[4]],
    },
    {
      // 17. 后天健身
      title: '健身房锻炼',
      description: '有氧运动30分钟+力量训练',
      location: '健身房',
      date: formatDate(addDays(BASE_DATE, 2)),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[2]],
    },
    {
      // 18. 后天重复-每月
      title: '月度账目整理',
      description: '整理本月收支账目',
      location: '家中',
      date: formatDate(addDays(BASE_DATE, 2)),
      priority: Priority.MEDIUM,
      completed: false,
      repeatType: RepeatType.MONTHLY,
      tags: [tagIds[1]],
    },

    // ========== 未来几天 (3-7天) - 第19-25条 ==========
    {
      // 19. 3天后项目截止
      title: '项目里程碑交付',
      description: '完成第一阶段开发并交付',
      location: '公司',
      date: formatDate(addDays(BASE_DATE, 3)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 20. 4天后会议
      title: '季度规划会议',
      description: '讨论Q2季度目标和计划',
      location: '大会议室',
      date: formatDate(addDays(BASE_DATE, 4)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 21. 5天后面试
      title: '面试候选人',
      description: '面试前端开发工程师候选人',
      location: '公司',
      date: formatDate(addDays(BASE_DATE, 5)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 22. 6天后家庭聚会
      title: '家庭聚餐',
      description: '周末家庭聚餐',
      location: '餐厅',
      date: formatDate(addDays(BASE_DATE, 6)),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[4]],
    },
    {
      // 23. 7天后学习
      title: '技术分享会',
      description: '参加前端技术社区分享会',
      location: '科技园',
      date: formatDate(addDays(BASE_DATE, 7)),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[3]],
    },
    {
      // 24. 3天后重复-每周
      title: '团队回顾会议',
      description: '每周团队回顾和改进讨论',
      location: '会议室B',
      date: formatDate(addDays(BASE_DATE, 3)),
      priority: Priority.MEDIUM,
      completed: false,
      repeatType: RepeatType.WEEKLY,
      tags: [tagIds[0]],
    },
    {
      // 25. 7天后重复-每两周
      title: '双周复盘',
      description: '双周工作和学习复盘',
      location: '',
      date: formatDate(addDays(BASE_DATE, 7)),
      priority: Priority.LOW,
      completed: false,
      repeatType: RepeatType.BIWEEKLY,
      tags: [tagIds[0], tagIds[3]],
    },

    // ========== 过去几天 (过期) - 第26-30条 ==========
    {
      // 26. 昨天已完成
      title: '项目评审',
      description: '项目阶段性评审会议',
      location: '会议室',
      date: formatDate(addDays(BASE_DATE, -1)),
      priority: Priority.HIGH,
      completed: true,
      tags: [tagIds[0]],
    },
    {
      // 27. 2天前未完成（过期）
      title: '文档更新',
      description: '更新API接口文档',
      location: '',
      date: formatDate(addDays(BASE_DATE, -2)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[0], tagIds[3]],
    },
    {
      // 28. 3天前已完成
      title: '培训学习',
      description: '参加公司内部培训',
      location: '培训室',
      date: formatDate(addDays(BASE_DATE, -3)),
      priority: Priority.LOW,
      completed: true,
      tags: [tagIds[3]],
    },
    {
      // 29. 上周重复事项已完成
      title: '周例会',
      description: '每周团队例会',
      location: '会议室',
      date: formatDate(addDays(BASE_DATE, -4)),
      priority: Priority.MEDIUM,
      completed: true,
      repeatType: RepeatType.WEEKLY,
      tags: [tagIds[0]],
    },
    {
      // 30. 上周未完成的低优先级
      title: '阅读技术博客',
      description: '阅读行业最新技术文章',
      location: '家中',
      date: formatDate(addDays(BASE_DATE, -5)),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[3]],
    },

    // ========== 未来几周 (2-4周) - 第31-38条 ==========
    {
      // 31. 2周后重要事项
      title: '年度绩效评估',
      description: '准备年度绩效评估材料',
      location: '公司',
      date: formatDate(addDays(BASE_DATE, 14)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 32. 3周后
      title: '团建活动',
      description: '公司春季团建活动',
      location: '郊外',
      date: formatDate(addDays(BASE_DATE, 21)),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[0], tagIds[4]],
    },
    {
      // 33. 4周后
      title: '健康检查',
      description: '年度身体健康检查',
      location: '医院',
      date: formatDate(addDays(BASE_DATE, 28)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[2]],
    },
    {
      // 34. 2周后重复-每月
      title: '月度汇报',
      description: '向管理层汇报月度工作',
      location: '大会议室',
      date: formatDate(addDays(BASE_DATE, 14)),
      priority: Priority.HIGH,
      completed: false,
      repeatType: RepeatType.MONTHLY,
      tags: [tagIds[0]],
    },
    {
      // 35. 3周后重复-每季度
      title: '季度财务审计',
      description: '配合财务部门进行季度审计',
      location: '公司',
      date: formatDate(addDays(BASE_DATE, 21)),
      priority: Priority.HIGH,
      completed: false,
      repeatType: RepeatType.QUARTERLY,
      tags: [tagIds[0]],
    },
    {
      // 36. 2周后个人事项
      title: '缴纳物业费',
      description: '缴纳小区物业费',
      location: '物业办公室',
      date: formatDate(addDays(BASE_DATE, 14)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[1]],
    },
    {
      // 37. 3周后学习
      title: '考证报名截止',
      description: 'PMP认证考试报名截止',
      location: '网上报名',
      date: formatDate(addDays(BASE_DATE, 21)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[3]],
    },
    {
      // 38. 4周后家庭
      title: '清明节扫墓',
      description: '清明节回乡扫墓',
      location: '老家',
      date: formatDate(addDays(BASE_DATE, 28)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[4]],
    },

    // ========== 未来几个月 - 第39-44条 ==========
    {
      // 39. 2个月后
      title: '年中总结',
      description: '准备年中工作总结报告',
      location: '公司',
      date: formatDate(addDays(BASE_DATE, 60)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 40. 3个月后
      title: '年中体检',
      description: '公司组织的年中体检',
      location: '体检中心',
      date: formatDate(addDays(BASE_DATE, 90)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[2]],
    },
    {
      // 41. 2个月后重复-每年
      title: '结婚纪念日',
      description: '和爱人庆祝结婚纪念日',
      location: '餐厅',
      date: formatDate(addDays(BASE_DATE, 60)),
      priority: Priority.HIGH,
      completed: false,
      repeatType: RepeatType.YEARLY,
      tags: [tagIds[4]],
    },
    {
      // 42. 3个月后重复-每半年
      title: '车辆保养',
      description: '汽车半年保养',
      location: '4S店',
      date: formatDate(addDays(BASE_DATE, 90)),
      priority: Priority.LOW,
      completed: false,
      repeatType: RepeatType.SEMIANNUAL,
      tags: [tagIds[1]],
    },
    {
      // 43. 4个月后
      title: '暑期旅行计划',
      description: '制定暑期家庭旅行计划',
      location: '',
      date: formatDate(addDays(BASE_DATE, 120)),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[4]],
    },
    {
      // 44. 5个月后
      title: '孩子开学准备',
      description: '购买新学年学习用品',
      location: '书店',
      date: formatDate(addDays(BASE_DATE, 150)),
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[4]],
    },

    // ========== 特殊场景 - 第45-50条 ==========
    {
      // 45. 当天无标签
      title: '冥想放松',
      description: '进行15分钟冥想练习',
      location: '家中',
      date: formatDate(BASE_DATE),
      priority: Priority.LOW,
      completed: false,
      tags: [],
    },
    {
      // 46. 长描述
      title: '项目需求分析',
      description: '这是一个非常详细的项目需求分析任务，需要收集各方面的需求，整理成文档，与相关方确认，最终形成需求规格说明书。预计需要3天时间完成。',
      location: '公司会议室',
      date: formatDate(addDays(BASE_DATE, 2)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 47. 多标签组合
      title: '亲子阅读时间',
      description: '和孩子一起阅读绘本',
      location: '家中',
      date: formatDate(BASE_DATE),
      priority: Priority.LOW,
      completed: false,
      tags: [tagIds[2], tagIds[3], tagIds[4]], // 健康+学习+家庭
    },
    {
      // 48. 重复-每天带结束日期
      title: '连续7天健身挑战',
      description: '每天运动30分钟，连续7天',
      location: '健身房',
      date: formatDate(BASE_DATE),
      priority: Priority.MEDIUM,
      completed: false,
      repeatType: RepeatType.DAILY,
      repeatEndType: RepeatEndType.ONDATE,
      repeatEndDate: formatDate(addDays(BASE_DATE, 6)),
      tags: [tagIds[2]],
    },
    {
      // 49. 高优先级未来
      title: '重要合同签署',
      description: '与大客户签署年度合作协议',
      location: '客户公司',
      date: formatDate(addDays(BASE_DATE, 10)),
      priority: Priority.HIGH,
      completed: false,
      tags: [tagIds[0]],
    },
    {
      // 50. 跨年度事项
      title: '新年计划制定',
      description: '制定2027年度个人和工作计划',
      location: '',
      date: '2026-12-31',
      priority: Priority.MEDIUM,
      completed: false,
      tags: [tagIds[1], tagIds[0]],
    },
  ];

  // 批量创建备忘录
  let createdCount = 0;
  for (const memoData of memos) {
    const { tags: memoTags, ...memoWithoutTags } = memoData;
    
    await prisma.memo.create({
      data: {
        ...memoWithoutTags,
        userId: user.id,
        tags: memoTags && memoTags.length > 0 ? {
          connect: memoTags.map(id => ({ id })),
        } : undefined,
      },
    });
    createdCount++;
  }

  console.log(`✅ 已创建 ${createdCount} 条测试备忘录`);

  // 5. 创建一些完成记录（用于测试重复事项的完成状态）
  const repeatMemos = await prisma.memo.findMany({
    where: {
      userId: user.id,
      repeatType: { not: RepeatType.NONE },
    },
  });

  // 为第一个重复备忘录添加完成记录
  if (repeatMemos.length > 0) {
    const firstRepeat = repeatMemos[0];
    
    // 昨天的实例标记为已完成
    await prisma.memoCompletion.create({
      data: {
        memoId: firstRepeat.id,
        instanceDate: formatDate(addDays(BASE_DATE, -1)),
        completed: true,
      },
    });
    
    console.log('✅ 已创建重复事项的完成记录');
  }

  console.log('\n🎉 测试数据生成完成！');
  console.log('📧 登录账号: test@example.com');
  console.log('🔑 登录密码: Test123456');
  console.log('\n测试数据包含：');
  console.log('  - 5个标签（工作、个人、健康、学习、家庭）');
  console.log('  - 50条备忘录，覆盖各种场景：');
  console.log('    • 今天：高/中/低优先级，完成/未完成');
  console.log('    • 明天：包含高优先级待办');
  console.log('    • 过去：已过期事项');
  console.log('    • 未来：近期和远期规划');
  console.log('    • 重复：每天、每周、每月、每季度、每半年、每年');
  console.log('    • 标签组合：单标签、多标签、无标签');
  console.log('    • 特殊：带图片、长描述、有结束日期的重复');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
