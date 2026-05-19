import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Discipline, type Attestation, type TestSet, type Section } from '../lib/supabase';

const ATTESTATION_ICONS: Record<string, string> = {
  attestation1: '📋',
  attestation2: '📝',
  session: '🎓',
};

const ATTESTATION_NAMES: Record<string, string> = {
  attestation1: 'Аттестация 1',
  attestation2: 'Аттестация 2',
  session: 'Сессия',
};

export default function UniversityAttestationsPage() {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!disciplineId) return;
      
      const [{ data: disc }, { data: atts }, { data: tests }, { data: sects }] = await Promise.all([
        supabase.from('disciplines').select('*').eq('id', disciplineId).maybeSingle(),
        supabase.from('attestations').select('*').eq('discipline_id', disciplineId).eq('is_active', true).order('order_index'),
        supabase.from('test_sets').select('*').eq('discipline_id', disciplineId).eq('is_published', true).order('created_at'),
        supabase.from('sections').select('*').eq('discipline_id', disciplineId).eq('is_published', true).order('order_index'),
      ]);
      
      setDiscipline((disc as Discipline) || null);
      setAttestations((atts as Attestation[]) || []);
      setTestSets((tests as TestSet[]) || []);
      setSections((sects as Section[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [disciplineId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  if (!discipline) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Дисциплина не найдена</h3>
            <Link to="/university/courses" className="btn btn-primary">Назад</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/university/courses" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">{discipline.name}</h1>
              <p className="page-subtitle">{discipline.description || 'Выберите аттестацию'}</p>
            </div>
          </div>
        </div>

        {attestations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет аттестаций</h3>
            <p className="empty-state-description">Аттестации будут добавлены позже</p>
          </div>
        ) : (
          <div className="attestations-grid">
            {attestations.map((att) => (
              <Link key={att.id} to={`/university/exam/${att.id}`} className="attestation-card">
                <div className="attestation-card-inner">
                  <div className="attestation-icon">
                    {ATTESTATION_ICONS[att.attestation_type] || '📄'}
                  </div>
                  <div className="attestation-info">
                    <h3 className="attestation-name">{att.name || ATTESTATION_NAMES[att.attestation_type]}</h3>
                    <p className="attestation-desc">
                      {att.attestation_type === 'attestation1' && 'Промежуточный экзамен 1 + Midterm'}
                      {att.attestation_type === 'attestation2' && 'Промежуточный экзамен 2 + Endterm'}
                      {att.attestation_type === 'session' && 'Итоговые тесты'}
                    </p>
                  </div>
                </div>
              </Link>
              ))}
          </div>
        )}

        {testSets.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Тесты дисциплины</h2>
            <div className="tests-grid">
              {testSets.map((ts) => (
                <Link key={ts.id} to={`/test/${ts.id}`} className="test-card">
                  <div className="test-card-inner">
                    <div className="test-card-header">
                      <div>
                        <h3 className="test-card-title">{ts.name}</h3>
                        <p className="test-card-desc">{ts.description || 'Тест без описания'}</p>
                      </div>
                      <span className={`badge ${ts.settings?.mode === 'exam' ? 'badge-warning' : 'badge-success'}`}>
                        {ts.settings?.mode === 'exam' ? 'Экзамен' : 'Практика'}
                      </span>
                    </div>
                    <div className="test-card-meta">
                      <span>{ts.question_ids?.length || 0} вопросов</span>
                      <span>Проходной: {ts.settings?.passing_score_pct || 70}%</span>
                    </div>
                    <div className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Начать тест</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {sections.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Темы дисциплины</h2>
            <div className="tests-grid">
              {sections.map((s) => (
                <Link key={s.id} to={`/section/${s.id}`} className="test-card">
                  <div className="test-card-inner">
                    <div className="test-card-header">
                      <div>
                        <h3 className="test-card-title">{s.name}</h3>
                        <p className="test-card-desc">{s.description || 'Тема без описания'}</p>
                      </div>
                    </div>
                    <div className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>Открыть тему</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
