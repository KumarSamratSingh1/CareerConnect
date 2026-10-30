import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import './Footer.css';

/**
 * Professional SaaS Footer with categorized navigation links and copyright.
 */
export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand Info */}
          <div className="footer__brand-col">
            <div className="footer__brand">
              <div className="footer__logo-icon">
                <Briefcase size={16} />
              </div>
              <span>CareerConnect</span>
            </div>
            <p className="footer__desc">
              Premium career and recruitment management platform connecting ambitious candidates, top recruiters, and modern enterprises.
            </p>
          </div>

          {/* For Candidates */}
          <div className="footer__nav-group">
            <h4 className="footer__heading">For Candidates</h4>
            <div className="footer__links">
              <Link to="/jobs" className="footer__link">Browse Jobs</Link>
              <Link to="/candidate/dashboard" className="footer__link">Candidate Dashboard</Link>
              <Link to="/candidate/applications" className="footer__link">Track Applications</Link>
              <Link to="/candidate/interviews" className="footer__link">Interview Schedule</Link>
            </div>
          </div>

          {/* For Employers */}
          <div className="footer__nav-group">
            <h4 className="footer__heading">For Employers</h4>
            <div className="footer__links">
              <Link to="/recruiter/dashboard" className="footer__link">Recruiter Workspace</Link>
              <Link to="/recruiter/jobs" className="footer__link">Post a Job</Link>
              <Link to="/recruiter/applications" className="footer__link">Manage Applicants</Link>
              <Link to="/recruiter/company" className="footer__link">Company Profile</Link>
            </div>
          </div>

          {/* Platform & System */}
          <div className="footer__nav-group">
            <h4 className="footer__heading">Platform</h4>
            <div className="footer__links">
              <Link to="/admin/dashboard" className="footer__link">Admin Center</Link>
              <Link to="/login" className="footer__link">Sign In</Link>
              <Link to="/register" className="footer__link">Create Account</Link>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} CareerConnect Platform. All rights reserved.</p>
          <p>Built with React & Spring Boot</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
