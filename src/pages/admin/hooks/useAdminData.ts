import type { AdminEntity } from '../context/AdminContext';

const TYPE_LABELS: Record<string, string> = {
  direction_type: 'Раздел',
  direction: 'Папка',
  course: 'Курс',
  discipline: 'Дисциплина',
  attestation: 'Аттестация',
  attestation_exam: 'Экзамен',
  section: 'Тема',
  helper_article: 'Статья',
  test_set: 'Тест',
};

export function getEntityLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

export function getChildrenForFolder(entities: AdminEntity[], folderId: string | null): AdminEntity[] {
  return entities.filter(e => e.parentId === folderId);
}

export function buildTree(entities: AdminEntity[]): AdminEntity[] {
  const build = (parentId: string | null): AdminEntity[] => {
    return entities
      .filter(e => e.parentId === parentId)
      .map(e => ({ ...e }));
  };
  return build(null);
}

export function findEntity(entities: AdminEntity[], id: string): AdminEntity | null {
  return entities.find(e => e.id === id) || null;
}

export function findParentId(entities: AdminEntity[], id: string): string | null {
  const entity = entities.find(e => e.id === id);
  return entity?.parentId || null;
}

export function getEntityIcon(type: string): string {
  const icons: Record<string, string> = {
    direction_type: '📁',
    direction: '📂',
    course: '🎓',
    discipline: '📚',
    attestation: '📋',
    attestation_exam: '📝',
    section: '📄',
    helper_article: '💡',
    test_set: '✅',
  };
  return icons[type] || '📄';
}

export function isFolderType(type: string): boolean {
  return ['direction_type', 'direction', 'course', 'discipline', 'attestation'].includes(type);
}

export function getQuestionCountForTest(entities: AdminEntity[], testId: string, _allQuestions: any[]): number {
  const test = entities.find(e => e.id === testId && e.type === 'test_set');
  if (!test) return 0;
  const qIds = test.data?.question_ids || [];
  return qIds.length;
}
