function Empty({ name = 'No Data', message = 'There is no Data to show' }) {
  return (
    <div className="empty">
      <h1>{name}</h1>
      <p>{message}</p>
    </div>
  );
}

export default Empty;
