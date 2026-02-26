/**
 * PostgreSQL 数据库种子脚本
 * 生成测试数据用于开发
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // 检查是否已有数据
    const existingUser = await prisma.user.findFirst();
    if (existingUser) {
      console.log('⚠️  Database already has data. Use --force to reseed.\n');
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
      console.log('Force seeding...\n');
      
      // 清理旧数据
      await prisma.memoTag.deleteMany();
      await prisma.memo.deleteMany();
      await prisma.tag.deleteMany();
      await prisma.verificationCode.deleteMany();
      await prisma.user.deleteMany();
    }

    // 创建用户 cici
    console.log('👤 Creating user: cici');
    const passwordHash = await bcrypt.hash('ILoveYou', 12);
    
    const cici = await prisma.user.create({
      data: {
        email: 'cici@example.com',
        name: 'cici',
        password: passwordHash,
        isActive: true,
      },
    });
    
    console.log(`  ✓ User created: ${cici.email}`);

    // 创建标签
    console.log('\n🏷️  Creating tags...');
    const tags = await Promise.all([
      prisma.tag.create({
        data: { name: '工作', color: '#3b82f6', userId: cici.id },
      }),
      prisma.tag.create({
        data: { name: '个人', color: '#10b981', userId: cici.id },
      }),
      prisma.tag.create({
        data: { name: '重要', color: '#ef4444', userId: cici.id },
      }),
    ]);
    console.log(`  ✓ Created ${tags.length} tags`);

    // 创建备忘录
    console.log('\n📝 Creating memos...');
    const today = new Date();
    
    const memos = await Promise.all([
      // 每周重复的工作会议
      prisma.memo.create({
        data: {
          userId: cici.id,
          title: '周例会',
          description: '团队周会，汇报工作进度',
          location: '会议室 A',
          date: formatDate(today),
          priority: 'HIGH',
          repeatType: 'WEEKLY',
          repeatEndType: 'NEVER',
          tags: { connect: [{ id: tags[0].id }, { id: tags[2].id }] },
        },
      }),
      
      // 每天重复的健身
      prisma.memo.create({
        data: {
          userId: cici.id,
          title: '健身房',
          description: '有氧运动 30 分钟 + 力量训练',
          date: formatDate(today),
          priority: 'MEDIUM',
          repeatType: 'DAILY',
          repeatEndType: 'NEVER',
          completed: true,
          tags: { connect: [{ id: tags[1].id }] },
        },
      }),
      
      // 不重复的购物清单
      prisma.memo.create({
        data: {
          userId: cici.id,
          title: '超市购物',
          description: '牛奶、面包、鸡蛋、水果',
          location: '沃尔玛',
          date: formatDate(addDays(today, 1)),
          priority: 'LOW',
          repeatType: 'NONE',
          repeatEndType: 'NEVER',
          tags: { connect: [{ id: tags[1].id }] },
        },
      }),
      
      // 每月重复的账单
      prisma.memo.create({
        data: {
          userId: cici.id,
          title: '缴纳房租',
          description: '每月房租和水电费',
          date: formatDate(addDays(today, 5)),
          priority: 'HIGH',
          repeatType: 'MONTHLY',
          repeatEndType: 'NEVER',
          tags: { connect: [{ id: tags[2].id }] },
        },
      }),
    ]);
    
    console.log(`  ✓ Created ${memos.length} memos`);

    console.log('\n✅ Seeding completed!\n');
    console.log('Login credentials:');
    console.log('  Email: cici@example.com');
    console.log('  Password: ILoveYou');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 辅助函数
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

seed();
