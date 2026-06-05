// Tiny page footer. Year is computed at render time from the browser's clock
// so it stays correct without anyone having to update the code each January.

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="text-center text-muted small py-4">
      StockGrader &copy; {year}
    </footer>
  );
}

export default Footer;
