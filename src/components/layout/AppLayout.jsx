// src/components/layout/AppLayout.jsx
import Header from "../navigation/Header";

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Header />
      {/* main content will be rendered here */}
      {children}
    </div>
  );
};

export default AppLayout;
