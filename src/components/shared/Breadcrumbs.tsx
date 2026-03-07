import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link to="/admin" className="hover:text-foreground">Admin</Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        return (
          <div key={to} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {last ? (
              <span className="font-medium text-foreground capitalize">{value}</span>
            ) : (
              <Link to={to} className="hover:text-foreground capitalize">{value}</Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
