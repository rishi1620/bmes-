import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const isAdminRoute = pathnames[0] === "admin";
  
  if (!isAdminRoute) return null;

  const breadcrumbPaths = pathnames.slice(1);

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link to="/admin" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-4 w-4 mr-1" />
        Admin
      </Link>
      {breadcrumbPaths.map((value, index) => {
        const last = index === breadcrumbPaths.length - 1;
        const to = `/admin/${breadcrumbPaths.slice(0, index + 1).join("/")}`;
        
        const formattedValue = value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            {last ? (
              <span className="font-medium text-foreground">{formattedValue}</span>
            ) : (
              <Link to={to} className="hover:text-foreground transition-colors">{formattedValue}</Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
