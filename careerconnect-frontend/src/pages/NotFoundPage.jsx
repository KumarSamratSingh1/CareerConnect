import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Navbar, Footer } from '../components/layout';
import { Button, Card } from '../components/ui';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-lg text-center">
          <Card>
            <Card.Body>
              <div className="w-16 h-16 rounded-full bg-primary-50 text-brand flex items-center justify-center mx-auto mb-4">
                <HelpCircle size={36} />
              </div>

              <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Page Not Found</h2>
              <p className="text-secondary text-sm mb-6 max-w-sm mx-auto">
                The page you are looking for doesn't exist, has been moved, or is currently unavailable.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Go Back
                </Button>
                <Link to="/">
                  <Button variant="primary" leftIcon={<Home size={16} />}>
                    Return Home
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
