-- ============================================================================
-- Demo Data for Full LMS Tree Structure
-- Created: 2026-05-18
-- ============================================================================

-- Школа: Математика ЕНТ с темами
INSERT INTO directions (direction_type, name, description, icon, color, order_index) VALUES
  ('school', 'Математика', 'Математика ЕНТ - алгебра, геометрия, тригонометрия', 'math', '#f59e0b', 1)
ON CONFLICT DO NOTHING;

-- Получаем ID направления Математика
DO $$
DECLARE
  v_math_dir_id uuid;
  v_phys_dir_id uuid;
  v_it_dir_id uuid;
  v_course1_id uuid;
  v_disc_math_id uuid;
  v_att1_id uuid;
  v_att2_id uuid;
  v_att3_id uuid;
  v_exam1_id uuid;
  v_exam2_id uuid;
  v_topic1_id uuid;
  v_topic2_id uuid;
BEGIN
  -- Направления
  SELECT id INTO v_math_dir_id FROM directions WHERE name = 'Математика' AND direction_type = 'school' LIMIT 1;
  SELECT id INTO v_phys_dir_id FROM directions WHERE name = 'Физика' AND direction_type = 'school' LIMIT 1;
  SELECT id INTO v_it_dir_id FROM directions WHERE name = 'Информационные технологии' AND direction_type = 'university' LIMIT 1;

  -- Темы для Математики ЕНТ
  IF v_math_dir_id IS NOT NULL THEN
    INSERT INTO sections (direction_id, name, description, content, lecture_content, order_index) VALUES
      (v_math_dir_id, 'Алгебра', 'Основы алгебры: уравнения, неравенства, функции', 'Раздел посвящён основам алгебры', 'Алгебра - это раздел математики, изучающий операции и отношения.

Основные темы:
1. Линейные уравнения
2. Квадратные уравнения
3. Системы уравнений
4. Неравенства
5. Функции и их графики

Линейное уравнение: ax + b = 0
Решение: x = -b/a

Квадратное уравнение: ax² + bx + c = 0
Дискриминант: D = b² - 4ac
Если D > 0: два корня
Если D = 0: один корень
Если D < 0: нет действительных корней', 1),
      (v_math_dir_id, 'Геометрия', 'Планиметрия и стереометрия', 'Раздел посвящён геометрии', 'Геометрия изучает фигуры и их свойства.

Основные темы:
1. Треугольники
2. Четырёхугольники
3. Окружность
4. Площади фигур
5. Объёмы тел

Площадь треугольника: S = ½ × a × h
Площадь круга: S = πr²
Объём куба: V = a³', 2),
      (v_math_dir_id, 'Тригонометрия', 'Тригонометрические функции и формулы', 'Раздел посвящён тригонометрии', 'Тригонометрия изучает соотношения между сторонами и углами треугольника.

Основные формулы:
sin²α + cos²α = 1
tgα = sinα / cosα
ctgα = cosα / sinα

Значения:
sin 30° = ½
cos 60° = ½
tg 45° = 1', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Курс 1 для IT
  IF v_it_dir_id IS NOT NULL THEN
    INSERT INTO courses (direction_id, name, short_name, order_index) VALUES
      (v_it_dir_id, '1 курс', 'Первый курс', 1)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_course1_id FROM courses WHERE name = '1 курс' AND direction_id = v_it_dir_id LIMIT 1;

    IF v_course1_id IS NOT NULL THEN
      -- Дисциплина
      INSERT INTO disciplines (course_id, name, description, order_index) VALUES
        (v_course1_id, 'Программирование', 'Основы программирования на Python', 1)
      ON CONFLICT DO NOTHING;

      SELECT id INTO v_disc_math_id FROM disciplines WHERE name = 'Программирование' AND course_id = v_course1_id LIMIT 1;

      IF v_disc_math_id IS NOT NULL THEN
        -- Аттестации
        INSERT INTO attestations (discipline_id, name, attestation_type, order_index) VALUES
          (v_disc_math_id, 'Аттестация 1', 'attestation1', 1),
          (v_disc_math_id, 'Аттестация 2', 'attestation2', 2),
          (v_disc_math_id, 'Сессия', 'session', 3)
        ON CONFLICT DO NOTHING;

        SELECT id INTO v_att1_id FROM attestations WHERE name = 'Аттестация 1' AND discipline_id = v_disc_math_id LIMIT 1;
        SELECT id INTO v_att2_id FROM attestations WHERE name = 'Аттестация 2' AND discipline_id = v_disc_math_id LIMIT 1;
        SELECT id INTO v_att3_id FROM attestations WHERE name = 'Сессия' AND discipline_id = v_disc_math_id LIMIT 1;

        -- Экзамены для Аттестации 1
        IF v_att1_id IS NOT NULL THEN
          INSERT INTO attestation_exams (attestation_id, name, exam_type, description, has_lectures, order_index) VALUES
            (v_att1_id, 'Промежуточный экзамен 1', 'intermediate', 'Экзамен по первым темам', true, 1),
            (v_att1_id, 'Midterm', 'midterm', 'Промежуточный контроль', true, 2)
          ON CONFLICT DO NOTHING;
        END IF;

        -- Экзамены для Аттестации 2
        IF v_att2_id IS NOT NULL THEN
          INSERT INTO attestation_exams (attestation_id, name, exam_type, description, has_lectures, order_index) VALUES
            (v_att2_id, 'Промежуточный экзамен 2', 'intermediate', 'Экзамен по вторым темам', true, 1),
            (v_att2_id, 'Endterm', 'endterm', 'Итоговый контроль', true, 2)
          ON CONFLICT DO NOTHING;
        END IF;

        -- Экзамены для Сессии
        IF v_att3_id IS NOT NULL THEN
          INSERT INTO attestation_exams (attestation_id, name, exam_type, description, has_lectures, order_index) VALUES
            (v_att3_id, 'Итоговый экзамен', 'test', 'Экзамен за весь курс', false, 1)
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END IF;
  END IF;
END $$;
