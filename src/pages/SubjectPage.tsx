import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Subject, type Category, type TestSet, type Question } from '../lib/supabase';

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
];

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryTestSets, setCategoryTestSets] = useState<TestSet[]>([]);
  const [categoryQuestions, setCategoryQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!id) return;
    setSelectedCategory(null);
    const fetchData = async () => {
      const [{ data: allSubjects }, { data: s }, { data: cats }] = await Promise.all([
        supabase.from('subjects').select('*').order('order_index'),
        supabase.from('subjects').select('*').eq('id', id).maybeSingle(),
        supabase.from('categories').select('*').eq('subject_id', id).order('order_index'),
      ]);
      
      const { data: allTestSetsRaw } = await supabase
        .from('test_sets')
        .select('*')
        .eq('subject_id', id);
      
      setAllSubjects((allSubjects as Subject[]) ?? []);
      setSubject(s as Subject);
      setCategories((cats as Category[]) ?? []);
      setTestSets((allTestSetsRaw as TestSet[]) ?? []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const selectCategory = async (cat: Category) => {
    setSelectedCategory(cat);
    const { data: ts } = await supabase.from('test_sets').select('*').eq('subject_id', id);
    const catTs = (ts as TestSet[] || []).filter(t => (t as any).category_id === cat.id);
    setCategoryTestSets(catTs);
    
    const { data: qs } = await supabase.from('questions').select('*').eq('category_id', cat.id);
    setCategoryQuestions((qs as Question[]) ?? []);
  };

  const goBack = () => { setSelectedCategory(null); };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="empty-card-icon">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="empty-card-title">Предмет не найден</h2>
          <p className="empty-card-desc">Возможно он был удален или перемещен</p>
          <Link to="/subjects" className="btn btn-primary" style={{ marginTop: 16 }}>Все предметы</Link>
        </div>
      </div>
    );
  }

  const gradientIndex = allSubjects.findIndex((s: Subject) => s.id === id) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex] || GRADIENTS[0];
  const topCategories = categories.filter((c) => !c.parent_id);

  if (selectedCategory) {
    return (
      <main>
        <div style={{ background: gradient, padding: '48px 0 32px', marginTop: 64 }}>
          <div className="container">
            <button onClick={goBack} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 16, marginBottom: 16 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Назад к категориям
            </button>
            <h1 className="subject-hero-title">{selectedCategory.name}</h1>
            <p className="subject-hero-desc">{selectedCategory.description || `${categoryQuestions.length} вопросов`}</p>
          </div>
        </div>

        <div className="container" style={{ padding: '32px 24px' }}>
          {categoryTestSets.length > 0 ? (
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 20 }}>Тесты в этом разделе</h2>
              <div className="tests-grid">
                {categoryTestSets.map((ts) => (
                  <Link key={ts.id} to={`/test/${ts.id}`} className="test-card">
                    <div className="test-card-inner">
                      <div className="test-card-header">
                        <div>
                          <h3 className="test-card-title">{ts.name}</h3>
                          <p className="test-card-desc">{ts.description || `${categoryQuestions.length} вопросов`}</p>
                        </div>
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <div className="btn btn-primary" style={{ width: '100%' }}>Начать тест</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 8 }}>В этом разделе пока нет тестов</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Скоро появятся!</p>
            </div>
          )}

          {categoryQuestions.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--text-muted)' }}>Доступно вопросов: {categoryQuestions.length}</h3>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div style={{ background: gradient, padding: '64px 0 48px', marginTop: 64 }}>
        <div className="container">
          <Link to="/subjects" className="back-link">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Все предметы
          </Link>
          <h1 className="subject-hero-title">{subject.name}</h1>
          <p className="subject-hero-desc">{subject.description}</p>
          <div className="subject-hero-badges">
            <span className="badge badge-light">{topCategories.length} разделов</span>
            <span className="badge badge-light">{testSets.length} тестов</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 24 }}>Выберите раздел</h2>
          {topCategories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="empty-state-title">Разделы скоро появятся</h3>
              <p className="empty-state-description">В этом предмете пока нет разделов</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {topCategories.map((cat) => (
                <div key={cat.id} onClick={() => selectCategory(cat)} className="card" style={{ padding: 24, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{cat.name}</h3>
                      {cat.description && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{cat.description}</p>}
                    </div>
                  </div>
                  <div style={{ marginTop: 16, color: 'var(--primary)', fontSize: 14, fontWeight: 500 }}>Выбрать →</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}