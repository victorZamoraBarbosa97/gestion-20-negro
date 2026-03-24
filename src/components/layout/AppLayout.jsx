// src/components/layout/AppLayout.jsx
import Header from "../navigation/Header";

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-main transition-colors duration-300 font-sans">
      <Header />
      {children}
    </div>
  );
};

export default AppLayout;
