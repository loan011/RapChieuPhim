function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <div className="poster">
        <span className="age">{movie.age}</span>
        <img src={movie.img} alt={movie.title} />
        <div className="rating">⭐ 8.7/10 &nbsp; 377.8K Votes</div>
      </div>

      <h3>{movie.title}</h3>
      <p>Action/Drama/Romantic</p>
    </div>
  );
}

export default MovieCard;