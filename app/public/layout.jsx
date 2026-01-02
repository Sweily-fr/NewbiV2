// Layout pour les pages publiques (sans authentification requise)
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
