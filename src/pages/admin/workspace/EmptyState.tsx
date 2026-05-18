export function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📂</div>
      <h3 className="empty-state-title">Папка пуста</h3>
      <p className="empty-state-description">
        Нажмите <strong>"+ Создать"</strong> или кликните правой кнопкой мыши для добавления элемента
      </p>
    </div>
  );
}
