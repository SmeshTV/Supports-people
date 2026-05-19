import { useEffect, useState, type JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, type DirectionType, type Direction } from '../lib/supabase';

const ICONS: Record<string, JSX.Element> = {
  math: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M4 10h16M10 4v16"/></svg>,
  physics: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>,
  chemistry: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v6l-6 8c0 2 2 3 6 3h12c4 0 6-1 6-3l-6-8V2"/><path d="M8 2h8"/></svg>,
  biology: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>,
  history: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  info: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  language: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg>,
  book: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
};

export default function DirectionPage() {
  const { type } = useParams<{ type: string }>();
  const [directionType, setDirectionType] = useState<DirectionType | null>(null);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!type) return;
      
      const [{ data: dt }, { data: dirs }] = await Promise.all([
        supabase.from('direction_types').select('*').eq('type', type).maybeSingle(),
        supabase.from('directions').select('*').eq('direction_type', type).eq('is_published', true).order('order_index')
      ]);
      
      setDirectionType((dt as DirectionType) || null);
      setDirections((dirs as Direction[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [type]);

  const filteredDirections = directions.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDirectionIcon = (dir: Direction) => {
    const name = dir.name.toLowerCase();
    if (name.includes('математик')) return ICONS.math;
    if (name.includes('физик')) return ICONS.physics;
    if (name.includes('хим')) return ICONS.chemistry;
    if (name.includes('биолог')) return ICONS.biology;
    if (name.includes('истор')) return ICONS.history;
    if (name.includes('информат') || name.includes('программ') || name.includes('it')) return ICONS.info;
    if (name.includes('язык') || name.includes('казах') || name.includes('русск') || name.includes('английск') || name.includes('грамотн')) return ICONS.language;
    return ICONS.book;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="subjects-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="subject-skeleton skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!directionType) {
    return (
      <main className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Направление не найдено</h3>
            <Link to="/directions" className="btn btn-primary">Назад к выбору</Link>
          </div>
        </div>
      </main>
    );
  }

  const isSchool = type === 'school';
  const isHelper = type === 'helper';

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/directions" className="btn btn-ghost btn-sm">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <div>
              <h1 className="page-title">{directionType.name_ru}</h1>
              <p className="page-subtitle">{directionType.description}</p>
            </div>
          </div>
        </div>

        {isSchool && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <Link to={`/school/ent`} className="btn btn-primary">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Предметы ЕНТ
            </Link>
          </div>
        )}

        {isHelper && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <Link to={`/helper-subjects`} className="btn btn-primary">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Все материалы
            </Link>
          </div>
        )}

        {!isSchool && !isHelper && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <Link to={`/university/courses`} className="btn btn-primary">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Курсы университета
            </Link>
          </div>
        )}

        <div className="search-box">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={isSchool ? "Поиск предметов ЕНТ..." : "Поиск направлений..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredDirections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="empty-state-title">Нет направлений</h3>
            <p className="empty-state-description">Добавьте направления в админ панели</p>
          </div>
        ) : (
          <div className="subjects-grid">
            {filteredDirections.map((dir) => {
              const icon = getDirectionIcon(dir);
              const gradient = `linear-gradient(135deg, ${dir.color || '#6366f1'}20 0%, ${dir.color || '#6366f1'}10 100%)`;
              
              return (
                <Link 
                  key={dir.id} 
                  to={isSchool ? `/school/ent/${dir.id}` : isHelper ? `/folder/${dir.id}` : `/university/courses`} 
                  className="subject-card"
                >
                  <div className="subject-card-inner">
                    <div className="subject-card-header" style={{ background: gradient }}>
                      <div className="subject-card-icon" style={{ color: dir.color || '#6366f1' }}>{icon}</div>
                    </div>
                    <div className="subject-card-body">
                      <h3 className="subject-card-title">{dir.name}</h3>
                      <p className="subject-card-desc">{dir.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
