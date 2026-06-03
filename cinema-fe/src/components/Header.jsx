function Header() {
  return (
    <header className="header">
      <div className="logo">Book🎟Show</div>

      <div className="search">
        🔍 <input placeholder="Search For Movies" />
      </div>

      <div className="header-right">
        <span>Salem⌄</span>
        <button>Sign Up</button>
        <span className="menu">☰</span>
      </div>
    </header>
  );
}

export default Header;