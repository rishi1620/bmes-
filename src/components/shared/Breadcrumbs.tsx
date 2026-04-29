import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const isAdminRoute = pathnames[0] === "admin";
  
  if (!isAdminRoute) return null;

  const breadcrumbPaths = pathnames.slice(1);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin" className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Admin
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbPaths.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbPaths.map((value, index) => {
          const last = index === breadcrumbPaths.length - 1;
          const to = `/admin/${breadcrumbPaths.slice(0, index + 1).join("/")}`;
          
          const formattedValue = value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

          return (
            <React.Fragment key={to}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{formattedValue}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to}>{formattedValue}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
