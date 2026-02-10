import { Building } from '../models/index.js';

export const mockBuilding = async () => {
  const data = [
    { name: '1号教学楼', description: '主要用于公共课教学' },
    { name: '2号实验楼', description: '包含各类实验室和机房' },
    { name: '图书馆', description: '包含自习室和研讨室' },
    { name: '艺术楼', description: '音乐、美术相关教室' }
  ];

  await Building.bulkCreate(data);
  console.log('Building mock data created');
};
