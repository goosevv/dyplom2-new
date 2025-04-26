import { useParams } from "react-router-dom";

function MovieDetails() {
  const { id } = useParams();
  return <h2 className="text-center mt-5">🎬 Фільм ID: {id}</h2>;
}
export default MovieDetails;
