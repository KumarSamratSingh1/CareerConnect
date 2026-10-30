import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context';
import { Navbar, Footer } from '../components/layout';
import { Button, Card, Badge } from '../components/ui';

export const UnauthorizedPage = ({ requiredRole }) => {
  const { user, logout } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'RECRUITER') return '/recruiter/dashboard';
    return '/candidate/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          <Card>
            <Card.Body>
              <div className="w-16 h-16 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={36} />
              </div>

              <div className="inline-flex items-center gap-2 mb-2">
                <Badge variant="danger">403 Access Forbidden</Badge>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Unauthorized Role Access
              </h1>

              <p className="text-secondary text-sm mb-4 max-w-md mx-auto leading-relaxed">
                You are currently signed in as <strong>{user?.email || 'Authenticated User'}</strong> with the role{' '}
                <Badge variant="primary">{user?.role || 'User'}</Badge>.
                {requiredRole && (
                  <span> This portal area requires <strong>{requiredRole}</strong> role permissions.</span>
                )}
              </p>

              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Link to={getDashboardLink()}>
                  <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                    Return to My Dashboard
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={logout}
                  leftIcon={<LogOut size={16} />}
                >
                  Sign In as Different Account
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UnauthorizedPage;
