import { useAdminData } from '../context/AdminContext';

export function getDefaultFormData(type: string, parentId: string | null = null, parentType: string | null = null) {
  switch (type) {
    case 'direction':
      return {
        name: '',
        description: '',
        direction_type: 'school',
        icon: 'book',
        color: '#6366f1',
        is_published: true,
        order_index: 0,
        parent_id: parentType === 'direction_type' ? parentId : null,
      };
    case 'course':
      return {
        name: '',
        short_name: '',
        direction_id: parentType === 'direction' ? parentId : null,
        parent_id: parentType === 'direction' ? parentId : null,
        order_index: 1,
        is_published: true,
      };
    case 'discipline':
      return {
        name: '',
        description: '',
        course_id: parentType === 'course' ? parentId : null,
        direction_id: parentType === 'direction' ? parentId : null,
        parent_id: (parentType === 'course' || parentType === 'direction') ? parentId : null,
        order_index: 0,
        is_published: true,
      };
    case 'attestation':
      return {
        name: '',
        discipline_id: parentType === 'discipline' ? parentId : null,
        parent_id: parentType === 'discipline' ? parentId : null,
        attestation_type: 'attestation1',
        order_index: 0,
        is_active: true,
      };
    case 'attestation_exam':
      return {
        name: '',
        attestation_id: parentType === 'attestation' ? parentId : null,
        parent_id: parentType === 'attestation' ? parentId : null,
        exam_type: 'intermediate',
        description: '',
        has_lectures: false,
        test_set_id: null,
        order_index: 0,
        is_published: true,
      };
    case 'section':
      return {
        name: '',
        description: '',
        content: '',
        lecture_content: '',
        direction_id: parentType === 'direction' ? parentId : null,
        discipline_id: parentType === 'discipline' ? parentId : null,
        parent_id: (parentType === 'section' || parentType === 'attestation' || parentType === 'attestation_exam' || parentType === 'course') ? parentId : null,
        order_index: 0,
        is_published: true,
        test_set_id: null,
        image_url: null,
      };
    case 'helper_article':
      return {
        title: '',
        content: '',
        category: 'general',
        tags: [],
        parent_id: parentId,
        order_index: 0,
        is_published: true,
      };
    case 'test_set':
      return {
        name: '',
        description: '',
        source_description: '',
        direction_id: parentType === 'direction' ? parentId : null,
        discipline_id: parentType === 'discipline' ? parentId : null,
        course_id: parentType === 'course' ? parentId : null,
        section_id: parentType === 'section' ? parentId : null,
        parent_id: (parentType === 'attestation' || parentType === 'attestation_exam') ? parentId : null,
        is_published: true,
        settings: {
          mode: 'practice',
          passing_score_pct: 70,
          show_explanations: 'immediate',
          shuffle_questions: true,
          shuffle_options: true,
          allow_retakes: true,
          time_limit_sec: null,
          question_count: null,
          difficulty_filter: null,
          max_retakes: null,
        },
        question_ids: [],
      };
    default:
      return {};
  }
}

export function useCreateItem() {
  const { createEntity } = useAdminData();

  return async (type: string, parentId: string | null, formData: any) => {
    return createEntity(type, parentId, formData);
  };
}
