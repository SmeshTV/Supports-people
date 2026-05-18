import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type Semester, type Discipline } from '../lib/supabase';

export default function DisciplinesPage() {
  const { semesterId } = useParams<{ semesterId: string }>();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!semesterId) return;
      
      const [{ data: sem }, { data: discs }] = await Promise.all([
        supabase.from('semesters').select('*').eq('id', semesterId).maybeSingle(),
        supabase.from('disciplines').select('*').eq('semester_id', semesterId).eq('is_published', true).order('order_index')
      ]);
      
      setSemester((sem as Semester) || null);
      setDisciplines((discs as Discipline[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [semesterId]);

  const filteredDisciplines = disciplines.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="skeleton" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/courses" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">{semester?.name || 'Дисциплины'}</h1>
              <p className="page-subtitle">Выберите предмет для изучения</p>
            </div>
          </div>
        </div>

        <div className="search-box">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск дисциплин..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredDisciplines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет дисциплин</h3>
            <p className="empty-state-description">Добавьте предметы в админ панели</p>
          </div>
        ) : (
          <div className="disciplines-grid">
            {filteredDisciplines.map((disc) => (
              <div key={disc.id} className="discipline-card-wrapper">
                <Link to={`/sections/${disc.id}`} className="discipline-card">
                  <div className="discipline-card-inner">
                    <div className="discipline-icon">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="discipline-name">{disc.name}</h3>
                    <p className="discipline-desc">{disc.description || 'Дисциплина'}</p>
                  </div>
                </Link>
                <Link to={`/exams/${disc.id}`} className="discipline-exams-btn">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Экзамены
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}