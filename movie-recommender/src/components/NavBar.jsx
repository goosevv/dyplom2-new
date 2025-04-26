import { Link } from "react-router-dom"

export default function NavBar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">MovieReco</Link>
      <nav>
        <Link to="/recommendations">Рекомендації</Link>
        <Link to="/favorites">По Favorites</Link>
        <Link to="/lists">Списки</Link>
        <Link to="/profile">Профіль</Link>
      </nav>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Знайдіть фільм..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <button onClick={handleSearch}>Пошук</button>
      </div>
    </header>
  )
}
