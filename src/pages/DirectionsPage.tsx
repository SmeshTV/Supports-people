import { useEffect, useState, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type DirectionType } from '../lib/supabase';

const ICONS: Record<string, JSX.Element> = {
  school: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M4 10h16M10 4v16"/></svg>,
  university: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6"/></svg>,
  helper: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
};

export default function DirectionsPage() {
  const [directionTypes, setDirectionTypes] = useState<DirectionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('direction_types')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      setDirectionTypes((data as DirectionType[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <main className="page-container">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Выберите направление</h1>
            <p className="page-subtitle">Школа или Университет</p>
          </div>
        </div>

        {loading ? (
          <div className="subjects-grid">
            {[1, 2].map((i) => (
              <div key={i} className="subject-skeleton skeleton" />
            ))}
          </div>
        ) : directionTypes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="empty-state-title">Направления скоро появятся</h3>
            <p className="empty-state-description">Создайте направления в админ панели</p>
          </div>
        ) : (
          <div className="direction-types-grid">
            {directionTypes.map((dt) => {
              const icon = ICONS[dt.type] || ICONS['school'];
              return (
                <Link 
                  key={dt.id} 
                  to={`/directions/${dt.type}`} 
                  className="direction-type-card"
                  style={{ borderColor: dt.color }}
                >
                  <div 
                    className="direction-type-icon" 
                    style={{ background: `${dt.color}20`, color: dt.color }}
                  >
                    {icon}
                  </div>
                  <h2 className="direction-type-name">{dt.name_ru}</h2>
                  <p className="direction-type-desc">{dt.description}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
