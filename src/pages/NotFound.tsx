import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { userProfile } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-gray-400">404</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Страница не найдена</h1>
        <p className="text-gray-600 mb-8">
          К сожалению, страница по адресу <code className="bg-gray-100 px-2 py-1 rounded text-sm">{location.pathname}</code> не существует.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {userProfile ? (
            <>
              <Link to="/dashboard">
                <Button className="gap-2">
                  <Home className="w-4 h-4" />
                  На главную
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button className="gap-2">
                <Home className="w-4 h-4" />
                На главную
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
