// src/components/layout/Layout.jsx
import Header from '../navigation/Header';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      <main className="flex-grow overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
